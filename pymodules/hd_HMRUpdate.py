"""
hd_HMRUpdate.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import shutil
import zipfile
import requests

from pymodules.hd_FunctionsGlobals import current_directory


def check_for_homedock_version():
    repo_url = "https://raw.githubusercontent.com/BansheeTech/HomeDockOS/refs/heads/main/pymodules/hd_FunctionsGlobals.py"
    local_version = "1.0.14.117"
    try:
        response = requests.get(repo_url, timeout=5)
        if response.status_code == 200:
            for line in response.text.splitlines():
                if line.startswith("version ="):
                    remote_version = line.split("=")[1].strip().strip('"')
                    if remote_version != local_version:
                        print(f" * New version available: {remote_version}")
                        print(" * Updating...")
                        download_and_extract_github_repo()
                        return remote_version
            print(" * HomeDock OS is up to date")
        else:
            print(f" * Error while checking for updates: {response.status_code}")
    except requests.RequestException as e:
        print(f" ! Unable to verify updates")
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
    replace_dir("app-store")
    replace_dir("homedock-ui")


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