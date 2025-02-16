"""
hd_FunctionsActiveInstance.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import socket
import uuid
import hashlib
import requests
import json
import threading
import time

from pymodules.hd_FunctionsGlobals import version, running_OS

CloudFlareWorker = "https://homedock-os-user.banshee-devs.workers.dev/"


def is_connected():
    try:
        socket.create_connection(("1.1.1.1", 80), timeout=2)
        return True
    except OSError:
        return False


def generate_uuid():
    hostname = socket.gethostname()
    mac_address = ":".join(f"{(uuid.getnode() >> i) & 0xff:02x}" for i in range(0, 48, 8))

    unique_string = f"{hostname}-{mac_address}"
    hash_uuid = hashlib.sha256(unique_string.encode()).hexdigest()
    return str(uuid.UUID(hash_uuid[:32]))


def send_active_instance():
    while True:
        if is_connected():
            uuid = generate_uuid()
            payload = {
                "uuid": uuid,
                "underlying_os": running_OS,
                "homedock_version": version,
            }

            headers = {"Content-Type": "application/json"}

            try:
                requests.post(CloudFlareWorker, headers=headers, data=json.dumps(payload), timeout=5)
            except requests.RequestException:
                pass

        time.sleep(43200)


def active_instance_daemon():
    telemetry_thread = threading.Thread(target=send_active_instance, daemon=True)
    telemetry_thread.start()


def active_instance():
    active_instance_daemon()
