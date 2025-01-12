"""
hd_PublicKeySender.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import uuid

from flask import jsonify
from datetime import datetime, timedelta

from pymodules.hd_FunctionsEnhancedEncryption import get_public_key

MAX_TOKEN_STORAGE_SIZE = 128
temporary_storage = {}


def clean_expired_tokens():
    current_time = datetime.now()
    expired_tokens = [token for token, data in temporary_storage.items() if (current_time - data.get("timestamp", current_time)) > timedelta(seconds=10)]
    for token in expired_tokens:
        temporary_storage.pop(token, None)


def enforce_storage_limit():
    if len(temporary_storage) > MAX_TOKEN_STORAGE_SIZE:
        tokens_sorted_by_age = sorted(temporary_storage.items(), key=lambda x: x[1].get("timestamp", datetime.now()))
        tokens_to_remove = tokens_sorted_by_age[: len(temporary_storage) - MAX_TOKEN_STORAGE_SIZE]
        for token, _ in tokens_to_remove:
            temporary_storage.pop(token, None)


def manage_temporary_storage():
    clean_expired_tokens()
    enforce_storage_limit()


def send_public_key():
    manage_temporary_storage()

    token = str(uuid.uuid4())

    public_key = get_public_key()
    public_key_str = public_key.decode("utf-8")

    temporary_storage[token] = {"timestamp": datetime.now()}

    return jsonify(
        {
            "public_key": public_key_str,
            "token": token,
        }
    )
