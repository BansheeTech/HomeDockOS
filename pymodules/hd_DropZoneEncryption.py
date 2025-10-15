"""
hd_DropZoneEncryption.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import base64

from flask_login import current_user

from pymodules.hd_FunctionsGlobals import current_directory

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, padding as sym_padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


MASTER_KEY_FILE = os.path.join(current_directory, "homedock_dropzone.conf")
NEW_KEY_PREFIX = "dzkey_v2"
PBKDF2_SALT_BYTES = 32
PBKDF2_ITERATIONS_NEW = 1200000
AES_KEY_SIZE = 32
AES_GCM_NONCE_BYTES = 12

_DERIVED_KEY_CACHE = {}


# Legacy dzkeys
def _derive_user_key_legacy(raw_key: bytes, username: str) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=username.lower().encode("utf-8"), iterations=100000, backend=default_backend())
    return kdf.derive(raw_key)


def _load_master_key_legacy(username: str) -> bytes:
    username_lower = username.lower()
    if not os.path.exists(MASTER_KEY_FILE):
        raise FileNotFoundError("Legacy: DropZone Keys file not found.")

    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith(f"dz_key:{username_lower}:"):
                key_base64 = line.split(":", 2)[2].strip()
                return _derive_user_key_legacy(base64.b64decode(key_base64), username)

    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith("dz_key: ") and ":" not in line.split(":", 1)[1]:
                key_base64 = line.split(":", 1)[1].strip()
                return _derive_user_key_legacy(base64.b64decode(key_base64), username)

    raise ValueError(f"Legacy: Key for user {username} not found.")


def _decrypt_user_file_legacy(username: str, encrypted_data_with_iv: bytes) -> bytes:
    key = _load_master_key_legacy(username)
    iv = encrypted_data_with_iv[:16]
    encrypted_data = encrypted_data_with_iv[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
    unpadder = sym_padding.PKCS7(algorithms.AES.block_size).unpadder()
    return unpadder.update(padded_data) + unpadder.finalize()


# dzkey_v2
def get_or_create_user_key_new(username: str) -> tuple[bytes, bytes]:
    username_lower = username.lower()
    os.makedirs(os.path.dirname(MASTER_KEY_FILE), exist_ok=True)
    if os.path.exists(MASTER_KEY_FILE):
        with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
            for line in key_file:
                if line.startswith(f"{NEW_KEY_PREFIX}:{username_lower}:"):
                    parts = line.strip().split(":")
                    if len(parts) == 4:
                        return base64.b64decode(parts[3]), base64.b64decode(parts[2])
    new_key_base = os.urandom(32)
    new_salt = os.urandom(PBKDF2_SALT_BYTES)
    with open(MASTER_KEY_FILE, "a", encoding="utf-8") as key_file:
        key_b64 = base64.b64encode(new_key_base).decode("utf-8")
        salt_b64 = base64.b64encode(new_salt).decode("utf-8")
        key_file.write(f"{NEW_KEY_PREFIX}:{username_lower}:{salt_b64}:{key_b64}\n")
    return new_key_base, new_salt


def get_derived_key_from_cache_or_compute(username: str) -> bytes:
    username_lower = username.lower()

    if username_lower in _DERIVED_KEY_CACHE:
        return _DERIVED_KEY_CACHE[username_lower]

    base_key, salt = get_or_create_user_key_new(username_lower)

    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=AES_KEY_SIZE, salt=username.lower().encode("utf-8") + salt, iterations=PBKDF2_ITERATIONS_NEW, backend=default_backend())
    derived_key = kdf.derive(base_key)

    _DERIVED_KEY_CACHE[username_lower] = derived_key

    if len(_DERIVED_KEY_CACHE) > 1000:
        _DERIVED_KEY_CACHE.clear()

    return derived_key


def encrypt_user_file_new(username: str, data: bytes) -> bytes:
    key = get_derived_key_from_cache_or_compute(username)
    aesgcm = AESGCM(key)
    nonce = os.urandom(AES_GCM_NONCE_BYTES)
    associated_data = username.lower().encode("utf-8")
    encrypted_data = aesgcm.encrypt(nonce, data, associated_data)
    return nonce + encrypted_data


def decrypt_user_file_new(username: str, full_content: bytes) -> bytes:
    key = get_derived_key_from_cache_or_compute(username)
    nonce = full_content[:AES_GCM_NONCE_BYTES]
    encrypted_data = full_content[AES_GCM_NONCE_BYTES:]
    aesgcm = AESGCM(key)
    associated_data = username.lower().encode("utf-8")
    return aesgcm.decrypt(nonce, encrypted_data, associated_data)


def save_user_file(username: str, filename: str, data: bytes):
    encrypted_content = encrypt_user_file_new(username, data)
    encrypted_file_path = os.path.join(current_directory, "dropzone", username, filename)
    os.makedirs(os.path.dirname(encrypted_file_path), exist_ok=True)
    with open(encrypted_file_path, "wb") as f:
        f.write(encrypted_content)


def load_user_file(username: str, filename: str) -> bytes:
    encrypted_file_path = os.path.join(current_directory, "dropzone", username, filename)
    if not os.path.exists(encrypted_file_path):
        raise FileNotFoundError(f"File not found: {encrypted_file_path}")
    with open(encrypted_file_path, "rb") as f:
        full_content = f.read()
    try:
        return decrypt_user_file_new(username, full_content)
    except Exception:
        try:
            decrypted_data = _decrypt_user_file_legacy(username, full_content)
            save_user_file(username, filename, decrypted_data)
            return decrypted_data
        except Exception as legacy_error:
            raise IOError(f"The file '{filename}' is either corrupted or the key is incorrect. Decryption failed. Final error: {legacy_error}")


def dropzone_init():
    if not hasattr(current_user, "id") or not current_user.is_authenticated:
        return
    get_or_create_user_key_new(current_user.id)
