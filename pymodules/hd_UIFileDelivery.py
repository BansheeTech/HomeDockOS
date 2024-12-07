"""
hd_UIFileDelivery.py
Copyright © 2023-2025 Banshee
https://www.banshee.pro
"""

import os
from flask import send_from_directory
from homedock import homedock_www, globalConfig


def send_static_images(path):
    return send_from_directory(os.path.join(homedock_www.root_path, "homedock-ui", "static", "images"), path)


def send_static_favicon(path):
    return send_from_directory(os.path.join(homedock_www.root_path, "homedock-ui", "static", "favicon"), path)


def send_static_audio(path):
    return send_from_directory(os.path.join(homedock_www.root_path, "homedock-ui", "static", "audio"), path)


def send_src_static(path):
    if not globalConfig.get("run_on_development", False):
        raise RuntimeError("Access to static Vue3 components is forbidden in production.")
    return send_from_directory(os.path.join(homedock_www.root_path, "homedock-ui", "vue3", "static"), path)

def send_src_dist(path):
    return send_from_directory(os.path.join(homedock_www.root_path, "homedock-ui", "vue3", "dist"), path)
