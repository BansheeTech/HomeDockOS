"""
hd_ChunkedUpload.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import time
import uuid
import errno
import shutil

from pymodules.hd_FunctionsGlobals import chunks_folder

CHUNK_SIZE = 5 * 1024 * 1024
MAX_TOTAL_SIZE = 100 * 1024 * 1024 * 1024
ORPHAN_TTL_SECONDS = 60 * 60
MANIFEST_NAME = "manifest.json"
ASSEMBLED_PREFIX = ".homedock-upload-"

VALID_KINDS = {"storage", "appdrive", "disksplus", "dropzone"}

chunks_root = chunks_folder


def is_temp_file(name):
    return isinstance(name, str) and name.startswith(ASSEMBLED_PREFIX)


class ChunkedUploadError(Exception):
    def __init__(self, code, message, status=400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


def _user_chunks_dir(user):
    safe = user.lower().strip()
    if not safe or "/" in safe or "\\" in safe or safe.startswith(".") or len(safe) > 64:
        raise ChunkedUploadError("invalid_user", "Invalid user identifier", 400)
    return os.path.join(chunks_root, safe)


def _upload_dir(user, upload_id):
    if not isinstance(upload_id, str) or len(upload_id) != 32 or not all(c in "0123456789abcdef" for c in upload_id):
        raise ChunkedUploadError("invalid_upload_id", "Invalid upload identifier", 400)
    return os.path.join(_user_chunks_dir(user), upload_id)


def _manifest_path(upload_dir):
    return os.path.join(upload_dir, MANIFEST_NAME)


def _read_manifest(upload_dir):
    path = _manifest_path(upload_dir)
    if not os.path.exists(path):
        raise ChunkedUploadError("upload_not_found", "Upload session not found", 404)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        raise ChunkedUploadError("manifest_corrupt", "Upload manifest unreadable", 500)


def _write_manifest_atomic(upload_dir, manifest):
    final_path = _manifest_path(upload_dir)
    tmp_path = final_path + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f)
    os.replace(tmp_path, final_path)


def _safe_remove(path):
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


def gc_orphans(user):
    user_dir = _user_chunks_dir(user)
    if not os.path.isdir(user_dir):
        return 0
    removed = 0
    cutoff = time.time() - ORPHAN_TTL_SECONDS
    for entry in os.listdir(user_dir):
        upload_dir = os.path.join(user_dir, entry)
        if not os.path.isdir(upload_dir):
            continue
        manifest_path = _manifest_path(upload_dir)
        try:
            mtime = os.path.getmtime(manifest_path) if os.path.exists(manifest_path) else os.path.getmtime(upload_dir)
        except OSError:
            continue
        if mtime < cutoff:
            assembled_path = None
            try:
                with open(manifest_path, "r", encoding="utf-8") as f:
                    assembled_path = json.load(f).get("assembled_path")
            except (OSError, json.JSONDecodeError):
                pass
            _safe_remove(assembled_path)
            try:
                shutil.rmtree(upload_dir, ignore_errors=True)
                removed += 1
            except OSError:
                pass
    return removed


def init_upload(user, kind, filename, total_size, total_chunks, target_path, assembled_dir, extra=None):
    if kind not in VALID_KINDS:
        raise ChunkedUploadError("invalid_kind", "Invalid upload kind", 400)
    if not isinstance(filename, str) or not filename or len(filename) > 512:
        raise ChunkedUploadError("invalid_filename", "Invalid filename", 400)
    if not isinstance(total_size, int) or total_size <= 0 or total_size > MAX_TOTAL_SIZE:
        raise ChunkedUploadError("invalid_total_size", "Invalid total size", 400)
    if not isinstance(total_chunks, int) or total_chunks <= 0:
        raise ChunkedUploadError("invalid_total_chunks", "Invalid chunk count", 400)
    expected_chunks = (total_size + CHUNK_SIZE - 1) // CHUNK_SIZE
    if total_chunks != expected_chunks:
        raise ChunkedUploadError("chunk_count_mismatch", "Chunk count does not match total size", 400)
    if not isinstance(target_path, str) or len(target_path) > 4096:
        raise ChunkedUploadError("invalid_target_path", "Invalid target path", 400)
    if not isinstance(assembled_dir, str) or not assembled_dir or not os.path.isdir(assembled_dir):
        raise ChunkedUploadError("invalid_assembled_dir", "Assembly directory missing or not writable", 500)

    gc_orphans(user)

    upload_id = uuid.uuid4().hex
    upload_dir = _upload_dir(user, upload_id)
    os.makedirs(upload_dir, mode=0o700, exist_ok=True)

    assembled_path = os.path.join(assembled_dir, f"{ASSEMBLED_PREFIX}{upload_id}")
    try:
        fd = os.open(assembled_path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        os.close(fd)
    except OSError as e:
        shutil.rmtree(upload_dir, ignore_errors=True)
        raise ChunkedUploadError("cannot_create_assembled", f"Cannot create assembly file: {e}", 500)

    manifest = {
        "upload_id": upload_id,
        "kind": kind,
        "filename": filename,
        "total_size": total_size,
        "total_chunks": total_chunks,
        "received_chunks": [],
        "target_path": target_path,
        "assembled_path": assembled_path,
        "extra": extra or {},
        "created_at": time.time(),
    }
    _write_manifest_atomic(upload_dir, manifest)

    return {"upload_id": upload_id, "chunk_size": CHUNK_SIZE}


def write_chunk(user, upload_id, chunk_index, raw_bytes, transform=None, prefix_size=0, require_in_order=False):
    # HDOS00019
    upload_dir = _upload_dir(user, upload_id)
    manifest = _read_manifest(upload_dir)

    if not isinstance(chunk_index, int) or chunk_index < 0 or chunk_index >= manifest["total_chunks"]:
        raise ChunkedUploadError("invalid_chunk_index", "Chunk index out of range", 400)

    if require_in_order and chunk_index != len(manifest["received_chunks"]):
        raise ChunkedUploadError(
            "out_of_order_chunk",
            f"Chunk {chunk_index} arrived but next expected was {len(manifest['received_chunks'])}",
            400,
        )

    is_last = chunk_index == manifest["total_chunks"] - 1
    expected_size = manifest["total_size"] - chunk_index * CHUNK_SIZE if is_last else CHUNK_SIZE
    if len(raw_bytes) != expected_size:
        raise ChunkedUploadError("invalid_chunk_size", f"Chunk size mismatch (got {len(raw_bytes)}, expected {expected_size})", 400)

    assembled_path = manifest.get("assembled_path")
    if not assembled_path or not os.path.exists(assembled_path):
        raise ChunkedUploadError("assembled_missing", "Upload session corrupt: assembled file missing", 500)

    bytes_to_write = transform(raw_bytes) if transform is not None else raw_bytes
    if len(bytes_to_write) != len(raw_bytes):
        raise ChunkedUploadError("transform_size_mismatch", "Chunk transform produced unexpected size", 500)

    offset = prefix_size + chunk_index * CHUNK_SIZE
    try:
        fd = os.open(assembled_path, os.O_WRONLY)
    except OSError as e:
        raise ChunkedUploadError("assembled_unreachable", f"Cannot write to assembly file: {e}", 500)
    try:
        view = memoryview(bytes_to_write)
        written = 0
        while written < len(view):
            n = os.pwrite(fd, view[written:], offset + written)
            if n == 0:
                raise OSError("pwrite returned 0")
            written += n
    finally:
        os.close(fd)

    if chunk_index not in manifest["received_chunks"]:
        manifest["received_chunks"].append(chunk_index)
        manifest["received_chunks"].sort()
        _write_manifest_atomic(upload_dir, manifest)

    return {
        "received": len(manifest["received_chunks"]),
        "total": manifest["total_chunks"],
        "complete": len(manifest["received_chunks"]) == manifest["total_chunks"],
    }


def get_manifest(user, upload_id, expected_kind=None):
    upload_dir = _upload_dir(user, upload_id)
    manifest = _read_manifest(upload_dir)
    if expected_kind and manifest.get("kind") != expected_kind:
        raise ChunkedUploadError("kind_mismatch", "Upload kind mismatch", 400)
    return manifest


def assemble_to_path(user, upload_id, dest_temp_path):
    upload_dir = _upload_dir(user, upload_id)
    manifest = _read_manifest(upload_dir)

    if len(manifest["received_chunks"]) != manifest["total_chunks"]:
        raise ChunkedUploadError("incomplete_upload", "Not all chunks received", 400)

    assembled_path = manifest.get("assembled_path")
    if not assembled_path or not os.path.exists(assembled_path):
        raise ChunkedUploadError("assembled_missing", "Assembled file missing on disk", 500)

    actual_size = os.path.getsize(assembled_path)
    if actual_size != manifest["total_size"]:
        raise ChunkedUploadError("size_mismatch", f"Assembled size {actual_size} != expected {manifest['total_size']}", 500)

    try:
        os.replace(assembled_path, dest_temp_path)
    except OSError as e:
        if e.errno == errno.EXDEV:
            shutil.copyfile(assembled_path, dest_temp_path)
            _safe_remove(assembled_path)
        else:
            raise

    return manifest


def cleanup(user, upload_id):
    upload_dir = _upload_dir(user, upload_id)
    if os.path.isdir(upload_dir):
        manifest_path = _manifest_path(upload_dir)
        assembled_path = None
        try:
            with open(manifest_path, "r", encoding="utf-8") as f:
                assembled_path = json.load(f).get("assembled_path")
        except (OSError, json.JSONDecodeError):
            pass
        _safe_remove(assembled_path)
        shutil.rmtree(upload_dir, ignore_errors=True)
