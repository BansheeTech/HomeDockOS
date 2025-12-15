"""
hd_UIHomeDockSettings.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import bcrypt
import configparser

from flask import jsonify, session, request
from flask_login import login_required
from urllib.parse import urlparse

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsHandleCSRFToken import regenerate_csrf_token
from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_CryptoServer import decrypt_json_from_client
from pymodules.hd_ConfigEventManager import notify_config_changed
from pymodules.hd_ExternalDriveManager import is_valid_external_drive


@login_required
def api_save_settings():
    try:
        encrypted_data = request.json.get("encrypted_data")
        if not encrypted_data:
            return jsonify({"error": "No encrypted data provided."}), 400

        try:
            decrypted_data = decrypt_json_from_client(encrypted_data)
        except ValueError as e:
            return jsonify({"error": "Failed to decrypt data."}), 400

        user_data = decrypted_data.get("user", {})
        system_data = decrypted_data.get("system", {})
        storage_data = decrypted_data.get("storage", {})
        theme_data = decrypted_data.get("theme", {})

        raw_username = user_data.get("username", "user")
        sanitized_username = re.sub(r"[^a-zA-Z0-9]", "", raw_username)

        if len(sanitized_username) < 1:
            return jsonify({"error": "Username cannot be empty."}), 400

        if len(sanitized_username) > 30:
            return jsonify({"error": "Username cannot exceed 30 characters."}), 400
        user_name = sanitized_username

        change_password_checkbox = user_data.get("changePassword", False)

        if change_password_checkbox:
            user_password = user_data.get("password", "passwd")

            if len(user_password) < 6 or len(user_password) > 30:
                return jsonify({"error": "Password must be between 6 and 30 characters."}), 400
            password_input = user_password.encode("utf-8")
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_input, salt).decode("utf-8")
        else:
            current_config = configparser.ConfigParser()
            current_config.read(os.path.join(current_directory, "homedock_server.conf"))
            hashed_password = current_config["Config"]["user_password"]

        try:
            run_port = int(system_data.get("runPort", 80))
            if run_port < 80 or run_port > 65535:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Selected port must be between 80 and 65535."}), 400

        raw_dynamic_dns = system_data.get("hostname", "get.homedock.cloud")

        if not raw_dynamic_dns.startswith(("http://", "https://")):
            raw_dynamic_dns = "http://" + raw_dynamic_dns
        parsed_url = urlparse(raw_dynamic_dns)
        domain = parsed_url.netloc.lstrip("www.")
        domain_regex = r"^(?!-)([a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$"
        if not re.match(domain_regex, domain):
            domain = "get.homedock.cloud"
        safe_domain = re.sub(r"[^a-zA-Z0-9.-]", "", domain)
        dynamic_dns = safe_domain

        allowed_themes = ["default", "noir", "aeroplus"]
        selected_theme = theme_data.get("selectedTheme", "default")
        if selected_theme not in allowed_themes:
            selected_theme = "default"

        selected_back = theme_data.get("selectedBack", "back1.jpg")
        allowed_wallpapers = ["back1.jpg", "back2.jpg", "back3.jpg", "back4.jpg", "back5.jpg", "back6.jpg"]

        if selected_back not in allowed_wallpapers and not selected_back.startswith("_back_custom"):
            selected_back = "back1.jpg"

        local_dns = "True" if bool(system_data.get("localDNS", False)) else "False"
        run_on_development = "True" if bool(system_data.get("developmentMode", False)) else "False"
        disable_usage_data = "True" if bool(system_data.get("disableUsageData", False)) else "False"
        delete_old_image_containers_after_update = "True" if bool(system_data.get("deleteOldImages", False)) else "False"
        delete_old_image_containers_after_uninstall = "True" if bool(system_data.get("deleteOldImagesUninstall", False)) else "False"
        delete_internal_data_volumes = "True" if bool(system_data.get("deleteVolumesUninstall", False)) else "False"

        default_external_drive = storage_data.get("externalDrive", "disabled")
        if not is_valid_external_drive(default_external_drive):
            default_external_drive = "disabled"

        existing_config = configparser.ConfigParser()
        existing_config.read(os.path.join(current_directory, "homedock_server.conf"))

        two_fa_enabled = existing_config.get("Config", "2fa_enabled", fallback="False")
        two_fa_secret = existing_config.get("Config", "2fa_secret", fallback="False")
        two_fa_backup_codes = existing_config.get("Config", "2fa_backup_codes", fallback="False")
        two_fa_whitelist_hashes = existing_config.get("Config", "2fa_whitelist_hashes", fallback="False")

        config = configparser.ConfigParser()
        config["Config"] = {
            "user_name": user_name,
            "user_password": hashed_password,
            "run_port": run_port,
            "dynamic_dns": dynamic_dns,
            "local_dns": local_dns,
            "run_on_development": run_on_development,
            "disable_usage_data": disable_usage_data,
            "delete_old_image_containers_after_update": delete_old_image_containers_after_update,
            "delete_old_image_containers_after_uninstall": delete_old_image_containers_after_uninstall,
            "delete_internal_data_volumes": delete_internal_data_volumes,
            "default_external_drive": default_external_drive,
            "selected_theme": selected_theme,
            "selected_back": selected_back,
            "2fa_enabled": two_fa_enabled,
            "2fa_secret": two_fa_secret,
            "2fa_backup_codes": two_fa_backup_codes,
            "2fa_whitelist_hashes": two_fa_whitelist_hashes,
        }
        with open(os.path.join(current_directory, "homedock_server.conf"), "w") as config_file:
            config.write(config_file)

        new_config_dict = read_config()
        notify_config_changed(new_config_dict)

        regenerate_csrf_token()
        new_csrf_token = session.get("homedock_csrf_token")

        return jsonify({"success": True, "message": "Settings saved successfully.", "csrf_token": new_csrf_token}), 200

    except Exception as e:
        print(f"Error in api_save_settings: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
