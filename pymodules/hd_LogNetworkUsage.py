"""
hd_LogNetworkUsage.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import time
import psutil

from datetime import datetime
from threading import Thread

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsMain import get_active_network_interface

HOURS_TO_KEEP = 48
VALUES_PER_HOUR = 12
TOTAL_VALUES_TO_KEEP = HOURS_TO_KEEP * VALUES_PER_HOUR

network_data_samples = []
log_path = os.path.join(current_directory, "logs", "networkusage.log")


def get_download_data(interface_name):
    try:
        psutil.net_io_counters.cache_clear()
        interface_data = psutil.net_io_counters(pernic=True)[interface_name]

        bytes_received_gb = round(interface_data.bytes_recv / (1024.0 * 1024.0 * 1024.0), 2)

        psutil.net_io_counters.cache_clear()
        return {"received": bytes_received_gb}
    except KeyError:
        return {"received": None}


def get_upload_data(interface_name):
    try:
        psutil.net_io_counters.cache_clear()

        interface_data = psutil.net_io_counters(pernic=True)[interface_name]

        bytes_sent_gb = round(interface_data.bytes_sent / (1024.0 * 1024.0 * 1024.0), 2)

        psutil.net_io_counters.cache_clear()
        return {"sent": bytes_sent_gb}
    except KeyError:
        return {"sent": None}


def start_log_sample_network_usage():
    sample_count = 0
    while True:
        interface_name = get_active_network_interface()
        download_data = get_download_data(interface_name)
        upload_data = get_upload_data(interface_name)

        if download_data["received"] is not None and upload_data["sent"] is not None:
            network_data_samples.append((download_data["received"], upload_data["sent"]))
            sample_count += 1

        if sample_count == 100:
            if network_data_samples:
                avg_download_data = sum(x[0] for x in network_data_samples) / len(network_data_samples)
                avg_upload_data = sum(x[1] for x in network_data_samples) / len(network_data_samples)
                log_network_usage(avg_download_data, avg_upload_data)
                network_data_samples.clear()
                sample_count = 0
        time.sleep(3)


def log_network_usage(download_data, upload_data):
    timestamp = datetime.now().strftime("%H:%M")

    log_entry = f"{timestamp}*{download_data:.2f}*{upload_data:.2f}\n"

    try:
        with open(log_path, "r") as log_file:
            existing_values = log_file.readlines()
    except FileNotFoundError:
        existing_values = []

    existing_values.append(log_entry)

    values_to_keep = existing_values[-TOTAL_VALUES_TO_KEEP:]

    with open(log_path, "w") as log_file:
        log_file.writelines(values_to_keep)


network_sampling_thread = Thread(target=start_log_sample_network_usage, daemon=True)
network_sampling_thread.start()
