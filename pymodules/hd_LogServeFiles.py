"""
hd_LogServeFiles.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
from flask import jsonify, make_response
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsMain import get_configured_external_drives


@login_required
def serve_logins():
    logindata = []
    try:
        with open(os.path.join(current_directory, "logs", "loginattempts.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("***")
                if len(parts) == 4:
                    timestamp, status, ip, users = parts
                    logindata.append({"timestamp": timestamp, "status": status, "ip": ip, "users": users})
                else:
                    print(f"Unexpected line format: {line}")
        return jsonify(logindata)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_temperature():
    temperatures = []
    try:
        with open(os.path.join(current_directory, "logs", "cputemp.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("*")
                if len(parts) == 4:
                    timestamp, avg, max_temp, min_temp = parts
                    temperatures.append({"timestamp": timestamp, "avg": float(avg), "max": float(max_temp), "min": float(min_temp)})
                else:
                    print(f"Unexpected line format: {line}")
        return jsonify(temperatures)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_cpu_usage():
    cpu_usages = []
    try:
        with open(os.path.join(current_directory, "logs", "cpuusage.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("*")
                if len(parts) == 4:
                    timestamp, avg_usage, max_usage, min_usage = parts
                    cpu_usages.append({"timestamp": timestamp, "avg": float(avg_usage), "max": float(max_usage), "min": float(min_usage)})
        return jsonify(cpu_usages)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_ram_usage():
    ram_usages = []
    try:
        with open(os.path.join(current_directory, "logs", "ramusage.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("*")
                if len(parts) == 4:
                    timestamp, avg_usage, max_usage, min_usage = parts
                    ram_usages.append({"timestamp": timestamp, "avg": float(avg_usage), "max": float(max_usage), "min": float(min_usage)})
                else:
                    print(f"Unexpected line format: {line}")
        return jsonify(ram_usages)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_network_usage():
    network_usages = []
    try:
        with open(os.path.join(current_directory, "logs", "networkusage.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("*")
                if len(parts) == 3:
                    timestamp, download_data, upload_data = parts
                    network_usages.append({"timestamp": timestamp, "download": float(download_data), "upload": float(upload_data)})
                else:
                    print(f"Unexpected line format: {line}")
        return jsonify(network_usages)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_disk_usage():
    disk_usages = []
    try:
        with open(os.path.join(current_directory, "logs", "diskusage.log"), "r") as file:
            for line in file.readlines():
                parts = line.strip().split("*")
                if len(parts) == 2:
                    timestamp, avg_usage = parts
                    disk_usages.append({"timestamp": timestamp, "avg": float(avg_usage)})
                else:
                    print(f"Unexpected line format: {line}")
        return jsonify(disk_usages)
    except Exception as e:
        return handle_log_errors(e)


@login_required
def serve_external_disk_usage():
    disk_usages = []
    try:
        if get_configured_external_drives() == "disabled":
            return make_response(jsonify({"error": "External disk is disabled"}), 404)
        with open(os.path.join(current_directory, "logs", "externaldiskusage.log"), "r") as file:
            for line in file.readlines():
                timestamp, avg_usage = line.strip().split("*")
                disk_usages.append({"timestamp": timestamp, "avg": float(avg_usage)})
        return jsonify(disk_usages)
    except Exception as e:
        return handle_log_errors(e)


def handle_log_errors(e):
    if isinstance(e, FileNotFoundError):
        return make_response(jsonify({"error": "No data available yet"}), 404)
    elif isinstance(e, UnicodeDecodeError):
        return make_response(jsonify({"error": "Error decoding log file"}), 500)
    elif isinstance(e, PermissionError):
        return make_response(jsonify({"error": "Permission denied"}), 403)
    elif isinstance(e, (IOError, OSError)):
        return make_response(jsonify({"error": "Error accessing log file"}), 500)
    elif isinstance(e, ValueError):
        return make_response(jsonify({"error": "Value error processing file"}), 500)
    else:
        print(f"Unexpected error reading file: {e}")
        return make_response(jsonify({"error": "Error reading log file"}), 500)
