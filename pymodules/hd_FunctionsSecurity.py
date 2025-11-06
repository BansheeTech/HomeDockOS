"""
hd_FunctionsSecurity.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os


def validate_safe_path(base_dir, user_provided_path):
    base_dir = os.path.realpath(os.path.abspath(base_dir))

    if not user_provided_path:
        return base_dir

    if "\x00" in user_provided_path:
        raise ValueError("Nope! Nope! Nopety nope nope! (null byte not allowed)")

    if os.path.isabs(user_provided_path):
        raise ValueError("Nope! Nope! Nopety nope nope! (absolute path not allowed)")

    user_provided_path = os.path.normpath(user_provided_path)

    if user_provided_path.startswith("..") or user_provided_path.startswith(os.sep):
        raise ValueError("Nope! Nope! Nopety nope nope! (path traversal not allowed)")

    requested_path = os.path.join(base_dir, user_provided_path)
    requested_path = os.path.realpath(os.path.abspath(requested_path))

    if requested_path != base_dir and not requested_path.startswith(base_dir + os.sep):
        raise ValueError("Nope! Nope! Nopety nope nope! (path escape not allowed)")

    try:
        common = os.path.commonpath([base_dir, requested_path])
        if common != base_dir:
            raise ValueError("Nope! Nope! Nopety nope nope! (path escape not allowed)")
    except ValueError:
        raise ValueError("Nope! Nope! Nopety nope nope! (invalid path not allowed)")

    return requested_path


def validate_filename(filename):
    if not filename or not filename.strip():
        raise ValueError("Filename cannot be empty")

    filename = filename.strip()

    if "\x00" in filename:
        raise ValueError("Invalid filename (null byte)")

    if "/" in filename or "\\" in filename:
        raise ValueError("Filename cannot contain path separators")

    if filename in (".", ".."):
        raise ValueError("Invalid filename")

    if filename.startswith("."):
        raise ValueError("Filename cannot start with a dot")

    if filename.endswith("."):
        raise ValueError("Filename cannot end with a dot")

    if filename.endswith(" "):
        raise ValueError("Filename cannot end with a space")

    dangerous_chars = ["<", ">", ":", '"', "|", "?", "*", "&"]
    for char in dangerous_chars:
        if char in filename:
            raise ValueError(f"Filename cannot contain '{char}'")

    if len(filename) > 255:
        raise ValueError("Filename too long (max 255 characters)")

    return filename


def validate_no_symlinks(path, base_dir):
    if os.path.islink(path):
        raise ValueError("Symlinks are not allowed for security reasons")

    real_path = os.path.realpath(path)

    base_dir_real = os.path.realpath(base_dir)

    if real_path != base_dir_real and not real_path.startswith(base_dir_real + os.sep):
        raise ValueError("Path points outside allowed directory")

    current = path
    while current != base_dir_real:
        parent = os.path.dirname(current)
        if parent == current:
            break
        if os.path.islink(parent):
            raise ValueError("Parent directory cannot be a symlink")
        current = parent
