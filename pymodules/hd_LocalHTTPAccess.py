"""
hd_LocalHTTPAccess.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import ipaddress

from flask import request, redirect

from pymodules.hd_TrustedProxy import is_trusted_peer


# HDOS00074
def is_local_only_name(host):
    bare = (host or "").split(":")[0].strip().lower().rstrip(".")

    if not bare:
        return False

    if bare == "localhost" or bare.endswith(".local") or bare.endswith(".localhost"):
        return True

    try:
        peer = ipaddress.ip_address(bare)
    except ValueError:
        return False

    return peer.is_loopback or peer.is_private or peer.is_link_local


def setup_local_http_access(app, enabled, reverse_proxy_enabled):

    @app.before_request
    def push_to_https():
        if request.scheme != "http":
            return None

        if not enabled or reverse_proxy_enabled:
            return redirect(f"https://{request.host}{request.full_path.rstrip('?')}", code=301)

        if not is_trusted_peer(request.remote_addr):
            return redirect(f"https://{request.host}{request.full_path.rstrip('?')}", code=301)

        if not is_local_only_name(request.host):
            return redirect(f"https://{request.host}{request.full_path.rstrip('?')}", code=301)

        return None
