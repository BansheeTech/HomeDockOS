"""
hd_2FAInternalHandler.py
Copyright (c) 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import hmac
import time
import secrets
import hashlib
import configparser

from datetime import datetime, timedelta

import pyotp

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_CryptoServer import decrypt_from_client

SETUP_EXPIRATION_MINUTES = 5
TRUST_DURATION_DAYS = 30


def generate_trust_hash(ip, user_agent, totp_secret):
    combined = f"{ip}:{user_agent}:{totp_secret}"
    return hashlib.sha256(combined.encode()).hexdigest()


def is_device_trusted(ip, user_agent, config):
    totp_secret = config.get("2fa_secret")
    whitelist_str = config.get("2fa_whitelist_hashes", "")

    if not totp_secret or not whitelist_str:
        return False

    current_hash = generate_trust_hash(ip, user_agent, totp_secret)
    now = int(time.time())

    entries = [e.strip() for e in whitelist_str.split(",") if e.strip()]
    for entry in entries:
        if ":" in entry:
            stored_hash, expires_str = entry.split(":", 1)
            try:
                expires = int(expires_str)
                if stored_hash == current_hash and expires > now:
                    return True
            except ValueError:
                continue

    return False


def add_trusted_device(ip, user_agent, config):
    totp_secret = config.get("2fa_secret")
    if not totp_secret:
        return False

    current_hash = generate_trust_hash(ip, user_agent, totp_secret)
    expires = int(time.time()) + (TRUST_DURATION_DAYS * 24 * 60 * 60)
    new_entry = f"{current_hash}:{expires}"

    whitelist_str = config.get("2fa_whitelist_hashes", "")
    entries = [e.strip() for e in whitelist_str.split(",") if e.strip()]

    now = int(time.time())
    valid_entries = []
    for entry in entries:
        if ":" in entry:
            stored_hash, expires_str = entry.split(":", 1)
            try:
                exp = int(expires_str)
                if exp > now and stored_hash != current_hash:
                    valid_entries.append(entry)
            except ValueError:
                continue

    valid_entries.append(new_entry)

    config_file = os.path.join(current_directory, "homedock_server.conf")
    config_parser = configparser.ConfigParser()
    config_parser.read(config_file)
    config_parser.set("Config", "2fa_whitelist_hashes", ",".join(valid_entries))

    with open(config_file, "w") as f:
        config_parser.write(f)

    return True


def generate_backup_codes(count=10):
    return [f"HDS-{secrets.token_hex(4).upper()}" for _ in range(count)]


def verify_2fa_code(code, secret, backup_codes):
    code = code.replace(" ", "").upper()

    totp = pyotp.TOTP(secret)
    if len(code) == 6 and code.isdigit() and totp.verify(code, valid_window=1):
        return (True, False, None)

    if code != "" and backup_codes:
        for bc in backup_codes:
            if hmac.compare_digest(code, bc):
                new_backup_codes = [c for c in backup_codes if not hmac.compare_digest(c, code)]
                return (True, True, new_backup_codes)

    return (False, False, None)


@login_required
def api_2fa_status():
    config = read_config()
    return jsonify({"enabled": config.get("2fa_enabled", False)})


@login_required
def api_2fa_setup_init():
    config = read_config()

    if config.get("2fa_enabled"):
        return jsonify({"error": "2FA is already enabled."}), 400

    return jsonify({"status": "ready", "message": "Ready to setup 2FA"})


@login_required
def api_2fa_setup_verify():
    data = request.get_json()
    code = data.get("code", "").replace(" ", "")
    encrypted_secret = data.get("encrypted_secret", "")

    if not code or len(code) != 6:
        return jsonify({"error": "Invalid code format. Please enter 6 digits."}), 400

    if not encrypted_secret:
        return jsonify({"error": "Missing encrypted secret."}), 400

    config = read_config()

    if config.get("2fa_enabled"):
        return jsonify({"error": "2FA is already enabled."}), 400

    try:
        secret = decrypt_from_client(encrypted_secret, allow_hybrid=False)
    except ValueError as e:
        return jsonify({"error": "Failed to decrypt secret. Please try again."}), 400

    if not secret or len(secret) < 16:
        return jsonify({"error": "Invalid secret format."}), 400

    totp = pyotp.TOTP(secret)
    if not totp.verify(code, valid_window=1):
        return jsonify({"error": "Invalid code. Please try again."}), 400

    backup_codes = generate_backup_codes(10)
    backup_codes_str = ",".join(backup_codes)

    config_file = os.path.join(current_directory, "homedock_server.conf")
    config_parser = configparser.ConfigParser()
    config_parser.read(config_file)

    config_parser.set("Config", "2fa_enabled", "True")
    config_parser.set("Config", "2fa_secret", secret)
    config_parser.set("Config", "2fa_backup_codes", backup_codes_str)

    with open(config_file, "w") as f:
        config_parser.write(f)

    return jsonify({"success": True, "backup_codes": backup_codes, "message": "2FA has been enabled. Save your backup codes securely!"})


@login_required
def api_2fa_regenerate_backup_codes():
    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "Verification code required."}), 400

    config = read_config()

    if not config.get("2fa_enabled"):
        return jsonify({"error": "2FA is not enabled."}), 400

    secret = config.get("2fa_secret")
    backup_codes_str = config.get("2fa_backup_codes", "")
    backup_codes = backup_codes_str.split(",") if backup_codes_str else []

    is_valid, used_backup, new_backup_list = verify_2fa_code(code, secret, backup_codes)

    if not is_valid:
        return jsonify({"error": "Invalid verification code."}), 400

    new_backup_codes = generate_backup_codes(10)
    new_backup_codes_str = ",".join(new_backup_codes)

    config_file = os.path.join(current_directory, "homedock_server.conf")
    config_parser = configparser.ConfigParser()
    config_parser.read(config_file)

    config_parser.set("Config", "2fa_backup_codes", new_backup_codes_str)

    with open(config_file, "w") as f:
        config_parser.write(f)

    return jsonify({"success": True, "backup_codes": new_backup_codes, "message": "Backup codes have been regenerated."})


@login_required
def api_2fa_disable():
    data = request.get_json()
    code = data.get("code", "")

    if not code:
        return jsonify({"error": "Verification code required."}), 400

    config = read_config()

    if not config.get("2fa_enabled"):
        return jsonify({"error": "2FA is not enabled."}), 400

    secret = config.get("2fa_secret")
    backup_codes_str = config.get("2fa_backup_codes", "")
    backup_codes = backup_codes_str.split(",") if backup_codes_str else []

    is_valid, _, _ = verify_2fa_code(code, secret, backup_codes)

    if not is_valid:
        return jsonify({"error": "Invalid verification code."}), 400

    config_file = os.path.join(current_directory, "homedock_server.conf")
    config_parser = configparser.ConfigParser()
    config_parser.read(config_file)

    config_parser.set("Config", "2fa_enabled", "False")
    config_parser.set("Config", "2fa_secret", "False")
    config_parser.set("Config", "2fa_backup_codes", "False")
    config_parser.set("Config", "2fa_whitelist_hashes", "False")

    with open(config_file, "w") as f:
        config_parser.write(f)

    return jsonify({"success": True, "message": "2FA has been disabled."})
