"""
hd_DockerAPIUpdateContainer.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import yaml
import time
import docker

from flask import request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import compose_upload_folder
from pymodules.hd_ThreadAutoPortRouting import update_event
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_ClassDockerComposeHelper import DockerComposeHelper
from pymodules.hd_ThreadAppUpdatesChecker import clear_update_flag

manager = DockerClientManager.get_instance()
client = manager.get_client()


@login_required
def update_containers():
    config = read_config()
    delete_old_image_containers_after_update = config["delete_old_image_containers_after_update"]

    container_names = request.json.get("container_names", [])

    containers_with_updates = check_for_new_images(container_names)
    missing_compose_files = check_for_missing_files(container_names)

    if not containers_with_updates:
        return {"message": "No updates available.", "updated_containers": [], "skipped_containers": container_names, "missing_compose_files": missing_compose_files}, 200

    updated_containers = []
    containers_data = []

    update_event.clear()  # Stop port autorouting

    for name in containers_with_updates:
        if name not in missing_compose_files:
            process_container_update(name, client, updated_containers, containers_data, delete_old_image_containers_after_update)

    update_event.set()  # Resume port autorouting

    skipped = [name for name in container_names if name not in updated_containers]

    return {"message": "Containers updated successfully." if updated_containers else "No updates performed.", "updated_containers": updated_containers, "skipped_containers": skipped, "containers_data": containers_data, "missing_compose_files": missing_compose_files}, 200


def process_container_update(name, client, updated_containers, containers_data, delete_old_image_flag):
    docker_compose_yml = os.path.join(compose_upload_folder, f"{name}.yml")

    container = client.containers.get(name)

    if not os.path.exists(docker_compose_yml):
        containers_data.append({"name": name, "composeLink": "not_exists"})
        return

    try:
        with open(docker_compose_yml, "r") as file:
            compose_file = yaml.safe_load(file)
            image_name = compose_file["services"][name]["image"]
    except (FileNotFoundError, KeyError):
        return

    try:
        print(f" * Pulling new image for {name}: {image_name}")
        client.images.pull(image_name)
    except docker.errors.APIError as e:
        print(f" ! Error pulling image {image_name}: {e}")
        containers_data.append({"name": name, "composeLink": "pull_failed"})
        return

    updated_containers.append(name)

    group_name = container.labels.get("HDGroup", None)

    if group_name:
        group_containers = client.containers.list(filters={"label": f"HDGroup={group_name}"}, all=True)
        print(group_containers)
        old_image_ids = [c.image.id for c in group_containers]
        print(old_image_ids)
        stop_and_update_group(group_name, docker_compose_yml, old_image_ids, delete_old_image_flag)
    else:
        old_image_id = container.image.id
        stop_and_update_container(name, docker_compose_yml, old_image_id, delete_old_image_flag)

    containers_data.append({"name": name, "composeLink": "exists"})


# Single-image
def stop_and_update_container(name, compose_file, old_image_id, delete_old_image_flag):

    try:
        container = client.containers.get(name)
        container.stop()
        container.remove()

        compose_helper = DockerComposeHelper.get_instance()
        success, message = compose_helper.up(compose_file=compose_file, detach=True, service_names=[name])

        if not success:
            print(f"Error starting container {name}: {message}")
        else:
            clear_update_flag(name)

        if delete_old_image_flag:
            client.images.remove(old_image_id)

    except docker.errors.NotFound:
        print(f"Container {name} not found.")
    except docker.errors.APIError as e:
        print(f"Docker API error: {e}")


# Multi-image
def stop_and_update_group(group_name, compose_file, old_image_ids, delete_old_image_flag):
    all_containers = client.containers.list(filters={"label": f"HDGroup={group_name}"}, all=True)
    main_container_name = None
    new_image_ids = []

    for container in all_containers:
        if container.attrs["Config"]["Labels"].get("HDRole") == "main":
            main_container_name = container.name
            break

    if main_container_name is None:
        print(f"No main container found for group {group_name}.")
        return

    for container in all_containers:
        if container.name != main_container_name:
            try:
                container.stop()
                container.remove()
            except docker.errors.NotFound:
                print(f"Container {container.name} not found, it may have already been stopped or removed.")
            except Exception as e:
                print(f"An error occurred while stopping/removing container {container.name}: {e}")

    try:
        main_container = client.containers.get(main_container_name)
        main_container.stop()
        main_container.remove()
    except docker.errors.NotFound:
        print(f"The main container {main_container_name} was not found.")
    except Exception as e:
        print(f"An error occurred while stopping the main container {main_container_name}: {e}")

    compose_helper = DockerComposeHelper.get_instance()
    success, message = compose_helper.up(compose_file=compose_file, detach=True)

    if not success:
        print(f"Error starting group {group_name}: {message}")
    else:
        new_group_containers = client.containers.list(filters={"label": f"HDGroup={group_name}"}, all=True)
        for container in new_group_containers:
            clear_update_flag(container.name)

    new_group_containers = client.containers.list(filters={"label": f"HDGroup={group_name}"}, all=True)
    new_image_ids = [c.attrs["Config"]["Image"] for c in new_group_containers]

    if delete_old_image_flag:
        for old_image_id in old_image_ids:
            if old_image_id not in new_image_ids:
                try:
                    client.images.remove(old_image_id)
                except docker.errors.APIError as e:
                    print(f"Error deleting old image {old_image_id}: {e}")


# Check new images
def check_for_new_images(container_names):
    new_images_containers = []
    for name in container_names:
        docker_compose_yml = os.path.join(compose_upload_folder, f"{name}.yml")
        if not os.path.exists(docker_compose_yml):
            continue
        try:
            with open(docker_compose_yml, "r") as file:
                compose_file = yaml.safe_load(file)
            image_name = compose_file["services"][name]["image"]
        except (FileNotFoundError, KeyError):
            continue

        try:
            try:
                container = client.containers.get(name)
                container_image_id = container.attrs.get("Image", "")
                if not container_image_id:
                    continue

                container_image = client.images.get(container_image_id)
                repo_digests = container_image.attrs.get("RepoDigests", [])
                if not repo_digests:
                    continue

                local_manifest_digest = repo_digests[0].split("@")[1] if "@" in repo_digests[0] else None
                if not local_manifest_digest:
                    continue

            except (docker.errors.ImageNotFound, docker.errors.NotFound):
                new_images_containers.append(name)
                continue

            try:
                registry_data = client.images.get_registry_data(image_name)
                remote_manifest_digest = registry_data.id
            except Exception as e:
                print(f"Could not get registry data for {image_name}: {e}")
                continue

            if local_manifest_digest != remote_manifest_digest:
                new_images_containers.append(name)

        except Exception as e:
            print(f"Error checking image {image_name}: {e}")
            continue

    return new_images_containers


# Check missing files
def check_for_missing_files(container_names):
    missing_files = []
    for name in container_names:
        docker_compose_yml = os.path.join(compose_upload_folder, f"{name}.yml")
        if not os.path.exists(docker_compose_yml):
            missing_files.append(name)
    return missing_files
