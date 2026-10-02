"""
hd_DesktopState.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import time
import threading

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import user_packages_desktop_state_folder, user_packages_desktop_widgets_folder

MODES = ("desktop", "mobile")
CELL_LENGTH = {"desktop": 2, "mobile": 3}
DEFAULT_ICONS = ("apphome", "fileexplorer")
DEFAULT_PINNED = ("apphome", "fileexplorer", "packager", "controlhub", "settings", "about")
WIDGET_SIZES = ("s", "m", "l")

MAX_DEVICES = 64
MAX_LAYOUT_ITEMS = 1500
MAX_CELL_VALUE = 9999
MAX_FOLDERS = 500
MAX_MEMBERSHIP = 3000
MAX_SYSTEM_ICONS = 300
MAX_WIDGETS = 100
MAX_WIDGET_SETTINGS_BYTES = 2048
MAX_ICON_BYTES = 8192
MAX_PINNED = 64
MAX_RECENTS = 16

ITEM_KEY_RE = re.compile(r"[A-Za-z0-9:_.\-]{1,160}")
ID_RE = re.compile(r"[A-Za-z0-9_\-]{1,64}")
APP_ID_RE = re.compile(r"[A-Za-z0-9:_.\-]{1,96}")
DEVICE_RE = re.compile(r"[A-Za-z0-9\-]{8,64}")
COLOR_RE = re.compile(r"#[0-9a-fA-F]{3,8}")
FOLDER_ICON_RE = re.compile(r"[A-Za-z0-9:_\-]{1,64}")

_lock = threading.Lock()


def _safe_username(username):
    return re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]


def _state_path(username):
    safe = _safe_username(username)
    return os.path.join(user_packages_desktop_state_folder, f"{safe}.json") if safe else None


def _legacy_widgets_path(username):
    safe = _safe_username(username)
    return os.path.join(user_packages_desktop_widgets_folder, f"{safe}.json") if safe else None


def _is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def _empty_content():
    return {"folders": [], "membership": {}, "systemIcons": [], "removedDefaults": [], "widgets": [], "pinned": list(DEFAULT_PINNED), "recents": []}


def _sanitize_folder(raw):
    if not isinstance(raw, dict):
        return None

    folder_id = str(raw.get("id", ""))
    if not ID_RE.fullmatch(folder_id):
        return None

    name = str(raw.get("name", "")).strip()[:64] or "New Folder"
    folder = {"id": folder_id, "name": name, "createdAt": raw.get("createdAt") if _is_int(raw.get("createdAt")) and raw.get("createdAt") >= 0 else 0}

    color = raw.get("color")
    if isinstance(color, str) and COLOR_RE.fullmatch(color):
        folder["color"] = color

    icon = raw.get("icon")
    if isinstance(icon, str) and FOLDER_ICON_RE.fullmatch(icon):
        folder["icon"] = icon

    return folder


def _sanitize_system_icon(raw):
    if not isinstance(raw, dict):
        return None

    app_id = str(raw.get("appId", ""))
    if not APP_ID_RE.fullmatch(app_id) or app_id.startswith("shortcut-"):
        return None

    name = str(raw.get("name", "")).strip()[:128]
    if not name:
        return None

    icon = raw.get("icon")
    if isinstance(icon, str):
        icon = icon[:256]
    elif isinstance(icon, dict):
        try:
            if len(json.dumps(icon)) > MAX_ICON_BYTES:
                return None
        except (TypeError, ValueError):
            return None
    else:
        icon = "mdi:application"

    entry = {"appId": app_id, "name": name, "icon": icon}

    module_name = raw.get("moduleName")
    if isinstance(module_name, str) and ID_RE.fullmatch(module_name):
        entry["moduleName"] = module_name

    return entry


def _sanitize_widget(raw):
    if not isinstance(raw, dict):
        return None

    instance_id = str(raw.get("instanceId", ""))
    widget_type = str(raw.get("type", ""))
    size = str(raw.get("size", "")).lower()

    if not ID_RE.fullmatch(instance_id) or not ID_RE.fullmatch(widget_type) or size not in WIDGET_SIZES:
        return None

    widget = {"instanceId": instance_id, "type": widget_type, "size": size}

    settings = raw.get("settings")
    if isinstance(settings, dict) and settings:
        try:
            if len(json.dumps(settings)) <= MAX_WIDGET_SETTINGS_BYTES:
                widget["settings"] = settings
        except (TypeError, ValueError):
            pass

    return widget


def _sanitize_pinned(raw):
    if not isinstance(raw, list):
        return []

    pinned = []
    for app_id in raw[: MAX_PINNED * 2]:
        if isinstance(app_id, str) and APP_ID_RE.fullmatch(app_id) and app_id not in pinned:
            pinned.append(app_id)
            if len(pinned) >= MAX_PINNED:
                break

    return pinned


def _sanitize_recent(raw):
    if not isinstance(raw, dict):
        return None

    app_id = raw.get("id")
    opened_at = raw.get("at")

    if not isinstance(app_id, str) or not APP_ID_RE.fullmatch(app_id) or not _is_int(opened_at) or opened_at < 0:
        return None

    return {"id": app_id, "at": opened_at}


def _unique(entries, key, limit):
    seen = set()
    result = []

    for entry in entries:
        if entry is None or entry[key] in seen:
            continue
        seen.add(entry[key])
        result.append(entry)
        if len(result) >= limit:
            break

    return result


def _sanitize_content(raw):
    if not isinstance(raw, dict):
        return _empty_content()

    folders = _unique([_sanitize_folder(f) for f in raw.get("folders", [])[: MAX_FOLDERS * 2]] if isinstance(raw.get("folders"), list) else [], "id", MAX_FOLDERS)
    folder_ids = {folder["id"] for folder in folders}

    membership = {}
    raw_membership = raw.get("membership")
    if isinstance(raw_membership, dict):
        for item_key, folder_id in list(raw_membership.items())[:MAX_MEMBERSHIP]:
            if isinstance(item_key, str) and ITEM_KEY_RE.fullmatch(item_key) and folder_id in folder_ids:
                membership[item_key] = folder_id

    system_icons = _unique([_sanitize_system_icon(i) for i in raw.get("systemIcons", [])[: MAX_SYSTEM_ICONS * 2]] if isinstance(raw.get("systemIcons"), list) else [], "appId", MAX_SYSTEM_ICONS)

    removed = raw.get("removedDefaults")
    removed_defaults = [icon for icon in DEFAULT_ICONS if isinstance(removed, list) and icon in removed]

    widgets = _unique([_sanitize_widget(w) for w in raw.get("widgets", [])[: MAX_WIDGETS * 2]] if isinstance(raw.get("widgets"), list) else [], "instanceId", MAX_WIDGETS)

    pinned = _sanitize_pinned(raw["pinned"]) if "pinned" in raw else list(DEFAULT_PINNED)

    recents = [_sanitize_recent(r) for r in raw.get("recents", [])[: MAX_RECENTS * 2]] if isinstance(raw.get("recents"), list) else []
    recents = _unique(sorted((r for r in recents if r), key=lambda r: r["at"], reverse=True), "id", MAX_RECENTS)

    return {"folders": folders, "membership": membership, "systemIcons": system_icons, "removedDefaults": removed_defaults, "widgets": widgets, "pinned": pinned, "recents": recents}


def _sanitize_layout(mode, raw):
    if not isinstance(raw, dict):
        return {}

    length = CELL_LENGTH[mode]
    layout = {}

    for item_key, cell in list(raw.items())[:MAX_LAYOUT_ITEMS]:
        if not isinstance(item_key, str) or not ITEM_KEY_RE.fullmatch(item_key):
            continue
        if not isinstance(cell, list) or len(cell) != length:
            continue
        if not all(_is_int(value) and 0 <= value <= MAX_CELL_VALUE for value in cell):
            continue
        layout[item_key] = cell

    return layout


def _sanitize_layouts(raw):
    if not isinstance(raw, dict):
        return {}

    return {mode: _sanitize_layout(mode, raw[mode]) for mode in MODES if mode in raw}


def _legacy_state(username):
    state = {"rev": 0, "initialized": False, "content": _empty_content(), "origin": {mode: None for mode in MODES}, "devices": {}, "legacy": {}}
    path = _legacy_widgets_path(username)

    if not path:
        return state

    try:
        with open(path, "r", encoding="utf-8") as handle:
            stored = json.load(handle)
    except (OSError, ValueError):
        return state

    if not isinstance(stored, list):
        return state

    widgets = []
    desktop = {}
    mobile = {}

    for raw in stored[:MAX_WIDGETS]:
        widget = _sanitize_widget(raw)
        if not widget:
            continue

        widgets.append(widget)
        instance_id = widget["instanceId"]

        if _is_int(raw.get("gridRow")) and _is_int(raw.get("gridCol")):
            desktop[instance_id] = [raw["gridRow"], raw["gridCol"]]

        if all(_is_int(raw.get(key)) for key in ("mobilePage", "mobileRow", "mobileCol")):
            mobile[instance_id] = [raw["mobilePage"], raw["mobileRow"], raw["mobileCol"]]

    state["content"]["widgets"] = _unique(widgets, "instanceId", MAX_WIDGETS)
    state["legacy"] = _sanitize_layouts({"desktop": desktop, "mobile": mobile})

    return state


def _read_state(username):
    path = _state_path(username)

    if not path:
        return None

    try:
        with open(path, "r", encoding="utf-8") as handle:
            raw = json.load(handle)
    except FileNotFoundError:
        return _legacy_state(username)
    except (OSError, ValueError):
        raw = {}

    if not isinstance(raw, dict):
        raw = {}

    devices = {}
    raw_devices = raw.get("devices")
    if isinstance(raw_devices, dict):
        for device_id, device in list(raw_devices.items())[: MAX_DEVICES * 2]:
            if isinstance(device_id, str) and DEVICE_RE.fullmatch(device_id) and isinstance(device, dict):
                devices[device_id] = {"seen": device.get("seen") if _is_int(device.get("seen")) else 0, "layouts": _sanitize_layouts(device.get("layouts"))}

    raw_origin = raw.get("origin") if isinstance(raw.get("origin"), dict) else {}
    origin = {mode: raw_origin.get(mode) if raw_origin.get(mode) in devices else None for mode in MODES}

    return {
        "rev": raw.get("rev") if _is_int(raw.get("rev")) and raw.get("rev") >= 0 else 0,
        "initialized": raw.get("initialized") is True,
        "content": _sanitize_content(raw.get("content")),
        "origin": origin,
        "devices": devices,
        "legacy": _sanitize_layouts(raw.get("legacy")),
    }


def _write_state(username, state):
    path = _state_path(username)

    if not path:
        return False

    try:
        os.makedirs(user_packages_desktop_state_folder, exist_ok=True)
        temp_path = f"{path}.tmp"
        with open(temp_path, "w", encoding="utf-8") as handle:
            json.dump(state, handle, separators=(",", ":"))
        os.replace(temp_path, path)
    except OSError:
        return False

    return True


def _seeds_for(state, device_id):
    own = state["devices"].get(device_id, {}).get("layouts", {})
    seeds = {}

    for mode in MODES:
        if mode in own:
            continue

        other = "mobile" if mode == "desktop" else "desktop"
        candidates = [(state["origin"][mode], mode), (state["origin"][other], other)]

        for origin_device, source in candidates:
            layout = state["devices"].get(origin_device, {}).get("layouts", {}).get(source) if origin_device else None
            if layout is not None:
                seeds[mode] = {"from": source, "items": layout}
                break
        else:
            for source in (mode, other):
                if source in state["legacy"]:
                    seeds[mode] = {"from": source, "items": state["legacy"][source]}
                    break

    return seeds


def _prune_layouts(state):
    content = state["content"]
    folder_ids = {folder["id"] for folder in content["folders"]}
    widget_ids = {widget["instanceId"] for widget in content["widgets"]}
    in_folders = set(content["membership"])

    def keep(item_key):
        if item_key in in_folders:
            return False
        if item_key.startswith("folder-"):
            return item_key in folder_ids
        if item_key.startswith("widget-"):
            return item_key in widget_ids
        return True

    for device in state["devices"].values():
        for mode, layout in device["layouts"].items():
            device["layouts"][mode] = {key: cell for key, cell in layout.items() if keep(key)}


def _prune_devices(state):
    if len(state["devices"]) <= MAX_DEVICES:
        return

    protected = {device_id for device_id in state["origin"].values() if device_id}
    removable = sorted((device["seen"], device_id) for device_id, device in state["devices"].items() if device_id not in protected)

    for _, device_id in removable[: len(state["devices"]) - MAX_DEVICES]:
        del state["devices"][device_id]


def _state_response(state, device_id):
    return {
        "rev": state["rev"],
        "initialized": state["initialized"],
        "content": state["content"],
        "layouts": state["devices"].get(device_id, {}).get("layouts", {}),
        "seeds": _seeds_for(state, device_id),
    }


def _device_arg(value):
    return value if isinstance(value, str) and DEVICE_RE.fullmatch(value) else None


@login_required
def api_desktop_state():
    device_id = _device_arg(request.args.get("device"))

    if not device_id:
        return jsonify({"status": "bad_request", "message": "Invalid device."}), 400

    with _lock:
        state = _read_state(current_user.id)

    if state is None:
        return jsonify({"status": "bad_request", "message": "Invalid user."}), 400

    return jsonify(_state_response(state, device_id)), 200


@login_required
def api_desktop_state_content():
    data = request.get_json(silent=True) or {}
    base_rev = data.get("baseRev")

    if not _is_int(base_rev) or not isinstance(data.get("content"), dict):
        return jsonify({"status": "bad_request", "message": "Invalid desktop content."}), 400

    with _lock:
        state = _read_state(current_user.id)

        if state is None:
            return jsonify({"status": "bad_request", "message": "Invalid user."}), 400

        if base_rev != state["rev"]:
            return jsonify({"status": "conflict", "rev": state["rev"], "content": state["content"]}), 409

        state["content"] = _sanitize_content(data["content"])
        state["rev"] += 1
        state["initialized"] = True
        _prune_layouts(state)

        if not _write_state(current_user.id, state):
            return jsonify({"status": "error", "message": "Could not save desktop content."}), 500

    return jsonify({"status": "saved", "rev": state["rev"], "content": state["content"]}), 200


@login_required
def api_desktop_state_layout():
    data = request.get_json(silent=True) or {}
    device_id = _device_arg(data.get("device"))
    mode = data.get("mode")

    if not device_id or mode not in MODES or not isinstance(data.get("items"), dict):
        return jsonify({"status": "bad_request", "message": "Invalid desktop layout."}), 400

    items = _sanitize_layout(mode, data["items"])

    with _lock:
        state = _read_state(current_user.id)

        if state is None:
            return jsonify({"status": "bad_request", "message": "Invalid user."}), 400

        device = state["devices"].setdefault(device_id, {"seen": 0, "layouts": {}})
        device["seen"] = int(time.time())
        device["layouts"][mode] = items

        if not state["origin"][mode]:
            state["origin"][mode] = device_id

        _prune_devices(state)

        if not _write_state(current_user.id, state):
            return jsonify({"status": "error", "message": "Could not save desktop layout."}), 500

    return jsonify({"status": "saved"}), 200
