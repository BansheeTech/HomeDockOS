"""
hd_UIControlHubViewLogs.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import re
import docker

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_ClassDockerClientManager import DockerClientManager


@login_required
def view_container_logs():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    container_name = request.args.get("containerName")
    max_log_length = 15000

    try:
        container = client.containers.get(container_name)
        logs = container.logs().decode("utf-8")
    except docker.errors.NotFound:
        return jsonify({"success": False, "message": "Container not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    clean_logs = re.sub(r"(?i)<(?!br\s*\/?)[^>]+>", "", logs)

    if len(clean_logs) > max_log_length:
        message = "⌂ [HomeDock OS > Big log found, truncating output]\n\n...\n"
        last_message = "...\n\n⌂ [HomeDock OS > End of file]"
        trimmed_logs = message + clean_logs[-max_log_length:] + last_message
    else:
        trimmed_logs = clean_logs

    return jsonify({"success": True, "logs": trimmed_logs})
