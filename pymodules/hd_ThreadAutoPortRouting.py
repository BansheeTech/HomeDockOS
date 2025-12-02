"""
hd_ThreadAutoPortRouting.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import time
import docker
import requests
import urllib3

from threading import Thread, Event

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_ClassDockerClientManager import DockerClientManager

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

update_event = Event()


def check_port_availability(port):
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

    urls = [f"https://localhost:{port}", f"http://localhost:{port}"]

    for url in urls:
        try:
            try:
                response = requests.head(url, timeout=2, allow_redirects=True, headers=headers, verify=True)
            except requests.exceptions.SSLError:
                response = requests.head(url, timeout=2, allow_redirects=True, headers=headers, verify=False)

            if response.status_code < 400 or response.status_code in [401, 301, 302, 308]:
                return True

            if response.status_code in [404, 405]:
                try:
                    response = requests.get(url, timeout=2, allow_redirects=True, stream=True, headers=headers, verify=True)
                except requests.exceptions.SSLError:
                    response = requests.get(url, timeout=2, allow_redirects=True, stream=True, headers=headers, verify=False)

                if response.status_code < 400 or response.status_code in [401, 301, 302, 308]:
                    return True

        except requests.RequestException:
            continue

    return False


def sort_ports_by_availability(ports_list, max_retries=3, retry_delay=5):
    for attempt in range(max_retries):
        available_ports = []
        unavailable_ports = []

        for port in ports_list:
            if check_port_availability(port):
                available_ports.append(port)
                print(f" + THREAD: Port {port} is ACTIVE and responding")
            else:
                unavailable_ports.append(port)

        if available_ports:
            return available_ports + unavailable_ports

        if attempt < max_retries - 1:
            print(f" + THREAD: No active ports found, retrying in {retry_delay}s... (attempt {attempt + 1}/{max_retries})")
            time.sleep(retry_delay)

    return available_ports + unavailable_ports


def update_container_ports_config():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    ports_file_name = os.path.join(current_directory, "homedock_ports.conf")

    last_config_dict = {}
    try:
        with open(ports_file_name, "r") as file:
            config_lines = file.readlines()
            for line in config_lines:
                try:
                    split_line = line.strip().split("*")
                    if len(split_line) >= 2:
                        container_name = split_line[0]
                        ports = split_line[1]
                        last_config_dict[container_name] = ports
                except (IndexError, ValueError):
                    print(f" + THREAD: Skipping malformed line in config: {line.strip()}")
                    continue
    except FileNotFoundError:
        pass

    while True:
        update_event.wait()
        try:
            with open(ports_file_name, "r") as file:
                config_lines = file.readlines()
        except FileNotFoundError:
            config_lines = []

        config_dict = {}
        file_corrupted = False
        for line in config_lines:
            try:
                split_line = line.strip().split("*")
                if len(split_line) >= 2:
                    container_name = split_line[0]
                    ports = split_line[1]
                    config_dict[container_name] = ports
                else:
                    file_corrupted = True
            except (IndexError, ValueError):
                file_corrupted = True
                continue

        if file_corrupted:
            print(" + THREAD: Config file corruption detected, rebuilding from containers...")

        try:
            current_containers = client.containers.list(all=True)

            for container_name in list(config_dict.keys()):
                if container_name not in [container.name for container in current_containers] and config_dict[container_name] != "disabled":
                    config_dict[container_name] = "disabled"

            for container in current_containers:
                container_state = container.attrs["State"]["Status"]

                if container_state != "running":
                    continue

                ports = container.attrs["NetworkSettings"]["Ports"]
                ports_set = set()
                for port in ports:
                    if ports[port] is not None:
                        for item in ports[port]:
                            host_port = item["HostPort"]
                            ports_set.add(host_port)

                if ports_set:
                    ports_list = sorted(ports_set)

                    if container.name not in config_dict or config_dict[container.name] == "disabled":
                        print(f" + THREAD: Checking port availability for {container.name}...")
                        ports_list = sort_ports_by_availability(ports_list)

                    ports_string = ":".join(ports_list)
                else:
                    ports_string = "hostmode"

                if container.name not in config_dict:
                    print(f" + THREAD: New ports routed for {container.name} - {ports_string}")
                    config_dict[container.name] = ports_string

                elif config_dict[container.name] == "disabled":
                    print(f" + THREAD: Container {container.name} reappeared - updating ports to {ports_string}")
                    config_dict[container.name] = ports_string

                    last_config_dict[container.name] = None

        except docker.errors.NotFound as e:
            print(f"Error: {e}")

        config_lines = [f"{container_name}*{ports}\n" for container_name, ports in config_dict.items()]

        if config_dict != last_config_dict:
            try:
                with open(ports_file_name, "w") as file:
                    file.writelines(config_lines)
                last_config_dict = dict(config_dict)
            except (IOError, OSError) as e:
                print(f" + THREAD: Failed to write config file: {e}")

        time.sleep(10)


def start_auto_port_routing_thread():
    update_event.set()
    thread = Thread(target=update_container_ports_config, daemon=True)
    thread.start()
