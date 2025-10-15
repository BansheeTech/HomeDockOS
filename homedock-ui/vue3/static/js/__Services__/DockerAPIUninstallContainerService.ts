// homedock-ui/vue3/static/js/__Services__/DockerAPIUninstallContainerService.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
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

  const dependencies = isGrouped ? applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group) : [];
  const containersToUninstall = [mainContainer, ...dependencies];

  containersToUninstall.forEach((app) => store.setDesiredState(app.name, "uninstalling"));

  const namesToUninstall = containersToUninstall.map((app) => app.name);

  try {
    const response = await axios.post("/api/uninstall_containers", { container_names: namesToUninstall }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });
  } catch (error) {
    console.error("Error uninstalling containers:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    }
  } finally {
    containersToUninstall.forEach((app) => store.setDesiredState(app.name, "idle"));
  }
}
