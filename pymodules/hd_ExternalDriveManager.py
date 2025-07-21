"""
hd_ExternalDriveManager.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import psutil
from pymodules.hd_FunctionsGlobals import running_OS


def get_valid_external_drives():
    valid_drives = []

    try:
        partitions = psutil.disk_partitions()

        for partition in partitions:
            device = partition.device
            mountpoint = partition.mountpoint

            if running_OS == "Linux":
                if "sd" in device:
                    if mountpoint and os.path.exists(mountpoint):
                        valid_drives.append(device)

            elif running_OS == "Darwin":
                if device.startswith("/dev/disk") and not device.startswith("/dev/disk0") and not device.startswith("/dev/disk1"):
                    if mountpoint and mountpoint.startswith("/Volumes/"):
                        valid_drives.append(device)

            elif running_OS == "Windows":
                if device != "C:\\" and mountpoint:
                    valid_drives.append(device)

    except Exception as e:
        print(f"Error detecting external drives: {e}")

    return valid_drives


def get_default_external_drive():
    valid_drives = get_valid_external_drives()

    if valid_drives:
        return valid_drives[0]
    else:
        return "disabled"


def is_valid_external_drive(device_path):
    if not device_path or device_path == "disabled":
        return False

    valid_drives = get_valid_external_drives()
    return device_path in valid_drives


def get_external_drive_info(device_path):
    if not device_path or device_path == "disabled":
        return None

    try:
        partitions = psutil.disk_partitions()

        for partition in partitions:
            if partition.device == device_path:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    total_gb = round(usage.total / (1024**3), 2)
                    used_gb = round(usage.used / (1024**3), 2)
                    free_gb = round(usage.free / (1024**3), 2)
                    usage_percent = round((usage.used / usage.total) * 100, 1)
                except:
                    total_gb = used_gb = free_gb = usage_percent = 0

                return {"device": partition.device, "mountpoint": partition.mountpoint, "fstype": partition.fstype, "total_gb": total_gb, "used_gb": used_gb, "free_gb": free_gb, "usage_percent": usage_percent}

    except Exception as e:
        print(f"Error getting external drive info for {device_path}: {e}")

    return None
