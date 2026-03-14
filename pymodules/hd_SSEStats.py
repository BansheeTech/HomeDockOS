"""
hd_SSEStats.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import json
import time
import queue
import threading

from flask import Response, session, stream_with_context
from flask_login import login_required

from pymodules.hd_DashboardMetrics import get_cached


class StatsCollector:
    _instance = None
    _lock = threading.Lock()
    _MAX_PER_SESSION = 3

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._clients = []
        self._clients_lock = threading.Lock()
        self._state_lock = threading.Lock()
        self._last_sent = {}
        self._current_state = {}
        self._thread = threading.Thread(target=self._collect_loop, daemon=True)
        self._thread.start()

    _FIELDS = {
        "cpu_temp": {"fmt": ".1f", "default": "0.0"},
        "cpu_usage": {"fmt": "str", "default": "0.00"},
        "ram_usage": {"fmt": ".1f", "default": "0.0"},
        "disk_usage": {"fmt": ".1f", "default": "0.0"},
        "external_disk_usage": {"fmt": ".1f", "default": "0.0"},
        "download_data": {"fmt": ".2f", "default": "0.00"},
        "upload_data": {"fmt": ".2f", "default": "0.00"},
        "total_containers": {"fmt": "str", "default": "0"},
        "active_containers": {"fmt": "str", "default": "0"},
        "system_uptime": {"fmt": "str", "default": "00:00", "cache_key": "uptime_data"},
        "homedock_uptime": {"fmt": "str", "default": "00:00"},
    }

    def _format(self, val, fmt, default):
        if val is None:
            return default
        try:
            if fmt == "str":
                return str(val)
            return f"{float(val):{fmt}}"
        except (TypeError, ValueError):
            return default

    def _read_all(self):
        state = {}
        for key, spec in self._FIELDS.items():
            cache_key = spec.get("cache_key", key)
            raw = get_cached(cache_key)
            state[key] = self._format(raw, spec["fmt"], spec["default"])
        return state

    def _collect_loop(self):
        while True:
            try:
                patch = self._read_all()

                with self._state_lock:
                    self._current_state.update(patch)

                changed = {k: v for k, v in patch.items() if self._last_sent.get(k) != v}

                if changed:
                    self._last_sent.update(changed)
                    self._broadcast(changed)
            except Exception as e:
                print(f" * SSE stats collector error: {e}")

            time.sleep(2)

    def _broadcast(self, data):
        msg = json.dumps(data)
        with self._clients_lock:
            for q, _ in self._clients:
                try:
                    q.put_nowait(msg)
                except queue.Full:
                    pass

    def register_client(self, session_id):
        q = queue.Queue(maxsize=50)
        with self._clients_lock:
            session_clients = [e for e in self._clients if e[1] == session_id]
            while len(session_clients) >= self._MAX_PER_SESSION:
                oldest_q, _ = session_clients.pop(0)
                try:
                    oldest_q.put_nowait(None)
                except queue.Full:
                    pass
                self._clients.remove((oldest_q, session_id))
            self._clients.append((q, session_id))
        return q

    def unregister_client(self, q):
        with self._clients_lock:
            self._clients = [e for e in self._clients if e[0] is not q]

    def get_snapshot(self):
        with self._state_lock:
            if not self._current_state:
                self._current_state = self._read_all()
                self._last_sent = dict(self._current_state)
            return json.dumps(dict(self._current_state))


_collector = None


def _get_collector():
    global _collector
    if _collector is None:
        _collector = StatsCollector()
    return _collector


@login_required
def stats_stream():
    collector = _get_collector()
    session_id = session.get("homedock_csrf_token", "")

    def generate():
        client_queue = collector.register_client(session_id)
        deadline = time.monotonic() + 300
        try:
            yield f"event: snapshot\ndata: {collector.get_snapshot()}\n\n"

            while time.monotonic() < deadline:
                try:
                    data = client_queue.get(timeout=20)
                    if data is None:
                        break
                    yield f"event: patch\ndata: {data}\n\n"
                except queue.Empty:
                    yield ": heartbeat\n\n"

            yield "event: reconnect\ndata: {}\n\n"
        except GeneratorExit:
            pass
        finally:
            collector.unregister_client(client_queue)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
