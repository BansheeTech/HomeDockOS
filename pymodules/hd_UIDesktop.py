"""
hd_UIDesktop.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

from flask import render_template, g
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config

from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_FunctionsGlobals import version, version_hash, current_year

from pymodules.hd_FunctionsMain import get_total_containers, get_active_containers
from pymodules.hd_FunctionsMain import actual_uptime, get_server_uptime
from pymodules.hd_FunctionsMain import get_cpu_max_speed, get_cpu_cores, get_total_ram
from pymodules.hd_FunctionsMain import get_active_network_interface
from pymodules.hd_FunctionsMain import get_total_disk, get_configured_external_drives, get_total_external_disk

from pymodules.hd_LogCPUTemp import get_cpu_temp
from pymodules.hd_LogCPUUsage import get_cpu_usage
from pymodules.hd_LogRAMUsage import get_ram_usage
from pymodules.hd_LogNetworkUsage import get_download_data, get_upload_data
from pymodules.hd_LogDiskUsage import get_disk_usage
from pymodules.hd_LogExternalDiskUsage import get_external_disk_usage


@login_required
def desktop():
    config = read_config()
    user_name = config["user_name"]
    interface_name = get_active_network_interface()
    external_disk_device = get_configured_external_drives()
    external_path = external_disk_device[0] if external_disk_device else None
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]

    run_port = config["run_port"]
    dynamic_dns = config["dynamic_dns"]
    local_dns = config["local_dns"]
    run_on_development = config["run_on_development"]
    disable_usage_data = config["disable_usage_data"]
    delete_old_image_containers_after_update = config["delete_old_image_containers_after_update"]
    delete_old_image_containers_after_uninstall = config["delete_old_image_containers_after_uninstall"]
    delete_internal_data_volumes = config["delete_internal_data_volumes"]
    default_external_drive = config["default_external_drive"]

    download_gb = get_download_data(interface_name)["received"]
    upload_gb = get_upload_data(interface_name)["sent"]
    vdownload_formatted = f"{download_gb} GB" if download_gb is not None else "0 GB"
    vupload_formatted = f"{upload_gb} GB" if upload_gb is not None else "0 GB"

    return render_template(
        "desktop.html",
        user_name=user_name,
        selected_theme=selected_theme,
        selected_back=selected_back,
        run_port=run_port,
        dynamic_dns=dynamic_dns,
        local_dns=local_dns,
        run_on_development=run_on_development,
        disable_usage_data=disable_usage_data,
        delete_old_image_containers_after_update=delete_old_image_containers_after_update,
        delete_old_image_containers_after_uninstall=delete_old_image_containers_after_uninstall,
        delete_internal_data_volumes=delete_internal_data_volumes,
        default_external_drive=default_external_drive,
        version=version,
        version_hash=version_hash,
        year=current_year,
        local_ip=local_ip,
        internet_ip=internet_ip,
        interface_name=interface_name,
        vdownload=vdownload_formatted,
        vupload=vupload_formatted,
        n_total_containers=get_total_containers(),
        n_active_containers=get_active_containers(),
        uptime_data=actual_uptime(),
        start_time=get_server_uptime(),
        cpu_temp=get_cpu_temp(),
        cpu_usage=get_cpu_usage(),
        cpu_cores=get_cpu_cores(),
        get_cpu_max_speed=get_cpu_max_speed(),
        ram_usage=get_ram_usage(),
        total_ram=get_total_ram(),
        hard_disk_usage=get_disk_usage(),
        hard_disk_total=get_total_disk(),
        external_disk_usage=get_external_disk_usage(),
        external_disk_total=get_total_external_disk(),
        external_default_disk=get_configured_external_drives(),
        external_path=external_path,
        nonce=g.get("nonce", ""),
    )
