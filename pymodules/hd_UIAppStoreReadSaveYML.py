"""
hd_UIAppStoreReadSaveYML.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import yaml

from flask_login import login_required
from flask import jsonify, request

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsNativeSSL import ssl_enabled
from pymodules.hd_ComposeDevHooks import process_devhooks, extract_devhook_placeholders


@login_required
def get_appstore_info():
    containerName = request.args.get("containerName")

    if not is_valid_container_name(containerName):
        return jsonify({"success": False, "message": "Invalid container name"}), 400

    path_to_yml_files = os.path.join(current_directory, "app-store")

    use_ssl = ssl_enabled()

    if use_ssl and os.path.exists(os.path.join(path_to_yml_files, "ssl", f"{containerName}.yml")):
        yml_file_path = os.path.join(path_to_yml_files, "ssl", f"{containerName}.yml")
        use_ssl = True
    else:
        yml_file_path = os.path.join(path_to_yml_files, f"{containerName}.yml")
        use_ssl = False

    if not os.path.exists(yml_file_path):
        return jsonify({"success": False, "message": "Container not found"}), 404

    with open(yml_file_path, "r") as file:
        yml_str = file.read()

        placeholders = extract_devhook_placeholders(yml_str)
        user_placeholder_present = placeholders["user_name"]
        password_placeholder_present = placeholders["password"]
        random_string_placeholder_present = placeholders["random_string"]

        yml_str, devhook_values = process_devhooks(yml_str)

        try:
            yml_data = yaml.safe_load(yml_str)
        except yaml.YAMLError as e:
            print(f"Error parsing YAML: {str(e)}")
            return jsonify({"success": False, "message": "Invalid YML"}), 500

        is_group = any("HDGroup" in service_data.get("labels", {}) for service_data in yml_data.get("services", {}).values())

        main_service_name = None
        main_service_data = None
        hd_group = None
        hd_role = None

        dependencies = []
        if is_group:
            for service_name, service_data in yml_data.get("services", {}).items():
                if service_data.get("labels", {}).get("HDRole") == "main":
                    main_service_name = service_name
                    main_service_data = service_data
                    hd_group = service_data.get("labels", {}).get("HDGroup")
                    hd_role = service_data.get("labels", {}).get("HDRole")
                    break

            for service_name, service_data in yml_data.get("services", {}).items():
                if service_data.get("labels", {}).get("HDRole") == "dependency":
                    dependencies.append(service_name)

            if main_service_name is None or main_service_data is None:
                return jsonify({"success": False, "message": "Main container not found in group"}), 404
        else:
            main_service_name, main_service_data = next(iter(yml_data.get("services", {}).items()), (None, None))

        if main_service_name is None or main_service_data is None:
            return jsonify({"success": False, "message": "No service data found"}), 404

        ports = main_service_data.get("ports", [])
        volumes = main_service_data.get("volumes", [])

        yml_data_copy = yml_data.copy()
        yml_str = yaml.dump(yml_data_copy)

        yml_str, _ = process_devhooks(yml_str)

        return jsonify({"success": True, "data": {"ports": ports, "volumes": volumes, "ymlContent": yml_str, "dependencies": dependencies, "hd_group": hd_group, "hd_role": hd_role, "user_name": devhook_values["user_name"] if user_placeholder_present else None, "password": devhook_values["password"] if password_placeholder_present else None, "random_string": devhook_values["random_string"] if random_string_placeholder_present else None, "ssl_enabled": use_ssl}})


@login_required
def process_config():
    try:
        request_data = request.get_json()
        if not request_data:
            return jsonify({"success": False, "message": "Invalid JSON payload"}), 400
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to parse JSON: {str(e)}"}), 400

    containerName = request_data.get("containerName")
    if not is_valid_container_name(containerName):
        return jsonify({"success": False, "message": "Invalid container name"}), 400

    configType = request_data.get("configType")
    path_to_yml_files = os.path.join(current_directory, "app-store")

    use_ssl = ssl_enabled()

    if use_ssl and os.path.exists(os.path.join(path_to_yml_files, "ssl", f"{containerName}.yml")):
        original_yml_file_path = os.path.join(path_to_yml_files, "ssl", f"{containerName}.yml")
    else:
        original_yml_file_path = os.path.join(path_to_yml_files, f"{containerName}.yml")

    new_yml_file_path = os.path.join(path_to_yml_files, containerName, "docker-compose.yml")

    if not os.path.exists(original_yml_file_path):
        return jsonify({"success": False, "message": "Container not found"}), 404

    if configType == "advanced":
        ymlContent = request_data.get("ymlContent")
        if not ymlContent:
            return jsonify({"success": False, "message": "Missing YML content for advanced configuration"}), 400

        try:
            ymlContent_dict = yaml.safe_load(ymlContent)
        except yaml.YAMLError as e:
            return jsonify({"success": False, "message": f"Invalid YML content provided: {str(e)}"}), 400

        yml_str, _ = process_devhooks(yaml.dump(ymlContent_dict))
        os.makedirs(os.path.dirname(new_yml_file_path), exist_ok=True)
        with open(new_yml_file_path, "w") as file:
            file.write(yml_str)

        return jsonify({"success": True, "message": "YML updated successfully"})

    elif configType == "simple":
        volumes = request_data.get("volumes", [])
        ports = request_data.get("ports", [])
        restartPolicy = request_data.get("restartPolicy", "unless-stopped")
        user_name = request_data.get("userName", None)
        user_password = request_data.get("userPassword", None)
        user_random_string = request_data.get("userRandomString", None)

        if not os.path.exists(original_yml_file_path):
            return jsonify({"success": False, "message": "Original YML file not found"}), 404

        try:
            with open(original_yml_file_path, "r") as file:
                yml_str = file.read()
        except Exception as e:
            return jsonify({"success": False, "message": f"Error reading original YML: {str(e)}"}), 500

        if "[[HD_USER_NAME]]" in yml_str and user_name:
            yml_str = yml_str.replace("[[HD_USER_NAME]]", user_name)
        if "[[HD_PASSWORD]]" in yml_str and user_password:
            yml_str = yml_str.replace("[[HD_PASSWORD]]", user_password)
        if "[[HD_RND_STR]]" in yml_str and user_random_string:
            yml_str = yml_str.replace("[[HD_RND_STR]]", user_random_string)

        try:
            yml_str, _ = process_devhooks(yml_str, generate_passwords=True)
            yml_data = yaml.safe_load(yml_str)

        except yaml.YAMLError as e:
            print(f"YAML parsing error: {str(e)}")
            return jsonify({"success": False, "message": f"Error parsing YML: {str(e)}"}), 500

        first_service_name, first_service_data = next(iter(yml_data.get("services", {}).items()), (None, None))
        if not first_service_name:
            return jsonify({"success": False, "message": "No services found in the original YML"}), 500

        first_service_data["ports"] = ports
        first_service_data["volumes"] = volumes
        first_service_data["restart"] = restartPolicy

        yml_str, _ = process_devhooks(yaml.dump(yml_data))

        os.makedirs(os.path.dirname(new_yml_file_path), exist_ok=True)
        with open(new_yml_file_path, "w") as file:
            file.write(yml_str)

        return jsonify({"success": True, "message": "YML updated successfully with simple configuration"})

    else:
        return jsonify({"success": False, "message": "Invalid configuration type provided"}), 400


def is_valid_container_name(name):
    return re.match("^[a-zA-Z0-9-_]+$", name) is not None
