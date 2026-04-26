"""
hd_UICalendar.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import uuid
from datetime import datetime

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import user_packages_calendar_folder

CALENDAR_DIR = user_packages_calendar_folder
EVENTS_FILE = os.path.join(CALENDAR_DIR, "events.json")
WORLD_CLOCKS_FILE = os.path.join(CALENDAR_DIR, "world_clocks.json")
CALENDARS_FILE = os.path.join(CALENDAR_DIR, "calendars.json")

DEFAULT_CALENDARS = [
    {"id": "personal", "name": "Personal", "color": "blue", "visible": True},
]


def _ensure_dir():
    os.makedirs(CALENDAR_DIR, exist_ok=True)


def _read_calendars():
    _ensure_dir()
    if not os.path.exists(CALENDARS_FILE):
        _write_calendars(DEFAULT_CALENDARS)
        return list(DEFAULT_CALENDARS)
    try:
        with open(CALENDARS_FILE, "r", encoding="utf-8") as f:
            cals = json.load(f)
            return cals if cals else list(DEFAULT_CALENDARS)
    except (json.JSONDecodeError, IOError):
        return list(DEFAULT_CALENDARS)


def _write_calendars(calendars):
    _ensure_dir()
    with open(CALENDARS_FILE, "w", encoding="utf-8") as f:
        json.dump(calendars, f, ensure_ascii=False, indent=2)


def _read_events():
    _ensure_dir()
    if not os.path.exists(EVENTS_FILE):
        return []
    try:
        with open(EVENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_events(events):
    _ensure_dir()
    with open(EVENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, ensure_ascii=False, indent=2)


def _read_world_clocks():
    _ensure_dir()
    if not os.path.exists(WORLD_CLOCKS_FILE):
        return ["America/New_York", "Europe/London", "Asia/Tokyo"]
    try:
        with open(WORLD_CLOCKS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def _write_world_clocks(clocks):
    _ensure_dir()
    with open(WORLD_CLOCKS_FILE, "w", encoding="utf-8") as f:
        json.dump(clocks, f, ensure_ascii=False, indent=2)


@login_required
def api_calendar_get_events():
    try:
        date_from = request.args.get("from")
        date_to = request.args.get("to")
        events = _read_events()

        if date_from and date_to:
            events = [e for e in events if e.get("date", "") >= date_from and e.get("date", "") <= date_to]

        return jsonify({"events": events})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_save_event():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        events = _read_events()
        event_id = data.get("id")

        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "Title is required"}), 400

        date = data.get("date", "")
        if not date:
            return jsonify({"error": "Date is required"}), 400

        calendars = _read_calendars()
        calendar_id = (data.get("calendar_id") or "").strip()
        if not calendar_id or not any(c["id"] == calendar_id for c in calendars):
            calendar_id = calendars[0]["id"] if calendars else "personal"

        event = {
            "id": event_id or str(uuid.uuid4()),
            "title": title[:200],
            "date": date,
            "time": (data.get("time") or "")[:5],
            "end_time": (data.get("end_time") or "")[:5],
            "color": (data.get("color") or "blue")[:20],
            "calendar_id": calendar_id,
            "notes": (data.get("notes") or "")[:2000],
            "updated_at": datetime.utcnow().isoformat(),
        }

        if event_id:
            events = [e for e in events if e.get("id") != event_id]

        events.append(event)
        _write_events(events)

        return jsonify({"success": True, "event": event})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_delete_event():
    try:
        data = request.json
        event_id = data.get("id") if data else None
        if not event_id:
            return jsonify({"error": "Event ID is required"}), 400

        events = _read_events()
        events = [e for e in events if e.get("id") != event_id]
        _write_events(events)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_get_world_clocks():
    try:
        return jsonify({"clocks": _read_world_clocks()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_save_world_clocks():
    try:
        data = request.json
        clocks = data.get("clocks", []) if data else []
        clocks = [str(tz)[:50] for tz in clocks[:12]]
        _write_world_clocks(clocks)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_get_calendars():
    try:
        return jsonify({"calendars": _read_calendars()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_save_calendar():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name is required"}), 400

        calendars = _read_calendars()
        cal_id = data.get("id")

        cal = {
            "id": cal_id or str(uuid.uuid4()),
            "name": name[:100],
            "color": (data.get("color") or "blue")[:20],
            "visible": data.get("visible", True),
        }

        if cal_id:
            calendars = [c for c in calendars if c.get("id") != cal_id]

        calendars.append(cal)
        _write_calendars(calendars)

        return jsonify({"success": True, "calendar": cal})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@login_required
def api_calendar_delete_calendar():
    try:
        data = request.json
        cal_id = data.get("id") if data else None
        if not cal_id:
            return jsonify({"error": "Calendar ID is required"}), 400

        calendars = _read_calendars()
        if len(calendars) <= 1:
            return jsonify({"error": "Cannot delete the last calendar"}), 400

        calendars = [c for c in calendars if c.get("id") != cal_id]
        _write_calendars(calendars)

        events = _read_events()
        fallback_id = calendars[0]["id"]
        for evt in events:
            if evt.get("calendar_id") == cal_id:
                evt["calendar_id"] = fallback_id
        _write_events(events)

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
