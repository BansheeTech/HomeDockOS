"""
hd_UIDashboardThreads.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import time

from flask import jsonify
from flask_login import login_required
from threading import Thread

from pymodules.hd_FunctionsMain import get_total_containers, get_active_containers
from pymodules.hd_FunctionsMain import actual_uptime, get_server_uptime
from pymodules.hd_FunctionsMain import get_active_network_interface
from pymodules.hd_FunctionsMain import get_total_disk

from pymodules.hd_LogCPUTemp import get_cpu_temp
from pymodules.hd_LogCPUUsage import get_cpu_usage
from pymodules.hd_LogRAMUsage import get_ram_usage
from pymodules.hd_LogNetworkUsage import get_download_data, get_upload_data
from pymodules.hd_LogDiskUsage import get_disk_usage
from pymodules.hd_LogExternalDiskUsage import get_external_disk_usage

interface_name = get_active_network_interface()


@login_required
def online_status():
    return jsonify({"status": "online"}), 200


@login_required
def homedock_cpu_temp():
    return jsonify(cpu_temp=get_cpu_temp())


@login_required
def homedock_cpu_usage():
    cpu_usage = get_cpu_usage()
    return jsonify(cpu_usage=cpu_usage)


@login_required
def homedock_ram_usage():
    return jsonify(ram_usage=get_ram_usage())


@login_required
def homedock_disk_usage():
    return jsonify(disk_usage=get_disk_usage(), disk_total=get_total_disk())


@login_required
def homedock_external_disk_usage():

    return jsonify(usage=get_external_disk_usage())


def update_download_data_thread(interface_name):
    global download_data
    while True:
        download_data = get_download_data(interface_name)["received"]
        time.sleep(3)


download_data_thread = Thread(target=update_download_data_thread, args=(interface_name,), daemon=True)
download_data_thread.start()


@login_required
def downloaded_data():
    try:
        JSON_download_data = {"download_data": download_data}
        return jsonify(JSON_download_data)
    except Exception as e:
        print(f"Exception in download_data: {e}")
        return jsonify({"error": "Unable to retrieve download data"}), 500


def update_upload_data_thread(interface_name):
    global upload_data
    while True:
        upload_data = get_upload_data(interface_name)["sent"]
        time.sleep(3)


upload_data_thread = Thread(target=update_upload_data_thread, args=(interface_name,), daemon=True)
upload_data_thread.start()


@login_required
def uploaded_data():
    try:
        JSON_upload_data = {"upload_data": upload_data}
        return jsonify(JSON_upload_data)
    except Exception:
        return jsonify({"error": "Unable to retrieve upload data"}), 500


def update_containers_thread():
    global n_total_containers
    while True:
        n_total_containers = get_total_containers()
        time.sleep(3)


thread_installed_containers = Thread(target=update_containers_thread, daemon=True)
thread_installed_containers.start()


@login_required
def get_containers():
    try:
        JSON_containers = {"containers": n_total_containers}
        return jsonify(JSON_containers)
    except Exception:
        return jsonify({"error": "Unable to retrieve containers"}), 500


def update_active_containers_thread():
    global n_active_containers
    while True:
        n_active_containers = get_active_containers()
        time.sleep(3)


active_container_thread = Thread(target=update_active_containers_thread, daemon=True)
active_container_thread.start()


@login_required
def active_containers():
    try:
        JSON_containers = {"active_containers": n_active_containers}
        return jsonify(JSON_containers)
    except Exception:
        return jsonify({"error": "Unable to retrieve active containers"}), 500


def update_uptime():
    global uptime_data
    while True:
        uptime_data = actual_uptime()
        time.sleep(5)


uptime_data = actual_uptime()
thread_update_uptime = Thread(target=update_uptime, daemon=True)
thread_update_uptime.start()


@login_required
def get_uptime():
    try:
        return jsonify({"uptime": uptime_data})
    except Exception as e:
        print(" ! Error getting uptime value: ", e)
        return jsonify({"error": "Unable to retrieve uptime"}), 500


@login_required
def homedock_uptime():
    return jsonify(uptime=get_server_uptime())
