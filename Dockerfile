# HomeDock OS - Docker Container
# Copyright © 2023-2026 Banshee, All Rights Reserved
# See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
# https://www.banshee.pro

FROM python:3.12-slim

LABEL maintainer="Banshee Technologies S.L."
LABEL description="HomeDock OS - One Docker container to rule them all, a self-hosted Cloud OS for your Home Server."
LABEL version="2.0.4.216"

# Deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    jq \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Docker
RUN install -m 0755 -d /etc/apt/keyrings \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg \
    && chmod a+r /etc/apt/keyrings/docker.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    docker-ce-cli \
    docker-buildx-plugin \
    docker-compose-plugin \
    && rm -rf /var/lib/apt/lists/*

# Workdir
WORKDIR /homedock

# Reqs
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Code
COPY . .

# Gnosis
RUN touch .is_docker

# Dirs
RUN mkdir -p logs compose-link dropzone _user_packages config

# Symlinks
RUN ln -sf /homedock/config/homedock_server.conf /homedock/homedock_server.conf && \
    ln -sf /homedock/config/homedock_ports.conf /homedock/homedock_ports.conf && \
    ln -sf /homedock/config/homedock_dropzone.conf /homedock/homedock_dropzone.conf

# Execpoint
RUN chmod +x /homedock/entrypoint.sh

# Port
EXPOSE 80 443

# Magic
CMD ["/homedock/entrypoint.sh"]
