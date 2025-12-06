"""
hd_FunctionsHostSelector.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os

from pymodules.hd_FunctionsGlobals import current_directory

is_docker = os.path.exists(os.path.join(current_directory, ".is_docker"))
docker_host = "localhost" if not is_docker else "host.docker.internal"
