"""
hd_DockerAPIContainerData.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import re


from flask import jsonify, request
from flask_login import login_required

from urllib.parse import urlparse

from pymodules.hd_FunctionsGlobals import compose_upload_folder, current_directory
from pymodules.hd_ThreadContainerCpuUsage import cpu_usage

from pymodules.hd_ClassDockerClientManager import DockerClientManager


# Docker-API - Single Container Data
def get_container_name_by_port_direct(port):
    try:
        manager = DockerClientManager.get_instance()
        client = manager.get_client()

        for container in client.containers.list(all=True):
            if container.ports:
                for container_port, host_bindings in container.ports.items():
                    if host_bindings:
                        for binding in host_bindings:
                            if binding.get("HostPort") == str(port):
                                return sanitize_container_name(container.name)
    except Exception:
        pass

    return None


@login_required
def get_container_by_port(port):
    container_name = get_container_name_by_port_direct(port)

    if container_name:
        return jsonify({"sanitized_name": container_name})

    return jsonify({"error": "Container not found for port"}), 404


# Docker-API - Container Data
@login_required
def get_docker_containers():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    containers = client.containers.list(all=True)
    container_data = []

    ports_file_name = os.path.join(current_directory, "homedock_ports.conf")
    try:
        with open(ports_file_name, "r") as file:
            config_lines = file.readlines()
    except FileNotFoundError:
        config_lines = []
    ports_config = {sanitize_container_name(line.strip().split("*")[0]): line.strip().split("*")[1].split(":") for line in config_lines}

    for container in containers:

        labels = container.labels

        compose_file_path = os.path.join(compose_upload_folder, f"{sanitize_container_name(container.name)}.yml")
        file_status = "exists" if os.path.exists(compose_file_path) else "not_exists"

        status_color_map = {"running": "success", "exited": "warning", "paused": "primary", "restarting": "dark", "dead": "dark", "removing": "danger", "created": "info"}
        statusColor = status_color_map.get(container.status, "default_color")

        image_path = f"docker-icons/{sanitize_container_name(container.name)}.jpg"
        os_image_path = os.path.join(current_directory, "homedock-ui", "static", "images", f"docker-icons/{sanitize_container_name(container.name)}.jpg")

        if not os.path.exists(os_image_path):
            image_path = "docker-icons/notfound.jpg"

        base_url = request.headers.get("X-Forwarded-Host", request.url_root)
        parsed_url = urlparse(base_url)

        base_url_without_scheme_or_www = parsed_url.hostname
        if base_url_without_scheme_or_www.startswith("www."):
            base_url_without_scheme_or_www = base_url_without_scheme_or_www[4:]

        if not is_valid_hostname(base_url_without_scheme_or_www):
            service_url = None
        else:
            if container.name in ports_config:
                ports_list = ports_config[container.name]
                if "" in ports_list or "hostmode" in ports_list:
                    service_url = None
                else:
                    sanitized_port = sanitize_port(ports_list[0])
                    if sanitized_port:
                        host_header = request.headers.get("Host", base_url_without_scheme_or_www)
                        parsed_host = urlparse(f"//{host_header}")
                        final_host = parsed_host.netloc

                        service_url = f"//{final_host}/app/{sanitized_port}"
                    else:
                        service_url = None
            else:
                ports = container.attrs["NetworkSettings"]["Ports"]
                ports_list = []
                for port in ports:
                    if ports[port] is not None:
                        for item in ports[port]:
                            host_port = sanitize_port(item["HostPort"])
                            if host_port:
                                ports_list.append(host_port)

                if ports_list and ports_list[0] not in ["hostmode", ""]:
                    sanitized_port = sanitize_port(ports_list[0])
                    if sanitized_port:
                        service_url = f"//{base_url_without_scheme_or_www}/app/{sanitized_port}"
                    else:
                        service_url = None
                else:
                    service_url = None

        basic_data = {"name": container.name, "id": container.short_id, "status": container.status, "image": str(container.image.tags[0]) if container.image.tags else "", "image_path": image_path, "usagePercent": cpu_usage.get(container.name, 0), "statusColor": statusColor, "host": base_url_without_scheme_or_www, "composeLink": file_status, "ports": ports_list, "service_url": service_url}

        if "HDGroup" in labels:
            basic_data["HDGroup"] = labels["HDGroup"]
        if "HDRole" in labels:
            basic_data["HDRole"] = labels["HDRole"]

        container_data.append(basic_data)

    return jsonify(container_data)


def sanitize_container_name(name):
    sanitized_name = re.sub(r"[^a-zA-Z0-9_-]", "", name)
    return sanitized_name


def is_valid_hostname(hostname):
    pattern = r"^[a-zA-Z0-9.-]*$"
    return re.match(pattern, hostname) is not None


def sanitize_port(port):
    pattern = r"^(\d{1,5})(/[a-zA-Z0-9/_-]*)?$"
    match = re.match(pattern, port)

    if match:
        port_number = int(match.group(1))
        if 0 <= port_number <= 65535:
            return port
    return None
