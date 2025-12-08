"""
hd_HTTPRedirector.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import ipaddress
import socket

from flask import Flask, request, redirect, abort
from hypercorn.config import Config
from hypercorn.middleware import AsyncioWSGIMiddleware

from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_FunctionsHostSelector import docker_host, is_docker
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_cert_domains_and_type


def start_http_redirect_server():
    redirect_app = Flask("redirect_http_to_https")

    @redirect_app.route("/", defaults={"path": ""})
    @redirect_app.route("/<path:path>")
    def redirect_to_https(path):
        requested_host = request.host.split(":")[0]

        if requested_host in {local_ip, internet_ip, "localhost", "127.0.0.1", "::1", docker_host}:
            return redirect(f"https://{requested_host}/{path}", code=301)

        try:
            ip_obj = ipaddress.ip_address(requested_host)
            if ip_obj.is_loopback:
                return redirect(f"https://{requested_host}/{path}", code=301)

            if is_docker and ip_obj.is_private:
                return redirect(f"https://{requested_host}/{path}", code=301)
        except:
            pass

        server_hostname = socket.gethostname()

        if requested_host == server_hostname:
            return redirect(f"https://{requested_host}/{path}", code=301)

        if ssl_enabled():
            cert_info = get_cert_domains_and_type()
            if cert_info and cert_info.get("domains"):
                if requested_host in cert_info["domains"]:
                    return redirect(f"https://{requested_host}/{path}", code=301)

                for domain in cert_info["domains"]:
                    if domain.startswith("*."):
                        base_domain = domain[2:]
                        if requested_host.endswith("." + base_domain):
                            return redirect(f"https://{requested_host}/{path}", code=301)

        abort(400)

    config = Config()
    config.bind = ["0.0.0.0:80"]
    config.loglevel = "ERROR"
    config.include_server_header = False

    app_asgi = AsyncioWSGIMiddleware(redirect_app)
    return app_asgi, config
