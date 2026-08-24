"""
hd_AppViewMode.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import threading

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import user_packages_app_open_folder
from pymodules.hd_AppSubdomains import slugify_container_name

# HDOS00077
MODES = ("window", "tab", "port")

DEFAULT_MODE = "window"

# HDOS00118
SCHEMES = ("http", "https")

DEFAULT_SCHEME = "http"

_lock = threading.Lock()


def _store_path(username):
    safe = re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]

    if not safe:
        return None

    return os.path.join(user_packages_app_open_folder, f"{safe}.json")


def _read_all(username):
    path = _store_path(username)

    if not path:
        return {}

    try:
        with open(path, "r") as handle:
            stored = json.load(handle)
    except (FileNotFoundError, IOError, OSError, ValueError):
        return {}

    if not isinstance(stored, dict):
        return {}

    # HDOS00118
    entries = {}

    for container, value in stored.items():
        if value in MODES:
            entries[str(container)] = {"mode": value, "scheme": DEFAULT_SCHEME}
        elif isinstance(value, dict) and value.get("mode") in MODES:
            scheme = value.get("scheme")
            entries[str(container)] = {"mode": value["mode"], "scheme": scheme if scheme in SCHEMES else DEFAULT_SCHEME}

    return entries


def _write_all(username, entries):
    path = _store_path(username)

    if not path:
        return False

    # HDOS00118
    stored = {container: entry["mode"] if entry.get("scheme", DEFAULT_SCHEME) == DEFAULT_SCHEME else entry for container, entry in entries.items()}

    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "w") as handle:
            json.dump(stored, handle, indent=1, sort_keys=True)
    except OSError:
        return False

    return True


def get_view_modes(username):
    with _lock:
        return _read_all(username)


# HDOS00118
def set_view_mode(username, container, mode, scheme=None):
    container = (container or "").strip()
    mode = (mode or "").strip().lower()
    scheme = (scheme or "").strip().lower() or None

    if not container or mode not in MODES:
        return False

    if scheme is not None and scheme not in SCHEMES:
        return False

    with _lock:
        entries = _read_all(username)

        if scheme is None:
            scheme = entries.get(container, {}).get("scheme", DEFAULT_SCHEME)

        entries[container] = {"mode": mode, "scheme": scheme}

        return _write_all(username, entries)


@login_required
def api_app_view_mode():
    username = current_user.id

    if request.method == "GET":
        entries = get_view_modes(username)

        # HDOS00118
        return jsonify({"modes": {container: entry["mode"] for container, entry in entries.items()}, "schemes": {container: entry["scheme"] for container, entry in entries.items()}, "default": DEFAULT_MODE, "default_scheme": DEFAULT_SCHEME}), 200

    data = request.get_json(silent=True) or {}

    container = str(data.get("container", ""))

    if not container or not slugify_container_name(container):
        return jsonify({"status": "bad_request", "message": "Unknown application."}), 400

    mode = str(data.get("mode", ""))
    scheme = str(data.get("scheme", "")) or None

    if not set_view_mode(username, container, mode, scheme):
        return jsonify({"status": "bad_request", "message": "Unknown view mode."}), 400

    return jsonify({"status": "saved", "container": container, "mode": mode, "scheme": scheme or DEFAULT_SCHEME}), 200
