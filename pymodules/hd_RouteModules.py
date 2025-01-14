"""
hd_RouteModules.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

from pymodules.hd_FunctionsHandleCSRFToken import CSRF_Protect


def RouteAllModules(homedock_www, send_public_key):

    from pymodules.hd_UILogin import login_pwd_encrypt, login_page, api_login, login_manager, load_user

    homedock_www.add_url_rule("/", "login_page", login_page, methods=["GET"])
    homedock_www.add_url_rule("/login", "api_login", CSRF_Protect(api_login), methods=["POST"])
    homedock_www.add_url_rule("/api/pksend", "send_public_key", CSRF_Protect(send_public_key), methods=["GET"])
    homedock_www.add_url_rule("/api/pcrypt", "login_pwd_encrypt", CSRF_Protect(login_pwd_encrypt), methods=["POST"])
    login_manager.init_app(homedock_www)
    login_manager.user_loader(load_user)

    from pymodules.hd_UILogout import logout

    homedock_www.add_url_rule("/logout", "logout", CSRF_Protect(logout), methods=["POST"])

    from pymodules.hd_UIDashboard import dashboard

    homedock_www.add_url_rule("/dashboard", "dashboard", dashboard)

    from pymodules.hd_UIControlHub import controlhub

    homedock_www.add_url_rule("/control-hub", "control-hub", controlhub)

    from pymodules.hd_UIDropzone import dropzone, list_files, upload_file, download_file, delete_file

    homedock_www.add_url_rule("/dropzone", "dropzone", dropzone)
    homedock_www.add_url_rule("/api/get_files", "list_files", CSRF_Protect(list_files), methods=["GET"])
    homedock_www.add_url_rule("/api/upload_file", "upload_file", CSRF_Protect(upload_file), methods=["POST"])
    homedock_www.add_url_rule("/api/download_file", "download_file", CSRF_Protect(download_file), methods=["GET"])
    homedock_www.add_url_rule("/api/delete_file", "delete_file", CSRF_Protect(delete_file), methods=["POST"])

    from pymodules.hd_UIAppStore import appstore

    homedock_www.add_url_rule("/app-store", "app-store", appstore)

    from pymodules.hd_UISystemLogs import system_logs

    homedock_www.add_url_rule("/system-logs", "#CSP_EVAL_SYSLOGS", system_logs)

    from pymodules.hd_UISettings import homedocksettings, api_save_settings

    homedock_www.add_url_rule("/settings", "settings", homedocksettings)
    homedock_www.add_url_rule("/api/save_settings", "save_settings", CSRF_Protect(api_save_settings), methods=["POST"])

    from pymodules.hd_UILimited import limited

    homedock_www.add_url_rule("/limited", "limited", limited)

    from pymodules.hd_UIShieldMode import shieldmode

    homedock_www.add_url_rule("/shieldmode", "shieldmode", shieldmode)

    from pymodules.hd_UIFileDelivery import send_static_images, send_static_favicon, send_static_audio, send_src_static, send_src_dist

    homedock_www.add_url_rule("/images/<path:path>", "send_static_images", send_static_images)
    homedock_www.add_url_rule("/favicon/<path:path>", "send_static_favicon", send_static_favicon)
    homedock_www.add_url_rule("/audio/<path:path>", "send_static_audio", send_static_audio)
    homedock_www.add_url_rule("/homedock-ui/vue3/static/<path:path>", "send_src_static", send_src_static)
    homedock_www.add_url_rule("/homedock-ui/vue3/dist/<path:path>", "send_src_dist", send_src_dist)

    from pymodules.hd_LogServeFiles import serve_temperature, serve_ram_usage, serve_cpu_usage, serve_disk_usage, serve_external_disk_usage, serve_network_usage, serve_logins

    homedock_www.add_url_rule("/api/system-logs/serve_logins", "serve_logins", CSRF_Protect(serve_logins), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_temperature", "serve_temperature", CSRF_Protect(serve_temperature), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_cpu_usage", "serve_cpu_usage", CSRF_Protect(serve_cpu_usage), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_ram_usage", "serve_ram_usage", CSRF_Protect(serve_ram_usage), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_network_usage", "serve_network_usage", CSRF_Protect(serve_network_usage), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_disk_usage", "serve_disk_usage", CSRF_Protect(serve_disk_usage), methods=["GET"])
    homedock_www.add_url_rule("/api/system-logs/serve_external_disk_usage", "serve_external_disk_usage", CSRF_Protect(serve_external_disk_usage), methods=["GET"])

    from pymodules.hd_UIDashboardPortRouting import port_route_function

    homedock_www.add_url_rule("/api/port_route", "port_route", CSRF_Protect(port_route_function), methods=["POST"])

    from pymodules.hd_UIControlHubViewLogs import view_container_logs

    homedock_www.add_url_rule("/api/view-container-logs", "view_container_logs", CSRF_Protect(view_container_logs), methods=["GET"])

    from pymodules.hd_UIControlHubReadSaveYML import get_compose_info, update_yml_config

    homedock_www.add_url_rule("/api/get-compose-info", "get_compose_info", CSRF_Protect(get_compose_info), methods=["GET"])
    homedock_www.add_url_rule("/api/update-yml-config", "update_yml_config", CSRF_Protect(update_yml_config), methods=["POST"])

    from pymodules.hd_UIControlHubRecreateContainer import recreate_container

    homedock_www.add_url_rule("/api/recreate-container", "recreate_container", CSRF_Protect(recreate_container), methods=["POST"])

    from pymodules.hd_UIAppStoreReadSaveYML import get_appstore_info, process_config

    homedock_www.add_url_rule("/api/get-appstore-info", "get_appstore_info", CSRF_Protect(get_appstore_info), methods=["GET"])
    homedock_www.add_url_rule("/api/process-config", "process_config", CSRF_Protect(process_config), methods=["POST"])

    from pymodules.hd_UIAppStoreInstallApp import app_store_install_container, get_installation_status

    homedock_www.add_url_rule("/api/app-store-install-container", "app_store_install_container", CSRF_Protect(app_store_install_container), methods=["POST"])
    homedock_www.add_url_rule("/api/get-installation-status", "get_installation_status", CSRF_Protect(get_installation_status), methods=["GET"])

    from pymodules.hd_UIControlHubUploadFile import upload_compose_file

    homedock_www.add_url_rule("/api/upload_compose_file", "upload_compose_file", CSRF_Protect(upload_compose_file), methods=["POST"])

    from pymodules.hd_UIDashboardThreads import online_status

    homedock_www.add_url_rule("/thread/online_status", "online_status", CSRF_Protect(online_status), methods=["GET"])

    from pymodules.hd_UIDashboardThreads import homedock_cpu_temp, homedock_cpu_usage, homedock_ram_usage, homedock_disk_usage, homedock_external_disk_usage

    homedock_www.add_url_rule("/thread/update_cpu_temp", "homedock_cpu_temp", CSRF_Protect(homedock_cpu_temp))
    homedock_www.add_url_rule("/thread/update_cpu_usage", "homedock_cpu_usage", CSRF_Protect(homedock_cpu_usage))
    homedock_www.add_url_rule("/thread/update_ram_usage", "homedock_ram_usage", CSRF_Protect(homedock_ram_usage))
    homedock_www.add_url_rule("/thread/update_disk_usage", "homedock_disk_usage", CSRF_Protect(homedock_disk_usage))
    homedock_www.add_url_rule("/thread/update_external_disk_usage", "homedock_external_disk_usage", CSRF_Protect(homedock_external_disk_usage))

    from pymodules.hd_UIDashboardThreads import downloaded_data, uploaded_data

    homedock_www.add_url_rule("/thread/downloaded_data", "downloaded_data", CSRF_Protect(downloaded_data))
    homedock_www.add_url_rule("/thread/uploaded_data", "uploaded_data", CSRF_Protect(uploaded_data))

    from pymodules.hd_UIDashboardThreads import get_containers, active_containers

    homedock_www.add_url_rule("/thread/installed_containers", "get_containers", CSRF_Protect(get_containers))
    homedock_www.add_url_rule("/thread/active_containers", "active_containers", CSRF_Protect(active_containers))

    from pymodules.hd_UIDashboardThreads import get_uptime, homedock_uptime

    homedock_www.add_url_rule("/thread/system_uptime", "get_uptime", CSRF_Protect(get_uptime))
    homedock_www.add_url_rule("/thread/homedock_uptime", "homedock_uptime", CSRF_Protect(homedock_uptime))

    from pymodules.hd_DockerAPIContainerData import get_docker_containers

    homedock_www.add_url_rule("/api/containers", "get_docker_containers", CSRF_Protect(get_docker_containers))

    from pymodules.hd_DockerAPIStartContainer import start_containers

    homedock_www.add_url_rule("/api/start_containers", "start_containers", CSRF_Protect(start_containers), methods=["POST"])

    from pymodules.hd_DockerAPIStopContainer import stop_containers

    homedock_www.add_url_rule("/api/stop_containers", "stop_containers", CSRF_Protect(stop_containers), methods=["POST"])

    from pymodules.hd_DockerAPIRestartContainer import restart_containers

    homedock_www.add_url_rule("/api/restart_containers", "restart_containers", CSRF_Protect(restart_containers), methods=["POST"])

    from pymodules.hd_DockerAPIPauseContainer import pause_containers

    homedock_www.add_url_rule("/api/pause_containers", "pause_containers", CSRF_Protect(pause_containers), methods=["POST"])

    from pymodules.hd_DockerAPIUnpauseContainer import unpause_containers

    homedock_www.add_url_rule("/api/unpause_containers", "unpause_containers", CSRF_Protect(unpause_containers), methods=["POST"])

    from pymodules.hd_DockerAPIUninstallContainer import uninstall_containers

    homedock_www.add_url_rule("/api/uninstall_containers", "uninstall_containers", CSRF_Protect(uninstall_containers), methods=["POST"])

    from pymodules.hd_DockerAPIUpdateContainer import pull_and_update_containers, check_new_images

    homedock_www.add_url_rule("/api/pull_and_update_containers", "pull_and_update_containers", CSRF_Protect(pull_and_update_containers), methods=["POST"])
    homedock_www.add_url_rule("/api/check_new_images", "check_new_images", CSRF_Protect(check_new_images), methods=["POST"])
