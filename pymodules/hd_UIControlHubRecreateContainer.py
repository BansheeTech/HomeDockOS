"""
hd_UIControlHubRecreateContainer.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import time
import docker
import subprocess

from flask import request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory, compose_upload_folder
from pymodules.hd_ThreadAutoPortRouting import update_event

from pymodules.hd_ClassDockerClientManager import DockerClientManager


@login_required
def recreate_container():

    update_event.clear()
    manager = DockerClientManager.get_instance()
    client = manager.get_client()
    container_name = request.json.get("container_name", None)
    yml_content = request.json.get("yml_content", None)

    if not container_name or not yml_content:
        return {"message": "Invalid parameters."}, 400

    try:

        dependent_containers = get_dependent_containers(container_name, client)

        for dep_container_name in dependent_containers:
            dep_container = client.containers.get(dep_container_name)
            dep_container.stop()
            time.sleep(1)
            dep_container.remove()
            time.sleep(1)
            mark_container_as_disabled(dep_container_name)

        container = client.containers.get(container_name)
        container.stop()
        time.sleep(1)

        container.remove()
        time.sleep(1)

        temp_folder_path = os.path.join(compose_upload_folder, container_name)
        os.makedirs(temp_folder_path, exist_ok=True)

        temp_file_path = os.path.join(temp_folder_path, "docker-compose.yml")
        with open(temp_file_path, "w") as f:
            f.write(yml_content)

        subprocess.run(["docker-compose", "up", "-d"], cwd=temp_folder_path)

        original_file_path = os.path.join(compose_upload_folder, f"{container_name}.yml")
        os.replace(temp_file_path, original_file_path)  # HDOS00004

        os.rmdir(temp_folder_path)

        mark_container_as_disabled(container_name)
        time.sleep(1)

        update_event.set()

        return {"message": "Container recreated successfully."}, 200

    except docker.errors.NotFound:
        return {"message": f"Container {container_name} not found."}, 404
    except Exception as e:
        return {"message": f"An error occurred: {e}"}, 500


def mark_container_as_disabled(container_name):
    ports_file_name = os.path.join(current_directory, "homedock_ports.conf")
    try:

        with open(ports_file_name, "r") as file:
            lines = file.readlines()

        new_lines = []
        for line in lines:
            parts = line.strip().split("*")
            if parts[0] == container_name:
                new_lines.append(f"{container_name}*disabled\n")
            else:
                new_lines.append(line)

        with open(ports_file_name, "w") as file:
            file.writelines(new_lines)
            file.flush()
            os.fsync(file.fileno())

    except FileNotFoundError:
        print(f"The file {ports_file_name} was not found.")
    except Exception as e:
        print(f"An error occurred while marking the container as disabled: {e}")


def get_dependent_containers(main_container_name, docker_client):

    main_container = docker_client.containers.get(main_container_name)
    main_hdgroup = main_container.labels.get("HDGroup", None)

    if main_hdgroup is None:
        return []

    filters = {"label": [f"HDGroup={main_hdgroup}", "HDRole=dependency"]}
    dependent_containers = docker_client.containers.list(filters=filters)
    return [container.name for container in dependent_containers]
