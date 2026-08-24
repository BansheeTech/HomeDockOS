"""
hd_ACMEClient.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import json
import time
import base64
import hashlib
import requests

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, rsa
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

# HDOS00064
DIRECTORY_PRODUCTION = "https://acme-v02.api.letsencrypt.org/directory"
DIRECTORY_STAGING = "https://acme-staging-v02.api.letsencrypt.org/directory"

TIMEOUT = 30
POLL_INTERVAL = 5
POLL_ATTEMPTS = 60


class ACMEError(Exception):
    pass


def b64(data):
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


class ACMEClient:

    def __init__(self, account_key_path, directory_url=DIRECTORY_PRODUCTION, log=print):
        self.directory_url = directory_url
        self.log = log
        self.account_key = self._load_or_create_key(account_key_path)
        self.kid = None
        self._directory = None
        self._nonce = None

    # Ah, oh, keys

    @staticmethod
    def _load_or_create_key(path):
        if os.path.isfile(path):
            with open(path, "rb") as handle:
                return serialization.load_pem_private_key(handle.read(), password=None)

        key = ec.generate_private_key(ec.SECP256R1())

        os.makedirs(os.path.dirname(path), exist_ok=True)

        with open(path, "wb") as handle:
            handle.write(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))

        os.chmod(path, 0o600)

        return key

    @property
    def jwk(self):
        numbers = self.account_key.public_key().public_numbers()

        return {
            "crv": "P-256",
            "kty": "EC",
            "x": b64(numbers.x.to_bytes(32, "big")),
            "y": b64(numbers.y.to_bytes(32, "big")),
        }

    @property
    def thumbprint(self):
        canonical = json.dumps(self.jwk, sort_keys=True, separators=(",", ":")).encode()

        return b64(hashlib.sha256(canonical).digest())

    # Uh, oh, transport

    @property
    def directory(self):
        if self._directory is None:
            response = requests.get(self.directory_url, timeout=TIMEOUT)

            if response.status_code != 200:
                raise ACMEError(f"Directory unavailable: HTTP {response.status_code}")

            self._directory = response.json()

        return self._directory

    def _fresh_nonce(self):
        if self._nonce:
            nonce, self._nonce = self._nonce, None
            return nonce

        response = requests.head(self.directory["newNonce"], timeout=TIMEOUT)

        return response.headers["Replay-Nonce"]

    def _sign(self, url, payload):
        protected = {"alg": "ES256", "nonce": self._fresh_nonce(), "url": url}

        if self.kid:
            protected["kid"] = self.kid
        else:
            protected["jwk"] = self.jwk

        protected_b64 = b64(json.dumps(protected, separators=(",", ":")).encode())
        payload_b64 = "" if payload is None else b64(json.dumps(payload, separators=(",", ":")).encode())

        signing_input = f"{protected_b64}.{payload_b64}".encode()
        der = self.account_key.sign(signing_input, ec.ECDSA(hashes.SHA256()))

        # José Mercé
        r, s = decode_dss_signature(der)
        signature = r.to_bytes(32, "big") + s.to_bytes(32, "big")

        return {"protected": protected_b64, "payload": payload_b64, "signature": b64(signature)}

    def _post(self, url, payload):
        response = requests.post(url, json=self._sign(url, payload), headers={"Content-Type": "application/jose+json"}, timeout=TIMEOUT)

        self._nonce = response.headers.get("Replay-Nonce")

        if response.status_code >= 400:
            try:
                problem = response.json()
                detail = problem.get("detail", response.text)
            except ValueError:
                detail = response.text

            raise ACMEError(f"{url.rsplit('/', 1)[-1]}: {detail}"[:400])

        return response

    def _post_as_get(self, url):
        return self._post(url, None)

    # Doop, wow, flow

    def register(self, contact_email=None):
        payload = {"termsOfServiceAgreed": True}

        if contact_email:
            payload["contact"] = [f"mailto:{contact_email}"]

        response = self._post(self.directory["newAccount"], payload)
        self.kid = response.headers["Location"]

        return self.kid

    def dns_txt_value(self, token):
        key_authorization = f"{token}.{self.thumbprint}"

        return b64(hashlib.sha256(key_authorization.encode()).digest())

    def new_order(self, domains):
        response = self._post(self.directory["newOrder"], {"identifiers": [{"type": "dns", "value": d} for d in domains]})

        order = response.json()
        order["_url"] = response.headers["Location"]

        return order

    def dns_challenges(self, order):
        """Returns [(authorization_url, challenge_url, txt_value, identifier)]."""

        pending = []

        for authorization_url in order["authorizations"]:
            authorization = self._post_as_get(authorization_url).json()

            if authorization["status"] == "valid":
                continue

            challenge = next((c for c in authorization["challenges"] if c["type"] == "dns-01"), None)

            if challenge is None:
                raise ACMEError(f"No dns-01 challenge offered for {authorization['identifier']['value']}")

            pending.append((authorization_url, challenge["url"], self.dns_txt_value(challenge["token"]), authorization["identifier"]["value"]))

        return pending

    def answer_challenge(self, challenge_url):
        self._post(challenge_url, {})

    def wait_for_authorization(self, authorization_url):
        for _ in range(POLL_ATTEMPTS):
            authorization = self._post_as_get(authorization_url).json()
            status = authorization["status"]

            if status == "valid":
                return True

            if status in ("invalid", "revoked", "deactivated", "expired"):
                challenge = next((c for c in authorization.get("challenges", []) if c.get("error")), None)
                detail = (challenge or {}).get("error", {}).get("detail", status)
                raise ACMEError(f"Validation failed for {authorization['identifier']['value']}: {detail}")

            time.sleep(POLL_INTERVAL)

        raise ACMEError("Timed out waiting for validation")

    @staticmethod
    def build_csr(domains, key):
        builder = x509.CertificateSigningRequestBuilder()
        builder = builder.subject_name(x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, domains[0])]))
        builder = builder.add_extension(x509.SubjectAlternativeName([x509.DNSName(d) for d in domains]), critical=False)

        return builder.sign(key, hashes.SHA256())

    def finalize(self, order, csr):
        self._post(order["finalize"], {"csr": b64(csr.public_bytes(serialization.Encoding.DER))})

        for _ in range(POLL_ATTEMPTS):
            current = self._post_as_get(order["_url"]).json()
            status = current["status"]

            if status == "valid":
                return current["certificate"]

            if status == "invalid":
                raise ACMEError(f"Order rejected: {json.dumps(current.get('error', {}))[:300]}")

            time.sleep(POLL_INTERVAL)

        raise ACMEError("Timed out waiting for the certificate to be issued")

    def download_certificate(self, certificate_url):
        return self._post_as_get(certificate_url).text


def generate_certificate_key():
    return rsa.generate_private_key(public_exponent=65537, key_size=4096)
