"""
hd_AppExposure.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import threading

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import user_packages_exposure_file
from pymodules.hd_AppSubdomains import slugify_container_name, get_slug_map
from pymodules.hd_FunctionsNativeSSL import cert_covers_subdomains_of, get_cert_domains_and_type, ssl_enabled
from pymodules.hd_LocalHTTPAccess import is_local_only_name

# HDOS00112
MODES = ("gated", "direct")

DEFAULT_MODE = "gated"

_lock = threading.Lock()

_cache = {"mtime": None, "modes": {}}


def _read_all():
    try:
        mtime = os.stat(user_packages_exposure_file).st_mtime_ns
    except OSError:
        _cache["mtime"] = None
        _cache["modes"] = {}
        return {}

    if _cache["mtime"] == mtime:
        return _cache["modes"]

    try:
        with open(user_packages_exposure_file, "r") as handle:
            stored = json.load(handle)
    except (IOError, OSError, ValueError):
        stored = {}

    modes = {str(slug): mode for slug, mode in stored.items() if mode in MODES} if isinstance(stored, dict) else {}

    _cache["mtime"] = mtime
    _cache["modes"] = modes

    return modes


def _write_all(modes):
    try:
        os.makedirs(os.path.dirname(user_packages_exposure_file), exist_ok=True)

        with open(user_packages_exposure_file, "w") as handle:
            json.dump(modes, handle, indent=1, sort_keys=True)

        os.chmod(user_packages_exposure_file, 0o600)
    except OSError:
        return False

    _cache["mtime"] = None

    return True


def get_modes():
    with _lock:
        return dict(_read_all())


def exposed_slugs():
    with _lock:
        return sorted(slug for slug, mode in _read_all().items() if mode == "direct")


def set_mode(slug, mode):
    slug = slugify_container_name(slug or "")
    mode = (mode or "").strip().lower()

    if not slug or mode not in MODES:
        return False

    with _lock:
        modes = _read_all()

        if mode == DEFAULT_MODE:
            modes.pop(slug, None)
        else:
            modes[slug] = mode

        return _write_all(modes)


# HDOS00113
def public_address(trail, scheme):

    if scheme != "https":
        return False

    bare = (trail or "").split(":")[0].strip().lower().rstrip(".")

    if not bare or is_local_only_name(bare):
        return False

    return cert_covers_subdomains_of(bare)


def is_directly_exposed(slug, trail, scheme):
    if not public_address(trail, scheme):
        return False

    with _lock:
        return _read_all().get(slugify_container_name(slug or "")) == "direct"


@login_required
def api_app_exposure():
    host = request.host

    scheme = "https" if request.is_secure else request.scheme

    if request.method == "GET":
        return (
            jsonify(
                {
                    "modes": get_modes(),
                    "default": DEFAULT_MODE,
                    "available": public_address(host, scheme) and ssl_enabled() and not bool(get_cert_domains_and_type().get("is_self_signed")),
                    "exposed": exposed_slugs(),
                }
            ),
            200,
        )

    data = request.get_json(silent=True) or {}

    container = str(data.get("container", ""))
    slug = slugify_container_name(container)

    if not slug or slug not in get_slug_map():
        return jsonify({"status": "bad_request", "message": "Unknown application."}), 400

    mode = str(data.get("mode", ""))

    if mode == "direct" and not public_address(host, scheme):
        return jsonify({"status": "bad_request", "message": "Direct access needs a public HTTPS address."}), 400

    if not set_mode(slug, mode):
        return jsonify({"status": "bad_request", "message": "Unknown exposure mode."}), 400

    return jsonify({"status": "saved", "container": container, "mode": mode, "exposed": exposed_slugs()}), 200
