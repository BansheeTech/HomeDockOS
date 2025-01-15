"""
hd_DropZoneEncryption.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import base64

from flask_login import current_user

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import current_directory

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as sym_padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

MASTER_KEY_FILE = os.path.join(current_directory, "homedock_dropzone.conf")


def generate_master_key():
    if not os.path.exists(MASTER_KEY_FILE):
        key = os.urandom(32)
        key_base64 = base64.b64encode(key).decode("utf-8")

        os.makedirs(os.path.dirname(MASTER_KEY_FILE), exist_ok=True)
        with open(MASTER_KEY_FILE, "w", encoding="utf-8") as key_file:
            key_file.write("!!!!! Do not delete or modify this file to prevent data corruption !!!!!\n")
            key_file.write(f"dz_key: {key_base64}\n")


def derive_user_key(raw_key: bytes, username: str) -> bytes:
    username = username.lower()
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=username.encode("utf-8"),
        iterations=100000,
        backend=default_backend(),
    )
    return kdf.derive(raw_key)


def load_master_key(username: str) -> bytes:
    username = username.lower()
    if not os.path.exists(MASTER_KEY_FILE):
        raise FileNotFoundError("DropZone Keys file not found.")

    with open(MASTER_KEY_FILE, "r", encoding="utf-8") as key_file:
        for line in key_file:
            if line.startswith(f"dz_key:{username}:"):

                key_base64 = line.split(":")[2].strip()
                key_base = base64.b64decode(key_base64)
                return derive_user_key(key_base, username)

    raise ValueError(f"Key for user {username} not found.")


def encrypt_user_file(username: str, data: bytes) -> tuple:
    username = username.lower()
    key = load_master_key(username)
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    padder = sym_padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(data) + padder.finalize()

    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    return encrypted_data, iv


def decrypt_user_file(username: str, encrypted_data: bytes, iv: bytes) -> bytes:
    username = username.lower()
    key = load_master_key(username)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()

    unpadder = sym_padding.PKCS7(algorithms.AES.block_size).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()
    return data


def save_user_file(username: str, filename: str, data: bytes):
    username = username.lower()
    encrypted_data, iv = encrypt_user_file(username, data)
    encrypted_file_path = os.path.join(current_directory, "dropzone", username, filename)

    os.makedirs(os.path.dirname(encrypted_file_path), exist_ok=True)
    with open(encrypted_file_path, "wb") as f:
        f.write(iv + encrypted_data)


def load_user_file(username: str, filename: str) -> bytes:
    username = username.lower()
    encrypted_file_path = os.path.join(current_directory, "dropzone", username, filename)

    if not os.path.exists(encrypted_file_path):
        raise FileNotFoundError(f"File not found: {encrypted_file_path}")

    with open(encrypted_file_path, "rb") as f:
        iv = f.read(16)
        encrypted_data = f.read()

    return decrypt_user_file(username, encrypted_data, iv)


def add_user_key(username: str):
    username = username.lower()
    user_key_base = os.urandom(32)
    user_key_base64 = base64.b64encode(user_key_base).decode("utf-8")

    with open(MASTER_KEY_FILE, "a", encoding="utf-8") as key_file:
        key_file.write(f"dz_key:{username}: {user_key_base64}\n")


def dropzone_init():
    username = current_user.id.lower()
    generate_master_key()

    try:
        load_master_key(username)
    except ValueError:
        add_user_key(username)
