"""
hd_UIOnboarding.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import bcrypt
import configparser

from flask import render_template, request, session, g, jsonify, redirect, url_for

from pymodules.hd_FunctionsConfig import read_config, write_config, is_fresh_install, ALLOWED_LANGUAGES, ALLOWED_CLOCK_FORMATS, ALLOWED_WEEK_STARTS, ALLOWED_APPEARANCES
from pymodules.hd_FunctionsGlobals import version_hash, current_directory
from pymodules.hd_FunctionsHandleCSRFToken import generate_csrf_token, regenerate_csrf_token
from pymodules.hd_CryptoServer import decrypt_json_from_client
from pymodules.hd_ConfigEventManager import notify_config_changed
from pymodules.hd_OnboardingWindow import is_window_open, remaining_seconds, window_minutes


def onboarding_page():
    if not is_fresh_install():
        return redirect(url_for("login_page"))

    window_open = is_window_open()

    aux_config = read_config()
    selected_theme = aux_config["selected_theme"]
    selected_back = aux_config["selected_back"]
    selected_appearance = aux_config["selected_appearance"]
    selected_language = aux_config["selected_language"]

    if "homedock_csrf_token" not in session:
        session["homedock_csrf_token"] = generate_csrf_token()

    return render_template(
        "onboarding.html",
        version_hash=version_hash,
        homedock_csrf_token=session["homedock_csrf_token"],
        selected_theme=selected_theme,
        selected_back=selected_back,
        selected_appearance=selected_appearance,
        selected_language=selected_language,
        window_open=window_open,
        window_remaining=remaining_seconds(),
        nonce=g.get("nonce", ""),
    )


def api_onboarding_setup():
    if not is_fresh_install():
        return jsonify({"error": "onboarding_unavailable", "redirect_url": "/"}), 409

    if not is_window_open():
        print(f" * Onboarding rejected from {request.remote_addr}: setup window closed ({window_minutes()} min), restart HomeDock OS to reopen it.")
        return jsonify({"error": "onboarding_window_expired"}), 403

    try:
        encrypted_data = request.json.get("encrypted_data") if request.is_json else None
        if not encrypted_data:
            return jsonify({"error": "missing_payload"}), 400

        try:
            payload = decrypt_json_from_client(encrypted_data)
        except ValueError:
            return jsonify({"error": "decryption_failed"}), 400

        raw_username = payload.get("user_name", "") if isinstance(payload, dict) else ""
        raw_password = payload.get("user_password", "") if isinstance(payload, dict) else ""

        sanitized_username = re.sub(r"[^a-zA-Z0-9]", "", raw_username or "")

        if len(sanitized_username) < 1:
            return jsonify({"error": "username_empty"}), 400
        if len(sanitized_username) > 30:
            return jsonify({"error": "username_too_long"}), 400
        if sanitized_username.lower() == "user":
            return jsonify({"error": "username_is_default"}), 400

        if not isinstance(raw_password, str):
            return jsonify({"error": "password_invalid"}), 400
        if len(raw_password) < 6 or len(raw_password) > 30:
            return jsonify({"error": "password_length"}), 400
        if len(raw_password.encode("utf-8")) > 72:
            return jsonify({"error": "password_length"}), 400
        if raw_password == "passwd":
            return jsonify({"error": "password_is_default"}), 400

        selected_language = payload.get("selected_language") if isinstance(payload, dict) else None
        if not isinstance(selected_language, str) or selected_language not in ALLOWED_LANGUAGES:
            selected_language = "en"

        selected_theme = payload.get("selected_theme") if isinstance(payload, dict) else None
        if selected_theme not in ("default", "noir", "aeroplus"):
            selected_theme = "default"

        selected_back = payload.get("selected_back") if isinstance(payload, dict) else None
        if selected_back not in ("back1.jpg", "back2.jpg", "back3.jpg", "back4.jpg", "back5.jpg", "back6.jpg", "back7.jpg", "back8.jpg", "back9.jpg"):
            selected_back = "back1.jpg"

        selected_appearance = payload.get("selected_appearance") if isinstance(payload, dict) else None
        if selected_appearance not in ALLOWED_APPEARANCES:
            selected_appearance = "redmond"

        clock_format = payload.get("clock_format") if isinstance(payload, dict) else None
        if not isinstance(clock_format, str) or clock_format not in ALLOWED_CLOCK_FORMATS:
            clock_format = "24h"

        week_start = payload.get("week_start") if isinstance(payload, dict) else None
        if not isinstance(week_start, str) or week_start not in ALLOWED_WEEK_STARTS:
            week_start = "monday"

        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(raw_password.encode("utf-8"), salt).decode("utf-8")

        if not is_fresh_install():
            return jsonify({"error": "onboarding_unavailable", "redirect_url": "/"}), 409

        if not is_window_open():
            return jsonify({"error": "onboarding_window_expired"}), 403

        config_path = os.path.join(current_directory, "homedock_server.conf")
        config = configparser.ConfigParser()
        config.read(config_path)
        config.set("Config", "user_name", sanitized_username)
        config.set("Config", "user_password", hashed_password)
        config.set("Config", "selected_language", selected_language)
        config.set("Config", "selected_theme", selected_theme)
        config.set("Config", "selected_back", selected_back)
        config.set("Config", "selected_appearance", selected_appearance)
        config.set("Config", "clock_format", clock_format)
        config.set("Config", "week_start", week_start)
        write_config(config, config_path)

        new_config_dict = read_config()
        notify_config_changed(new_config_dict)

        regenerate_csrf_token()

        return jsonify({"status": "success", "redirect_url": "/"}), 200

    except Exception as e:
        print(f"Error in api_onboarding_setup: {e}")
        return jsonify({"error": "unexpected_error"}), 500
