"""
hd_ThreadDynamicDNS.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import time
import threading

from datetime import datetime, timezone

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_ConfigEventManager import register_listener
from pymodules.hd_FunctionsNetwork import get_internet_ip, is_valid_ipv4
from pymodules.hd_CertManager import renewal_status
from pymodules.hd_ACMEProviders import get_provider, provider_syncs_ip

# HDOS00109
SYNC_INTERVAL = 15 * 60

INITIAL_DELAY = 60

KEEPALIVE_INTERVAL = 6 * 60 * 60

_last = {"error": None, "ip": None, "synced_at": None}

_sent = {"ip": None, "at": None}

_last_enabled = {"value": None}


def get_dynamic_dns_state():
    return dict(_last)


def sync_enabled():
    config = read_config()

    if not config.get("dynamic_dns_sync"):
        return None

    status = renewal_status()

    if not status["managed"]:
        return None

    if not provider_syncs_ip(status["provider"]):
        return None

    return status


def _already_current(ip):
    if _sent["at"] is None:
        return False

    if time.monotonic() - _sent["at"] >= KEEPALIVE_INTERVAL:
        return False

    return ip == _sent["ip"]


def sync_now(force=False):
    status = sync_enabled()

    if status is None:
        return False

    detected = get_internet_ip()
    ip = detected if is_valid_ipv4(detected) and detected != "127.0.0.1" else None

    if not force and _already_current(ip):
        return False

    get_provider(status["provider"])["sync"](status["domain"], status["token"], ip)

    _sent["ip"] = ip
    _sent["at"] = time.monotonic()

    _last["ip"] = ip
    _last["error"] = None
    _last["synced_at"] = datetime.now(timezone.utc).isoformat()

    return True


def _tick(force=False):
    try:
        if sync_now(force):
            print(f" + THREAD: Dynamic DNS points at {_last['ip'] or 'this connection'}")
    except Exception as error:
        _last["error"] = str(error)
        _last["synced_at"] = datetime.now(timezone.utc).isoformat()
        print(f" ! THREAD: Dynamic DNS update failed: {error}")


def _on_config_changed(new_config):
    enabled = bool(new_config.get("dynamic_dns_sync"))
    was_enabled = _last_enabled["value"]

    _last_enabled["value"] = enabled

    if enabled and was_enabled is False:
        threading.Thread(target=_tick, args=(True,), daemon=True, name="hdos-dynamic-dns-now").start()


def start_dynamic_dns_thread():
    _last_enabled["value"] = bool(read_config().get("dynamic_dns_sync"))

    register_listener(_on_config_changed)

    def loop():
        time.sleep(INITIAL_DELAY)

        while True:
            _tick()
            time.sleep(SYNC_INTERVAL)

    threading.Thread(target=loop, daemon=True, name="hdos-dynamic-dns").start()
