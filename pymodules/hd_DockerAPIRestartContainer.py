"""
hd_DockerAPIRestartContainer.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import request
from flask_login import login_required

from pymodules.hd_ClassDockerClientManager import DockerClientManager


@login_required
def restart_containers():
    manager = DockerClientManager.get_instance()
    client = manager.get_client()
    container_names = request.json.get("container_names", [])
    all_containers = client.containers.list(all=True)
    for name in container_names:
        for container in all_containers:
            if container.name == name:
                container.restart()
    return {"message": "Containers restarted successfully."}, 200
