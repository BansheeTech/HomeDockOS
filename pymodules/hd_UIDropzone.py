"""
hd_UIDropzone.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import io
import os

from flask import render_template, send_file, session, g, jsonify, request
from flask_login import current_user, login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import dropzone_folder
from pymodules.hd_FunctionsGlobals import version
from pymodules.hd_DropZoneEncryption import save_user_file, load_user_file

from werkzeug.utils import secure_filename


@login_required
def list_files():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    if not os.path.exists(user_dir):
        os.makedirs(user_dir)
        return jsonify({"files": []})

    files = []
    for root, dirs, filenames in os.walk(user_dir):
        for filename in filenames:
            file_path = os.path.join(root, filename)
            file_stats = os.stat(file_path)
            files.append(
                {
                    "name": os.path.relpath(file_path, user_dir),
                    "size": file_stats.st_size,
                }
            )

    return jsonify({"files": files})


@login_required
def upload_file():
    user_name = current_user.id.lower()
    user_dir = os.path.join(dropzone_folder, user_name)

    if not os.path.exists(user_dir):
        os.makedirs(user_dir)

    uploaded_file = request.files.get("file")
    if not uploaded_file:
        return jsonify({"error": "No file uploaded"}), 400

    safe_filename = secure_filename(uploaded_file.filename)
    encrypted_file_path = os.path.join(user_dir, safe_filename)

    try:
        file_content = uploaded_file.read()
        save_user_file(user_name, safe_filename, file_content)

        return jsonify({"success": True, "filename": safe_filename})
    except Exception as e:
        if os.path.exists(encrypted_file_path):
            os.remove(encrypted_file_path)
        return jsonify({"error": "Error saving file", "details": str(e)}), 500


@login_required
def download_file():
    user_name = current_user.id.lower()

    file_name = request.args.get("file")
    if not file_name:
        return jsonify({"error": "No file specified"}), 400

    user_dir = os.path.join(dropzone_folder, user_name)
    file_path = os.path.join(user_dir, file_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        file_content = load_user_file(user_name, file_name)
        return send_file(
            io.BytesIO(file_content),
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name=file_name,
        )
    except Exception as e:
        return jsonify({"error": "Error decrypting file", "details": str(e)}), 500


@login_required
def delete_file():
    user_name = current_user.id.lower()

    file_name = request.json.get("file")
    if not file_name:
        return jsonify({"error": "No file specified"}), 400

    user_dir = os.path.join(dropzone_folder, user_name)
    file_path = os.path.join(user_dir, file_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        os.remove(file_path)
        return jsonify({"success": True, "message": f"File {file_name} deleted successfully"})
    except Exception as e:
        return jsonify({"error": "Error deleting file", "details": str(e)}), 500


@login_required
def dropzone():
    config = read_config()
    user_name = current_user.id.lower()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    return render_template(
        "dropzone.html",
        user_name=user_name,
        version=version,
        nonce=g.get("nonce", ""),
        selected_theme=selected_theme,
        selected_back=selected_back,
    )
