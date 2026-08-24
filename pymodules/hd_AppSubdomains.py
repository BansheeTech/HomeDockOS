"""
hd_AppSubdomains.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import threading

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_FunctionsHostSelector import docker_host
from pymodules.hd_FunctionsConfig import read_config

_INVALID_LABEL_CHARS = re.compile(r"[^a-z0-9-]")
_REPEATED_DASHES = re.compile(r"-{2,}")
_IPV4_HOST = re.compile(r"\d{1,3}(?:\.\d{1,3}){3}")

_ports_file = os.path.join(current_directory, "homedock_ports.conf")

BASE_HOSTNAME = "homedock.local"

LOOPBACK_HOSTNAME = "homedock.localhost"


_lock = threading.Lock()
_cache = {"signature": None, "slugs": {}}

_reported_collisions = set()


def slugify_container_name(name):

    slug = name.strip().lower().replace("_", "-").replace(".", "-")
    slug = _INVALID_LABEL_CHARS.sub("", slug)
    slug = _REPEATED_DASHES.sub("-", slug).strip("-")

    return slug[:63]


def _parse_ports_value(value):

    value = value.strip()

    if value in ("", "hostmode", "disabled"):
        return None, ""

    trail = ""
    if "/" in value:
        head, _, tail = value.partition("/")
        trail = tail.split(":")[0].strip("/")
    else:
        head = value

    primary = head.split(":")[0].strip()

    if not primary.isdigit():
        return None, ""

    port = int(primary)
    if port < 1 or port > 65535:
        return None, ""

    return port, trail


def _read_ports_file():
    try:
        with open(_ports_file, "r") as file:
            return file.readlines()
    except (FileNotFoundError, IOError, OSError):
        return []


def _file_signature():
    try:
        stat = os.stat(_ports_file)
        return (stat.st_mtime_ns, stat.st_size)
    except (FileNotFoundError, IOError, OSError):
        return None


def _build_slug_map():
    slugs = {}

    for line in _read_ports_file():
        parts = line.strip().split("*")
        if len(parts) < 2:
            continue

        container_name = parts[0].strip()
        if not container_name:
            continue

        port, trail = _parse_ports_value(parts[1])
        if port is None:
            continue

        slug = slugify_container_name(container_name)
        if not slug:
            continue

        # HDOS00048
        if slug in slugs:
            existing = slugs[slug]["container"]
            if existing != container_name and slug not in _reported_collisions:
                _reported_collisions.add(slug)
                print(f" ! Subdomain slug collision on '{slug}': keeping '{existing}', ignoring '{container_name}'")
            continue

        slugs[slug] = {"container": container_name, "port": port, "trail": trail}

    return slugs


def get_slug_map():
    signature = _file_signature()

    with _lock:
        if _cache["signature"] != signature:
            _cache["slugs"] = _build_slug_map()
            _cache["signature"] = signature

        return _cache["slugs"]


def lookup_slug(slug):
    if not slug:
        return None

    return get_slug_map().get(slug.lower())


def get_desktop_hosts():
    # HDOS00043
    hosts = {"localhost", BASE_HOSTNAME, LOOPBACK_HOSTNAME, docker_host}

    for value in (local_ip, internet_ip):
        if value:
            hosts.add(value)

    try:
        dynamic_dns = read_config().get("dynamic_dns")
        if dynamic_dns:
            hosts.add(dynamic_dns.strip().lower())
    except Exception:
        pass

    return {host.lower() for host in hosts if host}


# HDOS00099
def get_emittable_hosts():
    hosts = get_desktop_hosts()

    if BASE_HOSTNAME not in hosts:
        return hosts

    try:
        from pymodules.hd_ThreadZeroConf import base_hostname_owned

        owned = base_hostname_owned()
    except Exception:
        owned = False

    if not owned:
        hosts.discard(BASE_HOSTNAME)

    return hosts


def split_host(host_header):
    """Return (slug, trail) for a Host header, stripping any port."""

    if not host_header:
        return "", ""

    host = host_header.strip().lower()

    # HDOS00021
    if host.startswith("["):
        return "", ""

    host = host.split(":")[0].rstrip(".")

    if "." not in host:
        return "", ""

    # HDOS00044
    if _IPV4_HOST.fullmatch(host):
        return "", ""

    slug, _, trail = host.partition(".")

    return slug, trail


def resolve_app_for_host(host_header):

    if not host_header:
        return None

    bare_host = host_header.strip().lower().split(":")[0].rstrip(".")

    if bare_host in get_desktop_hosts():
        return None

    slug, host_trail = split_host(host_header)
    if not slug or not host_trail:
        return None

    # HDOS00104
    if host_trail.endswith(".local") or host_trail == "local":
        return None

    entry = lookup_slug(slug)

    if entry is None:
        return None

    # HDOS00034
    return {"slug": slug, "host_trail": host_trail, **entry}
