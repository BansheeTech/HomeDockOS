"""
hd_FunctionsActiveInstance.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import socket
import uuid
import hashlib
import requests
import json
import threading

from datetime import datetime, timezone

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version, running_OS
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_ConfigEventManager import register_listener

CloudFlareWorker = "https://homedock-os-user.banshee-devs.workers.dev/"

service_thread = None
stop_service = threading.Event()


def is_connected():
    try:
        socket.create_connection(("1.1.1.1", 80), timeout=2)
        return True
    except OSError:
        return False


def generate_uuid():  # 128bit entropy hash
    hostname = socket.gethostname()
    trimmed_hashed_host = hashlib.sha256(hostname.encode()).hexdigest()[:32]

    mac_address = ":".join(f"{(uuid.getnode() >> i) & 0xff:02x}" for i in range(0, 48, 8))
    trimmed_hashed_mac = hashlib.sha256(mac_address.encode()).hexdigest()[:32]

    now = datetime.now(timezone.utc)
    month = f"{now.month:02}"
    year = now.year

    unique_string = f"M{month}-Y{year}-H{trimmed_hashed_host}-M{trimmed_hashed_mac}"

    hash_uuid = hashlib.sha256(unique_string.encode()).hexdigest()
    return str(uuid.UUID(hash_uuid[:32]))


def service_heartbeat_loop():
    global service_thread
    while not stop_service.is_set():
        if is_connected():
            uid = generate_uuid()
            payload = {
                "uuid": uid,
                "underlying_os": "Docker" if is_docker else running_OS,
                "homedock_version": version,
            }
            headers = {"Content-Type": "application/json"}
            try:
                requests.post(CloudFlareWorker, headers=headers, data=json.dumps(payload), timeout=5)
            except requests.RequestException:
                pass

        stop_service.wait(timeout=43200)

    service_thread = None


def start_service_daemon():
    global service_thread
    if service_thread is None or not service_thread.is_alive():
        stop_service.clear()
        service_thread = threading.Thread(target=service_heartbeat_loop, daemon=True)
        service_thread.start()


def stop_service_daemon():
    global service_thread
    if service_thread and service_thread.is_alive():
        stop_service.set()
        service_thread = None


def check_service_state(new_config):
    is_disabled = new_config.get("disable_usage_data", False)
    if is_disabled:
        stop_service_daemon()
    else:
        start_service_daemon()


def active_instance():
    initial_config = read_config()
    check_service_state(initial_config)
    register_listener(check_service_state)
