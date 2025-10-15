"""
hd_DockerAPIUninstallContainer.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import stat
import docker
import shutil

from flask import request
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_ComposeDevHooks import get_internal_storage_paths, is_internal_volume_path
from pymodules.hd_FunctionsGlobals import running_OS


def remove_readonly(func, path, _):
    os.chmod(path, stat.S_IWRITE)
    func(path)


def normalize_windows_path(docker_path):
    if running_OS == "Windows" and docker_path.startswith("/mnt/c/"):
        return docker_path.replace("/mnt/c/", "C:\\").replace("/", "\\")
    return docker_path


def extract_internal_volumes_from_container(container, container_name):
    internal_volumes = []

    try:
        mounts = container.attrs.get("Mounts", [])

        labels = container.labels or {}
        hd_group = labels.get("HDGroup")

        volume_prefix = hd_group if hd_group else container_name

        for mount in mounts:
            mount_type = mount.get("Type", "unknown")
            source_path = mount.get("Source", "")
            destination = mount.get("Destination", "")

            if mount_type == "bind":
                is_internal = is_internal_volume_path(source_path, volume_prefix)

                if is_internal:
                    internal_volumes.append(source_path)

    except Exception as e:
        print(f" ! Error extracting volumes from container {container_name}: {e}")

    return internal_volumes


def clean_internal_volumes(internal_volumes, container_name):
    cleaned_count = 0

    for volume_path in internal_volumes:
        try:
            cleanup_path = normalize_windows_path(volume_path)

            if os.path.exists(cleanup_path) and os.path.isdir(cleanup_path):
                path_parts = volume_path.split("/")
                app_data_idx = -1
                app_folders_idx = -1

                for i, part in enumerate(path_parts):
                    if part == "AppData":
                        app_data_idx = i
                    elif part == "AppFolders":
                        app_folders_idx = i

                volume_prefix = None
                if app_data_idx != -1 and len(path_parts) > app_data_idx + 1:
                    volume_prefix = path_parts[app_data_idx + 1]
                elif app_folders_idx != -1 and len(path_parts) > app_folders_idx + 1:
                    volume_prefix = path_parts[app_folders_idx + 1]

                if volume_prefix and is_internal_volume_path(volume_path, volume_prefix):
                    shutil.rmtree(cleanup_path, onerror=remove_readonly)
                    cleaned_count += 1

        except Exception as e:
            print(f" ! Error cleaning volume {cleanup_path}: {e}")

    try:
        app_data_path, app_folders_path = get_internal_storage_paths()

        app_data_cleanup = normalize_windows_path(app_data_path)
        app_folders_cleanup = normalize_windows_path(app_folders_path)

        volume_prefixes = set()
        for volume_path in internal_volumes:
            path_parts = volume_path.split("/")
            for i, part in enumerate(path_parts):
                if part in ["AppData", "AppFolders"] and len(path_parts) > i + 1:
                    volume_prefixes.add(path_parts[i + 1])

        for base_path in [app_data_cleanup, app_folders_cleanup]:
            for volume_prefix in volume_prefixes:
                container_dir = os.path.join(base_path, volume_prefix)
                if os.path.exists(container_dir) and os.path.isdir(container_dir):
                    try:
                        if not os.listdir(container_dir):
                            os.rmdir(container_dir)
                    except OSError:
                        pass

    except Exception as e:
        print(f" ! Error cleaning up parent directories: {e}")

    return cleaned_count


# Docker-API - Uninstall
@login_required
def uninstall_containers():
    config = read_config()
    delete_old_image_containers_after_uninstall = config["delete_old_image_containers_after_uninstall"]
    delete_internal_data_volumes = config.get("delete_internal_data_volumes", False)

    manager = DockerClientManager.get_instance()
    client = manager.get_client()
    container_names = request.json.get("container_names", [])

    all_containers = client.containers.list(all=True)
    total_cleaned_volumes = 0

    for name in container_names:
        internal_volumes = []

        for container in all_containers:
            if container.name == name:
                image_id = container.image.id

                if delete_internal_data_volumes:
                    internal_volumes = extract_internal_volumes_from_container(container, name)

                network_names = list(container.attrs["NetworkSettings"]["Networks"].keys())

                container.stop()
                container.remove()

                if delete_internal_data_volumes and internal_volumes:
                    print(f" i Cleaning {len(internal_volumes)} internal volumes for {name}")
                    cleaned_count = clean_internal_volumes(internal_volumes, name)
                    total_cleaned_volumes += cleaned_count

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
                break

    message = "Containers stopped and removed successfully."
    if delete_internal_data_volumes and total_cleaned_volumes > 0:
        message += f" {total_cleaned_volumes} internal volumes cleaned."

    return {"message": message}, 200
