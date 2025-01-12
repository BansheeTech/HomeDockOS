"""
hd_ThreadAutoPortRouting.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import time
import docker

from threading import Thread, Event

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_ClassDockerClientManager import DockerClientManager

update_event = Event()


def update_container_ports_config():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    ports_file_name = os.path.join(current_directory, "homedock_ports.conf")

    last_config_dict = {}
    try:
        with open(ports_file_name, "r") as file:
            config_lines = file.readlines()
            for line in config_lines:
                split_line = line.strip().split("*")
                container_name = split_line[0]
                ports = split_line[1]
                last_config_dict[container_name] = ports
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
        for line in config_lines:
            split_line = line.strip().split("*")
            container_name = split_line[0]
            ports = split_line[1]
            config_dict[container_name] = ports

        try:
            current_containers = client.containers.list(all=True)

            for container_name in list(config_dict.keys()):
                if container_name not in [container.name for container in current_containers] and config_dict[container_name] != "disabled":
                    config_dict[container_name] = "disabled"

            for container in current_containers:
                ports = container.attrs["NetworkSettings"]["Ports"]
                ports_set = set()
                for port in ports:
                    if ports[port] is not None:
                        for item in ports[port]:
                            host_port = item["HostPort"]
                            ports_set.add(host_port)
                ports_list = sorted(ports_set)
                ports_string = ":".join(ports_list) if ports_list else "hostmode"

                if container.name not in config_dict:
                    print(f" + THREAD: New ports routed for {container.name} - {ports_string}")
                    config_dict[container.name] = ports_string

                elif config_dict[container.name] == "disabled":
                    print(f" + THREAD: Container {container.name} reappeared - updating ports to {ports_string}")
                    config_dict[container.name] = ports_string

                    last_config_dict[container.name] = None

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
            with open(ports_file_name, "w") as file:
                file.writelines(config_lines)
            last_config_dict = dict(config_dict)

        time.sleep(10)


def start_auto_port_routing_thread():
    update_event.set()
    thread = Thread(target=update_container_ports_config, daemon=True)
    thread.start()
