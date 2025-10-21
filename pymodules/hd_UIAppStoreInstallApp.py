"""
hd_UIAppStoreInstallApp.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import appstore_folder, compose_upload_folder
from pymodules.hd_FunctionsMain import copy_file, remove_directory_and_contents
from pymodules.hd_ClassDockerComposeHelper import DockerComposeHelper

install_queue = []


@login_required
def app_store_install_container():

    if request.is_json:
        request_data = request.get_json()
        container_name = request_data.get("containerName")
    else:
        container_name = request.form.get("containerName")

    if not container_name:
        return jsonify({"success": False, "message": "Missing container name"}), 400

    if container_name not in install_queue:
        install_queue.append(container_name)

    if len(install_queue) == 1:
        while install_queue:
            try:
                current_container = install_queue[0]

                new_directory = os.path.join(appstore_folder, current_container)

                if not os.path.exists(new_directory):
                    print(f"[AppStore] ERROR: Directory does not exist: {new_directory}")
                    install_queue.pop(0)
                    continue

                docker_compose_path = os.path.join(new_directory, "docker-compose.yml")
                if not os.path.exists(docker_compose_path):
                    print(f"[AppStore] ERROR: docker-compose.yml not found at: {docker_compose_path}")
                    install_queue.pop(0)
                    continue

                compose_link_file_path = os.path.join(compose_upload_folder, f"{current_container}.yml")

                compose_helper = DockerComposeHelper.get_instance()
                success, message = compose_helper.up(cwd=new_directory, detach=True)

                if not success:
                    print(f"[AppStore] ERROR installing {current_container}: {message}")
                    install_queue.pop(0)
                    continue

                copy_file(docker_compose_path, compose_link_file_path)
                remove_directory_and_contents(new_directory)

                install_queue.pop(0)

            except Exception as e:
                print(f"[AppStore] Exception during installation: {e}")
                install_queue.pop(0)
                continue

    return jsonify(success=True, message="Installation for {} has been queued.".format(container_name))


@login_required
def get_installation_status():

    return jsonify(currently_installing=install_queue[0] if install_queue else None, queue=install_queue[1:])
