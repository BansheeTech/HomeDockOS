"""
hd_FunctionsNativeSSL.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import ssl

from cryptography import x509
from cryptography.hazmat.backends import default_backend

from pymodules.hd_FunctionsGlobals import running_OS


def get_ssl_cert_directory():
    if running_OS == "Linux":
        return "/DATA/SSLCerts"
    elif running_OS == "Darwin":
        return f"{os.path.expanduser('~')}/HomeDock/SSLCerts"
    elif running_OS == "Windows":
        return "C:/HomeDock/SSLCerts"
    else:
        return "/DATA/SSLCerts"


def get_ssl_cert_directory_for_containers():
    if running_OS == "Linux":
        return "/DATA/SSLCerts"
    elif running_OS == "Darwin":
        return f"{os.path.expanduser('~')}/HomeDock/SSLCerts"
    elif running_OS == "Windows":
        return "/mnt/c/HomeDock/SSLCerts"
    else:
        return "/DATA/SSLCerts"


def check_ssl_files(cert_dir):
    cert_path = os.path.join(cert_dir, "cert.pem")
    key_path = os.path.join(cert_dir, "privkey.pem")
    fullchain_path = os.path.join(cert_dir, "fullchain.pem")
    chain_path = os.path.join(cert_dir, "chain.pem")
    return os.path.isfile(cert_path) and os.path.isfile(key_path) and os.path.isfile(fullchain_path) and os.path.isfile(chain_path)


def ssl_enabled(cert_dir=None):
    if cert_dir is None:
        cert_dir = get_ssl_cert_directory()
    return check_ssl_files(cert_dir)


def get_ssl_cert_info(cert_path):
    try:
        cert = ssl._ssl._test_decode_cert(cert_path)
        issuer = dict(x[0] for x in cert["issuer"])
        issuer_cn = issuer.get("commonName", "Unknown Issuer")
        issuer_o = issuer.get("organizationName", "Unknown Organization")
        return {"version": cert["version"], "notBefore": cert["notBefore"], "notAfter": cert["notAfter"], "issuerCN": issuer_cn, "issuerO": issuer_o}
    except Exception as e:
        return {"error": str(e)}


# HDOS00069
_live_context = {"context": None}


def capture_ssl_context(config):
    original = config.create_ssl_context

    def wrapper():
        context = original()
        _live_context["context"] = context
        return context

    config.create_ssl_context = wrapper


def ssl_context_active():
    return _live_context.get("context") is not None


def restart_pending(cert_dir=None):

    return ssl_enabled(cert_dir) and not ssl_context_active()


def reload_ssl_context(cert_dir=None):
    context = _live_context.get("context")

    if context is None:
        return False

    cert_dir = cert_dir or get_ssl_cert_directory()

    try:
        context.load_cert_chain(os.path.join(cert_dir, "fullchain.pem"), os.path.join(cert_dir, "privkey.pem"))
    except (OSError, ssl.SSLError):
        return False

    return True


# HDOS00062
def cert_covers_subdomains_of(host, cert_dir=None):

    if not host:
        return False

    bare = host.strip().lower().split(":")[0].rstrip(".")
    if not bare:
        return False

    target = f"*.{bare}"

    domains = get_cert_domains_and_type(cert_dir).get("domains", [])

    return any(domain.strip().lower() == target for domain in domains)


def get_cert_domains_and_type(cert_dir=None):
    if cert_dir is None:
        cert_dir = get_ssl_cert_directory()
    cert_path = os.path.join(cert_dir, "fullchain.pem")

    try:
        with open(cert_path, "rb") as f:
            cert_data = f.read()
            cert = x509.load_pem_x509_certificate(cert_data, default_backend())

        subject = cert.subject
        cn = subject.get_attributes_for_oid(x509.NameOID.COMMON_NAME)[0].value

        domains = [cn]
        try:
            san_ext = cert.extensions.get_extension_for_oid(x509.ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            san_domains = san_ext.value.get_values_for_type(x509.DNSName)
            domains.extend(san_domains)
        except x509.ExtensionNotFound:
            pass

        issuer = cert.issuer
        is_self_signed = issuer == subject

        return {"domains": list(set(domains)), "is_self_signed": is_self_signed}
    except Exception:
        return {"domains": [], "is_self_signed": False}
