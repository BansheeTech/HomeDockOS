"""
hd_UIAppStoreListApps.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import glob
import yaml

from flask import jsonify
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_DockerAPIContainerData import get_docker_containers


@login_required
def get_app_store_files():
    path_to_yml_files = os.path.join(current_directory, "app-store")
    compose_files = []

    installed_containers = get_docker_containers()
    installed_container_names = [container["name"] for container in installed_containers.json]

    for yml_file in glob.glob(os.path.join(path_to_yml_files, "*.yml")):
        with open(yml_file, "r") as file:
            try:
                yml_data = yaml.safe_load(file)
            except yaml.YAMLError:
                continue

            is_group = any("HDGroup" in service_data.get("labels", {}) for service_data in yml_data.get("services", {}).values())

            main_service_name = None
            main_service_data = None
            dependencies = []

            if is_group:
                for service_name, service_data in yml_data.get("services", {}).items():
                    if service_data.get("labels", {}).get("HDRole") == "main":
                        main_service_name = service_name
                        main_service_data = service_data
                    elif service_data.get("labels", {}).get("HDRole") == "dependency":
                        dependencies.append(service_name)
            else:
                main_service_name, main_service_data = next(iter(yml_data.get("services", {}).items()), (None, None))

            if main_service_name is None or main_service_data is None:
                continue

            app_name = main_service_data.get("container_name", "Nombre desconocido")
            rel_image_icon_path = f"images/docker-icons/{app_name}.jpg"
            abs_image_icon_path = os.path.join(current_directory, "homedock-ui", "static", rel_image_icon_path)

            if not os.path.exists(abs_image_icon_path):
                rel_image_icon_path = "images/docker-icons/notfound.jpg"

            repo_url = main_service_data.get("image", "URL desconocida")

            is_installed = app_name in installed_container_names

            compose_files.append({"name": f"{app_name}", "image": repo_url, "image_path": rel_image_icon_path, "composeLink": "exists", "is_installed": is_installed, "is_group": is_group, "dependencies": dependencies})

    return jsonify(compose_files)
