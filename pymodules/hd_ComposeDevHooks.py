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
import hashlib

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_FunctionsGlobals import running_OS
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_FunctionsNativeSSL import get_ssl_cert_directory_for_containers


DEVHOOK_PLACEHOLDERS = {
    hashlib.sha256("[[HD_USER_NAME]]".encode()).hexdigest()[:16]: "[[HD_USER_NAME]]",
    hashlib.sha256("[[HD_PASSWORD]]".encode()).hexdigest()[:16]: "[[HD_PASSWORD]]",
    hashlib.sha256("[[HD_SYSTEM_PASSWORD]]".encode()).hexdigest()[:16]: "[[HD_SYSTEM_PASSWORD]]",
    hashlib.sha256("[[HD_RND_STR]]".encode()).hexdigest()[:16]: "[[HD_RND_STR]]",
    hashlib.sha256("[[HD_LOCAL_IP]]".encode()).hexdigest()[:16]: "[[HD_LOCAL_IP]]",
    hashlib.sha256("[[HD_INTERNET_IP]]".encode()).hexdigest()[:16]: "[[HD_INTERNET_IP]]",
    hashlib.sha256("[[HD_DYN_DNS]]".encode()).hexdigest()[:16]: "[[HD_DYN_DNS]]",
    hashlib.sha256("[[INSTALL_PATH]]".encode()).hexdigest()[:16]: "[[INSTALL_PATH]]",
    hashlib.sha256("[[APP_MOUNT_POINT]]".encode()).hexdigest()[:16]: "[[APP_MOUNT_POINT]]",
    hashlib.sha256("[[SSL_CERT_PATH]]".encode()).hexdigest()[:16]: "[[SSL_CERT_PATH]]",
}

DEVHOOK_USER_NAME_KEY = hashlib.sha256("[[HD_USER_NAME]]".encode()).hexdigest()[:16]
DEVHOOK_PASSWORD_KEY = hashlib.sha256("[[HD_PASSWORD]]".encode()).hexdigest()[:16]
DEVHOOK_SYSTEM_PASSWORD_KEY = hashlib.sha256("[[HD_SYSTEM_PASSWORD]]".encode()).hexdigest()[:16]
DEVHOOK_RANDOM_STRING_KEY = hashlib.sha256("[[HD_RND_STR]]".encode()).hexdigest()[:16]


def get_config_path():
    if is_docker:
        data_root = os.environ.get("DATA_ROOT")
        if data_root:
            return f"{data_root}/HomeDock/AppData"
        return "/DATA/HomeDock/AppData"

    system = running_OS

    if system == "Linux":
        return "/DATA/HomeDock/AppData"
    elif system == "Darwin":
        return f"{os.path.expanduser('~')}/HomeDock/AppData"
    elif system == "Windows":
        return "/mnt/c/HomeDock/AppData"
    else:
        raise OSError(f"Not supported underlying operative system: {system}")


def get_internal_storage_path():
    if is_docker:
        data_root = os.environ.get("DATA_ROOT")
        if data_root:
            return f"{data_root}/HomeDock/AppFolders"
        return "/DATA/HomeDock/AppFolders"

    system = running_OS

    if system == "Linux":
        return "/DATA/HomeDock/AppFolders"
    elif system == "Darwin":
        return f"{os.path.expanduser('~')}/HomeDock/AppFolders"
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
    yml_str = yml_str.replace("[[SSL_CERT_PATH]]", get_ssl_cert_directory_for_containers())

    devhook_values = {"user_name": user_name, "password": password, "sys_password": sys_password, "random_string": random_string, "local_ip": local_ip, "internet_ip": internet_ip, "dynamic_dns": dynamic_dns, "install_path": get_config_path(), "app_mount_point": get_internal_storage_path(), "ssl_cert_path": get_ssl_cert_directory_for_containers()}

    return yml_str, devhook_values


def extract_devhook_placeholders(yml_str):
    placeholders = {hash_key: placeholder in yml_str for hash_key, placeholder in DEVHOOK_PLACEHOLDERS.items()}

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
