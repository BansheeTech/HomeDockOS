"""
hd_HTTPRedirector.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

import threading
from flask import Flask, request, redirect


def start_http_redirect_server():
    redirect_app = Flask("redirect_http_to_https")

    @redirect_app.route("/", defaults={"path": ""})
    @redirect_app.route("/<path:path>")
    def redirect_to_https(path):
        host = request.host.split(":")[0]
        return redirect(f"https://{host}/{path}", code=301)

    thread = threading.Thread(
        target=lambda: redirect_app.run(host="0.0.0.0", port=80, debug=False, use_reloader=False),
        daemon=True,
    )
    thread.start()
