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

from datetime import timedelta
from flask import g
from flask_compress import Compress
from hypercorn.asyncio import serve
from hypercorn.config import Config
from hypercorn.middleware import AsyncioWSGIMiddleware

from vite_fusion import register_vite_assets

from pymodules.hd_HDOSWebServerInit import homedock_www
from pymodules.hd_AppFilters import b64encode_filter
from pymodules.hd_FunctionsGlobals import current_directory, version, version_hash, running_OS, running_ARCH, logs_folder
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip
from pymodules.hd_PublicKeySender import send_public_key
from pymodules.hd_FunctionsConfig import check_and_generate_config, read_config
from pymodules.hd_OnboardingWindow import mark_process_start
from pymodules.hd_FunctionsActiveInstance import active_instance

from pymodules.hd_FunctionsMain import validate_docker_installation, validate_docker_compose_installation, init_color_if_windows
from pymodules.hd_FunctionsInitUserFolders import init_all_directories

from pymodules.hd_ThreadContainerResourceUsage import start_resource_usage_thread
from pymodules.hd_ThreadAutoPortRouting import start_auto_port_routing_thread
from pymodules.hd_ThreadAppUpdatesChecker import start_app_updates_checker_thread
from pymodules.hd_ThreadNotificationsFetcher import start_notifications_fetcher_thread
from pymodules.hd_ThreadCertRenewal import start_cert_renewal_thread
from pymodules.hd_ThreadDynamicDNS import start_dynamic_dns_thread

from pymodules.hd_RouteModules import RouteAllModules
from pymodules.hd_EnterpriseLoader import load_enterprise, print_enterprise_banner
from pymodules.hd_UpdateDeps import check_and_update_dependencies
from pymodules.hd_FunctionsNativeSSL import ssl_enabled, get_ssl_cert_info, get_ssl_cert_directory, capture_ssl_context
from pymodules.hd_ThreadZeroConf import announce_homedock_service, format_url
from pymodules.hd_SubdomainRouter import wrap_asgi_with_subdomain_router, subdomain_routing_available
from pymodules.hd_SessionSecurity import SchemeAwareSessionInterface
from pymodules.hd_TrustedProxy import TrustedProxyFix
from pymodules.hd_LocalHTTPAccess import setup_local_http_access

from pymodules.hd_HMRUpdate import set_updating_state
from pymodules.hd_NonceGenerator import setup_nonce
from pymodules.hd_CSPMaxed import setup_security_headers
from pymodules.hd_LoopbackRedirect import setup_loopback_redirect
from pymodules.hd_HTMLErrorCodeHandler import setup_error_handlers
from pymodules.hd_ApplyUploadLimits import ContentSizeLimitMiddleware

from pymodules.hd_FunctionsHostSelector import is_docker

os.chdir(current_directory)

set_updating_state(False)

check_and_generate_config()
globalConfig = read_config()

init_all_directories()
logging.basicConfig(filename=os.path.join(logs_folder, "error.log"), level=logging.ERROR)

homedock_www = homedock_www
homedock_www.add_template_filter(b64encode_filter, name="b64encode")

Compress(homedock_www)
init_color_if_windows()
validate_docker_installation()
validate_docker_compose_installation()

setup_nonce(homedock_www)
setup_loopback_redirect(homedock_www)
setup_security_headers(homedock_www, globalConfig)
setup_error_handlers(homedock_www, read_config, version_hash)
active_instance()

register_vite_assets(homedock_www, dev_mode=globalConfig["run_on_development"], dev_server_url="http://localhost:5173", dist_path="/homedock-ui/vue3/dist", manifest_path="homedock-ui/vue3/dist/.vite/manifest.json", nonce_provider=lambda: g.get("nonce"), logger=None)

