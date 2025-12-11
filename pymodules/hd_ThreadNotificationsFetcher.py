"""
hd_ThreadNotificationsFetcher.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import json
import time
import hashlib
import requests

from threading import Thread

external_notifications = []
previous_notifications_hash = ""

WORKER_HEADERS = {"User-Agent": "HomeDock-OS-Notifications/1.0.0", "Accept": "application/json"}


def fetch_external_notifications():
    global external_notifications, previous_notifications_hash

    is_first_run = True

    while True:
        if is_first_run:
            time.sleep(900)
            is_first_run = False
        else:
            time.sleep(21600)

        try:
            response = requests.get("https://homedock-os-notifications.banshee-devs.workers.dev/", headers=WORKER_HEADERS, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if isinstance(data, list):
                    current_hash = hashlib.md5(json.dumps(data, sort_keys=True).encode()).hexdigest()

                    if current_hash != previous_notifications_hash:
                        external_notifications = data
                        previous_notifications_hash = current_hash
                        print(f" + THREAD: Fetched {len(external_notifications)} new external notification(s)")
                else:
                    print(" + THREAD: Invalid external notifications format (expected list)")

        except requests.exceptions.Timeout:
            print(" + THREAD: Timeout fetching external notifications from Cloudflare Worker")
        except requests.exceptions.RequestException as e:
            print(f" + THREAD: Error fetching external notifications: {e}")
        except Exception as e:
            print(f" + THREAD: Unexpected error in notifications fetcher: {e}")


def get_external_notifications():
    return external_notifications.copy()


def start_notifications_fetcher_thread():
    thread = Thread(target=fetch_external_notifications, daemon=True)
    thread.start()
