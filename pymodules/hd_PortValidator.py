"""
hd_PortValidator.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import socket
import yaml

from typing import List, Tuple, Optional

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_DockerAPIContainerData import get_display_name_for_container


def extract_ports_from_yml(yml_content: str) -> List[int]:
    try:
        yml_data = yaml.safe_load(yml_content)
    except yaml.YAMLError:
        return []

    ports = []
    services = yml_data.get("services", {})

    for _service_name, service_data in services.items():
        port_mappings = service_data.get("ports", [])

        for port_mapping in port_mappings:
            port_str = str(port_mapping)

            if ":" in port_str:
                host_port = port_str.split(":")[0]
            else:
                host_port = port_str

            host_port = host_port.split("/")[0]

            try:
                port_int = int(host_port)
                if 1 <= port_int <= 65535:
                    ports.append(port_int)
            except ValueError:
                continue

    return ports


def is_port_in_use_system(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("0.0.0.0", port))
            return False
        except socket.error:
            return True


def get_container_using_port(port: int, exclude_container_name: Optional[str] = None) -> Optional[str]:
    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    try:
        containers = client.containers.list(all=True)

        for container in containers:
            if exclude_container_name and container.name == exclude_container_name:
                continue

            ports = container.attrs.get("NetworkSettings", {}).get("Ports", {})

            for _container_port, host_bindings in ports.items():
                if host_bindings:
                    for binding in host_bindings:
                        host_port = binding.get("HostPort")
                        if host_port and int(host_port) == port:
                            display_name = get_display_name_for_container(container.name)
                            return display_name

        return None
    except Exception as e:
        print(f"Error checking Docker containers for port {port}: {e}")
        return None


def validate_ports(yml_content: str, allow_container_name: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[List[int]]]:
    config = read_config()
    homedock_port = config.get("run_port", 80)

    blocked_ports = {80, 443, homedock_port}

    ports = extract_ports_from_yml(yml_content)

    if not ports:
        return True, None, None

    problematic_ports = []
    error_messages = []

    for port in ports:
        if port in blocked_ports:
            if port == homedock_port:
                error_messages.append(f"Port {port}: Reserved for HomeDock OS")
            elif port == 80:
                error_messages.append(f"Port {port}: System HTTP port is blocked")
            elif port == 443:
                error_messages.append(f"Port {port}: System HTTPS port is blocked")

            problematic_ports.append(port)
            continue

        app_name = get_container_using_port(port, exclude_container_name=allow_container_name)
        if app_name:
            error_messages.append(f"Port {port}: Already in use by app '{app_name}'")
            problematic_ports.append(port)
            continue

        any_container_using_port = get_container_using_port(port, exclude_container_name=None)

        if not any_container_using_port and is_port_in_use_system(port):
            error_messages.append(f"Port {port}: Already in use by the system")
            problematic_ports.append(port)

    if problematic_ports:
        full_error = "The following ports are not available:\n\n" + "\n".join(error_messages)
        full_error += "\n\nPlease select different ports for your application."
        return False, full_error, problematic_ports

    return True, None, None
