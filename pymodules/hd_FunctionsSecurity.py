"""
hd_FunctionsSecurity.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os


def validate_safe_path(base_dir, user_provided_path):
    base_dir = os.path.realpath(base_dir)

    requested_path = os.path.join(base_dir, user_provided_path)
    requested_path = os.path.realpath(requested_path)

    if not requested_path.startswith(base_dir + os.sep) and requested_path != base_dir:
        raise ValueError("Nope! Nope! Nopety nope nope!")

    return requested_path
