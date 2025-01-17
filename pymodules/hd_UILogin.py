"""
hd_UILogin.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import bcrypt
import base64

from datetime import datetime, timedelta
from collections import defaultdict

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend

from flask import render_template, request, session, g, jsonify, redirect, url_for
from flask_login import UserMixin, login_user, current_user, LoginManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from pymodules.hd_HDOSWebServerInit import homedock_www
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsMain import sanitize_input
from pymodules.hd_FunctionsGlobals import version_hash, current_directory, is_updating
from pymodules.hd_FunctionsHandleCSRFToken import generate_csrf_token, regenerate_csrf_token
from pymodules.hd_FunctionsEnhancedEncryption import get_private_key
from pymodules.hd_DropZoneEncryption import dropzone_init

login_manager = LoginManager()
login_manager.init_app(homedock_www)
login_manager.login_view = "login"
login_attempts_log = os.path.join(current_directory, "logs", "loginattempts.log")

limiter = Limiter(app=homedock_www, key_func=get_remote_address, storage_uri="memory://")

limited_ips_added_to_shield = []
shield_mode_active = False
shield_mode_timestamp = None
shield_mode_count = 0

failed_attempts = defaultdict(list)


class User(UserMixin):
    def __init__(self, user_id):
        self.id = user_id


@login_manager.unauthorized_handler
def unauthorized():
    return redirect(url_for("login_page"))


@login_manager.user_loader
def load_user(user_id):
    config = read_config()
    user_name = config["user_name"].lower()
    if user_id == user_name:
        return User(user_id)
    return None


def is_local_subnetwork_ip(ip, successful_ips):
    if ip.startswith("192.168."):
        return True
    if successful_ips is None:
        return False
    return ip in successful_ips


def login_pwd_encrypt():
    from pymodules.hd_PublicKeySender import temporary_storage

    token = request.json.get("token")
    encrypted_password = request.json.get("password")

    if not token or token not in temporary_storage:
        return jsonify({"status": "error", "message": "Invalid or not found login token, please try again."}), 400

    temporary_storage[token]["password"] = encrypted_password

    return jsonify({"status": "success", "message": "Password encrypted successfully."})


def count_limited_ips_within_timeframe(timeframe_minutes):
    return len(set(ip for ip, ts in limited_ips_added_to_shield if datetime.now() - ts < timedelta(minutes=timeframe_minutes)))


def get_successful_ips(log_path):
    successful_ips = set()
    if os.path.exists(log_path):
        with open(log_path, "r") as f:
            lines = f.readlines()
            for line in lines:
                parts = line.strip().split("***")
                if len(parts) >= 3 and parts[1] == "Success":
                    successful_ips.add(parts[2])
    return successful_ips


def handle_shield_mode():
    global shield_mode_active, shield_mode_timestamp, shield_mode_count

    login_log_path = login_attempts_log
    successful_ips = get_successful_ips(login_log_path)

    ip_address = get_remote_address()

    if shield_mode_active and not is_local_subnetwork_ip(ip_address, successful_ips):
        shield_mode_time = 60 * shield_mode_count
        session["shield_mode_time"] = shield_mode_time

        if datetime.now() - shield_mode_timestamp > timedelta(minutes=shield_mode_time):
            shield_mode_active = False
        else:
            return jsonify({"status": "shield_mode", "message": "Shield Mode active, please try again later.", "shield_mode_time": shield_mode_time, "redirect_url": "/shieldmode"}), 429
    return None


def log_attempt(ip_address, status, username):
    TOTAL_VALUES_TO_KEEP = 576
    try:
        with open(login_attempts_log, "r") as log_file:
            existing_entries = log_file.readlines()
    except FileNotFoundError:
        existing_entries = []

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    escapecontroluser = username.replace("***", "+++")
    log_entry = f"{timestamp}***{status}***{ip_address}***{escapecontroluser}\n"
    existing_entries.append(log_entry)
    entries_to_keep = existing_entries[-TOTAL_VALUES_TO_KEEP:]

    with open(login_attempts_log, "w") as log_file:
        log_file.writelines(entries_to_keep)


def login_page():
    ip_address = get_remote_address()
    aux_config = read_config()
    selected_theme = aux_config["selected_theme"]
    selected_back = aux_config["selected_back"]

    shield_response = handle_shield_mode()
    if shield_response:
        return redirect(url_for("shieldmode"))

    failed_attempts_within_hour = [attempt for attempt in failed_attempts[ip_address] if attempt > datetime.now() - timedelta(hours=1)]
    remaining_attempts = 3 - len(failed_attempts_within_hour)
    if remaining_attempts <= 0:
        return redirect(url_for("limited"))

    if current_user.is_authenticated:
        return redirect(url_for("dashboard"))

    if "homedock_csrf_token" not in session:
        session["homedock_csrf_token"] = generate_csrf_token()

    return render_template("login.html", version_hash=version_hash, homedock_csrf_token=session["homedock_csrf_token"], attempts=remaining_attempts, selected_theme=selected_theme, selected_back=selected_back, nonce=g.get("nonce", ""))


def api_login():
    global limited_ips_added_to_shield
    global shield_mode_active
    global shield_mode_timestamp
    global shield_mode_count

    ip_address = get_remote_address()

    failed_attempts_within_hour = [attempt for attempt in failed_attempts[ip_address] if attempt > datetime.now() - timedelta(hours=1)]
    remaining_attempts = 3 - len(failed_attempts_within_hour)

    if current_user.is_authenticated:
        return jsonify({"status": "already_authenticated", "message": "User is already authenticated.", "redirect_url": "/dashboard"}), 200

    data = request.get_json()
    if not data:
        return jsonify({"status": "bad_request", "message": "Invalid JSON Request..."}), 400

    client_token = data.get("homedock_csrf_token")
    server_token = session.get("homedock_csrf_token")
    if client_token != server_token:
        return jsonify({"status": "forbidden", "message": "CSRF Token mismatch! Please try again later."}), 403

    from pymodules.hd_PublicKeySender import temporary_storage

    client_unique_token = data.get("token")

    if not client_unique_token or client_unique_token not in temporary_storage:
        return jsonify({"status": "forbidden", "message": "Invalid or not found login token, please try again."}), 403

    token_data = temporary_storage.get(client_unique_token)

    token_creation_time = token_data.get("timestamp")
    if not token_creation_time or (datetime.now() - token_creation_time) > timedelta(seconds=10):
        temporary_storage.pop(client_unique_token, None)
        return jsonify({"status": "forbidden", "message": "Login token is expired, please try again."}), 403

    token_data = temporary_storage.pop(client_unique_token, None)

    if not token_data or "password" not in token_data:
        return jsonify({"status": "bad_request", "message": "There's no password available."}), 400

    encrypted_password_base64 = token_data["password"]

    try:
        encrypted_password = base64.b64decode(encrypted_password_base64)
        private_key_serialized = get_private_key()
        private_key = serialization.load_pem_private_key(private_key_serialized, password=None, backend=default_backend())

        decrypted_password_bytes = private_key.decrypt(encrypted_password, padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
        decrypted_password = decrypted_password_bytes.decode("utf-8")

    except UnicodeDecodeError:
        return jsonify({"status": "bad_request", "message": "Error decoding non-plain password."}), 400

    except Exception:
        return jsonify({"status": "bad_request", "message": "Password encryption failed, please contact support."}), 400

    given_username = data.get("username", "").lower()
    given_password = decrypted_password

    if len(given_password) > 30 or len(given_username) > 30:
        return jsonify({"status": "bad_request", "message": "Username or password exceeds lenght limit."}), 400

    if is_updating:
        return jsonify({"error": "Update in progress, please wait..."}), 503

    sanitized_username = sanitize_input(given_username)
    sanitized_username = sanitized_username if sanitized_username != "" else "-empty-"

    config = read_config()
    user_name = config["user_name"].lower()
    hashed_password_from_config = config["user_password"]

    if sanitized_username.lower() == user_name.lower() and bcrypt.checkpw(given_password.encode("utf-8"), hashed_password_from_config):
        failed_attempts[ip_address] = []
        remaining_attempts = 3

        user = User(sanitized_username)
        login_user(user)
        log_attempt(ip_address, "Success", "Hidden")

        regenerate_csrf_token()
        session.permanent = True

        dropzone_init()

        return jsonify({"status": "success", "message": "Login successful, welcome to HomeDock OS.", "redirect_url": "/dashboard"}), 200

    else:
        failed_attempts[ip_address].append(datetime.now())
        failed_attempts[ip_address] = [attempt for attempt in failed_attempts[ip_address] if attempt > datetime.now() - timedelta(hours=1)]
        remaining_attempts = 3 - len(failed_attempts[ip_address])

        log_attempt(ip_address, "Failed", sanitized_username)
        if remaining_attempts <= 0:
            log_attempt(ip_address, "Limited", sanitized_username)
            limited_ips_added_to_shield.append((ip_address, datetime.now()))

            c1_regular = count_limited_ips_within_timeframe(1) >= 3
            c2_umadbro = count_limited_ips_within_timeframe(60) >= 7
            c3_uahax0r = count_limited_ips_within_timeframe(1440) >= 24

            if c1_regular or c2_umadbro or c3_uahax0r:
                shield_mode_active = True
                shield_mode_timestamp = datetime.now()

                if c1_regular:
                    shield_mode_count += 1
                    log_attempt("Shield Mode (L1)", "Warning", "1h-Lock")
                elif c2_umadbro:
                    shield_mode_count += 3
                    log_attempt("Shield Mode (L2)", "Warning", "3h-Lock")
                elif c3_uahax0r:
                    shield_mode_count += 12
                    log_attempt("Shield Mode (L3)", "Warning", "12h-Lock")

            limited_ips_added_to_shield = [(ip, ts) for ip, ts in limited_ips_added_to_shield if datetime.now() - ts < timedelta(days=1)]

            shield_response = handle_shield_mode()
            if shield_response:
                return shield_response

            return jsonify({"status": "limited", "message": "You've been limited, please try again later.", "redirect_url": "/limited"}), 429

        return jsonify({"status": "failed", "message": f"Incorrect credentials, remaining attempts: {remaining_attempts}.", "remaining_attempts": remaining_attempts}), 401
