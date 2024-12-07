"""
hd_LogCPUUsage.py
Copyright © 2023-2025 Banshee
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

cpu_usages = []


def get_cpu_usage():
    try:
        cpu_usage = psutil.cpu_percent(interval=0.1)
        cpu_usages.append(cpu_usage)
        return "{:.2f}".format(cpu_usage)
    except IOError as e:
        print("Error obtaining current usage of CPU: ", e)
        return None


def start_log_sample_cpu_usage():
    sample_count = 0
    while True:
        get_cpu_usage()
        sample_count += 1
        if sample_count == 100:
            if cpu_usages:
                avg_usage = sum(cpu_usages) / len(cpu_usages)
                max_usage = max(cpu_usages)
                min_usage = min(cpu_usages)
                log_usage(avg_usage, max_usage, min_usage)

                cpu_usages.clear()
                sample_count = 0
        time.sleep(3)


def log_usage(avg_usage, max_usage, min_usage):
    log_path = os.path.join(current_directory, "logs", "cpuusage.log")

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


cpu_usage_sampling_thread = Thread(target=start_log_sample_cpu_usage, daemon=True)
cpu_usage_sampling_thread.start()
