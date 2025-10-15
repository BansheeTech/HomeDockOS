// homedock-ui/vue3/static/js/__Services__/DockerAPIStopContainerService.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
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

export async function stopContainers(applications: Application[], containerName: string, csrfToken: string): Promise<void> {
  const mainContainer = applications.find((app) => app.name === containerName);

  if (!mainContainer) {
    console.error(`Container "${containerName}" not found.`);
    return;
  }

  const store = useSelectedAppsStore();
  const group = mainContainer.HDGroup;

  const dependencies = applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group);

  const affectedContainers = [mainContainer, ...dependencies];

  affectedContainers.forEach((app) => store.setDesiredState(app.name, "exited"));

  const containersToStop = affectedContainers.filter((app) => app.status !== "exited");

  if (!containersToStop.length) {
    return;
  }

  const namesToStop = containersToStop.map((app) => app.name);

  try {
    const response = await axios.post("/api/stop_containers", { container_names: namesToStop }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    } else {
      console.error("Error stopping containers:", error);
    }
    throw error;
  }
}
