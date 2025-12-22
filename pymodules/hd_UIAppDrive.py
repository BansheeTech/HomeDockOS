"""
hd_UIAppDrive.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import time
import shutil
import zipfile
import hashlib

from flask import send_file, jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import running_OS
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_FunctionsSecurity import validate_safe_path, validate_filename, validate_no_symlinks, calculate_directory_size_ddos_safe
from pymodules.hd_FunctionsSanitize import sanitize_container_name
from pymodules.hd_ClassDockerClientManager import DockerClientManager

MAX_FILES_FOR_SIZE_CALC = 10000
MAX_TIME_FOR_SIZE_CALC = 2.0
MAX_FILES_FOR_ZIP = 50000
MAX_TIME_FOR_ZIP = 30.0


def get_allowed_homedock_root():
    if is_docker:
        data_root = os.environ.get("DATA_ROOT")
        if data_root:
            return f"{data_root}/HomeDock"
        return "/DATA/HomeDock"

    if running_OS == "Linux":
        return "/DATA/HomeDock"
    elif running_OS == "Darwin":
        return f"{os.path.expanduser('~')}/HomeDock"
    elif running_OS == "Windows":
        return "C:\\HomeDock"
    else:
        raise OSError(f"Not supported underlying operative system: {running_OS}")


def get_container_valid_mounts(container_name):
    try:
        container_name = sanitize_container_name(container_name)
        if not container_name:
            return []

        manager = DockerClientManager.get_instance()
        client = manager.get_client()
        container = client.containers.get(container_name)

        mounts = container.attrs.get("Mounts", [])
        homedock_root = get_allowed_homedock_root()
        homedock_root_normalized = os.path.normpath(homedock_root)

        valid_mounts = []
        for mount in mounts:
            source = mount.get("Source", "")
            destination = mount.get("Destination", "")
            mount_type = mount.get("Type", "bind")

            if not source or not destination:
                continue

            source_normalized = os.path.normpath(source)

            if source_normalized.startswith(homedock_root_normalized + os.sep) or source_normalized == homedock_root_normalized:
                if is_docker:
                    data_root = os.environ.get("DATA_ROOT", "/DATA")
                    internal_path = "/DATA" + source_normalized[len(os.path.normpath(data_root)) :]
                else:
                    internal_path = source_normalized

                valid_mounts.append({"host_path": internal_path, "container_path": destination, "type": mount_type, "read_only": mount.get("RW", True) is False})

        valid_mounts.sort(key=lambda m: m["container_path"])

        return valid_mounts

    except Exception:
        return []


@login_required
def appdrive_list_containers():
    try:
        manager = DockerClientManager.get_instance()
        client = manager.get_client()
        containers = client.containers.list(all=True)

        containers_with_mounts = []

        for container in containers:
            try:
                labels = container.labels
                if labels.get("HDDockerInDocker") == "true":
                    continue

                sanitized_name = sanitize_container_name(container.name)
                valid_mounts = get_container_valid_mounts(container.name)

                if valid_mounts:
                    containers_with_mounts.append({"name": container.name, "sanitized_name": sanitized_name, "status": container.status, "mounts_count": len(valid_mounts)})

            except Exception:
                continue

        return jsonify({"containers": containers_with_mounts})

    except Exception:
        return jsonify({"error": "Failed to list containers"}), 500


@login_required
def appdrive_get_mounts():
    container_name = request.args.get("container")
    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    try:
        valid_mounts = get_container_valid_mounts(container_name)
        return jsonify({"container": container_name, "mounts": valid_mounts})

    except Exception:
        return jsonify({"error": "Failed to get container mounts"}), 500


@login_required
def appdrive_list_files():
    container_name = request.args.get("container")
    mount_index = request.args.get("mount", "0")
    requested_path = request.args.get("path", "").strip()

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    try:
        mount_index = int(mount_index)
    except ValueError:
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]
    base_dir = mount["host_path"]

    try:
        if requested_path:
            current_dir = validate_safe_path(base_dir, requested_path)
        else:
            current_dir = base_dir
    except ValueError:
        return jsonify({"error": "Invalid path"}), 400

    if not os.path.exists(current_dir):
        return jsonify({"error": "Path not found"}), 404

    if not os.path.isdir(current_dir):
        return jsonify({"error": "Path is not a directory"}), 400

    try:
        validate_no_symlinks(current_dir, base_dir)
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
                full_relative_path = os.path.relpath(item_path, base_dir)
                is_directory = os.path.isdir(item_path)

                if is_directory:
                    dir_size, size_exceeded = calculate_directory_size_ddos_safe(item_path)
                    item_size = dir_size
                else:
                    item_size = item_stats.st_size
                    size_exceeded = False

                files.append({"name": full_relative_path, "display_name": item, "size": item_size, "modified": item_stats.st_mtime, "is_directory": is_directory, "size_exceeded": size_exceeded})

            except (OSError, PermissionError):
                continue

    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

    return jsonify({"files": files, "current_path": os.path.relpath(current_dir, base_dir) if current_dir != base_dir else "", "container_path": mount["container_path"], "read_only": mount["read_only"]})


@login_required
def appdrive_download_file():
    container_name = request.args.get("container")
    mount_index = request.args.get("mount", "0")
    file_name = request.args.get("file")

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not file_name:
        return jsonify({"error": "File name is required"}), 400

    try:
        mount_index = int(mount_index)
    except ValueError:
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]
    base_dir = mount["host_path"]

    try:
        file_path = validate_safe_path(base_dir, file_name)
    except ValueError:
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        validate_no_symlinks(file_path, base_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    if os.path.isdir(file_path):
        try:
            memory_zip = io.BytesIO()
            file_count = 0
            start_time = time.time()
            with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(file_path):
                    dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d))]
                    for file in files:
                        file_count += 1
                        if file_count > MAX_FILES_FOR_ZIP:
                            return jsonify({"error": "Directory contains too many files to download"}), 400
                        if (time.time() - start_time) > MAX_TIME_FOR_ZIP:
                            return jsonify({"error": "Directory is too large to download"}), 400
                        abs_path = os.path.join(root, file)
                        if os.path.islink(abs_path):
                            continue
                        try:
                            validate_no_symlinks(abs_path, base_dir)
                            arc_name = os.path.relpath(abs_path, file_path)
                            zf.write(abs_path, arc_name)
                        except (ValueError, PermissionError):
                            continue
            memory_zip.seek(0)
            zip_name = f"{os.path.basename(file_name)}.zip"
            return send_file(memory_zip, mimetype="application/zip", as_attachment=True, download_name=zip_name)
        except Exception:
            return jsonify({"error": "Error creating ZIP"}), 500

    try:
        return send_file(file_path, mimetype="application/octet-stream", as_attachment=True, download_name=os.path.basename(file_name))
    except Exception:
        return jsonify({"error": "Error downloading file"}), 500


@login_required
def appdrive_upload_file():
    container_name = request.form.get("container")
    mount_index = request.form.get("mount", "0")
    target_path = request.form.get("path", "").strip()

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    try:
        mount_index = int(mount_index)
    except ValueError:
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]

    if mount["read_only"]:
        return jsonify({"error": "This mount is read-only"}), 403

    base_dir = mount["host_path"]

    uploaded_file = request.files.get("file")
    if not uploaded_file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        if target_path:
            target_dir = validate_safe_path(base_dir, target_path)
        else:
            target_dir = base_dir
    except ValueError:
        return jsonify({"error": "Invalid path"}), 400

    if os.path.exists(target_dir):
        try:
            validate_no_symlinks(target_dir, base_dir)
        except ValueError:
            return jsonify({"error": "Security violation"}), 403

    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir, mode=0o755, exist_ok=True)
        except OSError:
            return jsonify({"error": "Cannot create target directory"}), 500
        try:
            validate_no_symlinks(target_dir, base_dir)
        except ValueError:
            return jsonify({"error": "Security violation"}), 403

    original_filename = uploaded_file.filename
    if not original_filename:
        return jsonify({"error": "No filename provided"}), 400

    try:
        safe_filename = validate_filename(original_filename)
    except ValueError:
        return jsonify({"error": "Invalid filename"}), 400

    file_path = os.path.join(target_dir, safe_filename)

    try:
        uploaded_file.save(file_path)

        if target_path:
            relative_file_path = os.path.join(target_path, safe_filename)
        else:
            relative_file_path = safe_filename

        return jsonify({"success": True, "filename": safe_filename, "path": relative_file_path})

    except Exception:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        return jsonify({"error": "Error saving file"}), 500


@login_required
def appdrive_delete_file():
    container_name = request.json.get("container")
    mount_index = request.json.get("mount", 0)
    file_name = request.json.get("file")

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not file_name:
        return jsonify({"error": "File name is required"}), 400

    try:
        mount_index = int(mount_index)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]

    if mount["read_only"]:
        return jsonify({"error": "This mount is read-only"}), 403

    base_dir = mount["host_path"]

    try:
        file_path = validate_safe_path(base_dir, file_name)
    except ValueError:
        return jsonify({"error": "Invalid file path"}), 400

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        validate_no_symlinks(file_path, base_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    try:
        if os.path.isdir(file_path):
            shutil.rmtree(file_path)
            return jsonify({"success": True, "message": f"Folder '{os.path.basename(file_name)}' deleted successfully"})
        else:
            os.remove(file_path)
            return jsonify({"success": True, "message": f"File '{os.path.basename(file_name)}' deleted successfully"})
    except Exception:
        return jsonify({"error": "Error deleting item"}), 500


@login_required
def appdrive_create_folder():
    container_name = request.json.get("container")
    mount_index = request.json.get("mount", 0)
    folder_name = request.json.get("name", "").strip()
    parent_path = request.json.get("path", "").strip()

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not folder_name:
        return jsonify({"error": "Folder name is required"}), 400

    try:
        mount_index = int(mount_index)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]

    if mount["read_only"]:
        return jsonify({"error": "This mount is read-only"}), 403

    base_dir = mount["host_path"]

    try:
        validated_name = validate_filename(folder_name)
    except ValueError:
        return jsonify({"error": "Invalid folder name"}), 400

    try:
        if parent_path:
            parent_dir = validate_safe_path(base_dir, parent_path)
        else:
            parent_dir = base_dir
    except ValueError:
        return jsonify({"error": "Invalid parent path"}), 400

    if not os.path.exists(parent_dir):
        return jsonify({"error": "Parent folder not found"}), 404

    if not os.path.isdir(parent_dir):
        return jsonify({"error": "Parent path is not a directory"}), 400

    try:
        validate_no_symlinks(parent_dir, base_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    new_folder_path = os.path.join(parent_dir, validated_name)

    if os.path.exists(new_folder_path):
        return jsonify({"error": "Folder already exists"}), 409

    try:
        os.makedirs(new_folder_path, mode=0o755, exist_ok=True)
        relative_path = os.path.relpath(new_folder_path, base_dir)
        return jsonify({"success": True, "message": f"Folder '{validated_name}' created successfully", "path": relative_path})
    except OSError:
        return jsonify({"error": "Error creating folder"}), 500


@login_required
def appdrive_rename_item():
    container_name = request.json.get("container")
    mount_index = request.json.get("mount", 0)
    old_name = request.json.get("old_name", "").strip()
    new_name = request.json.get("new_name", "").strip()

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not old_name or not new_name:
        return jsonify({"error": "Both old_name and new_name are required"}), 400

    try:
        mount_index = int(mount_index)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]

    if mount["read_only"]:
        return jsonify({"error": "This mount is read-only"}), 403

    base_dir = mount["host_path"]

    try:
        validated_new_name = validate_filename(new_name)
    except ValueError:
        return jsonify({"error": "Invalid new name"}), 400

    try:
        old_path = validate_safe_path(base_dir, old_name)
    except ValueError:
        return jsonify({"error": "Invalid old path"}), 400

    if not os.path.exists(old_path):
        return jsonify({"error": "Item not found"}), 404

    try:
        validate_no_symlinks(old_path, base_dir)
    except ValueError:
        return jsonify({"error": "Security violation"}), 403

    parent_dir = os.path.dirname(old_path)
    new_path = os.path.join(parent_dir, validated_new_name)

    try:
        new_path = validate_safe_path(base_dir, os.path.relpath(new_path, base_dir))
    except ValueError:
        return jsonify({"error": "Invalid new path"}), 400

    if os.path.exists(new_path):
        return jsonify({"error": "An item with that name already exists"}), 409

    try:
        os.replace(old_path, new_path)
        relative_path = os.path.relpath(new_path, base_dir)
        return jsonify({"success": True, "message": f"Renamed to '{validated_new_name}' successfully", "new_path": relative_path})
    except OSError:
        return jsonify({"error": "Error renaming item"}), 500


@login_required
def appdrive_download_multiple():
    container_name = request.json.get("container")
    mount_index = request.json.get("mount", 0)
    file_names = request.json.get("files", [])

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not file_names or not isinstance(file_names, list) or len(file_names) == 0:
        return jsonify({"error": "At least one file is required"}), 400

    try:
        mount_index = int(mount_index)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid mount index"}), 400

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return jsonify({"error": "No accessible mounts found for this container"}), 404

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return jsonify({"error": "Invalid mount index"}), 400

    mount = valid_mounts[mount_index]
    base_dir = mount["host_path"]

    try:
        memory_zip = io.BytesIO()
        file_count = 0
        start_time = time.time()
        with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_name in file_names:
                try:
                    file_path = validate_safe_path(base_dir, file_name)
                except ValueError:
                    continue

                if not os.path.exists(file_path):
                    continue

                try:
                    validate_no_symlinks(file_path, base_dir)
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
                                validate_no_symlinks(abs_path, base_dir)
                                arc_name = os.path.join(dir_basename, os.path.relpath(abs_path, file_path))
                                zf.write(abs_path, arc_name)
                            except (ValueError, PermissionError):
                                continue
                else:
                    file_count += 1
                    if file_count > MAX_FILES_FOR_ZIP:
                        return jsonify({"error": "Too many files to download"}), 400
                    try:
                        arc_name = os.path.basename(file_name)
                        zf.write(file_path, arc_name)
                    except PermissionError:
                        continue

        memory_zip.seek(0)
        zip_hash = hashlib.md5(memory_zip.getvalue()).hexdigest()[:6]
        zip_name = f"download_{zip_hash}.zip"
        return send_file(memory_zip, mimetype="application/zip", as_attachment=True, download_name=zip_name)

    except Exception:
        return jsonify({"error": "Error creating ZIP"}), 500
