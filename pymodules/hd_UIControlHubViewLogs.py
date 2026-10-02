"""
hd_UIControlHubViewLogs.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import time
import secrets
import calendar
import threading

import docker

from flask import jsonify, request, Response, stream_with_context
from flask_login import login_required

from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_FunctionsSanitize import sanitize_container_name

INITIAL_TAIL = 1000
INCREMENTAL_TAIL = 5000
TICKET_TTL = 30

RANGES = {"15m": 15 * 60, "1h": 60 * 60, "24h": 24 * 60 * 60, "all": None}

ANSI_ESCAPE_RE = re.compile(rb"\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]")

_download_tickets = {}
_download_tickets_lock = threading.Lock()


def _timestamp_key(value):
    if not value or len(value) < 20 or value[10] != "T":
        return None

    try:
        seconds = calendar.timegm(time.strptime(value[:19], "%Y-%m-%dT%H:%M:%S"))
    except ValueError:
        return None

    fraction = value[19:].lstrip(".").rstrip("Z")
    fraction = "".join(ch for ch in fraction if ch.isdigit())

    return seconds, int(fraction.ljust(9, "0")[:9]) if fraction else 0


def _get_container(name):
    container_name = sanitize_container_name(name or "")

    if not container_name:
        return None, (jsonify({"success": False, "code": "invalid_request"}), 400)

    try:
        return DockerClientManager.get_instance().get_client().containers.get(container_name), None
    except docker.errors.NotFound:
        return None, (jsonify({"success": False, "code": "not_found"}), 404)
    except docker.errors.DockerException:
        return None, (jsonify({"success": False, "code": "docker_error"}), 500)


def _log_size(container):
    log_path = container.attrs.get("LogPath") or ""
    if not log_path:
        return None

    directory, base = os.path.split(log_path)
    total = 0
    found = False

    try:
        for entry in os.scandir(directory):
            suffix = entry.name[len(base) :]
            if entry.name.startswith(base) and (not suffix or (suffix[0] == "." and suffix[1:].isdigit())) and entry.is_file():
                total += entry.stat().st_size
                found = True
    except OSError:
        return None

    return total if found else None


def _latest_timestamp(container):
    try:
        raw = container.logs(tail=1, timestamps=True, stdout=True, stderr=True)
    except docker.errors.DockerException:
        return ""

    timestamp = raw.decode("utf-8", "replace").partition(" ")[0]

    return timestamp if _timestamp_key(timestamp) else ""


def _issue_download_ticket(entry):
    ticket = secrets.token_urlsafe(32)
    now = time.monotonic()

    with _download_tickets_lock:
        for key in [key for key, value in _download_tickets.items() if value["expires"] < now]:
            _download_tickets.pop(key, None)
        entry["expires"] = now + TICKET_TTL
        _download_tickets[ticket] = entry

    return ticket


def _consume_download_ticket(ticket):
    if not ticket:
        return None

    with _download_tickets_lock:
        entry = _download_tickets.pop(ticket, None)

    if entry is None or entry["expires"] < time.monotonic():
        return None

    return entry


@login_required
def view_container_logs():
    container, error = _get_container(request.args.get("containerName"))
    if error:
        return error

    cursor = request.args.get("cursor", "")
    cursor_key = _timestamp_key(cursor)
    window = RANGES.get(request.args.get("range", "all"))

    options = {"timestamps": True, "stdout": True, "stderr": True}

    if cursor_key:
        options["since"] = cursor_key[0] if cursor_key[0] > 0 else 1
        options["tail"] = INCREMENTAL_TAIL
    else:
        options["tail"] = INITIAL_TAIL
        if window:
            options["since"] = max(1, int(time.time()) - window)

    try:
        raw = container.logs(**options)
    except docker.errors.DockerException:
        return jsonify({"success": False, "code": "docker_error"}), 500

    lines = []
    last_cursor = cursor if cursor_key else ""

    for entry in raw.decode("utf-8", "replace").split("\n"):
        if not entry:
            continue

        timestamp, _, text = entry.partition(" ")
        key = _timestamp_key(timestamp)

        if key is None:
            timestamp, text = "", entry
        elif cursor_key and key <= cursor_key:
            continue
        else:
            last_cursor = timestamp

        text = text.rstrip("\r")
        if "\r" in text:
            text = text.rsplit("\r", 1)[-1]

        lines.append({"ts": timestamp, "text": text})

    limit = INCREMENTAL_TAIL if cursor_key else INITIAL_TAIL
    payload = {"success": True, "lines": lines, "cursor": last_cursor, "truncated": len(lines) >= limit, "status": container.status}

    if not cursor_key:
        payload["size"] = _log_size(container)
        payload["latest"] = _latest_timestamp(container)
        payload["now"] = time.time()

    return jsonify(payload)


@login_required
def create_download_ticket():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        payload = {}

    range_key = payload.get("range") or "all"
    if not isinstance(range_key, str) or range_key not in RANGES:
        return jsonify({"success": False, "code": "invalid_request"}), 400

    container, error = _get_container(payload.get("containerName") if isinstance(payload.get("containerName"), str) else "")
    if error:
        return error

    ticket = _issue_download_ticket({"container_id": container.id, "range": range_key})

    return jsonify({"success": True, "ticket": ticket})


@login_required
def download_container_logs():
    entry = _consume_download_ticket(request.args.get("ticket", ""))
    if entry is None:
        return jsonify({"success": False, "code": "invalid_ticket"}), 403

    container, error = _get_container(entry["container_id"])
    if error:
        return error

    options = {"stream": True, "follow": False, "timestamps": True, "stdout": True, "stderr": True}
    window = RANGES[entry["range"]]
    if window:
        options["since"] = max(1, int(time.time()) - window)

    def generate():
        try:
            for chunk in container.logs(**options):
                yield ANSI_ESCAPE_RE.sub(b"", chunk)
        except docker.errors.DockerException:
            return

    suffix = "" if entry["range"] == "all" else f"-last-{entry['range']}"
    filename = f"{container.name}{suffix}-{time.strftime('%Y%m%d-%H%M%S')}.log"

    return Response(stream_with_context(generate()), mimetype="text/plain", headers={"Content-Disposition": f'attachment; filename="{filename}"', "Cache-Control": "no-store"})
