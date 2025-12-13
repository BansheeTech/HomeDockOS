"""
hd_UIAppStoreInstallApp.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import hashlib

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import compose_upload_folder, user_packages_install_folder
from pymodules.hd_FunctionsMain import copy_file, remove_directory_and_contents
from pymodules.hd_ClassDockerComposeHelper import DockerComposeHelper

install_queue = []


def _is_hash_folder(s: str) -> bool:
    return len(s) == 16 and all(c in "0123456789abcdef" for c in s.lower())


def _find_hash_folder(container_name: str, user_name: str):
    if not os.path.exists(user_packages_install_folder):
        return None, None

    for folder_name in os.listdir(user_packages_install_folder):
        if not _is_hash_folder(folder_name):
            continue

        folder_path = os.path.join(user_packages_install_folder, folder_name)
        if not os.path.isdir(folder_path):
            continue

        compose_file = os.path.join(folder_path, f"{user_name}_{container_name.lower()}.yml")
        if os.path.exists(compose_file):
            return folder_path, compose_file

    return None, None


def _verify_hash(hash_folder: str, compose_file: str) -> bool:
    folder_name = os.path.basename(hash_folder)
    try:
        with open(compose_file, "rb") as f:
            computed = hashlib.sha256(f.read()).hexdigest()[:16]
        return folder_name == computed
    except Exception:
        return False


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

    user_name = current_user.id.lower()

    if len(install_queue) == 1:
        while install_queue:
            current_container = install_queue[0]
            hash_folder = None

            try:
                hash_folder, compose_file = _find_hash_folder(current_container, user_name)

                if not hash_folder:
                    print(f"[AppStore] ERROR: No hash folder found for: {current_container}")
                    install_queue.pop(0)
                    continue

                # Verify hash matches
                if not _verify_hash(hash_folder, compose_file):
                    print(f"[AppStore] ERROR: Hash mismatch for: {current_container}")
                    remove_directory_and_contents(hash_folder)
                    install_queue.pop(0)
                    continue

                compose_helper = DockerComposeHelper.get_instance()
                success, message = compose_helper.up(compose_file=compose_file, detach=True)

                if not success:
                    print(f"[AppStore] ERROR installing {current_container}: {message}")
                    remove_directory_and_contents(hash_folder)
                    install_queue.pop(0)
                    continue

                os.makedirs(compose_upload_folder, exist_ok=True)
                compose_link_path = os.path.join(compose_upload_folder, f"{current_container}.yml")
                copy_file(compose_file, compose_link_path)
                remove_directory_and_contents(hash_folder)

                install_queue.pop(0)

            except Exception as e:
                print(f"[AppStore] Exception: {e}")
                if hash_folder and os.path.exists(hash_folder) and _is_hash_folder(os.path.basename(hash_folder)):
                    remove_directory_and_contents(hash_folder)
                install_queue.pop(0)
                continue

    return jsonify(success=True, message="Installation for {} has been queued.".format(container_name))


@login_required
def get_installation_status():

    return jsonify(currently_installing=install_queue[0] if install_queue else None, queue=install_queue[1:])
