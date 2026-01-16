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
    storage_folder,
    user_storage_folder,
    logs_folder,
    user_packages_images_folder,
    user_packages_hds_folder,
    user_packages_available_folder,
    user_packages_wallpaper_folder,
    user_packages_install_folder,
)


def init_all_directories():
    os.makedirs(compose_upload_folder, exist_ok=True)
    os.makedirs(logs_folder, exist_ok=True)
    os.makedirs(user_packages_images_folder, exist_ok=True)
    os.makedirs(user_packages_hds_folder, exist_ok=True)
    os.makedirs(user_packages_available_folder, exist_ok=True)
    os.makedirs(user_packages_wallpaper_folder, exist_ok=True)
    os.makedirs(user_packages_install_folder, exist_ok=True)

    os.makedirs(user_storage_folder, exist_ok=True)
    os.makedirs(dropzone_folder, exist_ok=True)
    os.makedirs(storage_folder, exist_ok=True)

    from pymodules.hd_UIDropzone import migrate_dropzone_data

    migrate_dropzone_data()


DEFAULT_USER_STORAGE_FOLDERS = ["Notes", "Documents", "Photos", "Videos", "Music", "Downloads"]


def init_user_storage(user_dir: str):
    os.makedirs(user_dir, mode=0o700, exist_ok=True)
    for folder_name in DEFAULT_USER_STORAGE_FOLDERS:
        folder_path = os.path.join(user_dir, folder_name)
        if not os.path.exists(folder_path):
            try:
                os.makedirs(folder_path, mode=0o700, exist_ok=True)
            except OSError:
                pass
