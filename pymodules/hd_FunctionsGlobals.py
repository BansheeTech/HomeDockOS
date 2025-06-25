"""
hd_FunctionsGlobals.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import platform
import hashlib

from datetime import datetime

version = "1.0.18.106"
version_hash = hashlib.md5(version.encode("utf-8")).hexdigest()
running_OS = platform.system()
running_ARCH = platform.machine()
current_year = datetime.now().year
current_directory = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
compose_upload_folder = os.path.join(current_directory, "compose-link")
appstore_folder = os.path.join(current_directory, "app-store")
dropzone_folder = os.path.join(current_directory, "dropzone")
