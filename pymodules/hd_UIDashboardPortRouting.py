"""
hd_UIDashboardPortRouting.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import re

from flask import request, jsonify
from flask_login import login_required

from pymodules.hd_ThreadAutoPortRouting import update_event
from pymodules.hd_FunctionsGlobals import current_directory


@login_required
def port_route_function():
    update_event.clear()

    data = request.json
    container_id = data.get("container_id")
    ports_list = data.get("ports_list")

    if ports_list in ["hostmode", "disabled"]:
        valid = True
    else:
        match = re.fullmatch(r"(\d{1,5})(:(\d{1,5}))?(/[\w\-_]+)?", ports_list)
        if match:
            parts = ports_list.split("/")
            port_section = parts[0]
            path_section = "/" + "/".join(parts[1:]) if len(parts) > 1 else ""

            ports = port_section.split(":")
            unique_ports = []
            for port in ports:
                if port not in unique_ports:
                    unique_ports.append(port)

            valid = all(0 <= int(port) <= 65535 for port in unique_ports)

            if valid:
                ports_list = ":".join(unique_ports) + path_section
        else:
            valid = False

    if not valid:
        raise ValueError("Invalid ports list format or range.")

    config_path = os.path.join(current_directory, "homedock_ports.conf")

    updated_lines = []
    updated = False

    with open(config_path, "r") as file:
        for line in file:
            parts = line.strip().split("*")
            if parts[0] == container_id:
                updated_lines.append(f"{container_id}*{ports_list}\n")
                updated = True
            else:
                updated_lines.append(line)

    if not updated:
        updated_lines.append(f"{container_id}*{ports_list}\n")

    with open(config_path, "w") as file:
        file.writelines(updated_lines)

    update_event.set()

    return jsonify({"status": "success"})
