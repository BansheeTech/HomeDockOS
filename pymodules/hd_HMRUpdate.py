"""
hd_HMRUpdate.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import sys
import time
import shutil
import zipfile
import requests

from pymodules.hd_FunctionsGlobals import current_directory, version


def check_for_homedock_version():
    repo_url = "https://raw.githubusercontent.com/BansheeTech/HomeDockOS/refs/heads/main/pymodules/hd_FunctionsGlobals.py"
    local_version = version
    try:
        response = requests.get(repo_url, timeout=5)
        if response.status_code == 200:
            for line in response.text.splitlines():
                if line.startswith("version ="):
                    remote_version = line.split("=")[1].strip().strip('"')
                    if remote_version != local_version:
                        print(f" * New version available: {remote_version}")

                        if wait_for_keypress(timeout=10):
                            print(" * Skipping update...")
                            return None

                        print(" * Updating...")
                        download_and_extract_github_repo()
                        restart_homedock()
                        return remote_version
            print(" * HomeDock OS is up to date")
        else:
            print(f" * Error while checking for updates: {response.status_code}")
    except requests.RequestException:
        print(" ! Unable to verify updates")
    return None


def download_and_extract_github_repo():
    repo_zip_url = "https://github.com/BansheeTech/HomeDockOS/archive/refs/heads/main.zip"
    download_path = os.path.join(current_directory, "repo.zip")
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
    replace_files(["homedock.py", "requirements.txt", "package.json", "package-lock.json"])
    time.sleep(1)
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


def restart_homedock():
    print(" * Restarting HomeDock OS after the update, please wait...")

    python_executable = sys.executable
    script_path = os.path.join(current_directory, "homedock.py")

    os.execv(python_executable, [python_executable, script_path])


def wait_for_keypress(timeout=5):
    print(f" * Press Enter within {timeout} seconds to cancel the update...")

    start_time = time.time()
    while time.time() - start_time < timeout:
        user_input = input()
        if user_input == "":
            return True
        return False

    return False
