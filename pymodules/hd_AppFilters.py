"""
hd_AppFilters.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import base64
import json


def b64encode_filter(data):
    json_data = json.dumps(data)
    return base64.b64encode(json_data.encode()).decode()
