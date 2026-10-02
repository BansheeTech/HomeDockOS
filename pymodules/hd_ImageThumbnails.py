"""
hd_ImageThumbnails.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import time
import struct
import hashlib
import threading

from dataclasses import dataclass

from flask import Response, jsonify
from PIL import Image

from pymodules.hd_FunctionsGlobals import user_packages_thumbnails_folder
from pymodules.hd_FunctionsSecurity import validate_filename

THUMB_SIZE = 256
THUMB_QUALITY = 70
THUMB_VERSION = "v1"
THUMB_TTL = 7 * 24 * 60 * 60
PURGE_INTERVAL = 24 * 60 * 60
MAX_SOURCE_BYTES = 50 * 1024 * 1024
MAX_PIXELS = 100_000_000
MAX_CONCURRENT_RENDERS = 2
EXIF_SCAN_BYTES = 256 * 1024
JPEG_HEADER_SCAN_BYTES = 1024 * 1024

PILLOW_FORMATS = ["JPEG", "PNG", "GIF", "WEBP", "BMP", "ICO", "TIFF", "PSD", "AVIF", "TGA", "DDS", "ICNS", "JPEG2000", "QOI"]

JPEG_EXTENSIONS = {"jpg", "jpeg", "jpe", "jfif"}
PILLOW_EXTENSIONS = JPEG_EXTENSIONS | {"png", "gif", "webp", "bmp", "ico", "tif", "tiff", "psd", "avif", "tga", "dds", "icns", "jp2", "j2k", "qoi"}
RAW_EXTENSIONS = {"dng", "cr2", "nef", "nrw", "arw", "srf", "sr2", "rw2", "pef", "srw", "raf"}
THUMBNAIL_EXTENSIONS = PILLOW_EXTENSIONS | RAW_EXTENSIONS

ORIENTATION_TRANSPOSE = {
    2: Image.Transpose.FLIP_LEFT_RIGHT,
    3: Image.Transpose.ROTATE_180,
    4: Image.Transpose.FLIP_TOP_BOTTOM,
    5: Image.Transpose.TRANSPOSE,
    6: Image.Transpose.ROTATE_270,
    7: Image.Transpose.TRANSVERSE,
    8: Image.Transpose.ROTATE_90,
}

TIFF_TYPE_FORMATS = {1: "B", 3: "H", 4: "I", 7: "B", 13: "I"}
TIFF_MAGICS = {42, 0x55, 0x4F52, 0x5352}
BASELINE_SOF_MARKERS = {0xC0, 0xC1, 0xC2}
OTHER_SOF_MARKERS = {0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF}

Image.MAX_IMAGE_PIXELS = MAX_PIXELS

_render_slots = threading.BoundedSemaphore(MAX_CONCURRENT_RENDERS)
_key_locks = {}
_key_locks_guard = threading.Lock()
_purge_guard = threading.Lock()
_last_purge = 0.0


@dataclass(frozen=True)
class RenderProfile:
    size: int
    quality: int
    psd_embedded_first: bool
    max_source_bytes: int = MAX_SOURCE_BYTES


THUMBNAIL_PROFILE = RenderProfile(size=THUMB_SIZE, quality=THUMB_QUALITY, psd_embedded_first=True)


def thumbnail_extension(file_path):
    return os.path.splitext(file_path)[1].lstrip(".").lower()


def _normalize_mode(img):
    if img.mode in ("I", "I;16", "I;16B", "I;16L", "F"):
        return img.point(lambda value: value / 256).convert("L")
    if img.mode == "P":
        return img.convert("RGBA" if "transparency" in img.info else "RGB")
    if img.mode in ("LA", "PA", "RGBA"):
        return img.convert("RGBA")
    if img.mode not in ("RGB", "L"):
        return img.convert("RGB")
    return img


def _render(source, profile, fallback_orientation=1):
    try:
        with Image.open(source, formats=PILLOW_FORMATS) as img:
            if img.width * img.height > MAX_PIXELS:
                return None

            orientation = img.getexif().get(0x0112) or fallback_orientation
            img.draft(None, (profile.size, profile.size))
            img.thumbnail((profile.size, profile.size))
            img.load()
            thumb = _normalize_mode(img)

        transpose = ORIENTATION_TRANSPOSE.get(orientation)
        if transpose is not None:
            thumb = thumb.transpose(transpose)

        buffer = io.BytesIO()
        thumb.save(buffer, "WEBP", quality=profile.quality, method=4)
        return buffer.getvalue()
    except Exception:
        return None


def _read_ifd(fp, base, offset, endian):
    fp.seek(base + offset)
    raw = fp.read(2)
    if len(raw) < 2:
        return {}, 0

    (count,) = struct.unpack(endian + "H", raw)
    if count == 0 or count > 1000:
        return {}, 0

    data = fp.read(count * 12 + 4)
    if len(data) < count * 12 + 4:
        return {}, 0

    entries = {}
    for index in range(count):
        chunk = data[index * 12 : index * 12 + 12]
        tag, kind, amount = struct.unpack(endian + "HHI", chunk[:8])
        entries[tag] = (kind, amount, chunk[8:])

    (next_offset,) = struct.unpack(endian + "I", data[-4:])
    return entries, next_offset


def _ifd_values(fp, base, endian, entry, limit=64):
    if entry is None:
        return []

    kind, amount, raw = entry
    fmt = TIFF_TYPE_FORMATS.get(kind)
    if fmt is None or amount == 0 or amount > limit:
        return []

    total = struct.calcsize(endian + fmt * amount)
    if total <= 4:
        buffer = raw[:total]
    else:
        (offset,) = struct.unpack(endian + "I", raw)
        fp.seek(base + offset)
        buffer = fp.read(total)
        if len(buffer) < total:
            return []

    return list(struct.unpack(endian + fmt * amount, buffer))


def _tiff_previews(fp, base):
    fp.seek(base)
    head = fp.read(8)
    if len(head) < 8 or head[:2] not in (b"II", b"MM"):
        return 1, []

    endian = "<" if head[:2] == b"II" else ">"
    magic, first_offset = struct.unpack(endian + "HI", head[2:])
    if magic not in TIFF_MAGICS:
        return 1, []

    orientation = 1
    candidates = []
    queue = [(first_offset, 0)]
    seen = set()

    while queue and len(seen) < 32:
        offset, depth = queue.pop(0)
        if offset == 0 or offset in seen:
            continue
        seen.add(offset)

        entries, next_offset = _read_ifd(fp, base, offset, endian)
        if not entries:
            continue

        if offset == first_offset:
            orientation = (_ifd_values(fp, base, endian, entries.get(0x0112)) or [1])[0]

        jpeg_offset = _ifd_values(fp, base, endian, entries.get(0x0201))
        jpeg_length = _ifd_values(fp, base, endian, entries.get(0x0202))
        if jpeg_offset and jpeg_length:
            candidates.append((base + jpeg_offset[0], jpeg_length[0]))

        compression = _ifd_values(fp, base, endian, entries.get(0x0103))
        if compression and compression[0] in (6, 7):
            strips = _ifd_values(fp, base, endian, entries.get(0x0111))
            counts = _ifd_values(fp, base, endian, entries.get(0x0117))
            if len(strips) == 1 and len(counts) == 1:
                candidates.append((base + strips[0], counts[0]))

        embedded = entries.get(0x002E)
        if embedded is not None and embedded[0] == 7:
            (embedded_offset,) = struct.unpack(endian + "I", embedded[2])
            candidates.append((base + embedded_offset, embedded[1]))

        if depth < 2:
            for sub_offset in _ifd_values(fp, base, endian, entries.get(0x014A), limit=16):
                queue.append((sub_offset, depth + 1))

        if depth == 0 and next_offset:
            queue.append((next_offset, 0))

    return orientation, candidates


def _jpeg_exif_previews(fp):
    fp.seek(0)
    if fp.read(2) != b"\xff\xd8":
        return 1, []

    while fp.tell() < EXIF_SCAN_BYTES:
        header = fp.read(4)
        if len(header) < 4 or header[0] != 0xFF:
            return 1, []

        marker = header[1]
        (length,) = struct.unpack(">H", header[2:])
        if marker in (0xD9, 0xDA) or length < 2:
            return 1, []

        start = fp.tell()
        if marker == 0xE1 and length >= 8 and fp.read(6) == b"Exif\x00\x00":
            return _tiff_previews(fp, start + 6)

        fp.seek(start + length - 2)

    return 1, []


def _raw_previews(fp):
    fp.seek(0)
    head = fp.read(92)
    if head[:16] == b"FUJIFILMCCD-RAW ":
        jpeg_offset, jpeg_length = struct.unpack(">II", head[84:92])
        return 1, [(jpeg_offset, jpeg_length)]

    return _tiff_previews(fp, 0)


def _psd_previews(fp):
    fp.seek(0)
    head = fp.read(26)
    if len(head) < 26 or head[:4] != b"8BPS":
        return 1, []

    (color_mode_length,) = struct.unpack(">I", fp.read(4))
    fp.seek(26 + 4 + color_mode_length)
    raw = fp.read(4)
    if len(raw) < 4:
        return 1, []

    (resources_length,) = struct.unpack(">I", raw)
    end = fp.tell() + resources_length

    while fp.tell() + 12 <= end:
        if fp.read(4) != b"8BIM":
            return 1, []

        (resource_id,) = struct.unpack(">H", fp.read(2))
        name_length = fp.read(1)[0]
        fp.seek(name_length + (0 if name_length % 2 else 1), 1)
        (size,) = struct.unpack(">I", fp.read(4))
        data_start = fp.tell()

        if resource_id == 1036 and size > 28:
            return 1, [(data_start + 28, size - 28)]

        fp.seek(data_start + size + (size % 2))

    return 1, []


def _is_baseline_jpeg(fp, offset, length):
    fp.seek(offset)
    if fp.read(2) != b"\xff\xd8":
        return False

    limit = offset + min(length, JPEG_HEADER_SCAN_BYTES)
    while fp.tell() < limit:
        header = fp.read(4)
        if len(header) < 4 or header[0] != 0xFF:
            return False

        marker = header[1]
        if marker in BASELINE_SOF_MARKERS:
            return True
        if marker in OTHER_SOF_MARKERS or marker in (0xD9, 0xDA):
            return False

        (segment_length,) = struct.unpack(">H", header[2:])
        fp.seek(segment_length - 2, 1)

    return False


def _render_embedded(fp, previews, profile):
    orientation, candidates = previews
    file_size = fp.seek(0, os.SEEK_END)

    for offset, length in sorted(set(candidates), key=lambda item: item[1], reverse=True):
        if length <= 0 or length > MAX_SOURCE_BYTES or offset + length > file_size:
            continue
        if not _is_baseline_jpeg(fp, offset, length):
            continue

        fp.seek(offset)
        result = _render(io.BytesIO(fp.read(length)), profile, orientation)
        if result:
            return result

    return None


def _generate(open_source, extension, size, profile):
    with _render_slots, open_source() as fp:
        if extension in RAW_EXTENSIONS:
            return _render_embedded(fp, _raw_previews(fp), profile)

        if extension == "psd" and profile.psd_embedded_first:
            result = _render_embedded(fp, _psd_previews(fp), profile)
            if result:
                return result

        if size <= profile.max_source_bytes:
            fp.seek(0)
            result = _render(fp, profile)
            if result:
                return result

        if extension == "psd" and not profile.psd_embedded_first:
            return _render_embedded(fp, _psd_previews(fp), profile)

        if extension in JPEG_EXTENSIONS:
            return _render_embedded(fp, _jpeg_exif_previews(fp), profile)

    return None


def _key_lock(key):
    with _key_locks_guard:
        entry = _key_locks.setdefault(key, [threading.Lock(), 0])
        entry[1] += 1
        return entry


def _release_key_lock(key, entry):
    with _key_locks_guard:
        entry[1] -= 1
        if entry[1] == 0:
            _key_locks.pop(key, None)


def _write_atomic(path, data):
    temp_path = f"{path}.{os.getpid()}.{threading.get_ident()}.tmp"
    with open(temp_path, "wb") as handle:
        handle.write(data)
    os.replace(temp_path, path)


def _read_cached(image_path, empty_path):
    for path in (image_path, empty_path):
        try:
            with open(path, "rb") as handle:
                data = handle.read()
            os.utime(path)
            return True, data or None
        except OSError:
            continue
    return False, None


def _remove_previous_versions(owner_dir, path_key, keep):
    try:
        names = os.listdir(owner_dir)
    except OSError:
        return

    for name in names:
        if name.startswith(path_key) and not name.startswith(keep):
            try:
                os.remove(os.path.join(owner_dir, name))
            except OSError:
                continue


def render_file(file_path, extension, size, loader=None, profile=THUMBNAIL_PROFILE):
    if loader is None:
        return _generate(lambda: open(file_path, "rb"), extension, size, profile)

    if size > MAX_SOURCE_BYTES:
        return None

    return _generate(lambda: io.BytesIO(loader(file_path)), extension, size, profile)


def _cached_or_generate(file_path, extension, stat, cache_owner, loader):
    real_path = os.path.realpath(file_path)
    path_key = hashlib.sha256(real_path.encode("utf-8")).hexdigest()[:8]
    version_key = hashlib.sha256(f"{real_path}|{stat.st_size}|{stat.st_mtime_ns}|{THUMB_VERSION}".encode("utf-8")).hexdigest()[:8]
    key = path_key + version_key

    if cache_owner is None or loader is not None:
        return key, render_file(file_path, extension, stat.st_size, loader)

    owner_dir = os.path.join(user_packages_thumbnails_folder, validate_filename(cache_owner))
    image_path = os.path.join(owner_dir, f"{key}.webp")
    empty_path = os.path.join(owner_dir, f"{key}.none")

    found, data = _read_cached(image_path, empty_path)
    if found:
        return key, data

    entry = _key_lock(key)
    try:
        with entry[0]:
            found, data = _read_cached(image_path, empty_path)
            if found:
                return key, data

            data = render_file(file_path, extension, stat.st_size, loader)

            try:
                os.makedirs(owner_dir, mode=0o700, exist_ok=True)
                _write_atomic(image_path if data else empty_path, data or b"")
            except OSError:
                pass

            _remove_previous_versions(owner_dir, path_key, key)
    finally:
        _release_key_lock(key, entry)

    _purge_if_due()
    return key, data


def thumbnail_response(file_path, cache_owner=None, loader=None):
    extension = thumbnail_extension(file_path)
    if extension not in THUMBNAIL_EXTENSIONS:
        return jsonify({"error": "unsupported_format"}), 400

    try:
        stat = os.stat(file_path)
    except OSError:
        return jsonify({"error": "file_not_found"}), 404

    if not os.path.isfile(file_path):
        return jsonify({"error": "not_a_file"}), 400

    try:
        key, data = _cached_or_generate(file_path, extension, stat, cache_owner, loader)
    except (OSError, ValueError):
        return jsonify({"error": "thumbnail_failed"}), 500

    cache_control = "private, no-store" if loader is not None else f"private, max-age={THUMB_TTL}"
    headers = {"Cache-Control": cache_control, "ETag": f'"{key}"', "X-Content-Type-Options": "nosniff"}

    if not data:
        return Response(status=204, headers=headers)

    return Response(data, mimetype="image/webp", headers=headers)


def _purge_if_due():
    global _last_purge

    if time.time() - _last_purge < PURGE_INTERVAL or not _purge_guard.acquire(blocking=False):
        return

    try:
        _last_purge = time.time()
        purge_expired_thumbnails()
    except OSError:
        pass
    finally:
        _purge_guard.release()


def purge_expired_thumbnails():
    if not os.path.isdir(user_packages_thumbnails_folder):
        return 0

    cutoff = time.time() - THUMB_TTL
    removed = 0

    for owner in os.listdir(user_packages_thumbnails_folder):
        owner_dir = os.path.join(user_packages_thumbnails_folder, owner)
        if os.path.islink(owner_dir) or not os.path.isdir(owner_dir):
            continue

        for name in os.listdir(owner_dir):
            path = os.path.join(owner_dir, name)
            try:
                if os.path.isfile(path) and os.stat(path).st_mtime < cutoff:
                    os.remove(path)
                    removed += 1
            except OSError:
                continue

        try:
            if not os.listdir(owner_dir):
                os.rmdir(owner_dir)
        except OSError:
            pass

    return removed
