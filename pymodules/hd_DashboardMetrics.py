"""
hd_DashboardMetrics.py
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
from pymodules.hd_FunctionsMain import (
    get_active_network_interface,
    get_total_containers,
    get_active_containers,
    actual_uptime,
    get_server_uptime,
    get_configured_external_drives,
)
from pymodules.hd_ExternalDriveManager import get_external_drive_info


# ─── Cache ───────────────────────────────────────────────────────────────

_cache = {}


def get_cached(key, default=None):
    return _cache.get(key, default)


# ─── Metric Collectors ───────────────────────────────────────────────────

_cpu_error_shown = False
_common_sensors = ["coretemp", "cpu_thermal", "k10temp", "TC0P", "TC0H"]


def get_cpu_temp():
    global _cpu_error_shown
    try:
        info = psutil.sensors_temperatures()
        for name in _common_sensors:
            if name in info and info[name]:
                return round(info[name][0].current, 2)
        for sensor, entries in info.items():
            for e in entries:
                if "cpu" in sensor.lower() or "cpu" in e.label.lower():
                    return round(e.current, 2)
        return 0
    except Exception:
        if not _cpu_error_shown:
            print(" * Error obtaining CPU temp, not compatible with psutil")
            _cpu_error_shown = True
        return 0


def get_cpu_usage():
    try:
        return "{:.2f}".format(psutil.cpu_percent(interval=0.1))
    except IOError as e:
        print("Error obtaining current usage of CPU: ", e)
        return None


def get_ram_usage():
    try:
        return psutil.virtual_memory().percent
    except Exception as e:
        print("Error al obtener el uso de RAM:", e)
        return None


def get_disk_usage():
    try:
        path = "/" if os.name == "posix" else "C:\\"
        return round(psutil.disk_usage(path).percent, 2)
    except Exception as e:
        print("Error obtaining disk usage: ", e)
        return None


def get_external_disk_usage():
    configured = get_configured_external_drives()
    if configured == "disabled":
        return 0
    info = get_external_drive_info(configured[0])
    return info["usage_percent"] if info else 0


def get_download_data(interface_name):
    try:
        psutil.net_io_counters.cache_clear()
        data = psutil.net_io_counters(pernic=True)[interface_name]
        gb = round(data.bytes_recv / (1024.0 * 1024.0 * 1024.0), 2)
        psutil.net_io_counters.cache_clear()
        return {"received": gb}
    except KeyError:
        return {"received": None}


def get_upload_data(interface_name):
    try:
        psutil.net_io_counters.cache_clear()
        data = psutil.net_io_counters(pernic=True)[interface_name]
        gb = round(data.bytes_sent / (1024.0 * 1024.0 * 1024.0), 2)
        psutil.net_io_counters.cache_clear()
        return {"sent": gb}
    except KeyError:
        return {"sent": None}


# ─── Cache Threads ───────────────────────────────────────────────────────

_interface_name = get_active_network_interface()


def _start_cache_thread(key, fn, interval):
    def loop():
        while True:
            try:
                _cache[key] = fn()
            except Exception:
                pass
            time.sleep(interval)

    Thread(target=loop, daemon=True).start()


_cache["uptime_data"] = actual_uptime()

_start_cache_thread("cpu_temp", get_cpu_temp, 2)
_start_cache_thread("cpu_usage", get_cpu_usage, 2)
_start_cache_thread("ram_usage", get_ram_usage, 3)
_start_cache_thread("disk_usage", get_disk_usage, 15)
_start_cache_thread("external_disk_usage", get_external_disk_usage, 15)
_start_cache_thread("download_data", lambda: get_download_data(_interface_name)["received"], 3)
_start_cache_thread("upload_data", lambda: get_upload_data(_interface_name)["sent"], 3)
_start_cache_thread("total_containers", get_total_containers, 3)
_start_cache_thread("active_containers", get_active_containers, 3)
_start_cache_thread("uptime_data", actual_uptime, 5)
_start_cache_thread("homedock_uptime", get_server_uptime, 5)


# ─── Log Sampling ────────────────────────────────────────────────────────

HOURS_TO_KEEP = 48
VALUES_PER_HOUR = 12
_MAX_LOG_ENTRIES = HOURS_TO_KEEP * VALUES_PER_HOUR


def _write_log(path, stats_str):
    try:
        with open(path, "r") as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []
    timestamp = datetime.now().strftime("%H:%M")
    lines.append(f"{timestamp}*{stats_str}\n")
    with open(path, "w") as f:
        f.writelines(lines[-_MAX_LOG_ENTRIES:])


def _fmt_avg_max_min(samples):
    avg = sum(samples) / len(samples)
    return f"{avg:.2f}*{max(samples):.2f}*{min(samples):.2f}"


def _fmt_avg(samples):
    return f"{sum(samples) / len(samples):.2f}"


def _start_sampler(cache_key, log_file, fmt_fn, reset_on_zero=False):
    samples = []
    count = [0]
    path = os.path.join(current_directory, "logs", log_file)

    def loop():
        while True:
            val = get_cached(cache_key)
            if val is not None:
                try:
                    fval = float(val)
                    if reset_on_zero and fval == 0:
                        samples.clear()
                        count[0] = 0
                    else:
                        samples.append(fval)
                        count[0] += 1
                except (TypeError, ValueError):
                    pass
            elif reset_on_zero:
                samples.clear()
                count[0] = 0

            if count[0] >= 100 and samples:
                _write_log(path, fmt_fn(samples))
                samples.clear()
                count[0] = 0

            time.sleep(3)

    Thread(target=loop, daemon=True).start()


def _start_network_sampler():
    samples = []
    count = [0]
    path = os.path.join(current_directory, "logs", "networkusage.log")

    def loop():
        while True:
            dl, ul = get_cached("download_data"), get_cached("upload_data")
            if dl is not None and ul is not None:
                try:
                    samples.append((float(dl), float(ul)))
                    count[0] += 1
                except (TypeError, ValueError):
                    pass

            if count[0] >= 100 and samples:
                avg_dl = sum(s[0] for s in samples) / len(samples)
                avg_ul = sum(s[1] for s in samples) / len(samples)
                _write_log(path, f"{avg_dl:.2f}*{avg_ul:.2f}")
                samples.clear()
                count[0] = 0

            time.sleep(3)

    Thread(target=loop, daemon=True).start()


_start_sampler("cpu_temp", "cputemp.log", _fmt_avg_max_min)
_start_sampler("cpu_usage", "cpuusage.log", _fmt_avg_max_min)
_start_sampler("ram_usage", "ramusage.log", _fmt_avg_max_min)
_start_sampler("disk_usage", "diskusage.log", _fmt_avg)
_start_sampler("external_disk_usage", "externaldiskusage.log", _fmt_avg, reset_on_zero=True)
_start_network_sampler()
