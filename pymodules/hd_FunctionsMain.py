"""
hd_FunctionsMain.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import time
import psutil
import docker
import configparser

from datetime import datetime, timedelta

from pymodules.hd_FunctionsGlobals import current_directory, running_OS
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_ClassDockerComposeHelper import DockerComposeHelper
from pymodules.hd_ExternalDriveManager import get_external_drive_info

start_time = datetime.now()


def check_docker():
    try:
        manager = DockerClientManager.get_instance()
        client = manager.get_client()

        client.ping()

        version_info = client.version()
        version = version_info.get("Version", "unknown")

        return True, f"Docker is installed and running (v{version})"

    except docker.errors.DockerException as e:
        return False, f"Docker error: {e}"
    except Exception as e:
        return False, f"Docker is not installed or not running: {e}"


def check_docker_compose():
    try:
        compose_helper = DockerComposeHelper.get_instance()
        success, version = compose_helper.get_version()

        if success:
            return True, version
        else:
            return False, "Docker Compose not available"

    except RuntimeError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Error detecting Docker Compose: {e}"


def validate_docker_installation():
    is_docker_running, message = check_docker()

    if not is_docker_running:
        print(" * " + message)
        print(" * Please install Docker and ensure it is running to use HomeDock OS")
        exit(1)


def validate_docker_compose_installation():
    is_docker_compose_installed, message = check_docker_compose()

    if not is_docker_compose_installed:
        print(" * " + message)
        print(" * Please install Docker-Compose to use HomeDock OS")
        exit(1)


def init_color_if_windows():
    if running_OS == "Windows":
        from colorama import init

        init()


def sanitize_input(input_str):
    sanitized_str = re.sub(r"[^a-zA-Z0-9]", "", input_str)

    if any(substring in sanitized_str for substring in ["***", "&&&"]):
        return "Invalid input."

    if len(sanitized_str) > 50:
        return "Input too long."

    return sanitized_str


def ensure_logs_directory():
    logs_directory = os.path.join(current_directory, "logs")
    if not os.path.exists(logs_directory):
        os.makedirs(logs_directory)


def get_cpu_cores():
    return psutil.cpu_count(logical=True)


def get_cpu_max_speed():
    cpu_freq = psutil.cpu_freq()
    if cpu_freq is not None:
        return round(cpu_freq.max / 1000, 1)
    else:
        return None


def get_total_ram():
    try:
        ram = psutil.virtual_memory()
        total_ram = ram.total / 1024 / 1024 / 1024
        return round(total_ram, 1)
    except Exception as e:
        print("Error al obtener la cantidad total de RAM:", e)
        return None


def get_total_disk():
    try:
        disk_usage = psutil.disk_usage("/")
        total_disk = disk_usage.total / 1024 / 1024 / 1024
        return round(total_disk)
    except Exception as e:
        print("Error al obtener la cantidad total de espacio en disco:", e)
        return None


def get_configured_external_drives():
    config_file = os.path.join(current_directory, "homedock_server.conf")
    config = configparser.ConfigParser()

    try:
        config.read(config_file)
        external_drive = config["Config"].get("default_external_drive", "null")
        if external_drive == "disabled" or external_drive == "null":
            return "disabled"
        else:
            return [external_drive]
    except (FileNotFoundError, KeyError):
        return "disabled"


def get_total_external_disk():
    configured_drive = get_configured_external_drives()
    if configured_drive == "disabled":
        return "0GB"

    info = get_external_drive_info(configured_drive[0])
    if info:
        total_disk_gb = info["total_gb"]
        return f"{round(total_disk_gb)}"

    return None


def get_total_containers():
    try:
        manager = DockerClientManager.get_instance()
        client = manager.get_client()
        containers = client.containers.list(all=True)
        return len(containers)

    except docker.errors.DockerException as e:
        print("Error interacting with Docker:", e)
        return -1


def get_active_containers():
    try:
        manager = DockerClientManager.get_instance()
        client = manager.get_client()
        containers = client.containers.list()
        return len(containers)

    except docker.errors.DockerException as e:
        print("Error interacting with Docker:", e)
        return []


def actual_uptime():
    try:
        uptime_seconds = time.time() - psutil.boot_time()
        uptime_timedelta = timedelta(seconds=uptime_seconds)

        days = uptime_timedelta.days
        hours, remainder = divmod(uptime_timedelta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)

        if days > 0:
            return "{}d:{:02d}:{:02d}".format(days, hours, minutes)
        else:
            return "{:02d}:{:02d}".format(hours, minutes)

    except Exception as e:
        print("Error getting system uptime:", e)
        return None


def get_server_uptime():
    try:
        current_time = datetime.now()
        script_uptime = current_time - start_time
        hours, remainder = divmod(script_uptime.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return "{:02d}:{:02d}".format(int(hours), int(minutes))
    except Exception as e:
        print("Error getting HomeDock OS uptime:", e)
        return None


def get_active_network_interface():
    net_io_counters = psutil.net_io_counters(pernic=True)
    max_data = 0
    max_interface = None

    ignore_prefixes = ["lo", "veth", "br-", "docker0", "tun", "tap", "virbr"]
    ignore_substrings = ["Loopback Pseudo-Interface", "isatap", "Teredo Tunneling"]

    for interface_name, data in net_io_counters.items():
        if any(interface_name.startswith(prefix) for prefix in ignore_prefixes):
            continue
        if any(substring in interface_name for substring in ignore_substrings):
            continue
        total_data = data.bytes_sent + data.bytes_recv
        if total_data > max_data:
            max_data = total_data
            max_interface = interface_name

    return max_interface


def copy_file(original_path, new_path):
    with open(original_path, "rb") as file:
        data = file.read()
        with open(new_path, "wb") as new_file:
            new_file.write(data)


def remove_directory_and_contents(path):
    for root, dirs, files in os.walk(path, topdown=False):
        for name in files:
            os.remove(os.path.join(root, name))
        for name in dirs:
            os.rmdir(os.path.join(root, name))
    os.rmdir(path)
