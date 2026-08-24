"""
hd_CertManager.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import re
import shutil
import threading

from datetime import datetime, timezone

from cryptography import x509
from cryptography.hazmat.primitives import serialization

from pymodules.hd_FunctionsGlobals import current_directory, user_packages_acme_folder, user_packages_acme_staging_folder
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_FunctionsNativeSSL import get_ssl_cert_directory, get_cert_domains_and_type, cert_covers_subdomains_of, reload_ssl_context, ssl_enabled
from pymodules.hd_ACMEClient import ACMEClient, DIRECTORY_PRODUCTION, DIRECTORY_STAGING, generate_certificate_key, ACMEError
from pymodules.hd_ACMEProviders import get_provider, ProviderError
from pymodules.hd_DNSProbe import wait_for_txt

# HDOS00065
ACCOUNT_KEY = os.path.join(user_packages_acme_folder, "account.key")

STAGING_DIR = user_packages_acme_staging_folder

# HDOS00072
_LEGACY_ACME_DIR = os.path.join(current_directory, "_acme")

RENEW_BEFORE_DAYS = 30

# HDOS00070
RESERVED_SUFFIX = "homedock.cloud"

# HDOS00068
DNS_TIMEOUT = 300
DNS_INTERVAL = 5

_PEM_BLOCK = re.compile(r"-----BEGIN CERTIFICATE-----.*?-----END CERTIFICATE-----\n?", re.DOTALL)

MULTI_RECORD = {"cloudflare"}

_lock = threading.Lock()

_state = {"running": False, "step": "", "error": None, "finished_at": None, "staging": False}


def get_state():
    with _lock:
        return dict(_state)


def claim(staging=False):

    with _lock:
        if _state["running"]:
            return False

        _state.update(running=True, step="starting", error=None, finished_at=None, staging=bool(staging))

        return True


def _set_state(**fields):
    with _lock:
        _state.update(fields)


def release(detail):

    _set_state(running=False, step="failed", error=detail, finished_at=datetime.now(timezone.utc).isoformat())


def certificate_expiry(cert_dir=None):
    path = os.path.join(cert_dir or get_ssl_cert_directory(), "fullchain.pem")

    try:
        with open(path, "rb") as handle:
            cert = x509.load_pem_x509_certificate(handle.read())
    except Exception:
        return None

    try:
        return cert.not_valid_after_utc
    except AttributeError:
        return cert.not_valid_after.replace(tzinfo=timezone.utc)


def days_until_expiry(cert_dir=None):
    expiry = certificate_expiry(cert_dir)

    if expiry is None:
        return None

    return (expiry - datetime.now(timezone.utc)).days


def needs_renewal(cert_dir=None):
    remaining = days_until_expiry(cert_dir)

    return remaining is None or remaining <= RENEW_BEFORE_DAYS


# HDOS00072
def migrate_legacy_acme(log=print):

    legacy_key = os.path.join(_LEGACY_ACME_DIR, "account.key")

    if not os.path.isfile(legacy_key) or os.path.isfile(ACCOUNT_KEY):
        return False

    try:
        os.makedirs(os.path.dirname(ACCOUNT_KEY), exist_ok=True)
        shutil.move(legacy_key, ACCOUNT_KEY)
        os.chmod(ACCOUNT_KEY, 0o600)
    except OSError:
        return False

    log(f" * ACME: account key moved out of the application directory to {ACCOUNT_KEY}")

    return True


def is_reserved_domain(domain):
    domain = (domain or "").strip().lower().rstrip(".")

    return domain == RESERVED_SUFFIX or domain.endswith("." + RESERVED_SUFFIX)


# HDOS00070
def renewal_status():

    config = read_config()

    domain = (config.get("dynamic_dns") or "").strip().lower().rstrip(".")
    provider = (config.get("acme_provider") or "").strip().lower()
    token = config.get("acme_token") or ""

    if not provider or not token:
        return {"managed": False, "reason": "no DNS provider configured", "domain": domain}

    if not domain or "." not in domain:
        return {"managed": False, "reason": "no domain configured", "domain": domain}

    if is_reserved_domain(domain):
        return {"managed": False, "reason": "HomeDock Cloud renews this one", "domain": domain}

    if not ssl_enabled():
        return {"managed": False, "reason": "no certificate installed", "domain": domain}

    if not cert_covers_subdomains_of(domain):
        return {"managed": False, "reason": "the installed certificate is not the one we issue", "domain": domain}

    return {"managed": True, "reason": "", "domain": domain, "provider": provider, "token": token}


def renew_if_needed(force=False, log=print):
    status = renewal_status()

    if not status["managed"]:
        return None

    if not force and not needs_renewal():
        return None

    remaining = days_until_expiry()
    log(f" * ACME: renewing {status['domain']}, {remaining} day(s) left")

    return issue_certificate(status["domain"], status["provider"], status["token"], log=log)


def _write_bundle(cert_dir, chain_pem, key):
    blocks = _PEM_BLOCK.findall(chain_pem)

    if not blocks:
        raise ACMEError("Let's Encrypt returned no certificate")

    os.makedirs(cert_dir, exist_ok=True)

    payloads = {
        "fullchain.pem": chain_pem,
        "cert.pem": blocks[0],
        "chain.pem": "".join(blocks[1:]) or blocks[0],
        "privkey.pem": key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.TraditionalOpenSSL, serialization.NoEncryption()).decode(),
    }

    for name, payload in payloads.items():
        target = os.path.join(cert_dir, name)

        with open(target, "w") as handle:
            handle.write(payload)

        os.chmod(target, 0o600 if name == "privkey.pem" else 0o644)

    return sorted(payloads)


def issue_certificate(domain, provider_name, token, staging=False, cert_dir=None, log=print, claimed=False):

    # HDOS00082
    if not claimed and not claim(staging):
        raise ACMEError("A certificate request is already running")

    provider = None
    domain = (domain or "").strip().lower().rstrip(".")

    try:
        if not domain or "." not in domain:
            raise ACMEError("A domain name is required")

        provider = get_provider(provider_name)
        cert_dir = cert_dir or get_ssl_cert_directory()

        # HDOS00067
        if staging and os.path.abspath(cert_dir) == os.path.abspath(get_ssl_cert_directory()):
            cert_dir = STAGING_DIR
            log(f" * ACME: test run, writing to {cert_dir} instead of the live directory")

        domains = [domain, f"*.{domain}"]

        migrate_legacy_acme(log=log)

        log(f" * ACME: requesting {domains[0]} and {domains[1]}")

        client = ACMEClient(ACCOUNT_KEY, directory_url=DIRECTORY_STAGING if staging else DIRECTORY_PRODUCTION, log=log)

        _set_state(step="account")
        client.register()

        _set_state(step="order")
        order = client.new_order(domains)

        pending = client.dns_challenges(order)

        if pending:
            batched = provider_name.strip().lower() in MULTI_RECORD

            if batched:
                _set_state(step="dns")

                try:
                    provider["clear"](domain, token)
                except ProviderError:
                    pass

                for _, _, txt, identifier in pending:
                    provider["set"](domain, token, txt)
                    log(f" * ACME: TXT published for {identifier}")

            for index, (authorization_url, challenge_url, txt, identifier) in enumerate(pending, start=1):
                _set_state(step=f"challenge {index}/{len(pending)}")

                if not batched:
                    provider["set"](domain, token, txt)
                    log(f" * ACME: TXT published for {identifier}")

                if not wait_for_txt(domain, txt, timeout=DNS_TIMEOUT, interval=DNS_INTERVAL, log=log):
                    raise ACMEError(f"The TXT record for {identifier} never appeared on the authoritative servers within {DNS_TIMEOUT}s")

                client.answer_challenge(challenge_url)
                client.wait_for_authorization(authorization_url)

                log(f" * ACME: {identifier} validated")

                if not batched:
                    try:
                        provider["clear"](domain, token)
                    except ProviderError:
                        pass

            if batched:
                try:
                    provider["clear"](domain, token)
                except ProviderError:
                    pass

        _set_state(step="finalizing")

        key = generate_certificate_key()
        certificate_url = client.finalize(order, ACMEClient.build_csr(domains, key))
        chain = client.download_certificate(certificate_url)

        _set_state(step="writing")
        written = _write_bundle(cert_dir, chain, key)

        log(f" * ACME: certificate installed in {cert_dir} ({', '.join(written)})")

        # HDOS00069
        if os.path.abspath(cert_dir) == os.path.abspath(get_ssl_cert_directory()):
            if reload_ssl_context(cert_dir):
                log(" * ACME: live SSL context reloaded, new connections already use it")
            else:
                log(" * ACME: could not reload the SSL context, a restart will pick it up")

        _set_state(running=False, step="done", finished_at=datetime.now(timezone.utc).isoformat())

        return {"domains": domains, "directory": cert_dir, "files": written}

    except Exception as error:
        detail = str(error) if isinstance(error, (ACMEError, ProviderError)) else f"{type(error).__name__}: {error}"

        _set_state(running=False, step="failed", error=detail, finished_at=datetime.now(timezone.utc).isoformat())

        if provider is not None:
            try:
                provider["clear"](domain, token)
            except Exception:
                pass

        raise
