"""
hd_EnterpriseLoader.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from pymodules.hd_FunctionsGlobals import current_directory

ENTERPRISE_PATH = os.path.join(current_directory, "__Enterprise__")


def load_enterprise(app):
    if not os.path.exists(ENTERPRISE_PATH):
        return []

    try:
        from __Enterprise__ import load_enterprise_cogs

        loaded = load_enterprise_cogs(app, ENTERPRISE_PATH)
        return loaded
    except Exception as e:
        print(f" ! Enterprise loader error: {e}")
        return []


def print_enterprise_banner(enterprise_cogs):
    if not os.path.exists(ENTERPRISE_PATH):
        return

    try:
        from __Enterprise__ import get_enterprise_uuid, get_license_info

        enterprise_uuid = get_enterprise_uuid()
        license_info = get_license_info()

        if enterprise_uuid:
            print(f" ~ \033[1;30mEnterprise UUID: {enterprise_uuid}\033[0m")

        if license_info["valid"]:
            print(f" » \033[1;32mLicense:\033[0m Valid ({license_info['client']})")
            if enterprise_cogs:
                enterprise_list = ", ".join([f"{m['name']} ({m['version']})" for m in enterprise_cogs])
                print(f" » \033[1;35mEnterprise:\033[0m {enterprise_list}")
        else:
            print(f" » \033[1;31mLicense:\033[0m Not registered")
    except ImportError:
        pass