if __name__ == "__main__":

    check_and_update_dependencies()

    RouteAllModules(homedock_www, send_public_key)
    enterprise_cogs = load_enterprise(homedock_www)

    start_auto_port_routing_thread()
    start_resource_usage_thread()
    start_app_updates_checker_thread()
    start_notifications_fetcher_thread()
    start_cert_renewal_thread()
    start_dynamic_dns_thread()
    mark_process_start()

    run_port = globalConfig["run_port"]
    local_dns = globalConfig["local_dns"]
    dynamic_dns = globalConfig["dynamic_dns"]
    run_on_development = globalConfig["run_on_development"]
    reverse_proxy_enabled = globalConfig.get("reverse_proxy", False)
    local_http_access = globalConfig.get("local_http_access", False) and not reverse_proxy_enabled

    ssl_enabled_var = ssl_enabled()

    if ssl_enabled_var and run_port == 80:
        print()
        print(" ! SSL enabled on port 80, hard switching to 443")
        run_port = 443

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

    print(" ▸ Repo:     https://github.com/BansheeTech/HomeDockOS")
    print(" ▸ Web:      https://www.homedock.cloud")
    print(" ▸ Docs:     https://docs.homedock.cloud")
    print(" ▸ Discord:  https://discord.gg/Zj3JCYsRWw")
    print(" ▸ Support:  support@homedock.cloud")
    print()

    print(" ⌂ \033[1;32;40mHomeDock OS Version\033[0m:", version)
    print(" ~ \033[1;30mVersion Hash: " + version_hash + "\033[0m")
    print_enterprise_banner(enterprise_cogs)
    print()

    print(" * Run from:", current_directory)
    print(" * Run on port:", run_port)
    print(" * Run on local IP:", local_ip)
    print(" * Run on public IP:", internet_ip)
    print(" * Run on Native SSL:", ssl_enabled_var)
    print(" * Run on development mode:", run_on_development)
    if reverse_proxy_enabled:
        print(" * Reverse Proxy support:", reverse_proxy_enabled)
    if local_http_access:
        print(" * Plain HTTP on the local network: enabled")
    print()

    print(" * CPU Type:", running_ARCH)
    print(" * Underlying OS:", running_OS)
    print()

    if ssl_enabled_var:
        cert_path = os.path.join(get_ssl_cert_directory(), "fullchain.pem")
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
        if announce_homedock_service():
            print(f"            > \x1b[4m{format_url(protocol, 'homedock.local', run_port)}\x1b[0m")
        else:
            print("            ! homedock.local unavailable")

    if not subdomain_routing_available():
        print(" ! Per-app subdomains disabled: aiohttp is unavailable on this system")

    if is_docker:
        print()
        print(" \033[1;33;40m» Running in Docker-in-Docker mode\033[0m")
        print("   HomeDock OS is intended to run directly on your machine.")
        print("   If you like it, install it natively for the best experience!")
        print("   Available for Windows, macOS and Linux at:")
        print("   \x1b[4mhttps://www.homedock.cloud/install\x1b[0m")

    print()

    homedock_www.config["PERMANENT_SESSION_LIFETIME"] = timedelta(hours=24)
    homedock_www.config["SECRET_KEY"] = os.urandom(32)
    homedock_www.config["SESSION_REFRESH_EACH_REQUEST"] = False
    homedock_www.config["SESSION_COOKIE_HTTPONLY"] = True
    homedock_www.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    homedock_www.config["SESSION_COOKIE_NAME"] = "homedock_session"
    homedock_www.config["SERVER_NAME"] = None

    # HDOS00058
    if ssl_enabled() and not local_http_access:
        homedock_www.config["SESSION_COOKIE_SECURE"] = True  # Secure Flag for native SSL, every request is HTTPS

    homedock_www.session_interface = SchemeAwareSessionInterface()

    try:

        hypercorn_config = Config()
        hypercorn_config.loglevel = "DEBUG"
        hypercorn_config.include_server_header = False
        hypercorn_config.bind = [f"0.0.0.0:{run_port}"]

        redirect_app = redirect_config = None
        if ssl_enabled_var:
            ssl_cert_dir = get_ssl_cert_directory()
            hypercorn_config.certfile = os.path.join(ssl_cert_dir, "fullchain.pem")
            hypercorn_config.keyfile = os.path.join(ssl_cert_dir, "privkey.pem")
            hypercorn_config.ca_certs = os.path.join(ssl_cert_dir, "chain.pem")

            # HDOS00122
            hypercorn_config.alpn_protocols = ["http/1.1"]

            # HDOS00069
            capture_ssl_context(hypercorn_config)

            if run_port == 443:
                # HDOS00074
                if local_http_access:
                    hypercorn_config.insecure_bind = ["0.0.0.0:80"]
                    setup_local_http_access(homedock_www, True, reverse_proxy_enabled)
                else:
                    from pymodules.hd_HTTPRedirector import start_http_redirect_server

                    redirect_app, redirect_config = start_http_redirect_server()

        wsgi_app = homedock_www
        if reverse_proxy_enabled:
            # HDOS00061
            wsgi_app = TrustedProxyFix(homedock_www)

        if run_on_development:
            # HDOS00032
            homedock_www.config["TEMPLATES_AUTO_RELOAD"] = True

        flask_stack = ContentSizeLimitMiddleware(AsyncioWSGIMiddleware(wsgi_app, max_body_size=1 * 1024 * 1024 * 1024))

        # HDOS00033
        homedock_www_asgi = wrap_asgi_with_subdomain_router(flask_stack)

        async def run_all_servers():
            from concurrent.futures import ThreadPoolExecutor

            asyncio.get_running_loop().set_default_executor(ThreadPoolExecutor(max_workers=50))

            stop_event = asyncio.Event()

            def trigger_shutdown():
                stop_event.set()
                from pymodules.hd_SSEStats import shutdown_stats_streams
                from pymodules.hd_ThreadDisksPlus import shutdown_disksplus_streams

                shutdown_stats_streams()
                shutdown_disksplus_streams()

            loop = asyncio.get_running_loop()
            for sig in (signal.SIGINT, signal.SIGTERM):
                try:
                    loop.add_signal_handler(sig, trigger_shutdown)
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
