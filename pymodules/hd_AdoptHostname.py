"""
hd_AdoptHostname.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import threading
import configparser

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsConfig import read_config, write_config
from pymodules.hd_AppSubdomains import get_desktop_hosts, split_host, lookup_slug

# HDOS00075
FACTORY_HOSTNAME = "get.homedock.cloud"

_config_path = os.path.join(current_directory, "homedock_server.conf")

_lock = threading.Lock()


def _is_adoptable(host):
    bare = (host or "").split(":")[0].strip().lower().rstrip(".")

    if not bare or "." not in bare:
        return False

    if bare.startswith("[") or bare.replace(".", "").isdigit():
        return False

    if bare.endswith(".local") or bare.endswith(".localhost"):
        return False

    return bare not in get_desktop_hosts()


def would_be_hijacked(host):

    slug, trail = split_host(host)

    if not slug or not trail:
        return False

    bare = (host or "").split(":")[0].strip().lower().rstrip(".")

    if bare in get_desktop_hosts():
        return False

    entry = lookup_slug(slug)

    return entry["container"] if entry else False


def adopt_browsed_hostname(host):

    if not _is_adoptable(host):
        return None

    bare = host.split(":")[0].strip().lower().rstrip(".")

    with _lock:
        if (read_config().get("dynamic_dns") or "").strip().lower() != FACTORY_HOSTNAME:
            return None

        try:
            config = configparser.ConfigParser()
            config.read(_config_path)

            if not config.has_section("Config"):
                return None

            config.set("Config", "dynamic_dns", bare)

            write_config(config, _config_path)
        except OSError:
            return None

    print(f" * Hostname adopted from the address in use: {bare}")

    return bare
