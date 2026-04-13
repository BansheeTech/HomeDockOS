"""
hd_HDSPackageManager.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import io
import os
import re
import json
import yaml
import shutil
import hashlib
import zipfile
import tempfile
import datetime

import urllib.request
import urllib.parse

from typing import Dict, Tuple, Optional, List
from flask import jsonify, request, send_file
from flask_login import login_required
from werkzeug.utils import secure_filename

from pymodules.hd_FunctionsGlobals import user_packages_hds_folder, user_packages_images_folder, user_packages_available_folder
from pymodules.hd_ComposeDevHooks import extract_devhook_placeholders, DEVHOOK_PLACEHOLDERS
from pymodules.hd_DockerAPIContainerData import invalidate_external_apps_cache
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_MIMETypeValidation import validate_file_mime


MAX_HDSTORE_PACKAGES = 999  # Items
MAX_HDS_PACKAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_COMPOSE_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_ICON_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_HDSTORE_PACKAGE_SIZE = 75 * 1024 * 1024  # 75 MB

ALLOWED_ICON_EXTENSIONS = [".jpg", ".jpeg", ".png"]

HDS_VERSION = "1.0"

ALLOWED_CATEGORIES = ["Social", "Gaming", "Media", "Files & Productivity", "AI", "Web Development", "Networking", "Developer Tools", "Home & Automation"]

ERROR_MESSAGES = {
    "FILE_TOO_LARGE": "File exceeds maximum allowed size of {max_size} MB",
    "INVALID_FILE_EXTENSION": "File extension not allowed. Allowed extensions: {extensions}",
    "INVALID_SLUG_FORMAT": "Invalid slug format. Must be lowercase with only alphanumeric, dash, and underscore characters.",
    "INVALID_CATEGORY": "Invalid category. Must be one of: {categories}",
    "PATH_TRAVERSAL_DETECTED": "Path traversal detected in file: {filename}",
    "UNSAFE_PATH": "Unsafe path detected: {path}",
}


def normalize_app_slug(name: str) -> str:
    if not name:
        raise ValueError("Name cannot be empty")

    slug = name.lower().replace(" ", "-")
    slug = re.sub(r"[^a-z0-9\-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")

    if not slug:
        raise ValueError(f"Name '{name}' results in empty slug after normalization")

    return slug


def validate_slug_format(slug: str) -> bool:
    if not slug:
        return False

    if slug != slug.lower():
        return False

    if not re.match(r"^[a-z0-9\-]+$", slug):
        return False

    if slug[0] == "-" or slug[-1] == "-":
        return False

    return True


def validate_category(category: str) -> bool:
    return category in ALLOWED_CATEGORIES


def get_devhooks_from_map(devhook_map: Dict[str, bool]) -> List[str]:
    placeholders = []
    for key, is_present in devhook_map.items():
        if is_present and key in DEVHOOK_PLACEHOLDERS:
            placeholders.append(DEVHOOK_PLACEHOLDERS[key])
    return placeholders


def get_error_message(error_key: str, **kwargs) -> str:
    message_template = ERROR_MESSAGES.get(error_key, f"Unknown error: {error_key}")
    return message_template.format(**kwargs)


def parse_compose_file(compose_content: str) -> Dict:
    try:
        devhook_replacements = {}
        temp_content = compose_content

        import uuid

        devhook_pattern = r"\[\[([^\]]+)\]\]"

        def replace_devhook(match):
            original = match.group(0)
            token = f"__DEVHOOK_{uuid.uuid4().hex[:8]}__"
            devhook_replacements[token] = original
            return token

        temp_content = re.sub(devhook_pattern, replace_devhook, temp_content)

        compose_data = yaml.safe_load(temp_content)

        result = {"image": None, "tag": None, "devhooks": [], "service_name": None, "container_name": None}

        if "services" in compose_data and compose_data["services"]:
            first_service_name = list(compose_data["services"].keys())[0]
            first_service = compose_data["services"][first_service_name]

            result["service_name"] = first_service_name

            if "container_name" in first_service:
                result["container_name"] = first_service["container_name"]
            else:
                result["container_name"] = first_service_name

            if "image" in first_service:
                image = first_service["image"]
                result["image"] = image

                if ":" in image:
                    result["tag"] = image.split(":")[-1]
                else:
                    result["tag"] = "latest"

        devhook_map = extract_devhook_placeholders(compose_content)
        result["devhooks"] = get_devhooks_from_map(devhook_map)

        return result

    except Exception as e:
        return {"error": str(e), "image": None, "tag": None, "devhooks": [], "service_name": None}


def cleanup_partial_installation(app_slug: str, apps_folder: str) -> None:
    try:
        # HDOS00013
        if "/" in app_slug or "\\" in app_slug or ".." in app_slug:
            return

        compose_path = os.path.join(apps_folder, f"{app_slug}.yml")
        real_compose_path = os.path.realpath(compose_path)
        real_apps_folder = os.path.realpath(apps_folder)

        if real_compose_path.startswith(real_apps_folder + os.sep) and os.path.exists(compose_path):
            os.remove(compose_path)

        metadata_path = os.path.join(apps_folder, f"{app_slug}.yml.metadata")
        real_metadata_path = os.path.realpath(metadata_path)

        if real_metadata_path.startswith(real_apps_folder + os.sep) and os.path.exists(metadata_path):
            os.remove(metadata_path)

        real_images_folder = os.path.realpath(user_packages_images_folder)
        for ext in ALLOWED_ICON_EXTENSIONS:
            icon_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
            real_icon_path = os.path.realpath(icon_path)

            if real_icon_path.startswith(real_images_folder + os.sep) and os.path.exists(icon_path):
                os.remove(icon_path)
                break

    except Exception:
        pass


def calculate_content_hash(manifest_content: str, icon_bytes: bytes, compose_content: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(manifest_content.encode("utf-8"))
    hasher.update(icon_bytes)
    hasher.update(compose_content.encode("utf-8"))
    return hasher.hexdigest()


def calculate_hdstore_hash(store_manifest_content: str, hds_files_bytes: List[bytes]) -> str:
    hasher = hashlib.sha256()
    hasher.update(store_manifest_content.encode("utf-8"))
    for hds_bytes in hds_files_bytes:
        hasher.update(hds_bytes)
    return hasher.hexdigest()


def validate_hds_package(hds_path: str) -> Tuple[bool, str, Optional[Dict]]:
    if not zipfile.is_zipfile(hds_path):
        return False, "Not a valid ZIP file", None

    try:
        with zipfile.ZipFile(hds_path, "r") as zip_ref:
            required_files = ["manifest.json", "docker-compose.yml", ".hds_signature"]
            file_list = zip_ref.namelist()

            for required in required_files:
                if required not in file_list:
                    return False, f"Missing required file: {required}", None

            icon_file = None
            for ext in [".jpg", ".jpeg", ".png"]:
                if f"icon{ext}" in file_list:
                    icon_file = f"icon{ext}"
                    break

            if not icon_file:
                return False, "Missing icon file (icon.jpg, icon.png)", None

            manifest_content = zip_ref.read("manifest.json").decode("utf-8")
            manifest = json.loads(manifest_content)

            required_fields = ["name", "category", "type", "description", "docker_image", "author", "version", "hds_version"]
            for field in required_fields:
                if field not in manifest:
                    return False, f"Missing required field in manifest: {field}", None

            if manifest.get("hds_version") != HDS_VERSION:
                return False, f"Incompatible HDS version. Expected {HDS_VERSION}, got {manifest.get('hds_version')}", None

            icon_bytes = zip_ref.read(icon_file)
            compose_content = zip_ref.read("docker-compose.yml").decode("utf-8")
            stored_hash = zip_ref.read(".hds_signature").decode("utf-8").strip()

            calculated_hash = calculate_content_hash(manifest_content, icon_bytes, compose_content)

            if calculated_hash != stored_hash:
                return False, "Package integrity check failed. File may be corrupted or tampered with.", None

            return True, "Package validated successfully", manifest

    except json.JSONDecodeError as e:
        return False, f"Invalid manifest JSON: {str(e)}", None
    except Exception as e:
        return False, f"Validation error: {str(e)}", None


def create_hds_package(app_slug: str, display_name: str, output_path: str, app_metadata: Dict, icon_path: str, compose_path: str) -> Tuple[bool, str]:
    try:
        with open(icon_path, "rb") as f:
            icon_bytes = f.read()

        icon_ext = os.path.splitext(icon_path)[1]
        icon_filename = f"icon{icon_ext}"

        with open(compose_path, "r") as f:
            compose_content = f.read()

        manifest = {"name": app_slug, "display_name": display_name, "category": app_metadata.get("category", "Other"), "type": app_metadata.get("type", "Application"), "description": app_metadata.get("description", ""), "docker_image": app_metadata.get("docker_image", ""), "icon": icon_filename, "author": app_metadata.get("author", "Unknown"), "version": app_metadata.get("version", "1.0.0"), "hds_version": HDS_VERSION, "dependencies": app_metadata.get("dependencies", []), "is_group": app_metadata.get("is_group", False), "is_new": app_metadata.get("is_new", False), "new_until": app_metadata.get("new_until", False)}

        manifest_content = json.dumps(manifest, indent=2)

        signature = calculate_content_hash(manifest_content, icon_bytes, compose_content)

        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zip_ref:
            zip_ref.writestr("manifest.json", manifest_content)
            zip_ref.writestr(icon_filename, icon_bytes)
            zip_ref.writestr("docker-compose.yml", compose_content)
            zip_ref.writestr(".hds_signature", signature)

        return True, "Package created successfully"

    except Exception as e:
        return False, f"Error creating package: {str(e)}"


def extract_hds_package(hds_path: str, fallback_display_name: str) -> Tuple[bool, str, Optional[Dict]]:
    is_valid, msg, manifest = validate_hds_package(hds_path)
    if not is_valid:
        return False, msg, None

    app_slug = manifest.get("name")
    if not app_slug:
        return False, "Manifest missing required 'name' field", None

    os.makedirs(user_packages_available_folder, exist_ok=True)
    os.makedirs(user_packages_images_folder, exist_ok=True)

    try:
        with zipfile.ZipFile(hds_path, "r") as zip_ref:
            icon_filename = manifest.get("icon", "icon.jpg")

            icon_filename_safe = secure_filename(icon_filename)
            if not icon_filename_safe or icon_filename_safe != os.path.basename(icon_filename):
                raise ValueError(get_error_message("PATH_TRAVERSAL_DETECTED", filename=icon_filename))

            if "/" in icon_filename or "\\" in icon_filename or ".." in icon_filename:
                raise ValueError(get_error_message("PATH_TRAVERSAL_DETECTED", filename=icon_filename))

            icon_ext = os.path.splitext(icon_filename)[1].lower()
            if icon_ext not in ALLOWED_ICON_EXTENSIONS:
                raise ValueError(get_error_message("INVALID_FILE_EXTENSION", extensions=", ".join(ALLOWED_ICON_EXTENSIONS)))

            compose_content = zip_ref.read("docker-compose.yml").decode("utf-8")

            try:
                validate_file_mime(compose_content.encode("utf-8"), "docker-compose.yml", allowed_types=["text/yaml"])
            except ValueError as e:
                raise ValueError(f"Invalid docker-compose.yml inside package: {str(e)}")

            compose_content = _inject_hd_group_labels(compose_content, app_slug)

            compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")

            compose_path_real = os.path.realpath(compose_path)
            available_real = os.path.realpath(user_packages_available_folder)
            if not compose_path_real.startswith(available_real + os.sep):
                raise ValueError(get_error_message("UNSAFE_PATH", path=compose_path))

            with open(compose_path, "w") as f:
                f.write(compose_content)

            icon_bytes = zip_ref.read(icon_filename_safe)

            try:
                validate_file_mime(icon_bytes, icon_filename_safe, allowed_types=["image/jpeg", "image/png"])
            except ValueError as e:
                raise ValueError(f"Invalid icon file inside package: {str(e)}")

            icon_dest = os.path.join(user_packages_images_folder, f"{app_slug}{icon_ext}")

            icon_dest_real = os.path.realpath(icon_dest)
            images_dir_real = os.path.realpath(user_packages_images_folder)
            if not icon_dest_real.startswith(images_dir_real + os.sep):
                raise ValueError(get_error_message("UNSAFE_PATH", path=icon_dest))

            with open(icon_dest, "wb") as f:
                f.write(icon_bytes)

        if "display_name" not in manifest or not manifest["display_name"]:
            manifest["display_name"] = fallback_display_name

        manifest["slug"] = app_slug
        manifest["icon_filename"] = f"{app_slug}{icon_ext}"

        try:
            safe = compose_content.replace("[[", "__DBLBRK__").replace("]]", "__DBLBRK_END__")
            parsed = yaml.safe_load(safe)
            if isinstance(parsed, dict) and len(parsed.get("services") or {}) > 1:
                manifest["is_group"] = True
        except Exception:
            pass

        metadata_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml.metadata")
        with open(metadata_path, "w") as f:
            json.dump(manifest, f, indent=2)

        invalidate_external_apps_cache()

        return True, "Package extracted successfully", manifest

    except Exception as e:
        cleanup_partial_installation(app_slug, user_packages_available_folder)
        return False, f"Error extracting package: {str(e)}", None


@login_required
def list_external_apps():
    os.makedirs(user_packages_hds_folder, exist_ok=True)

    try:
        installed_container_names = set()
        try:
            manager = DockerClientManager.get_instance()
            client = manager.get_client()
            containers = client.containers.list(all=True)
            installed_container_names = {container.name for container in containers}
        except Exception as e:
            pass

        hds_files = []
        for filename in os.listdir(user_packages_hds_folder):
            if filename.endswith(".hds"):
                file_path = os.path.join(user_packages_hds_folder, filename)

                is_valid, msg, manifest = validate_hds_package(file_path)

                sha256_hash = hashlib.sha256()
                with open(file_path, "rb") as f:
                    for byte_block in iter(lambda: f.read(4096), b""):
                        sha256_hash.update(byte_block)
                file_hash = sha256_hash.hexdigest()

                app_slug = manifest.get("name") if manifest else None
                is_installed = app_slug in installed_container_names if app_slug else False

                hds_files.append({"filename": filename, "is_valid": is_valid, "validation_message": msg, "manifest": manifest, "size": os.path.getsize(file_path), "hash": file_hash, "is_installed": is_installed})

        return jsonify({"success": True, "apps": hds_files})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def upload_hds_package():
    os.makedirs(user_packages_hds_folder, exist_ok=True)
    os.makedirs(user_packages_available_folder, exist_ok=True)
    os.makedirs(user_packages_images_folder, exist_ok=True)

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not file.filename.endswith(".hds"):
        return jsonify({"success": False, "message": "File must be a .hds package"}), 400

    temp_path = None

    try:
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)

        file_size = os.path.getsize(temp_path)
        if file_size > MAX_HDS_PACKAGE_SIZE:
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_HDS_PACKAGE_SIZE // (1024 * 1024))}), 400

        with open(temp_path, "rb") as f:
            file_content = f.read(1024)

        try:
            validate_file_mime(file_content, filename, allowed_types=["application/zip"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid file type: {str(e)}"}), 400

        is_valid, msg, manifest = validate_hds_package(temp_path)

        if not is_valid:
            return jsonify({"success": False, "message": f"Invalid package: {msg}"}), 400

        display_name = manifest.get("display_name") or manifest.get("name")
        app_slug = manifest.get("name")

        existing_files = []

        if os.path.exists(os.path.join(user_packages_hds_folder, filename)):
            existing_files.append(f".hds package: {filename}")

        compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")
        if os.path.exists(compose_path):
            existing_files.append(f"compose file: {app_slug}.yml")

        metadata_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml.metadata")
        if os.path.exists(metadata_path):
            existing_files.append(f"metadata: {app_slug}.yml.metadata")

        for ext in [".jpg", ".jpeg", ".png"]:
            icon_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
            if os.path.exists(icon_path):
                existing_files.append(f"icon: {app_slug}{ext}")
                break

        if existing_files:
            return jsonify({"success": False, "code": "PACKAGE_EXISTS", "message": "Package already exists. Please delete it first from 'Imported Packages' before uploading a new version.", "display_name": display_name, "app_slug": app_slug, "existing_files": existing_files}), 409

        success, extract_msg, extracted_manifest = extract_hds_package(temp_path, display_name)

        if not success:
            return jsonify({"success": False, "message": f"Failed to install package: {extract_msg}"}), 500

        final_path = os.path.join(user_packages_hds_folder, filename)
        shutil.move(temp_path, final_path)
        temp_path = None

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": f"Package '{display_name}' uploaded and installed successfully. Ready to configure in App Store.", "manifest": extracted_manifest, "app_slug": app_slug, "display_name": display_name})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@login_required
def install_hds_app():
    try:
        request_data = request.get_json()
        filename = request_data.get("filename")

        if not filename:
            return jsonify({"success": False, "message": "Missing filename"}), 400

        hds_path = os.path.join(user_packages_hds_folder, secure_filename(filename))

        if not os.path.exists(hds_path):
            return jsonify({"success": False, "message": "Package not found"}), 404

        is_valid, msg, manifest = validate_hds_package(hds_path)

        if not is_valid:
            return jsonify({"success": False, "message": f"Invalid package: {msg}"}), 400

        display_name = manifest.get("display_name") or manifest.get("name")
        app_slug = manifest.get("name")

        success, extract_msg, _ = extract_hds_package(hds_path, display_name)

        if not success:
            return jsonify({"success": False, "message": extract_msg}), 500

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": "App installed successfully. You can now configure and run it from the App Store.", "app_slug": app_slug, "display_name": display_name, "manifest": manifest})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def create_hds_from_files():
    try:
        if "compose" not in request.files or "icon" not in request.files:
            return jsonify({"success": False, "message": "Missing compose or icon file"}), 400

        compose_file = request.files["compose"]
        icon_file = request.files["icon"]

        app_slug = request.form.get("slug")
        display_name = request.form.get("display_name")
        category = request.form.get("category")
        app_type = request.form.get("type")
        description = request.form.get("description")
        docker_image = request.form.get("docker_image")
        author = request.form.get("author")
        version = request.form.get("version", "latest")

        if not all([app_slug, display_name, category, app_type, description, docker_image, author]):
            return jsonify({"success": False, "message": "Missing required metadata fields"}), 400

        if not compose_file.filename or not icon_file.filename:
            return jsonify({"success": False, "message": "Invalid file names"}), 400

        if not compose_file.filename.endswith((".yml", ".yaml")):
            return jsonify({"success": False, "message": "Compose file must be .yml or .yaml"}), 400

        icon_ext = os.path.splitext(icon_file.filename)[1].lower()
        if icon_ext not in ALLOWED_ICON_EXTENSIONS:
            return jsonify({"success": False, "message": "Icon must be .jpg, or .png"}), 400

        compose_content = compose_file.read().decode("utf-8")
        icon_bytes = icon_file.read()

        if len(compose_content.encode("utf-8")) > MAX_COMPOSE_FILE_SIZE:
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_COMPOSE_FILE_SIZE // (1024 * 1024))}), 400

        if len(icon_bytes) > MAX_ICON_FILE_SIZE:
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_ICON_FILE_SIZE // (1024 * 1024))}), 400

        try:
            validate_file_mime(compose_content.encode("utf-8"), compose_file.filename, allowed_types=["text/yaml"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid compose file type: {str(e)}"}), 400

        try:
            validate_file_mime(icon_bytes, icon_file.filename, allowed_types=["image/jpeg", "image/png"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid icon file type: {str(e)}"}), 400

        if not validate_slug_format(app_slug):
            return jsonify({"success": False, "message": get_error_message("INVALID_SLUG_FORMAT")}), 400

        if not validate_category(category):
            return jsonify({"success": False, "message": get_error_message("INVALID_CATEGORY", categories=", ".join(ALLOWED_CATEGORIES))}), 400

        compose_content = _inject_hd_group_labels(compose_content, app_slug)

        manifest = {"name": app_slug, "display_name": display_name, "category": category, "type": app_type, "description": description, "docker_image": docker_image, "icon": f"icon{icon_ext}", "author": author, "version": version, "hds_version": HDS_VERSION, "dependencies": [], "is_group": False, "is_new": False, "new_until": False}

        default_username = request.form.get("default_username")
        default_password = request.form.get("default_password")
        if default_username and default_password:
            manifest["default_credentials"] = {"username": default_username, "password": default_password}

        suggested_port = request.form.get("suggested_port")
        if suggested_port:
            try:
                manifest["suggested_port"] = int(suggested_port)
            except ValueError:
                pass

        suggested_trail = request.form.get("suggested_trail")
        if suggested_trail:
            manifest["suggested_trail"] = suggested_trail.strip().lstrip("/")

        manifest_content = json.dumps(manifest, indent=2)

        signature = calculate_content_hash(manifest_content, icon_bytes, compose_content)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_ref:
            zip_ref.writestr("manifest.json", manifest_content)
            zip_ref.writestr(f"icon{icon_ext}", icon_bytes)
            zip_ref.writestr("docker-compose.yml", compose_content)
            zip_ref.writestr(".hds_signature", signature)
        buffer.seek(0)

        return send_file(buffer, as_attachment=True, download_name=f"{app_slug}.hds", mimetype="application/zip")

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def get_external_apps_for_store():
    try:
        if not os.path.exists(user_packages_available_folder):
            return jsonify({"success": True, "apps": []})

        apps = []
        for filename in os.listdir(user_packages_available_folder):
            if filename.endswith(".yml.metadata"):
                app_slug = filename.replace(".yml.metadata", "")
                metadata_path = os.path.join(user_packages_available_folder, filename)

                try:
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)

                    display_name = metadata.get("display_name", metadata.get("name", app_slug))

                    icon_filename = metadata.get("icon_filename", f'{app_slug}{os.path.splitext(metadata.get("icon", ".jpg"))[1]}')

                    app_data = {"name": app_slug, "display_name": display_name, "category": metadata.get("category", "Other"), "type": metadata.get("type", "Application"), "description": metadata.get("description", ""), "docker_image": metadata.get("docker_image", ""), "picture_path": f"user-images/{icon_filename}", "icon": metadata.get("icon", "mdi:package-variant"), "is_group": metadata.get("is_group", False), "dependencies": metadata.get("dependencies", []), "is_new": False, "new_until": False, "is_external": True, "author": metadata.get("author", "Unknown"), "version": metadata.get("version", "1.0.0")}

                    default_creds = metadata.get("default_credentials")
                    if default_creds and isinstance(default_creds, dict):
                        app_data["default_credentials"] = default_creds

                    apps.append(app_data)

                except Exception as e:
                    print(f"Error reading metadata for {app_slug}: {str(e)}")
                    continue

        return jsonify({"success": True, "apps": apps})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def list_imported_apps():
    try:
        imported_apps = []

        if not os.path.exists(user_packages_available_folder):
            return jsonify({"success": True, "apps": []})

        installed_container_names = set()
        try:
            manager = DockerClientManager.get_instance()
            client = manager.get_client()
            containers = client.containers.list(all=True)
            installed_container_names = {container.name for container in containers}
        except Exception as e:
            pass

        for filename in os.listdir(user_packages_available_folder):
            if filename.endswith(".yml.metadata"):
                app_slug = filename.replace(".yml.metadata", "")
                metadata_path = os.path.join(user_packages_available_folder, filename)
                compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")

                if os.path.exists(compose_path):
                    try:
                        with open(metadata_path, "r") as f:
                            metadata = json.load(f)
                    except (json.JSONDecodeError, IOError) as e:
                        metadata = {"name": app_slug}

                    display_name = metadata.get("display_name", metadata.get("name", app_slug))

                    is_installed = app_slug in installed_container_names

                    imported_apps.append({"name": app_slug, "display_name": display_name, "metadata": metadata, "is_installed": is_installed})

        return jsonify({"success": True, "apps": imported_apps})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def export_imported_app():
    try:
        app_slug = request.args.get("app_name")

        if not app_slug:
            return jsonify({"success": False, "message": "Missing app_name"}), 400

        # HDOS00014
        if "/" in app_slug or "\\" in app_slug or ".." in app_slug:
            return jsonify({"success": False, "message": "Invalid app name"}), 400

        metadata_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml.metadata")
        compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")

        real_metadata_path = os.path.realpath(metadata_path)
        real_compose_path = os.path.realpath(compose_path)
        real_available_folder = os.path.realpath(user_packages_available_folder)

        if not real_metadata_path.startswith(real_available_folder + os.sep) or not real_compose_path.startswith(real_available_folder + os.sep):
            return jsonify({"success": False, "message": "Invalid app name"}), 400

        if not os.path.exists(metadata_path):
            return jsonify({"success": False, "message": "This app was not imported and cannot be exported"}), 403

        if not os.path.exists(compose_path):
            return jsonify({"success": False, "message": "Docker compose file not found"}), 404

        with open(metadata_path, "r") as f:
            metadata = json.load(f)

        display_name = metadata.get("display_name", metadata.get("name", app_slug))

        icon_path = None
        real_images_folder = os.path.realpath(user_packages_images_folder)

        for ext in [".jpg", ".jpeg", ".png"]:
            test_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
            real_test_path = os.path.realpath(test_path)

            if not real_test_path.startswith(real_images_folder + os.sep):
                continue

            if os.path.exists(test_path):
                icon_path = test_path
                break

        if not icon_path:
            return jsonify({"success": False, "message": "Icon file not found"}), 404

        with open(icon_path, "rb") as f:
            icon_bytes = f.read()
        icon_ext = os.path.splitext(icon_path)[1]

        with open(compose_path, "r") as f:
            compose_content = f.read()

        export_manifest = {"name": app_slug, "display_name": display_name, "category": metadata.get("category", "Other"), "type": metadata.get("type", "Application"), "description": metadata.get("description", ""), "docker_image": metadata.get("docker_image", ""), "icon": f"icon{icon_ext}", "author": metadata.get("author", "Unknown"), "version": metadata.get("version", "1.0.0"), "hds_version": HDS_VERSION, "dependencies": metadata.get("dependencies", []), "is_group": metadata.get("is_group", False), "is_new": metadata.get("is_new", False), "new_until": metadata.get("new_until", False)}

        manifest_content = json.dumps(export_manifest, indent=2)
        signature = calculate_content_hash(manifest_content, icon_bytes, compose_content)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_ref:
            zip_ref.writestr("manifest.json", manifest_content)
            zip_ref.writestr(f"icon{icon_ext}", icon_bytes)
            zip_ref.writestr("docker-compose.yml", compose_content)
            zip_ref.writestr(".hds_signature", signature)
        buffer.seek(0)

        return send_file(buffer, as_attachment=True, download_name=f"{display_name}.hds", mimetype="application/zip")

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def parse_compose():
    try:
        if "compose" not in request.files:
            return jsonify({"success": False, "message": "No compose file provided"}), 400

        compose_file = request.files["compose"]

        if not compose_file.filename:
            return jsonify({"success": False, "message": "Invalid file name"}), 400

        if not compose_file.filename.endswith((".yml", ".yaml")):
            return jsonify({"success": False, "message": "File must be .yml or .yaml"}), 400

        compose_content = compose_file.read().decode("utf-8")
        parsed_data = parse_compose_file(compose_content)

        if "error" in parsed_data and parsed_data["error"]:
            return jsonify({"success": False, "message": f"Parse error: {parsed_data['error']}"}), 400

        return jsonify({"success": True, "data": parsed_data})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def delete_external_app():
    try:
        request_data = request.get_json()
        filename = request_data.get("filename")

        if not filename:
            return jsonify({"success": False, "message": "Missing filename"}), 400

        hds_path = os.path.join(user_packages_hds_folder, secure_filename(filename))

        if not os.path.exists(hds_path):
            return jsonify({"success": False, "message": "Package not found"}), 404

        try:
            _, _, manifest = validate_hds_package(hds_path)
            app_slug = manifest.get("name") if manifest else None
        except Exception:
            app_slug = None

        if app_slug:
            try:
                manager = DockerClientManager.get_instance()
                client = manager.get_client()
                containers = client.containers.list(all=True)
                installed_container_names = {container.name for container in containers}

                if app_slug in installed_container_names:
                    return jsonify({"success": False, "message": "Cannot delete package: The app is currently installed. Please uninstall it from the App Store first."}), 409
            except Exception as e:
                pass

        os.remove(hds_path)

        if app_slug:
            # HDOS00014
            if "/" in app_slug or "\\" in app_slug or ".." in app_slug:
                invalidate_external_apps_cache()
                return jsonify({"success": True, "message": "Package deleted (cleanup skipped due to invalid app name)"})

            compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")
            real_compose_path = os.path.realpath(compose_path)
            real_available_folder = os.path.realpath(user_packages_available_folder)

            if real_compose_path.startswith(real_available_folder + os.sep) and os.path.exists(compose_path):
                os.remove(compose_path)

            metadata_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml.metadata")
            real_metadata_path = os.path.realpath(metadata_path)

            if real_metadata_path.startswith(real_available_folder + os.sep) and os.path.exists(metadata_path):
                os.remove(metadata_path)

            real_images_folder = os.path.realpath(user_packages_images_folder)
            for ext in [".jpg", ".jpeg", ".png"]:
                icon_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
                real_icon_path = os.path.realpath(icon_path)

                if real_icon_path.startswith(real_images_folder + os.sep) and os.path.exists(icon_path):
                    os.remove(icon_path)
                    break

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": "Package and all associated files deleted successfully"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def export_hdstore():
    try:
        apps_param = request.args.get("apps", "")
        if not apps_param:
            return jsonify({"success": False, "message": "No apps selected"}), 400

        app_slugs = [s.strip() for s in apps_param.split(",") if s.strip()]
        if not app_slugs:
            return jsonify({"success": False, "message": "No apps selected"}), 400

        os.makedirs(user_packages_hds_folder, exist_ok=True)
        real_hds_folder = os.path.realpath(user_packages_hds_folder)
        packages_info = []

        for slug in app_slugs:
            if "/" in slug or "\\" in slug or ".." in slug:
                return jsonify({"success": False, "message": f"Invalid app name: {slug}"}), 400

            hds_path = None
            manifest_data = None

            for filename in os.listdir(user_packages_hds_folder):
                if not filename.endswith(".hds"):
                    continue
                candidate = os.path.join(user_packages_hds_folder, filename)
                real_candidate = os.path.realpath(candidate)
                if not real_candidate.startswith(real_hds_folder + os.sep):
                    continue
                is_valid, _, manifest = validate_hds_package(candidate)
                if is_valid and manifest and manifest.get("name") == slug:
                    hds_path = candidate
                    manifest_data = manifest
                    break

            if not hds_path:
                return jsonify({"success": False, "message": f"Package not found: {slug}"}), 404

            packages_info.append({"hds_path": hds_path, "filename": os.path.basename(hds_path), "manifest": manifest_data})

        store_manifest = {
            "hdstore_version": HDS_VERSION,
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "package_count": len(packages_info),
            "packages": [
                {
                    "filename": p["filename"],
                    "name": p["manifest"].get("name"),
                    "display_name": p["manifest"].get("display_name", p["manifest"].get("name")),
                    "version": p["manifest"].get("version", "1.0.0"),
                    "author": p["manifest"].get("author", "Unknown"),
                    "category": p["manifest"].get("category", "Other"),
                }
                for p in packages_info
            ],
        }

        store_manifest_content = json.dumps(store_manifest, indent=2)

        hds_files_bytes = []
        for p in packages_info:
            with open(p["hds_path"], "rb") as f:
                hds_files_bytes.append(f.read())

        hdstore_signature = calculate_hdstore_hash(store_manifest_content, hds_files_bytes)

        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("store_manifest.json", store_manifest_content)
            for i, p in enumerate(packages_info):
                zf.writestr(f"packages/{p['filename']}", hds_files_bytes[i])
            zf.writestr(".hdstore_signature", hdstore_signature)
        buffer.seek(0)

        content_hash = hashlib.sha256(buffer.getvalue()).hexdigest()[:8]
        filename = f"HomeDockOSAppStore_{content_hash}.hdstore"

        return send_file(buffer, as_attachment=True, download_name=filename, mimetype="application/zip")

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def preview_hdstore():
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename or file.filename == "":
            return jsonify({"success": False, "message": "No file selected"}), 400

        if not file.filename.endswith(".hdstore"):
            return jsonify({"success": False, "message": "File must be a .hdstore package"}), 400

        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"success": False, "message": "Invalid filename"}), 400

        file_data = file.read()

        if len(file_data) > MAX_HDSTORE_PACKAGE_SIZE:
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_HDSTORE_PACKAGE_SIZE // (1024 * 1024))}), 400

        try:
            validate_file_mime(file_data[:1024], filename, allowed_types=["application/zip"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid file type: {str(e)}"}), 400

        buffer = io.BytesIO(file_data)

        if not zipfile.is_zipfile(buffer):
            return jsonify({"success": False, "message": "Not a valid archive"}), 400

        buffer.seek(0)

        with zipfile.ZipFile(buffer, "r") as zf:
            entries = zf.namelist()

            if "store_manifest.json" not in entries:
                return jsonify({"success": False, "message": "Invalid .hdstore: missing store_manifest.json"}), 400

            if ".hdstore_signature" not in entries:
                return jsonify({"success": False, "message": "Invalid .hdstore: missing .hdstore_signature"}), 400

            allowed_prefixes = ("store_manifest.json", "packages/", ".hdstore_signature")
            for entry in entries:
                if not entry.startswith(allowed_prefixes):
                    return jsonify({"success": False, "message": f"Unexpected entry in archive: {entry}"}), 400

            store_raw = zf.read("store_manifest.json")
            if len(store_raw) > 1 * 1024 * 1024:
                return jsonify({"success": False, "message": "store_manifest.json exceeds maximum size"}), 400

            store_data = json.loads(store_raw.decode("utf-8"))

            if not isinstance(store_data, dict):
                return jsonify({"success": False, "message": "Invalid store_manifest.json format"}), 400
            if store_data.get("hdstore_version") != HDS_VERSION:
                return jsonify({"success": False, "message": "Incompatible hdstore version"}), 400

            packages_list = store_data.get("packages", [])
            if not isinstance(packages_list, list):
                return jsonify({"success": False, "message": "Invalid packages list in store_manifest.json"}), 400
            if len(packages_list) > MAX_HDSTORE_PACKAGES:
                return jsonify({"success": False, "message": f"Too many packages (max {MAX_HDSTORE_PACKAGES})"}), 400

            stored_signature = zf.read(".hdstore_signature").decode("utf-8").strip()
            store_manifest_content = store_raw.decode("utf-8")

            hds_files_bytes_for_verify = []
            for pkg_entry_verify in packages_list:
                if not isinstance(pkg_entry_verify, dict):
                    continue
                pkg_fn = pkg_entry_verify.get("filename")
                if not pkg_fn:
                    continue
                zip_path = f"packages/{pkg_fn}"
                if zip_path in entries:
                    hds_files_bytes_for_verify.append(zf.read(zip_path))

            calculated_signature = calculate_hdstore_hash(store_manifest_content, hds_files_bytes_for_verify)
            if calculated_signature != stored_signature:
                return jsonify({"success": False, "message": "Store integrity check failed. File may be corrupted or tampered with."}), 400

        return jsonify(
            {
                "success": True,
                "hdstore_version": store_data.get("hdstore_version", ""),
                "created_at": store_data.get("created_at", ""),
                "package_count": len(packages_list),
                "packages": packages_list,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def import_hdstore():
    temp_dir = None

    try:
        os.makedirs(user_packages_hds_folder, exist_ok=True)
        os.makedirs(user_packages_available_folder, exist_ok=True)
        os.makedirs(user_packages_images_folder, exist_ok=True)

        if "file" not in request.files:
            return jsonify({"success": False, "message": "No file provided"}), 400

        file = request.files["file"]
        if not file.filename or file.filename == "":
            return jsonify({"success": False, "message": "No file selected"}), 400

        if not file.filename.endswith(".hdstore"):
            return jsonify({"success": False, "message": "File must be a .hdstore package"}), 400

        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({"success": False, "message": "Invalid filename"}), 400

        file_data = file.read()

        if len(file_data) > MAX_HDSTORE_PACKAGE_SIZE:
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_HDSTORE_PACKAGE_SIZE // (1024 * 1024))}), 400

        try:
            validate_file_mime(file_data[:1024], filename, allowed_types=["application/zip"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid file type: {str(e)}"}), 400

        buffer = io.BytesIO(file_data)

        if not zipfile.is_zipfile(buffer):
            return jsonify({"success": False, "message": "Not a valid archive"}), 400

        buffer.seek(0)
        imported = []
        skipped = []
        temp_dir = tempfile.mkdtemp()
        real_temp_dir = os.path.realpath(temp_dir)
        real_hds_folder = os.path.realpath(user_packages_hds_folder)

        with zipfile.ZipFile(buffer, "r") as zf:
            entries = zf.namelist()

            if "store_manifest.json" not in entries:
                return jsonify({"success": False, "message": "Invalid .hdstore: missing store_manifest.json"}), 400

            if ".hdstore_signature" not in entries:
                return jsonify({"success": False, "message": "Invalid .hdstore: missing .hdstore_signature"}), 400

            allowed_prefixes = ("store_manifest.json", "packages/", ".hdstore_signature")
            for entry in entries:
                if not entry.startswith(allowed_prefixes):
                    return jsonify({"success": False, "message": f"Unexpected entry in archive: {entry}"}), 400

            store_raw = zf.read("store_manifest.json")
            if len(store_raw) > 1 * 1024 * 1024:
                return jsonify({"success": False, "message": "store_manifest.json exceeds maximum size"}), 400

            store_data = json.loads(store_raw.decode("utf-8"))

            if not isinstance(store_data, dict):
                return jsonify({"success": False, "message": "Invalid store_manifest.json format"}), 400
            if store_data.get("hdstore_version") != HDS_VERSION:
                return jsonify({"success": False, "message": "Incompatible hdstore version"}), 400

            packages_list = store_data.get("packages", [])
            if not isinstance(packages_list, list):
                return jsonify({"success": False, "message": "Invalid packages list in store_manifest.json"}), 400
            if len(packages_list) > MAX_HDSTORE_PACKAGES:
                return jsonify({"success": False, "message": f"Too many packages (max {MAX_HDSTORE_PACKAGES})"}), 400

            stored_signature = zf.read(".hdstore_signature").decode("utf-8").strip()
            store_manifest_content = store_raw.decode("utf-8")

            hds_files_bytes_for_verify = []
            for pkg_entry_verify in packages_list:
                if not isinstance(pkg_entry_verify, dict):
                    continue
                pkg_fn = pkg_entry_verify.get("filename")
                if not pkg_fn:
                    continue
                zip_path = f"packages/{pkg_fn}"
                if zip_path in entries:
                    hds_files_bytes_for_verify.append(zf.read(zip_path))

            calculated_signature = calculate_hdstore_hash(store_manifest_content, hds_files_bytes_for_verify)
            if calculated_signature != stored_signature:
                return jsonify({"success": False, "message": "Store integrity check failed. File may be corrupted or tampered with."}), 400

            selected_slugs_raw = request.form.get("selected_slugs")
            selected_slugs = None
            if selected_slugs_raw:
                try:
                    selected_slugs = set(json.loads(selected_slugs_raw))
                except (json.JSONDecodeError, TypeError):
                    pass

            for pkg_entry in packages_list:
                if not isinstance(pkg_entry, dict):
                    continue

                pkg_filename = pkg_entry.get("filename")
                if not pkg_filename or not isinstance(pkg_filename, str):
                    continue

                if selected_slugs is not None and pkg_entry.get("name") not in selected_slugs:
                    continue

                safe_filename = secure_filename(pkg_filename)
                if not safe_filename or not safe_filename.endswith(".hds"):
                    skipped.append({"filename": pkg_filename, "reason": "Invalid filename"})
                    continue

                zip_entry = f"packages/{pkg_filename}"
                if zip_entry not in entries:
                    skipped.append({"filename": pkg_filename, "reason": "File not found in archive"})
                    continue

                hds_temp_path = os.path.join(temp_dir, safe_filename)
                real_hds_temp = os.path.realpath(hds_temp_path)
                if not real_hds_temp.startswith(real_temp_dir + os.sep):
                    skipped.append({"filename": pkg_filename, "reason": "Path traversal detected"})
                    continue

                hds_data = zf.read(zip_entry)

                if len(hds_data) > MAX_HDS_PACKAGE_SIZE:
                    skipped.append({"filename": pkg_filename, "reason": "Package too large"})
                    continue

                try:
                    validate_file_mime(hds_data[:1024], safe_filename, allowed_types=["application/zip"])
                except ValueError:
                    skipped.append({"filename": pkg_filename, "reason": "Invalid file type"})
                    continue

                with open(hds_temp_path, "wb") as hf:
                    hf.write(hds_data)

                is_valid, msg, manifest = validate_hds_package(hds_temp_path)
                if not is_valid:
                    skipped.append({"filename": pkg_filename, "reason": msg})
                    if os.path.exists(hds_temp_path):
                        os.remove(hds_temp_path)
                    continue

                app_slug = manifest.get("name")
                if not app_slug or "/" in app_slug or "\\" in app_slug or ".." in app_slug:
                    skipped.append({"filename": pkg_filename, "reason": "Invalid package name"})
                    if os.path.exists(hds_temp_path):
                        os.remove(hds_temp_path)
                    continue

                display_name = manifest.get("display_name") or app_slug

                final_hds_path = os.path.join(user_packages_hds_folder, safe_filename)
                real_final = os.path.realpath(final_hds_path)
                if not real_final.startswith(real_hds_folder + os.sep):
                    skipped.append({"filename": pkg_filename, "reason": "Path traversal detected"})
                    if os.path.exists(hds_temp_path):
                        os.remove(hds_temp_path)
                    continue

                compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")
                if os.path.exists(final_hds_path) or os.path.exists(compose_path):
                    skipped.append({"filename": pkg_filename, "reason": "Package already exists"})
                    if os.path.exists(hds_temp_path):
                        os.remove(hds_temp_path)
                    continue

                success, extract_msg, _ = extract_hds_package(hds_temp_path, display_name)
                if not success:
                    skipped.append({"filename": pkg_filename, "reason": extract_msg})
                    if os.path.exists(hds_temp_path):
                        os.remove(hds_temp_path)
                    continue

                shutil.move(hds_temp_path, final_hds_path)
                imported.append({"filename": pkg_filename, "name": app_slug, "display_name": display_name})

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": f"Imported {len(imported)} package(s)", "imported": imported, "skipped": skipped})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


MAX_STORE_ZIP_SIZE = 500 * 1024 * 1024  # 500 MB

_PROJECT01_CATEGORY_MAP = {
    "media": "Media",
    "music": "Media",
    "video": "Media",
    "photo": "Media",
    "photos": "Media",
    "gaming": "Gaming",
    "game": "Gaming",
    "games": "Gaming",
    "social": "Social",
    "communication": "Social",
    "ai": "AI",
    "machine learning": "AI",
    "ml": "AI",
    "files": "Files & Productivity",
    "productivity": "Files & Productivity",
    "storage": "Files & Productivity",
    "backup": "Files & Productivity",
    "documents": "Files & Productivity",
    "networking": "Networking",
    "network": "Networking",
    "vpn": "Networking",
    "dns": "Networking",
    "proxy": "Networking",
    "developer tools": "Developer Tools",
    "development": "Developer Tools",
    "dev": "Developer Tools",
    "devtools": "Developer Tools",
    "web development": "Web Development",
    "web": "Web Development",
    "home": "Home & Automation",
    "automation": "Home & Automation",
    "home automation": "Home & Automation",
    "iot": "Home & Automation",
    "smart home": "Home & Automation",
}


def _inject_hd_group_labels(compose_content: str, app_slug: str) -> str:
    try:
        safe = compose_content.replace("[[", "__DBLBRK__").replace("]]", "__DBLBRK_END__")
        data = yaml.safe_load(safe)
        if not isinstance(data, dict):
            return compose_content

        services = data.get("services") or {}
        if len(services) <= 1:
            return compose_content

        main_svc_key = None
        for svc_key, svc in services.items():
            if svc_key == app_slug or (isinstance(svc, dict) and svc.get("container_name") == app_slug):
                main_svc_key = svc_key
                break
        if not main_svc_key:
            main_svc_key = next(iter(services))

        for svc_key, svc in services.items():
            if not isinstance(svc, dict):
                continue
            labels = svc.get("labels")
            if labels is None:
                labels = {}
                svc["labels"] = labels
            if isinstance(labels, dict):
                labels["HDGroup"] = app_slug
                labels["HDRole"] = "main" if svc_key == main_svc_key else "dependency"
            elif isinstance(labels, list):
                labels.append(f"HDGroup={app_slug}")
                labels.append(f"HDRole={'main' if svc_key == main_svc_key else 'dependency'}")

        result = yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)
        return result.replace("__DBLBRK__", "[[").replace("__DBLBRK_END__", "]]")
    except Exception:
        return compose_content


def _map_project01_category(raw_category: str) -> str:
    key = (raw_category or "").strip().lower()
    return _PROJECT01_CATEGORY_MAP.get(key, "Files & Productivity")


def _fetch_url_bytes(url: str, max_bytes: int = MAX_ICON_FILE_SIZE) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "HomeDockOS-Packager/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValueError(f"Remote file exceeds {max_bytes // (1024 * 1024)} MB limit")
    return data


# HDOS00018
_PH_INSTALL_PATH = "__HD_INSTALL_PATH__"
_PH_LOCAL_IP = "__HD_LOCAL_IP__"


def _clean_project01_compose(compose_content: str, app_slug: str) -> str:
    try:
        raw = compose_content
        raw = raw.replace("/DATA/AppData", _PH_INSTALL_PATH)
        raw = re.sub(r"/DATA/(\w+)", lambda m: f"{_PH_INSTALL_PATH}/{app_slug}/{m.group(1)}", raw)
        raw = raw.replace("$AppID", app_slug)
        raw = re.sub(r"\[YOUR_CASAOS_IP\]", _PH_LOCAL_IP, raw)

        data = yaml.safe_load(raw)
        if not isinstance(data, dict):
            return compose_content

        p01_meta = data.get("x-casaos") or {}
        services = data.get("services") or {}
        main_key = p01_meta.get("main") or (next(iter(services), None))

        data.pop("x-casaos", None)
        data.pop("networks", None)
        data.pop("name", None)

        new_services: dict = {}
        for svc_key, svc in services.items():
            if not isinstance(svc, dict):
                new_services[svc_key] = svc
                continue

            svc.pop("x-casaos", None)
            svc.pop("networks", None)

            if "ports" in svc and isinstance(svc["ports"], list):
                normalized = []
                for p in svc["ports"]:
                    if isinstance(p, dict):
                        target = str(p.get("target", ""))
                        published = str(p.get("published", target))
                        proto = p.get("protocol", "")
                        port_str = f"{published}:{target}"
                        if proto and proto != "tcp":
                            port_str = f"{port_str}/{proto}"
                        normalized.append(port_str)
                    else:
                        normalized.append(str(p) if p is not None else p)
                svc["ports"] = normalized

            if "volumes" in svc and isinstance(svc["volumes"], list):
                norm_vols = []
                for v in svc["volumes"]:
                    if isinstance(v, dict) and "source" in v and "target" in v:
                        vol_str = f"{v['source']}:{v['target']}"
                        if v.get("read_only"):
                            vol_str += ":ro"
                        norm_vols.append(vol_str)
                    else:
                        norm_vols.append(v)
                svc["volumes"] = norm_vols

            for empty_key in ("devices", "cap_add", "command"):
                if empty_key in svc and svc[empty_key] == []:
                    del svc[empty_key]

            if svc_key == main_key:
                svc["container_name"] = app_slug
                new_services[app_slug] = svc
            else:
                new_services[svc_key] = svc

        if main_key and main_key != app_slug:
            for svc in new_services.values():
                if not isinstance(svc, dict):
                    continue
                dep = svc.get("depends_on")
                if isinstance(dep, dict) and main_key in dep:
                    dep[app_slug] = dep.pop(main_key)
                elif isinstance(dep, list) and main_key in dep:
                    svc["depends_on"] = [app_slug if d == main_key else d for d in dep]

        data["services"] = new_services

        result = yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)

        result = result.replace(_PH_INSTALL_PATH, "[[INSTALL_PATH]]")
        result = result.replace(_PH_LOCAL_IP, "[[HD_LOCAL_IP]]")

        return result
    except Exception:
        return compose_content


def _build_hds_buffer(app_slug: str, display_name: str, category: str, description: str, docker_image: str, image_tag: str, author: str, compose_content: str, icon_bytes: bytes, icon_ext: str, suggested_port: Optional[int] = None, suggested_trail: Optional[str] = None):
    dep_names: list = []
    try:
        safe = compose_content.replace("[[", "__DBLBRK__").replace("]]", "__DBLBRK_END__")
        parsed = yaml.safe_load(safe)
        if isinstance(parsed, dict):
            for svc_key, svc in (parsed.get("services") or {}).items():
                cname = svc.get("container_name", svc_key) if isinstance(svc, dict) else svc_key
                if cname != app_slug:
                    dep_names.append(cname)
    except Exception:
        pass

    manifest = {
        "name": app_slug,
        "display_name": display_name,
        "category": category,
        "type": "Application",
        "description": description,
        "docker_image": docker_image or "unknown:latest",
        "icon": f"icon{icon_ext}",
        "author": author,
        "version": image_tag,
        "hds_version": HDS_VERSION,
        "dependencies": dep_names,
        "is_group": len(dep_names) > 0,
        "is_new": False,
        "new_until": False,
    }
    if suggested_port:
        manifest["suggested_port"] = suggested_port
    if suggested_trail:
        manifest["suggested_trail"] = suggested_trail
    compose_content = _inject_hd_group_labels(compose_content, app_slug)
    manifest_content = json.dumps(manifest, indent=2)
    signature = calculate_content_hash(manifest_content, icon_bytes, compose_content)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("manifest.json", manifest_content)
        zf.writestr(f"icon{icon_ext}", icon_bytes)
        zf.writestr("docker-compose.yml", compose_content)
        zf.writestr(".hds_signature", signature)
    buf.seek(0)
    return buf, manifest


def _parse_project01_compose(compose_content: str):
    try:
        compose_data = yaml.safe_load(compose_content)
    except yaml.YAMLError:
        return None
    if not isinstance(compose_data, dict):
        return None

    p01 = compose_data.get("x-casaos") or {}
    if not p01:
        return None

    services = compose_data.get("services") or {}
    main_key = p01.get("main") or (next(iter(services), None))
    main_service = services.get(main_key, {}) if main_key else {}

    def _loc(field):
        val = p01.get(field)
        if isinstance(val, dict):
            return val.get("en_us") or next(iter(val.values()), "") or ""
        return str(val) if val else ""

    raw_title = _loc("title") or compose_data.get("name") or main_key or "app"
    raw_description = _loc("description") or _loc("tagline") or "No description provided."
    raw_author = p01.get("author") or p01.get("developer") or "Unknown"
    raw_category = p01.get("category") or ""
    icon_url = p01.get("icon") or p01.get("thumbnail") or ""

    docker_image = main_service.get("image") or ""
    if not docker_image and services:
        docker_image = next(iter(services.values()), {}).get("image", "")

    image_tag = "latest"
    if ":" in (docker_image or ""):
        image_tag = docker_image.split(":")[-1]

    suggested_port = None
    is_host_network = main_service.get("network_mode") == "host"
    if is_host_network:
        raw_port_map = str(p01.get("port_map", "")).strip()
        if raw_port_map:
            try:
                suggested_port = int(raw_port_map)
            except ValueError:
                pass

    return {
        "slug": normalize_app_slug(raw_title),
        "display_name": raw_title.strip(),
        "description": (raw_description[:127].strip() + "...") if len(raw_description) > 130 else raw_description.strip(),
        "author": str(raw_author).strip(),
        "category": _map_project01_category(raw_category),
        "docker_image": docker_image,
        "image_tag": image_tag,
        "icon_url": icon_url,
        "suggested_port": suggested_port,
    }


def _install_hds_from_buffer(hds_bytes: bytes, filename: str) -> dict:
    temp_path = None
    try:
        os.makedirs(user_packages_hds_folder, exist_ok=True)
        os.makedirs(user_packages_available_folder, exist_ok=True)
        os.makedirs(user_packages_images_folder, exist_ok=True)

        temp_path = os.path.join(tempfile.gettempdir(), filename)
        with open(temp_path, "wb") as f:
            f.write(hds_bytes)

        is_valid, msg, manifest = validate_hds_package(temp_path)
        if not is_valid:
            return {"ok": False, "reason": msg}

        app_slug = manifest.get("name")
        display_name = manifest.get("display_name") or app_slug

        final_path = os.path.join(user_packages_hds_folder, filename)
        compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")
        if os.path.exists(final_path) or os.path.exists(compose_path):
            return {"ok": False, "reason": "already_exists", "slug": app_slug, "display_name": display_name}

        success, extract_msg, _ = extract_hds_package(temp_path, display_name)
        if not success:
            return {"ok": False, "reason": extract_msg}

        shutil.move(temp_path, final_path)
        temp_path = None

        return {"ok": True, "slug": app_slug, "display_name": display_name}

    except Exception as e:
        return {"ok": False, "reason": str(e)}

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


_TRANSPARENT_PNG = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01" b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01" b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

_third_party_cache: Dict[str, dict] = {}
_THIRD_PARTY_CACHE_TTL = 600  # 10m


def _evict_third_party_cache():
    now = datetime.datetime.now(datetime.timezone.utc).timestamp()
    expired = [k for k, v in _third_party_cache.items() if now - v["ts"] > _THIRD_PARTY_CACHE_TTL]
    for k in expired:
        _third_party_cache.pop(k, None)


def _fetch_third_party_apps(url: str) -> List[dict]:
    apps = []

    if not url.lower().endswith(".zip"):
        raise ValueError("URL must point to a .zip archive")

    zip_bytes = _fetch_url_bytes(url, MAX_STORE_ZIP_SIZE)
    if not zipfile.is_zipfile(io.BytesIO(zip_bytes)):
        raise ValueError("URL did not return a valid ZIP file")

    seen_slugs: set = set()

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as store_zip:
        all_names = set(store_zip.namelist())
        compose_entries = [name for name in all_names if name.endswith("docker-compose.yml") and not name.startswith("__MACOSX")]

        for compose_entry in compose_entries:
            if len(apps) >= MAX_HDSTORE_PACKAGES:
                break

            try:
                compose_content = store_zip.read(compose_entry).decode("utf-8")
            except Exception:
                continue

            meta = _parse_project01_compose(compose_content)
            if not meta:
                continue

            app_slug = meta["slug"]
            if not app_slug or app_slug in seen_slugs:
                continue
            seen_slugs.add(app_slug)

            compose_content = _clean_project01_compose(compose_content, app_slug)

            app_dir = compose_entry.rsplit("/", 1)[0] + "/"
            local_icon = None
            local_ext = None
            for ext in ALLOWED_ICON_EXTENSIONS:
                candidate = app_dir + "icon" + ext
                if candidate in all_names:
                    try:
                        local_icon = store_zip.read(candidate)
                        local_ext = ext
                        break
                    except Exception:
                        pass

            if local_icon:
                icon_bytes, icon_ext = local_icon, local_ext
            else:
                icon_bytes, icon_ext = _resolve_icon(None, meta["icon_url"])

            apps.append({**meta, "compose_content": compose_content, "icon_bytes": icon_bytes, "icon_ext": icon_ext})

    return apps


def _resolve_icon(icon_bytes: Optional[bytes], icon_url: str) -> tuple:
    icon_ext = ".png"
    if not icon_bytes and icon_url:
        try:
            icon_bytes = _fetch_url_bytes(icon_url, MAX_ICON_FILE_SIZE)
            ext = os.path.splitext(urllib.parse.urlparse(icon_url).path)[1].lower()
            if ext in ALLOWED_ICON_EXTENSIONS:
                icon_ext = ext
        except Exception:
            icon_bytes = None
    if not icon_bytes:
        icon_bytes = _TRANSPARENT_PNG
        icon_ext = ".png"
    return icon_bytes, icon_ext


@login_required
def preview_third_party_url():
    try:
        body = request.get_json(silent=True) or {}
        url = (body.get("url") or "").strip()

        if not url:
            return jsonify({"success": False, "message": "Missing URL"}), 400

        parsed = urllib.parse.urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return jsonify({"success": False, "message": "URL must use http or https"}), 400

        _evict_third_party_cache()

        apps = _fetch_third_party_apps(url)
        if not apps:
            return jsonify({"success": False, "message": "No valid apps found at this URL"}), 400

        existing_files = set()
        if os.path.exists(user_packages_available_folder):
            for f in os.listdir(user_packages_available_folder):
                if f.endswith(".yml"):
                    existing_files.add(f.replace(".yml", ""))

        cache_id = hashlib.sha256(f"{url}:{datetime.datetime.now(datetime.timezone.utc).isoformat()}".encode()).hexdigest()[:16]
        _third_party_cache[cache_id] = {"apps": apps, "ts": datetime.datetime.now(datetime.timezone.utc).timestamp()}

        packages = []
        for app in apps:
            packages.append(
                {
                    "name": app["slug"],
                    "display_name": app["display_name"],
                    "author": app["author"],
                    "category": app["category"],
                    "version": app["image_tag"],
                    "docker_image": app["docker_image"],
                    "already_exists": app["slug"] in existing_files,
                }
            )

        return jsonify(
            {
                "success": True,
                "cache_id": cache_id,
                "package_count": len(packages),
                "packages": packages,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def import_third_party_selected():
    try:
        body = request.get_json(silent=True) or {}
        cache_id = (body.get("cache_id") or "").strip()
        selected_slugs = body.get("slugs") or []

        if not cache_id or cache_id not in _third_party_cache:
            return jsonify({"success": False, "message": "Preview expired. Please fetch the URL again."}), 410

        if not selected_slugs:
            return jsonify({"success": False, "message": "No apps selected"}), 400

        cached = _third_party_cache.pop(cache_id)
        apps_by_slug = {app["slug"]: app for app in cached["apps"]}

        imported = []
        skipped = []

        for slug in selected_slugs:
            app = apps_by_slug.get(slug)
            if not app:
                skipped.append({"name": slug, "reason": "Not found in preview"})
                continue

            try:
                hds_buf, _ = _build_hds_buffer(
                    app_slug=app["slug"],
                    display_name=app["display_name"],
                    category=app["category"],
                    description=app["description"],
                    docker_image=app["docker_image"],
                    image_tag=app["image_tag"],
                    author=app["author"],
                    compose_content=app["compose_content"],
                    icon_bytes=app["icon_bytes"],
                    icon_ext=app["icon_ext"],
                    suggested_port=app.get("suggested_port"),
                )
                result = _install_hds_from_buffer(hds_buf.read(), f"{slug}.hds")
                if result["ok"]:
                    imported.append(app["display_name"])
                else:
                    skipped.append({"name": app["display_name"], "reason": result.get("reason", "unknown")})
            except Exception as e:
                skipped.append({"name": slug, "reason": str(e)})

        if not imported and not skipped:
            return jsonify({"success": False, "message": "Nothing to import"}), 400

        invalidate_external_apps_cache()
        return jsonify(
            {
                "success": True,
                "imported": len(imported),
                "skipped": len(skipped),
                "apps": imported,
                "skipped_apps": skipped,
            }
        )

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@login_required
def migrate_single_compose():
    try:
        body = request.get_json(silent=True) or {}
        url = (body.get("url") or "").strip()
        compose_content = (body.get("compose_content") or "").strip()

        if not url and not compose_content:
            return jsonify({"success": False, "message": "Missing URL or compose content"}), 400

        if not compose_content:
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme not in ("http", "https"):
                return jsonify({"success": False, "message": "URL must use http or https"}), 400

            try:
                compose_bytes = _fetch_url_bytes(url, MAX_COMPOSE_FILE_SIZE)
            except Exception as e:
                return jsonify({"success": False, "message": f"Could not fetch compose file: {e}"}), 400

            try:
                compose_content = compose_bytes.decode("utf-8")
            except UnicodeDecodeError:
                return jsonify({"success": False, "message": "Compose file is not valid UTF-8"}), 400

        meta = _parse_project01_compose(compose_content)
        if not meta:
            return jsonify({"success": False, "message": "No compatible metadata found in compose file"}), 400

        compose_content = _clean_project01_compose(compose_content, meta["slug"])

        icon_bytes, icon_ext = _resolve_icon(None, meta["icon_url"])

        hds_buf, _ = _build_hds_buffer(
            app_slug=meta["slug"],
            display_name=meta["display_name"],
            category=meta["category"],
            description=meta["description"],
            docker_image=meta["docker_image"],
            image_tag=meta["image_tag"],
            author=meta["author"],
            compose_content=compose_content,
            icon_bytes=icon_bytes,
            icon_ext=icon_ext,
            suggested_port=meta.get("suggested_port"),
        )

        result = _install_hds_from_buffer(hds_buf.read(), f"{meta['slug']}.hds")
        if not result["ok"]:
            if result.get("reason") == "already_exists":
                return jsonify({"success": False, "message": f"'{result['display_name']}' is already imported"}), 409
            return jsonify({"success": False, "message": result.get("reason", "Unknown error")}), 500

        invalidate_external_apps_cache()
        return jsonify({"success": True, "app": result["display_name"]})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
