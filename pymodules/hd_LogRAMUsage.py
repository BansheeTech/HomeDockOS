"""
hd_LogRAMUsage.py
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

ram_usages = []


def get_ram_usage():
    try:
        ram_percent = psutil.virtual_memory().percent
        ram_usages.append(ram_percent)
        return ram_percent
    except Exception as e:
        print("Error al obtener el uso de RAM:", e)
        return None


def start_log_sample_ram_usage():
    sample_count = 0
    while True:
        get_ram_usage()
        sample_count += 1
        if sample_count == 100:

            if ram_usages:
                avg_usage = sum(ram_usages) / len(ram_usages)
                max_usage = max(ram_usages)
                min_usage = min(ram_usages)
                log_ram_usage(avg_usage, max_usage, min_usage)

                ram_usages.clear()
                sample_count = 0
        time.sleep(3)


def log_ram_usage(avg_usage, max_usage, min_usage):
    log_path = os.path.join(current_directory, "logs", "ramusage.log")

    try:
        with open(log_path, "r") as log_file:
            existing_values = log_file.readlines()
    except FileNotFoundError:
        existing_values = []

    timestamp = datetime.now().strftime("%H:%M")

    log_entry = f"{timestamp}*{avg_usage:.2f}*{max_usage:.2f}*{min_usage:.2f}\n"
    existing_values.append(log_entry)

    values_to_keep = existing_values[-TOTAL_VALUES_TO_KEEP:]

    with open(log_path, "w") as log_file:
        log_file.writelines(values_to_keep)


ram_sampling_thread = Thread(target=start_log_sample_ram_usage, daemon=True)
ram_sampling_thread.start()
