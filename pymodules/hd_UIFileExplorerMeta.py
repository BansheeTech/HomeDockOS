"""
hd_UIFileExplorerMeta.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro

File Explorer metadata API for favorites and recents.
"""

import json
import os
import time

from flask import jsonify, request
from flask_login import current_user, login_required

from pymodules.hd_FunctionsGlobals import user_storage_folder

MAX_FAVORITES = 50
MAX_RECENTS = 100


def get_user_meta_dir(user_name: str) -> str:
    meta_dir = os.path.join(user_storage_folder, "_meta", user_name)
    os.makedirs(meta_dir, exist_ok=True)
    return meta_dir


def get_favorites_path(user_name: str) -> str:
    return os.path.join(get_user_meta_dir(user_name), "favorites.json")


def get_recents_path(user_name: str) -> str:
    return os.path.join(get_user_meta_dir(user_name), "recents.json")


def load_json_file(file_path: str, default: list) -> list:
    if not os.path.exists(file_path):
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, list) else default
    except (json.JSONDecodeError, IOError):
        return default


def save_json_file(file_path: str, data: list) -> bool:
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False


@login_required
def get_favorites():
    user_name = current_user.id.lower()
    favorites_path = get_favorites_path(user_name)
    favorites = load_json_file(favorites_path, [])
    return jsonify({"favorites": favorites})


@login_required
def add_favorite():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    location = data.get("location", "").strip()
    path = data.get("path", "").strip()
    name = data.get("name", "").strip()
    is_directory = data.get("is_directory", False)

    if not location or not name:
        return jsonify({"error": "Location and name are required"}), 400

    if location not in ["storage", "dropzone", "appdrive"]:
        return jsonify({"error": "Invalid location"}), 400

    favorites_path = get_favorites_path(user_name)
    favorites = load_json_file(favorites_path, [])

    for fav in favorites:
        if fav.get("location") == location and fav.get("path") == path and fav.get("name") == name:
            return jsonify({"error": "Item already in favorites"}), 409

    if len(favorites) >= MAX_FAVORITES:
        return jsonify({"error": f"Maximum of {MAX_FAVORITES} favorites allowed"}), 400

    favorite_item = {
        "location": location,
        "path": path,
        "name": name,
        "is_directory": is_directory,
        "added_at": time.time(),
    }

    if location == "appdrive":
        favorite_item["container"] = data.get("container", "")
        favorite_item["mount_index"] = data.get("mount_index", 0)

    favorites.append(favorite_item)

    if save_json_file(favorites_path, favorites):
        return jsonify({"success": True, "message": "Added to favorites"})
    return jsonify({"error": "Failed to save favorites"}), 500


@login_required
def remove_favorite():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    location = data.get("location", "").strip()
    path = data.get("path", "").strip()
    name = data.get("name", "").strip()

    favorites_path = get_favorites_path(user_name)
    favorites = load_json_file(favorites_path, [])

    new_favorites = []
    removed = False
    for fav in favorites:
        if fav.get("location") == location and fav.get("path") == path and fav.get("name") == name:
            removed = True
        else:
            new_favorites.append(fav)

    if not removed:
        return jsonify({"error": "Item not found in favorites"}), 404

    if save_json_file(favorites_path, new_favorites):
        return jsonify({"success": True, "message": "Removed from favorites"})
    return jsonify({"error": "Failed to save favorites"}), 500


@login_required
def get_recents():
    user_name = current_user.id.lower()
    recents_path = get_recents_path(user_name)
    recents = load_json_file(recents_path, [])
    return jsonify({"recents": recents})


@login_required
def add_recent():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    location = data.get("location", "").strip()
    path = data.get("path", "").strip()
    name = data.get("name", "").strip()
    is_directory = data.get("is_directory", False)

    if not location or not name:
        return jsonify({"error": "Location and name are required"}), 400

    if location not in ["storage", "dropzone", "appdrive"]:
        return jsonify({"error": "Invalid location"}), 400

    recents_path = get_recents_path(user_name)
    recents = load_json_file(recents_path, [])

    recents = [r for r in recents if not (r.get("location") == location and r.get("path") == path and r.get("name") == name)]

    recent_item = {
        "location": location,
        "path": path,
        "name": name,
        "is_directory": is_directory,
        "accessed_at": time.time(),
    }

    if location == "appdrive":
        recent_item["container"] = data.get("container", "")
        recent_item["mount_index"] = data.get("mount_index", 0)

    recents.insert(0, recent_item)

    recents = recents[:MAX_RECENTS]

    if save_json_file(recents_path, recents):
        return jsonify({"success": True, "message": "Added to recents"})
    return jsonify({"error": "Failed to save recents"}), 500


@login_required
def clear_recents():
    user_name = current_user.id.lower()
    recents_path = get_recents_path(user_name)

    if save_json_file(recents_path, []):
        return jsonify({"success": True, "message": "Recents cleared"})
    return jsonify({"error": "Failed to clear recents"}), 500


@login_required
def remove_recent():
    user_name = current_user.id.lower()

    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    location = data.get("location", "").strip()
    path = data.get("path", "").strip()
    name = data.get("name", "").strip()

    recents_path = get_recents_path(user_name)
    recents = load_json_file(recents_path, [])

    new_recents = []
    removed = False
    for rec in recents:
        if rec.get("location") == location and rec.get("path") == path and rec.get("name") == name:
            removed = True
        else:
            new_recents.append(rec)

    if not removed:
        return jsonify({"error": "Item not found in recents"}), 404

    if save_json_file(recents_path, new_recents):
        return jsonify({"success": True, "message": "Removed from recents"})
    return jsonify({"error": "Failed to save recents"}), 500
