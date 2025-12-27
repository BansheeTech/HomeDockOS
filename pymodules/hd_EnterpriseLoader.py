"""
hd_EnterpriseLoader.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import base64
import hashlib

from pymodules.hd_FunctionsGlobals import current_directory

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    from cryptography.exceptions import InvalidSignature

    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False

ENTERPRISE_PATH = os.path.join(current_directory, "__Enterprise__")
ENTERPRISE_PUBLIC_KEY = "oAr2gC4aEQkVVjYoys4bY/Jt+jLjXJkABkG2Lk1Nj88="
SIGNABLE_EXTENSIONS = {".py", ".js", ".css"}

_enterprise_loaded = False


def is_enterprise_loaded():
    return _enterprise_loaded


def _calculate_file_hash(filepath):
    sha256 = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            sha256.update(chunk)
    return sha256.hexdigest()


def _get_module_files_hashes(module_path):
    files = {}
    for filename in sorted(os.listdir(module_path)):
        filepath = os.path.join(module_path, filename)
        if not os.path.isfile(filepath):
            continue
        _, ext = os.path.splitext(filename)
        if ext.lower() in SIGNABLE_EXTENSIONS:
            files[filename] = _calculate_file_hash(filepath)
    return files


def _verify_module_signature(module_path, module_name):
    if not CRYPTO_AVAILABLE:
        return False

    manifest_path = os.path.join(module_path, "manifest.sig")
    if not os.path.exists(manifest_path):
        return False

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        required_fields = {"module", "version", "files", "signature"}
        if not all(field in manifest for field in required_fields):
            return False

        if manifest["module"] != module_name:
            return False

        current_files = _get_module_files_hashes(module_path)
        manifest_files = manifest["files"]

        for filename, expected_hash in manifest_files.items():
            current_hash = current_files.get(filename)
            if current_hash is None or current_hash != expected_hash:
                return False

        payload = {
            "module": manifest["module"],
            "version": manifest["version"],
            "files": manifest_files,
        }
        payload_bytes = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")

        public_key_bytes = base64.b64decode(ENTERPRISE_PUBLIC_KEY)
        public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)

        signature = base64.b64decode(manifest["signature"])
        public_key.verify(signature, payload_bytes)

        return True

    except (InvalidSignature, json.JSONDecodeError, Exception):
        return False


def _verify_enterprise_init():
    if not CRYPTO_AVAILABLE:
        return False

    manifest_path = os.path.join(ENTERPRISE_PATH, "manifest.sig")
    if not os.path.exists(manifest_path):
        print(" ! Enterprise __init__.py has no signature manifest")
        return False

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        required_fields = {"module", "version", "files", "signature"}
        if not all(field in manifest for field in required_fields):
            return False

        if manifest["module"] != "__Enterprise__":
            return False

        init_path = os.path.join(ENTERPRISE_PATH, "__init__.py")
        if not os.path.exists(init_path):
            return False

        current_hash = _calculate_file_hash(init_path)
        expected_hash = manifest["files"].get("__init__.py")

        if current_hash != expected_hash:
            print(" ! Enterprise __init__.py has been modified")
            return False

        payload = {
            "module": manifest["module"],
            "version": manifest["version"],
            "files": manifest["files"],
        }
        payload_bytes = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")

        public_key_bytes = base64.b64decode(ENTERPRISE_PUBLIC_KEY)
        public_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)

        signature = base64.b64decode(manifest["signature"])
        public_key.verify(signature, payload_bytes)

        return True

    except (InvalidSignature, json.JSONDecodeError, Exception):
        return False


def _verify_all_enterprise_modules():
    if not os.path.exists(ENTERPRISE_PATH):
        return False

    if not CRYPTO_AVAILABLE:
        print(" ! Cryptography library not available - cannot verify Enterprise signatures")
        return False

    if not _verify_enterprise_init():
        print(" ! Enterprise __init__.py signature verification failed")
        return False

    pycache_path = os.path.join(ENTERPRISE_PATH, "__pycache__")
    if os.path.isdir(pycache_path):
        for filename in os.listdir(pycache_path):
            if not filename.endswith(".pyc"):
                print(f" ! Suspicious file in __pycache__: {filename}")
                return False

    module_dirs = []
    for name in os.listdir(ENTERPRISE_PATH):
        if name in ("__pycache__", "manifest.sig"):
            continue
        module_path = os.path.join(ENTERPRISE_PATH, name)
        if os.path.isdir(module_path):
            module_dirs.append((name, module_path))

    if not module_dirs:
        print(" ! No Enterprise modules found to verify")
        return False

    for module_name, module_path in module_dirs:
        if not _verify_module_signature(module_path, module_name):
            print(f" ! Enterprise module '{module_name}' has invalid or missing signature")
            return False

    return True


def load_enterprise(app):
    global _enterprise_loaded

    if not os.path.exists(ENTERPRISE_PATH):
        return []

    if not _verify_all_enterprise_modules():
        print(" ! Enterprise integrity signature verification failed - NOT loading")
        return []

    try:
        from __Enterprise__ import load_enterprise_cogs

        loaded = load_enterprise_cogs(app, ENTERPRISE_PATH)
        if loaded:
            _enterprise_loaded = True
        return loaded
    except Exception as e:
        print(f" ! Enterprise loader error: {e}")
        return []


def print_enterprise_banner(enterprise_cogs):
    if not os.path.exists(ENTERPRISE_PATH):
        return

    if not _enterprise_loaded:
        return

    try:
        from __Enterprise__ import get_enterprise_uuid, get_license_info

        enterprise_uuid = get_enterprise_uuid()
        license_info = get_license_info()

        if enterprise_uuid:
            print(f" ~ \033[1;30mEnterprise UUID: {enterprise_uuid}\033[0m")

        if license_info["valid"]:
            print(f" » \033[1;32mLicense:\033[0m Valid ({license_info['client']})")
            if enterprise_cogs:
                enterprise_list = ", ".join([f"{m['name']} ({m['version']})" for m in enterprise_cogs])
                print(f" » \033[1;35mEnterprise:\033[0m {enterprise_list}")
        else:
            print(f" » \033[1;31mLicense:\033[0m Not registered")
    except ImportError:
        pass
