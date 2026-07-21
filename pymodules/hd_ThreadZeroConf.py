"""
hd_ThreadZeroConf.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import socket

from pymodules.hd_FunctionsNetwork import local_ip
from pymodules.hd_FunctionsConfig import read_config

try:
    from zeroconf import Zeroconf, ServiceInfo, NonUniqueNameException

    ZEROCONF_AVAILABLE = True
    ZEROCONF_UNAVAILABLE_REASON = None
except Exception as e:
    ZEROCONF_AVAILABLE = False
    ZEROCONF_UNAVAILABLE_REASON = str(e)
    Zeroconf = ServiceInfo = None

    class NonUniqueNameException(Exception):
        pass


def format_url(protocol, host, port):
    if (protocol == "http" and port == 80) or (protocol == "https" and port == 443):
        return f"{protocol}://{host}"
    return f"{protocol}://{host}:{port}"


def announce_homedock_service():
    if not ZEROCONF_AVAILABLE:
        print(" * mDNS support is unavailable on this system")
        return False

    config = read_config()
    local_ip_address = local_ip

    if not local_ip_address or local_ip_address == "127.0.0.1":
        print(" * Invalid local IP for homedock.local announcement, skipping.")
        return False

    zeroconf = None
    info = None

    try:
        binary_ip = socket.inet_aton(local_ip_address)
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

        return True

    except NonUniqueNameException:
        print(" ! The name 'homedock.local' is already in use on your local network.")
        print(" * Please read: https://docs.homedock.cloud/troubleshooting/non-unique-name/")

        if zeroconf:
            zeroconf.close()

        return False

    except OSError as e:
        if "No buffer space available" in str(e):
            print(" ! Insufficient mDNS sockets for the homedock.local address.")
            print(" * Please read: https://docs.homedock.cloud/troubleshooting/multicast-dns/")
        else:
            print(f"\n[Unexpected error] {e}")

        if zeroconf:
            zeroconf.close()

        return False

    except Exception as e:
        print(f" ! homedock.local announcement failed: {e}")

        if zeroconf:
            zeroconf.close()

        return False
