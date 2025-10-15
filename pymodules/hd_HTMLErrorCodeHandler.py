"""
hd_HTMLErrorCodeHandler.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import g, render_template, jsonify, request


def setup_error_handlers(app, read_config, version_hash):
    error_codes = [
        400,
        401,
        403,
        404,
        405,
        406,
        408,
        409,
        410,
        411,
        412,
        413,
        414,
        415,
        416,
        417,
        418,
        422,
        423,
        429,
        500,
        501,
        502,
        503,
        504,
        505,
    ]

    def error_handler_decorator(handler):
        for code in error_codes:
            app.register_error_handler(code, handler)
        app.register_error_handler(Exception, handler)
        return handler

    @error_handler_decorator
    def generic_error_handler(error):
        error_code = getattr(error, "code", 500)
        error_message = getattr(error, "description", "An unknown error occurred, please contact our support team or check the documentation below.")
        details = str(error)
        exposed_details = "No additional details in production."
        documentation_url = f"https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-{error_code}"

        # HDOS-6XX
        custom_errors = {
            "Mounts denied": {
                "code": 601,
                "message": "Docker volume mounts are not properly configured, are you using macOS?",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-601",
            },
            "is not running": {
                "code": 602,
                "message": "The application is not running to be paused, make sure it's running first.",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-602",
            },
            "is not paused": {
                "code": 603,
                "message": "The application is not paused to be unpaused, make sure it's paused first.",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-603",
            },
            "port is already allocated": {
                "code": 604,
                "message": "The port used by this application is already allocated by another application, please change it.",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-604",
            },
            "Access to static Vue3": {
                "code": 605,
                "message": "Access to static Vue3 components is forbidden in production, if you want to check the source go to GitHub.",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-605",
            },
            "Invalid ports list": {
                "code": 606,
                "message": "Invalid ports list for the selected application.",
                "documentation_url": "https://docs.homedock.cloud/troubleshooting/error-codes/#hdos-606",
            },
        }

        for key, value in custom_errors.items():
            if key in details:
                error_code = value["code"]
                error_message = value["message"]
                documentation_url = value["documentation_url"]
                exposed_details = f"Error HDOS-{error_code}: {error_message}. " f"Please check HomeDock OS documentation at {documentation_url}."
                break

        if app.debug:
            exposed_details = details

        config = read_config()
        selected_theme = config["selected_theme"]
        selected_back = config["selected_back"]

        if request.is_json or request.accept_mimetypes["application/json"] >= request.accept_mimetypes["text/html"]:
            return (
                jsonify(
                    {
                        "error_code": error_code,
                        "error_message": error_message,
                        "details": exposed_details,
                        "documentation_url": documentation_url,
                    }
                ),
                error_code,
            )

        return (
            render_template(
                "errorcode.html",
                version_hash=version_hash,
                selected_theme=selected_theme,
                selected_back=selected_back,
                error_code=error_code,
                error_message=error_message,
                details=exposed_details,
                documentation_url=documentation_url,
                nonce=g.get("nonce", ""),
            ),
            error_code,
        )

    return generic_error_handler
