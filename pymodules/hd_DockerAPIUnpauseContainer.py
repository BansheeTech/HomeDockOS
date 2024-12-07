"""
hd_DockerAPIUnpauseContainer.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

from flask import request
from flask_login import login_required

from pymodules.hd_ClassDockerClientManager import DockerClientManager


# Docker-API - Unpause
@login_required
def unpause_containers():
    manager = DockerClientManager.get_instance()
    client = manager.get_client()
    container_names = request.json.get("container_names", [])
    all_containers = client.containers.list(all=True)
    for name in container_names:
        for container in all_containers:
            if container.name == name:
                container.unpause()
    return {"message": "Containers unpaused successfully."}, 200
