"""
hd_SubdomainAuth.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import jsonify, request
from flask_login import login_required
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from pymodules.hd_HDOSWebServerInit import homedock_www
from pymodules.hd_AppSubdomains import lookup_slug, slugify_container_name
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_cert_domains_and_type, cert_covers_subdomains_of

TOKEN_QUERY_PARAM = "__hd_token"
TOKEN_COOKIE_NAME = "homedock_app_auth"

# HDOS00022
HANDOFF_MAX_AGE = 60
SESSION_MAX_AGE = 24 * 60 * 60

_SALT = "homedock-app-subdomain"


def _serializer():

    secret = homedock_www.config.get("SECRET_KEY")

    if not secret:
        return None

    return URLSafeTimedSerializer(secret, salt=_SALT)


def mint_app_token(slug):
    serializer = _serializer()

    if serializer is None:
        return None

    return serializer.dumps({"slug": slug})


def verify_app_token(token, slug, max_age):
    if not token or not slug:
        return False

    serializer = _serializer()

    if serializer is None:
        return False

    try:
        payload = serializer.loads(token, max_age=max_age)
    except (BadSignature, SignatureExpired, Exception):
        return False

    if not isinstance(payload, dict):
        return False

    return payload.get("slug") == slug


# HDOS00062
@login_required
def api_subdomain_diagnostics():
    """Why an app subdomain refused to load, which the browser probe cannot tell apart.

    A no-cors fetch rejects the same way for a name that does not resolve and for a
    certificate the browser will not accept, so the window used to blame missing
    wildcard DNS for both. The certificate is something we can answer for.
    """

    host = request.host.split(":")[0].strip().lower().rstrip(".")

    # HDOS00076
    if not request.is_secure or not ssl_enabled():
        return jsonify({"ssl": False, "covers_apps": False, "self_signed": False, "host": host, "alternative": None}), 200

    info = get_cert_domains_and_type()

    return (
        jsonify(
            {
                "ssl": True,
                "covers_apps": cert_covers_subdomains_of(host),
                "self_signed": bool(info.get("is_self_signed")),
                "host": host,
                "alternative": _covered_alternative(info.get("domains", []), host),
            }
        ),
        200,
    )


def _covered_alternative(domains, host):

    configured = (read_config().get("dynamic_dns") or "").strip().lower().rstrip(".")

    covered = {domain[2:].strip().lower() for domain in domains if domain.startswith("*.")} - {host}

    return configured if configured in covered else None


@login_required
def api_app_token():

    data = request.get_json(silent=True) or {}

    requested = data.get("slug") or data.get("container")
    if not isinstance(requested, str):
        return jsonify({"error": "Missing app identifier."}), 400

    slug = slugify_container_name(requested)

    if not slug or lookup_slug(slug) is None:
        return jsonify({"error": "Unknown application."}), 404

    token = mint_app_token(slug)

    if token is None:
        return jsonify({"error": "Server not ready to issue app tokens."}), 503

    return jsonify({"slug": slug, "token": token, "param": TOKEN_QUERY_PARAM, "expires_in": HANDOFF_MAX_AGE})
