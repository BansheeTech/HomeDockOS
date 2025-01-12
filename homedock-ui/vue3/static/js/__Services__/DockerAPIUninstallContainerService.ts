// src/static/js/__Services__/DockerAPIUninstallContainerService.ts
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

  // 1. Determinar los contenedores afectados
  const dependencies = isGrouped ? applications.filter((app) => app.HDRole === "dependency" && app.HDGroup === group) : [];
  const containersToUninstall = [mainContainer, ...dependencies];

  // 2. Marcar todos como "uninstalling"
  containersToUninstall.forEach((app) => store.setDesiredState(app.name, "uninstalling"));

  const namesToUninstall = containersToUninstall.map((app) => app.name);

  try {
    // 3. Llamar a la API para desinstalar los contenedores
    const response = await axios.post("/api/uninstall_containers", { container_names: namesToUninstall }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

    console.log("Uninstallation successful:", response.data);
  } catch (error) {
    console.error("Error uninstalling containers:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error:", error.response?.data || error.message);
    }
  } finally {
    // 4. Restaurar estados
    containersToUninstall.forEach((app) => store.setDesiredState(app.name, "idle"));
  }
}
