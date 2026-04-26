"""
hd_DisksPlusAuth.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import time
import threading

import bcrypt
from flask import jsonify, request
from flask_login import current_user, login_required

from pymodules.hd_FunctionsGlobals import running_OS
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_CryptoServer import decrypt_json_from_client


DEFAULT_SESSION_TTL_SECONDS = 600
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_WINDOW_SECONDS = 300


def _session_ttl_seconds():
    try:
        minutes = int(read_config().get("disksplus_session_timeout_minutes", 10))
    except (TypeError, ValueError):
        return DEFAULT_SESSION_TTL_SECONDS
    if minutes not in (0, 3, 5, 10, 15):
        return DEFAULT_SESSION_TTL_SECONDS
    return 0 if minutes == 0 else minutes * 60


def _require_protected_paths_password():
    try:
        return bool(read_config().get("require_protected_paths_password", True))
    except Exception:
        return True


DANGER_ZONES_LINUX = (
    "/boot",
    "/etc",
    "/sys",
    "/proc",
    "/dev",
    "/root",
    "/var/log",
    "/var/lib",
    "/var/spool",
    "/var/cache",
    "/usr/bin",
    "/usr/sbin",
    "/usr/lib",
    "/usr/lib64",
    "/usr/libexec",
    "/usr/local/bin",
    "/usr/local/sbin",
    "/usr/local/lib",
    "/bin",
    "/sbin",
    "/lib",
    "/lib64",
    "/run",
    "/snap",
    "/DATA/HomeDock",
)

DANGER_ZONES_DARWIN = (
    "/System",
    "/Library",
    "/private",
    "/usr/bin",
    "/usr/sbin",
    "/usr/lib",
    "/usr/libexec",
    "/usr/local/bin",
    "/usr/local/sbin",
    "/bin",
    "/sbin",
    "/cores",
    "/.Spotlight-V100",
    "/.Trashes",
    "/.fseventsd",
)

DANGER_ZONES_WINDOWS = (
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\ProgramData",
    "C:\\System Volume Information",
    "C:\\$Recycle.Bin",
    "C:\\Recovery",
    "C:\\Boot",
    "C:\\PerfLogs",
    "C:\\Config.Msi",
)


_sessions_lock = threading.Lock()
_unlock_sessions = {}
_danger_grants = {}
_failed_attempts = {}
_lockouts = {}


def get_danger_zones():
    if running_OS == "Linux":
        return DANGER_ZONES_LINUX
    if running_OS == "Darwin":
        return DANGER_ZONES_DARWIN
    if running_OS == "Windows":
        return DANGER_ZONES_WINDOWS
    return ()


def _normalize_path(path):
    if not path:
        return ""
    normalized = os.path.normpath(path)
    if len(normalized) > 1:
        normalized = normalized.rstrip(os.sep)
    if running_OS == "Windows":
        normalized = normalized.lower()
    return normalized


def matching_danger_zone(absolute_path):
    if not absolute_path:
        return None
    target = _normalize_path(absolute_path)
    for zone in get_danger_zones():
        zone_norm = _normalize_path(zone)
        if not zone_norm:
            continue
        if target == zone_norm:
            return zone
        separator = "\\" if running_OS == "Windows" else "/"
        if target.startswith(zone_norm + separator):
            return zone
    return None


def is_danger_zone_path(absolute_path):
    return matching_danger_zone(absolute_path) is not None


def _user_key():
    uid = current_user.get_id() if current_user else None
    if uid is None:
        raise RuntimeError("Disks+ auth invoked without authenticated user")
    return uid


def _is_locked_out(key):
    with _sessions_lock:
        entry = _lockouts.get(key)
        if not entry:
            return False
        locked_until = entry.get("until", 0)
        if time.time() >= locked_until:
            _lockouts.pop(key, None)
            return False
        return True


def _register_failed_attempt(key):
    with _sessions_lock:
        now = time.time()
        record = _failed_attempts.get(key, {"count": 0, "first": now})
        if now - record["first"] > LOCKOUT_WINDOW_SECONDS:
            record = {"count": 0, "first": now}
        record["count"] += 1
        _failed_attempts[key] = record
        if record["count"] >= MAX_FAILED_ATTEMPTS:
            _lockouts[key] = {"until": now + LOCKOUT_WINDOW_SECONDS}
            _failed_attempts.pop(key, None)
            return True
        return False


def _reset_failed(key):
    with _sessions_lock:
        _failed_attempts.pop(key, None)
        _lockouts.pop(key, None)


def _get_remaining_attempts(key):
    with _sessions_lock:
        record = _failed_attempts.get(key)
        if not record:
            return MAX_FAILED_ATTEMPTS
        now = time.time()
        if now - record["first"] > LOCKOUT_WINDOW_SECONDS:
            return MAX_FAILED_ATTEMPTS
        return max(0, MAX_FAILED_ATTEMPTS - record["count"])


def _lockout_remaining(key):
    with _sessions_lock:
        entry = _lockouts.get(key)
        if not entry:
            return 0
        remaining = int(entry.get("until", 0) - time.time())
        return max(0, remaining)


def _has_active_session(uid):
    with _sessions_lock:
        return uid in _unlock_sessions


def _session_remaining(uid):
    ttl = _session_ttl_seconds()
    with _sessions_lock:
        session = _unlock_sessions.get(uid)
        if not session:
            return 0
        if ttl == 0:
            return 0
        expires_at = session.get("expires_at", 0)
        if expires_at == float("inf"):
            return ttl
        remaining = int(expires_at - time.time())
        if remaining <= 0:
            _unlock_sessions.pop(uid, None)
            _danger_grants.pop(uid, None)
            return 0
        return remaining


def is_unlock_session_valid(uid):
    if _session_ttl_seconds() == 0:
        return _has_active_session(uid)
    return _session_remaining(uid) > 0


def get_session_info(uid):
    ttl = _session_ttl_seconds()
    remaining = _session_remaining(uid)
    active = _has_active_session(uid)
    with _sessions_lock:
        grants = sorted(list(_danger_grants.get(uid, set())))
    return {
        "unlocked": (ttl == 0 and active) or remaining > 0,
        "remaining_seconds": remaining,
        "ttl_seconds": ttl,
        "granted_zones": grants,
        "docker_limited": is_docker,
        "protected_paths_enforced": _require_protected_paths_password(),
    }


def _create_session(uid):
    ttl = _session_ttl_seconds()
    with _sessions_lock:
        _unlock_sessions[uid] = {"expires_at": float("inf") if ttl == 0 else time.time() + ttl}
        _danger_grants.setdefault(uid, set())


def _touch_session(uid):
    ttl = _session_ttl_seconds()
    with _sessions_lock:
        session = _unlock_sessions.get(uid)
        if not session:
            return
        expires_at = session.get("expires_at", 0)
        if expires_at != float("inf") and expires_at <= time.time():
            return
        session["expires_at"] = float("inf") if ttl == 0 else time.time() + ttl


def _revoke_session(uid):
    with _sessions_lock:
        _unlock_sessions.pop(uid, None)
        _danger_grants.pop(uid, None)


def _grant_zone(uid, zone):
    with _sessions_lock:
        grants = _danger_grants.setdefault(uid, set())
        grants.add(zone)


def _has_grant(uid, zone):
    with _sessions_lock:
        grants = _danger_grants.get(uid, set())
        return zone in grants


def authorize_request(path=None):
    uid = _user_key()

    if not is_unlock_session_valid(uid):
        return (False, "unlock_required", 401)

    if path and _require_protected_paths_password():
        zone = matching_danger_zone(path)
        if zone is not None:
            if _has_grant(uid, zone):
                _touch_session(uid)
                return (True, None, None)
            return (False, "danger_zone_reauth_required", 401)

    _touch_session(uid)
    return (True, None, None)


def _verify_password(candidate):
    try:
        config = read_config()
        stored = config.get("user_password")
        if not stored:
            return False
        if isinstance(stored, str):
            stored = stored.encode("latin1")
        return bcrypt.checkpw(candidate.encode("utf-8"), stored)
    except Exception:
        return False


def _using_default_password():
    try:
        stored = read_config().get("user_password")
        if not stored:
            return False
        stored_bytes = stored.encode("latin1") if isinstance(stored, str) else stored
        return bcrypt.checkpw(b"passwd", stored_bytes)
    except Exception:
        return False


@login_required
def disksplus_status():
    uid = _user_key()
    info = get_session_info(uid)
    return jsonify({"status": "ok", **info})


@login_required
def disksplus_danger_zones():
    return jsonify({"os": running_OS, "zones": list(get_danger_zones())})


@login_required
def disksplus_unlock():
    uid = _user_key()

    if _using_default_password():
        return jsonify({"error": "default_password"}), 403

    if _is_locked_out(uid):
        return jsonify({"error": "locked_out", "retry_after": _lockout_remaining(uid)}), 429

    try:
        body = request.get_json(silent=True) or {}
        encrypted = body.get("encrypted_data")
        if not encrypted or not isinstance(encrypted, str):
            return jsonify({"error": "missing_payload"}), 400
        payload = decrypt_json_from_client(encrypted)
    except Exception:
        return jsonify({"error": "decryption_failed"}), 400

    password = payload.get("password") if isinstance(payload, dict) else None
    if not password or not isinstance(password, str):
        return jsonify({"error": "invalid_payload"}), 400

    if not _verify_password(password):
        locked = _register_failed_attempt(uid)
        if locked:
            return jsonify({"error": "locked_out", "retry_after": LOCKOUT_WINDOW_SECONDS}), 429
        remaining = _get_remaining_attempts(uid)
        return jsonify({"error": "invalid_password", "remaining_attempts": remaining}), 401

    _reset_failed(uid)
    _create_session(uid)
    return jsonify({"status": "ok", **get_session_info(uid)})


@login_required
def disksplus_lock():
    uid = _user_key()
    _revoke_session(uid)
    return jsonify({"status": "ok", **get_session_info(uid)})


@login_required
def disksplus_danger_auth():
    uid = _user_key()

    if not is_unlock_session_valid(uid):
        return jsonify({"error": "unlock_required"}), 401

    if _using_default_password():
        return jsonify({"error": "default_password"}), 403

    if _is_locked_out(uid):
        return jsonify({"error": "locked_out", "retry_after": _lockout_remaining(uid)}), 429

    try:
        body = request.get_json(silent=True) or {}
        encrypted = body.get("encrypted_data")
        if not encrypted or not isinstance(encrypted, str):
            return jsonify({"error": "missing_payload"}), 400
        payload = decrypt_json_from_client(encrypted)
    except Exception:
        return jsonify({"error": "decryption_failed"}), 400

    if not isinstance(payload, dict):
        return jsonify({"error": "invalid_payload"}), 400

    password = payload.get("password")
    path = payload.get("path")

    if not isinstance(password, str) or not password:
        return jsonify({"error": "invalid_payload"}), 400
    if not isinstance(path, str) or not path:
        return jsonify({"error": "invalid_payload"}), 400

    zone = matching_danger_zone(path)
    if zone is None:
        return jsonify({"error": "not_a_danger_zone"}), 400

    if not _verify_password(password):
        locked = _register_failed_attempt(uid)
        if locked:
            return jsonify({"error": "locked_out", "retry_after": LOCKOUT_WINDOW_SECONDS}), 429
        remaining = _get_remaining_attempts(uid)
        return jsonify({"error": "invalid_password", "remaining_attempts": remaining}), 401

    _reset_failed(uid)
    _grant_zone(uid, zone)
    return jsonify({"status": "ok", "granted_zone": zone, **get_session_info(uid)})
