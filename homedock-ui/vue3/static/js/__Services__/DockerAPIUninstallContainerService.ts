// homedock-ui/vue3/static/js/__Services__/DockerAPIUninstallContainerService.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import axios from "axios";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

interface Application {
  name: string;
  HDGroup?: string;
  HDRole?: string;
  isProcessing: boolean;
  status: string;
}

export async function uninstallContainers(applications: Application[], containerName: string, csrfToken: string): Promise<void> {
  const mainContainer = applications.find((app) => app.name === containerName);

  if (!mainContainer) {
    console.error(`Container "${containerName}" not found.`);
    return;
  }

  const store = useSelectedAppsStore();
  const group = mainContainer.HDGroup;
  const isGrouped = !!group && mainContainer.HDRole === "main";

  // 1. Determine affected conts
  const dependencies = isGrouped ? applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group) : [];
  const containersToUninstall = [mainContainer, ...dependencies];

  // 2. Mark them all as "uninstalling"
  containersToUninstall.forEach((app) => store.setDesiredState(app.name, "uninstalling"));

  const namesToUninstall = containersToUninstall.map((app) => app.name);

  try {
    // 3. Call the API to uninstall the containers
    const response = await axios.post("/api/uninstall_containers", { container_names: namesToUninstall }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

  } catch (error) {
    console.error("Error uninstalling containers:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    }
  } finally {
    // 4. Restore the desired state of the containers
    containersToUninstall.forEach((app) => store.setDesiredState(app.name, "idle"));
  }
}
