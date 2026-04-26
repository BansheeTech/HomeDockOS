import json
import time
import queue
import threading

import psutil
from flask import Response, session, stream_with_context
from flask_login import login_required


STREAM_MAX_LIFETIME = 300
MAX_PER_SESSION = 2
POLL_INTERVAL_SECONDS = 2
HEARTBEAT_INTERVAL_SECONDS = 20


class DisksPlusWatcher:
    _instance = None
    _instance_lock = threading.Lock()

    def __new__(cls):
        with cls._instance_lock:
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
        self._snapshot = set()
        self._snapshot_lock = threading.Lock()
        self._thread = None
        self._stop_event = None
        self._start_lock = threading.Lock()

    @staticmethod
    def _current_partitions():
        try:
            parts = psutil.disk_partitions(all=False)
            return {(p.device or "", p.mountpoint or "") for p in parts}
        except Exception:
            return set()

    def _watch_loop(self, stop_event):
        while not stop_event.is_set():
            try:
                current = self._current_partitions()
                with self._snapshot_lock:
                    previous = self._snapshot
                    self._snapshot = current

                added = current - previous
                removed = previous - current

                if added or removed:
                    self._broadcast(
                        {
                            "added": [{"device": d, "mountpoint": m} for d, m in sorted(added)],
                            "removed": [{"device": d, "mountpoint": m} for d, m in sorted(removed)],
                            "timestamp": time.time(),
                        }
                    )
            except Exception as e:
                print(f" * DisksPlusWatcher error: {e}")

            if stop_event.wait(POLL_INTERVAL_SECONDS):
                break

    def _broadcast(self, payload):
        msg = json.dumps(payload)
        with self._clients_lock:
            for q, _ in self._clients:
                try:
                    q.put_nowait(msg)
                except queue.Full:
                    pass

    def _ensure_started(self):
        with self._start_lock:
            if self._thread is not None and self._thread.is_alive():
                return
            with self._clients_lock:
                if not self._clients:
                    return
            self._stop_event = threading.Event()
            self._snapshot = self._current_partitions()
            self._thread = threading.Thread(
                target=self._watch_loop,
                args=(self._stop_event,),
                daemon=True,
                name="DisksPlusWatcher",
            )
            self._thread.start()

    def _maybe_stop(self):
        with self._start_lock:
            with self._clients_lock:
                if self._clients:
                    return
            if self._stop_event is not None:
                self._stop_event.set()
            self._thread = None
            self._stop_event = None

    def register_client(self, session_id):
        q = queue.Queue(maxsize=50)
        with self._clients_lock:
            session_clients = [e for e in self._clients if e[1] == session_id]
            while len(session_clients) >= MAX_PER_SESSION:
                oldest_q, oldest_sid = session_clients.pop(0)
                try:
                    oldest_q.put_nowait(None)
                except queue.Full:
                    pass
                try:
                    self._clients.remove((oldest_q, oldest_sid))
                except ValueError:
                    pass
            self._clients.append((q, session_id))
        self._ensure_started()
        return q

    def unregister_client(self, q):
        with self._clients_lock:
            self._clients = [e for e in self._clients if e[0] is not q]
        self._maybe_stop()


_watcher = None


def _get_watcher():
    global _watcher
    if _watcher is None:
        _watcher = DisksPlusWatcher()
    return _watcher


@login_required
def disksplus_events_stream():
    watcher = _get_watcher()
    session_id = session.get("homedock_csrf_token", "")

    def generate():
        client_queue = watcher.register_client(session_id)
        deadline = time.monotonic() + STREAM_MAX_LIFETIME
        last_heartbeat = time.monotonic()
        try:
            yield "event: ready\ndata: {}\n\n"

            while time.monotonic() < deadline:
                try:
                    data = client_queue.get(timeout=HEARTBEAT_INTERVAL_SECONDS)
                    if data is None:
                        break
                    yield f"event: change\ndata: {data}\n\n"
                    last_heartbeat = time.monotonic()
                except queue.Empty:
                    yield ": heartbeat\n\n"
                    last_heartbeat = time.monotonic()

            yield "event: reconnect\ndata: {}\n\n"
        except GeneratorExit:
            pass
        finally:
            watcher.unregister_client(client_queue)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
