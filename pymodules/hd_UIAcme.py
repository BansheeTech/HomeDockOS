"""
hd_UIAcme.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import threading
import configparser

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsConfig import read_config, write_config
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_cert_domains_and_type, cert_covers_subdomains_of, restart_pending, ssl_context_active
from pymodules.hd_ACMEProviders import provider_names, provider_labels, provider_syncs_ip
from pymodules.hd_CertManager import issue_certificate, claim, release, get_state, days_until_expiry, is_reserved_domain, renewal_status
from pymodules.hd_ThreadDynamicDNS import get_dynamic_dns_state

# HDOS00066
_config_path = os.path.join(current_directory, "homedock_server.conf")


def _persist(domain, provider, token):
    config = configparser.ConfigParser()
    config.read(_config_path)

    if not config.has_section("Config"):
        return

    config.set("Config", "acme_provider", provider)
    config.set("Config", "acme_token", token)

    if domain:
        config.set("Config", "dynamic_dns", domain)

    write_config(config, _config_path)


# HDOS00083
def stored_token_for(config, provider):
    if (config.get("acme_provider") or "").strip().lower() != (provider or "").strip().lower():
        return ""

    return config.get("acme_token", "") or ""


def _certificate_snapshot(host, domain):
    context_active = ssl_context_active()

    if not ssl_enabled():
        return {"ssl": False, "self_signed": False, "covers_apps": False, "covers_domain": False, "restart_pending": False, "context_active": context_active, "domains": [], "expires_in_days": None}

    info = get_cert_domains_and_type()

    return {
        "ssl": True,
        "self_signed": bool(info.get("is_self_signed")),
        "covers_apps": cert_covers_subdomains_of(host),
        "covers_domain": cert_covers_subdomains_of(domain) if domain else False,
        "restart_pending": restart_pending(),
        "context_active": context_active,
        "domains": sorted(info.get("domains", [])),
        "expires_in_days": days_until_expiry(),
    }


@login_required
def api_acme_status():
    config = read_config()
    host = request.host.split(":")[0].strip().lower().rstrip(".")
    domain = (config.get("dynamic_dns") or "").strip().lower().rstrip(".")

    return (
        jsonify(
            {
                "providers": provider_names(),
                "provider_labels": provider_labels(),
                "provider": config.get("acme_provider", ""),
                "token_set": bool(config.get("acme_token", "")),
                "domain": config.get("dynamic_dns", ""),
                "host": host,
                "certificate": _certificate_snapshot(host, domain),
                "state": get_state(),
                # HDOS00109
                "ip_sync": {
                    "available": renewal_status()["managed"] and provider_syncs_ip(config.get("acme_provider", "")),
                    "enabled": bool(config.get("dynamic_dns_sync")),
                    **get_dynamic_dns_state(),
                },
            }
        ),
        200,
    )


@login_required
def api_acme_issue():
    data = request.get_json(silent=True) or {}

    provider = str(data.get("provider", "")).strip().lower()
    if provider not in provider_names():
        return jsonify({"status": "bad_request", "message": "Unknown DNS provider."}), 400

    config = read_config()

    domain = str(data.get("domain") or config.get("dynamic_dns") or "").strip().lower().rstrip(".")
    if not domain or "." not in domain:
        return jsonify({"status": "bad_request", "message": "A valid domain name is required."}), 400

    if is_reserved_domain(domain):
        return jsonify({"status": "bad_request", "message": f"{domain} belongs to HomeDock OS. Set your own domain as the hostname first."}), 400

    token = str(data.get("token") or "").strip() or stored_token_for(config, provider)
    if not token:
        return jsonify({"status": "bad_request", "message": "A DNS provider token is required."}), 400

    staging = bool(data.get("staging"))

    # HDOS00082
    if not claim(staging):
        return jsonify({"status": "busy", "message": "A certificate request is already running."}), 409

    try:
        _persist(domain, provider, token)
    except OSError as error:
        release(f"Could not save the configuration: {error}")
        return jsonify({"status": "error", "message": f"Could not save the configuration: {error}"}), 500

    def worker():
        try:
            issue_certificate(domain, provider, token, staging=staging, claimed=True)
        except Exception as error:
            print(f" ! ACME: {error}")

    try:
        threading.Thread(target=worker, daemon=True, name="hdos-acme").start()
    except RuntimeError as error:
        release(f"Could not start the certificate request: {error}")
        return jsonify({"status": "error", "message": "Could not start the certificate request."}), 500

    return jsonify({"status": "started", "domain": domain, "staging": staging}), 202
