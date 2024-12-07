"""
hd_UILimited.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

from flask import render_template, g

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version_hash


def limited():
    config = read_config()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    return render_template("limited.html", version_hash=version_hash, selected_theme=selected_theme, selected_back=selected_back, nonce=g.get("nonce", ""))
