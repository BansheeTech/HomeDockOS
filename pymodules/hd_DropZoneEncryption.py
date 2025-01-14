"""
hd_DropZoneEncryption.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import base64

from pymodules.hd_FunctionsGlobals import current_directory
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding as sym_padding
from cryptography.hazmat.backends import default_backend


MASTER_KEY_FILE = os.path.join(current_directory, "homedock_dropzone_key.conf")


def generate_master_key():
    if not os.path.exists(MASTER_KEY_FILE):
        key = os.urandom(32)
        key_base64 = base64.b64encode(key).decode("utf-8")

        os.makedirs(os.path.dirname(MASTER_KEY_FILE), exist_ok=True)
        with open(MASTER_KEY_FILE, "w", encoding="utf-8") as key_file:
            key_file.write("!!!!! Do not delete or modify this file to prevent data corruption !!!!!\n")
            key_file.write(f"DropZone_Master_Key: {key_base64}\n")


def load_master_key() -> bytes:
    if not os.path.exists(MASTER_KEY_FILE):
        raise FileNotFoundError("DropZone Key not found.")

    with open(MASTER_KEY_FILE, "r") as key_file:
        for line in key_file:
            if line.startswith("DropZone_Master_Key:"):
                key_base64 = line.split(":")[1].strip()
                return base64.b64decode(key_base64)

    raise ValueError("DropZone Key not found in file.")


def encrypt_with_master_key(data: bytes) -> tuple:
    key = load_master_key()
    iv = os.urandom(16)
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    padder = sym_padding.PKCS7(algorithms.AES.block_size).padder()
    padded_data = padder.update(data) + padder.finalize()

    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
    return encrypted_data, iv


def decrypt_with_master_key(encrypted_data: bytes, iv: bytes) -> bytes:
    key = load_master_key()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    padded_data = decryptor.update(encrypted_data) + decryptor.finalize()

    unpadder = sym_padding.PKCS7(algorithms.AES.block_size).unpadder()
    data = unpadder.update(padded_data) + unpadder.finalize()
    return data


def save_encrypted_file(filename: str, data: bytes):
    encrypted_data, iv = encrypt_with_master_key(data)
    encrypted_file_path = os.path.join(current_directory(), "dropzone", filename)

    os.makedirs(os.path.dirname(encrypted_file_path), exist_ok=True)
    with open(encrypted_file_path, "wb") as f:
        f.write(iv + encrypted_data)


def load_and_decrypt_file(filename: str) -> bytes:
    encrypted_file_path = os.path.join(current_directory(), "dropzone", filename)
    with open(encrypted_file_path, "rb") as f:
        iv = f.read(16)
        encrypted_data = f.read()

    return decrypt_with_master_key(encrypted_data, iv)
