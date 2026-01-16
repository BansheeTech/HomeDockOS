"""
hd_UIUtilsNotepad.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import uuid
import time

from flask import jsonify, request
from flask_login import current_user, login_required

from pymodules.hd_FunctionsGlobals import user_packages_folder
from pymodules.hd_FunctionsSecurity import validate_filename
from pymodules.hd_DropZoneEncryption import encrypt_user_file_new, decrypt_user_file_new, get_or_create_user_key_new

NOTEPAD_BASE_FOLDER = os.path.join(user_packages_folder, "_utils", "notepad")


def _get_user_notepad_folder(username: str) -> str:
    user_folder = os.path.join(NOTEPAD_BASE_FOLDER, username.lower())
    os.makedirs(user_folder, mode=0o700, exist_ok=True)
    return user_folder


def _save_encrypted_note(username: str, note_id: str, content: str) -> None:
    user_folder = _get_user_notepad_folder(username)
    file_path = os.path.join(user_folder, f"{note_id}.txt")

    encrypted_content = encrypt_user_file_new(username, content.encode("utf-8"))

    with open(file_path, "wb") as f:
        f.write(encrypted_content)


def _load_encrypted_note(username: str, note_id: str) -> str:
    user_folder = _get_user_notepad_folder(username)
    file_path = os.path.join(user_folder, f"{note_id}.txt")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Note not found: {note_id}")

    with open(file_path, "rb") as f:
        encrypted_content = f.read()

    decrypted_content = decrypt_user_file_new(username, encrypted_content)
    return decrypted_content.decode("utf-8")


def _save_note_metadata(username: str, note_id: str, metadata: dict) -> None:
    user_folder = _get_user_notepad_folder(username)
    meta_path = os.path.join(user_folder, f"{note_id}.json")

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)


def _load_note_metadata(username: str, note_id: str) -> dict:
    user_folder = _get_user_notepad_folder(username)
    meta_path = os.path.join(user_folder, f"{note_id}.json")

    if not os.path.exists(meta_path):
        raise FileNotFoundError(f"Note metadata not found: {note_id}")

    with open(meta_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _delete_note_files(username: str, note_id: str) -> None:
    user_folder = _get_user_notepad_folder(username)

    content_path = os.path.join(user_folder, f"{note_id}.txt")
    meta_path = os.path.join(user_folder, f"{note_id}.json")

    if os.path.exists(content_path):
        os.remove(content_path)
    if os.path.exists(meta_path):
        os.remove(meta_path)


@login_required
def notepad_list_notes():
    try:
        username = current_user.id.lower()
        user_folder = _get_user_notepad_folder(username)

        get_or_create_user_key_new(username)

        notes = []

        for filename in os.listdir(user_folder):
            if filename.endswith(".json"):
                note_id = filename[:-5]
                try:
                    metadata = _load_note_metadata(username, note_id)
                    notes.append(
                        {
                            "id": note_id,
                            "title": metadata.get("title", "Untitled"),
                            "created": metadata.get("created", 0),
                            "modified": metadata.get("modified", 0),
                        }
                    )
                except Exception:
                    continue

        notes.sort(key=lambda x: x["modified"], reverse=True)

        return jsonify({"success": True, "notes": notes})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@login_required
def notepad_get_note():
    try:
        username = current_user.id.lower()
        note_id = request.args.get("id", "").strip()

        if not note_id:
            return jsonify({"success": False, "error": "Note ID required"}), 400

        try:
            uuid.UUID(note_id)
        except ValueError:
            return jsonify({"success": False, "error": "Invalid note ID format"}), 400

        metadata = _load_note_metadata(username, note_id)
        content = _load_encrypted_note(username, note_id)

        return jsonify(
            {
                "success": True,
                "note": {
                    "id": note_id,
                    "title": metadata.get("title", "Untitled"),
                    "content": content,
                    "created": metadata.get("created", 0),
                    "modified": metadata.get("modified", 0),
                },
            }
        )

    except FileNotFoundError:
        return jsonify({"success": False, "error": "Note not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@login_required
def notepad_save_note():
    try:
        username = current_user.id.lower()

        get_or_create_user_key_new(username)

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        note_id = (data.get("id") or "").strip()
        title = (data.get("title") or "Untitled").strip()
        content = data.get("content") or ""

        if len(title) > 255:
            title = title[:255]
        if not title:
            title = "Untitled"

        current_time = time.time()
        is_new = False

        if not note_id:
            note_id = str(uuid.uuid4())
            is_new = True
            created_time = current_time
        else:
            try:
                uuid.UUID(note_id)
            except ValueError:
                return jsonify({"success": False, "error": "Invalid note ID format"}), 400

            try:
                existing_metadata = _load_note_metadata(username, note_id)
                created_time = existing_metadata.get("created", current_time)
            except FileNotFoundError:
                is_new = True
                created_time = current_time

        metadata = {
            "title": title,
            "created": created_time,
            "modified": current_time,
        }

        _save_note_metadata(username, note_id, metadata)
        _save_encrypted_note(username, note_id, content)

        return jsonify(
            {
                "success": True,
                "note": {
                    "id": note_id,
                    "title": title,
                    "created": created_time,
                    "modified": current_time,
                    "is_new": is_new,
                },
            }
        )

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@login_required
def notepad_delete_note():
    try:
        username = current_user.id.lower()

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400

        note_id = data.get("id", "").strip()

        if not note_id:
            return jsonify({"success": False, "error": "Note ID required"}), 400

        try:
            uuid.UUID(note_id)
        except ValueError:
            return jsonify({"success": False, "error": "Invalid note ID format"}), 400

        user_folder = _get_user_notepad_folder(username)
        meta_path = os.path.join(user_folder, f"{note_id}.json")

        if not os.path.exists(meta_path):
            return jsonify({"success": False, "error": "Note not found"}), 404

        _delete_note_files(username, note_id)

        return jsonify({"success": True, "deleted_id": note_id})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
