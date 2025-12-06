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

    # DinD Perms
    SOCK_GID=$(stat -c '%g' /var/run/docker.sock 2>/dev/null || echo "0")
    if [ "$SOCK_GID" != "0" ]; then
        echo "i Adding user to docker group (GID: $SOCK_GID)"

        if ! getent group docker >/dev/null 2>&1; then
            groupadd -g "$SOCK_GID" docker 2>/dev/null || true
        fi

        if ! groups root | grep -q "\bdocker\b"; then
            usermod -aG docker root 2>/dev/null || true
        fi

        if ! groups | grep -q "\bdocker\b"; then
            echo "i Re-executing with docker group privileges"
            exec sg docker -c "$0 $*"
        fi
    fi

    # DinD API Ver
    if [ -S /var/run/docker.sock ]; then
        set +e
        DAEMON_VERSION=$(curl -s --unix-socket /var/run/docker.sock http://localhost/version 2>/dev/null | grep -o '"ApiVersion":"[^"]*"' | head -1 | cut -d'"' -f4)
        set -e

        if [ -z "$DAEMON_VERSION" ]; then
            DAEMON_VERSION="1.41"
        fi

        DAEMON_VERSION=$(echo "$DAEMON_VERSION" | tr -d '[:space:]')
        export DOCKER_API_VERSION="$DAEMON_VERSION"
        echo "i Using Docker API version: $DOCKER_API_VERSION"
    fi

    # Container ID Detect
    target=""
    short_id=$(hostname)
    echo "i Hostname: $short_id"

    # M1: Find by short ID
    set +e
    target=$(docker ps -a --no-trunc --format "{{.Names}}" --filter "id=$short_id" 2>&1 | head -1 || true)
    set -e
    echo "i M1 result: '$target'"

    if [ -n "$target" ] && [ "$target" != "error"* ] && [ "$target" != "Error"* ]; then
        echo "i Found by ID filter: $target"
    else
        target=""
    fi

    # M2: If then by label
    if [ -z "$target" ]; then
        set +e
        target=$(docker ps -a --filter "label=HDDockerInDocker=true" --format "{{.Names}}" 2>&1 | head -1 || true)
        set -e
        echo "i M2 result: '$target'"
        if [ -n "$target" ] && [ "$target" != "error"* ] && [ "$target" != "Error"* ]; then
            echo "i Found by label: $target"
        else
            target=""
        fi
    fi

    # M3: Else by cgroup
    if [ -z "$target" ]; then
        if [ -f "/proc/self/cgroup" ]; then
            set +e
            cgroup_full_id=$(cat /proc/self/cgroup | grep -o -E '[0-9a-f]{64}' | head -1 || true)
            set -e
            echo "i M3 cgroup ID: '$cgroup_full_id'"
            if [ -n "$cgroup_full_id" ]; then
                set +e
                target=$(docker inspect --format="{{.Name}}" "$cgroup_full_id" 2>&1 | sed 's/^\///' || true)
                set -e
                echo "i M3 result: '$target'"
                if [ -n "$target" ] && [ "$target" != "error"* ] && [ "$target" != "Error"* ]; then
                    echo "i Found by cgroup: $target"
                else
                    target=""
                fi
            fi
        fi
    fi

    echo "i Container identifier: $target"

    # Inspect
    if ! docker inspect "$target" &>/dev/null; then
        echo "! Error: Failed to inspect container '$target'"
        echo "  Troubleshooting:"
        echo "  1. Ensure Docker socket is mounted: -v /var/run/docker.sock:/var/run/docker.sock"
        echo "  2. Check socket permissions: ls -la /var/run/docker.sock"
        echo "  3. Verify container_name is set in docker-compose.yml"
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
