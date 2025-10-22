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

version = "2.0.2.146"
version_hash = hashlib.md5(version.encode("utf-8")).hexdigest()
running_OS = platform.system()
running_ARCH = platform.machine()
current_year = datetime.now().year
current_directory = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
compose_upload_folder = os.path.join(current_directory, "compose-link")
appstore_folder = os.path.join(current_directory, "app-store")
dropzone_folder = os.path.join(current_directory, "dropzone")

user_packages_folder = os.path.join(current_directory, "_user_packages")
user_packages_images_folder = os.path.join(user_packages_folder, "_images")
user_packages_hds_folder = os.path.join(user_packages_folder, "_hds_packages")
user_packages_available_folder = os.path.join(user_packages_folder, "_available")
