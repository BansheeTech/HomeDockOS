"""
hd_OnboardingWindow.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import time

WINDOW_MINUTES = 15

_process_start = time.monotonic()


def mark_process_start():
    global _process_start
    _process_start = time.monotonic()


def window_minutes():
    return WINDOW_MINUTES


def remaining_seconds():
    elapsed = time.monotonic() - _process_start
    return max(0, int((WINDOW_MINUTES * 60) - elapsed))


def is_window_open():
    return remaining_seconds() > 0
