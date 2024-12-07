"""
hd_FunctionsHandleCSRFToken.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

import secrets
from functools import wraps
from html import escape
from flask import session, request, abort


def generate_csrf_token():
    if "homedock_csrf_token" not in session:
        session["homedock_csrf_token"] = secrets.token_hex(256)
    return session["homedock_csrf_token"]


def regenerate_csrf_token():
    session.pop("homedock_csrf_token", None)
    return generate_csrf_token()


def CSRF_Protect(f):
    @wraps(f)
    def wrapper(*args, **kwargs):

        if request.endpoint == "login" and request.method == "GET":
            return f(*args, **kwargs)

        if "homedock_csrf_token" not in session:
            session["homedock_csrf_token"] = generate_csrf_token()

        if request.method == "POST":
            client_token = request.form.get("homedock_csrf_token") or request.json.get("homedock_csrf_token") or request.headers.get("X-HomeDock-CSRF-Token")
            escaped_client_token = escape(client_token) if client_token else None
            if escaped_client_token is None or escaped_client_token != session.get("homedock_csrf_token"):
                abort(403, description="Missing or invalid CSRF Token, please reload your window. If the problem persists contact service support.")

        if request.method == "GET":
            client_token = request.headers.get("X-HomeDock-CSRF-Token")
            escaped_client_token = escape(client_token) if client_token else None
            if escaped_client_token is None or escaped_client_token != session.get("homedock_csrf_token"):
                abort(403, description="Missing or invalid CSRF Token, please reload your window. If the problem persists contact service support.")

        # print("Token en la sesión:", session.get("homedock_csrf_token"))
        # print("Token enviado por el cliente:", client_token)

        return f(*args, **kwargs)

    return wrapper
