"""
hd_ApplyUploadLimits.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

from flask import request, jsonify
from hypercorn.config import Config

DEFAULT_MAX_SIZE = 1 * 1024 * 1024  # 1MB

endpoint_limits = {
    "/api/upload_file": 1 * 1024 * 1024 * 1024,  # 1GB
}


def apply_upload_limit(app):
    @app.before_request
    def enforce_upload_limit():
        max_size = endpoint_limits.get(request.path, DEFAULT_MAX_SIZE)

        content_length = request.content_length
        if content_length is not None and content_length > max_size:
            return jsonify({"error": "Request Entity Too Large", "details": f"File size exceeds the limit of {max_size // (1024 * 1024)} MB."}), 413


def configure_hypercorn_limits(config: Config):
    max_limit = max(endpoint_limits.values(), default=DEFAULT_MAX_SIZE)
    config.wsgi_max_body_size = max_limit
