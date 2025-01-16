"""
hd_HDOSWebServerInit.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

from flask import Flask
from pymodules.hd_FunctionsGlobals import current_directory
import os

template_folder = os.path.join(current_directory, "homedock-ui", "template")

homedock_www = Flask(__name__, static_folder=None, template_folder=template_folder)
