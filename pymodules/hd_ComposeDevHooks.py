"""
hd_ComposeDevHooks.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import random
import string
import secrets

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_FunctionsGlobals import running_OS


def get_config_path():
    system = running_OS
    user_home = os.path.expanduser("~")

    if system == "Linux":
        return "/DATA/HomeDock/AppData"
    elif system == "Darwin":
        return f"{user_home}/HomeDock/AppData"
    elif system == "Windows":
        return "/mnt/c/HomeDock/AppData"
    else:
        raise OSError(f"Not supported underlying operative system: {system}")


def get_internal_storage_path():
    system = running_OS
    user_home = os.path.expanduser("~")

    if system == "Linux":
        return "/DATA/HomeDock/AppFolders"
    elif system == "Darwin":
        return f"{user_home}/HomeDock/AppFolders"
    elif system == "Windows":
        return "/mnt/c/HomeDock/AppFolders"
    else:
        raise OSError(f"Not supported underlying operative system: {system}")


def get_internal_storage_paths():
    return get_config_path(), get_internal_storage_path()


def generate_simple_password():
    words = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew", "iceberg", "jujube", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya", "quince", "raspberry", "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini"]
    numbers = random.sample(range(10, 99), 2)
    password = random.choice(words) + "_" + random.choice(words) + "_" + str(numbers[0]) + str(numbers[1])
    return password


def generate_secure_password(length=20):
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for i in range(length))
    return password


def generate_random_string(length=16):
    alphabet = string.ascii_letters + string.digits
    random_str = "".join(secrets.choice(alphabet) for i in range(length))
    return random_str


def process_devhooks(yml_str, generate_passwords=True):
    config = read_config()
    dynamic_dns = config["dynamic_dns"]
    user_name = config["user_name"].lower()

    if generate_passwords:
        password = generate_simple_password()
        sys_password = generate_secure_password()
        random_string = generate_random_string()
    else:
        password = "[[HD_PASSWORD]]"
        sys_password = "[[HD_SYSTEM_PASSWORD]]"
        random_string = "[[HD_RND_STR]]"

    yml_str = yml_str.replace("[[HD_LOCAL_IP]]", local_ip)
    yml_str = yml_str.replace("[[HD_INTERNET_IP]]", internet_ip)
    yml_str = yml_str.replace("[[HD_DYN_DNS]]", dynamic_dns)

    yml_str = yml_str.replace("[[HD_USER_NAME]]", user_name)

    if generate_passwords:
        yml_str = yml_str.replace("[[HD_PASSWORD]]", password)
        yml_str = yml_str.replace("[[HD_SYSTEM_PASSWORD]]", sys_password)
        yml_str = yml_str.replace("[[HD_RND_STR]]", random_string)

    yml_str = yml_str.replace("[[INSTALL_PATH]]", get_config_path())
    yml_str = yml_str.replace("[[APP_MOUNT_POINT]]", get_internal_storage_path())

    devhook_values = {"user_name": user_name, "password": password, "sys_password": sys_password, "random_string": random_string, "local_ip": local_ip, "internet_ip": internet_ip, "dynamic_dns": dynamic_dns, "install_path": get_config_path(), "app_mount_point": get_internal_storage_path()}

    return yml_str, devhook_values


def extract_devhook_placeholders(yml_str):
    placeholders = {"user_name": "[[HD_USER_NAME]]" in yml_str, "password": "[[HD_PASSWORD]]" in yml_str, "system_password": "[[HD_SYSTEM_PASSWORD]]" in yml_str, "random_string": "[[HD_RND_STR]]" in yml_str, "local_ip": "[[HD_LOCAL_IP]]" in yml_str, "internet_ip": "[[HD_INTERNET_IP]]" in yml_str, "dynamic_dns": "[[HD_DYN_DNS]]" in yml_str, "install_path": "[[INSTALL_PATH]]" in yml_str, "app_mount_point": "[[APP_MOUNT_POINT]]" in yml_str}

    return placeholders


def is_internal_volume_path(volume_path, container_name):
    app_data_path, app_folders_path = get_internal_storage_paths()
    volume_path = os.path.normpath(volume_path)

    app_data_container_path = os.path.normpath(os.path.join(app_data_path, container_name))

    if volume_path.startswith(app_data_container_path):
        return True

    app_folders_container_path = os.path.normpath(os.path.join(app_folders_path, container_name))

    if volume_path.startswith(app_folders_container_path):
        return True

    return False


def get_container_internal_volume_paths(container_name):
    app_data_path, app_folders_path = get_internal_storage_paths()

    return {"app_data": os.path.join(app_data_path, container_name), "app_folders": os.path.join(app_folders_path, container_name), "app_data_base": app_data_path, "app_folders_base": app_folders_path}


def validate_platform_paths():
    try:
        system = running_OS

        if system not in ["Linux", "Darwin", "Windows"]:
            return {"valid": False, "error": f"Unsupported operating system: {system}", "system": system}

        config_path = get_config_path()
        storage_path = get_internal_storage_path()

        return {"valid": True, "system": system, "config_path": config_path, "storage_path": storage_path, "paths_exist": {"config": os.path.exists(config_path), "storage": os.path.exists(storage_path)}}

    except Exception as e:
        return {"valid": False, "error": str(e), "system": running_OS}
