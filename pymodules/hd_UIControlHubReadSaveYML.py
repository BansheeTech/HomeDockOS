"""
hd_UIControlHubReadSaveYML.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import yaml

from flask import jsonify, request
from flask_login import login_required

from pymodules.hd_FunctionsGlobals import current_directory


@login_required
def get_compose_info():

    containerName = request.args.get("containerName")
    path_to_yml_files = os.path.join(current_directory, "compose-link")
    yml_file_path = os.path.join(path_to_yml_files, f"{containerName}.yml")

    if not os.path.exists(yml_file_path):
        return jsonify({"success": False, "message": "Container not found"}), 404

    with open(yml_file_path, "r") as file:
        try:
            yml_data = yaml.safe_load(file)
        except yaml.YAMLError:
            return jsonify({"success": False, "message": "Invalid YML"}), 500

        is_group = any("HDGroup" in service_data.get("labels", {}) for service_data in yml_data.get("services", {}).values())

        main_service_name = None
        main_service_data = None
        hd_group = None
        hd_role = None

        dependencies = []
        if is_group:

            for service_name, service_data in yml_data.get("services", {}).items():
                if service_data.get("labels", {}).get("HDRole") == "main":
                    main_service_name = service_name
                    main_service_data = service_data
                    hd_group = service_data.get("labels", {}).get("HDGroup")
                    hd_role = service_data.get("labels", {}).get("HDRole")
                    break

            for service_name, service_data in yml_data.get("services", {}).items():
                if service_data.get("labels", {}).get("HDRole") == "dependency":
                    dependencies.append(service_name)

            if main_service_name is None or main_service_data is None:
                return jsonify({"success": False, "message": "Main container not found in group"}), 404
        else:

            main_service_name, main_service_data = next(iter(yml_data.get("services", {}).items()), (None, None))

        if main_service_name is None or main_service_data is None:
            return jsonify({"success": False, "message": "No service data found"}), 404

        yml_data_copy = yml_data.copy()

        return jsonify({"success": True, "data": {"ymlContent": yaml.dump(yml_data_copy), "dependencies": dependencies, "hd_group": hd_group, "hd_role": hd_role}})


@login_required
def update_yml_config():
    containerName = request.json.get("containerName")
    ymlContent = request.json.get("ymlContent")
    path_to_yml_files = os.path.join(current_directory, "compose-link")
    yml_file_path = os.path.join(path_to_yml_files, f"{containerName}.yml")

    if not os.path.exists(yml_file_path):
        return jsonify({"success": False, "message": "Application not installed."}), 404

    try:
        yml_data = yaml.safe_load(ymlContent)
        if not isinstance(yml_data, dict):
            raise yaml.YAMLError("YML content must be a dictionary at the root level.")
    except yaml.YAMLError as e:
        return jsonify({"success": False, "message": f"Invalid YML content: {str(e)}"}), 400

    with open(yml_file_path, "w") as file:
        yaml.dump(yml_data, file)

    return jsonify({"success": True, "message": "YML updated successfully"})
