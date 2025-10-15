"""
hd_UILogout.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import jsonify
from flask_login import login_required, logout_user


@login_required
def logout():
    logout_user()
    return jsonify({"status": "success", "message": "Logged out successfully."}), 200
