"""
hd_HyperSpoof.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import random


def regenerate_headers():
    global server, via, primary_ip, secondary_ip, cdn_node
    server = get_random_server()
    via = get_random_via()
    primary_ip = get_ip_by_server(server)
    secondary_ip = get_secondary_ip_by_via(via)
    cdn_node = get_random_cdn_node()


def handle_request_counter():
    global request_count
    request_count += 1
    if request_count >= 50:
        regenerate_headers()
        request_count = 0


def get_random_server():
    servers = [
        ("nginx/1.23.3", 43.25),
        ("Apache/2.4.54", 23.06),
        ("openresty/1.21.4.1", 13.05),
        ("LiteSpeed/6.0", 10.44),
        ("Microsoft-IIS/10.0", 7.71),
        ("Phusion_Passenger/6.0.11", 0.34),
        ("Google-Cloud-Functions", 0.29),
        ("Apache-Coyote/1.1", 0.25),
        ("SAP-NetWeaver/7.5", 0.22),
        ("Varnish/6.6", 0.15),
        ("JBoss-EAP/7.4", 0.15),
        ("IBM-CICS/5.6", 0.08),
        ("Undertow/2.2.19", 0.06),
        ("SUSE/15.3", 0.06),
        ("Oracle-Application-Server/10.1.3", 0.06),
        ("Microsoft-Azure-App-Services", 0.05),
        ("Oracle-WebLogic/14.1.1", 0.05),
        ("gunicorn/20.1.0", 0.01),
        ("cloudflare", 0.01),
        ("Caddy/2.6.2", 0.01),
    ]

    servers_list = [s[0] for s in servers]
    weights = [s[1] for s in servers]

    return random.choices(servers_list, weights)[0]


def get_random_powered_by():
    powered_by = [
        ("PHP/7.4.3", 40),
        ("Express", 30),
        ("ASP.NET", 15),
        ("Node.js", 10),
        ("Django/3.2", 5),
    ]

    powered_by_list = [p[0] for p in powered_by]
    powered_by_weights = [p[1] for p in powered_by]

    return random.choices(powered_by_list, powered_by_weights)[0]


def get_random_via():
    via = [
        ("1.1 varnish", 40),
        ("1.1 squid", 30),
        ("1.1 cloudflare", 20),
        ("1.1 akamai", 10),
    ]

    via_list = [v[0] for v in via]
    via_weights = [v[1] for v in via]

    return random.choices(via_list, via_weights)[0]


def get_random_cdn_node():
    cdn_nodes = [
        "Node-1-HYPEREDGE-multi-node-CDN",
        "Node-2-HYPEREDGE-multi-node-CDN",
        "Node-EU-HYPEREDGE-multi-node-CDN",
        "Node-US-HYPEREDGE-multi-node-CDN",
        "Node-Asia-HYPEREDGE-multi-node-CDN",
    ]
    return random.choice(cdn_nodes)


def get_ip_by_server(server):
    ip_mapping = {
        "nginx/1.23.3": "104.16.0.1",  # Cloudflare
        "Apache/2.4.54": "178.62.0.1",  # DigitalOcean
        "openresty/1.21.4.1": "45.60.11.1",  # Sucuri
        "LiteSpeed/6.0": "172.67.10.10",  # Cloudflare
        "Microsoft-IIS/10.0": "52.96.0.2",  # Microsoft Azure
        "Phusion_Passenger/6.0.11": "209.58.129.0",  # Heroku
        "Google-Cloud-Functions": "35.235.240.1",  # Google Cloud
        "Apache-Coyote/1.1": "13.56.0.0",  # AWS
        "SAP-NetWeaver/7.5": "91.198.165.1",  # SAP
        "Varnish/6.6": "185.24.98.1",  # Varnish Cache
        "JBoss-EAP/7.4": "217.140.75.46",  # Red Hat
        "IBM-CICS/5.6": "129.42.38.10",  # IBM Cloud
        "Undertow/2.2.19": "185.199.110.153",  # GitHub Pages
        "SUSE/15.3": "185.91.36.0",  # SUSE hosting
        "Oracle-Application-Server/10.1.3": "141.146.8.66",  # Oracle Cloud
        "Microsoft-Azure-App-Services": "40.67.0.0",  # Microsoft Azure
        "Oracle-WebLogic/14.1.1": "129.146.172.30",  # Oracle Cloud
        "gunicorn/20.1.0": "34.66.0.0",  # Google Cloud Run
        "cloudflare": "104.21.45.0",  # Cloudflare CDN
        "Caddy/2.6.2": "138.68.0.1",  # DigitalOcean
    }
    return ip_mapping.get(server, "127.0.0.1")


def get_secondary_ip_by_via(via):
    via_ip_mapping = {
        "1.1 varnish": "185.22.212.10",  # Varnish Cache
        "1.1 squid": "149.56.28.1",  # Squid Proxy
        "1.1 cloudflare": "104.16.12.5",  # Cloudflare
        "1.1 akamai": "23.235.39.1",  # Akamai CDN
    }
    return via_ip_mapping.get(via, "127.0.0.1")


class HeaderManager:
    def __init__(self):
        self.request_count = 0
        self.server = get_random_server()
        self.via = get_random_via()
        self.primary_ip = get_ip_by_server(self.server)
        self.secondary_ip = get_secondary_ip_by_via(self.via)
        self.cdn_node = get_random_cdn_node()
        self.powered_by = get_random_powered_by()

    def regenerate_headers(self):
        self.server = get_random_server()
        self.via = get_random_via()
        self.primary_ip = get_ip_by_server(self.server)
        self.secondary_ip = get_secondary_ip_by_via(self.via)
        self.cdn_node = get_random_cdn_node()
        self.powered_by = get_random_powered_by()

    def handle_request_counter(self):
        self.request_count += 1
        if self.request_count >= 75:
            self.regenerate_headers()
            self.request_count = 0


header_manager = HeaderManager()
