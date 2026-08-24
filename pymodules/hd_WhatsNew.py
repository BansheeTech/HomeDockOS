"""
hd_WhatsNew.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import threading

from datetime import datetime

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import user_packages_whats_new_folder

ID_RE = re.compile(r"^[a-zA-Z0-9._-]{1,64}$")

_lock = threading.Lock()


def _store_path(username):
    safe = re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]

    if not safe:
        return None

    return os.path.join(user_packages_whats_new_folder, f"{safe}.json")


def _read_seen(username):
    path = _store_path(username)

    if not path:
        return ""

    try:
        with open(path, "r") as handle:
            stored = json.load(handle)
    except (FileNotFoundError, IOError, OSError, ValueError):
        return ""

    if not isinstance(stored, dict):
        return ""

    seen = stored.get("id")

    if not isinstance(seen, str) or not ID_RE.match(seen):
        return ""

    return seen


def _write_seen(username, seen_id):
    path = _store_path(username)

    if not path:
        return False

    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "w") as handle:
            json.dump({"id": seen_id, "seenAt": datetime.now().isoformat(timespec="seconds")}, handle, indent=1)
    except OSError:
        return False

    return True


@login_required
def api_whats_new_seen():
    username = current_user.id

    if request.method == "GET":
        with _lock:
            return jsonify({"id": _read_seen(username)}), 200

    data = request.get_json(silent=True) or {}
    seen_id = data.get("id")

    if not isinstance(seen_id, str) or not ID_RE.match(seen_id):
        return jsonify({"status": "bad_request", "message": "Invalid release id."}), 400

    with _lock:
        if not _write_seen(username, seen_id):
            return jsonify({"status": "error", "message": "Could not store the What's New state."}), 500

    return jsonify({"status": "saved", "id": seen_id}), 200
