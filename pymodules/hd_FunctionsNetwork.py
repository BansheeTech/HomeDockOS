"""
hd_FunctionsNetwork.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import re
import socket
import requests

ip_error_message_shown = False


def is_valid_ipv4(ip):
    pattern = r"^\d{1,3}(\.\d{1,3}){3}$"
    return re.match(pattern, ip) is not None


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        if is_valid_ipv4(local_ip):
            return local_ip
        else:
            print(" * Local IP is not a valid IPv4 address")
            return "127.0.0.1"
    except socket.error:
        return "127.0.0.1"


def get_internet_ip():
    global ip_error_message_shown

    # HDOS00108
    ipv4_services = [
        "https://api.ipify.org?format=json",
        "https://ipinfo.io/ip",
        "https://ip.guide",
        "http://ip-api.com/json/",
        "https://jsonip.com",
        "https://ifconfig.me/ip",
        "https://icanhazip.com/",
        "https://www.trackip.net/ip",
    ]

    failure_flag = False

    for service in ipv4_services:
        try:
            response = requests.get(service, timeout=2)

            if response.status_code == 200:
                if "json" in service:
                    data = response.json()
                    public_ip = data.get("ip", None)
                else:
                    public_ip = response.text.strip()

                if public_ip and is_valid_ipv4(public_ip):
                    return public_ip
            else:
                failure_flag = True
        except requests.RequestException as e:
            failure_flag = True

    if failure_flag and not ip_error_message_shown:
        print(" ! Unable to determine the public IP address")
        ip_error_message_shown = True

    return "127.0.0.1"


internet_ip = get_internet_ip()
local_ip = get_local_ip()
