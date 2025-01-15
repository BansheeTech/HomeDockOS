"""
homedock.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.homedock.cloud
"""

import os
import logging
import asyncio
import threading

from datetime import timedelta
from flask import Flask, g
from flask_compress import Compress
from hypercorn.asyncio import serve
from hypercorn.config import Config

from vite_fusion import register_vite_assets

from pymodules.hd_AppFilters import b64encode_filter
from pymodules.hd_FunctionsGlobals import current_directory, version, version_hash, running_OS, running_ARCH
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_PublicKeySender import send_public_key
from pymodules.hd_FunctionsConfig import check_and_generate_config, read_config

from pymodules.hd_FunctionsMain import validate_docker_installation, validate_docker_compose_installation, init_color_if_windows
from pymodules.hd_FunctionsMain import ensure_logs_directory

from pymodules.hd_ThreadContainerCpuUsage import start_cpu_usage_thread
from pymodules.hd_ThreadAutoPortRouting import start_auto_port_routing_thread

from pymodules.hd_RouteModules import RouteAllModules
from pymodules.hd_UpdateDeps import check_and_update_dependencies
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_ssl_cert_info
from pymodules.hd_ThreadZeroConf import announce_homedock_service, format_url

from pymodules.hd_NonceGenerator import setup_nonce
from pymodules.hd_CSPMaxed import setup_security_headers
from pymodules.hd_HTMLErrorCodeHandler import setup_error_handlers
from pymodules.hd_ApplyUploadLimits import apply_upload_limit

check_and_generate_config()
globalConfig = read_config()

ensure_logs_directory()
logging.basicConfig(filename=os.path.join(current_directory, "logs", "error.log"), level=logging.ERROR)

homedock_www = Flask(__name__, static_folder=None, template_folder="homedock-ui/template")
homedock_www.add_template_filter(b64encode_filter, name="b64encode")

Compress(homedock_www)
init_color_if_windows()
validate_docker_installation()
validate_docker_compose_installation()

setup_nonce(homedock_www)
setup_security_headers(homedock_www, globalConfig)
setup_error_handlers(homedock_www, read_config, version_hash)
apply_upload_limit(homedock_www)

register_vite_assets(homedock_www, dev_mode=globalConfig["run_on_development"], dev_server_url="http://localhost:5173", dist_path="/homedock-ui/vue3/dist", manifest_path="homedock-ui/vue3/dist/.vite/manifest.json", nonce_provider=lambda: g.get("nonce"), logger=None)

if __name__ == "__main__":

    # Pip Autoupdate
    check_and_update_dependencies()

    # Routes
    RouteAllModules(homedock_www, send_public_key)

    # Threads
    start_auto_port_routing_thread()
    start_cpu_usage_thread()

    user_name = globalConfig["user_name"]
    run_port = globalConfig["run_port"]
    local_dns = globalConfig["local_dns"]
    dynamic_dns = globalConfig["dynamic_dns"]
    run_on_development = globalConfig["run_on_development"]

    ssl_enabled_var = ssl_enabled()  # SSL Check Variable
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
    print(" Copyright © 2023-2025 Banshee, All Rights Reserved ")
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
            print(f'           └─ \x1B[4mError: {cert_info["error"]}\x1B[0m')
        else:
            print(f'           ├─ \x1B[4mValid Until: {cert_info["notAfter"]}\x1B[0m')
            print(f'           └─ \x1B[4mIssuer: {cert_info["issuerO"]} V{cert_info["version"]} ({cert_info["issuerCN"]})\x1B[0m')
            print()

    print(f" + Log in at: \x1B[4m{format_url(protocol, local_ip, run_port)}\x1B[0m")
    print(f"           ├─ \x1B[4m{format_url(protocol, internet_ip, run_port)}\x1B[0m")
    print(f"           └─ \x1B[4m{format_url(protocol, dynamic_dns, run_port)}\x1B[0m")

    if local_dns:
        thread_result = {"success": False}

        def run_service():
            thread_result["success"] = announce_homedock_service()

        thread = threading.Thread(target=run_service, daemon=True)
        thread.start()
        thread.join()

        if thread_result["success"]:
            print(f"            > \x1B[4m{format_url(protocol, 'homedock.local', run_port)}\x1B[0m")
        else:
            print(f"            ! homedock.local unavailable")

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
            homedock_www.run(host="0.0.0.0", port=run_port, debug=True, use_reloader=False)
        else:

            hypercorn_config = Config()
            hypercorn_config.include_server_header = False
            hypercorn_config.bind = [f"0.0.0.0:{run_port}"]

            if ssl_enabled_var:
                hypercorn_config.certfile = "/DATA/SSLCerts/fullchain.pem"
                hypercorn_config.keyfile = "/DATA/SSLCerts/privkey.pem"
                hypercorn_config.ca_certs = "/DATA/SSLCerts/chain.pem"

            asyncio.run(serve(homedock_www, hypercorn_config))

    except OSError as e:
        if e.errno == 98:
            print("Error: Selected port >", run_port, "< is already in use by another service/application!")
            print("Please select any other port by modifying homedock_server.conf!")
        else:
            print("Unexpected error occurred: ", e)
