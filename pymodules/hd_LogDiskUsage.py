"""
hd_LogDiskUsage.py
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

HOURS_TO_KEEP = 48
VALUES_PER_HOUR = 12
TOTAL_VALUES_TO_KEEP = HOURS_TO_KEEP * VALUES_PER_HOUR

disk_usages = []


def get_disk_usage():
    try:
        if os.name == "posix":
            disk_path = "/"
        elif os.name == "nt":
            disk_path = "C:\\"
        else:
            print("Sistema operativo no reconocido")
            return None

        disk_usage = psutil.disk_usage(disk_path)
        disk_percent = disk_usage.percent
        disk_percent = round(disk_percent, 2)

        disk_usages.append(disk_percent)

        return disk_percent

    except Exception as e:
        print("Error obtaining disk usage: ", e)
        return None


def start_log_sample_disk_usage():
    sample_count = 0
    while True:
        get_disk_usage()
        sample_count += 1
        if sample_count == 100:

            if disk_usages:
                avg_usage = sum(disk_usages) / len(disk_usages)
                log_disk_usage(avg_usage)

                disk_usages.clear()
                sample_count = 0
        time.sleep(3)


def log_disk_usage(avg_usage):
    log_path = os.path.join(current_directory, "logs", "diskusage.log")

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


disk_sampling_thread = Thread(target=start_log_sample_disk_usage, daemon=True)
disk_sampling_thread.start()
