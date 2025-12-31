# HomeDock OS - Docker Container
# Copyright © 2023-2026 Banshee, All Rights Reserved
# See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
# https://www.banshee.pro

FROM python:3.12-alpine

LABEL maintainer="Banshee Technologies S.L."
LABEL description="HomeDock OS - One Docker container to rule them all, a self-hosted Cloud OS for your Home Server."
LABEL version="2.0.4.222"

# Workdir
WORKDIR /homedock

# Deps > Build > Cleanup
COPY requirements.txt ./
RUN apk add --no-cache \
    bash \
    curl \
    jq \
    shadow \
    docker-cli \
    docker-cli-compose \
    && apk add --no-cache --virtual .build-deps \
        gcc \
        musl-dev \
        linux-headers \
        python3-dev \
        libffi-dev \
    && pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && apk del .build-deps

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
