"""
hd_UIArchives.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import sys
import bz2
import hmac
import lzma
import stat
import time
import zlib
import uuid
import gzip
import errno
import shutil
import struct
import hashlib
import tarfile
import zipfile
import tempfile
import threading
import contextlib
import unicodedata

from collections import OrderedDict
from flask import send_file, jsonify, request
from flask_login import current_user, login_required
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

from pymodules.hd_FunctionsGlobals import storage_folder, dropzone_folder
from pymodules.hd_FunctionsSecurity import validate_safe_path, validate_no_symlinks
from pymodules.hd_DropZoneEncryption import load_user_file, save_user_file
from pymodules.hd_ChunkedUpload import is_temp_file
from pymodules.hd_DisksPlusAuth import authorize_request, matching_danger_zone, get_danger_zones
from pymodules.hd_FunctionsDiskEnum import find_disk_by_id
from pymodules.hd_UIAppDrive import get_container_valid_mounts, _external_access_denied, _external_path_blocked
from pymodules.hd_UIDisksPlus import _check_access, _remote_mount_set

MAX_ENTRIES = 50000
MAX_LISTED_ENTRIES = 100000
MAX_ENTRY_BYTES = 256 * 1024 * 1024
MAX_TOTAL_BYTES = 512 * 1024**3
FREE_SPACE_RESERVE = 1024**3
RATIO_MIN_BYTES = 1024 * 1024
RATIO_MAX = 1000
ARCHIVE_RATIO_MAX = 500
ARCHIVE_RATIO_MIN_BYTES = 256 * 1024 * 1024
GZIP_RATIO_MIN_BYTES = 16 * 1024 * 1024
MAX_TAR_HEADER_BYTES = 1024 * 1024
MAX_PASSWORD_LENGTH = 1024
MAX_NEW_PASSWORD_LENGTH = 64
MAX_PATH_LENGTH = 4096
MAX_NAME_BYTES = 255
CHUNK_SIZE = 1024 * 1024
SPOOL_MEMORY_BYTES = 16 * 1024 * 1024
JOB_TIMEOUT = 2 * 60 * 60
REQUEST_TIMEOUT = 5 * 60
JOB_RETENTION = 10 * 60
MAX_RUNNING_JOBS = 2
STAGING_PREFIX = ".homedock-archive-"
STAGING_TTL = 3 * 60 * 60
TREE_OPEN_ANCHORS = 64
AES_KDF_ITERATIONS = 1000
AES_MAC_BYTES = 10

STORED_EXTENSIONS = frozenset(
    {
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "avif",
        "heic",
        "heif",
        "jxl",
        "mp4",
        "m4v",
        "mkv",
        "mov",
        "avi",
        "webm",
        "wmv",
        "flv",
        "mp3",
        "m4a",
        "aac",
        "ogg",
        "oga",
        "opus",
        "flac",
        "wma",
        "zip",
        "gz",
        "tgz",
        "bz2",
        "xz",
        "zst",
        "7z",
        "rar",
        "lz",
        "lz4",
        "lzma",
        "br",
        "cab",
        "jar",
        "apk",
        "ipa",
        "docx",
        "xlsx",
        "pptx",
        "odt",
        "ods",
        "odp",
        "epub",
        "woff",
        "woff2",
        "dmg",
    }
)

RESERVED_NAMES = frozenset({"CON", "PRN", "AUX", "NUL", "CONIN$", "CONOUT$"} | {f"COM{i}" for i in "0123456789¹²³"} | {f"LPT{i}" for i in "0123456789¹²³"})

FORBIDDEN_CHARS = frozenset('<>:"|?*')

MESSAGES = {
    "not_an_archive": "The file is not a valid archive",
    "unsupported_format": "This archive format is not supported",
    "unsupported_location": "Archives are not supported in this location",
    "password_required": "This archive is password protected",
    "wrong_password": "The password is incorrect",
    "too_many_entries": "The archive contains too many entries",
    "too_large": "The archive is too large",
    "insufficient_space": "There is not enough free space",
    "suspicious_ratio": "The archive has a suspicious compression ratio",
    "overlapping_entries": "The archive contains overlapping entries",
    "corrupt_archive": "The archive is damaged",
    "invalid_selection": "The selection is not valid",
    "invalid_path": "Invalid path",
    "not_found": "Not found",
    "busy": "Too many archive operations in progress",
    "timeout": "The operation took too long",
    "io_error": "The operation could not be completed",
    "password_too_long": "The password is too long",
}

STATUS = {"not_found": 404, "busy": 429}

_TAR_HEADER_TYPES = (tarfile.GNUTYPE_LONGNAME, tarfile.GNUTYPE_LONGLINK, tarfile.XHDTYPE, tarfile.XGLTYPE, tarfile.SOLARIS_XHDTYPE)

_OPEN_WRITE_FLAGS = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_BINARY", 0) | getattr(os, "O_CLOEXEC", 0)
_OPEN_READ_FLAGS = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_BINARY", 0) | getattr(os, "O_CLOEXEC", 0)
_DIR_FLAGS = os.O_RDONLY | getattr(os, "O_DIRECTORY", 0) | getattr(os, "O_NOFOLLOW", 0) | getattr(os, "O_CLOEXEC", 0)

_USE_DIR_FD = os.name == "posix" and hasattr(os, "O_NOFOLLOW") and hasattr(os, "O_DIRECTORY") and all(func in os.supports_dir_fd for func in (os.open, os.mkdir, os.rename, os.stat, os.unlink, os.rmdir))
_RMTREE_DIR_FD = _USE_DIR_FD and sys.version_info >= (3, 11) and shutil.rmtree.avoids_symlink_attacks
_UTIME_FD = _USE_DIR_FD and os.utime in os.supports_fd

_CTR_BATCH = 4096
_CTR_STRUCT = struct.Struct("<" + "Q8x" * _CTR_BATCH)

_jobs = {}
_jobs_lock = threading.Lock()
_placement_lock = threading.Lock()


class ArchiveError(Exception):
    def __init__(self, code, message=None, status=None):
        super().__init__(code)
        self.code = code
        self.message = message or MESSAGES.get(code, code)
        self.status = status or STATUS.get(code, 400)


class _Canceled(Exception):
    pass


class _Anchor:
    def __init__(self, path, fd=None):
        self.path = path
        self.fd = fd

    @classmethod
    def open(cls, base, target):
        target = os.path.normpath(target)
        relative = os.path.relpath(target, base)
        if relative == os.pardir or relative.startswith(os.pardir + os.sep) or os.path.isabs(relative):
            raise ArchiveError("invalid_path")
        if not _USE_DIR_FD:
            if os.path.islink(target) or not os.path.isdir(target):
                raise ArchiveError("invalid_path")
            return cls(target)
        try:
            descriptor = os.open(base, _DIR_FLAGS)
        except OSError:
            raise ArchiveError("invalid_path")
        try:
            if relative != os.curdir:
                for part in relative.split(os.sep):
                    child = os.open(part, _DIR_FLAGS, dir_fd=descriptor)
                    os.close(descriptor)
                    descriptor = child
        except OSError:
            os.close(descriptor)
            raise ArchiveError("invalid_path")
        return cls(target, descriptor)

    def __enter__(self):
        return self

    def __exit__(self, *_exc):
        self.close()

    def join(self, name):
        return os.path.join(self.path, name)

    def child(self, name, mode=None):
        if mode is not None:
            try:
                self.mkdir(name, mode)
            except FileExistsError:
                pass
        if not _USE_DIR_FD:
            path = self.join(name)
            if os.path.islink(path) or not os.path.isdir(path):
                raise ArchiveError("invalid_path")
            return _Anchor(path)
        try:
            return _Anchor(self.join(name), os.open(name, _DIR_FLAGS, dir_fd=self.fd))
        except OSError:
            raise ArchiveError("invalid_path")

    def mkdir(self, name, mode):
        if _USE_DIR_FD:
            os.mkdir(name, mode, dir_fd=self.fd)
        else:
            os.mkdir(self.join(name), mode)

    def lstat(self, name):
        if _USE_DIR_FD:
            return os.stat(name, dir_fd=self.fd, follow_symlinks=False)
        return os.lstat(self.join(name))

    def exists(self, name):
        try:
            self.lstat(name)
        except FileNotFoundError:
            return False
        return True

    def open_fd(self, name, flags, mode=0o600):
        if _USE_DIR_FD:
            return os.open(name, flags, mode, dir_fd=self.fd)
        return os.open(self.join(name), flags, mode)

    def listdir(self):
        return os.listdir(self.fd if _USE_DIR_FD else self.path)

    def rename_from(self, source, name, new_name):
        if _USE_DIR_FD:
            os.rename(name, new_name, src_dir_fd=source.fd, dst_dir_fd=self.fd)
        else:
            os.rename(source.join(name), self.join(new_name))

    def remove(self, name):
        try:
            if _USE_DIR_FD:
                os.unlink(name, dir_fd=self.fd)
            else:
                os.remove(self.join(name))
        except OSError:
            pass

    def rmtree(self, name):
        if _RMTREE_DIR_FD:
            shutil.rmtree(name, dir_fd=self.fd, ignore_errors=True)
        elif not os.path.islink(self.join(name)):
            shutil.rmtree(self.join(name), ignore_errors=True)

    def utime(self, mtime):
        try:
            os.utime(self.fd if _UTIME_FD else self.path, (mtime, mtime))
        except (OSError, OverflowError, ValueError):
            pass

    def close(self):
        if self.fd is not None:
            try:
                os.close(self.fd)
            except OSError:
                pass
            self.fd = None


class _Source:
    def __init__(self, base, path):
        self.base = base
        self.path = path

    def open(self):
        with _Anchor.open(self.base, os.path.dirname(self.path)) as directory:
            try:
                descriptor = directory.open_fd(os.path.basename(self.path), _OPEN_READ_FLAGS)
            except FileNotFoundError:
                raise ArchiveError("not_found")
            except OSError:
                raise ArchiveError("invalid_path")
        fp = os.fdopen(descriptor, "rb")
        if not stat.S_ISREG(os.fstat(fp.fileno()).st_mode):
            fp.close()
            raise ArchiveError("not_an_archive")
        return fp

    def size(self):
        with self.open() as fp:
            return os.fstat(fp.fileno()).st_size


class _DropZoneSource(_Source):
    def __init__(self, base, path, user):
        super().__init__(base, path)
        self.user = user
        self._content = None

    def _load(self):
        if self._content is None:
            try:
                self._content = load_user_file(self.user, os.path.relpath(self.path, self.base))
            except FileNotFoundError:
                raise ArchiveError("not_found")
            except OSError:
                raise ArchiveError("corrupt_archive")
        return self._content

    def open(self):
        return io.BytesIO(self._load())

    def size(self):
        return len(self._load())


def _crc_table():
    table = []
    for n in range(256):
        c = n
        for _ in range(8):
            c = (c >> 1) ^ 0xEDB88320 if c & 1 else c >> 1
        table.append(c)
    return table


_CRC_TABLE = _crc_table()


class _ZipCrypto:
    def __init__(self, password):
        self._keys = [0x12345678, 0x23456789, 0x34567890]
        self.decrypt_update(password, decrypt=False)

    def decrypt_update(self, data, decrypt=True):
        table = _CRC_TABLE
        k0, k1, k2 = self._keys
        out = bytearray(len(data))
        for i, c in enumerate(data):
            if decrypt:
                k = k2 | 2
                c ^= ((k * (k ^ 1)) >> 8) & 0xFF
            out[i] = c
            k0 = (k0 >> 8) ^ table[(k0 ^ c) & 0xFF]
            k1 = ((k1 + (k0 & 0xFF)) * 134775813 + 1) & 0xFFFFFFFF
            k2 = (k2 >> 8) ^ table[(k2 ^ (k1 >> 24)) & 0xFF]
        self._keys = [k0, k1, k2]
        return bytes(out)


class _AesCtr:
    def __init__(self, key):
        self._ecb = Cipher(algorithms.AES(key), modes.ECB()).encryptor()
        self._counter = 1
        self._stream = b""

    def process(self, data):
        size = len(data)
        if not size:
            return b""
        parts = [self._stream]
        available = len(self._stream)
        while available < size:
            counters = _CTR_STRUCT.pack(*range(self._counter, self._counter + _CTR_BATCH))
            self._counter += _CTR_BATCH
            parts.append(self._ecb.update(counters))
            available += _CTR_BATCH * 16
        stream = b"".join(parts)
        self._stream = stream[size:]
        return (int.from_bytes(data, "little") ^ int.from_bytes(stream[:size], "little")).to_bytes(size, "little")


def _aes_keys(password, salt, strength):
    key_length = 8 + 8 * strength
    derived = hashlib.pbkdf2_hmac("sha1", password, salt, AES_KDF_ITERATIONS, 2 * key_length + 2)
    return derived[:key_length], derived[key_length : 2 * key_length], derived[2 * key_length :]


class _SafeTarInfo(tarfile.TarInfo):
    def _proc_member(self, tarfile_obj):
        if self.type in _TAR_HEADER_TYPES and self.size > MAX_TAR_HEADER_BYTES:
            raise ArchiveError("corrupt_archive")
        return super()._proc_member(tarfile_obj)


class _CountingReader:
    def __init__(self, source, limit, code, tick):
        self._source = source
        self._limit = limit
        self._code = code
        self._tick = tick
        self.position = 0

    def read(self, size=-1):
        self._tick()
        if size is None or size < 0 or size > CHUNK_SIZE:
            size = CHUNK_SIZE
        data = self._source.read(size)
        self.position += len(data)
        if self.position > self._limit:
            raise ArchiveError(self._code)
        return data


class _Budget:
    def __init__(self, directory):
        try:
            self.free = shutil.disk_usage(directory).free - FREE_SPACE_RESERVE
        except OSError:
            self.free = 0
        self.used = 0

    def check(self, amount):
        if amount > MAX_TOTAL_BYTES:
            raise ArchiveError("too_large")
        if amount > self.free:
            raise ArchiveError("insufficient_space")

    def add(self, amount):
        self.used += amount
        self.check(self.used)


def _deadline_tick(seconds):
    deadline = time.monotonic() + seconds

    def tick():
        if time.monotonic() > deadline:
            raise ArchiveError("timeout")

    return tick


def _job_tick(job):
    cancel = job["_cancel"]
    deadline = job["_deadline"]

    def tick():
        if cancel.is_set():
            raise _Canceled()
        if time.monotonic() > deadline:
            raise ArchiveError("timeout")

    return tick


def _path_key(path):
    return unicodedata.normalize("NFC", path).casefold()


def _sanitize_name(raw):
    text = raw.replace("\\", "/")
    if text.startswith("/") or (len(text) >= 2 and text[1] == ":" and text[0].isascii() and text[0].isalpha()):
        return None, "unsafe_path"
    parts = [part for part in text.split("/") if part not in ("", ".")]
    if not parts:
        return None, "empty"
    if any(part == ".." for part in parts):
        return None, "unsafe_path"
    for part in parts:
        if any(ord(ch) < 32 or ord(ch) == 127 for ch in part):
            return None, "invalid_name"
        if any(ch in FORBIDDEN_CHARS for ch in part):
            return None, "invalid_name"
        if part.endswith(".") or part.endswith(" "):
            return None, "invalid_name"
        if len(part.encode("utf-8", "surrogatepass")) > MAX_NAME_BYTES:
            return None, "invalid_name"
        if part.lower().startswith(".homedock-"):
            return None, "invalid_name"
        if part.split(".")[0].rstrip(" ").upper() in RESERVED_NAMES:
            return None, "reserved_name"
    joined = "/".join(parts)
    if len(joined) > MAX_PATH_LENGTH:
        return None, "invalid_name"
    return joined, None


def _display_path(raw):
    text = raw.replace("\\", "/").rstrip("/")
    return text or raw


def _classify(records):
    seen = {}
    explicit_dirs = set()
    implicit_index = {}
    entries = []

    def emit(entry):
        entries.append(entry)
        if len(entries) > MAX_LISTED_ENTRIES:
            raise ArchiveError("too_many_entries")

    for rec in records:
        normalized, reason = _sanitize_name(rec["raw"])
        if reason == "empty":
            if rec["is_dir"]:
                continue
            reason = "invalid_name"
        reason = reason or rec["pre_skip"]
        if reason:
            rec["path"] = normalized or _display_path(rec["raw"])
            rec["name"] = rec["path"].rsplit("/", 1)[-1]
            rec["skip"] = reason
            emit(rec)
            continue

        parts = normalized.split("/")
        canonical = []
        conflict = False
        for depth in range(len(parts) - 1):
            known = seen.get(_path_key("/".join(parts[: depth + 1])))
            if known is None:
                canonical.append(parts[depth])
            elif known[0] == "file":
                conflict = True
                break
            else:
                canonical.append(known[1].rsplit("/", 1)[-1])

        key = _path_key(normalized)
        known = seen.get(key)
        path = "/".join(canonical + [parts[-1]])
        rec["path"] = path
        rec["name"] = parts[-1]

        if conflict:
            rec["skip"] = "conflict"
        elif rec["is_dir"]:
            if known and known[0] == "file":
                rec["skip"] = "conflict"
            elif known and key in explicit_dirs:
                rec["skip"] = "duplicate"
            else:
                rec["skip"] = None
        elif known:
            rec["skip"] = "duplicate" if known[0] == "file" else "conflict"
        else:
            rec["skip"] = None

        if rec["skip"]:
            emit(rec)
            continue

        for depth in range(len(canonical)):
            ancestor = "/".join(canonical[: depth + 1])
            ancestor_key = _path_key(ancestor)
            if ancestor_key in seen:
                continue
            seen[ancestor_key] = ("dir", ancestor)
            implicit_index[ancestor_key] = len(entries)
            emit({"path": ancestor, "name": canonical[depth], "is_dir": True, "size": 0, "compressed_size": 0, "modified": None, "encrypted": False, "skip": None, "implicit": True})

        if rec["is_dir"]:
            explicit_dirs.add(key)
            if known:
                rec["path"] = known[1]
                rec["name"] = known[1].rsplit("/", 1)[-1]
                entries[implicit_index.pop(key)] = rec
                continue
            seen[key] = ("dir", path)
        else:
            seen[key] = ("file", path)
        emit(rec)

    return entries


def _detect_format(source):
    lower = os.path.basename(source.path).lower()
    if lower.endswith(".zip"):
        fmt = "zip"
    elif lower.endswith(".tar.gz") or lower.endswith(".tgz"):
        fmt = "tgz"
    elif lower.endswith(".tar"):
        fmt = "tar"
    else:
        raise ArchiveError("unsupported_format")

    try:
        with source.open() as fp:
            head = fp.read(512)
    except OSError:
        raise ArchiveError("not_an_archive")

    if fmt == "zip":
        valid = head[:4] in (b"PK\x03\x04", b"PK\x05\x06")
    elif fmt == "tgz":
        valid = head[:2] == b"\x1f\x8b"
    else:
        valid = _looks_like_tar(head)

    if not valid:
        raise ArchiveError("not_an_archive")
    return fmt


def _looks_like_tar(head):
    if len(head) < 512:
        return False
    if head[257:262] == b"ustar":
        return True
    if head == b"\0" * 512:
        return True
    try:
        stored = int(head[148:156].replace(b"\0", b" ").strip() or b"0", 8)
    except ValueError:
        return False
    unsigned = sum(head[:148]) + 256 + sum(head[156:])
    signed = sum(struct.unpack("148b", head[:148])) + 256 + sum(struct.unpack("356b", head[156:]))
    return stored in (unsigned, signed)


def _extra_fields(extra):
    fields = {}
    offset = 0
    while offset + 4 <= len(extra):
        header_id, length = struct.unpack("<HH", extra[offset : offset + 4])
        fields.setdefault(header_id, extra[offset + 4 : offset + 4 + length])
        offset += 4 + length
    return fields


def _zip_mtime(info, fields):
    stamp = fields.get(0x5455)
    if stamp and len(stamp) >= 5 and stamp[0] & 1:
        return struct.unpack("<i", stamp[1:5])[0]
    try:
        return int(time.mktime(tuple(info.date_time) + (0, 0, -1)))
    except (OverflowError, ValueError, OSError):
        return None


def _zip_record(fp, info, size, start_dir):
    fp.seek(info.header_offset)
    header = fp.read(30)
    if len(header) != 30 or header[:4] != b"PK\x03\x04":
        raise ArchiveError("corrupt_archive")
    name_length, extra_length = struct.unpack("<HH", header[26:30])
    local_name = fp.read(name_length)
    try:
        central_name = info.orig_filename.encode("utf-8" if info.flag_bits & 0x800 else "cp437")
    except UnicodeEncodeError:
        raise ArchiveError("corrupt_archive")
    if local_name != central_name:
        raise ArchiveError("corrupt_archive")

    data_start = info.header_offset + 30 + name_length + extra_length
    data_end = data_start + info.compress_size
    if data_end > start_dir or data_end > size:
        raise ArchiveError("corrupt_archive")

    raw = info.orig_filename
    if not info.flag_bits & 0x800:
        try:
            raw = central_name.decode("utf-8")
        except UnicodeDecodeError:
            pass

    fields = _extra_fields(info.extra)
    mode = (info.external_attr >> 16) & 0xFFFF if info.create_system == 3 else 0
    is_dir = raw.endswith("/") or raw.endswith("\\") or stat.S_ISDIR(mode)
    encrypted = bool(info.flag_bits & 0x1) or info.compress_type == 99
    method = info.compress_type
    enc = None
    strength = 0
    aes_version = 0
    pre_skip = None

    if stat.S_ISLNK(mode):
        pre_skip = "link"
    elif stat.S_IFMT(mode) and not stat.S_ISREG(mode) and not stat.S_ISDIR(mode):
        pre_skip = "special_file"

    if encrypted and not is_dir:
        aes = fields.get(0x9901)
        if info.flag_bits & 0x40 or not info.flag_bits & 0x1:
            pre_skip = pre_skip or "encrypted_unsupported"
        elif method == 99:
            parsed = struct.unpack("<H2sBH", aes[:7]) if aes and len(aes) >= 7 else None
            if parsed and parsed[1] == b"AE" and parsed[0] in (1, 2) and parsed[2] in (1, 2, 3):
                aes_version, _vendor, strength, method = parsed
                enc = "aes"
            else:
                pre_skip = pre_skip or "encrypted_unsupported"
        else:
            enc = "zipcrypto"

    if pre_skip is None and not is_dir and info.file_size > RATIO_MIN_BYTES:
        if info.compress_size <= 0 or info.file_size > info.compress_size * RATIO_MAX:
            pre_skip = "suspicious_ratio"

    hour, minute, second = info.date_time[3:6]
    return {
        "raw": raw,
        "is_dir": is_dir,
        "size": 0 if is_dir else info.file_size,
        "compressed_size": 0 if is_dir else info.compress_size,
        "modified": _zip_mtime(info, fields),
        "encrypted": encrypted,
        "pre_skip": pre_skip,
        "mode": mode,
        "header_offset": info.header_offset,
        "data_start": data_start,
        "data_end": data_end,
        "method": method,
        "enc": enc,
        "strength": strength,
        "aes_version": aes_version,
        "crc": info.CRC,
        "flag": info.flag_bits,
        "dostime": (hour << 11) | (minute << 5) | (second // 2),
    }


def _check_overlaps(records):
    previous_end = 0
    for rec in sorted(records, key=lambda r: r["header_offset"]):
        if rec["header_offset"] < previous_end:
            raise ArchiveError("overlapping_entries")
        previous_end = max(previous_end, rec["data_end"])


def _scan_zip(source, size, tick):
    with source.open() as fp:
        try:
            end_record = zipfile._EndRecData(fp)
        except (OSError, struct.error):
            raise ArchiveError("corrupt_archive")
        if not end_record:
            raise ArchiveError("corrupt_archive")
        if end_record[zipfile._ECD_ENTRIES_TOTAL] > MAX_ENTRIES:
            raise ArchiveError("too_many_entries")

        try:
            fp.seek(0)
            with zipfile.ZipFile(fp) as archive:
                infos = archive.infolist()
                start_dir = getattr(archive, "start_dir", size)
        except (zipfile.BadZipFile, zipfile.LargeZipFile, ValueError, NotImplementedError, EOFError, struct.error, UnicodeDecodeError, OSError):
            raise ArchiveError("corrupt_archive")

        if len(infos) > MAX_ENTRIES:
            raise ArchiveError("too_many_entries")

        records = []
        for info in infos:
            tick()
            records.append(_zip_record(fp, info, size, start_dir))

    _check_overlaps(records)
    return records


@contextlib.contextmanager
def _open_tar(source, fmt, size, tick):
    with source.open() as raw:
        try:
            if fmt == "tgz":
                limit = min(max(GZIP_RATIO_MIN_BYTES, size * RATIO_MAX), MAX_TOTAL_BYTES)
                code = "too_large" if limit == MAX_TOTAL_BYTES else "suspicious_ratio"
                source = _CountingReader(gzip.GzipFile(fileobj=raw, mode="rb"), limit, code, tick)
            else:
                source = _CountingReader(raw, size + CHUNK_SIZE, "corrupt_archive", tick)
            with tarfile.open(fileobj=source, mode="r|", tarinfo=_SafeTarInfo) as archive:
                yield archive
        except (tarfile.TarError, EOFError, zlib.error, gzip.BadGzipFile, struct.error, UnicodeDecodeError):
            raise ArchiveError("corrupt_archive")


def _tar_record(member, index):
    is_dir = member.isdir()
    if member.issym() or member.islnk():
        pre_skip = "link"
    elif is_dir or (member.isreg() and not member.issparse()):
        pre_skip = None
    else:
        pre_skip = "special_file"
    size = member.size if not is_dir and pre_skip is None else 0
    try:
        modified = int(member.mtime)
    except (TypeError, ValueError, OverflowError):
        modified = None
    return {
        "raw": member.name,
        "is_dir": is_dir,
        "size": size,
        "compressed_size": size,
        "modified": modified,
        "encrypted": False,
        "pre_skip": pre_skip,
        "mode": member.mode or 0,
        "index": index,
        "type": member.type,
    }


def _scan_tar(source, fmt, size, tick):
    records = []
    with _open_tar(source, fmt, size, tick) as archive:
        for index, member in enumerate(archive):
            if index >= MAX_ENTRIES:
                raise ArchiveError("too_many_entries")
            records.append(_tar_record(member, index))
    return records


def _scan(source, fmt, tick):
    size = source.size()
    records = _scan_zip(source, size, tick) if fmt == "zip" else _scan_tar(source, fmt, size, tick)
    entries = _classify(records)

    total_size = 0
    total_compressed = 0
    skipped = 0
    for entry in entries:
        if entry["skip"]:
            skipped += 1
        elif not entry["is_dir"]:
            total_size += entry["size"]
            total_compressed += entry["compressed_size"]

    if fmt == "zip" and total_size > ARCHIVE_RATIO_MIN_BYTES and total_size > max(size, 1) * ARCHIVE_RATIO_MAX:
        raise ArchiveError("suspicious_ratio")

    kinds = {rec.get("enc") for rec in records}
    return {
        "fmt": fmt,
        "kind": "zip" if fmt == "zip" else "tar",
        "size": size,
        "records": records,
        "entries": entries,
        "total_size": total_size,
        "total_compressed": total_compressed if fmt == "zip" else size,
        "skipped": skipped,
        "encrypted": any(rec["encrypted"] for rec in records),
        "encryption": "aes" if "aes" in kinds else ("zipcrypto" if "zipcrypto" in kinds else None),
    }


def _public_entry(entry):
    return {
        "path": entry["path"],
        "name": entry["name"],
        "is_dir": entry["is_dir"],
        "size": entry["size"],
        "compressed_size": entry["compressed_size"],
        "modified": entry["modified"],
        "encrypted": entry["encrypted"],
        "skip": entry["skip"],
    }


def _plan(scan, selection):
    entries = scan["entries"]
    if selection is None:
        prefix = ""
        chosen = entries
    else:
        if not isinstance(selection, list) or not selection or len(selection) > MAX_LISTED_ENTRIES:
            raise ArchiveError("invalid_selection")
        known = {entry["path"] for entry in entries}
        targets = set()
        parents = []
        for item in selection:
            if not isinstance(item, str):
                raise ArchiveError("invalid_selection")
            target = item.strip("/")
            if not target or target not in known:
                raise ArchiveError("invalid_selection")
            targets.add(target)
            parents.append(target.split("/")[:-1])
        common = parents[0]
        for parent in parents[1:]:
            length = 0
            while length < min(len(common), len(parent)) and common[length] == parent[length]:
                length += 1
            common = common[:length]
        prefix = "/".join(common)
        chosen = []
        for entry in entries:
            parts = entry["path"].split("/")
            if any("/".join(parts[:depth]) in targets for depth in range(1, len(parts) + 1)):
                chosen.append(entry)

    cut = len(prefix) + 1 if prefix else 0
    items = []
    skipped = 0
    for entry in chosen:
        if entry["skip"]:
            skipped += 1
            continue
        relative = entry["path"][cut:]
        if relative:
            items.append((entry, relative))

    if not items:
        raise ArchiveError("invalid_selection")

    tops = []
    for _entry, relative in items:
        top = relative.split("/", 1)[0]
        if top not in tops:
            tops.append(top)

    single = len(tops) == 1
    top_is_dir = single and any(relative != tops[0] or entry["is_dir"] for entry, relative in items)
    files = [entry for entry, _relative in items if not entry["is_dir"]]

    return {"items": items, "skipped": skipped, "tops": tops, "single": single, "top_is_dir": top_is_dir, "files": len(files), "bytes": sum(entry["size"] for entry in files)}


def _require_password(entries, password):
    if password is None and any(entry.get("enc") for entry in entries if not entry["is_dir"]):
        raise ArchiveError("password_required")


def _read_exact(fp, offset, length):
    fp.seek(offset)
    data = fp.read(length)
    if len(data) != length:
        raise ArchiveError("corrupt_archive")
    return data


def _raw_chunks(fp, offset, length, tick):
    position = offset
    remaining = length
    while remaining > 0:
        tick()
        amount = min(CHUNK_SIZE, remaining)
        yield _read_exact(fp, position, amount)
        position += amount
        remaining -= amount


def _check_password(fp, rec, password):
    if rec["enc"] == "zipcrypto":
        if rec["data_end"] - rec["data_start"] < 12:
            raise ArchiveError("corrupt_archive")
        header = _ZipCrypto(password).decrypt_update(_read_exact(fp, rec["data_start"], 12))
        expected = (rec["dostime"] >> 8) & 0xFF if rec["flag"] & 0x8 else (rec["crc"] >> 24) & 0xFF
        if header[11] != expected:
            raise ArchiveError("wrong_password")
    elif rec["enc"] == "aes":
        salt_length = 4 + 4 * rec["strength"]
        if rec["data_end"] - rec["data_start"] < salt_length + 2 + AES_MAC_BYTES:
            raise ArchiveError("corrupt_archive")
        head = _read_exact(fp, rec["data_start"], salt_length + 2)
        keys = _aes_keys(password, head[:salt_length], rec["strength"])
        if not hmac.compare_digest(keys[2], head[salt_length:]):
            raise ArchiveError("wrong_password")
        return keys
    return None


def _verify_password(source, entries, password):
    checked = set()
    with source.open() as fp:
        for entry in entries:
            kind = entry.get("enc")
            if kind and not entry["is_dir"] and not entry["skip"] and kind not in checked:
                _check_password(fp, entry, password)
                checked.add(kind)


def _decrypted_stream(fp, rec, password, tick):
    start = rec["data_start"]
    length = rec["data_end"] - start
    if rec["enc"] is None:
        return _raw_chunks(fp, start, length, tick)

    if password is None:
        raise ArchiveError("password_required")

    if rec["enc"] == "zipcrypto":
        _check_password(fp, rec, password)
        cipher = _ZipCrypto(password)
        cipher.decrypt_update(_read_exact(fp, start, 12))
        return (cipher.decrypt_update(chunk) for chunk in _raw_chunks(fp, start + 12, length - 12, tick))

    salt_length = 4 + 4 * rec["strength"]
    enc_key, mac_key, _verifier = _check_password(fp, rec, password)
    body_start = start + salt_length + 2
    body_length = length - salt_length - 2 - AES_MAC_BYTES
    mac = hmac.new(mac_key, digestmod=hashlib.sha1)
    for chunk in _raw_chunks(fp, body_start, body_length, tick):
        mac.update(chunk)
    stored = _read_exact(fp, body_start + body_length, AES_MAC_BYTES)
    if not hmac.compare_digest(mac.digest()[:AES_MAC_BYTES], stored):
        raise ArchiveError("wrong_password")
    counter = _AesCtr(enc_key)
    return (counter.process(chunk) for chunk in _raw_chunks(fp, body_start, body_length, tick))


def _lzma_source(stream):
    iterator = iter(stream)
    buffer = b""
    for chunk in iterator:
        buffer += chunk
        if len(buffer) >= 4 and len(buffer) >= 4 + struct.unpack("<H", buffer[2:4])[0]:
            break
    if len(buffer) < 4:
        raise ArchiveError("corrupt_archive")
    props_size = struct.unpack("<H", buffer[2:4])[0]
    if len(buffer) < 4 + props_size:
        raise ArchiveError("corrupt_archive")
    decompressor = lzma.LZMADecompressor(lzma.FORMAT_RAW, filters=[lzma._decode_filter_properties(lzma.FILTER_LZMA1, buffer[4 : 4 + props_size])])

    def remaining():
        if len(buffer) > 4 + props_size:
            yield buffer[4 + props_size :]
        yield from iterator

    return decompressor, remaining()


def _inflate(method, stream):
    if method == 0:
        yield from stream
        return

    if method == 8:
        decompressor = zlib.decompressobj(-15)
        for data in stream:
            while not decompressor.eof:
                piece = decompressor.decompress(data, CHUNK_SIZE)
                if piece:
                    yield piece
                data = decompressor.unconsumed_tail
                if not data and len(piece) < CHUNK_SIZE:
                    break
        if not decompressor.eof:
            raise ArchiveError("corrupt_archive")
        return

    if method == 12:
        decompressor = bz2.BZ2Decompressor()
    elif method == 14:
        decompressor, stream = _lzma_source(stream)
    else:
        raise ArchiveError("unsupported_format")

    for data in stream:
        if decompressor.eof:
            break
        piece = decompressor.decompress(data, CHUNK_SIZE)
        if piece:
            yield piece
        while not decompressor.eof and not decompressor.needs_input:
            piece = decompressor.decompress(b"", CHUNK_SIZE)
            if not piece:
                break
            yield piece

    if method == 12 and not decompressor.eof:
        raise ArchiveError("corrupt_archive")


def _zip_chunks(fp, rec, password, tick):
    failure = "wrong_password" if rec["enc"] == "zipcrypto" else "corrupt_archive"
    check_crc = not (rec["enc"] == "aes" and rec["aes_version"] == 2)
    total = 0
    crc = 0
    try:
        for piece in _inflate(rec["method"], _decrypted_stream(fp, rec, password, tick)):
            total += len(piece)
            if total > rec["size"]:
                raise ArchiveError(failure)
            if check_crc:
                crc = zlib.crc32(piece, crc)
            yield piece
    except ArchiveError as exc:
        if exc.code == "corrupt_archive":
            raise ArchiveError(failure)
        raise
    except (zlib.error, lzma.LZMAError, EOFError, ValueError, OSError):
        raise ArchiveError(failure)
    if total != rec["size"] or (check_crc and crc != rec["crc"]):
        raise ArchiveError(failure)


def _file_chunks(source, tick):
    while True:
        tick()
        chunk = source.read(CHUNK_SIZE)
        if not chunk:
            break
        yield chunk


def _tar_member_chunks(source, fmt, size, rec, tick):
    with _open_tar(source, fmt, size, tick) as archive:
        for index, member in enumerate(archive):
            if index != rec["index"]:
                continue
            if member.name != rec["raw"] or member.type != rec["type"]:
                raise ArchiveError("corrupt_archive")
            source = archive.extractfile(member)
            if source is None:
                raise ArchiveError("corrupt_archive")
            yield from _file_chunks(source, tick)
            return
    raise ArchiveError("corrupt_archive")


def _split_name(name, is_dir):
    if is_dir:
        return name, ""
    lower = name.lower()
    for compound in (".tar.gz", ".tar.bz2", ".tar.xz", ".tar.zst"):
        if lower.endswith(compound) and len(name) > len(compound):
            return name[: -len(compound)], name[-len(compound) :]
    stem, ext = os.path.splitext(name)
    return (stem, ext) if stem else (name, "")


def _is_blocked(path, blocked):
    return bool(blocked) and matching_danger_zone(path) in blocked


def _unique_name(directory, name, is_dir, blocked):
    stem, ext = _split_name(name, is_dir)
    candidate = name
    counter = 2
    while directory.exists(candidate) or _is_blocked(directory.join(candidate), blocked):
        if counter > 10000:
            raise ArchiveError("io_error")
        candidate = f"{stem} {counter}{ext}"
        counter += 1
    return candidate


def _place(source_dir, source_name, directory, desired, is_dir, blocked):
    with _placement_lock:
        name = _unique_name(directory, desired, is_dir, blocked)
        directory.rename_from(source_dir, source_name, name)
    return name, directory.join(name)


def _archive_base_name(filename):
    lower = filename.lower()
    base = filename
    for ext in (".tar.gz", ".tgz", ".tar", ".zip"):
        if lower.endswith(ext):
            base = filename[: -len(ext)]
            break
    base = base.strip()
    normalized, reason = _sanitize_name(base) if base else (None, "invalid_name")
    if reason or "/" in normalized or normalized.startswith("."):
        return "Archive"
    return normalized


def _sweep_staging(directory):
    cutoff = time.time() - STAGING_TTL
    try:
        names = directory.listdir()
    except OSError:
        return
    for name in names:
        if not name.startswith(STAGING_PREFIX):
            continue
        try:
            info = directory.lstat(name)
        except OSError:
            continue
        if info.st_mtime > cutoff:
            continue
        if stat.S_ISDIR(info.st_mode):
            directory.rmtree(name)
        else:
            directory.remove(name)


class _Tree:
    def __init__(self, root, dir_mode):
        self._root = root
        self._dir_mode = dir_mode
        self._anchors = OrderedDict()

    def directory(self, relative):
        if not relative:
            return self._root
        anchor = self._anchors.get(relative)
        if anchor is not None:
            self._anchors.move_to_end(relative)
            return anchor
        parent_path, _sep, name = relative.rpartition("/")
        anchor = self.directory(parent_path).child(name, self._dir_mode)
        self._anchors[relative] = anchor
        while len(self._anchors) > TREE_OPEN_ANCHORS:
            _relative, evicted = self._anchors.popitem(last=False)
            evicted.close()
        return anchor

    def close(self):
        for anchor in self._anchors.values():
            anchor.close()
        self._anchors.clear()


def _write_dropzone_entry(job, tree, relative, chunks, entry, ctx, budget):
    parent, _sep, name = relative.rpartition("/")
    target = tree.directory(parent).join(name)
    content = bytearray()
    for chunk in chunks:
        if len(content) + len(chunk) > entry["size"]:
            raise ArchiveError("corrupt_archive")
        budget.add(len(chunk))
        content += chunk
        job["processed_bytes"] += len(chunk)
    save_user_file(ctx["user"], os.path.relpath(target, ctx["base"]), bytes(content))
    if entry.get("modified") is not None:
        try:
            os.utime(target, (entry["modified"], entry["modified"]))
        except (OSError, OverflowError, ValueError):
            pass
    job["processed_files"] += 1


def _write_entry(job, tree, relative, chunks, entry, ctx, budget):
    job["current"] = entry["path"]
    if ctx["source"] == "dropzone":
        return _write_dropzone_entry(job, tree, relative, chunks, entry, ctx, budget)
    parent, _sep, name = relative.rpartition("/")
    descriptor = tree.directory(parent).open_fd(name, _OPEN_WRITE_FLAGS, ctx["file_mode"])
    written = 0
    with os.fdopen(descriptor, "wb") as out:
        for chunk in chunks:
            written += len(chunk)
            if written > entry["size"]:
                raise ArchiveError("corrupt_archive")
            budget.add(len(chunk))
            out.write(chunk)
            job["processed_bytes"] += len(chunk)
        out.flush()
        if entry.get("modified") is not None:
            try:
                os.utime(out.fileno() if os.utime in os.supports_fd else tree.directory(parent).join(name), (entry["modified"], entry["modified"]))
            except (OSError, OverflowError, ValueError):
                pass
    job["processed_files"] += 1


def _extract_worker(job, ctx, source, fmt, selection, password, blocked):
    tick = _job_tick(job)
    dest_dir = os.path.dirname(source.path)
    scan = _scan(source, fmt, tick)
    plan = _plan(scan, selection)
    _require_password([entry for entry, _relative in plan["items"]], password)

    job["total_bytes"] = plan["bytes"]
    job["total_files"] = plan["files"]

    budget = _Budget(dest_dir)
    budget.check(plan["bytes"])

    if password is not None and fmt == "zip":
        _verify_password(source, [entry for entry, _relative in plan["items"]], password)

    with _Anchor.open(ctx["base"], dest_dir) as destination:
        _sweep_staging(destination)
        staging_name = f"{STAGING_PREFIX}{uuid.uuid4().hex}"
        destination.mkdir(staging_name, ctx["dir_mode"])
        try:
            with destination.child(staging_name) as staging:
                tree = _Tree(staging, ctx["dir_mode"])
                try:
                    files = []
                    directories = []
                    for entry, relative in plan["items"]:
                        tick()
                        parts = relative.split("/")
                        if any(part in ("", ".", "..") for part in parts):
                            raise ArchiveError("corrupt_archive")
                        if entry["is_dir"]:
                            tree.directory(relative)
                            directories.append((relative, entry))
                        else:
                            tree.directory(relative.rpartition("/")[0])
                            files.append((entry, relative))

                    if fmt == "zip":
                        with source.open() as fp:
                            for entry, relative in sorted(files, key=lambda item: item[0]["data_start"]):
                                _write_entry(job, tree, relative, _zip_chunks(fp, entry, password, tick), entry, ctx, budget)
                    else:
                        wanted = {entry["index"]: (entry, relative) for entry, relative in files}
                        if wanted:
                            with _open_tar(source, fmt, scan["size"], tick) as archive:
                                for index, member in enumerate(archive):
                                    hit = wanted.pop(index, None)
                                    if hit is None:
                                        continue
                                    entry, relative = hit
                                    if member.name != entry["raw"] or member.type != entry["type"] or member.size != entry["size"]:
                                        raise ArchiveError("corrupt_archive")
                                    member_data = archive.extractfile(member)
                                    if member_data is None:
                                        raise ArchiveError("corrupt_archive")
                                    _write_entry(job, tree, relative, _file_chunks(member_data, tick), entry, ctx, budget)
                                    if not wanted:
                                        break
                        if wanted:
                            raise ArchiveError("corrupt_archive")

                    for relative, entry in reversed(directories):
                        if entry.get("modified") is not None:
                            tree.directory(relative).utime(entry["modified"])
                finally:
                    tree.close()

                tick()
                job["current"] = None
                if plan["single"]:
                    name, final = _place(staging, plan["tops"][0], destination, plan["tops"][0], plan["top_is_dir"], blocked)
                    is_dir = plan["top_is_dir"]
                else:
                    name, final = _place(destination, staging_name, destination, _archive_base_name(os.path.basename(source.path)), True, blocked)
                    is_dir = True
        except BaseException:
            destination.rmtree(staging_name)
            raise

        if plan["single"]:
            destination.rmtree(staging_name)

    return {"name": name, "path": _relative_to_base(ctx, final), "is_dir": is_dir, "skipped": plan["skipped"]}


def _dos_datetime(mtime):
    try:
        moment = time.localtime(mtime)
    except (OverflowError, OSError, ValueError):
        moment = time.localtime()
    if moment.tm_year < 1980:
        return 0, (0 << 9) | (1 << 5) | 1
    if moment.tm_year > 2107:
        return (23 << 11) | (59 << 5) | 29, (127 << 9) | (12 << 5) | 31
    return (moment.tm_hour << 11) | (moment.tm_min << 5) | (moment.tm_sec // 2), ((moment.tm_year - 1980) << 9) | (moment.tm_mon << 5) | moment.tm_mday


def _zip_date_time(mtime):
    try:
        moment = time.localtime(mtime)
    except (OverflowError, OSError, ValueError):
        moment = time.localtime()
    if moment.tm_year < 1980:
        return (1980, 1, 1, 0, 0, 0)
    if moment.tm_year > 2107:
        return (2107, 12, 31, 23, 59, 58)
    return tuple(moment[:6])


class _PlainZipWriter:
    def __init__(self, fp):
        self._zip = zipfile.ZipFile(fp, "w", compression=zipfile.ZIP_DEFLATED, allowZip64=True, compresslevel=6, strict_timestamps=False)

    def add_dir(self, arcname, mtime, mode):
        info = zipfile.ZipInfo(arcname.rstrip("/") + "/", _zip_date_time(mtime))
        info.external_attr = ((stat.S_IFDIR | ((mode & 0o777) or 0o755)) << 16) | 0x10
        info.compress_type = zipfile.ZIP_STORED
        self._zip.writestr(info, b"")

    def add_file(self, arcname, source, size_hint, mtime, mode, method, tick, progress):
        info = zipfile.ZipInfo(arcname, _zip_date_time(mtime))
        info.external_attr = (stat.S_IFREG | (mode & 0o777)) << 16
        info.compress_type = zipfile.ZIP_DEFLATED if method == 8 else zipfile.ZIP_STORED
        info.file_size = size_hint
        with self._zip.open(info, "w") as out:
            for chunk in _file_chunks(source, tick):
                out.write(chunk)
                progress(len(chunk))

    def close(self):
        self._zip.close()


class _AesZipWriter:
    def __init__(self, fp, password):
        self._fp = fp
        self._password = password
        self._entries = []

    def add_dir(self, arcname, mtime, mode):
        name = (arcname.rstrip("/") + "/").encode("utf-8")
        offset = self._fp.tell()
        dos_time, dos_date = _dos_datetime(mtime)
        self._fp.write(struct.pack("<4sHHHHHIIIHH", b"PK\x03\x04", 20, 0x800, 0, dos_time, dos_date, 0, 0, 0, len(name), 0) + name)
        attr = ((stat.S_IFDIR | ((mode & 0o777) or 0o755)) << 16) | 0x10
        self._entries.append({"name": name, "offset": offset, "version": 20, "flag": 0x800, "method": 0, "time": dos_time, "date": dos_date, "csize": 0, "usize": 0, "attr": attr, "extra": b""})

    def add_file(self, arcname, source, size_hint, mtime, mode, method, tick, progress):
        name = arcname.encode("utf-8")
        offset = self._fp.tell()
        dos_time, dos_date = _dos_datetime(mtime)
        zip64 = size_hint + size_hint // 100 + CHUNK_SIZE >= 0xFFFFFFFF
        aes_extra = struct.pack("<HHH2sBH", 0x9901, 7, 2, b"AE", 3, method)
        local_extra = (struct.pack("<HHQQ", 1, 16, 0, 0) if zip64 else b"") + aes_extra
        placeholder = 0xFFFFFFFF if zip64 else 0
        self._fp.write(struct.pack("<4sHHHHHIIIHH", b"PK\x03\x04", 51, 0x801, 99, dos_time, dos_date, 0, placeholder, placeholder, len(name), len(local_extra)) + name + local_extra)

        salt = os.urandom(16)
        enc_key, mac_key, verifier = _aes_keys(self._password, salt, 3)
        self._fp.write(salt + verifier)
        mac = hmac.new(mac_key, digestmod=hashlib.sha1)
        counter = _AesCtr(enc_key)
        compressor = zlib.compressobj(6, zlib.DEFLATED, -15) if method == 8 else None
        uncompressed = 0
        compressed = 0

        def emit(data):
            nonlocal compressed
            if data:
                encrypted = counter.process(data)
                mac.update(encrypted)
                self._fp.write(encrypted)
                compressed += len(encrypted)

        for chunk in _file_chunks(source, tick):
            uncompressed += len(chunk)
            emit(compressor.compress(chunk) if compressor else chunk)
            progress(len(chunk))
        if compressor:
            emit(compressor.flush())

        self._fp.write(mac.digest()[:AES_MAC_BYTES])
        compressed_total = len(salt) + len(verifier) + compressed + AES_MAC_BYTES
        if not zip64 and max(uncompressed, compressed_total) >= 0xFFFFFFFF:
            raise ArchiveError("too_large")

        end = self._fp.tell()
        if zip64:
            self._fp.seek(offset + 30 + len(name) + 4)
            self._fp.write(struct.pack("<QQ", uncompressed, compressed_total))
        else:
            self._fp.seek(offset + 18)
            self._fp.write(struct.pack("<II", compressed_total, uncompressed))
        self._fp.seek(end)

        attr = (stat.S_IFREG | (mode & 0o777)) << 16
        self._entries.append({"name": name, "offset": offset, "version": 51, "flag": 0x801, "method": 99, "time": dos_time, "date": dos_date, "csize": compressed_total, "usize": uncompressed, "attr": attr, "extra": aes_extra})

    def close(self):
        fp = self._fp
        cd_start = fp.tell()
        for entry in self._entries:
            wide = []
            usize, csize, offset = entry["usize"], entry["csize"], entry["offset"]
            if usize >= 0xFFFFFFFF:
                wide.append(usize)
                usize = 0xFFFFFFFF
            if csize >= 0xFFFFFFFF:
                wide.append(csize)
                csize = 0xFFFFFFFF
            if offset >= 0xFFFFFFFF:
                wide.append(offset)
                offset = 0xFFFFFFFF
            extra = (struct.pack("<HH", 1, 8 * len(wide)) + struct.pack(f"<{len(wide)}Q", *wide) if wide else b"") + entry["extra"]
            version = max(entry["version"], 45 if wide else 0)
            fp.write(struct.pack("<4sHHHHHHIIIHHHHHII", b"PK\x01\x02", (3 << 8) | 63, version, entry["flag"], entry["method"], entry["time"], entry["date"], 0, csize, usize, len(entry["name"]), len(extra), 0, 0, 0, entry["attr"], offset) + entry["name"] + extra)
        cd_end = fp.tell()
        count = len(self._entries)
        cd_size = cd_end - cd_start
        if count >= 0xFFFF or cd_size >= 0xFFFFFFFF or cd_start >= 0xFFFFFFFF:
            fp.write(struct.pack("<4sQHHIIQQQQ", b"PK\x06\x06", 44, 45, 45, 0, 0, count, count, cd_size, cd_start))
            fp.write(struct.pack("<4sIQI", b"PK\x06\x07", 0, cd_end, 1))
            fp.write(struct.pack("<4sHHHHIIH", b"PK\x05\x06", 0, 0, 0xFFFF, 0xFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0))
        else:
            fp.write(struct.pack("<4sHHHHIIH", b"PK\x05\x06", 0, 0, count, count, cd_size, cd_start, 0))


def _walk(folder, name):
    if _USE_DIR_FD:
        for root, dirs, files, root_fd in os.fwalk(name, dir_fd=folder.fd, follow_symlinks=False):
            yield root.replace(os.sep, "/"), dirs, files, lambda entry, fd=root_fd: os.stat(entry, dir_fd=fd, follow_symlinks=False)
        return
    top = folder.join(name)
    for root, dirs, files in os.walk(top, followlinks=False):
        relative = os.path.relpath(root, folder.path).replace(os.sep, "/")
        yield relative, dirs, files, lambda entry, base=root: os.lstat(os.path.join(base, entry))


def _collect(folder, names, blocked, remote, tick):
    items = []
    skipped = 0

    def add(relative, info, is_dir):
        items.append({"rel": relative, "arcname": relative, "is_dir": is_dir, "size": 0 if is_dir else info.st_size, "mtime": info.st_mtime, "mode": info.st_mode})
        if len(items) > MAX_ENTRIES:
            raise ArchiveError("too_many_entries")

    for name in names:
        tick()
        try:
            info = folder.lstat(name)
        except OSError:
            skipped += 1
            continue
        if stat.S_ISLNK(info.st_mode) or _is_blocked(folder.join(name), blocked):
            skipped += 1
            continue
        if stat.S_ISREG(info.st_mode):
            add(name, info, False)
            continue
        if not stat.S_ISDIR(info.st_mode):
            skipped += 1
            continue

        add(name, info, True)
        for root, dirs, files, lstat_entry in _walk(folder, name):
            tick()
            kept = []
            for directory in sorted(dirs):
                if directory.startswith(STAGING_PREFIX) or is_temp_file(directory):
                    continue
                child = folder.join(os.path.join(*root.split("/"), directory))
                try:
                    child_info = lstat_entry(directory)
                except OSError:
                    skipped += 1
                    continue
                if not stat.S_ISDIR(child_info.st_mode) or _is_blocked(child, blocked) or os.path.normpath(child) in remote:
                    skipped += 1
                    continue
                kept.append(directory)
                add(f"{root}/{directory}", child_info, True)
            dirs[:] = kept
            for filename in sorted(files):
                if filename.startswith(STAGING_PREFIX) or is_temp_file(filename):
                    continue
                try:
                    child_info = lstat_entry(filename)
                except OSError:
                    skipped += 1
                    continue
                if not stat.S_ISREG(child_info.st_mode):
                    skipped += 1
                    continue
                add(f"{root}/{filename}", child_info, False)

    return items, skipped


def _compression_method(arcname):
    ext = os.path.splitext(arcname)[1].lower().lstrip(".")
    return 0 if ext in STORED_EXTENSIONS else 8


def _write_zip(job, out, folder, items, password, tick, budget, ctx):
    skipped = 0
    writer = _AesZipWriter(out, password) if password is not None else _PlainZipWriter(out)
    tree = _Tree(folder, None)

    def progress(amount):
        budget.add(amount)
        job["processed_bytes"] += amount

    try:
        for item in items:
            tick()
            job["current"] = item["arcname"]
            if item["is_dir"]:
                writer.add_dir(item["arcname"], item["mtime"], item["mode"])
                continue
            parent, _sep, name = item["rel"].rpartition("/")
            if ctx["source"] == "dropzone":
                try:
                    content = load_user_file(ctx["user"], os.path.relpath(tree.directory(parent).join(name), ctx["base"]))
                except (OSError, ArchiveError):
                    skipped += 1
                    continue
                writer.add_file(item["arcname"], io.BytesIO(content), len(content), item["mtime"], item["mode"], _compression_method(item["arcname"]), tick, progress)
                job["processed_files"] += 1
                continue
            try:
                descriptor = tree.directory(parent).open_fd(name, _OPEN_READ_FLAGS)
            except (OSError, ArchiveError):
                skipped += 1
                continue
            with os.fdopen(descriptor, "rb") as source:
                info = os.fstat(source.fileno())
                if not stat.S_ISREG(info.st_mode):
                    skipped += 1
                    continue
                writer.add_file(item["arcname"], source, info.st_size, info.st_mtime, info.st_mode, _compression_method(item["arcname"]), tick, progress)
            job["processed_files"] += 1
    finally:
        tree.close()

    writer.close()
    return skipped


def _compress_worker(job, ctx, folder_path, names, password, blocked, remote):
    tick = _job_tick(job)
    with _Anchor.open(ctx["base"], folder_path) as folder:
        items, skipped = _collect(folder, names, blocked, remote, tick)
        if not items:
            raise ArchiveError("invalid_selection")

        files = [item for item in items if not item["is_dir"]]
        job["total_files"] = len(files)
        job["total_bytes"] = sum(item["size"] for item in files)

        budget = _Budget(folder_path)
        budget.check(job["total_bytes"])

        _sweep_staging(folder)
        desired = f"{names[0]}.zip" if len(names) == 1 else "Archive.zip"
        temp_name = f"{STAGING_PREFIX}{uuid.uuid4().hex}.zip"
        try:
            if ctx["source"] == "dropzone":
                out = io.BytesIO()
                skipped += _write_zip(job, out, folder, items, password, tick, budget, ctx)
                tick()
                save_user_file(ctx["user"], os.path.relpath(folder.join(temp_name), ctx["base"]), out.getvalue())
            else:
                descriptor = folder.open_fd(temp_name, _OPEN_WRITE_FLAGS, ctx["file_mode"])
                with os.fdopen(descriptor, "w+b") as out:
                    skipped += _write_zip(job, out, folder, items, password, tick, budget, ctx)
            tick()
            job["current"] = None
            name, final = _place(folder, temp_name, folder, desired, False, blocked)
        except BaseException:
            folder.remove(temp_name)
            raise

    return {"name": name, "path": _relative_to_base(ctx, final), "is_dir": False, "skipped": skipped}


def _purge_jobs():
    now = time.monotonic()
    with _jobs_lock:
        for job_id in [key for key, job in _jobs.items() if job["_finished"] is not None and now - job["_finished"] > JOB_RETENTION]:
            _jobs.pop(job_id, None)


def _public_job(job):
    return {
        "id": job["id"],
        "kind": job["kind"],
        "state": job["state"],
        "processed_bytes": job["processed_bytes"],
        "total_bytes": job["total_bytes"],
        "processed_files": job["processed_files"],
        "total_files": job["total_files"],
        "current": job["current"],
        "result": job["result"],
        "error": job["error"],
    }


def _finish(job, state, result=None, error=None):
    with _jobs_lock:
        job["state"] = state
        job["result"] = result
        job["error"] = error
        job["current"] = None
        job["_finished"] = time.monotonic()


def _run_job(job, worker, args):
    try:
        result = worker(job, *args)
    except _Canceled:
        _finish(job, "canceled")
    except ArchiveError as exc:
        _finish(job, "error", error=exc.code)
    except OSError as exc:
        _finish(job, "error", error="insufficient_space" if exc.errno in (errno.ENOSPC, getattr(errno, "EDQUOT", errno.ENOSPC)) else "io_error")
    except Exception:
        _finish(job, "error", error="io_error")
    else:
        _finish(job, "done", result=result)


def _start_job(kind, worker, args):
    _purge_jobs()
    owner = current_user.id.lower()
    with _jobs_lock:
        running = sum(1 for job in _jobs.values() if job["_owner"] == owner and job["state"] == "running")
        if running >= MAX_RUNNING_JOBS:
            raise ArchiveError("busy")
        job = {
            "id": uuid.uuid4().hex,
            "kind": kind,
            "state": "running",
            "processed_bytes": 0,
            "total_bytes": 0,
            "processed_files": 0,
            "total_files": 0,
            "current": None,
            "result": None,
            "error": None,
            "_owner": owner,
            "_cancel": threading.Event(),
            "_deadline": time.monotonic() + JOB_TIMEOUT,
            "_finished": None,
        }
        _jobs[job["id"]] = job
    threading.Thread(target=_run_job, args=(job, worker, args), name=f"archive-{kind}", daemon=True).start()
    return job


def _owned_job(job_id):
    _purge_jobs()
    if not isinstance(job_id, str):
        return None
    with _jobs_lock:
        job = _jobs.get(job_id)
        if job is None or job["_owner"] != current_user.id.lower():
            return None
        return job


def _error(exc):
    return jsonify({"error": exc.code, "message": exc.message}), exc.status


def _body():
    body = request.get_json(silent=True)
    return body if isinstance(body, dict) else {}


def _password(body):
    value = body.get("password")
    if not isinstance(value, str) or not value:
        return None
    if len(value) > MAX_PASSWORD_LENGTH:
        raise ArchiveError("wrong_password")
    return value.encode("utf-8")


def _relative_to_base(ctx, path):
    relative = os.path.relpath(path, ctx["base"])
    return "" if relative == "." else relative.replace(os.sep, "/")


def _resolve_location(location, write):
    if not isinstance(location, dict):
        raise ArchiveError("unsupported_location")
    source = location.get("source")

    if source == "storage":
        user_dir = os.path.join(storage_folder, current_user.id.lower())
        if not os.path.exists(user_dir):
            os.makedirs(user_dir, mode=0o700, exist_ok=True)
        return {"source": "storage", "base": os.path.realpath(user_dir), "dir_mode": 0o700, "file_mode": 0o600}, None

    if source == "dropzone":
        user_name = current_user.id.lower()
        user_dir = os.path.join(dropzone_folder, user_name)
        if not os.path.exists(user_dir):
            os.makedirs(user_dir, mode=0o700, exist_ok=True)
        return {"source": "dropzone", "base": os.path.realpath(user_dir), "user": user_name, "dir_mode": 0o700, "file_mode": 0o600}, None

    if source == "appdrive":
        container_name = location.get("container")
        if not container_name or not isinstance(container_name, str):
            return None, (jsonify({"error": "Container name is required"}), 400)
        try:
            mount_index = int(location.get("mount", 0))
        except (TypeError, ValueError):
            return None, (jsonify({"error": "Invalid mount index"}), 400)
        valid_mounts = get_container_valid_mounts(container_name)
        if not valid_mounts:
            return None, (jsonify({"error": "No accessible mounts found for this container"}), 404)
        if mount_index < 0 or mount_index >= len(valid_mounts):
            return None, (jsonify({"error": "Invalid mount index"}), 400)
        mount = valid_mounts[mount_index]
        if write and mount["read_only"]:
            return None, (jsonify({"error": "This mount is read-only"}), 403)
        return {"source": "appdrive", "base": os.path.realpath(mount["host_path"]), "mount": mount, "dir_mode": 0o755, "file_mode": 0o644}, None

    if source == "disksplus":
        disk_id = location.get("disk")
        if not disk_id:
            return None, (jsonify({"error": "missing_disk"}), 400)
        disk = find_disk_by_id(disk_id)
        if disk is None:
            return None, (jsonify({"error": "disk_not_found"}), 404)
        mountpoint = disk.get("mountpoint") or ""
        if not mountpoint or not os.path.isdir(mountpoint):
            return None, (jsonify({"error": "disk_not_mounted"}), 404)
        return {"source": "disksplus", "base": os.path.realpath(os.path.abspath(mountpoint)), "dir_mode": 0o755, "file_mode": 0o644}, None

    raise ArchiveError("unsupported_location")


def _guard(ctx, path):
    if ctx["source"] == "appdrive":
        return _external_access_denied(ctx["mount"], path)
    if ctx["source"] == "disksplus":
        return _check_access(path)
    return None


def _blocked_zones(ctx, roots):
    if ctx["source"] in ("storage", "dropzone") or (ctx["source"] == "appdrive" and not ctx["mount"].get("external")):
        return frozenset()
    blocked = set()
    for zone in get_danger_zones():
        zone_key = os.path.normcase(os.path.normpath(zone))
        if not any(zone_key.startswith(os.path.normcase(root).rstrip(os.sep) + os.sep) for root in roots):
            continue
        if ctx["source"] == "appdrive":
            denied = _external_path_blocked(ctx["mount"], os.path.normpath(zone))
        else:
            denied = not authorize_request(os.path.normpath(zone))[0]
        if denied:
            blocked.add(zone)
    return frozenset(blocked)


def _reject_linked_components(base, relative):
    current = os.path.join(base, os.path.normpath(relative)) if relative else base
    while len(current) > len(base):
        if os.path.islink(current):
            raise ValueError("Symlinks are not allowed")
        current = os.path.dirname(current)


def _resolve_target(ctx, relative, want_dir):
    if not isinstance(relative, str):
        raise ArchiveError("invalid_path")
    relative = relative.strip()
    if not relative and not want_dir:
        raise ArchiveError("invalid_path")
    try:
        target = validate_safe_path(ctx["base"], relative) if relative else ctx["base"]
    except ValueError:
        raise ArchiveError("invalid_path")

    denied = _guard(ctx, target)
    if denied:
        return None, denied

    if not os.path.lexists(target):
        raise ArchiveError("not_found")

    try:
        validate_no_symlinks(target, ctx["base"])
        _reject_linked_components(ctx["base"], relative)
    except ValueError:
        return None, (jsonify({"error": "security_violation"}), 403)

    if want_dir and not os.path.isdir(target):
        raise ArchiveError("not_found")
    if not want_dir and not os.path.isfile(target):
        raise ArchiveError("not_an_archive")
    return target, None


def _open_archive(body, write):
    ctx, denied = _resolve_location(body.get("location"), write)
    if denied:
        return None, None, None, denied
    archive_path, denied = _resolve_target(ctx, body.get("path"), False)
    if denied:
        return None, None, None, denied
    source = _DropZoneSource(ctx["base"], archive_path, ctx["user"]) if ctx["source"] == "dropzone" else _Source(ctx["base"], archive_path)
    return ctx, source, _detect_format(source), None


@login_required
def archive_list():
    body = _body()
    try:
        _ctx, source, fmt, denied = _open_archive(body, False)
        if denied:
            return denied
        password = _password(body)
        scan = _scan(source, fmt, _deadline_tick(REQUEST_TIMEOUT))
        if password is not None and scan["encryption"]:
            _verify_password(source, scan["entries"], password)
    except ArchiveError as exc:
        return _error(exc)

    return jsonify(
        {
            "kind": scan["kind"],
            "name": os.path.basename(source.path),
            "size": scan["size"],
            "encrypted": scan["encrypted"],
            "encryption": scan["encryption"],
            "entries": [_public_entry(entry) for entry in scan["entries"]],
            "total_size": scan["total_size"],
            "total_compressed": scan["total_compressed"],
            "skipped": scan["skipped"],
        }
    )


@login_required
def archive_entry():
    body = _body()
    spool = None
    try:
        ctx, source, fmt, denied = _open_archive(body, False)
        if denied:
            return denied
        password = _password(body)
        entry_path = body.get("entry")
        if not isinstance(entry_path, str) or not entry_path.strip("/"):
            raise ArchiveError("invalid_selection")
        entry_path = entry_path.strip("/")

        tick = _deadline_tick(REQUEST_TIMEOUT)
        scan = _scan(source, fmt, tick)
        matches = [entry for entry in scan["entries"] if entry["path"] == entry_path]
        entry = next((item for item in matches if not item["skip"]), matches[0] if matches else None)
        if entry is None:
            raise ArchiveError("not_found")
        if entry["is_dir"]:
            raise ArchiveError("invalid_selection")
        if entry["skip"]:
            raise ArchiveError({"suspicious_ratio": "suspicious_ratio", "encrypted_unsupported": "unsupported_format"}.get(entry["skip"], "invalid_selection"))
        if entry["size"] > MAX_ENTRY_BYTES:
            raise ArchiveError("too_large")
        _require_password([entry], password)

        spool = io.BytesIO() if ctx["source"] == "dropzone" else tempfile.SpooledTemporaryFile(max_size=SPOOL_MEMORY_BYTES)
        total = 0
        if fmt == "zip":
            with source.open() as fp:
                for chunk in _zip_chunks(fp, entry, password, tick):
                    total += len(chunk)
                    if total > MAX_ENTRY_BYTES:
                        raise ArchiveError("too_large")
                    spool.write(chunk)
        else:
            with contextlib.closing(_tar_member_chunks(source, fmt, scan["size"], entry, tick)) as chunks:
                for chunk in chunks:
                    total += len(chunk)
                    if total > MAX_ENTRY_BYTES or total > entry["size"]:
                        raise ArchiveError("too_large")
                    spool.write(chunk)
        spool.seek(0)
    except ArchiveError as exc:
        if spool is not None:
            spool.close()
        return _error(exc)
    except OSError:
        if spool is not None:
            spool.close()
        return _error(ArchiveError("io_error", status=500))

    response = send_file(spool, mimetype="application/octet-stream", as_attachment=True, download_name=entry["name"])
    response.headers["Cache-Control"] = "no-store"
    return response


@login_required
def archive_extract():
    body = _body()
    try:
        ctx, source, fmt, denied = _open_archive(body, True)
        if denied:
            return denied
        password = _password(body)
        selection = body.get("entries")
        if selection is not None and (not isinstance(selection, list) or not selection):
            raise ArchiveError("invalid_selection")

        dest_dir = os.path.dirname(source.path)
        denied = _guard(ctx, dest_dir)
        if denied:
            return denied
        blocked = _blocked_zones(ctx, [dest_dir])

        if fmt == "zip":
            scan = _scan(source, fmt, _deadline_tick(REQUEST_TIMEOUT))
            plan = _plan(scan, selection)
            entries = [entry for entry, _relative in plan["items"]]
            _require_password(entries, password)
            if password is not None:
                _verify_password(source, entries, password)

        job = _start_job("extract", _extract_worker, (ctx, source, fmt, selection, password, blocked))
    except ArchiveError as exc:
        return _error(exc)

    return jsonify({"job_id": job["id"]}), 202


@login_required
def archive_compress():
    body = _body()
    try:
        ctx, denied = _resolve_location(body.get("location"), True)
        if denied:
            return denied
        folder, denied = _resolve_target(ctx, body.get("folder", ""), True)
        if denied:
            return denied
        new_password = body.get("password")
        if isinstance(new_password, str) and len(new_password) > MAX_NEW_PASSWORD_LENGTH:
            raise ArchiveError("password_too_long")
        password = _password(body)

        names = body.get("names")
        if not isinstance(names, list) or not names or len(names) > MAX_ENTRIES:
            raise ArchiveError("invalid_selection")
        seen = set()
        roots = []
        for name in names:
            if not isinstance(name, str) or not name or name in (".", "..") or "/" in name or "\\" in name or "\x00" in name:
                raise ArchiveError("invalid_selection")
            if name in seen or is_temp_file(name) or name.startswith(STAGING_PREFIX):
                raise ArchiveError("invalid_selection")
            seen.add(name)
            path = os.path.join(folder, name)
            if not os.path.lexists(path):
                raise ArchiveError("not_found")
            if os.path.islink(path):
                raise ArchiveError("invalid_selection")
            denied = _guard(ctx, path)
            if denied:
                return denied
            if os.path.isdir(path):
                roots.append(path)

        blocked = _blocked_zones(ctx, roots + [folder])
        remote = frozenset(_remote_mount_set()) if ctx["source"] == "disksplus" else frozenset()

        job = _start_job("compress", _compress_worker, (ctx, folder, list(names), password, blocked, remote))
    except ArchiveError as exc:
        return _error(exc)

    return jsonify({"job_id": job["id"]}), 202


@login_required
def archive_job():
    job = _owned_job(request.args.get("id", ""))
    if job is None:
        return _error(ArchiveError("not_found", "Job not found"))
    with _jobs_lock:
        return jsonify(_public_job(job))


@login_required
def archive_cancel():
    job = _owned_job(_body().get("id"))
    if job is None:
        return _error(ArchiveError("not_found", "Job not found"))
    job["_cancel"].set()
    return jsonify({"ok": True})
