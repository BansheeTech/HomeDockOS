"""
hd_HDOSWebServerInit.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import Flask
from pymodules.hd_FunctionsGlobals import current_directory
import os

template_folder = os.path.join(current_directory, "homedock-ui", "template")

homedock_www = Flask(__name__, static_folder=None, template_folder=template_folder)
