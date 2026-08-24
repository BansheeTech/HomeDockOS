"""
hd_UIAppDenied.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import render_template, request, g

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version_hash
from pymodules.hd_AppSubdomains import lookup_slug, slugify_container_name
from pymodules.hd_DockerAPIContainerData import get_display_name_for_container


def appdenied():
    config = read_config()

    # HDOS00055
    slug = slugify_container_name(request.args.get("app", ""))
    entry = lookup_slug(slug) if slug else None
    app_display_name = get_display_name_for_container(entry["container"]) if entry else None

    return render_template(
        "appdenied.html",
        version_hash=version_hash,
        selected_theme=config["selected_theme"],
        selected_back=config["selected_back"],
        selected_language=config["selected_language"],
        app_display_name=app_display_name,
        nonce=g.get("nonce", ""),
    )
