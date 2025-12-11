"""
hd_NotificationHandler.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import hashlib

from flask import jsonify, request
from flask_login import login_required, current_user

from pymodules.hd_FunctionsGlobals import current_directory
from pymodules.hd_FunctionsMain import get_server_uptime_minutes
from pymodules.hd_FunctionsHostSelector import is_docker
from pymodules.hd_ThreadNotificationsFetcher import get_external_notifications


def generate_notification_hash(title, message):
    content = f"{title}{message}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


@login_required
def dismiss_notification():
    try:
        username = current_user.id
        notification_hash = request.json.get("hash")

        if not notification_hash:
            return jsonify({"error": "No notification hash provided."}), 400

        if not isinstance(notification_hash, str) or len(notification_hash) != 64:
            return jsonify({"error": "Invalid notification hash format."}), 400

        if not all(c in "0123456789abcdef" for c in notification_hash.lower()):
            return jsonify({"error": "Invalid notification hash format."}), 400

        notifications_log = os.path.join(current_directory, "logs", "notifications.log")

        os.makedirs(os.path.dirname(notifications_log), exist_ok=True)

        if os.path.exists(notifications_log):
            with open(notifications_log, "r") as f:
                for line in f:
                    parts = line.strip().split("***")
                    if len(parts) == 3:
                        log_username, status, existing_hash = parts
                        if log_username == username and existing_hash == notification_hash and status == "dismissed":
                            return jsonify({"success": True, "message": "Notification already dismissed."}), 200

        with open(notifications_log, "a") as f:
            f.write(f"{username}***dismissed***{notification_hash}\n")

        return jsonify({"success": True, "message": "Notification dismissed successfully."}), 200

    except Exception as e:
        print(f"Error in dismiss_notification: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500


@login_required
def get_notifications():
    try:
        username = current_user.id
        all_notifications = []

        if username == "user":
            all_notifications.append({"title": "Default User Detected", "message": "You're using the default user! Please change it in settings.", "permanent": True, "allowRemove": False})

        all_notifications.append({"title": "Change the default password!", "message": "It's dangerous to go alone! If you're using the default password make sure you change it as soon as possible!", "permanent": True, "allowRemove": True})

        uptime_minutes = get_server_uptime_minutes()

        if uptime_minutes >= 10:
            all_notifications.append({"title": "Are you enjoying HomeDock OS?", "message": "If you find it useful, give us a star on GitHub, it helps us a lot to keep growing!", "permanent": True, "allowRemove": True, "actionUrl": "https://github.com/BansheeTech/HomeDockOS", "actionText": "Star on GitHub"})

        if uptime_minutes >= 720:
            all_notifications.append({"title": "Join our community!", "message": "Learn, get support and connect with other HomeDock OS users on Discord!", "permanent": True, "allowRemove": True, "actionUrl": "https://discord.gg/Zj3JCYsRWw", "actionText": "Join our Discord"})

        if is_docker and uptime_minutes >= 4320:
            all_notifications.append({"title": "Take HomeDock OS to the next level", "message": "You're running in Docker mode. Install natively for faster performance, easier updates, and full hardware access.", "permanent": True, "allowRemove": True, "actionUrl": "https://www.homedock.cloud/install/", "actionText": "Install natively"})

        external_notifications = get_external_notifications()
        all_notifications.extend(external_notifications)

        dismissed_hashes = set()
        notifications_log = os.path.join(current_directory, "logs", "notifications.log")

        if os.path.exists(notifications_log):
            with open(notifications_log, "r") as f:
                for line in f:
                    parts = line.strip().split("***")
                    if len(parts) == 3:
                        log_username, status, notification_hash = parts
                        if log_username == username and status == "dismissed":
                            dismissed_hashes.add(notification_hash)

        final_notifications = []
        for notification in all_notifications:
            title = notification.get("title", "")
            message = notification.get("message", "")

            notification_hash = generate_notification_hash(title, message)

            if notification_hash in dismissed_hashes:
                continue

            notification_copy = notification.copy()
            notification_copy["hash"] = notification_hash

            if "permanent" not in notification_copy:
                notification_copy["permanent"] = False
            if "allowRemove" not in notification_copy:
                notification_copy["allowRemove"] = True

            final_notifications.append(notification_copy)

        return jsonify({"notifications": final_notifications}), 200

    except Exception as e:
        print(f"Error in get_notifications: {e}")
        return jsonify({"error": "An unexpected error occurred."}), 500
