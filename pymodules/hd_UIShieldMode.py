"""
hd_UIShieldMode.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import render_template, session, g

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version_hash


def shieldmode():
    config = read_config()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]
    shield_mode_time = session.get("shield_mode_time", None)

    return render_template("shieldmode.html", version_hash=version_hash, selected_theme=selected_theme, selected_back=selected_back, shield_mode_time=shield_mode_time, nonce=g.get("nonce", ""))
