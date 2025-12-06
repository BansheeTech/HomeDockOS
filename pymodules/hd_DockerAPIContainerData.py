"""
hd_DockerAPIContainerData.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json


from flask import jsonify, request
from flask_login import login_required

from urllib.parse import urlparse

from pymodules.hd_FunctionsGlobals import compose_upload_folder, current_directory, user_packages_available_folder
from pymodules.hd_FunctionsSanitize import sanitize_container_name
from pymodules.hd_ThreadContainerResourceUsage import cpu_usage, memory_usage, network_rx_bytes, network_tx_bytes

from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_ThreadAppUpdatesChecker import get_updates_state

_app_store_cache = None
_app_store_external_cache = None


def invalidate_external_apps_cache():
    global _app_store_external_cache
    _app_store_external_cache = None


def load_app_store_data():
    global _app_store_cache, _app_store_external_cache

    if _app_store_cache is None:
        try:
            appstore_path = os.path.join(current_directory, "homedock-ui", "vue3", "static", "js", "__Data__", "AppStoreDefault.json")
            with open(appstore_path, "r", encoding="utf-8") as f:
                _app_store_cache = {app["name"]: app.get("display_name", app["name"]) for app in json.load(f)}
        except Exception as e:
            print(f"Warning: Could not load AppStoreDefault.json: {e}")
            _app_store_cache = {}

    if _app_store_external_cache is None:
        _app_store_external_cache = {}
        try:
            if os.path.exists(user_packages_available_folder):
                for filename in os.listdir(user_packages_available_folder):
                    if filename.endswith(".yml.metadata"):
                        app_slug = filename.replace(".yml.metadata", "")
                        metadata_path = os.path.join(user_packages_available_folder, filename)
                        try:
                            with open(metadata_path, "r", encoding="utf-8") as f:
                                metadata = json.load(f)
                                display_name = metadata.get("display_name", metadata.get("name", app_slug))
                                icon_filename = metadata.get("icon_filename", f"{app_slug}.jpg")
                                _app_store_external_cache[app_slug] = {"display_name": display_name, "picture_path": f"user-images/{icon_filename}"}
                        except:
                            pass
        except Exception as e:
            print(f"Warning: Could not load external apps metadata: {e}")

    return _app_store_cache, _app_store_external_cache


def get_display_name_for_container(container_name: str) -> str:
    app_store, external_apps = load_app_store_data()

    sanitized = sanitize_container_name(container_name)

    if sanitized == "homedock-os":
        return "HomeDock OS"

    if sanitized in app_store:
        return app_store[sanitized]
    if sanitized in external_apps:
        if isinstance(external_apps[sanitized], dict):
            return external_apps[sanitized]["display_name"]
        return external_apps[sanitized]

    if "_" in sanitized:
        base_name = sanitized.split("_")[0]
        if base_name in app_store:
            return app_store[base_name]
        if base_name in external_apps:
            if isinstance(external_apps[base_name], dict):
                return external_apps[base_name]["display_name"]
            return external_apps[base_name]

    return sanitized


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

        # HDOS00011
        try:
            containers_response = get_docker_containers()
            containers_data = containers_response.get_json()

            for container in containers_data:
                if "ports" in container and container["ports"]:
                    for container_port in container["ports"]:
                        if container_port not in ["hostmode", "disabled", ""] and container_port == str(port):
                            try:
                                docker_container = client.containers.get(container["name"])
                                if docker_container.status == "running":
                                    return sanitize_container_name(container["name"])
                            except:
                                continue
        except Exception:
            pass

    except Exception:
        pass

    return None


@login_required
def get_container_by_port(port):
    container_name = get_container_name_by_port_direct(port)

    if container_name:
        return jsonify({"sanitized_name": container_name})

    return jsonify({"error": "Container not found for port"}), 404


@login_required
def get_docker_containers():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    containers = client.containers.list(all=True)
    container_data = []

    updates_dict = get_updates_state()

    ports_file_name = os.path.join(current_directory, "homedock_ports.conf")
    try:
        with open(ports_file_name, "r") as file:
            config_lines = file.readlines()
    except FileNotFoundError:
        config_lines = []
    ports_config = {sanitize_container_name(line.strip().split("*")[0]): line.strip().split("*")[1].split(":") for line in config_lines}

    for container in containers:
        try:
            labels = container.labels

            if labels.get("HDDockerInDocker") == "true":
                continue

            compose_file_path = os.path.join(compose_upload_folder, f"{sanitize_container_name(container.name)}.yml")
            file_status = "exists" if os.path.exists(compose_file_path) else "not_exists"

            status_color_map = {"running": "success", "exited": "warning", "paused": "primary", "restarting": "dark", "dead": "dark", "removing": "danger", "created": "info"}
            statusColor = status_color_map.get(container.status, "default_color")

            sanitized_name = sanitize_container_name(container.name)
            image_path = "docker-icons/notfound.jpg"  # Default

            app_store, external_apps = load_app_store_data()

            if sanitized_name in external_apps:
                if isinstance(external_apps[sanitized_name], dict):
                    image_path = external_apps[sanitized_name]["picture_path"]

            elif "_" in sanitized_name:
                base_name = sanitized_name.split("_")[0]
                if base_name in external_apps:
                    if isinstance(external_apps[base_name], dict):
                        image_path = external_apps[base_name]["picture_path"]

            if image_path == "docker-icons/notfound.jpg":
                for ext in [".jpg", ".jpeg", ".png"]:
                    os_image_path = os.path.join(current_directory, "homedock-ui", "static", "images", f"docker-icons/{sanitized_name}{ext}")
                    if os.path.exists(os_image_path):
                        image_path = f"docker-icons/{sanitized_name}{ext}"
                        break

                if image_path == "docker-icons/notfound.jpg" and "_" in sanitized_name:
                    base_name = sanitized_name.split("_")[0]
                    for ext in [".jpg", ".jpeg", ".png"]:
                        os_image_path = os.path.join(current_directory, "homedock-ui", "static", "images", f"docker-icons/{base_name}{ext}")
                        if os.path.exists(os_image_path):
                            image_path = f"docker-icons/{base_name}{ext}"
                            break

            base_url = request.headers.get("X-Forwarded-Host", request.url_root)
            parsed_url = urlparse(base_url)

            base_url_without_scheme_or_www = parsed_url.hostname
            if base_url_without_scheme_or_www.startswith("www."):
                base_url_without_scheme_or_www = base_url_without_scheme_or_www[4:]

            if not is_valid_hostname(base_url_without_scheme_or_www):
                service_url = None
            else:
                host_header = request.headers.get("Host", base_url_without_scheme_or_www)
                parsed_host = urlparse(f"//{host_header}")
                final_host = parsed_host.netloc

                if container.name in ports_config:
                    ports_list = ports_config[container.name]
                    if "" in ports_list or "hostmode" in ports_list:
                        service_url = None
                    else:
                        sanitized_port = sanitize_port(ports_list[0])
                        if sanitized_port:
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
                            service_url = f"//{final_host}/app/{sanitized_port}"
                        else:
                            service_url = None
                    else:
                        service_url = None

            display_name = get_display_name_for_container(container.name)

            basic_data = {"name": container.name, "display_name": display_name, "id": container.short_id, "status": container.status, "image": str(container.image.tags[0]) if container.image.tags else "", "image_path": image_path, "usagePercent": cpu_usage.get(container.name, 0), "memoryUsagePercent": memory_usage.get(container.name, 0), "networkRxBytes": network_rx_bytes.get(container.name, 0), "networkTxBytes": network_tx_bytes.get(container.name, 0), "statusColor": statusColor, "host": base_url_without_scheme_or_www, "composeLink": file_status, "ports": ports_list, "service_url": service_url, "has_update": updates_dict.get(container.name, False)}

            if "HDGroup" in labels:
                basic_data["HDGroup"] = labels["HDGroup"]
            if "HDRole" in labels:
                basic_data["HDRole"] = labels["HDRole"]

            container_data.append(basic_data)

        except Exception as e:
            print(f"Warning: Could not process container {container.name}: {e}")
            continue

    return jsonify(container_data)


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
