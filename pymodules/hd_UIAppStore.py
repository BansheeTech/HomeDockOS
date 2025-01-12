"""
hd_UIAppStore.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

from flask import render_template, session, g
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version, version_hash, current_year


@login_required
def appstore():

    config = read_config()
    user_name = config["user_name"]
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    return render_template("app-store.html", user_name=user_name, version=version, version_hash=version_hash, selected_theme=selected_theme, selected_back=selected_back, year=current_year, nonce=g.get("nonce", ""))
