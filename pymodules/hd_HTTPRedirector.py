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

from pymodules.hd_FunctionsNetwork import local_ip, internet_ip, get_local_ip, get_internet_ip
from pymodules.hd_FunctionsHostSelector import docker_host, is_docker


def start_http_redirect_server():
    redirect_app = Flask("redirect_http_to_https")

    @redirect_app.route("/", defaults={"path": ""})
    @redirect_app.route("/<path:path>")
    def redirect_to_https(path):
        requested_host = request.host.split(":")[0]

        valid_hosts = {local_ip, internet_ip, "localhost", docker_host}

        if requested_host in valid_hosts:
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
        server_fqdn = socket.getfqdn()

        if requested_host in {server_hostname, server_fqdn}:
            return redirect(f"https://{requested_host}/{path}", code=301)

        try:
            resolved_ip = socket.gethostbyname(requested_host)

            try:
                resolved_ip_obj = ipaddress.ip_address(resolved_ip)
                if resolved_ip_obj.is_loopback:
                    abort(400)
            except:
                pass

            if resolved_ip in {local_ip, internet_ip}:
                return redirect(f"https://{requested_host}/{path}", code=301)

            current_local_ip = get_local_ip()
            current_internet_ip = get_internet_ip()

            if resolved_ip in {current_local_ip, current_internet_ip}:
                return redirect(f"https://{requested_host}/{path}", code=301)
        except:
            pass

        abort(400)

    config = Config()
    config.bind = ["0.0.0.0:80"]
    config.loglevel = "ERROR"
    config.include_server_header = False

    app_asgi = AsyncioWSGIMiddleware(redirect_app)
    return app_asgi, config
