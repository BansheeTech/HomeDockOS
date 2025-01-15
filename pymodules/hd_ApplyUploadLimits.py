"""
hd_ApplyUploadLimits.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

from flask import request, jsonify
from typing import Optional, Type

DEFAULT_MAX_SIZE = 1 * 1024 * 1024  # 1MB

endpoint_limits = {
    "/login": 64 * 1024,  # 64KB
    "/api/pcrypt": 64 * 1024,  # 64KB
    "/api/upload_file": 1 * 1024 * 1024 * 1024,  # 1GB
}


def FlaskDevUploadLimitMiddleware(app):
    @app.before_request
    def enforce_upload_limit():
        max_size = endpoint_limits.get(request.path, DEFAULT_MAX_SIZE)

        content_length = request.content_length
        if content_length is not None and content_length > max_size:
            return jsonify({"error": "Request Entity Too Large", "details": f"File size exceeds the limit of {max_size // (1024 * 1024)} MB."}), 413


class ContentSizeExceeded(Exception):
    pass


class ContentSizeLimitMiddleware:
    def __init__(
        self,
        app,
        endpoint_limits: Optional[dict] = endpoint_limits,
        default_max_size: Optional[int] = DEFAULT_MAX_SIZE,
        exception_cls: Optional[Type[Exception]] = None,
    ):
        self.app = app
        self.endpoint_limits = endpoint_limits or {}
        self.default_max_size = default_max_size or DEFAULT_MAX_SIZE
        self.exception_cls = exception_cls or ContentSizeExceeded

    def normalize_path(self, path: str) -> str:
        return path.rstrip("/")

    def get_limit_for_path(self, path: str) -> int:
        normalized_path = self.normalize_path(path)
        return self.endpoint_limits.get(normalized_path, self.default_max_size)

    def receive_wrapper(self, receive, max_size):
        received = 0

        async def inner():
            try:
                nonlocal received
                message = await receive()

                if message["type"] == "http.request":
                    body = message.get("body", b"")
                    body_len = len(body)
                    received += body_len

                    if received > max_size:
                        raise self.exception_cls(f"Request size exceeded the limit of {max_size} bytes (received: {received} bytes)")

                return message
            except Exception as e:
                print(f"[ERROR] Exception in receive_wrapper: {str(e)}")
                raise

        return inner

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = self.normalize_path(scope.get("path", ""))
        max_size = self.get_limit_for_path(path)

        if max_size is None or max_size == float("inf"):
            await self.app(scope, receive, send)
            return

        try:
            wrapper = self.receive_wrapper(receive, max_size)
            await self.app(scope, wrapper, send)
        except self.exception_cls as e:
            await send(
                {
                    "type": "http.response.start",
                    "status": 413,
                    "headers": [(b"content-type", b"application/json")],
                }
            )
            await send(
                {
                    "type": "http.response.body",
                    "body": f'{{"error": "Request Entity Too Large", "details": "{str(e)}"}}'.encode("utf-8"),
                }
            )
