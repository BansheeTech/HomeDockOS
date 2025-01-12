"""
hd_FunctionsNativeSSL.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import os
import ssl


def check_ssl_files(cert_dir):
    cert_path = os.path.join(cert_dir, "cert.pem")
    key_path = os.path.join(cert_dir, "privkey.pem")
    fullchain_path = os.path.join(cert_dir, "fullchain.pem")
    chain_path = os.path.join(cert_dir, "chain.pem")
    return os.path.isfile(cert_path) and os.path.isfile(key_path) and os.path.isfile(fullchain_path) and os.path.isfile(chain_path)


# Only Linux support atm, workaround for Windows & macOS
def ssl_enabled(cert_dir="/DATA/SSLCerts"):
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
