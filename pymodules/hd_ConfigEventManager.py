"""
hd_ConfigEventManager.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

_listeners = []


def register_listener(listener_func):
    if listener_func not in _listeners:
        _listeners.append(listener_func)


def notify_config_changed(new_config):
    for listener in _listeners:
        try:
            listener(new_config)
        except Exception as e:
            print(f"Error in config listener {listener.__name__}: {e}")
