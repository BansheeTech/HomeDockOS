"""
hd_ClassDockerComposeHelper.py
Copyright © 2023-2026 Banshee, All Rights Reserved
See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
https://www.banshee.pro
"""

import os
import shutil
import subprocess

from typing import Optional, List, Tuple


class DockerComposeHelper:
    _instance = None
    _compose_method = None  # 'whale', 'v2', or 'v1'
    _whale_docker = None

    def __init__(self):
        if DockerComposeHelper._instance is not None:
            raise Exception("Use get_instance() to access DockerComposeHelper.")

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DockerComposeHelper()
        return cls._instance

    @classmethod
    def _detect_compose_method(cls) -> str:
        if cls._compose_method is not None:
            return cls._compose_method

        # 1. Whales!
        try:
            from python_on_whales import docker as whale_docker

            whale_docker.compose.version()
            cls._whale_docker = whale_docker
            cls._compose_method = "whale"
            return cls._compose_method
        except ImportError:
            pass
        except Exception:
            pass

        # 2. Compose!
        try:
            result = subprocess.run(["docker", "compose", "version"], capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                cls._compose_method = "v2"
                return cls._compose_method
        except (subprocess.SubprocessError, FileNotFoundError):
            pass

        # 3. Oldpose!
        if shutil.which("docker-compose"):
            try:
                result = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    cls._compose_method = "v1"
                    return cls._compose_method
            except Exception:
                pass

        raise RuntimeError("No Docker Compose method available. Please install:\n" "  - python-on-whales: pip install python-on-whales (RECOMMENDED), or\n" "  - Docker Compose V2: included in Docker Desktop / recent Docker versions, or\n" "  - Docker Compose V1: standalone binary (legacy)")

    @classmethod
    def get_version(cls) -> Tuple[bool, str]:
        try:
            method = cls._detect_compose_method()

            if method == "whale":
                version = cls._whale_docker.compose.version()
                return True, f"python-on-whales (Compose: {version})"

            elif method == "v2":
                result = subprocess.run(["docker", "compose", "version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    return True, result.stdout.strip()
                return False, "docker compose V2 detected but version check failed"

            elif method == "v1":
                result = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    return True, result.stdout.strip()
                return False, "docker-compose V1 detected but version check failed"

        except Exception as e:
            return False, f"Error checking Docker Compose version: {e}"

    @classmethod
    def up(cls, compose_file: str, detach: bool = True, service_names: Optional[List[str]] = None) -> Tuple[bool, str]:
        try:
            method = cls._detect_compose_method()

            if not os.path.exists(compose_file):
                return False, f"Compose file not found: {compose_file}"

            # 1. Whales!
            if method == "whale":
                from python_on_whales import DockerClient

                docker = DockerClient(compose_files=[compose_file])

                if service_names:
                    docker.compose.up(services=service_names, detach=detach)
                else:
                    docker.compose.up(detach=detach)

                return True, "Container(s) started successfully"

            else:
                # 2. Compose!
                if method == "v2":
                    cmd = ["docker", "compose"]

                # 3. Oldpose!
                else:
                    cmd = ["docker-compose"]

                cmd.extend(["-f", compose_file])
                cmd.extend(["up", "-d"] if detach else ["up"])
                if service_names:
                    cmd.extend(service_names)

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)

                if result.returncode == 0:
                    return True, result.stdout
                else:
                    return False, f"Error: {result.stderr}"

        except Exception as e:
            return False, f"Error: {e}"
