"""
hd_SessionSecurity.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import request, has_request_context
from flask.sessions import SecureCookieSessionInterface


# HDOS00058
class SchemeAwareSessionInterface(SecureCookieSessionInterface):

    def get_cookie_secure(self, app):
        if app.config.get("SESSION_COOKIE_SECURE"):
            return True

        return has_request_context() and request.is_secure
