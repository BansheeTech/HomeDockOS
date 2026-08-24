"""
hd_DesktopWidgets.py
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

from pymodules.hd_FunctionsGlobals import user_packages_desktop_widgets_folder

# HDOS00078
SIZES = ("s", "m", "l")

MAX_INSTANCES = 99
MAX_SETTINGS_BYTES = 2048

_lock = threading.Lock()


def _store_path(username):
    safe = re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]

    if not safe:
        return None

    return os.path.join(user_packages_desktop_widgets_folder, f"{safe}.json")


def _sanitize_instance(raw):
    if not isinstance(raw, dict):
        return None

    instance_id = str(raw.get("instanceId", "")).strip()[:64]
    widget_type = str(raw.get("type", "")).strip()[:64]

    if not instance_id or not widget_type:
        return None

    if not re.fullmatch(r"[a-zA-Z0-9_-]+", instance_id) or not re.fullmatch(r"[a-zA-Z0-9_-]+", widget_type):
        return None

    grid_row = raw.get("gridRow")
    grid_col = raw.get("gridCol")

    if not isinstance(grid_row, int) or not isinstance(grid_col, int) or isinstance(grid_row, bool) or isinstance(grid_col, bool):
        return None

    if grid_row < 0 or grid_col < 0 or grid_row > 999 or grid_col > 999:
        return None

    size = str(raw.get("size", "")).strip().lower()

    if size not in SIZES:
        return None

    instance = {
        "instanceId": instance_id,
        "type": widget_type,
        "gridRow": grid_row,
        "gridCol": grid_col,
        "size": size,
    }

    for mobile_key in ("mobileRow", "mobileCol", "mobilePage"):
        value = raw.get(mobile_key)
        if isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 999:
            instance[mobile_key] = value

    settings = raw.get("settings")

    if isinstance(settings, dict) and settings:
        try:
            if len(json.dumps(settings)) <= MAX_SETTINGS_BYTES:
                instance["settings"] = settings
        except (TypeError, ValueError):
            pass

    return instance


def _read_all(username):
    path = _store_path(username)

    if not path:
        return []

    try:
        with open(path, "r") as handle:
            stored = json.load(handle)
    except (FileNotFoundError, IOError, OSError, ValueError):
        return []

    if not isinstance(stored, list):
        return []

    instances = []

    for raw in stored[:MAX_INSTANCES]:
        instance = _sanitize_instance(raw)
        if instance:
            instances.append(instance)

    return instances


def _write_all(username, instances):
    path = _store_path(username)

    if not path:
        return False

    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "w") as handle:
            json.dump(instances, handle, indent=1)
    except OSError:
        return False

    return True


def get_widgets(username):
    with _lock:
        return _read_all(username)


def set_widgets(username, raw_instances):
    if not isinstance(raw_instances, list) or len(raw_instances) > MAX_INSTANCES:
        return None

    instances = []
    seen_ids = set()

    for raw in raw_instances:
        instance = _sanitize_instance(raw)

        if not instance:
            return None

        if instance["instanceId"] in seen_ids:
            return None

        seen_ids.add(instance["instanceId"])
        instances.append(instance)

    with _lock:
        if not _write_all(username, instances):
            return None

    return instances


@login_required
def api_desktop_widgets():
    username = current_user.id

    if request.method == "GET":
        return jsonify({"widgets": get_widgets(username)}), 200

    data = request.get_json(silent=True) or {}

    instances = set_widgets(username, data.get("widgets"))

    if instances is None:
        return jsonify({"status": "bad_request", "message": "Invalid widget layout."}), 400

    return jsonify({"status": "saved", "widgets": instances}), 200
