"""
hd_ThreadContainerResourceUsage.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import time
import json
import docker

from threading import Thread

from pymodules.hd_ClassDockerClientManager import DockerClientManager

cpu_usage = {}
memory_usage = {}
network_rx_bytes = {}
network_tx_bytes = {}


def update_resource_usage():

    manager = DockerClientManager.get_instance()
    client = manager.get_client()

    global cpu_usage, memory_usage, network_rx_bytes, network_tx_bytes
    while True:
        current_containers = client.containers.list()
        current_container_names = set(container.name for container in current_containers)

        inactive_containers = set(cpu_usage.keys()) - current_container_names
        for container_name in inactive_containers:
            print(f" + THREAD: Container {container_name} was stopped, cleaning up resource usage entries")
            del cpu_usage[container_name]
            if container_name in memory_usage:
                del memory_usage[container_name]
            if container_name in network_rx_bytes:
                del network_rx_bytes[container_name]
            if container_name in network_tx_bytes:
                del network_tx_bytes[container_name]

        temp_cpu = {}
        temp_memory = {}
        temp_network_rx = {}
        temp_network_tx = {}

        for container in current_containers:
            try:
                stats = container.stats(stream=False)

                cpu_delta = float(stats["cpu_stats"]["cpu_usage"]["total_usage"]) - float(stats["precpu_stats"]["cpu_usage"].get("total_usage", 0))
                system_delta = float(stats["cpu_stats"]["system_cpu_usage"]) - float(stats["precpu_stats"].get("system_cpu_usage", 0))
                temp_cpu[container.name] = round(cpu_delta / system_delta * 100.0, 1) if system_delta > 0.0 else 0.0

                mem_stats = stats.get("memory_stats", {})
                mem_usage_val = mem_stats.get("usage", 0)
                mem_limit = mem_stats.get("limit", 1)

                memory_percent = round((mem_usage_val / mem_limit) * 100.0, 1) if mem_limit > 0 else 0.0
                temp_memory[container.name] = memory_percent

                total_rx = 0
                total_tx = 0
                for network_name, network_stats in stats.get("networks", {}).items():
                    total_rx += network_stats.get("rx_bytes", 0)
                    total_tx += network_stats.get("tx_bytes", 0)
                temp_network_rx[container.name] = total_rx
                temp_network_tx[container.name] = total_tx

            except (KeyError, docker.errors.NotFound, json.JSONDecodeError, Exception) as e:
                msg = {KeyError: f" + THREAD: Container {container.name} was stopped or removed so can't check resource usage stats, assigned 0.0", docker.errors.NotFound: f" + THREAD: Container {container.name} was not found. It may have been updated or deleted", json.JSONDecodeError: f" + THREAD: Failed to decode JSON for container {container.name}. It may have been updated or deleted"}.get(type(e), f" + THREAD: Unknown error for container {container.name}, there will be a new check")

                print(msg)

        groups = {}
        for container in current_containers:
            labels = container.labels
            hd_group = labels.get("HDGroup")
            hd_role = labels.get("HDRole")

            if hd_group:
                if hd_group not in groups:
                    groups[hd_group] = {"main": None, "members": []}

                groups[hd_group]["members"].append(container.name)

                if hd_role == "main":
                    groups[hd_group]["main"] = container.name

        for container in current_containers:
            labels = container.labels
            hd_group = labels.get("HDGroup")
            hd_role = labels.get("HDRole")

            if hd_group and hd_role == "main":
                group_members = groups[hd_group]["members"]
                total_cpu = sum(temp_cpu.get(member, 0.0) for member in group_members)
                total_memory = sum(temp_memory.get(member, 0.0) for member in group_members)
                total_rx = sum(temp_network_rx.get(member, 0) for member in group_members)
                total_tx = sum(temp_network_tx.get(member, 0) for member in group_members)

                member_count = len(group_members)
                avg_cpu = total_cpu / member_count if member_count > 0 else 0.0
                avg_memory = total_memory / member_count if member_count > 0 else 0.0

                cpu_usage[container.name] = round(min(avg_cpu, 100.0), 1)
                memory_usage[container.name] = round(min(avg_memory, 100.0), 1)
                network_rx_bytes[container.name] = total_rx
                network_tx_bytes[container.name] = total_tx
            else:
                cpu_usage[container.name] = temp_cpu.get(container.name, 0.0)
                memory_usage[container.name] = temp_memory.get(container.name, 0.0)
                network_rx_bytes[container.name] = temp_network_rx.get(container.name, 0)
                network_tx_bytes[container.name] = temp_network_tx.get(container.name, 0)

        time.sleep(10)


def start_resource_usage_thread():
    thread = Thread(target=update_resource_usage, daemon=True)
    thread.start()
