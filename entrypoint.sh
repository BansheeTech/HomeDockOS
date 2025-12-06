#!/usr/bin/env bash
set -Eeuo pipefail

echo "Starting HomeDock OS..."

# DATA_ROOT for Docker-in-Docker
if [ -f "/homedock/.is_docker" ]; then

    # Check socket
    if [ ! -S /var/run/docker.sock ]; then
        echo "! Error: Docker socket is missing"
        echo "  Please bind /var/run/docker.sock in your docker-compose.yml"
        exit 13
    fi

    # Get Cont Name or ID
    target=$(hostname -s)

    # ID > Hostname
    if [[ "$target" =~ ^[0-9a-f]{12}$ ]]; then
        target=$(hostname)
    fi

    echo "i Container identifier: $target"

    # Inspect
    if ! docker inspect "$target" &>/dev/null; then
        echo "! Error: Failed to inspect container '$target'"
        exit 16
    fi

    # Result
    resp=$(docker inspect "$target")

    # Mount Extract
    mount=$(echo "$resp" | jq -r '.[0].Mounts[] | select(.Destination == "/DATA").Source')

    # Verify
    if [ -z "$mount" ] || [[ "$mount" == "null" ]] || [ ! -d "/DATA" ]; then
        echo "! Error: You did not bind the /DATA folder!"
        echo "  Add to docker-compose.yml: - ./homedock_data:/DATA"
        exit 18
    fi

    echo "i /DATA detected on host at: $mount"

    # Mirror
    if [[ "$mount" != "/DATA" ]]; then
        mkdir -p "$mount"
        rm -rf "$mount"
        ln -s /DATA "$mount"
        echo "i Created symlink: $mount -> /DATA"
    fi

    # Export
    export DATA_ROOT="$mount"

    # Mkdirs
    mkdir -p /DATA/HomeDock/AppData
    mkdir -p /DATA/HomeDock/AppFolders
fi

# Magic
exec python homedock.py
