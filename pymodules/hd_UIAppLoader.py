"""
hd_UIAppLoader.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import requests

from flask import jsonify, render_template, g, request
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version_hash


@login_required
def check_port():
    data = request.json
    port = data.get("port")

    if not isinstance(port, int) or port < 1 or port > 65535:
        return jsonify({"error": "Invalid port. Must be an integer between 1 and 65535."}), 400

    hostname = request.host.split(":")[0]
    urls = [f"https://{hostname}:{port}", f"http://{hostname}:{port}"]

    for url in urls:
        try:
            response = requests.head(url, timeout=2, allow_redirects=True)

            if response.status_code < 400 or response.status_code in [401, 301, 302]:
                return jsonify({"available": True, "url": url})

            if response.status_code in [404, 405]:
                response = requests.get(url, timeout=2, allow_redirects=True, stream=True)

                if response.status_code < 400 or response.status_code in [401, 301, 302]:
                    return jsonify({"available": True, "url": url})

        except requests.RequestException:
            continue

    return jsonify({"available": False}), 404


@login_required
def app_loader(port, subpath=""):
    config = read_config()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    return render_template("app.html", version_hash=version_hash, selected_theme=selected_theme, selected_back=selected_back, nonce=g.get("nonce", ""), port=port, subpath=subpath)
