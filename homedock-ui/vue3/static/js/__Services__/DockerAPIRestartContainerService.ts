// src/static/js/__Services__/DockerAPIRestartContainerService.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import axios from "axios";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

interface Application {
  name: string;
  HDGroup: string;
  HDRole?: string;
  isProcessing: boolean;
  status: string;
}

export async function restartContainers(applications: Application[], containerName: string, csrfToken: string): Promise<void> {
  const mainContainer = applications.find((app) => app.name === containerName);

  if (!mainContainer) {
    console.error(`Container "${containerName}" not found.`);
    return;
  }

  const store = useSelectedAppsStore();
  const group = mainContainer.HDGroup;

  const dependencies = applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group);

  const affectedContainers = [mainContainer, ...dependencies];

  affectedContainers.forEach((app) => store.setDesiredState(app.name, "running"));

  const namesToRestart = affectedContainers.map((app) => app.name);

  try {
    const response = await axios.post("/api/restart_containers", { container_names: namesToRestart }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      console.error("Error restarting containers:", error);
    }
    throw error;
  }
}
