"""
hd_AppFilters.py
Copyright © 2023-2025 Banshee, All Rights Reserved - All Rights Reserved
https://www.banshee.pro
"""

import base64
import json


def b64encode_filter(data):
    json_data = json.dumps(data)
    return base64.b64encode(json_data.encode()).decode()
