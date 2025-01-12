"""
hd_UISystemLogs.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

from flask import render_template, session, g
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version, version_hash, current_year
from pymodules.hd_FunctionsMain import get_configured_external_drives, get_active_network_interface


@login_required
def system_logs():

    config = read_config()
    user_name = config["user_name"]
    external_disk_disabled = get_configured_external_drives() == "disabled"
    external_disk_name = get_configured_external_drives()
    disk_path = external_disk_name[0] if external_disk_name else None
    network_device = get_active_network_interface()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    return render_template("system-logs.html", user_name=user_name, version=version, version_hash=version_hash, external_disk_disabled=external_disk_disabled, disk_path=disk_path, network_device=network_device, selected_theme=selected_theme, selected_back=selected_back, year=current_year, nonce=g.get("nonce", ""))
