"""
hd_LogCPUTemp.py
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
VALUES_PER_HOUR = 12  # 12/hr=576max
TOTAL_VALUES_TO_KEEP = HOURS_TO_KEEP * VALUES_PER_HOUR

temperatures = []
common_sensor_names = ["coretemp", "cpu_thermal", "k10temp", "TC0P", "TC0H"]
cpu_error_message_shown = False


def get_cpu_temp():
    global cpu_error_message_shown
    try:
        sensor_info = psutil.sensors_temperatures()

        for sensor in common_sensor_names:
            if sensor in sensor_info:
                temp_info = sensor_info[sensor]
                if temp_info:
                    cpu_temp = round(temp_info[0].current, 2)
                    temperatures.append(cpu_temp)
                    return cpu_temp

        for sensor, entries in sensor_info.items():
            for entry in entries:
                if "cpu" in sensor.lower() or "cpu" in entry.label.lower():
                    cpu_temp = round(entry.current, 2)
                    temperatures.append(cpu_temp)
                    return cpu_temp

        temperatures.append(0)
        return 0

    except Exception as e:
        if not cpu_error_message_shown:
            print(" * Error obtaining CPU temp:", e)
            cpu_error_message_shown = True
        temperatures.append(0)
        return 0


def start_log_sample_cpu_temp():
    sample_count = 0
    while True:
        get_cpu_temp()
        sample_count += 1
        if sample_count == 100:  # 5 min (100 * 3 sec) - Must be 100
            if temperatures:
                avg_temp = sum(temperatures) / len(temperatures)
                max_temp = max(temperatures)
                min_temp = min(temperatures)
                log_temperature(avg_temp, max_temp, min_temp)
                temperatures.clear()
                sample_count = 0
        time.sleep(3)


def log_temperature(avg_temp, max_temp, min_temp):
    log_path = os.path.join(current_directory, "logs", "cputemp.log")

    try:
        with open(log_path, "r") as log_file:
            existing_values = log_file.readlines()
    except FileNotFoundError:
        existing_values = []

    timestamp = datetime.now().strftime("%H:%M")

    log_entry = f"{timestamp}*{avg_temp:.2f}*{max_temp:.2f}*{min_temp:.2f}\n"
    existing_values.append(log_entry)

    values_to_keep = existing_values[-TOTAL_VALUES_TO_KEEP:]

    with open(log_path, "w") as log_file:
        log_file.writelines(values_to_keep)


cpu_sampling_thread = Thread(target=start_log_sample_cpu_temp, daemon=True)
cpu_sampling_thread.start()
