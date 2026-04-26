"""
hd_FunctionsDiskEnum.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import hashlib
import psutil

from pymodules.hd_FunctionsGlobals import running_OS
from pymodules.hd_FunctionsHostSelector import is_docker


_PSEUDO_FSTYPES = {
    "proc",
    "sysfs",
    "devpts",
    "devtmpfs",
    "tmpfs",
    "cgroup",
    "cgroup2",
    "overlay",
    "squashfs",
    "pstore",
    "bpf",
    "securityfs",
    "debugfs",
    "tracefs",
    "fusectl",
    "configfs",
    "mqueue",
    "hugetlbfs",
    "fuse.gvfsd-fuse",
    "fuse.portal",
    "autofs",
    "binfmt_misc",
    "rpc_pipefs",
    "nsfs",
    "efivarfs",
    "selinuxfs",
}

_DARWIN_HIDDEN_VOLUMES = (
    "/System/Volumes/Preboot",
    "/System/Volumes/Update",
    "/System/Volumes/VM",
    "/System/Volumes/xarts",
    "/System/Volumes/iSCPreboot",
    "/System/Volumes/Hardware",
    "/System/Volumes/Recovery",
    "/System/Volumes/Data",
)

_DARWIN_HIDDEN_VOLUME_NAME_RE = re.compile(
    r"^(iOS(Runtime)?_|SimRuntimeBundle-|Xcode-|watchOS_|tvOS_|xrOS_|visionOS_|com\.apple\.TimeMachine|com\.apple\.MobileAsset)",
    re.IGNORECASE,
)

_DARWIN_DEVICE_RE = re.compile(r"^/dev/(disk\d+)")

_LINUX_REMOVABLE_MOUNT_PREFIXES = ("/media/", "/run/media/")

_DOCKER_INTERNAL_MOUNTS = (
    "/DATA",
    "/homedock",
    "/etc/hosts",
    "/etc/resolv.conf",
    "/etc/hostname",
)


def disk_id(mountpoint):
    if not mountpoint:
        return ""
    digest = hashlib.sha256(mountpoint.encode("utf-8", errors="replace")).hexdigest()
    return digest[:16]


def _safe_disk_usage(mountpoint):
    try:
        probe = mountpoint
        if running_OS == "Darwin" and mountpoint == "/":
            data_path = "/System/Volumes/Data"
            if os.path.isdir(data_path):
                probe = data_path

        usage = psutil.disk_usage(probe)
        total = int(usage.total)
        free = int(usage.free)
        used = max(int(usage.used), total - free)
        percent = round((used / total) * 100, 1) if total > 0 else 0.0
        return total, used, free, percent
    except Exception:
        return 0, 0, 0, 0.0


def _linux_base_block(device):
    try:
        real = os.path.realpath(device)
        base = os.path.basename(real)
        if not base:
            return ""
        if base.startswith("nvme"):
            m = re.match(r"^(nvme\d+n\d+)p\d+$", base)
            if m:
                return m.group(1)
            return base
        if base.startswith("mmcblk"):
            m = re.match(r"^(mmcblk\d+)p\d+$", base)
            if m:
                return m.group(1)
            return base
        m = re.match(r"^([a-zA-Z]+)\d*$", base)
        if m:
            return m.group(1)
        return base
    except Exception:
        return ""


def _read_sys_block_flag(base, attr):
    if not base:
        return None
    path = f"/sys/block/{base}/{attr}"
    try:
        with open(path, "r") as f:
            return f.read().strip()
    except Exception:
        return None


def _classify_linux(device, mountpoint, fstype, opts):
    base = _linux_base_block(device)
    rotational = _read_sys_block_flag(base, "queue/rotational")
    removable_flag = _read_sys_block_flag(base, "removable")

    is_removable = removable_flag == "1"
    if any(mountpoint.startswith(p) for p in _LINUX_REMOVABLE_MOUNT_PREFIXES):
        is_removable = True

    if base.startswith("nvme"):
        media_type = "nvme"
    elif rotational == "0":
        media_type = "ssd"
    elif rotational == "1":
        media_type = "hdd"
    else:
        media_type = "disk"

    if is_removable and media_type in ("ssd", "disk"):
        media_type = "usb"

    if fstype == "iso9660" or "cdrom" in (opts or "").lower():
        media_type = "optical"
        is_removable = True

    internal = not is_removable
    return media_type, is_removable, internal


def _darwin_physical_id(device):
    if not device:
        return None
    m = _DARWIN_DEVICE_RE.match(device)
    return m.group(1) if m else None


def _darwin_root_physical_id():
    try:
        for part in psutil.disk_partitions(all=False):
            if part.mountpoint == "/":
                return _darwin_physical_id(part.device)
    except Exception:
        pass
    return None


def _classify_darwin(device, mountpoint, fstype, opts, root_physical):
    this_physical = _darwin_physical_id(device)
    backed_by_root_disk = bool(root_physical) and this_physical == root_physical

    internal = backed_by_root_disk
    is_removable = not internal

    opts_lower = (opts or "").lower()
    fstype_lower = (fstype or "").lower()

    if "cdrom" in opts_lower or fstype_lower in ("cd9660", "udf"):
        return "optical", True, False

    if internal:
        return "ssd", False, True

    return "usb", True, False


def _classify_windows(device, mountpoint, fstype, opts):
    opts_lower = (opts or "").lower()
    fstype_lower = (fstype or "").lower()

    is_removable = "removable" in opts_lower
    is_optical = "cdrom" in opts_lower or fstype_lower in ("cdfs", "udf")

    if is_optical:
        return "optical", True, False

    if is_removable:
        return "usb", True, False

    return "disk", False, True


def _darwin_volume_label(mountpoint):
    if not mountpoint:
        return ""
    try:
        volumes_dir = "/Volumes"
        target_real = os.path.realpath(mountpoint)
        for entry in os.listdir(volumes_dir):
            entry_path = os.path.join(volumes_dir, entry)
            try:
                entry_real = os.path.realpath(entry_path)
                if entry_real == target_real:
                    return entry
            except OSError:
                continue
    except (OSError, PermissionError):
        pass
    return ""


def _read_label(device, mountpoint):
    try:
        if mountpoint and mountpoint not in ("/", ""):
            basename = os.path.basename(mountpoint.rstrip(os.sep))
            if basename:
                return basename

        if running_OS == "Darwin":
            darwin_label = _darwin_volume_label(mountpoint)
            if darwin_label:
                return darwin_label
            if mountpoint == "/":
                return "Macintosh HD"

        if mountpoint == "/":
            return "System"

        if device:
            return os.path.basename(device)
    except Exception:
        pass
    return ""


def _should_skip(mountpoint, fstype):
    if not mountpoint:
        return True

    if fstype and fstype.lower() in _PSEUDO_FSTYPES:
        return True

    if is_docker:
        for internal in _DOCKER_INTERNAL_MOUNTS:
            if mountpoint == internal or mountpoint.startswith(internal + "/"):
                return True

    if running_OS == "Linux":
        if mountpoint == "/":
            return False
        if any(mountpoint.startswith(p) for p in _LINUX_REMOVABLE_MOUNT_PREFIXES):
            return False
        skip_prefixes = ("/proc", "/sys", "/dev", "/run")
        for prefix in skip_prefixes:
            if mountpoint == prefix or mountpoint.startswith(prefix + "/"):
                return True
        if mountpoint == "/boot" or mountpoint.startswith("/boot/"):
            return True
        if mountpoint == "/efi" or mountpoint.startswith("/efi/"):
            return True

    elif running_OS == "Darwin":
        if mountpoint == "/":
            return False
        if mountpoint in _DARWIN_HIDDEN_VOLUMES:
            return True
        if mountpoint.startswith("/System/Volumes/"):
            return True
        if mountpoint.startswith("/private/var/"):
            return True
        if mountpoint.startswith("/Library/Developer/CoreSimulator/"):
            return True
        if mountpoint.startswith("/Volumes/"):
            volume_name = mountpoint[len("/Volumes/") :]
            if _DARWIN_HIDDEN_VOLUME_NAME_RE.match(volume_name):
                return True

    return False


def enumerate_disks():
    results = []
    seen_mountpoints = set()

    try:
        partitions = psutil.disk_partitions(all=False)
    except Exception:
        partitions = []

    darwin_root_physical = _darwin_root_physical_id() if running_OS == "Darwin" else None

    for partition in partitions:
        device = partition.device or ""
        mountpoint = partition.mountpoint or ""
        fstype = partition.fstype or ""
        opts = partition.opts or ""

        if _should_skip(mountpoint, fstype):
            continue

        if mountpoint in seen_mountpoints:
            continue
        seen_mountpoints.add(mountpoint)

        try:
            if running_OS == "Linux":
                media_type, is_removable, internal = _classify_linux(device, mountpoint, fstype, opts)
            elif running_OS == "Darwin":
                media_type, is_removable, internal = _classify_darwin(device, mountpoint, fstype, opts, darwin_root_physical)
            elif running_OS == "Windows":
                media_type, is_removable, internal = _classify_windows(device, mountpoint, fstype, opts)
            else:
                media_type, is_removable, internal = "disk", False, True
        except Exception:
            media_type, is_removable, internal = "disk", False, True

        total, used, free, percent = _safe_disk_usage(mountpoint)
        label = _read_label(device, mountpoint)

        results.append(
            {
                "id": disk_id(mountpoint),
                "device": device,
                "mountpoint": mountpoint,
                "label": label,
                "fstype": fstype,
                "opts": opts,
                "total": total,
                "used": used,
                "free": free,
                "percent": percent,
                "media_type": media_type,
                "removable": bool(is_removable),
                "internal": bool(internal),
            }
        )

    def _sort_key(d):
        internal_rank = 0 if d["internal"] else 1
        removable_rank = 0 if not d["removable"] else 1
        return (internal_rank, removable_rank, d["mountpoint"])

    results.sort(key=_sort_key)
    return results


def find_disk_by_id(target_id):
    if not target_id:
        return None
    for disk in enumerate_disks():
        if disk["id"] == target_id:
            return disk
    return None


def find_disk_by_device(device_path):
    if not device_path:
        return None
    for disk in enumerate_disks():
        if disk["device"] == device_path:
            return disk
    return None
