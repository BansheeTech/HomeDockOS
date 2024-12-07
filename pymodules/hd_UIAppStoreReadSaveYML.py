"""
hd_UIAppStoreReadSaveYML.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

import os
import re
import yaml
import random
import string
import secrets
import platform

from flask_login import login_required
from flask import jsonify, request


from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip


@login_required
def get_appstore_info():

    containerName = request.args.get("containerName")

    if not is_valid_container_name(containerName):
        return jsonify({"success": False, "message": "Invalid container name"}), 400

    path_to_yml_files = os.path.join(current_directory, "app-store")

    yml_file_path = os.path.join(path_to_yml_files, f"{containerName}.yml")

    if not os.path.exists(yml_file_path):
        return jsonify({"success": False, "message": "Container not found"}), 404

    with open(yml_file_path, "r") as file:
        yml_str = file.read()

        user_placeholder_present = "[[HD_USER_NAME]]" in yml_str
        password_placeholder_present = "[[HD_PASSWORD]]" in yml_str

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

        return jsonify({"success": True, "data": {"ports": ports, "volumes": volumes, "ymlContent": yml_str, "dependencies": dependencies, "hd_group": hd_group, "hd_role": hd_role, "user_name": devhook_values["user_name"] if user_placeholder_present else None, "password": devhook_values["password"] if password_placeholder_present else None}})


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

        try:
            yml_str, _ = process_devhooks(yml_str)
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


def generate_simple_password():
    words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew", "iceberg", "jujube", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini"]
    numbers = random.sample(range(10, 99), 2)
    password = random.choice(words) + random.choice(words) + str(numbers[0]) + str(numbers[1])
    return password


def generate_secure_password(length=20):
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for i in range(length))
    return password


def is_valid_container_name(name):
    return re.match("^[a-zA-Z0-9-_]+$", name) is not None


def get_config_path():
    system = platform.system()
    user_home = os.path.expanduser("~")

    if system == "Linux":
        return "/DATA/HomeDock/AppData"
    elif system == "Darwin":
        return f"{user_home}/HomeDock/AppData"
    elif system == "Windows":
        return "//c/HomeDock/AppData"
    else:
        raise OSError(f"Not supported underlying operative system: {system}")


def get_internal_storage_path():
    system = platform.system()
    user_home = os.path.expanduser("~")

    if system == "Linux":
        return "/DATA/HomeDock/AppFolders"
    elif system == "Darwin":
        return f"{user_home}/HomeDock/AppFolders"
    elif system == "Windows":
        return "//c/HomeDock/AppFolders"
    else:
        raise OSError(f"Not supported underlying operative system: {system}")


def process_devhooks(yml_str):
    config = read_config()

    dynamic_dns = config["dynamic_dns"]

    user_name = config["user_name"].lower()
    password = generate_simple_password()
    sys_password = generate_secure_password()

    yml_str = yml_str.replace("[[HD_LOCAL_IP]]", local_ip)
    yml_str = yml_str.replace("[[HD_INTERNET_IP]]", internet_ip)
    yml_str = yml_str.replace("[[HD_DYN_DNS]]", dynamic_dns)

    yml_str = yml_str.replace("[[HD_USER_NAME]]", user_name)
    yml_str = yml_str.replace("[[HD_PASSWORD]]", password)
    yml_str = yml_str.replace("[[HD_SYSTEM_PASSWORD]]", sys_password)
    yml_str = yml_str.replace("[[INSTALL_PATH]]", get_config_path())
    yml_str = yml_str.replace("[[APP_MOUNT_POINT]]", get_internal_storage_path())

    return yml_str, {"user_name": user_name, "password": password, "sys_password": sys_password}
