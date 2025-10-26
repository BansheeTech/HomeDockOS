"""
hd_UIWallpaperUpload.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import user_packages_wallpaper_folder

MAX_WALLPAPER_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png"}

MAGIC_BYTES = {
    "jpeg": [b"\xff\xd8\xff"],  # JPEG
    "png": [b"\x89\x50\x4e\x47\x0d\x0a\x1a\x0a"],  # PNG
}


def validate_image_type(file_bytes):
    # HDOS00002
    if len(file_bytes) < 8:
        return False, "Invalid file"

    for jpeg_sig in MAGIC_BYTES["jpeg"]:
        if file_bytes.startswith(jpeg_sig):
            return True, "jpeg"

    for png_sig in MAGIC_BYTES["png"]:
        if file_bytes.startswith(png_sig):
            return True, "png"

    return False, "Invalid file"


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@login_required
def api_upload_wallpaper():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"success": False, "message": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({"success": False, "message": "Invalid file type. Only .jpg, .jpeg, and .png are allowed"}), 400

        file_bytes = file.read()

        if len(file_bytes) > MAX_WALLPAPER_SIZE:
            return jsonify({"success": False, "message": "Invalid file"}), 400

        is_valid, result = validate_image_type(file_bytes)
        if not is_valid:
            return jsonify({"success": False, "message": result}), 400

        detected_type = result

        file_extension = ".jpg" if detected_type == "jpeg" else ".png"
        wallpaper_filename = f"_back_custom{file_extension}"

        wallpaper_path = os.path.join(user_packages_wallpaper_folder, wallpaper_filename)
        wallpaper_path_real = os.path.realpath(wallpaper_path)
        wallpaper_folder_real = os.path.realpath(user_packages_wallpaper_folder)

        if not wallpaper_path_real.startswith(wallpaper_folder_real):
            return jsonify({"success": False, "message": "Invalid file"}), 400

        os.makedirs(user_packages_wallpaper_folder, exist_ok=True)

        for ext in [".jpg", ".png"]:
            old_wallpaper = os.path.join(user_packages_wallpaper_folder, f"_back_custom{ext}")
            if os.path.exists(old_wallpaper):
                try:
                    os.remove(old_wallpaper)
                except Exception:
                    pass

        with open(wallpaper_path, "wb") as f:
            f.write(file_bytes)

        return jsonify({"success": True, "message": "Wallpaper uploaded successfully", "wallpaper_url": f"/images/user-wallpaper/{wallpaper_filename}", "file_type": detected_type}), 200

    except Exception as e:
        return jsonify({"success": False, "message": f"Error uploading wallpaper: {str(e)}"}), 500


def ensure_wallpaper_dir():
    os.makedirs(user_packages_wallpaper_folder, exist_ok=True)
