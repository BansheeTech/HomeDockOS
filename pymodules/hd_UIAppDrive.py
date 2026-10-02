"""
hd_UIAppDrive.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import re
import time
import shutil
import zipfile
import hashlib

from flask import send_file, jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import running_OS
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_FunctionsSecurity import validate_safe_path, validate_filename, validate_no_symlinks, calculate_directory_size_ddos_safe
from pymodules.hd_FunctionsSanitize import sanitize_container_name
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_ChunkedUpload import init_upload, write_chunk, get_manifest, assemble_to_path, cleanup, is_temp_file, ChunkedUploadError
from pymodules.hd_DisksPlusAuth import authorize_request, matching_danger_zone, get_danger_zones
from pymodules.hd_FunctionsDiskEnum import visible_mountpoints
from pymodules.hd_ImageThumbnails import thumbnail_response
from pymodules.hd_ExtendedSupportImage import preview_response

MAX_FILES_FOR_SIZE_CALC = 10000
MAX_TIME_FOR_SIZE_CALC = 2.0
MAX_FILES_FOR_ZIP = 50000
MAX_TIME_FOR_ZIP = 30.0
MAX_SEARCH_RESULTS = 500
MAX_SEARCH_TIME = 10.0

_WINDOWS_DOCKER_DRIVE_RE = re.compile(r"^(?:/run/desktop/mnt/host|/host_mnt|/mnt)/([a-zA-Z])(?:/(.*))?$")
_WINDOWS_DRIVE_PATH_RE = re.compile(r"^[a-zA-Z]:[\\/]")


def _host_source_path(source):
    if running_OS != "Windows":
        return source

    match = _WINDOWS_DOCKER_DRIVE_RE.match(source)
    if match:
        return f"{match.group(1).upper()}:\\" + (match.group(2) or "").replace("/", "\\")

    if _WINDOWS_DRIVE_PATH_RE.match(source):
        return source[0].upper() + source[1:].replace("/", "\\")

    return source


def _is_within(path, root):
    path_key = os.path.normcase(os.path.normpath(path))
    root_key = os.path.normcase(os.path.normpath(root))

    return path_key == root_key or path_key.startswith(root_key.rstrip(os.path.sep) + os.path.sep)


def _within_visible_mount(path, mountpoints):
    return any(mountpoint != os.path.sep and _is_within(path, mountpoint) for mountpoint in mountpoints)


def _external_mount_path(source):
    try:
        real = os.path.realpath(_host_source_path(source))
    except (OSError, ValueError):
        return None

    if is_docker:
        mountpoints = visible_mountpoints()
        if not _within_visible_mount(os.path.normpath(source), mountpoints) or not _within_visible_mount(real, mountpoints):
            return None

    if not os.path.isdir(real) or not os.access(real, os.R_OK | os.X_OK):
        return None

    return real


def _external_access_denied(mount, absolute_path):
    if not mount.get("external"):
        return None

    target = os.path.realpath(absolute_path)
    ok, code, status = authorize_request(target, scope=mount["scope"])

    if ok:
        return None

    zone = matching_danger_zone(target)
    payload = {"error": code, "requires_danger_auth": code == "danger_zone_reauth_required", "is_danger_zone": zone is not None, "path": target}

    if zone is not None:
        payload["zone"] = zone

    return jsonify(payload), status or 401


def _external_subtree_denied(mount, absolute_path):
    denied = _external_access_denied(mount, absolute_path)
    if denied or not mount.get("external"):
        return denied

    root = os.path.realpath(absolute_path)
    prefix = root if root.endswith(os.sep) else root + os.sep

    for zone in get_danger_zones():
        if os.path.normpath(zone).startswith(prefix):
            denied = _external_access_denied(mount, zone)
            if denied:
                return denied

    return None


def _external_path_blocked(mount, absolute_path):
    if not mount.get("external") or matching_danger_zone(absolute_path) is None:
        return False

    ok, _code, _status = authorize_request(absolute_path, scope=mount["scope"])
    return not ok


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


def app_unlock_scope(container):
    return container.labels.get("HDGroup") or container.name


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
        scope = app_unlock_scope(container)

        valid_mounts = []
        for mount in mounts:
            source = mount.get("Source", "")
            destination = mount.get("Destination", "")
            mount_type = mount.get("Type", "bind")

            if not source or not destination:
                continue

            source_normalized = os.path.normpath(_host_source_path(source))

            if _is_within(source_normalized, homedock_root):
                if is_docker:
                    data_root = os.environ.get("DATA_ROOT", "/DATA")
                    internal_path = "/DATA" + source_normalized[len(os.path.normpath(data_root)) :]
                else:
                    internal_path = source_normalized

                valid_mounts.append({"host_path": internal_path, "container_path": destination, "type": mount_type, "read_only": mount.get("RW", True) is False, "external": False, "danger_zone": None, "scope": scope})
                continue

            external_path = _external_mount_path(source)

            if external_path:
                valid_mounts.append({"host_path": external_path, "container_path": destination, "type": mount_type, "read_only": mount.get("RW", True) is False, "external": True, "danger_zone": matching_danger_zone(external_path), "scope": scope})

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
                    containers_with_mounts.append({"name": container.name, "sanitized_name": sanitized_name, "status": container.status, "mounts_count": len(valid_mounts), "has_external": any(mount["external"] for mount in valid_mounts), "scope": app_unlock_scope(container)})

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

    denied = _external_access_denied(mount, current_dir)
    if denied:
        return denied

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

    denied = _external_access_denied(mount, file_path)
    if denied:
        return denied

    if os.path.isdir(file_path):
        try:
            memory_zip = io.BytesIO()
            file_count = 0
            start_time = time.time()
            with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(file_path):
                    dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d)) and not _external_path_blocked(mount, os.path.join(root, d))]
                    for file in files:
                        if is_temp_file(file):
                            continue
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


def _resolve_image_file():
    container_name = request.args.get("container")
    file_name = request.args.get("file")

    if not container_name:
        return None, None, (jsonify({"error": "Container name is required"}), 400)

    if not file_name:
        return None, None, (jsonify({"error": "File name is required"}), 400)

    try:
        mount_index = int(request.args.get("mount", "0"))
    except ValueError:
        return None, None, (jsonify({"error": "Invalid mount index"}), 400)

    valid_mounts = get_container_valid_mounts(container_name)

    if not valid_mounts:
        return None, None, (jsonify({"error": "No accessible mounts found for this container"}), 404)

    if mount_index < 0 or mount_index >= len(valid_mounts):
        return None, None, (jsonify({"error": "Invalid mount index"}), 400)

    mount = valid_mounts[mount_index]
    base_dir = mount["host_path"]

    try:
        file_path = validate_safe_path(base_dir, file_name)
    except ValueError:
        return None, None, (jsonify({"error": "Invalid file path"}), 400)

    if not os.path.isfile(file_path):
        return None, None, (jsonify({"error": "File not found"}), 404)

    try:
        validate_no_symlinks(file_path, base_dir)
    except ValueError:
        return None, None, (jsonify({"error": "Security violation"}), 403)

    denied = _external_access_denied(mount, file_path)
    if denied:
        return None, None, denied

    return file_path, mount, None


@login_required
def appdrive_thumbnail_file():
    file_path, mount, err = _resolve_image_file()
    if err:
        return err

    return thumbnail_response(file_path, cache_owner=None if mount.get("external") else current_user.id.lower())


@login_required
def appdrive_preview_file():
    file_path, _mount, err = _resolve_image_file()
    if err:
        return err

    return preview_response(file_path)


@login_required
def appdrive_edit_file():
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

    denied = _external_access_denied(mount, target_dir)
    if denied:
        return denied

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


def _resolve_appdrive_mount(container_name, mount_index_raw):
    if not container_name:
        raise ValueError("missing_container")
    try:
        mount_index = int(mount_index_raw)
    except (TypeError, ValueError):
        raise ValueError("invalid_mount_index")
    valid_mounts = get_container_valid_mounts(container_name)
    if not valid_mounts:
        raise ValueError("no_accessible_mounts")
    if mount_index < 0 or mount_index >= len(valid_mounts):
        raise ValueError("invalid_mount_index")
    mount = valid_mounts[mount_index]
    if mount["read_only"]:
        raise ValueError("read_only_mount")
    return mount


def _resolve_appdrive_target(base_dir, target_path, original_filename):
    target_dir = validate_safe_path(base_dir, target_path) if target_path else base_dir
    if os.path.exists(target_dir):
        validate_no_symlinks(target_dir, base_dir)
    safe_filename = validate_filename(original_filename)
    return target_dir, safe_filename


_APPDRIVE_ERR_STATUS = {
    "missing_container": 400,
    "invalid_mount_index": 400,
    "no_accessible_mounts": 404,
    "read_only_mount": 403,
    "invalid_path": 400,
    "invalid_filename": 400,
}


def _appdrive_err(code):
    return jsonify({"error": code}), _APPDRIVE_ERR_STATUS.get(code, 400)


@login_required
def appdrive_upload_init():
    body = request.get_json(silent=True) or {}
    container_name = body.get("container")
    mount_index_raw = body.get("mount", "0")
    filename = body.get("filename")
    total_size = body.get("total_size")
    total_chunks = body.get("total_chunks")
    target_path = (body.get("target_path") or "").strip()

    try:
        mount = _resolve_appdrive_mount(container_name, mount_index_raw)
    except ValueError as ve:
        return _appdrive_err(str(ve))

    base_dir = mount["host_path"]
    try:
        target_dir, _safe = _resolve_appdrive_target(base_dir, target_path, filename or "")
    except ValueError:
        return _appdrive_err("invalid_path")

    denied = _external_access_denied(mount, target_dir)
    if denied:
        return denied

    if not os.path.exists(target_dir):
        try:
            os.makedirs(target_dir, mode=0o755, exist_ok=True)
        except OSError:
            return jsonify({"error": "cannot_create_target"}), 500
        try:
            validate_no_symlinks(target_dir, base_dir)
        except ValueError:
            return jsonify({"error": "security_violation"}), 403

    user_name = current_user.id.lower()
    try:
        result = init_upload(user_name, "appdrive", filename, total_size, total_chunks, target_path, assembled_dir=target_dir, extra={"container": container_name, "mount_index": int(mount_index_raw)})
    except ChunkedUploadError as e:
        return jsonify({"error": e.code, "message": e.message}), e.status

    return jsonify({"success": True, **result})


@login_required
def appdrive_upload_chunk():
    user_name = current_user.id.lower()
    upload_id = request.args.get("upload_id", "")
    try:
        chunk_index = int(request.args.get("chunk_index", ""))
    except (TypeError, ValueError):
        return jsonify({"error": "invalid_chunk_index"}), 400

    raw = request.get_data(cache=False, as_text=False)

    try:
        result = write_chunk(user_name, upload_id, chunk_index, raw)
    except ChunkedUploadError as e:
        return jsonify({"error": e.code, "message": e.message}), e.status

    return jsonify({"success": True, **result})


@login_required
def appdrive_upload_finalize():
    user_name = current_user.id.lower()
    body = request.get_json(silent=True) or {}
    upload_id = body.get("upload_id", "")

    try:
        manifest = get_manifest(user_name, upload_id, expected_kind="appdrive")
    except ChunkedUploadError as e:
        return jsonify({"error": e.code, "message": e.message}), e.status

    extra = manifest.get("extra") or {}
    container_name = extra.get("container")
    mount_index_raw = extra.get("mount_index")
    target_path = (manifest.get("target_path") or "").strip()
    filename = manifest.get("filename") or ""

    try:
        mount = _resolve_appdrive_mount(container_name, mount_index_raw)
    except ValueError as ve:
        cleanup(user_name, upload_id)
        return _appdrive_err(str(ve))

    base_dir = mount["host_path"]
    try:
        target_dir, safe_filename = _resolve_appdrive_target(base_dir, target_path, filename)
    except ValueError:
        cleanup(user_name, upload_id)
        return _appdrive_err("invalid_path")

    denied = _external_access_denied(mount, target_dir)
    if denied:
        cleanup(user_name, upload_id)
        return denied

    final_path = os.path.join(target_dir, safe_filename)

    try:
        assemble_to_path(user_name, upload_id, final_path)
    except ChunkedUploadError as e:
        cleanup(user_name, upload_id)
        return jsonify({"error": e.code, "message": e.message}), e.status
    except OSError:
        cleanup(user_name, upload_id)
        return jsonify({"error": "save_failed"}), 500

    cleanup(user_name, upload_id)

    relative_file_path = os.path.join(target_path, safe_filename) if target_path else safe_filename
    relative_file_path = relative_file_path.replace("\\", "/")
    return jsonify({"success": True, "filename": safe_filename, "path": relative_file_path})


@login_required
def appdrive_upload_abort():
    user_name = current_user.id.lower()
    body = request.get_json(silent=True) or {}
    upload_id = body.get("upload_id") or request.args.get("upload_id", "")

    try:
        get_manifest(user_name, upload_id, expected_kind="appdrive")
    except ChunkedUploadError as e:
        return jsonify({"error": e.code, "message": e.message}), e.status

    cleanup(user_name, upload_id)
    return jsonify({"success": True})


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

    if os.path.realpath(file_path) == os.path.realpath(base_dir):
        return jsonify({"error": "The volume root cannot be deleted"}), 400

    denied = _external_subtree_denied(mount, file_path)
    if denied:
        return denied

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

    denied = _external_access_denied(mount, new_folder_path)
    if denied:
        return denied

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

    if os.path.realpath(old_path) == os.path.realpath(base_dir):
        return jsonify({"error": "The volume root cannot be renamed"}), 400

    parent_dir = os.path.dirname(old_path)
    new_path = os.path.join(parent_dir, validated_new_name)

    try:
        new_path = validate_safe_path(base_dir, os.path.relpath(new_path, base_dir))
    except ValueError:
        return jsonify({"error": "Invalid new path"}), 400

    denied = _external_subtree_denied(mount, old_path) or _external_access_denied(mount, new_path)
    if denied:
        return denied

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

    for file_name in file_names:
        try:
            requested_path = validate_safe_path(base_dir, file_name)
        except (ValueError, TypeError):
            continue

        denied = _external_access_denied(mount, requested_path)
        if denied:
            return denied

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
                        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d)) and not _external_path_blocked(mount, os.path.join(root, d))]
                        for file in files:
                            if is_temp_file(file):
                                continue
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


@login_required
def appdrive_search_files():
    container_name = request.args.get("container")
    mount_index = request.args.get("mount", "0")
    query = request.args.get("query", "").strip().lower()

    if not container_name:
        return jsonify({"error": "Container name is required"}), 400

    if not query or len(query) < 2:
        return jsonify({"error": "Search query must be at least 2 characters"}), 400

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

    if not os.path.exists(base_dir):
        return jsonify({"error": "Mount path not found"}), 404

    denied = _external_access_denied(mount, base_dir)
    if denied:
        return denied

    files = []
    start_time = time.time()

    try:
        for root, dirs, filenames in os.walk(base_dir):
            if (time.time() - start_time) > MAX_SEARCH_TIME:
                break

            if len(files) >= MAX_SEARCH_RESULTS:
                break

            dirs[:] = [d for d in dirs if not d.startswith(".") and not os.path.islink(os.path.join(root, d)) and not _external_path_blocked(mount, os.path.join(root, d))]

            for dirname in dirs:
                if len(files) >= MAX_SEARCH_RESULTS:
                    break

                if query in dirname.lower():
                    dir_path = os.path.join(root, dirname)

                    if os.path.islink(dir_path):
                        continue

                    try:
                        validate_no_symlinks(dir_path, base_dir)
                        dir_stats = os.stat(dir_path)
                        relative_path = os.path.relpath(dir_path, base_dir)

                        dir_size, size_exceeded = calculate_directory_size_ddos_safe(dir_path)

                        files.append({"name": relative_path, "display_name": dirname, "size": dir_size, "modified": dir_stats.st_mtime, "is_directory": True, "size_exceeded": size_exceeded})
                    except (ValueError, OSError, PermissionError):
                        continue

            for filename in filenames:
                if len(files) >= MAX_SEARCH_RESULTS:
                    break

                if filename.startswith("."):
                    continue

                if query in filename.lower():
                    file_path = os.path.join(root, filename)

                    if os.path.islink(file_path):
                        continue

                    try:
                        validate_no_symlinks(file_path, base_dir)
                        file_stats = os.stat(file_path)
                        relative_path = os.path.relpath(file_path, base_dir)

                        files.append({"name": relative_path, "display_name": filename, "size": file_stats.st_size, "modified": file_stats.st_mtime, "is_directory": False, "size_exceeded": False})
                    except (ValueError, OSError, PermissionError):
                        continue

    except PermissionError:
        return jsonify({"error": "Permission denied"}), 403

    return jsonify({"files": files, "current_path": "", "container_path": mount["container_path"], "read_only": mount["read_only"], "truncated": len(files) >= MAX_SEARCH_RESULTS})
