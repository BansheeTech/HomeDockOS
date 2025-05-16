"""
hd_HTTPRedirector.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

from flask import Flask, request, redirect
from hypercorn.config import Config
from hypercorn.middleware import AsyncioWSGIMiddleware


def start_http_redirect_server():
    redirect_app = Flask("redirect_http_to_https")

    @redirect_app.route("/", defaults={"path": ""})
    @redirect_app.route("/<path:path>")
    def redirect_to_https(path):
        host = request.host.split(":")[0]
        return redirect(f"https://{host}/{path}", code=301)

    config = Config()
    config.bind = ["0.0.0.0:80"]
    config.loglevel = "ERROR"
    config.include_server_header = False

    app_asgi = AsyncioWSGIMiddleware(redirect_app)
    return app_asgi, config
