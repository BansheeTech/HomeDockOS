"""
hd_SubdomainRouter.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import re
import time
import base64
import hashlib
import asyncio

from urllib.parse import quote, unquote

from pymodules.hd_FunctionsHostSelector import docker_host
from pymodules.hd_FunctionsConfig import read_config
from pymodules.hd_TrustedProxy import is_trusted_peer
from pymodules.hd_AppSubdomains import resolve_app_for_host
from pymodules.hd_AppExposure import is_directly_exposed
from pymodules.hd_SubdomainAuth import TOKEN_COOKIE_NAME, TOKEN_QUERY_PARAM, HANDOFF_MAX_AGE, SESSION_MAX_AGE, verify_app_token

aiohttp = None
yarl_url = None

AIOHTTP_UNAVAILABLE_REASON = None

_aiohttp_resolved = False


def _load_aiohttp():
    global aiohttp, yarl_url, _aiohttp_resolved, AIOHTTP_UNAVAILABLE_REASON

    if _aiohttp_resolved:
        return aiohttp is not None

    try:
        import aiohttp as aiohttp_module
        from yarl import URL

        aiohttp = aiohttp_module
        yarl_url = URL
    except Exception as e:
        AIOHTTP_UNAVAILABLE_REASON = str(e)

    _aiohttp_resolved = True

    return aiohttp is not None


# HDOS00023
HOP_BY_HOP_HEADERS = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"}

FRAMING_HEADERS = {"x-frame-options", "cross-origin-resource-policy"}

_COOKIE_DOMAIN_RE = re.compile(r";\s*Domain=[^;]*", re.IGNORECASE)
_FRAME_ANCESTORS_RE = re.compile(r"^\s*frame-ancestors\b", re.IGNORECASE)
_SCRIPT_SRC_RE = re.compile(r"^\s*script-src\b", re.IGNORECASE)
_DEFAULT_SRC_RE = re.compile(r"^\s*default-src\b", re.IGNORECASE)
_HEAD_OPEN_RE = re.compile(rb"<head\b[^>]*>", re.IGNORECASE)
_HTML_OPEN_RE = re.compile(rb"<html\b[^>]*>", re.IGNORECASE)

# HDOS00049
_WINDOW_SHIM = b'(function(){var p=window.parent;try{p.location.href}catch(e){window.parent=window}var d=document.documentElement;d.style.background="transparent";document.addEventListener("DOMContentLoaded",function(){d.style.background=""});var f=window.requestAnimationFrame||function(c){setTimeout(c,16)};function s(){try{p.postMessage("homedock:app-painted","*")}catch(e){}}function r(){f(function(){f(s)})}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",r)}else{r()}})()'
_SHIM_TAG = b"<script>" + _WINDOW_SHIM + b"</script>"
_SHIM_CSP_HASH = "'sha256-" + base64.b64encode(hashlib.sha256(_WINDOW_SHIM).digest()).decode() + "'"

_HTML_CONTENT_TYPES = ("text/html", "application/xhtml+xml")

_DOCUMENT_DESTINATIONS = ("document", "iframe", "frame", "embed", "object")

_MAX_SHIM_BODY = 4 * 1024 * 1024

_PROTOCOL_CACHE_TTL = 300
_protocol_cache = {}

# HDOS00121
_PROBE_TIMEOUT = 2
_probe_locks = {}

# HDOS00121
_CONNECTION_LIMIT = 256
_CONNECTION_LIMIT_PER_HOST = 32

_session = None
_uncapped_session = None
_session_loop = None


def subdomain_routing_available():
    return _load_aiohttp()


def _new_session(connector):
    timeout = aiohttp.ClientTimeout(total=None, connect=15, sock_connect=15, sock_read=None)

    return aiohttp.ClientSession(timeout=timeout, connector=connector, auto_decompress=False, cookie_jar=aiohttp.DummyCookieJar())


def _refresh_sessions():
    global _session, _uncapped_session, _session_loop

    loop = asyncio.get_running_loop()

    if _session is not None and not _session.closed and _uncapped_session is not None and not _uncapped_session.closed and _session_loop is loop:
        return

    # HDOS00040 HDOS00121
    _session = _new_session(aiohttp.TCPConnector(ssl=False, limit=_CONNECTION_LIMIT, limit_per_host=_CONNECTION_LIMIT_PER_HOST, force_close=True))
    _uncapped_session = _new_session(aiohttp.TCPConnector(ssl=False, limit=0, force_close=True))

    _probe_locks.clear()
    _session_loop = loop


async def _get_session():
    _refresh_sessions()

    return _session


async def _get_uncapped_session():
    _refresh_sessions()

    return _uncapped_session


# HDOS00121
def _is_backend_failure(error):
    return isinstance(error, (aiohttp.ClientConnectorError, aiohttp.ServerDisconnectedError))


def _cached_protocol(port):
    cached = _protocol_cache.get(port)

    if cached and (time.monotonic() - cached[1]) < _PROTOCOL_CACHE_TTL:
        return cached[0]

    return None


async def _probe_protocol(port):

    protocol = _cached_protocol(port)

    if protocol:
        return protocol

    # HDOS00121
    session = await _get_uncapped_session()

    lock = _probe_locks.get(port)

    if lock is None:
        lock = _probe_locks.setdefault(port, asyncio.Lock())

    async with lock:
        protocol = _cached_protocol(port)

        if protocol:
            return protocol

        timeout = aiohttp.ClientTimeout(total=_PROBE_TIMEOUT, connect=_PROBE_TIMEOUT, sock_connect=_PROBE_TIMEOUT)

        for candidate in ("https", "http"):
            try:
                async with session.request("HEAD", f"{candidate}://{docker_host}:{port}/", allow_redirects=False, timeout=timeout) as response:
                    if response.status:
                        _protocol_cache[port] = (candidate, time.monotonic())
                        return candidate
            except Exception:
                continue

        _protocol_cache[port] = ("http", time.monotonic())

        return "http"


def _headers_to_dict(raw_headers):
    headers = {}

    for key, value in raw_headers:
        name = key.decode("latin-1").lower()
        headers.setdefault(name, []).append(value.decode("latin-1"))

    return headers


def _get_header(raw_headers, name):
    target = name.encode("latin-1")

    for key, value in raw_headers:
        if key.lower() == target:
            return value.decode("latin-1")

    return None


def _parse_cookies(cookie_header):
    cookies = {}

    if not cookie_header:
        return cookies

    # HDOS00024
    for chunk in cookie_header.split(";"):
        name, separator, value = chunk.partition("=")
        if separator:
            cookies[name.strip()] = value.strip()

    return cookies


def _strip_own_cookie(cookie_header):
    if not cookie_header:
        return None

    kept = []

    for chunk in cookie_header.split(";"):
        name = chunk.partition("=")[0].strip()
        if name != TOKEN_COOKIE_NAME:
            kept.append(chunk.strip())

    return "; ".join(kept) if kept else None


def _clean_csp(value, allow_shim=False):
    directives = [directive.strip() for directive in value.split(";") if directive.strip() and not _FRAME_ANCESTORS_RE.match(directive)]

    if allow_shim:
        # HDOS00050
        for index, directive in enumerate(directives):
            if _SCRIPT_SRC_RE.match(directive):
                directives[index] = f"{directive} {_SHIM_CSP_HASH}"
                break
        else:
            for directive in directives:
                if _DEFAULT_SRC_RE.match(directive):
                    inherited = directive.split(None, 1)[1] if len(directive.split(None, 1)) > 1 else ""
                    directives.append(f"script-src {inherited} {_SHIM_CSP_HASH}".strip())
                    break

    return "; ".join(directives)


def _inject_shim(body):

    # HDOS00053
    match = _HEAD_OPEN_RE.search(body) or _HTML_OPEN_RE.search(body)

    if match is None:
        return body

    return body[: match.end()] + _SHIM_TAG + body[match.end() :]


def _wants_shim(scope, response):
    # HDOS00054
    if scope["method"] != "GET":
        return False

    if response.headers.get("content-encoding"):
        return False

    content_type = (response.headers.get("content-type") or "").split(";")[0].strip().lower()

    if content_type not in _HTML_CONTENT_TYPES:
        return False

    declared = response.headers.get("content-length")

    return not (declared and declared.isdigit() and int(declared) > _MAX_SHIM_BODY)


async def _read_capped(response, limit):

    chunks = []
    total = 0

    async for chunk in response.content.iter_chunked(65536):
        chunks.append(chunk)
        total += len(chunk)

        if total > limit:
            return b"".join(chunks), False

    return b"".join(chunks), True


def _is_document_request(scope):
    # HDOS00052
    destination = _get_header(scope["headers"], "sec-fetch-dest")

    if destination is not None:
        return destination.strip().lower() in _DOCUMENT_DESTINATIONS

    return "text/html" in (_get_header(scope["headers"], "accept") or "").lower()


def _build_backend_headers(scope, backend_host, public_host, scheme):
    headers = {}

    for key, value in scope["headers"]:
        name = key.decode("latin-1").lower()

        if name in HOP_BY_HOP_HEADERS:
            continue

        decoded = value.decode("latin-1")

        # HDOS00025
        if name == "cookie":
            decoded = _strip_own_cookie(decoded)
            if decoded is None:
                continue

        if name in headers:
            headers[name] = f"{headers[name]}, {decoded}"
        else:
            headers[name] = decoded

    # HDOS00051
    if _is_document_request(scope):
        headers["accept-encoding"] = "identity"

    # HDOS00039
    headers["host"] = public_host

    client = scope.get("client")
    if client:
        existing = headers.get("x-forwarded-for")
        headers["x-forwarded-for"] = f"{existing}, {client[0]}" if existing else client[0]

    headers["x-forwarded-proto"] = scheme
    headers["x-forwarded-host"] = public_host
    headers["x-real-ip"] = client[0] if client else ""

    return {name: value for name, value in headers.items() if value != ""}


def _build_client_headers(response, backend_host, public_host, scheme, shimmed=False, body_length=None):
    headers = []

    for name, value in response.headers.items():
        lowered = name.lower()

        if lowered in HOP_BY_HOP_HEADERS or lowered in FRAMING_HEADERS:
            continue

        if lowered == "content-length" and body_length is not None:
            continue

        if lowered == "content-security-policy" or lowered == "content-security-policy-report-only":
            value = _clean_csp(value, allow_shim=shimmed)
            if not value:
                continue

        elif lowered == "location":
            value = _rewrite_location(value, backend_host, public_host, scheme)

        elif lowered == "set-cookie":
            # HDOS00026
            value = _COOKIE_DOMAIN_RE.sub("", value)

        headers.append((lowered.encode("latin-1"), value.encode("latin-1")))

    # HDOS00038
    headers.append((b"cross-origin-resource-policy", b"cross-origin"))

    if body_length is not None:
        headers.append((b"content-length", str(body_length).encode("latin-1")))

    return headers


def _rewrite_location(value, backend_host, public_host, scheme):
    for protocol in ("http", "https"):
        prefix = f"{protocol}://{backend_host}"
        if value.startswith(prefix):
            return f"{scheme}://{public_host}" + value[len(prefix) :]

        bare = backend_host.split(":")[0]
        prefix = f"{protocol}://{bare}/"
        if value.startswith(prefix):
            return f"{scheme}://{public_host}/" + value[len(prefix) :]

    return value


def _split_token(query_string):

    if not query_string:
        return None, ""

    token = None
    kept = []

    for pair in query_string.split("&"):
        key, _, value = pair.partition("=")

        if key == TOKEN_QUERY_PARAM and token is None:
            token = unquote(value)
        else:
            kept.append(pair)

    return token, "&".join(kept)


def _raw_path(scope):

    raw = scope.get("raw_path")

    if isinstance(raw, bytes):
        return raw.decode("latin-1")

    if isinstance(raw, str):
        return raw

    return quote(scope["path"])


async def _send_simple_response(send, status, headers, body):
    await send({"type": "http.response.start", "status": status, "headers": headers})
    await send({"type": "http.response.body", "body": body, "more_body": False})


def _is_trustworthy_host(host):

    hostname = (host or "").strip().lower().split(":")[0].rstrip(".")

    return hostname in ("localhost", "127.0.0.1", "::1", "[::1]") or hostname.endswith(".localhost")


def _handoff_cookie(token, scheme, public_host):

    cookie = f"{TOKEN_COOKIE_NAME}={token}; Path=/; HttpOnly; Max-Age={SESSION_MAX_AGE}"

    # HDOS00042
    if scheme == "https" or _is_trustworthy_host(public_host):
        return cookie + "; SameSite=None; Secure"

    return cookie + "; SameSite=Lax"


async def _authorize(scope, send, app, scheme, public_host):
    slug = app["slug"]

    raw_headers = scope["headers"]
    cookies = _parse_cookies(_get_header(raw_headers, "cookie"))

    # HDOS00112
    if is_directly_exposed(slug, app["host_trail"], scheme):
        return True

    if verify_app_token(cookies.get(TOKEN_COOKIE_NAME), slug, SESSION_MAX_AGE):
        return True

    query_string = scope.get("query_string", b"").decode("latin-1")
    token, remaining = _split_token(query_string)

    if token and verify_app_token(token, slug, HANDOFF_MAX_AGE):
        if scope["type"] == "websocket":
            return True

        location = _raw_path(scope) + (f"?{remaining}" if remaining else "")

        cookie = _handoff_cookie(token, scheme, public_host)

        await _send_simple_response(
            send,
            302,
            [
                (b"location", location.encode("latin-1")),
                (b"set-cookie", cookie.encode("latin-1")),
                (b"referrer-policy", b"no-referrer"),
                (b"cache-control", b"no-store"),
                (b"content-length", b"0"),
            ],
            b"",
        )

        return False

    if scope["type"] == "websocket":
        await send({"type": "websocket.close", "code": 1008})
        return False

    # HDOS00056
    if _is_document_request(scope):
        port = public_host.partition(":")[2]
        target = f"{scheme}://{app['host_trail']}" + (f":{port}" if port else "") + f"/appdenied?app={quote(slug)}"

        await _send_simple_response(
            send,
            302,
            [(b"location", target.encode("latin-1")), (b"referrer-policy", b"no-referrer"), (b"cache-control", b"no-store"), (b"content-length", b"0")],
            b"",
        )

        return False

    body = b"Not authorized."

    await _send_simple_response(
        send,
        403,
        [(b"content-type", b"text/plain; charset=utf-8"), (b"content-length", str(len(body)).encode("latin-1")), (b"cache-control", b"no-store")],
        body,
    )

    return False


async def _stream_request_body(receive):
    while True:
        message = await receive()

        if message["type"] == "http.disconnect":
            break

        body = message.get("body", b"")
        if body:
            yield body

        if not message.get("more_body", False):
            break


async def _proxy_http(scope, receive, send, app, scheme, public_host):
    port = app["port"]
    protocol = await _probe_protocol(port)
    backend_host = f"{docker_host}:{port}"

    query_string = scope.get("query_string", b"").decode("latin-1")
    _, remaining = _split_token(query_string)

    path = _raw_path(scope)

    # HDOS00027
    if path == "/" and app["trail"]:
        location = "/" + app["trail"].lstrip("/")
        await _send_simple_response(send, 302, [(b"location", location.encode("latin-1")), (b"content-length", b"0")], b"")
        return

    target = f"{protocol}://{backend_host}{path}"
    if remaining:
        target += f"?{remaining}"

    url = yarl_url(target, encoded=True)

    headers = _build_backend_headers(scope, backend_host, public_host, scheme)

    has_body = "content-length" in headers or "transfer-encoding" in {key.decode("latin-1").lower() for key, _ in scope["headers"]}
    data = _stream_request_body(receive) if has_body else None

    session = await _get_session()

    try:
        async with session.request(scope["method"], url, headers=headers, data=data, allow_redirects=False) as response:
            buffered = b""

            # HDOS00049
            if _is_document_request(scope) and _wants_shim(scope, response):
                buffered, complete = await _read_capped(response, _MAX_SHIM_BODY)

                if complete:
                    body = _inject_shim(buffered)

                    if body is not buffered:
                        await send({"type": "http.response.start", "status": response.status, "headers": _build_client_headers(response, backend_host, public_host, scheme, shimmed=True, body_length=len(body))})
                        await send({"type": "http.response.body", "body": body, "more_body": False})
                        return

            await send({"type": "http.response.start", "status": response.status, "headers": _build_client_headers(response, backend_host, public_host, scheme)})

            if buffered:
                await send({"type": "http.response.body", "body": buffered, "more_body": True})

            async for chunk in response.content.iter_chunked(65536):
                await send({"type": "http.response.body", "body": chunk, "more_body": True})

            await send({"type": "http.response.body", "body": b"", "more_body": False})

    except asyncio.CancelledError:
        raise

    except Exception as e:
        # HDOS00028 HDOS00121
        if _is_backend_failure(e):
            _protocol_cache.pop(port, None)

        print(f" ! Subdomain proxy error for '{app['slug']}' ({backend_host}) {scope['method']} {path}: {type(e).__name__}: {e}")

        body = b"Application unavailable."
        try:
            await _send_simple_response(send, 502, [(b"content-type", b"text/plain; charset=utf-8"), (b"content-length", str(len(body)).encode("latin-1"))], body)
        except Exception:
            pass


async def _pump_client_to_backend(receive, ws):

    while True:
        message = await receive()
        kind = message["type"]

        try:
            if kind == "websocket.disconnect":
                await ws.close(code=message.get("code", 1000))
                return

            if kind == "websocket.receive":
                if message.get("bytes") is not None:
                    await ws.send_bytes(message["bytes"])
                elif message.get("text") is not None:
                    await ws.send_str(message["text"])

        except asyncio.CancelledError:
            raise

        except Exception:
            # HDOS00035
            return


async def _pump_backend_to_client(ws, send):
    try:
        async for message in ws:
            if message.type == aiohttp.WSMsgType.TEXT:
                await send({"type": "websocket.send", "text": message.data})
            elif message.type == aiohttp.WSMsgType.BINARY:
                await send({"type": "websocket.send", "bytes": message.data})
            elif message.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSING, aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.ERROR):
                break

    except asyncio.CancelledError:
        raise

    except Exception:
        pass

    try:
        await send({"type": "websocket.close", "code": ws.close_code or 1000})
    except Exception:
        pass


async def _proxy_websocket(scope, receive, send, app, scheme, public_host):
    port = app["port"]
    protocol = await _probe_protocol(port)
    backend_host = f"{docker_host}:{port}"

    ws_scheme = "wss" if protocol == "https" else "ws"

    query_string = scope.get("query_string", b"").decode("latin-1")
    _, remaining = _split_token(query_string)

    target = f"{ws_scheme}://{backend_host}{_raw_path(scope)}"
    if remaining:
        target += f"?{remaining}"

    url = yarl_url(target, encoded=True)

    headers = _build_backend_headers(scope, backend_host, public_host, scheme)

    # HDOS00029
    for name in ("sec-websocket-key", "sec-websocket-version", "sec-websocket-extensions", "sec-websocket-protocol", "connection", "upgrade"):
        headers.pop(name, None)

    subprotocols = scope.get("subprotocols") or []

    # HDOS00121
    session = await _get_uncapped_session()

    try:
        # HDOS00030
        async with session.ws_connect(url, headers=headers, protocols=subprotocols, heartbeat=30, autoping=True, max_msg_size=0) as ws:
            await send({"type": "websocket.accept", "subprotocol": ws.protocol})

            client_task = asyncio.ensure_future(_pump_client_to_backend(receive, ws))
            backend_task = asyncio.ensure_future(_pump_backend_to_client(ws, send))

            done, pending = await asyncio.wait({client_task, backend_task}, return_when=asyncio.FIRST_COMPLETED)

            for task in pending:
                task.cancel()

            for task in done:
                exception = task.exception()
                if exception and not isinstance(exception, asyncio.CancelledError):
                    raise exception

    except asyncio.CancelledError:
        raise

    except Exception as e:
        # HDOS00121
        if _is_backend_failure(e):
            _protocol_cache.pop(port, None)

        print(f" ! Subdomain websocket error for '{app['slug']}' ({backend_host}): {e}")

        try:
            await send({"type": "websocket.close", "code": 1011})
        except Exception:
            pass


# HDOS00060
_reverse_proxy_mode = None


def _reverse_proxy_enabled():
    global _reverse_proxy_mode

    if _reverse_proxy_mode is None:
        try:
            _reverse_proxy_mode = bool(read_config().get("reverse_proxy", False))
        except Exception:
            _reverse_proxy_mode = False

    return _reverse_proxy_mode


def _public_host_and_scheme(scope):

    host_header = _get_header(scope["headers"], "host")

    scheme = scope.get("scheme", "http")
    if scheme in ("ws", "wss"):
        scheme = "https" if scheme == "wss" else "http"

    if not _reverse_proxy_enabled():
        return host_header, scheme

    # HDOS00061
    client = scope.get("client")
    if not is_trusted_peer(client[0] if client else None):
        return host_header, scheme

    forwarded_host = _get_header(scope["headers"], "x-forwarded-host")
    if forwarded_host:
        candidate = forwarded_host.split(",")[0].strip()
        if candidate:
            host_header = candidate

    forwarded_proto = _get_header(scope["headers"], "x-forwarded-proto")
    if forwarded_proto:
        candidate = forwarded_proto.split(",")[0].strip().lower()
        if candidate in ("http", "https"):
            scheme = candidate

    return host_header, scheme


def wrap_asgi_with_subdomain_router(downstream):

    async def router(scope, receive, send):
        if scope["type"] not in ("http", "websocket") or not _load_aiohttp():
            await downstream(scope, receive, send)
            return

        host_header, scheme = _public_host_and_scheme(scope)
        app = resolve_app_for_host(host_header)

        if app is None:
            await downstream(scope, receive, send)
            return

        public_host = host_header.strip()

        if scope["type"] == "websocket":
            message = await receive()
            if message["type"] != "websocket.connect":
                return

        if not await _authorize(scope, send, app, scheme, public_host):
            return

        if scope["type"] == "websocket":
            await _proxy_websocket(scope, receive, send, app, scheme, public_host)
        else:
            await _proxy_http(scope, receive, send, app, scheme, public_host)

    return router
