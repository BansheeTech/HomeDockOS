"""
hd_LogExternalDiskUsage.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

import os
import time
import psutil

from datetime import datetime
from threading import Thread

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsMain import get_configured_external_drives

HOURS_TO_KEEP = 48
VALUES_PER_HOUR = 12
TOTAL_VALUES_TO_KEEP = HOURS_TO_KEEP * VALUES_PER_HOUR

external_disk_usages = []
external_disk_enabled = get_configured_external_drives() != "disabled"


def get_external_disk_usage():
    configured_drive = get_configured_external_drives()
    if configured_drive == "disabled":
        return 0
    try:
        for partition in psutil.disk_partitions():
            if partition.device == configured_drive[0]:
                usage = psutil.disk_usage(partition.mountpoint)
                return usage.percent
    except Exception as e:
        print("Error obtaining use of external disk:", e)
    return None


def start_log_sample_external_disk_usage():
    sample_count = 0
    while True:
        configured_drive = get_configured_external_drives()
        if configured_drive != "disabled":
            external_disk_usage = get_external_disk_usage()
            if external_disk_usage != 0:
                external_disk_usages.append(external_disk_usage)
            sample_count += 1
        else:
            external_disk_usages.clear()
            sample_count = 0

        if sample_count == 100:
            if external_disk_usages:
                avg_usage = sum(external_disk_usages) / len(external_disk_usages)
                log_external_disk_usage(avg_usage)
                external_disk_usages.clear()
                sample_count = 0
        time.sleep(3)


def log_external_disk_usage(avg_usage):
    log_path = os.path.join(current_directory, "logs", "externaldiskusage.log")

    try:
        with open(log_path, "r") as log_file:
            existing_values = log_file.readlines()
    except FileNotFoundError:
        existing_values = []

    timestamp = datetime.now().strftime("%H:%M")

    log_entry = f"{timestamp}*{avg_usage:.2f}\n"
    existing_values.append(log_entry)

    values_to_keep = existing_values[-TOTAL_VALUES_TO_KEEP:]

    with open(log_path, "w") as log_file:
        log_file.writelines(values_to_keep)


external_disk_sampling_thread = Thread(target=start_log_sample_external_disk_usage, daemon=True)
external_disk_sampling_thread.start()
