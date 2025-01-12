"""
hd_DockerAPIUninstallContainer.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import docker

from flask import request
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ClassDockerClientManager import DockerClientManager


# Docker-API - Uninstall
@login_required
def uninstall_containers():

    config = read_config()
    delete_old_image_containers_after_uninstall = config["delete_old_image_containers_after_uninstall"]

    manager = DockerClientManager.get_instance()
    client = manager.get_client()
    container_names = request.json.get("container_names", [])
    all_containers = client.containers.list(all=True)
    for name in container_names:
        for container in all_containers:
            if container.name == name:
                image_id = container.image.id

                network_names = list(container.attrs["NetworkSettings"]["Networks"].keys())

                container.stop()
                container.remove()

                for net_name in network_names:
                    try:
                        net = client.networks.get(net_name)
                        if not net.attrs["Containers"]:
                            net.remove()
                            print(f" i Removed linked Docker subnetwork {net_name}")
                    except Exception as e:
                        print(f" ! Error attempting to remove linked Docker subnetwork {net_name}: {e}")

                if delete_old_image_containers_after_uninstall:
                    try:
                        other_containers_using_image = [c for c in client.containers.list(all=True) if c.image.id == image_id]
                        if not other_containers_using_image:
                            client.images.remove(image_id)
                            print(f" i Old image files from {container.name} removed")
                    except docker.errors.APIError as e:
                        if "409 Client Error" in str(e):
                            print(f"Image {image_id} is being used by another running container.")
                        else:
                            print(f"An unexpected error occurred: {e}")

    return {"message": "Containers stopped and removed successfully."}, 200
