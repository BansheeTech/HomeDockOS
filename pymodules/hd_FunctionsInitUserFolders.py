"""
hd_FunctionsInitUserFolders.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from pymodules.hd_FunctionsGlobals import (
    compose_upload_folder,
    dropzone_folder,
    logs_folder,
    user_packages_images_folder,
    user_packages_hds_folder,
    user_packages_available_folder,
    user_packages_wallpaper_folder,
    user_packages_install_folder,
)


def init_all_directories():
    os.makedirs(compose_upload_folder, exist_ok=True)
    os.makedirs(dropzone_folder, exist_ok=True)
    os.makedirs(logs_folder, exist_ok=True)
    os.makedirs(user_packages_images_folder, exist_ok=True)
    os.makedirs(user_packages_hds_folder, exist_ok=True)
    os.makedirs(user_packages_available_folder, exist_ok=True)
    os.makedirs(user_packages_wallpaper_folder, exist_ok=True)
    os.makedirs(user_packages_install_folder, exist_ok=True)
