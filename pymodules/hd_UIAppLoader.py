"""
hd_UIAppLoader.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import ipaddress
import requests
import socket
import re

from flask import jsonify, render_template, g, request
from flask_login import login_required

from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsGlobals import version_hash
from pymodules.hd_FunctionsHostSelector import docker_host, is_docker
from pymodules.hd_AppSubdomains import get_emittable_hosts, get_slug_map, resolve_app_for_host, build_forwarding_headers
from pymodules.hd_DockerAPIContainerData import get_container_name_by_port_direct, get_display_name_for_container
from pymodules.hd_FunctionsNetwork import local_ip, internet_ip, get_local_ip, get_internet_ip


# HDOS00009
def sanitize_subpath(subpath):
    if not subpath:
        return ""
    sanitized = re.sub(r"[^a-zA-Z0-9]", "", subpath)
    sanitized = sanitized[:20]
    return sanitized


# HDOS00008
def get_safe_hostname():
    requested_host = request.host.split(":")[0].strip().lower().rstrip(".")

    # HDOS00045
    if requested_host in get_emittable_hosts():
        return requested_host

    try:
        ip_obj = ipaddress.ip_address(requested_host)
        if ip_obj.is_loopback:
            return requested_host

        # HDOS00016
        if is_docker and ip_obj.is_private:
            return requested_host
    except:
        pass

    server_hostname = socket.gethostname()
    server_fqdn = socket.getfqdn()

    if requested_host in {server_hostname, server_fqdn}:
        return requested_host

    try:
        resolved_ip = socket.gethostbyname(requested_host)

        try:
            resolved_ip_obj = ipaddress.ip_address(resolved_ip)
            if resolved_ip_obj.is_loopback:
                return None
        except:
            pass

        if resolved_ip in {local_ip, internet_ip}:
            return requested_host

        current_local_ip = get_local_ip()
        current_internet_ip = get_internet_ip()

        if resolved_ip in {current_local_ip, current_internet_ip}:
            return requested_host
    except:
        pass

    return None


def _public_app_host(container_name, port, hostname):
    slug = next((slug for slug, entry in get_slug_map().items() if entry["container"] == container_name), None)

    if slug is None:
        return None

    _, separator, host_port = request.host.rpartition(":")
    port_suffix = f":{host_port}" if separator and host_port.isdigit() and not request.host.startswith("[") else ""

    public_host = f"{slug}.{hostname}{port_suffix}"
    app = resolve_app_for_host(public_host)

    if app is None or app["container"] != container_name or app["port"] != port:
        return None

    return public_host


def _probe_status(url, headers):
    try:
        response = requests.get(url, timeout=5, allow_redirects=False, stream=True, headers=headers, verify=True)
    except requests.exceptions.SSLError:
        response = requests.get(url, timeout=5, allow_redirects=False, stream=True, headers=headers, verify=False)

    with response:
        return response.status_code


def _rejects_proxied_requests(url, headers, public_host):
    try:
        client = (request.remote_addr, 0) if request.remote_addr else None
        forwarding = build_forwarding_headers(public_host, request.scheme, client)
        proxied_headers = {**headers, **{name: value for name, value in forwarding.items() if value != ""}}

        if _probe_status(url, headers) == 400:
            return False

        return _probe_status(url, proxied_headers) == 400
    except Exception:
        return False


def _available_response(url, hostname, port, headers, via_proxy, container_name):
    protocol = url.split("://")[0]
    payload = {"available": True, "url": f"{protocol}://{hostname}:{port}"}

    # HDOS00129
    if via_proxy:
        try:
            public_host = _public_app_host(container_name, port, hostname)
        except Exception:
            public_host = None

        payload["proxy_rejected"] = public_host is not None and _rejects_proxied_requests(url, headers, public_host)

    return jsonify(payload)


@login_required
def check_port():
    data = request.json
    port = data.get("port")
    subpath = sanitize_subpath(data.get("subpath", "").lstrip("/"))
    via_proxy = data.get("via_proxy") is True

    if not isinstance(port, int) or port < 1 or port > 65535:
        return jsonify({"error": "Invalid port. Must be an integer between 1 and 65535."}), 400

    # HDOS00008
    hostname = get_safe_hostname()

    if hostname is None:
        return jsonify({"error": "Invalid or unauthorized hostname."}), 403

    # HDOS00010
    container_name = get_container_name_by_port_direct(port)
    if container_name is None:
        return jsonify({"error": "Port not associated with any container."}), 403

    path_part = f"/{subpath}" if subpath else ""

    # HDOS00046
    internal_host = docker_host
    urls = [f"https://{internal_host}:{port}{path_part}", f"http://{internal_host}:{port}{path_part}"]

    # HDOS00005
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}

    for url in urls:
        try:
            # HDOS000015
            try:
                response = requests.head(url, timeout=5, allow_redirects=True, headers=headers, verify=True)
            except requests.exceptions.SSLError:
                response = requests.head(url, timeout=5, allow_redirects=True, headers=headers, verify=False)

            if response.status_code < 400 or response.status_code in [401, 301, 302, 308]:
                return _available_response(url, hostname, port, headers, via_proxy, container_name)

            if response.status_code in [404, 405]:
                try:
                    response = requests.get(url, timeout=5, allow_redirects=True, stream=True, headers=headers, verify=True)
                except requests.exceptions.SSLError:
                    response = requests.get(url, timeout=5, allow_redirects=True, stream=True, headers=headers, verify=False)

                with response:
                    available = response.status_code < 400 or response.status_code in [401, 301, 302, 308]

                if available:
                    return _available_response(url, hostname, port, headers, via_proxy, container_name)

        except requests.RequestException:
            continue

    return jsonify({"available": False}), 404


@login_required
def app_loader(port, subpath=""):
    config = read_config()
    selected_theme = config["selected_theme"]
    selected_back = config["selected_back"]
    selected_language = config["selected_language"]

    container_name = get_container_name_by_port_direct(port)
    app_slug = container_name if container_name else None
    app_display_name = get_display_name_for_container(container_name) if container_name else None

    return render_template("app.html", version_hash=version_hash, selected_theme=selected_theme, selected_back=selected_back, selected_language=selected_language, nonce=g.get("nonce", ""), port=port, subpath=subpath, app_slug=app_slug, app_display_name=app_display_name)
