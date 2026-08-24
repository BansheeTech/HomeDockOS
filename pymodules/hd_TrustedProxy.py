"""
hd_TrustedProxy.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import ipaddress

from werkzeug.middleware.proxy_fix import ProxyFix


# HDOS00061
def is_trusted_peer(remote_addr):

    if not remote_addr:
        return False

    try:
        peer = ipaddress.ip_address(remote_addr.strip())
    except ValueError:
        return False

    mapped = getattr(peer, "ipv4_mapped", None)
    if mapped is not None:
        peer = mapped

    return peer.is_loopback or peer.is_private or peer.is_link_local


class TrustedProxyFix:

    def __init__(self, app):
        self.app = app
        self._proxied = ProxyFix(app, x_for=1, x_proto=1, x_host=1, x_port=0, x_prefix=0)

    def __call__(self, environ, start_response):
        if is_trusted_peer(environ.get("REMOTE_ADDR")):
            return self._proxied(environ, start_response)

        return self.app(environ, start_response)
