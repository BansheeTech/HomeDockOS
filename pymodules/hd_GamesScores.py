"""
hd_GamesScores.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import threading

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import user_packages_games_folder

GAMES = ("neonrush", "packetsnake")
MAX_SCORE = 1_000_000_000

_lock = threading.Lock()


def _store_path(username):
    safe = re.sub(r"[^a-zA-Z0-9]", "", (username or "")).lower()[:64]

    if not safe:
        return None

    return os.path.join(user_packages_games_folder, f"{safe}.json")


def _read_scores(path):
    try:
        with open(path, "r", encoding="utf-8") as handle:
            data = json.load(handle)
    except (OSError, ValueError):
        return {}

    if not isinstance(data, dict):
        return {}

    return {game: data[game] for game in GAMES if isinstance(data.get(game), int) and not isinstance(data.get(game), bool) and 0 <= data[game] <= MAX_SCORE}


@login_required
def api_games_scores():
    path = _store_path(current_user.id)
    if not path:
        return jsonify({"error": "invalid_user"}), 400

    if request.method == "GET":
        return jsonify({"scores": _read_scores(path)})

    body = request.get_json(silent=True) or {}
    game = body.get("game")
    score = body.get("score")

    if game not in GAMES or not isinstance(score, int) or isinstance(score, bool) or not 0 <= score <= MAX_SCORE:
        return jsonify({"error": "invalid_payload"}), 400

    with _lock:
        scores = _read_scores(path)

        if score > scores.get(game, 0):
            scores[game] = score
            os.makedirs(user_packages_games_folder, exist_ok=True)
            temp_path = f"{path}.tmp"
            with open(temp_path, "w", encoding="utf-8") as handle:
                json.dump(scores, handle)
            os.replace(temp_path, path)

    return jsonify({"scores": scores})
