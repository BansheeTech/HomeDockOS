"""
hd_ClassDockerClientManager.py
Copyright © 2023-2025 Banshee, All Rights Reserved
https://www.banshee.pro
"""

import docker


class DockerClientManager:
    _instance = None

    def __init__(self):
        if DockerClientManager._instance is not None:
            raise Exception("Use get_instance() to access DockerClientManager.")
        self.client = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DockerClientManager()
        return cls._instance

    def get_client(self):
        if self.client is None:
            try:
                self.client = docker.from_env()
            except docker.errors.DockerException as e:
                print(f"Error initializing Docker client: {e}")
                raise
        return self.client
