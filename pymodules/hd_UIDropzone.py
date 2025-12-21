"""
hd_UIDropzone.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import shutil
import time
import zipfile
import hashlib

from flask import send_file, jsonify, request
from flask_login import current_user, login_required

from pymodules.hd_FunctionsGlobals import dropzone_folder
from pymodules.hd_FunctionsSecurity import validate_safe_path, validate_filename, validate_no_symlinks, calculate_directory_size_ddos_safe
from pymodules.hd_DropZoneEncryption import save_user_file, load_user_file

MAX_FILES_FOR_SIZE_CALC = 10000
MAX_TIME_FOR_SIZE_CALC = 2.0
MAX_FILES_FOR_ZIP = 50000
MAX_TIME_FOR_ZIP = 30.0
MAX_FILES_FOR_SEARCH = 100000
MAX_TIME_FOR_SEARCH = 5.0


@login_required
def list_files():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    requested_path = request.args.get("path", "").strip()

    if not os.path.exists(user_dir):
        os.makedirs(user_dir, mode=0o700, exist_ok=True)
        return jsonify({"files": [], "current_path": ""})

    try:
        if requested_path:
            current_dir = validate_safe_path(user_dir, requested_path)
        else:
            current_dir = user_dir
    except ValueError:
        return jsonify({"error": "Invalid path"}), 400

    if not os.path.exists(current_dir):
        return jsonify({"error": "Path not found"}), 404

    if not os.path.isdir(current_dir):
        return jsonify({"error": "Path is not a directory"}), 400

    try:
        validate_no_symlinks(current_dir, user_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    files = []
    try:
        for item in os.listdir(current_dir):
            item_path = os.path.join(current_dir, item)

            if item.startswith("."):
                continue

            if os.path.islink(item_path):
                continue

            try:
                item_stats = os.stat(item_path)

                full_relative_path = os.path.relpath(item_path, user_dir)

                item_name = item

                is_directory = os.path.isdir(item_path)

                if is_directory:
                    dir_size, size_exceeded = calculate_directory_size_ddos_safe(item_path)
                    item_size = dir_size
                else:
                    item_size = item_stats.st_size
                    size_exceeded = False

                files.append({"name": full_relative_path, "display_name": item_name, "size": item_size, "modified": item_stats.st_mtime, "is_directory": is_directory, "size_exceeded": size_exceeded})
            except (OSError, PermissionError):
                continue
    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

    return jsonify({"files": files, "current_path": os.path.relpath(current_dir, user_dir) if current_dir != user_dir else ""})


@login_required
def upload_file():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    if not os.path.exists(user_dir):
        os.makedirs(user_dir, mode=0o700, exist_ok=True)

    uploaded_file = request.files.get("file")
    if not uploaded_file:
        return jsonify({"error": "No file uploaded"}), 400

    target_path = request.form.get("path", "").strip()

    try:
        if target_path:
            target_dir = validate_safe_path(user_dir, target_path)
        else:
            target_dir = user_dir
    except ValueError:
        return jsonify({"error": "Invalid path"}), 400

    if os.path.exists(target_dir):
        try:
            validate_no_symlinks(target_dir, user_dir)
        except ValueError:
            return jsonify({"error": "Security violation"}), 403

    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir, mode=0o700, exist_ok=True)
        except OSError:
            return jsonify({"error": "Cannot create target directory"}), 500
        try:
            validate_no_symlinks(target_dir, user_dir)
        except ValueError:
            return jsonify({"error": "Security violation"}), 403

    original_filename = uploaded_file.filename
    if not original_filename:
        return jsonify({"error": "No filename provided"}), 400

    try:
        safe_filename = validate_filename(original_filename)
    except ValueError:
        return jsonify({"error": "Invalid filename"}), 400

    if target_path:
        relative_file_path = os.path.join(target_path, safe_filename)
    else:
        relative_file_path = safe_filename

    relative_file_path = relative_file_path.replace("\\", "/")

    encrypted_file_path = os.path.join(target_dir, safe_filename)

    try:
        file_content = uploaded_file.read()
        save_user_file(user_name, relative_file_path, file_content)

        return jsonify({"success": True, "filename": safe_filename, "path": relative_file_path})
    except Exception:
        if os.path.exists(encrypted_file_path):
            os.remove(encrypted_file_path)
        return jsonify({"error": "Error saving file"}), 500


@login_required
def download_file():
    user_name = current_user.id.lower()

    file_name = request.args.get("file")
    if not file_name:
        return jsonify({"error": "No file specified"}), 400

    user_dir = os.path.join(dropzone_folder, user_name)

    try:
        file_path = validate_safe_path(user_dir, file_name)
    except ValueError:
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        validate_no_symlinks(file_path, user_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    try:
        relative_path = os.path.relpath(file_path, user_dir)
        file_content = load_user_file(user_name, relative_path)
        return send_file(
            io.BytesIO(file_content),
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=os.path.basename(file_name),
        )
    except Exception:
        return jsonify({"error": "Error decrypting file"}), 500


@login_required
def delete_file():
    user_name = current_user.id.lower()

    file_name = request.json.get("file")
    if not file_name:
        return jsonify({"error": "No file specified"}), 400

    user_dir = os.path.join(dropzone_folder, user_name)

    try:
        file_path = validate_safe_path(user_dir, file_name)
    except ValueError:
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        validate_no_symlinks(file_path, user_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    try:
        if os.path.isdir(file_path):
            shutil.rmtree(file_path)
            return jsonify({"success": True, "message": f"Folder {os.path.basename(file_name)} deleted successfully"})
        else:
            os.remove(file_path)
            return jsonify({"success": True, "message": f"File {os.path.basename(file_name)} deleted successfully"})
    except Exception:
        return jsonify({"error": "Error deleting item"}), 500


@login_required
def create_folder():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    folder_name = request.json.get("name", "").strip()
    parent_path = request.json.get("path", "").strip()

    if not folder_name:
        return jsonify({"error": "Folder name is required"}), 400

    try:
        validated_name = validate_filename(folder_name)
    except ValueError:
        return jsonify({"error": "Invalid folder name"}), 400

    try:
        if parent_path:
            parent_dir = validate_safe_path(user_dir, parent_path)
        else:
            parent_dir = user_dir
    except ValueError:
        return jsonify({"error": "Invalid parent path"}), 400

    if not os.path.exists(parent_dir):
        return jsonify({"error": "Parent folder not found"}), 404

    if not os.path.isdir(parent_dir):
        return jsonify({"error": "Parent path is not a directory"}), 400

    try:
        validate_no_symlinks(parent_dir, user_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    new_folder_path = os.path.join(parent_dir, validated_name)

    if os.path.exists(new_folder_path):
        return jsonify({"error": "Folder already exists"}), 409

    try:
        os.makedirs(new_folder_path, mode=0o700, exist_ok=True)
        relative_path = os.path.relpath(new_folder_path, user_dir)
        return jsonify({"success": True, "message": f"Folder '{validated_name}' created successfully", "path": relative_path})
    except OSError:
        return jsonify({"error": "Error creating folder"}), 500


@login_required
def search_files():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    search_query = request.args.get("query", "").strip().lower()

    if not search_query:
        return jsonify({"files": []})

    if not os.path.exists(user_dir):
        os.makedirs(user_dir, mode=0o700, exist_ok=True)
        return jsonify({"files": []})

    matching_files = []
    items_scanned = 0
    start_time = time.time()
    try:
        for root, dirs, files_list in os.walk(user_dir):
            items_scanned += len(files_list) + len(dirs)
            if items_scanned > MAX_FILES_FOR_SEARCH:
                break
            if (time.time() - start_time) > MAX_TIME_FOR_SEARCH:
                break

            dirs[:] = [d for d in dirs if not d.startswith(".")]

            all_items = files_list + dirs

            for item in all_items:
                if item.startswith("."):
                    continue

                if search_query not in item.lower():
                    continue

                item_path = os.path.join(root, item)

                if os.path.islink(item_path):
                    continue

                try:
                    item_stats = os.stat(item_path)

                    full_relative_path = os.path.relpath(item_path, user_dir)

                    parent_folder = os.path.dirname(full_relative_path)
                    if parent_folder:
                        display_name = f"{parent_folder}/{item}"
                    else:
                        display_name = item

                    is_directory = os.path.isdir(item_path)

                    if is_directory:
                        dir_size, size_exceeded = calculate_directory_size_ddos_safe(item_path)
                        item_size = dir_size
                    else:
                        item_size = item_stats.st_size
                        size_exceeded = False

                    matching_files.append({"name": full_relative_path, "display_name": display_name, "size": item_size, "modified": item_stats.st_mtime, "is_directory": is_directory, "size_exceeded": size_exceeded})
                except (OSError, PermissionError):
                    continue

    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

    matching_files.sort(key=lambda x: (not x["display_name"].lower().startswith(search_query), x["display_name"].lower()))

    return jsonify({"files": matching_files})


@login_required
def rename_item():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    old_name = request.json.get("old_name", "").strip()
    new_name = request.json.get("new_name", "").strip()

    if not old_name or not new_name:
        return jsonify({"error": "Both old_name and new_name are required"}), 400

    try:
        validated_new_name = validate_filename(new_name)
    except ValueError:
        return jsonify({"error": "Invalid new name"}), 400

    try:
        old_path = validate_safe_path(user_dir, old_name)
    except ValueError:
        return jsonify({"error": "Invalid old path"}), 400

    if not os.path.exists(old_path):
        return jsonify({"error": "Item not found"}), 404

    try:
        validate_no_symlinks(old_path, user_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    parent_dir = os.path.dirname(old_path)
    new_path = os.path.join(parent_dir, validated_new_name)

    try:
        new_path = validate_safe_path(user_dir, os.path.relpath(new_path, user_dir))
    except ValueError:
        return jsonify({"error": "Invalid new path"}), 400

    if os.path.exists(new_path):
        return jsonify({"error": "An item with that name already exists"}), 409

    try:
        os.replace(old_path, new_path)

        relative_path = os.path.relpath(new_path, user_dir)
        return jsonify({"success": True, "message": f"Renamed to '{validated_new_name}' successfully", "new_path": relative_path})
    except OSError:
        return jsonify({"error": "Error renaming item"}), 500


@login_required
def download_multiple():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    file_names = request.json.get("files", [])

    if not file_names or not isinstance(file_names, list) or len(file_names) == 0:
        return jsonify({"error": "At least one file is required"}), 400

    try:
        memory_zip = io.BytesIO()
        file_count = 0
        start_time = time.time()
        with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_name in file_names:
                try:
                    file_path = validate_safe_path(user_dir, file_name)
                except ValueError:
                    continue

                if not os.path.exists(file_path):
                    continue

                try:
                    validate_no_symlinks(file_path, user_dir)
                except ValueError:
                    continue

                if os.path.isdir(file_path):
                    dir_basename = os.path.basename(file_name)
                    for root, dirs, files in os.walk(file_path):
                        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d))]
                        for file in files:
                            file_count += 1
                            if file_count > MAX_FILES_FOR_ZIP:
                                return jsonify({"error": "Too many files to download"}), 400
                            if (time.time() - start_time) > MAX_TIME_FOR_ZIP:
                                return jsonify({"error": "Download request is too large"}), 400
                            abs_path = os.path.join(root, file)
                            if os.path.islink(abs_path):
                                continue
                            try:
                                validate_no_symlinks(abs_path, user_dir)
                                relative_to_user = os.path.relpath(abs_path, user_dir)
                                decrypted_content = load_user_file(user_name, relative_to_user)
                                arc_name = os.path.join(dir_basename, os.path.relpath(abs_path, file_path))
                                zf.writestr(arc_name, decrypted_content)
                            except (ValueError, PermissionError, Exception):
                                continue
                else:
                    file_count += 1
                    if file_count > MAX_FILES_FOR_ZIP:
                        return jsonify({"error": "Too many files to download"}), 400
                    try:
                        relative_path = os.path.relpath(file_path, user_dir)
                        decrypted_content = load_user_file(user_name, relative_path)
                        arc_name = os.path.basename(file_name)
                        zf.writestr(arc_name, decrypted_content)
                    except (PermissionError, Exception):
                        continue

        memory_zip.seek(0)
        zip_hash = hashlib.md5(memory_zip.getvalue()).hexdigest()[:6]
        zip_name = f"download_{zip_hash}.zip"
        return send_file(memory_zip, mimetype="application/zip", as_attachment=True, download_name=zip_name)

    except Exception:
        return jsonify({"error": "Error creating ZIP"}), 500
