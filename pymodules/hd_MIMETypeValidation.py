"""
hd_MIMETypeValidation.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

MAGIC_BYTES_MAP = {
    "image/jpeg": [b"\xff\xd8\xff"],
    "image/png": [b"\x89\x50\x4e\x47"],
    "application/zip": [b"PK\x03\x04"],
    "application/json": None,
    "text/yaml": None,
}

DANGEROUS_EXTENSIONS = [".php", ".phtml", ".php3", ".php4", ".php5", ".php7", ".phps", ".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".sh", ".bash", ".zsh", ".vbs", ".vbe", ".wsf", ".wsh", ".jar", ".app", ".deb", ".rpm", ".cgi", ".pl", ".py", ".rb", ".asp", ".aspx", ".jsp", ".sql", ".msi", ".dll", ".so"]

DANGEROUS_PATTERNS = ["<?php", "#!/bin/", "<script", "eval(", "exec(", "__import__"]


def validate_file_mime(file_content, filename, allowed_types=None):

    if not file_content or len(file_content) < 4:
        raise ValueError("File is too small or empty")

    if allowed_types is None:
        allowed_types = ["image/jpeg", "image/png", "application/zip"]

    for mime_type in allowed_types:
        if mime_type not in MAGIC_BYTES_MAP:
            raise ValueError(f"Unsupported MIME type in allowed list: {mime_type}")

    filename_lower = filename.lower()
    for ext in DANGEROUS_EXTENSIONS:
        if ext in filename_lower:
            raise ValueError(f"Dangerous file extension detected: {ext}")

    detected_type = None
    for mime_type in allowed_types:
        magic_list = MAGIC_BYTES_MAP[mime_type]

        if magic_list is None:
            continue

        for magic in magic_list:
            if file_content.startswith(magic):
                detected_type = mime_type
                break

        if detected_type:
            break

    if detected_type:
        return True

    text_types = ["application/json", "text/yaml"]
    allowed_text_types = [t for t in allowed_types if t in text_types]

    if allowed_text_types:
        try:
            sample = file_content[:2048].decode("utf-8", errors="strict")

            # Check for dangerous patterns
            for pattern in DANGEROUS_PATTERNS:
                if pattern in sample:
                    raise ValueError(f"File contains potentially dangerous content: {pattern}")

            # Check for binary file signatures that might decode as UTF-8
            # These are common magic bytes of binary files
            if file_content.startswith((b'%PDF', b'PK\x03\x04', b'\xFF\xD8\xFF', b'\x89\x50\x4E\x47', b'MZ', b'\x7fELF')):
                raise ValueError("Binary file detected (not plain text)")

            # Validate JSON syntax if JSON is in whitelist
            if "application/json" in allowed_text_types:
                sample_stripped = sample.strip()
                if sample_stripped.startswith(("{", "[")):
                    return True

            # Accept YAML/plain text if in whitelist
            if "text/yaml" in allowed_text_types:
                return True

            return True

        except UnicodeDecodeError:
            pass

    raise ValueError(f"File type not allowed. Expected one of: {', '.join(allowed_types)}")
