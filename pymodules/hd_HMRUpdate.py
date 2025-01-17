"""
hd_HMRUpdate.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import sys
import time
import shutil
import asyncio
import zipfile
import requests

from flask import request


from flask import jsonify
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory, version
from pymodules.hd_FunctionsConfig import read_config

updateConfig = read_config()
shutdown_event = asyncio.Event()

UPDATE_URL = "https://raw.githubusercontent.com/BansheeTech/HomeDockOS/refs/heads/main/version.txt"


@login_required
def check_update():
    try:
        response = requests.get(UPDATE_URL, timeout=5)
        if response.status_code == 200:
            remote_version = response.text.strip()
            update_available = remote_version != version
            return jsonify({"current_version": version, "latest_version": remote_version, "update_available": update_available})
        return jsonify({"error": "Failed to check for updates"}), 500
    except requests.RequestException:
        return jsonify({"error": "Unable to verify updates"}), 500


@login_required
def update_now():
    try:
        response = requests.get(UPDATE_URL, timeout=5)
        if response.status_code == 200:
            remote_version = response.text.strip()
            if remote_version != version:
                download_and_extract_github_repo(remote_version=remote_version)
            return jsonify({"message": "Already up-to-date"})
        return jsonify({"error": "Failed to fetch update"}), 500
    except requests.RequestException:
        return jsonify({"error": "Unable to update"}), 500


def download_and_extract_github_repo(remote_version):
    repo_zip_url = "https://github.com/BansheeTech/HomeDockOS/archive/refs/heads/main.zip"
    download_path = os.path.join(current_directory, f"HomeDockOS_Update.{remote_version}.zip")
    extract_path = os.path.join(current_directory, "_update")

    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)

    response = requests.get(repo_zip_url, stream=True)
    if response.status_code == 200:
        with open(download_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                f.write(chunk)
    else:
        print(f" ! Error downloading the new HomeDock OS update: {response.status_code}")
        return

    print(" * Extracting...")
    with zipfile.ZipFile(download_path, "r") as zip_ref:
        zip_ref.extractall(extract_path)

    os.remove(download_path)
    print(" * Downloaded and extracted successfully!")
    time.sleep(1)
    replace_dir("app-store")
    time.sleep(1)
    replace_dir("homedock-ui")
    time.sleep(1)
    replace_dir("pymodules")
    time.sleep(1)
    replace_files(["homedock.py", "requirements.txt", "version.txt," "package.json", "package-lock.json"])
    time.sleep(1)

    print(" * Cleaning up temporary update files...")
    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)
        print(" * _update/ folder removed successfully.")

    restart_homedock()


def replace_dir(dir_name):
    source_path = os.path.join(current_directory, "_update", "HomeDockOS-main", dir_name)
    target_path = os.path.join(current_directory, dir_name)

    if not os.path.exists(source_path):
        print(f" ! Error: Source directory {source_path} does not exist. Update process failed.")
        return

    if os.path.exists(target_path):
        shutil.rmtree(target_path)

    shutil.copytree(source_path, target_path)

    print(f" * {dir_name} updated successfully!")


def replace_files(files):
    for file in files:
        source_file = os.path.join(current_directory, "_update", "HomeDockOS-main", file)
        target_file = os.path.join(current_directory, file)

        if os.path.exists(source_file):
            shutil.copy2(source_file, target_file)
            print(f" * Updated {file}")
        else:
            print(f" ! Skipping {file}, not found in update.")


def stop_flask_server():
    func = request.environ.get("werkzeug.server.shutdown")
    if func:
        func()
    print(" * Flask server stopped.")


def stop_hypercorn():
    print(" * Stopping Hypercorn...")
    shutdown_event.set()


def restart_homedock():
    print(" * Stopping HomeDock OS services before restart...")

    if updateConfig.get("run_on_development", False):
        stop_flask_server()
    else:
        stop_hypercorn()

    time.sleep(10)

    print(" * Restarting HomeDock OS after the update, please wait...")

    python_executable = sys.executable
    script_path = os.path.join(current_directory, "homedock.py")

    os.execv(python_executable, [python_executable, script_path])
