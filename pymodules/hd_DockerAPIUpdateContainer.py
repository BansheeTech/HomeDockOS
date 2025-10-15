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
import subprocess

from flask import request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import compose_upload_folder
from pymodules.hd_ThreadAutoPortRouting import update_event
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ClassDockerClientManager import DockerClientManager

manager = DockerClientManager.get_instance()
client = manager.get_client()


@login_required
def pull_and_update_containers():
    config = read_config()
    delete_old_image_containers_after_update = config["delete_old_image_containers_after_update"]

    container_names = request.json.get("container_names", [])
    updated_containers = []
    containers_data = []

    update_event.clear()  # Stop port autorouting

    for name in container_names:
        process_container_update(name, client, updated_containers, containers_data, delete_old_image_containers_after_update)

    update_event.set()  # Resume port autorouting

    return {"message": "Containers updated successfully.", "updated_containers": updated_containers, "containers_data": containers_data}, 200


# Docker-API - Search & Send to pull_and_update_containers
@login_required
def check_new_images():

    container_names = request.json.get("container_names", [])

    return {"new_images_containers": check_for_new_images(container_names), "missing_compose_files": check_for_missing_files(container_names)}, 200


def process_container_update(name, client, updated_containers, containers_data, delete_old_image_flag):
    docker_compose_yml = os.path.join(compose_upload_folder, f"{name}.yml")

    container = client.containers.get(name)

    if not os.path.exists(docker_compose_yml):
        containers_data.append({"name": name, "composeLink": "not_exists"})
        return

    try:
        with open(docker_compose_yml, "r"):
            pass
    except FileNotFoundError:
        return

    new_dir = os.path.join(os.path.dirname(docker_compose_yml), name)
    new_file = os.path.join(new_dir, "docker-compose.yml")

    if not os.path.exists(new_dir):
        os.makedirs(new_dir)

    os.rename(docker_compose_yml, new_file)

    time.sleep(0.2)
    updated_containers.append(name)

    group_name = container.labels.get("HDGroup", None)

    if group_name:
        group_containers = client.containers.list(filters={"label": f"HDGroup={group_name}"}, all=True)
        print(group_containers)
        old_image_ids = [c.image.id for c in group_containers]
        print(old_image_ids)
        stop_and_update_group(group_name, old_image_ids, delete_old_image_flag)
    else:
        old_image_id = container.image.id
        stop_and_update_container(name, old_image_id, delete_old_image_flag)

    containers_data.append({"name": name, "composeLink": "exists"})

    os.rename(new_file, docker_compose_yml)
    time.sleep(0.2)

    if not os.listdir(new_dir):
        os.rmdir(new_dir)
        time.sleep(0.2)


# Single-image
def stop_and_update_container(name, old_image_id, delete_old_image_flag):

    try:
        container = client.containers.get(name)
        container.stop()
        container.remove()

        subprocess.run(["docker-compose", "up", "-d", name], cwd=os.path.join(compose_upload_folder, name))

        if delete_old_image_flag:
            client.images.remove(old_image_id)

    except docker.errors.NotFound:
        print(f"Container {name} not found.")
    except docker.errors.APIError as e:
        print(f"Docker API error: {e}")


# Multi-image
def stop_and_update_group(group_name, old_image_ids, delete_old_image_flag):
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

    subprocess.run(["docker-compose", "up", "-d"], cwd=os.path.join(compose_upload_folder, main_container_name))

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
            docker_image = compose_file["services"][name]["image"]
        except (FileNotFoundError, KeyError):
            continue

        pull_process = subprocess.run(["docker", "pull", docker_image], capture_output=True, text=True)
        if "Image is up to date" not in pull_process.stdout:
            new_images_containers.append(name)

    return new_images_containers


# Check missing files
def check_for_missing_files(container_names):
    missing_files = []
    for name in container_names:
        docker_compose_yml = os.path.join(compose_upload_folder, f"{name}.yml")
        if not os.path.exists(docker_compose_yml):
            missing_files.append(name)
    return missing_files
