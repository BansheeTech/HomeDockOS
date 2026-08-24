"""
hd_UIShortcuts.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import time
import uuid
import hashlib

from urllib.parse import urlparse

from flask import jsonify, request, send_from_directory
from flask_login import current_user, login_required

from pymodules.hd_FunctionsGlobals import user_packages_shortcuts_folder
from pymodules.hd_UIWallpaperUpload import validate_image_type, allowed_file

MAX_SHORTCUTS = 50
MAX_NAME_LENGTH = 32
MAX_URL_LENGTH = 2048
MAX_ICON_SIZE = 2 * 1024 * 1024  # 2MB
MAX_TARGET_LENGTH = 1024

ICON_FILENAME_RE = re.compile(r"^[a-f0-9]{16}\.(jpg|png)$")
PRESET_ICON_RE = re.compile(r"^[a-z0-9-]{1,32}$")
CONTAINER_NAME_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$")
DISK_ID_RE = re.compile(r"^[a-zA-Z0-9_.:/-]{1,128}$")

SHORTCUT_TYPES = ("url", "file")
FILE_LOCATIONS = ("storage", "dropzone", "appdrive", "disksplus")


def get_user_shortcuts_dir(user_name: str) -> str:
    shortcuts_dir = os.path.join(user_packages_shortcuts_folder, user_name)
    os.makedirs(shortcuts_dir, exist_ok=True)
    return shortcuts_dir


def get_shortcuts_path(user_name: str) -> str:
    return os.path.join(get_user_shortcuts_dir(user_name), "shortcuts.json")


def load_shortcuts_file(file_path: str) -> list:
    if not os.path.exists(file_path):
        return []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError):
        return []


def save_shortcuts_file(file_path: str, data: list) -> bool:
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False


def sanitize_shortcut_name(name) -> str:
    if not isinstance(name, str):
        return ""
    sanitized = re.sub(r"[\x00-\x1F\x7F-\x9F]", "", name)
    sanitized = re.sub(r"\s+", " ", sanitized).strip()
    return sanitized[:MAX_NAME_LENGTH]


def validate_shortcut_url(url) -> bool:

    if not isinstance(url, str) or not url or len(url) > MAX_URL_LENGTH:
        return False
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    return parsed.scheme in ("http", "https") and bool(parsed.netloc)


def validate_shortcut_icon(user_name: str, icon_type, icon_value) -> bool:
    if icon_type == "preset":
        return isinstance(icon_value, str) and bool(PRESET_ICON_RE.match(icon_value))
    if icon_type == "image":
        if not isinstance(icon_value, str) or not ICON_FILENAME_RE.match(icon_value):
            return False
        return os.path.isfile(os.path.join(get_user_shortcuts_dir(user_name), icon_value))
    return False


def _clean_target_path(value):
    if value is None or value == "":
        return ""
    if not isinstance(value, str) or len(value) > MAX_TARGET_LENGTH:
        return None
    if re.search(r"[\x00-\x1F\x7F]", value):
        return None

    cleaned = value.replace("\\", "/").strip().strip("/")
    if ".." in cleaned.split("/"):
        return None
    return cleaned


def validate_shortcut_target(target):
    if not isinstance(target, dict):
        return None, "Invalid target"

    location = target.get("location")
    if location not in FILE_LOCATIONS:
        return None, "Invalid target location"

    path = _clean_target_path(target.get("path"))
    if path is None:
        return None, "Invalid target path"

    file_name = _clean_target_path(target.get("file_name"))
    if not file_name or "/" in file_name:
        return None, "Invalid target file"

    cleaned = {
        "location": location,
        "path": path,
        "file_name": file_name,
        "is_directory": bool(target.get("is_directory")),
    }

    if location == "appdrive":
        container = target.get("container")
        if not isinstance(container, str) or not CONTAINER_NAME_RE.match(container):
            return None, "Invalid target container"
        cleaned["container"] = container

        mount_index = target.get("mount_index", 0)
        if not isinstance(mount_index, int) or isinstance(mount_index, bool) or not 0 <= mount_index <= 64:
            return None, "Invalid target mount"
        cleaned["mount_index"] = mount_index

    if location == "disksplus":
        disk_id = target.get("disk_id")
        if not isinstance(disk_id, str) or not DISK_ID_RE.match(disk_id):
            return None, "Invalid target disk"
        cleaned["disk_id"] = disk_id

    return cleaned, None


def cleanup_orphan_icons(user_name: str, shortcuts: list):
    referenced = {s.get("icon_value") for s in shortcuts if s.get("icon_type") == "image"}
    shortcuts_dir = get_user_shortcuts_dir(user_name)
    try:
        for filename in os.listdir(shortcuts_dir):
            if ICON_FILENAME_RE.match(filename) and filename not in referenced:
                os.remove(os.path.join(shortcuts_dir, filename))
    except OSError:
        pass


def _validated_payload(user_name: str, data: dict):
    name = sanitize_shortcut_name(data.get("name"))
    if not name:
        return None, "Name is required"

    shortcut_type = data.get("type") or "url"
    if shortcut_type not in SHORTCUT_TYPES:
        return None, "Invalid shortcut type"

    if shortcut_type == "file":
        target, error = validate_shortcut_target(data.get("target"))
        if error:
            return None, error
        return {"name": name, "type": "file", "target": target}, None

    url = data.get("url").strip() if isinstance(data.get("url"), str) else ""
    icon_type = data.get("icon_type")
    icon_value = data.get("icon_value")

    if not validate_shortcut_url(url):
        return None, "Invalid URL, only http:// and https:// are allowed"
    if not validate_shortcut_icon(user_name, icon_type, icon_value):
        return None, "Invalid icon"

    return {"name": name, "type": "url", "url": url, "icon_type": icon_type, "icon_value": icon_value}, None


@login_required
def get_shortcuts():
    user_name = current_user.id.lower()
    shortcuts = load_shortcuts_file(get_shortcuts_path(user_name))
    return jsonify({"shortcuts": shortcuts})


@login_required
def add_shortcut():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    shortcuts_path = get_shortcuts_path(user_name)
    shortcuts = load_shortcuts_file(shortcuts_path)

    if len(shortcuts) >= MAX_SHORTCUTS:
        return jsonify({"error": f"Maximum of {MAX_SHORTCUTS} shortcuts allowed"}), 400

    payload, error = _validated_payload(user_name, data)
    if error:
        return jsonify({"error": error}), 400

    shortcut = {"id": uuid.uuid4().hex[:12], **payload, "created_at": time.time()}
    shortcuts.append(shortcut)

    if save_shortcuts_file(shortcuts_path, shortcuts):
        cleanup_orphan_icons(user_name, shortcuts)
        return jsonify({"success": True, "shortcut": shortcut})
    return jsonify({"error": "Failed to save shortcuts"}), 500


@login_required
def update_shortcut():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    shortcut_id = data.get("id")
    shortcuts_path = get_shortcuts_path(user_name)
    shortcuts = load_shortcuts_file(shortcuts_path)

    existing = next((s for s in shortcuts if s.get("id") == shortcut_id), None)
    if not existing:
        return jsonify({"error": "Shortcut not found"}), 404

    payload, error = _validated_payload(user_name, data)
    if error:
        return jsonify({"error": error}), 400

    preserved = {"id": existing.get("id"), "created_at": existing.get("created_at")}
    existing.clear()
    existing.update({**preserved, **payload})

    if save_shortcuts_file(shortcuts_path, shortcuts):
        cleanup_orphan_icons(user_name, shortcuts)
        return jsonify({"success": True, "shortcut": existing})
    return jsonify({"error": "Failed to save shortcuts"}), 500


@login_required
def remove_shortcut():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    shortcut_id = data.get("id")
    shortcuts_path = get_shortcuts_path(user_name)
    shortcuts = load_shortcuts_file(shortcuts_path)

    new_shortcuts = [s for s in shortcuts if s.get("id") != shortcut_id]
    if len(new_shortcuts) == len(shortcuts):
        return jsonify({"error": "Shortcut not found"}), 404

    if save_shortcuts_file(shortcuts_path, new_shortcuts):
        cleanup_orphan_icons(user_name, new_shortcuts)
        return jsonify({"success": True})
    return jsonify({"error": "Failed to save shortcuts"}), 500


@login_required
def upload_shortcut_icon():
    # HDOS00002
    try:
        user_name = current_user.id.lower()

        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"success": False, "message": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Invalid file type. Only .jpg, .jpeg, and .png are allowed"}), 400

        file_bytes = file.read()

        if len(file_bytes) > MAX_ICON_SIZE:
            return jsonify({"success": False, "message": "Invalid file"}), 400

        is_valid, result = validate_image_type(file_bytes)
        if not is_valid:
            return jsonify({"success": False, "message": result}), 400

        file_extension = ".jpg" if result == "jpeg" else ".png"
        icon_filename = hashlib.sha256(file_bytes).hexdigest()[:16] + file_extension

        icon_path = os.path.join(get_user_shortcuts_dir(user_name), icon_filename)

        with open(icon_path, "wb") as f:
            f.write(file_bytes)

        return jsonify({"success": True, "filename": icon_filename}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error uploading icon: {str(e)}"}), 500


@login_required
def serve_shortcut_icon(filename):
    user_name = current_user.id.lower()

    if not ICON_FILENAME_RE.match(filename):
        return jsonify({"error": "Invalid file"}), 400

    return send_from_directory(get_user_shortcuts_dir(user_name), filename)
