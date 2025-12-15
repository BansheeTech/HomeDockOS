"""
hd_CryptoServer.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import json
import base64

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

from pymodules.hd_FunctionsEnhancedEncryption import get_private_key, get_public_key


def _decrypt_rsa_direct(encrypted_data_base64: str) -> str:

    private_key = serialization.load_pem_private_key(
        get_private_key(),
        password=None,
        backend=default_backend()
    )

    encrypted_bytes = base64.b64decode(encrypted_data_base64)

    decrypted_bytes = private_key.decrypt(
        encrypted_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return decrypted_bytes.decode("utf-8")


def _validate_hybrid_payload(hybrid_payload: dict) -> None:
    required_fields = ("key", "iv", "tag", "data")
    for field in required_fields:
        if field not in hybrid_payload:
            raise ValueError("Invalid payload structure")

    if len(hybrid_payload["key"]) > 800:
        raise ValueError("Invalid payload structure")

    if len(hybrid_payload["iv"]) > 32:
        raise ValueError("Invalid payload structure")

    if len(hybrid_payload["tag"]) > 32:
        raise ValueError("Invalid payload structure")

    if len(hybrid_payload["data"]) > 2 * 1024 * 1024:
        raise ValueError("Invalid payload structure")


def _decrypt_rsa_aes_hybrid(hybrid_payload: dict) -> str:
    _validate_hybrid_payload(hybrid_payload)

    private_key = serialization.load_pem_private_key(
        get_private_key(),
        password=None,
        backend=default_backend()
    )

    encrypted_key = base64.b64decode(hybrid_payload["key"])
    aes_key = private_key.decrypt(
        encrypted_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    if len(aes_key) != 32:
        raise ValueError("Invalid AES key length")

    iv = base64.b64decode(hybrid_payload["iv"])
    tag = base64.b64decode(hybrid_payload["tag"])
    encrypted_data = base64.b64decode(hybrid_payload["data"])

    cipher = Cipher(
        algorithms.AES(aes_key),
        modes.GCM(iv, tag),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    decrypted_bytes = decryptor.update(encrypted_data) + decryptor.finalize()

    return decrypted_bytes.decode("utf-8")


def decrypt_from_client(encrypted_data: str, allow_hybrid: bool = True) -> str:
    try:
        if encrypted_data.startswith("{"):
            if not allow_hybrid:
                raise ValueError("Hybrid encryption mode not allowed")
            hybrid_payload = json.loads(encrypted_data)
            if hybrid_payload.get("mode") == "hybrid":
                return _decrypt_rsa_aes_hybrid(hybrid_payload)

        return _decrypt_rsa_direct(encrypted_data)

    except Exception:
        raise ValueError("Decryption failed")


def decrypt_json_from_client(encrypted_data: str, allow_hybrid: bool = True) -> dict:
    decrypted_string = decrypt_from_client(encrypted_data, allow_hybrid)

    try:
        return json.loads(decrypted_string)
    except json.JSONDecodeError:
        raise ValueError("Invalid data format")


def get_public_key_pem() -> str:
    return get_public_key().decode("utf-8")
