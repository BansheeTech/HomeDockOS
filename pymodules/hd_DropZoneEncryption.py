"""
hd_DropZoneEncryption.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import base64

from flask_login import current_user

from pymodules.hd_FunctionsGlobals import current_directory, dropzone_folder

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes, padding as sym_padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


MASTER_KEY_FILE = os.path.join(current_directory, "homedock_dropzone.conf")
AES_KEY_SIZE = 32
AES_GCM_NONCE_BYTES = 12

# v3c
V3_KEY_PREFIX = "dzkey_v3"
V3_HKDF_SALT_BYTES = 32

# v2c
V2_KEY_PREFIX = "dzkey_v2"
V2_PBKDF2_SALT_BYTES = 32
V2_PBKDF2_ITERATIONS = 1200000


# dzkey_v3 (HKDF)
def _get_or_create_user_key_v3(username: str) -> tuple[bytes, bytes]:
    username_lower = username.lower()
    os.makedirs(os.path.dirname(MASTER_KEY_FILE), exist_ok=True)
    if os.path.exists(MASTER_KEY_FILE):
        with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
            for line in key_file:
                if line.startswith(f"{V3_KEY_PREFIX}:{username_lower}:"):
                    parts = line.strip().split(":")
                    if len(parts) == 4:
                        return base64.b64decode(parts[3]), base64.b64decode(parts[2])
    new_key = os.urandom(AES_KEY_SIZE)
    new_salt = os.urandom(V3_HKDF_SALT_BYTES)
    with open(MASTER_KEY_FILE, "a", encoding="utf-8") as key_file:
        key_b64 = base64.b64encode(new_key).decode("utf-8")
        salt_b64 = base64.b64encode(new_salt).decode("utf-8")
        key_file.write(f"{V3_KEY_PREFIX}:{username_lower}:{salt_b64}:{key_b64}\n")
    return new_key, new_salt


def _derive_key_v3(username: str) -> bytes:
    base_key, salt = _get_or_create_user_key_v3(username)
    hkdf = HKDF(algorithm=hashes.SHA256(), length=AES_KEY_SIZE, salt=salt, info=b"dropzone/file-encryption/v3/" + username.lower().encode("utf-8"))
    return hkdf.derive(base_key)


def _encrypt_v3(username: str, data: bytes) -> bytes:
    key = _derive_key_v3(username)
    aesgcm = AESGCM(key)
    nonce = os.urandom(AES_GCM_NONCE_BYTES)
    associated_data = username.lower().encode("utf-8")
    return nonce + aesgcm.encrypt(nonce, data, associated_data)


def _decrypt_v3(username: str, full_content: bytes) -> bytes:
    key = _derive_key_v3(username)
    nonce = full_content[:AES_GCM_NONCE_BYTES]
    encrypted_data = full_content[AES_GCM_NONCE_BYTES:]
    aesgcm = AESGCM(key)
    associated_data = username.lower().encode("utf-8")
    return aesgcm.decrypt(nonce, encrypted_data, associated_data)


# dzkey_v2 (PBKDF2)
def _load_user_key_v2(username: str) -> tuple[bytes, bytes]:
    username_lower = username.lower()
    if not os.path.exists(MASTER_KEY_FILE):
        raise FileNotFoundError("V2: DropZone Keys file not found.")
    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith(f"{V2_KEY_PREFIX}:{username_lower}:"):
                parts = line.strip().split(":")
                if len(parts) == 4:
                    return base64.b64decode(parts[3]), base64.b64decode(parts[2])
    raise ValueError(f"V2: Key for user {username} not found.")


def _decrypt_v2(username: str, full_content: bytes) -> bytes:
    base_key, salt = _load_user_key_v2(username)
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=AES_KEY_SIZE, salt=username.lower().encode("utf-8") + salt, iterations=V2_PBKDF2_ITERATIONS, backend=default_backend())
    key = kdf.derive(base_key)
    nonce = full_content[:AES_GCM_NONCE_BYTES]
    encrypted_data = full_content[AES_GCM_NONCE_BYTES:]
    aesgcm = AESGCM(key)
    associated_data = username.lower().encode("utf-8")
    return aesgcm.decrypt(nonce, encrypted_data, associated_data)


# dzkey_v1 (CBC)
def _derive_user_key_v1(raw_key: bytes, username: str) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=username.lower().encode("utf-8"), iterations=100000, backend=default_backend())
    return kdf.derive(raw_key)


def _load_master_key_v1(username: str) -> bytes:
    username_lower = username.lower()
    if not os.path.exists(MASTER_KEY_FILE):
        raise FileNotFoundError("V1: DropZone Keys file not found.")

    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith(f"dz_key:{username_lower}:"):
                key_base64 = line.split(":", 2)[2].strip()
                return _derive_user_key_v1(base64.b64decode(key_base64), username)

    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith("dz_key: ") and ":" not in line.split(":", 1)[1]:
                key_base64 = line.split(":", 1)[1].strip()
                return _derive_user_key_v1(base64.b64decode(key_base64), username)

    raise ValueError(f"V1: Key for user {username} not found.")


def _decrypt_v1(username: str, encrypted_data_with_iv: bytes) -> bytes:
    key = _load_master_key_v1(username)
    iv = encrypted_data_with_iv[:16]
    encrypted_data = encrypted_data_with_iv[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
    unpadder = sym_padding.PKCS7(algorithms.AES.block_size).unpadder()
    return unpadder.update(padded_data) + unpadder.finalize()


def save_user_file(username: str, filename: str, data: bytes):
    encrypted_content = _encrypt_v3(username, data)
    encrypted_file_path = os.path.join(dropzone_folder, username, filename)
    os.makedirs(os.path.dirname(encrypted_file_path), exist_ok=True)
    temp_path = encrypted_file_path + ".tmp"
    with open(temp_path, "wb") as f:
        f.write(encrypted_content)
    os.replace(temp_path, encrypted_file_path)


def load_user_file(username: str, filename: str) -> bytes:
    encrypted_file_path = os.path.join(dropzone_folder, username, filename)
    if not os.path.exists(encrypted_file_path):
        raise FileNotFoundError(f"File not found: {encrypted_file_path}")
    with open(encrypted_file_path, "rb") as f:
        full_content = f.read()
    try:
        return _decrypt_v3(username, full_content)
    except Exception:
        try:
            decrypted_data = _decrypt_v2(username, full_content)
            save_user_file(username, filename, decrypted_data)
            return decrypted_data
        except Exception:
            try:
                decrypted_data = _decrypt_v1(username, full_content)
                save_user_file(username, filename, decrypted_data)
                return decrypted_data
            except Exception as v1_error:
                raise IOError(f"The file '{filename}' is either corrupted or the key is incorrect. Decryption failed. Final error: {v1_error}")


def dropzone_init():
    if not hasattr(current_user, "id") or not current_user.is_authenticated:
        return
    _get_or_create_user_key_v3(current_user.id)
