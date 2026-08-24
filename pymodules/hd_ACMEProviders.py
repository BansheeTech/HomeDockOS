"""
hd_ACMEProviders.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import requests

# HDOS00063

TIMEOUT = 20


class ProviderError(Exception):
    pass


def _get(url, params):
    try:
        response = requests.get(url, params=params, timeout=TIMEOUT)
    except requests.RequestException as error:
        raise ProviderError(str(error))

    if response.status_code != 200:
        raise ProviderError(f"HTTP {response.status_code}: {response.text.strip()[:200]}")

    return response.text.strip()


def _freemyip_set(domain, token, value):
    body = _get("https://freemyip.com/update", {"token": token, "domain": domain, "txt": value})

    if "OK" not in body.upper():
        raise ProviderError(f"freemyip refused the update: {body[:200]}")


def _freemyip_clear(domain, token):
    _get("https://freemyip.com/update", {"token": token, "domain": domain, "txt": "null"})


def _duckdns_set(domain, token, value):
    label = domain.lower().split(".duckdns.org")[0]

    body = _get("https://www.duckdns.org/update", {"domains": label, "token": token, "txt": value})

    if not body.upper().startswith("OK"):
        raise ProviderError(f"DuckDNS refused the update: {body[:200]}")


def _duckdns_clear(domain, token):
    label = domain.lower().split(".duckdns.org")[0]
    _get("https://www.duckdns.org/update", {"domains": label, "token": token, "txt": "", "clear": "true"})


# HDOS00109
def _freemyip_sync(domain, token, ip):
    params = {"token": token, "domain": domain}

    if ip:
        params["myip"] = ip

    body = _get("https://freemyip.com/update", params)

    if "OK" not in body.upper():
        raise ProviderError(f"freemyip refused the update: {body[:200]}")


def _duckdns_sync(domain, token, ip):
    label = domain.lower().split(".duckdns.org")[0]

    params = {"domains": label, "token": token}

    if ip:
        params["ip"] = ip

    body = _get("https://www.duckdns.org/update", params)

    if not body.upper().startswith("OK"):
        raise ProviderError(f"DuckDNS refused the update: {body[:200]}")


def _cloudflare_request(method, path, token, payload=None):
    try:
        response = requests.request(
            method,
            f"https://api.cloudflare.com/client/v4{path}",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json=payload,
            timeout=TIMEOUT,
        )
        data = response.json()
    except (requests.RequestException, ValueError) as error:
        raise ProviderError(str(error))

    if not data.get("success"):
        errors = data.get("errors") or [{"message": f"HTTP {response.status_code}"}]
        details = []

        for item in errors:
            chain = "; ".join(str(link.get("message")) for link in (item.get("error_chain") or []))
            details.append(f"{item.get('message')}: {chain}" if chain else str(item.get("message")))

        raise ProviderError("; ".join(details)[:200])

    return data.get("result")


def _cloudflare_zone(domain, token):
    labels = domain.split(".")

    for index in range(len(labels) - 1):
        candidate = ".".join(labels[index:])
        result = _cloudflare_request("GET", f"/zones?name={candidate}", token)

        if result:
            return result[0]["id"], candidate

    raise ProviderError(f"No Cloudflare zone found for {domain}")


def _cloudflare_set(domain, token, value):
    zone_id, _ = _cloudflare_zone(domain, token)
    name = f"_acme-challenge.{domain}"

    _cloudflare_request("POST", f"/zones/{zone_id}/dns_records", token, {"type": "TXT", "name": name, "content": value, "ttl": 60})


def _cloudflare_clear(domain, token):
    zone_id, _ = _cloudflare_zone(domain, token)
    name = f"_acme-challenge.{domain}"

    for record in _cloudflare_request("GET", f"/zones/{zone_id}/dns_records?type=TXT&name={name}", token) or []:
        _cloudflare_request("DELETE", f"/zones/{zone_id}/dns_records/{record['id']}", token)


PROVIDERS = {
    "freemyip": {"label": "FreeMyIP", "set": _freemyip_set, "clear": _freemyip_clear, "sync": _freemyip_sync},
    "duckdns": {"label": "DuckDNS", "set": _duckdns_set, "clear": _duckdns_clear, "sync": _duckdns_sync},
    "cloudflare": {"label": "Cloudflare", "set": _cloudflare_set, "clear": _cloudflare_clear},
}


# HDOS00109
def provider_syncs_ip(name):
    return "sync" in PROVIDERS.get((name or "").strip().lower(), {})


def provider_names():
    return list(PROVIDERS)


def provider_labels():
    return {name: entry["label"] for name, entry in PROVIDERS.items()}


def get_provider(name):
    provider = PROVIDERS.get((name or "").strip().lower())

    if provider is None:
        raise ProviderError(f"Unknown DNS provider: {name}")

    return provider
