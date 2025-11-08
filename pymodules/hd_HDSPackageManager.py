"""
hd_HDSPackageManager.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import json
import yaml
import shutil
import hashlib
import zipfile
import tempfile

from typing import Dict, Tuple, Optional, List
from flask import jsonify, request, send_file
from flask_login import login_required
from werkzeug.utils import secure_filename

from pymodules.hd_FunctionsGlobals import (
    current_directory,
    user_packages_hds_folder,
    user_packages_images_folder,
    user_packages_available_folder,
)
from pymodules.hd_ComposeDevHooks import extract_devhook_placeholders, DEVHOOK_PLACEHOLDERS
from pymodules.hd_DockerAPIContainerData import invalidate_external_apps_cache
from pymodules.hd_ClassDockerClientManager import DockerClientManager
from pymodules.hd_MIMETypeValidation import validate_file_mime


MAX_HDS_PACKAGE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_COMPOSE_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_ICON_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

ALLOWED_ICON_EXTENSIONS = [".jpg", ".jpeg", ".png"]

HDS_VERSION = "1.0"

ALLOWED_CATEGORIES = ["Media", "Files & Productivity", "Networking", "Home & Automation", "Social", "Gaming", "Security", "Development", "Databases", "Monitoring", "Other"]

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

    slug = name.lower().replace(" ", "")
    slug = re.sub(r"[^a-z0-9\-_]", "", slug)

    if not slug:
        raise ValueError(f"Name '{name}' results in empty slug after normalization")

    return slug


def validate_slug_format(slug: str) -> bool:
    if not slug:
        return False

    if slug != slug.lower():
        return False

    if not re.match(r"^[a-z0-9\-_]+$", slug):
        return False

    if slug[0] in ["-", "_"] or slug[-1] in ["-", "_"]:
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


def ensure_external_dir():
    os.makedirs(user_packages_hds_folder, exist_ok=True)
    os.makedirs(user_packages_images_folder, exist_ok=True)
    os.makedirs(user_packages_available_folder, exist_ok=True)


def cleanup_partial_installation(app_slug: str, apps_folder: str) -> None:
    try:
        # HDOS00013
        if "/" in app_slug or "\\" in app_slug or ".." in app_slug:
            return

        compose_path = os.path.join(apps_folder, f"{app_slug}.yml")
        real_compose_path = os.path.realpath(compose_path)
        real_apps_folder = os.path.realpath(apps_folder)

        if real_compose_path.startswith(real_apps_folder) and os.path.exists(compose_path):
            os.remove(compose_path)

        metadata_path = os.path.join(apps_folder, f"{app_slug}.yml.metadata")
        real_metadata_path = os.path.realpath(metadata_path)

        if real_metadata_path.startswith(real_apps_folder) and os.path.exists(metadata_path):
            os.remove(metadata_path)

        real_images_folder = os.path.realpath(user_packages_images_folder)
        for ext in ALLOWED_ICON_EXTENSIONS:
            icon_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
            real_icon_path = os.path.realpath(icon_path)

            if real_icon_path.startswith(real_images_folder) and os.path.exists(icon_path):
                os.remove(icon_path)
                break

    except Exception as e:
        pass


def calculate_content_hash(manifest_content: str, icon_bytes: bytes, compose_content: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(manifest_content.encode("utf-8"))
    hasher.update(icon_bytes)
    hasher.update(compose_content.encode("utf-8"))
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

    ensure_external_dir()

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

            compose_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml")

            compose_path_real = os.path.realpath(compose_path)
            available_real = os.path.realpath(user_packages_available_folder)
            if not compose_path_real.startswith(available_real):
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
            if not icon_dest_real.startswith(images_dir_real):
                raise ValueError(get_error_message("UNSAFE_PATH", path=icon_dest))

            with open(icon_dest, "wb") as f:
                f.write(icon_bytes)

        if "display_name" not in manifest or not manifest["display_name"]:
            manifest["display_name"] = fallback_display_name

        manifest["slug"] = app_slug
        manifest["icon_filename"] = f"{app_slug}{icon_ext}"

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
    ensure_external_dir()

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
    ensure_external_dir()

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not file.filename.endswith(".hds"):
        return jsonify({"success": False, "message": "File must be a .hds package"}), 400

    try:
        filename = secure_filename(file.filename)
        temp_path = os.path.join(tempfile.gettempdir(), filename)
        file.save(temp_path)

        file_size = os.path.getsize(temp_path)
        if file_size > MAX_HDS_PACKAGE_SIZE:
            os.remove(temp_path)
            return jsonify({"success": False, "message": get_error_message("FILE_TOO_LARGE", max_size=MAX_HDS_PACKAGE_SIZE // (1024 * 1024))}), 400

        with open(temp_path, "rb") as f:
            file_content = f.read(1024)

        try:
            validate_file_mime(file_content, filename, allowed_types=["application/zip"])
        except ValueError as e:
            os.remove(temp_path)
            return jsonify({"success": False, "message": f"Invalid file type: {str(e)}"}), 400

        is_valid, msg, manifest = validate_hds_package(temp_path)

        if not is_valid:
            os.remove(temp_path)
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
            os.remove(temp_path)
            return jsonify({"success": False, "code": "PACKAGE_EXISTS", "message": "Package already exists. Please delete it first from 'Imported Packages' before uploading a new version.", "display_name": display_name, "app_slug": app_slug, "existing_files": existing_files}), 409

        success, extract_msg, extracted_manifest = extract_hds_package(temp_path, display_name)

        if not success:
            os.remove(temp_path)
            return jsonify({"success": False, "message": f"Failed to install package: {extract_msg}"}), 500

        final_path = os.path.join(user_packages_hds_folder, filename)
        shutil.move(temp_path, final_path)

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": f"Package '{display_name}' uploaded and installed successfully. Ready to configure in App Store.", "manifest": extracted_manifest, "app_slug": app_slug, "display_name": display_name})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


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

        # Validar tipo MIME del compose file (debe ser YAML/texto)
        try:
            validate_file_mime(compose_content.encode("utf-8"), compose_file.filename, allowed_types=["text/yaml"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid compose file type: {str(e)}"}), 400

        # Validar tipo MIME del icono (debe ser imagen: JPG o PNG)
        try:
            validate_file_mime(icon_bytes, icon_file.filename, allowed_types=["image/jpeg", "image/png"])
        except ValueError as e:
            return jsonify({"success": False, "message": f"Invalid icon file type: {str(e)}"}), 400

        if not validate_slug_format(app_slug):
            return jsonify({"success": False, "message": get_error_message("INVALID_SLUG_FORMAT")}), 400

        if not validate_category(category):
            return jsonify({"success": False, "message": get_error_message("INVALID_CATEGORY", categories=", ".join(ALLOWED_CATEGORIES))}), 400

        manifest = {"name": app_slug, "display_name": display_name, "category": category, "type": app_type, "description": description, "docker_image": docker_image, "icon": f"icon{icon_ext}", "author": author, "version": version, "hds_version": HDS_VERSION, "dependencies": [], "is_group": False, "is_new": False, "new_until": False}

        manifest_content = json.dumps(manifest, indent=2)

        signature = calculate_content_hash(manifest_content, icon_bytes, compose_content)

        temp_hds_path = os.path.join(tempfile.gettempdir(), f"{app_slug}.hds")

        with zipfile.ZipFile(temp_hds_path, "w", zipfile.ZIP_DEFLATED) as zip_ref:
            zip_ref.writestr("manifest.json", manifest_content)
            zip_ref.writestr(f"icon{icon_ext}", icon_bytes)
            zip_ref.writestr("docker-compose.yml", compose_content)
            zip_ref.writestr(".hds_signature", signature)

        return send_file(temp_hds_path, as_attachment=True, download_name=f"{app_slug}.hds", mimetype="application/zip")

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

        if not real_metadata_path.startswith(real_available_folder) or not real_compose_path.startswith(real_available_folder):
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

            if not real_test_path.startswith(real_images_folder):
                continue

            if os.path.exists(test_path):
                icon_path = test_path
                break

        if not icon_path:
            return jsonify({"success": False, "message": "Icon file not found"}), 404

        temp_hds_path = os.path.join(tempfile.gettempdir(), f"{app_slug}.hds")

        success, msg = create_hds_package(app_slug, display_name, temp_hds_path, metadata, icon_path, compose_path)

        if not success:
            return jsonify({"success": False, "message": msg}), 500

        return send_file(temp_hds_path, as_attachment=True, download_name=f"{display_name}.hds", mimetype="application/zip")

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
        except:
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

            if real_compose_path.startswith(real_available_folder) and os.path.exists(compose_path):
                os.remove(compose_path)

            metadata_path = os.path.join(user_packages_available_folder, f"{app_slug}.yml.metadata")
            real_metadata_path = os.path.realpath(metadata_path)

            if real_metadata_path.startswith(real_available_folder) and os.path.exists(metadata_path):
                os.remove(metadata_path)

            real_images_folder = os.path.realpath(user_packages_images_folder)
            for ext in [".jpg", ".jpeg", ".png"]:
                icon_path = os.path.join(user_packages_images_folder, f"{app_slug}{ext}")
                real_icon_path = os.path.realpath(icon_path)

                if real_icon_path.startswith(real_images_folder) and os.path.exists(icon_path):
                    os.remove(icon_path)
                    break

        invalidate_external_apps_cache()

        return jsonify({"success": True, "message": "Package and all associated files deleted successfully"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
