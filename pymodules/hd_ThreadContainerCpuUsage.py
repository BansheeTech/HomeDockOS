"""
hd_ThreadContainerCpuUsage.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import time
import json
import docker

from threading import Thread

from pymodules.hd_ClassDockerClientManager import DockerClientManager

cpu_usage = {}


def update_cpu_usage():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    global cpu_usage
    while True:
        current_containers = client.containers.list()
        current_container_names = set(container.name for container in current_containers)

        inactive_containers = set(cpu_usage.keys()) - current_container_names
        for container_name in inactive_containers:
            print(f" + THREAD: Container {container_name} was stopped, cleaning up CPU usage entry")
            del cpu_usage[container_name]

        for container in current_containers:
            try:
                stats = container.stats(stream=False)
                cpu_delta = float(stats["cpu_stats"]["cpu_usage"]["total_usage"]) - float(stats["precpu_stats"]["cpu_usage"].get("total_usage", 0))
                system_delta = float(stats["cpu_stats"]["system_cpu_usage"]) - float(stats["precpu_stats"].get("system_cpu_usage", 0))

                cpu_usage[container.name] = round(cpu_delta / system_delta * 100.0, 1) if system_delta > 0.0 else 0.0

            except (KeyError, docker.errors.NotFound) as e:
                msg = {KeyError: f" + THREAD: Container {container.name} was stopped or removed so can't check CPU usage stats, assigned 0.0", docker.errors.NotFound: f" + THREAD: Container {container.name} was not found. It may have been updated or deleted", json.JSONDecodeError: f" + THREAD: Failed to decode JSON for container {container.name}. It may have been updated or deleted"}.get(type(e), f" + THREAD: Unknown error for container {container.name}, there will be a new check")

                print(msg)

        time.sleep(10)


def start_cpu_usage_thread():
    thread = Thread(target=update_cpu_usage, daemon=True)
    thread.start()
