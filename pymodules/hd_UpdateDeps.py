"""
pymodules/hd_UpdateDeps.py
Copyright © 2023-2025 Banshee
https://www.homedock.cloud
"""

import os
import hashlib
import subprocess

from pymodules.hd_FunctionsGlobals import running_OS, current_directory

VENV_PATH = os.path.abspath(os.path.join(current_directory, "../HomeDock_VirtualEnvironment"))
REQUIREMENTS_FILE = os.path.join(current_directory, "requirements.txt")

if running_OS == "Windows":
    VENV_PYTHON = os.path.join(VENV_PATH, "Scripts", "python.exe")
else:
    VENV_PYTHON = os.path.join(VENV_PATH, "bin", "python")


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


def install_requirements():
    if not os.path.exists(VENV_PYTHON):
        print(f" * Error: Virtual Environment does not exist: {VENV_PATH}.")
        print(" * Please first ensure the Virtual Environment is created!")
        return

    result = subprocess.run([VENV_PYTHON, "-m", "pip", "install", "-r", REQUIREMENTS_FILE], capture_output=True, text=True)

    if result.stdout:
        relevant_lines = [line for line in result.stdout.splitlines() if "Installing" in line or "Successfully installed" in line]
        for line in relevant_lines:
            print(line)

    if result.returncode != 0:
        print(f" * Error installing dependencies: {result.stderr}")
        return False
    else:
        print(" * Dependencies successfully updated.")
        return True


def check_and_update_dependencies():
    if not os.path.exists(REQUIREMENTS_FILE):
        print(" * Can't check dependencies, requirements.txt doesn't exist!")
        return

    new_hash = calculate_hash(REQUIREMENTS_FILE)
    existing_hash = read_existing_hash()

    if existing_hash != new_hash:
        print(" * Changes detected in requirements.txt. Updating dependencies...")
        if install_requirements():
            update_hash_in_requirements(new_hash)


if __name__ == "__main__":
    check_and_update_dependencies()
