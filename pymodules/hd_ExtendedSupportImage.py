"""
hd_ExtendedSupportImage.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from flask import Response, jsonify

from pymodules.hd_ImageThumbnails import RenderProfile, THUMBNAIL_EXTENSIONS, render_file, thumbnail_extension

PREVIEW_SIZE = 4096
PREVIEW_QUALITY = 90
PREVIEW_MAX_AGE = 60 * 60
PREVIEW_MAX_SOURCE_BYTES = 1024 * 1024 * 1024

BROWSER_NATIVE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "ico"}
EXTENDED_EXTENSIONS = THUMBNAIL_EXTENSIONS - BROWSER_NATIVE_EXTENSIONS

PREVIEW_PROFILE = RenderProfile(size=PREVIEW_SIZE, quality=PREVIEW_QUALITY, psd_embedded_first=False, max_source_bytes=PREVIEW_MAX_SOURCE_BYTES)


def preview_response(file_path, loader=None):
    if thumbnail_extension(file_path) not in EXTENDED_EXTENSIONS:
        return jsonify({"error": "unsupported_format"}), 400

    try:
        stat = os.stat(file_path)
    except OSError:
        return jsonify({"error": "file_not_found"}), 404

    if not os.path.isfile(file_path):
        return jsonify({"error": "not_a_file"}), 400

    try:
        data = render_file(file_path, thumbnail_extension(file_path), stat.st_size, loader, PREVIEW_PROFILE)
    except (OSError, ValueError):
        data = None

    if not data:
        return jsonify({"error": "preview_failed"}), 422

    cache_control = "private, no-store" if loader is not None else f"private, max-age={PREVIEW_MAX_AGE}"
    return Response(data, mimetype="image/webp", headers={"Cache-Control": cache_control, "X-Content-Type-Options": "nosniff"})
