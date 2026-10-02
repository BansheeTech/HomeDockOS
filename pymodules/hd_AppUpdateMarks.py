"""
hd_AppUpdateMarks.py
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

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import user_packages_app_updates_folder

NAME_RE = re.compile(r"[A-Za-z0-9_.\-]{1,128}")
ID_RE = re.compile(r"[a-f0-9]{12,64}")

_lock = threading.Lock()


def _marks_path(username):
    safe = re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]
    return os.path.join(user_packages_app_updates_folder, f"_updates_{safe}.json") if safe else None


def _read(path):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            raw = json.load(handle)
    except (OSError, ValueError):
        return {}

    if not isinstance(raw, dict):
        return {}

    return {name: cid for name, cid in raw.items() if isinstance(name, str) and isinstance(cid, str)}


def _write(path, marks):
    try:
        os.makedirs(user_packages_app_updates_folder, exist_ok=True)
        temp_path = f"{path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as handle:
            json.dump(marks, handle, separators=(",", ":"))
        os.replace(temp_path, path)
    except OSError:
        return False

    return True


def record_app_update(container_name, container_id):
    if not NAME_RE.fullmatch(container_name or "") or not ID_RE.fullmatch(container_id or ""):
        return

    path = _marks_path(read_config().get("user_name"))
    if not path:
        return

    with _lock:
        marks = _read(path)
        marks[container_name] = container_id
        _write(path, marks)


def get_unseen_updates(username):
    path = _marks_path(username)
    if not path:
        return {}

    with _lock:
        return _read(path)


@login_required
def api_app_update_seen():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")

    if not isinstance(name, str) or not NAME_RE.fullmatch(name):
        return jsonify({"status": "bad_request", "message": "Invalid app name."}), 400

    path = _marks_path(current_user.id)
    if not path:
        return jsonify({"status": "bad_request", "message": "Invalid user."}), 400

    with _lock:
        marks = _read(path)

        if name in marks:
            del marks[name]
            if not _write(path, marks):
                return jsonify({"status": "error", "message": "Could not save update mark."}), 500

    return jsonify({"status": "seen"}), 200
