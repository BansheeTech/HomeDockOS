"""
hd_LoopbackRedirect.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import request, redirect

from pymodules.hd_AppSubdomains import LOOPBACK_HOSTNAME
from pymodules.hd_SubdomainRouter import subdomain_routing_available

REDIRECTED_HOST = "localhost"


def setup_loopback_redirect(app):

    @app.before_request
    def redirect_bare_loopback():
        if not subdomain_routing_available():
            return None

        if request.method not in ("GET", "HEAD"):
            return None

        hostname, _, port = request.host.partition(":")

        if hostname.lower() != REDIRECTED_HOST:
            return None

        if request.path.startswith("/api/"):
            return None

        if "text/html" not in request.headers.get("Accept", ""):
            return None

        target = f"{request.scheme}://{LOOPBACK_HOSTNAME}"
        if port:
            target += f":{port}"

        target += request.path

        if request.query_string:
            target += "?" + request.query_string.decode("latin-1")

        return redirect(target, code=302)
