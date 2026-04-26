"""
hd_UIDisksPlus.py
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

import psutil
from flask import send_file, jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsDiskEnum import find_disk_by_id, enumerate_disks
from pymodules.hd_FunctionsSecurity import validate_safe_path, validate_filename, validate_no_symlinks, calculate_directory_size_ddos_safe
from pymodules.hd_DisksPlusAuth import authorize_request, matching_danger_zone, is_danger_zone_path


MAX_FILES_FOR_ZIP = 50000
MAX_TIME_FOR_ZIP = 30.0
MAX_SEARCH_RESULTS = 500
MAX_SEARCH_TIME = 20.0
MAX_FILES_FOR_SEARCH = 200000
MAX_FILES_FOR_SIZE_CALC = 10000
MAX_TIME_FOR_SIZE_CALC = 2.0

_REMOTE_FSTYPE_PREFIXES = (
    "nfs",
    "cifs",
    "smb",
    "smbfs",
    "sshfs",
    "fuse.sshfs",
    "fuse.rclone",
    "davfs",
    "fuse.davfs",
    "webdav",
    "afpfs",
    "9p",
    "virtiofs",
)


def _remote_mount_set():
    remote = set()
    try:
        partitions = psutil.disk_partitions(all=True)
    except Exception:
        return remote
    for p in partitions:
        fstype = (p.fstype or "").lower()
        opts = (p.opts or "").lower()
        if fstype.startswith(_REMOTE_FSTYPE_PREFIXES) or "remote" in opts.split(","):
            mp = p.mountpoint
            if mp:
                remote.add(os.path.normpath(mp))
    return remote


def _resolve_disk():
    disk_id_arg = request.args.get("disk") or (request.get_json(silent=True) or {}).get("disk") if request.method == "GET" else None
    if request.method != "GET":
        json_body = request.get_json(silent=True) or {}
        disk_id_arg = json_body.get("disk") or request.form.get("disk") or request.args.get("disk")

    if not disk_id_arg:
        return None, (jsonify({"error": "missing_disk"}), 400)

    disk = find_disk_by_id(disk_id_arg)
    if disk is None:
        return None, (jsonify({"error": "disk_not_found"}), 404)

    mountpoint = disk.get("mountpoint") or ""
    if not mountpoint or not os.path.isdir(mountpoint):
        return None, (jsonify({"error": "disk_not_mounted"}), 404)

    return disk, None


def _check_access(absolute_path):
    ok, code, status = authorize_request(absolute_path)
    if ok:
        return None
    zone = matching_danger_zone(absolute_path)
    payload = {
        "error": code,
        "requires_danger_auth": code == "danger_zone_reauth_required",
        "is_danger_zone": zone is not None,
        "path": absolute_path,
    }
    if zone is not None:
        payload["zone"] = zone
    return jsonify(payload), status or 401


def _build_absolute(base_dir, user_path):
    try:
        return validate_safe_path(base_dir, user_path)
    except ValueError:
        raise


@login_required
def disksplus_list_disks():
    ok, code, status = authorize_request(None)
    if not ok:
        return jsonify({"error": code}), status or 401
    disks = enumerate_disks()
    return jsonify({"disks": disks})


@login_required
def disksplus_list_files():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    requested_path = request.args.get("path", "").strip()

    try:
        current_dir = _build_absolute(base_dir, requested_path) if requested_path else os.path.realpath(os.path.abspath(base_dir))
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(current_dir)
    if access_err:
        return access_err

    if not os.path.exists(current_dir):
        return jsonify({"error": "path_not_found"}), 404
    if not os.path.isdir(current_dir):
        return jsonify({"error": "not_a_directory"}), 400

    try:
        validate_no_symlinks(current_dir, base_dir)
    except ValueError:
        return jsonify({"error": "security_violation"}), 403

    remote_mounts = _remote_mount_set()
    if os.path.normpath(current_dir) in remote_mounts:
        return jsonify({"error": "remote_unreachable"}), 504

    files = []
    try:
        entries = os.listdir(current_dir)
    except PermissionError:
        return jsonify({"error": "permission_denied"}), 403
    except OSError:
        return jsonify({"error": "read_failed"}), 500

    for item in entries:
        item_path = os.path.join(current_dir, item)
        if os.path.normpath(item_path) in remote_mounts:
            continue
        if os.path.islink(item_path):
            continue
        try:
            stats = os.stat(item_path)
            is_directory = os.path.isdir(item_path)
            if is_directory:
                size, exceeded = 0, False
            else:
                size, exceeded = stats.st_size, False
            rel = os.path.relpath(item_path, base_dir).replace("\\", "/")
            files.append(
                {
                    "name": rel,
                    "display_name": item,
                    "size": size,
                    "modified": stats.st_mtime,
                    "is_directory": is_directory,
                    "size_exceeded": exceeded,
                    "is_danger_zone": is_danger_zone_path(item_path),
                }
            )
        except (OSError, PermissionError):
            continue

    rel_current = os.path.relpath(current_dir, base_dir).replace("\\", "/")
    if rel_current == ".":
        rel_current = ""

    return jsonify(
        {
            "files": files,
            "current_path": rel_current,
            "disk": {"id": disk["id"], "mountpoint": disk["mountpoint"], "label": disk["label"], "media_type": disk["media_type"]},
        }
    )


@login_required
def disksplus_download_file():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    file_name = request.args.get("file")
    if not file_name:
        return jsonify({"error": "no_file_specified"}), 400

    try:
        file_path = _build_absolute(base_dir, file_name)
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(file_path)
    if access_err:
        return access_err

    if not os.path.exists(file_path):
        return jsonify({"error": "file_not_found"}), 404

    try:
        validate_no_symlinks(file_path, base_dir)
    except ValueError:
        return jsonify({"error": "security_violation"}), 403

    if os.path.isdir(file_path):
        return _zip_directory(file_path, base_dir)

    try:
        return send_file(file_path, mimetype="application/octet-stream", as_attachment=True, download_name=os.path.basename(file_name))
    except Exception:
        return jsonify({"error": "read_failed"}), 500


def _zip_directory(dir_path, base_dir):
    try:
        memory_zip = io.BytesIO()
        file_count = 0
        start_time = time.time()
        dir_basename = os.path.basename(dir_path.rstrip(os.sep)) or "download"
        remote_mounts = _remote_mount_set()

        with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, dirs, files in os.walk(dir_path):
                dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d)) and os.path.normpath(os.path.join(root, d)) not in remote_mounts]
                for file in files:
                    file_count += 1
                    if file_count > MAX_FILES_FOR_ZIP:
                        return jsonify({"error": "too_many_files"}), 400
                    if (time.time() - start_time) > MAX_TIME_FOR_ZIP:
                        return jsonify({"error": "zip_timeout"}), 400
                    abs_path = os.path.join(root, file)
                    if os.path.islink(abs_path):
                        continue
                    try:
                        validate_no_symlinks(abs_path, base_dir)
                        arc_name = os.path.join(dir_basename, os.path.relpath(abs_path, dir_path))
                        zf.write(abs_path, arc_name)
                    except (ValueError, PermissionError, OSError):
                        continue

        memory_zip.seek(0)
        zip_hash = hashlib.md5(memory_zip.getvalue()).hexdigest()[:6]
        zip_name = f"{dir_basename}_{zip_hash}.zip"
        return send_file(memory_zip, mimetype="application/zip", as_attachment=True, download_name=zip_name)
    except Exception:
        return jsonify({"error": "zip_failed"}), 500


@login_required
def disksplus_upload_file():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    uploaded_file = request.files.get("file")
    if not uploaded_file:
        return jsonify({"error": "no_file_uploaded"}), 400

    target_path = request.form.get("path", "").strip()

    try:
        target_dir = _build_absolute(base_dir, target_path) if target_path else os.path.realpath(os.path.abspath(base_dir))
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(target_dir)
    if access_err:
        return access_err

    if os.path.exists(target_dir):
        if not os.path.isdir(target_dir):
            return jsonify({"error": "target_not_a_directory"}), 400
        try:
            validate_no_symlinks(target_dir, base_dir)
        except ValueError:
            return jsonify({"error": "security_violation"}), 403
    else:
        try:
            os.makedirs(target_dir, exist_ok=True)
        except OSError:
            return jsonify({"error": "cannot_create_target"}), 500
        try:
            validate_no_symlinks(target_dir, base_dir)
        except ValueError:
            return jsonify({"error": "security_violation"}), 403

    original_filename = uploaded_file.filename
    if not original_filename:
        return jsonify({"error": "no_filename"}), 400

    try:
        safe_filename = validate_filename(original_filename)
    except ValueError:
        return jsonify({"error": "invalid_filename"}), 400

    file_path = os.path.join(target_dir, safe_filename)

    try:
        uploaded_file.save(file_path)
        rel_path = os.path.relpath(file_path, base_dir).replace("\\", "/")
        return jsonify({"success": True, "filename": safe_filename, "path": rel_path})
    except Exception:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        return jsonify({"error": "save_failed"}), 500


@login_required
def disksplus_delete_file():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    body = request.get_json(silent=True) or {}
    file_name = body.get("file")
    if not file_name:
        return jsonify({"error": "no_file_specified"}), 400

    try:
        file_path = _build_absolute(base_dir, file_name)
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(file_path)
    if access_err:
        return access_err

    if not os.path.exists(file_path):
        return jsonify({"error": "file_not_found"}), 404

    try:
        validate_no_symlinks(file_path, base_dir)
    except ValueError:
        return jsonify({"error": "security_violation"}), 403

    try:
        if os.path.isdir(file_path):
            shutil.rmtree(file_path)
        else:
            os.remove(file_path)
        return jsonify({"success": True})
    except Exception:
        return jsonify({"error": "delete_failed"}), 500


@login_required
def disksplus_create_folder():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    body = request.get_json(silent=True) or {}
    folder_name = (body.get("name") or "").strip()
    parent_path = (body.get("path") or "").strip()

    if not folder_name:
        return jsonify({"error": "name_required"}), 400

    try:
        validated_name = validate_filename(folder_name)
    except ValueError:
        return jsonify({"error": "invalid_name"}), 400

    try:
        parent_dir = _build_absolute(base_dir, parent_path) if parent_path else os.path.realpath(os.path.abspath(base_dir))
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(parent_dir)
    if access_err:
        return access_err

    if not os.path.isdir(parent_dir):
        return jsonify({"error": "parent_not_a_directory"}), 400

    try:
        validate_no_symlinks(parent_dir, base_dir)
    except ValueError:
        return jsonify({"error": "security_violation"}), 403

    new_folder_path = os.path.join(parent_dir, validated_name)

    if os.path.exists(new_folder_path):
        return jsonify({"error": "already_exists"}), 409

    try:
        os.makedirs(new_folder_path, mode=0o755, exist_ok=False)
        rel_path = os.path.relpath(new_folder_path, base_dir).replace("\\", "/")
        return jsonify({"success": True, "path": rel_path})
    except OSError:
        return jsonify({"error": "create_failed"}), 500


@login_required
def disksplus_rename_item():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    body = request.get_json(silent=True) or {}
    old_name = (body.get("old_name") or "").strip()
    new_name = (body.get("new_name") or "").strip()

    if not old_name or not new_name:
        return jsonify({"error": "old_and_new_name_required"}), 400

    try:
        validated_new_name = validate_filename(new_name)
    except ValueError:
        return jsonify({"error": "invalid_new_name"}), 400

    try:
        old_path = _build_absolute(base_dir, old_name)
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(old_path)
    if access_err:
        return access_err

    if not os.path.exists(old_path):
        return jsonify({"error": "item_not_found"}), 404

    try:
        validate_no_symlinks(old_path, base_dir)
    except ValueError:
        return jsonify({"error": "security_violation"}), 403

    parent_dir = os.path.dirname(old_path)
    new_path = os.path.join(parent_dir, validated_new_name)

    try:
        rel_new = os.path.relpath(new_path, base_dir)
        new_path = _build_absolute(base_dir, rel_new)
    except ValueError:
        return jsonify({"error": "invalid_new_path"}), 400

    access_err = _check_access(new_path)
    if access_err:
        return access_err

    if os.path.exists(new_path):
        return jsonify({"error": "already_exists"}), 409

    try:
        os.replace(old_path, new_path)
        rel_path = os.path.relpath(new_path, base_dir).replace("\\", "/")
        return jsonify({"success": True, "new_path": rel_path})
    except OSError:
        return jsonify({"error": "rename_failed"}), 500


@login_required
def disksplus_download_multiple():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    body = request.get_json(silent=True) or {}
    file_names = body.get("files", [])
    if not isinstance(file_names, list) or not file_names:
        return jsonify({"error": "files_required"}), 400

    resolved_paths = []
    for file_name in file_names:
        if not isinstance(file_name, str) or not file_name:
            continue
        try:
            abs_path = _build_absolute(base_dir, file_name)
        except ValueError:
            continue
        resolved_paths.append((file_name, abs_path))

    if not resolved_paths:
        return jsonify({"error": "no_valid_paths"}), 400

    unique_zones = {}
    for _, abs_path in resolved_paths:
        zone = matching_danger_zone(abs_path)
        if zone is not None and zone not in unique_zones:
            unique_zones[zone] = abs_path

    ok, code, status = authorize_request(None)
    if not ok:
        return jsonify({"error": code, "requires_danger_auth": False, "is_danger_zone": False}), status or 401

    for zone, representative_path in unique_zones.items():
        ok, code, status = authorize_request(representative_path)
        if not ok:
            return jsonify({"error": code, "requires_danger_auth": code == "danger_zone_reauth_required", "is_danger_zone": True, "zone": zone, "path": representative_path}), status or 401

    try:
        memory_zip = io.BytesIO()
        file_count = 0
        start_time = time.time()
        remote_mounts = _remote_mount_set()

        with zipfile.ZipFile(memory_zip, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_name, abs_path in resolved_paths:
                if os.path.normpath(abs_path) in remote_mounts:
                    continue
                if not os.path.exists(abs_path):
                    continue
                try:
                    validate_no_symlinks(abs_path, base_dir)
                except ValueError:
                    continue

                if os.path.isdir(abs_path):
                    dir_basename = os.path.basename(abs_path.rstrip(os.sep)) or os.path.basename(file_name)
                    for root, dirs, files in os.walk(abs_path):
                        dirs[:] = [d for d in dirs if not os.path.islink(os.path.join(root, d)) and os.path.normpath(os.path.join(root, d)) not in remote_mounts]
                        for file in files:
                            file_count += 1
                            if file_count > MAX_FILES_FOR_ZIP:
                                return jsonify({"error": "too_many_files"}), 400
                            if (time.time() - start_time) > MAX_TIME_FOR_ZIP:
                                return jsonify({"error": "zip_timeout"}), 400
                            inner_abs = os.path.join(root, file)
                            if os.path.islink(inner_abs):
                                continue
                            try:
                                validate_no_symlinks(inner_abs, base_dir)
                                arc_name = os.path.join(dir_basename, os.path.relpath(inner_abs, abs_path))
                                zf.write(inner_abs, arc_name)
                            except (ValueError, PermissionError, OSError):
                                continue
                else:
                    file_count += 1
                    if file_count > MAX_FILES_FOR_ZIP:
                        return jsonify({"error": "too_many_files"}), 400
                    try:
                        zf.write(abs_path, os.path.basename(abs_path))
                    except (PermissionError, OSError):
                        continue

        memory_zip.seek(0)
        zip_hash = hashlib.md5(memory_zip.getvalue()).hexdigest()[:6]
        zip_name = f"disk_download_{zip_hash}.zip"
        return send_file(memory_zip, mimetype="application/zip", as_attachment=True, download_name=zip_name)
    except Exception:
        return jsonify({"error": "zip_failed"}), 500


@login_required
def disksplus_search_files():
    disk, err = _resolve_disk()
    if err:
        return err
    base_dir = disk["mountpoint"]

    search_query = request.args.get("query", "").strip().lower()
    if not search_query:
        return jsonify({"files": []})

    search_path = request.args.get("path", "").strip()
    try:
        search_root = _build_absolute(base_dir, search_path) if search_path else os.path.realpath(os.path.abspath(base_dir))
    except ValueError:
        return jsonify({"error": "invalid_path"}), 400

    access_err = _check_access(search_root)
    if access_err:
        return access_err

    if not os.path.isdir(search_root):
        return jsonify({"error": "not_a_directory"}), 400

    remote_mounts = _remote_mount_set()
    if os.path.normpath(search_root) in remote_mounts:
        return jsonify({"files": []})

    search_root_zone = matching_danger_zone(search_root)

    matching_files = []
    items_scanned = 0
    start_time = time.time()

    try:
        for root, dirs, files_list in os.walk(search_root):
            pruned = []
            for d in dirs:
                if d.startswith("."):
                    continue
                d_path = os.path.join(root, d)
                if os.path.normpath(d_path) in remote_mounts:
                    continue
                try:
                    if os.path.islink(d_path):
                        continue
                except OSError:
                    continue
                if search_root_zone is None and is_danger_zone_path(d_path):
                    continue
                pruned.append(d)
            dirs[:] = pruned

            items_scanned += len(files_list) + len(dirs)
            if items_scanned > MAX_FILES_FOR_SEARCH:
                break
            if (time.time() - start_time) > MAX_SEARCH_TIME:
                break

            all_items = files_list + dirs
            for item in all_items:
                if len(matching_files) >= MAX_SEARCH_RESULTS:
                    break
                if item.startswith("."):
                    continue
                if search_query not in item.lower():
                    continue

                item_path = os.path.join(root, item)
                if os.path.islink(item_path):
                    continue

                if search_root_zone is None and is_danger_zone_path(item_path):
                    continue

                try:
                    stats = os.stat(item_path)
                    is_directory = os.path.isdir(item_path)
                    if is_directory:
                        size, exceeded = 0, False
                    else:
                        size, exceeded = stats.st_size, False

                    rel_path = os.path.relpath(item_path, base_dir).replace("\\", "/")
                    parent_folder = os.path.dirname(rel_path)
                    display_name = f"{parent_folder}/{item}" if parent_folder else item

                    matching_files.append(
                        {
                            "name": rel_path,
                            "display_name": display_name,
                            "size": size,
                            "modified": stats.st_mtime,
                            "is_directory": is_directory,
                            "size_exceeded": exceeded,
                            "is_danger_zone": is_danger_zone_path(item_path),
                        }
                    )
                except (OSError, PermissionError):
                    continue

            if len(matching_files) >= MAX_SEARCH_RESULTS:
                break
    except PermissionError:
        return jsonify({"error": "permission_denied"}), 403

    matching_files.sort(key=lambda x: (not x["display_name"].lower().startswith(search_query), x["display_name"].lower()))

    return jsonify({"files": matching_files})
