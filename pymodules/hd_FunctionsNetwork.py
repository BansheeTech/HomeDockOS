"""
hd_FunctionsNetwork.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import socket
import requests

ip_error_message_shown = False


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip

    except socket.error:
        return None


def get_internet_ip():
    global ip_error_message_shown

    services = ["https://api.ipify.org?format=json", "http://ip-api.com/json/", "https://jsonip.com", "https://ifconfig.me/ip", "https://ipinfo.io/ip", "https://icanhazip.com/", "https://www.trackip.net/ip"]

    failure_flag = False

    for service in services:
        try:
            response = requests.get(service, timeout=1)
            if response.status_code == 200:
                data = response.json()
                public_ip = data.get("ip", None)
                if public_ip:
                    return public_ip
            else:
                failure_flag = True
        except requests.RequestException as e:
            print(f"Error fetching IP from {service}: {e}")
            failure_flag = True

    if failure_flag and not ip_error_message_shown:
        print(" * Unable to determine the public IP address.")
        ip_error_message_shown = True

    return "127.0.0.1"


internet_ip = get_internet_ip()
local_ip = get_local_ip()
