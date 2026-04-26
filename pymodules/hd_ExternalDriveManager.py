"""
hd_ExternalDriveManager.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from pymodules.hd_FunctionsDiskEnum import enumerate_disks, find_disk_by_device
from pymodules.hd_FunctionsGlobals import running_OS


def _gb(bytes_value):
    try:
        return round(bytes_value / (1024**3), 2)
    except Exception:
        return 0


def get_os_root_mountpoint():
    if os.name == "posix":
        if running_OS == "Darwin" and os.path.isdir("/System/Volumes/Data"):
            return "/System/Volumes/Data"
        return "/"
    return "C:\\"


def get_all_disks_summary():
    disks = enumerate_disks()
    os_root = get_os_root_mountpoint()
    summary = []
    for d in disks:
        summary.append(
            {
                "id": d["id"],
                "device": d["device"],
                "mountpoint": d["mountpoint"],
                "label": d["label"],
                "fstype": d["fstype"],
                "total_gb": _gb(d["total"]),
                "used_gb": _gb(d["used"]),
                "free_gb": _gb(d["free"]),
                "usage_percent": d["percent"],
                "media_type": d["media_type"],
                "removable": d["removable"],
                "internal": d["internal"],
                "is_system": d.get("mountpoint") in (os_root, "/"),
            }
        )
    return summary


def get_valid_external_drives():
    os_root = get_os_root_mountpoint()
    drives = []
    for d in enumerate_disks():
        mp = d.get("mountpoint", "")
        if mp in (os_root, "/"):
            continue
        device = d.get("device")
        if device and device not in drives:
            drives.append(device)
    return drives


def get_default_external_drive():
    drives = get_valid_external_drives()
    return drives[0] if drives else "disabled"


def is_valid_external_drive(device_path):
    if not device_path or device_path == "disabled":
        return False
    disk = find_disk_by_device(device_path)
    if disk is None:
        return False
    os_root = get_os_root_mountpoint()
    if disk.get("mountpoint") in (os_root, "/"):
        return False
    return True


def get_external_drive_info(device_path):
    if not device_path or device_path == "disabled":
        return None
    disk = find_disk_by_device(device_path)
    if disk is None:
        return None
    return {
        "device": disk["device"],
        "mountpoint": disk["mountpoint"],
        "fstype": disk["fstype"],
        "total_gb": _gb(disk["total"]),
        "used_gb": _gb(disk["used"]),
        "free_gb": _gb(disk["free"]),
        "usage_percent": disk["percent"],
    }
