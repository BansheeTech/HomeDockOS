"""
hd_FunctionsSanitize.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import re


def sanitize_container_name(name):
    sanitized_name = re.sub(r"[^a-zA-Z0-9_-]", "", name)
    return sanitized_name
