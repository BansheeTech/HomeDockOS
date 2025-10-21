"""
hd_ThreadAppUpdatesChecker.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import time
import docker

from threading import Thread

from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_FunctionsGlobals import compose_upload_folder
from pymodules.hd_FunctionsSanitize import sanitize_container_name

updates_state = {}


def check_app_updates():
    global updates_state

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    is_first_run = True

    while True:
        time.sleep(21600)  # 6 hours

        try:
            all_containers = client.containers.list(all=True)

            update_count = 0

            for container in all_containers:
                try:
                    container_name = container.name

                    labels = container.labels
                    hd_role = labels.get("HDRole", None)
                    if hd_role == "dependency":
                        updates_state[container_name] = False
                        continue

                    compose_file_path = os.path.join(compose_upload_folder, f"{sanitize_container_name(container_name)}.yml")
                    if not os.path.exists(compose_file_path):
                        updates_state[container_name] = False
                        continue

                    image_name = container.attrs.get("Config", {}).get("Image", "")
                    if not image_name:
                        continue

                    container_image_id = container.attrs.get("Image", "")
                    if not container_image_id:
                        continue

                    try:
                        container_image = client.images.get(container_image_id)

                        repo_digests = container_image.attrs.get("RepoDigests", [])
                        if not repo_digests:
                            continue

                        local_manifest_digest = repo_digests[0].split("@")[1] if "@" in repo_digests[0] else None
                        if not local_manifest_digest:
                            continue

                    except docker.errors.ImageNotFound:
                        local_manifest_digest = "image_not_found"

                    try:
                        registry_data = client.images.get_registry_data(image_name)
                        remote_manifest_digest = registry_data.id

                    except Exception as e:
                        print(f" + THREAD: Could not get registry data for {image_name}: {e}")
                        continue

                    has_update = local_manifest_digest != remote_manifest_digest

                    was_already_flagged = updates_state.get(container_name, False)
                    updates_state[container_name] = has_update

                    if has_update and not is_first_run and not was_already_flagged:
                        print(f" + THREAD: New update available for {container_name}")

                    if has_update:
                        update_count += 1

                except Exception as e:
                    continue

            if is_first_run:
                is_first_run = False
            else:
                if update_count > 0:
                    print(f" + THREAD: {update_count} update(s) available")

        except Exception as e:
            print(f" + THREAD: Error checking app updates: {e}")


def get_updates_state():
    return updates_state.copy()


def clear_update_flag(container_name):
    global updates_state
    if container_name in updates_state:
        updates_state[container_name] = False


def start_app_updates_checker_thread():
    thread = Thread(target=check_app_updates, daemon=True)
    thread.start()
