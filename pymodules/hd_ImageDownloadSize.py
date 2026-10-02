"""
hd_ImageDownloadSize.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import re
import time
import yaml
import requests

from threading import Lock
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor

from pymodules.hd_FunctionsGlobals import running_ARCH

NO_MATCHING_IMAGE = "no-matching-image"

REQUEST_TIMEOUT = 8
CACHE_TTL = 6 * 60 * 60
FAILURE_TTL = 10 * 60

MANIFEST_ACCEPT = ", ".join(
    [
        "application/vnd.oci.image.index.v1+json",
        "application/vnd.docker.distribution.manifest.list.v2+json",
        "application/vnd.oci.image.manifest.v1+json",
        "application/vnd.docker.distribution.manifest.v2+json",
    ]
)

ARCH_ALIASES = {
    "x86_64": ("amd64", None),
    "amd64": ("amd64", None),
    "aarch64": ("arm64", None),
    "arm64": ("arm64", None),
    "armv7l": ("arm", "v7"),
    "armv6l": ("arm", "v6"),
}

_cache = {}
_cache_lock = Lock()


def host_architecture():
    architecture, _ = ARCH_ALIASES.get(running_ARCH.lower(), ("amd64", None))
    return architecture


def _platform_for(architecture):
    for alias, target in ARCH_ALIASES.items():
        if target[0] == architecture:
            return ARCH_ALIASES[alias]
    return (architecture, None)


def parse_image_reference(image):
    reference = image.strip()
    digest = None

    if "@" in reference:
        reference, digest = reference.split("@", 1)

    first, _, rest = reference.partition("/")
    if rest and ("." in first or ":" in first or first == "localhost"):
        registry, path = first, rest
    else:
        registry, path = "docker.io", reference

    tag = None if digest else "latest"
    last_segment = path.rsplit("/", 1)[-1]
    if ":" in last_segment:
        path, tag = path.rsplit(":", 1)

    if registry in ("docker.io", "index.docker.io", "registry-1.docker.io"):
        registry = "docker.io"
        if "/" not in path:
            path = f"library/{path}"

    return registry, path, tag, digest


def compose_images(yml_str):
    neutral = re.sub(r"\[\[[A-Z0-9_]+\]\]", "placeholder", yml_str)
    try:
        data = yaml.safe_load(neutral) or {}
    except yaml.YAMLError:
        return []

    images = []
    for service in (data.get("services") or {}).values():
        image = (service or {}).get("image")
        if isinstance(image, str) and image.strip() and image not in images:
            images.append(image.strip())
    return images


def _matches_platform(entry, architecture, variant):
    if entry.get("os") != "linux" or entry.get("architecture") != architecture:
        return False
    return variant is None or entry.get("variant") in (None, variant)


def _docker_hub_size(path, tag, architecture, variant):
    if not tag:
        return None

    response = requests.get(f"https://hub.docker.com/v2/repositories/{path}/tags/{tag}", timeout=REQUEST_TIMEOUT)
    if response.status_code != 200:
        return None

    platforms = response.json().get("images", [])
    for entry in platforms:
        if _matches_platform(entry, architecture, variant) and entry.get("size"):
            return int(entry["size"])
    return NO_MATCHING_IMAGE if platforms else None


@lru_cache(maxsize=32)
def _registry_challenge(registry):
    probe = requests.get(f"https://{registry}/v2/", timeout=REQUEST_TIMEOUT)
    challenge = probe.headers.get("WWW-Authenticate", "")
    if probe.status_code != 401 or not challenge.lower().startswith("bearer"):
        return {}
    return dict(re.findall(r'(\w+)="([^"]*)"', challenge))


def _registry_token(challenge, path):
    params = dict(challenge)
    realm = params.pop("realm", None)
    if not realm:
        return None

    params["scope"] = f"repository:{path}:pull"
    response = requests.get(realm, params=params, timeout=REQUEST_TIMEOUT)
    if response.status_code != 200:
        return None

    body = response.json()
    return body.get("token") or body.get("access_token")


def _registry_size(registry, path, tag, digest, architecture, variant):
    challenge = _registry_challenge(registry)
    if challenge.get("realm", "").startswith("https://auth.docker.io/"):
        return _docker_hub_size(path, tag, architecture, variant)

    reference = digest or tag

    token = _registry_token(challenge, path)
    headers = {"Accept": MANIFEST_ACCEPT}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    def fetch(ref):
        response = requests.get(f"https://{registry}/v2/{path}/manifests/{ref}", headers=headers, timeout=REQUEST_TIMEOUT)
        return response.json() if response.status_code == 200 else None

    manifest = fetch(reference)
    if manifest and "manifests" in manifest:
        entry = next((item for item in manifest["manifests"] if _matches_platform(item.get("platform", {}), architecture, variant)), None)
        if not entry:
            return NO_MATCHING_IMAGE
        manifest = fetch(entry["digest"])

    if not manifest or "layers" not in manifest:
        return None

    return sum(int(layer.get("size", 0)) for layer in manifest["layers"])


def image_download_size(image, architecture=None):
    architecture = architecture or host_architecture()
    key = (image, architecture)
    now = time.time()

    with _cache_lock:
        cached = _cache.get(key)
        if cached and cached[1] > now:
            return cached[0]

    arch, variant = _platform_for(architecture)
    registry, path, tag, digest = parse_image_reference(image)

    try:
        if registry == "docker.io":
            size = _docker_hub_size(path, tag, arch, variant)
        else:
            size = _registry_size(registry, path, tag, digest, arch, variant)
    except (requests.RequestException, ValueError, KeyError, TypeError) as e:
        print(f" + Could not get download size for {image}: {e}")
        size = None

    with _cache_lock:
        _cache[key] = (size, now + (CACHE_TTL if size is not None else FAILURE_TTL))

    return size


def images_download_size(images, architecture=None):
    if not images:
        return None

    architecture = architecture or host_architecture()
    with ThreadPoolExecutor(max_workers=min(4, len(images))) as pool:
        sizes = list(pool.map(lambda image: image_download_size(image, architecture), images))

    if NO_MATCHING_IMAGE in sizes:
        return {"size": None, "complete": False, "compatible": False}

    known = [size for size in sizes if size is not None]
    if not known:
        return None

    return {"size": sum(known), "complete": len(known) == len(sizes), "compatible": True}
