"""
homedock.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import signal
import logging
import asyncio
import threading

from datetime import timedelta
from flask import g
from flask_compress import Compress
from hypercorn.asyncio import serve
from hypercorn.config import Config
from hypercorn.middleware import AsyncioWSGIMiddleware

from vite_fusion import register_vite_assets

from pymodules.hd_HDOSWebServerInit import homedock_www
from pymodules.hd_AppFilters import b64encode_filter
from pymodules.hd_FunctionsGlobals import current_directory, version, version_hash, running_OS, running_ARCH
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_PublicKeySender import send_public_key
from pymodules.hd_FunctionsConfig import check_and_generate_config, read_config
from pymodules.hd_FunctionsActiveInstance import active_instance

from pymodules.hd_FunctionsMain import validate_docker_installation, validate_docker_compose_installation, init_color_if_windows
from pymodules.hd_FunctionsMain import ensure_logs_directory

from pymodules.hd_ThreadContainerResourceUsage import start_resource_usage_thread
from pymodules.hd_ThreadAutoPortRouting import start_auto_port_routing_thread
from pymodules.hd_ThreadAppUpdatesChecker import start_app_updates_checker_thread

from pymodules.hd_RouteModules import RouteAllModules
from pymodules.hd_UpdateDeps import check_and_update_dependencies
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_ssl_cert_info
from pymodules.hd_ThreadZeroConf import announce_homedock_service, format_url

from pymodules.hd_HMRUpdate import set_updating_state
from pymodules.hd_NonceGenerator import setup_nonce
from pymodules.hd_CSPMaxed import setup_security_headers
from pymodules.hd_HTMLErrorCodeHandler import setup_error_handlers
from pymodules.hd_ApplyUploadLimits import ContentSizeLimitMiddleware, FlaskDevUploadLimitMiddleware

from pymodules.hd_HDSPackageManager import ensure_external_dir

os.chdir(current_directory)

set_updating_state(False)

check_and_generate_config()
globalConfig = read_config()

ensure_logs_directory()
logging.basicConfig(filename=os.path.join(current_directory, "logs", "error.log"), level=logging.ERROR)

homedock_www = homedock_www
homedock_www.add_template_filter(b64encode_filter, name="b64encode")

Compress(homedock_www)
init_color_if_windows()
validate_docker_installation()
validate_docker_compose_installation()

setup_nonce(homedock_www)
setup_security_headers(homedock_www, globalConfig)
setup_error_handlers(homedock_www, read_config, version_hash)
active_instance()

register_vite_assets(homedock_www, dev_mode=globalConfig["run_on_development"], dev_server_url="http://localhost:5173", dist_path="/homedock-ui/vue3/dist", manifest_path="homedock-ui/vue3/dist/.vite/manifest.json", nonce_provider=lambda: g.get("nonce"), logger=None)

if __name__ == "__main__":

    check_and_update_dependencies()
    ensure_external_dir()

    RouteAllModules(homedock_www, send_public_key)

    start_auto_port_routing_thread()
    start_resource_usage_thread()
    start_app_updates_checker_thread()

    user_name = globalConfig["user_name"]
    run_port = globalConfig["run_port"]
    local_dns = globalConfig["local_dns"]
    dynamic_dns = globalConfig["dynamic_dns"]
    run_on_development = globalConfig["run_on_development"]

    ssl_enabled_var = ssl_enabled()

    protocol = "https" if ssl_enabled_var else "http"

    print()
    print("            @@@@@@@@@@@@@@@@@@@@@@@@  ")
    print("           @@@@@@@@@@@@@@@@@@@@@@@@@  ")
    print("          @@@@                        ")
    print("         @@@@   @@@@@@@@@@@@@@@@@@@@  ")
    print("        @@@@   @@@                    ")
    print("        @@@   @@@   @@@@@@@@@@@@@     ")
    print("       @@@   @@@*  @@@@      @@@*  @  ")
    print("      @@@   @@@@  @@@@      @@@@  @@  ")
    print("     @@@*  @@@@  (@@@      @@@@@@@@@  ")
    print("    @@@@  @@@@   @@@      //////////  ")
    print("   @@@@  @@@@   @@@                   ")
    print("  @@@@  #@@@   @@@                    ")
    print(" @@@@   @@@   @@@                     ")
    print()
    print(" Copyright © 2023-2026 Banshee, All Rights Reserved ")
    print()

    print(" ⌂ \033[1;32;40mHomeDock OS Version\033[0m:", version)
    print(" ~ \033[1;30mVersion Hash: " + version_hash + "\033[0m")

    print()

    print(" * Run from:", current_directory)
    print(" * Run on port:", run_port)
    print(" * Run on local IP:", local_ip)
    print(" * Run on public IP:", internet_ip)
    print(" * Run on Native SSL:", ssl_enabled_var)
    print(" * Run on development mode:", run_on_development)

    print()

    print(" * CPU Type:", running_ARCH)
    print(" * Underlying OS:", running_OS)

    print()

    print(" * User Login:", user_name)
    print(" * Default Password:", "passwd")

    print()

    if ssl_enabled_var:
        cert_path = "/DATA/SSLCerts/fullchain.pem"
        cert_info = get_ssl_cert_info(cert_path)
        print(" » SSL Certificate Information:")
        if "error" in cert_info:
            print(f'           └─ \x1b[4mError: {cert_info["error"]}\x1b[0m')
        else:
            print(f'           ├─ \x1b[4mValid Until: {cert_info["notAfter"]}\x1b[0m')
            print(f'           └─ \x1b[4mIssuer: {cert_info["issuerO"]} V{cert_info["version"]} ({cert_info["issuerCN"]})\x1b[0m')
            print()

    print(f" + Log in at: \x1b[4m{format_url(protocol, local_ip, run_port)}\x1b[0m")
    print(f"           ├─ \x1b[4m{format_url(protocol, internet_ip, run_port)}\x1b[0m")
    print(f"           └─ \x1b[4m{format_url(protocol, dynamic_dns, run_port)}\x1b[0m")

    if local_dns:
        thread_result = {"success": False}

        def run_service():
            thread_result["success"] = announce_homedock_service()

        thread = threading.Thread(target=run_service, daemon=True)
        thread.start()
        thread.join()

        if thread_result["success"]:
            print(f"            > \x1b[4m{format_url(protocol, 'homedock.local', run_port)}\x1b[0m")
        else:
            print("            ! homedock.local unavailable")

    print()

    homedock_www.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)
    homedock_www.config["SECRET_KEY"] = os.urandom(32)
    homedock_www.config["SESSION_REFRESH_EACH_REQUEST"] = False
    homedock_www.config["SESSION_COOKIE_HTTPONLY"] = True
    homedock_www.config["SESSION_COOKIE_SAMESITE"] = "Strict"
    homedock_www.config["SESSION_COOKIE_NAME"] = "homedock_session"
    homedock_www.config["SERVER_NAME"] = None
    homedock_www.config["SESSION_TYPE"] = "filesystem"

    if ssl_enabled():
        homedock_www.config["SESSION_COOKIE_SECURE"] = True  # Secure Flag only for HTTPS

    try:

        if run_on_development:

            FlaskDevUploadLimitMiddleware(homedock_www)
            homedock_www.run(host="0.0.0.0", port=run_port, debug=True, use_reloader=False)

        else:

            hypercorn_config = Config()
            hypercorn_config.loglevel = "DEBUG"
            hypercorn_config.include_server_header = False
            hypercorn_config.bind = [f"0.0.0.0:{run_port}"]

            redirect_app = redirect_config = None
            if ssl_enabled_var:
                hypercorn_config.certfile = "/DATA/SSLCerts/fullchain.pem"
                hypercorn_config.keyfile = "/DATA/SSLCerts/privkey.pem"
                hypercorn_config.ca_certs = "/DATA/SSLCerts/chain.pem"

                from pymodules.hd_HTTPRedirector import start_http_redirect_server

                redirect_app, redirect_config = start_http_redirect_server()

            async def homedock_www_asgi(scope, receive, send):
                app = AsyncioWSGIMiddleware(homedock_www, max_body_size=1 * 1024 * 1024 * 1024)
                await ContentSizeLimitMiddleware(app)(scope, receive, send)

            async def run_all_servers():
                stop_event = asyncio.Event()

                loop = asyncio.get_running_loop()
                for sig in (signal.SIGINT, signal.SIGTERM):
                    try:
                        loop.add_signal_handler(sig, stop_event.set)
                    except NotImplementedError:
                        pass  # HDOS00001

                await asyncio.gather(*(serve(app, cfg, shutdown_trigger=stop_event.wait) for app, cfg in [(redirect_app, redirect_config), (homedock_www_asgi, hypercorn_config)] if app and cfg))

                print(" ✓ Servers shut down SIGTERM received")

            asyncio.run(run_all_servers())

    except OSError as e:
        if e.errno == 98:
            print("Error: Selected port >", run_port, "< is already in use by another service/application!")
            print("Please select any other port by modifying homedock_server.conf!")
        else:
            print("Unexpected error occurred: ", e)
