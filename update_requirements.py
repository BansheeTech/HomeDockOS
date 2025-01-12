"""
update_requirements.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

import os
import hashlib
import platform
import subprocess
import argparse

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
VENV_PATH = os.path.abspath(os.path.join(BASE_DIR, "../HomeDock_VirtualEnvironment"))

if platform.system() == "Windows":
    VENV_PYTHON = os.path.join(VENV_PATH, "Scripts", "python.exe")
else:
    VENV_PYTHON = os.path.join(VENV_PATH, "bin", "python")

REQUIREMENTS_FILE = os.path.join(BASE_DIR, "requirements.txt")


def calculate_hash(file_path):
    with open(file_path, "r") as f:
        lines = f.readlines()
    content = "".join(line for line in lines if not line.startswith("# last_update_hash:"))
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def update_hash_in_requirements(new_hash):
    with open(REQUIREMENTS_FILE, "r") as f:
        lines = f.readlines()

    if lines and lines[0].startswith("# last_update_hash:"):
        lines[0] = f"# last_update_hash: {new_hash}\n"
    else:
        lines.insert(0, f"# last_update_hash: {new_hash}\n")

    with open(REQUIREMENTS_FILE, "w") as f:
        f.writelines(lines)


def read_existing_hash():
    with open(REQUIREMENTS_FILE, "r") as f:
        first_line = f.readline().strip()
    if first_line.startswith("# last_update_hash:"):
        return first_line.split(":")[1].strip()
    return None


def check_virtual_environment():
    if not os.path.exists(VENV_PATH):
        print(f"Error: Virtual Environment does not exist: {VENV_PATH}. Please create it before proceeding.")
        exit(1)


def install_requirements():
    if not os.path.exists(VENV_PYTHON):
        print(f"Error: Virtual Environment does not exist: {VENV_PATH}. Please first make sure Virtual Environment exists!")
        return

    print(f"Installing deps from {REQUIREMENTS_FILE} using {VENV_PYTHON}...")
    result = subprocess.run([VENV_PYTHON, "-m", "pip", "install", "-r", REQUIREMENTS_FILE], capture_output=True, text=True)
    print(result.stdout)
    if result.returncode != 0:
        print(f"Error installing: {result.stderr}")
    else:
        print("Dependencies installed updated.")


def main():
    parser = argparse.ArgumentParser(description="Update requirements with optional force flag.")
    parser.add_argument("--force", action="store_true", help="Force update requirements without checking hash.")
    args = parser.parse_args()

    check_virtual_environment()

    if not os.path.exists(REQUIREMENTS_FILE):
        print(f"The file {REQUIREMENTS_FILE} doesn't exist!")
        return

    if args.force:
        print("Force flag detected. Updating dependencies without checking hash...")
        install_requirements()
        new_hash = calculate_hash(REQUIREMENTS_FILE)
        update_hash_in_requirements(new_hash)
        return

    new_hash = calculate_hash(REQUIREMENTS_FILE)
    existing_hash = read_existing_hash()

    if existing_hash == new_hash:
        print("No changes detected in requirements.txt. Skipping update.")
        return
    else:
        print("Changes detected on requirements.txt. Updating dependencies...")
        install_requirements()
        update_hash_in_requirements(new_hash)


if __name__ == "__main__":
    main()
