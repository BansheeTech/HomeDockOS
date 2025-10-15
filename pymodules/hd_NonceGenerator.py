"""
hd_NonceGen.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import base64
from flask import g


def generate_nonce():
    return base64.b64encode(os.urandom(32)).decode("utf-8")


def setup_nonce(app):
    @app.before_request
    def set_nonce():
        g.nonce = generate_nonce()
