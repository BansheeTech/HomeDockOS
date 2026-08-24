"""
hd_FunctionsGlobals.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import platform
import hashlib

from datetime import datetime

version = "2.4.2.120"
version_hash = hashlib.md5(version.encode("utf-8")).hexdigest()
running_OS = platform.system()
running_ARCH = platform.machine()
current_year = datetime.now().year
current_directory = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
compose_upload_folder = os.path.join(current_directory, "compose-link")
appstore_folder = os.path.join(current_directory, "app-store")
logs_folder = os.path.join(current_directory, "logs")

user_packages_folder = os.path.join(current_directory, "_user_packages")
user_packages_images_folder = os.path.join(user_packages_folder, "_images")
user_packages_hds_folder = os.path.join(user_packages_folder, "_hds_packages")
user_packages_available_folder = os.path.join(user_packages_folder, "_available")
user_packages_wallpaper_folder = os.path.join(user_packages_folder, "_user_wallpaper")
user_packages_install_folder = os.path.join(user_packages_folder, "_install")

user_packages_calendar_folder = os.path.join(user_packages_folder, "_calendar")
user_packages_shortcuts_folder = os.path.join(user_packages_folder, "_shortcuts")

user_packages_app_open_folder = os.path.join(user_packages_folder, "_app_default_open")
user_packages_exposure_file = os.path.join(user_packages_folder, "_app_exposure.json")
user_packages_desktop_widgets_folder = os.path.join(user_packages_folder, "_desktop_widgets")
user_packages_whats_new_folder = os.path.join(user_packages_folder, "_whats_new")
user_packages_acme_folder = os.path.join(user_packages_folder, "_acme")
user_packages_acme_staging_folder = os.path.join(user_packages_acme_folder, "_staging")

user_storage_folder = os.path.join(user_packages_folder, "_storage")
dropzone_folder = os.path.join(user_storage_folder, "_dropzone")
storage_folder = os.path.join(user_storage_folder, "_storage")
chunks_folder = os.path.join(user_storage_folder, "_chunks")
dropzone_folder_legacy = os.path.join(current_directory, "dropzone")
