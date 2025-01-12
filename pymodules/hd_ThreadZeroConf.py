"""
hd_ZeroConfThread.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import socket
import sys

from zeroconf import Zeroconf, ServiceInfo

from pymodules.hd_FunctionsNetwork import local_ip
from pymodules.hd_FunctionsConfig import read_config


def ip_to_binary(ip_address):
    return socket.inet_aton(ip_address)


def format_url(protocol, host, port):
    if (protocol == "http" and port == 80) or (protocol == "https" and port == 443):
        return f"{protocol}://{host}"
    return f"{protocol}://{host}:{port}"


def announce_homedock_service():
    config = read_config()
    binary_ip = ip_to_binary(local_ip)

    try:
        zeroconf = Zeroconf()

        info = ServiceInfo(
            "_http._tcp.local.",
            "homedock._http._tcp.local.",
            addresses=[binary_ip],
            port=config["run_port"],
            properties={},
            server="homedock.local.",
        )

        zeroconf.register_service(info)

    except OSError as e:
        if "No buffer space available" in str(e):
            print(" * Insufficient mDNS sockets for the homedock.local address.")
            print(" * Please read: https://docs.homedock.cloud/troubleshooting/multicast-dns/")
        else:
            print(f"\n[Unexpected error] {e}")
        sys.exit(1)
