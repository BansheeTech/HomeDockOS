"""
hd_UIControlHubUploadFile.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

import os


from flask import request, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename

from pymodules.hd_FunctionsGlobals import compose_upload_folder


@login_required
def upload_compose_file():

    if "compose_file" not in request.files:
        return jsonify(message="No file part in the request."), 400
    file = request.files["compose_file"]

    if file.filename == "":
        return jsonify(message="No selected file."), 400

    if not file.filename.endswith(".yml"):
        return jsonify(message="Invalid file type."), 400

    container_name = request.form.get("container_name")
    if not container_name:
        return jsonify(message="No container name specified."), 400

    filename = secure_filename(container_name + ".yml")
    file.save(os.path.join(compose_upload_folder, filename))

    return jsonify(message="Compose file uploaded successfully."), 200
