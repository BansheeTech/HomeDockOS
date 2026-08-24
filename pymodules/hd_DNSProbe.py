"""
hd_DNSProbe.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import time
import socket
import struct
import secrets

# HDOS00068
PUBLIC_RESOLVERS = ["1.1.1.1", "8.8.8.8", "9.9.9.9"]

TYPE_A = 1
TYPE_NS = 2
TYPE_TXT = 16

QUERY_TIMEOUT = 3


def _encode_name(name):
    parts = [label.encode("idna") if any(ord(c) > 127 for c in label) else label.encode("ascii") for label in name.rstrip(".").split(".")]

    return b"".join(struct.pack("!B", len(part)) + part for part in parts) + b"\x00"


def _read_name(data, offset):

    jumped = False
    end = offset

    while True:
        if offset >= len(data):
            raise ValueError("truncated name")

        length = data[offset]

        if length == 0:
            offset += 1
            if not jumped:
                end = offset
            break

        if length & 0xC0 == 0xC0:
            pointer = struct.unpack("!H", data[offset : offset + 2])[0] & 0x3FFF
            if not jumped:
                end = offset + 2
            offset = pointer
            jumped = True
            continue

        offset += 1 + length
        if not jumped:
            end = offset

    return end


def _query_tcp(server, packet, query_id):
    sock = socket.create_connection((server, 53), timeout=QUERY_TIMEOUT)

    try:
        sock.sendall(struct.pack("!H", len(packet)) + packet)

        header = _recv_exactly(sock, 2)
        data = _recv_exactly(sock, struct.unpack("!H", header)[0])
    finally:
        sock.close()

    if len(data) < 12 or struct.unpack("!H", data[0:2])[0] != query_id:
        raise ValueError("mismatched response")

    return data


def _recv_exactly(sock, length):
    chunks = bytearray()

    while len(chunks) < length:
        chunk = sock.recv(length - len(chunks))
        if not chunk:
            raise ValueError("connection closed early")
        chunks.extend(chunk)

    return bytes(chunks)


def _query(server, name, qtype):
    query_id = secrets.randbelow(65536)

    edns = b"\x00" + struct.pack("!HHIH", 41, 4096, 0, 0)

    packet = struct.pack("!HHHHHH", query_id, 0x0100, 1, 0, 0, 1) + _encode_name(name) + struct.pack("!HH", qtype, 1) + edns

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(QUERY_TIMEOUT)

    try:
        sock.sendto(packet, (server, 53))
        data, _ = sock.recvfrom(65535)
    finally:
        sock.close()

    if len(data) < 12 or struct.unpack("!H", data[0:2])[0] != query_id:
        raise ValueError("mismatched response")

    if struct.unpack("!H", data[2:4])[0] & 0x0200:
        data = _query_tcp(server, packet, query_id)

    _, _, questions, answers, _, _ = struct.unpack("!HHHHHH", data[:12])

    offset = 12

    for _ in range(questions):
        offset = _read_name(data, offset) + 4

    results = []

    for _ in range(answers):
        offset = _read_name(data, offset)
        rtype, _, _, rdlength = struct.unpack("!HHIH", data[offset : offset + 10])
        offset += 10
        rdata = data[offset : offset + rdlength]

        if rtype == qtype:
            if qtype == TYPE_TXT:
                chunks, cursor = [], 0
                while cursor < len(rdata):
                    size = rdata[cursor]
                    chunks.append(rdata[cursor + 1 : cursor + 1 + size])
                    cursor += 1 + size
                results.append(b"".join(chunks).decode("utf-8", "replace"))
            elif qtype == TYPE_A:
                results.append(socket.inet_ntoa(rdata))
            elif qtype == TYPE_NS:
                results.append(_decode_name(data, offset))

        offset += rdlength

    return results


def _decode_name(data, offset):
    labels = []

    while True:
        length = data[offset]

        if length == 0:
            break

        if length & 0xC0 == 0xC0:
            offset = struct.unpack("!H", data[offset : offset + 2])[0] & 0x3FFF
            continue

        offset += 1
        labels.append(data[offset : offset + length].decode("ascii", "replace"))
        offset += length

    return ".".join(labels)


def _first_answer(servers, name, qtype):
    for server in servers:
        try:
            answers = _query(server, name, qtype)
        except (OSError, ValueError, struct.error, IndexError):
            continue

        if answers:
            return answers

    return []


def authoritative_servers(domain):

    labels = domain.rstrip(".").split(".")

    for index in range(len(labels) - 1):
        zone = ".".join(labels[index:])
        names = _first_answer(PUBLIC_RESOLVERS, zone, TYPE_NS)

        if not names:
            continue

        addresses = []
        for name in names:
            addresses.extend(_first_answer(PUBLIC_RESOLVERS, name, TYPE_A))

        if addresses:
            return addresses

    return []


def _every_answer(servers, name, qtype):

    replies = []

    for server in servers:
        try:
            replies.append((server, _query(server, name, qtype)))
        except (OSError, ValueError, struct.error, IndexError):
            continue

    return replies


def wait_for_txt(domain, expected, timeout=300, interval=5, log=print):

    name = f"_acme-challenge.{domain}"

    servers = authoritative_servers(domain)
    unanimous = bool(servers)

    if unanimous:
        log(f" * DNS: polling {len(servers)} authoritative server(s) for {name}")
    else:
        servers = PUBLIC_RESOLVERS
        log(f" * DNS: no authoritative server found, falling back to public resolvers for {name}")

    deadline = time.time() + timeout
    started = time.time()
    missing = []

    while time.time() < deadline:
        replies = _every_answer(servers, name, TYPE_TXT)
        missing = [server for server, answers in replies if expected not in answers]

        if replies and not missing:
            log(f" * DNS: {name} is live on {len(replies)} server(s) after {int(time.time() - started)}s")
            return True

        if not unanimous and len(missing) < len(replies):
            log(f" * DNS: {name} is live after {int(time.time() - started)}s")
            return True

        time.sleep(interval)

    if missing:
        log(f" * DNS: {name} did not carry the expected value within {timeout}s, still missing on {', '.join(missing)}")
    else:
        log(f" * DNS: no server answered for {name} within {timeout}s")

    return False
