// src/static/js/__Services__/DockerAPIUpdateContainerService.ts
// Copyright © 2023-2025 Banshee
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

interface UpdateResponse {
  new_images_containers: string[];
  missing_compose_files: string[];
}

export async function updateContainers(applications: Application[], containerName: string, csrfToken: string): Promise<void> {
  const store = useSelectedAppsStore();
  const mainContainer = applications.find((app) => app.name === containerName);

  if (!mainContainer) {
    console.error(`Container "${containerName}" not found.`);
    return;
  }

  const group = mainContainer.HDGroup;
  const isGrouped = !!group && mainContainer.HDRole === "main";

  const containersToUpdate = isGrouped ? [mainContainer] : [mainContainer];

  containersToUpdate.forEach((app) => store.setDesiredState(app.name, "checking"));

  try {
    const response = await axios.post<UpdateResponse>("/api/check_new_images", { container_names: [mainContainer.name] }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

    const { new_images_containers, missing_compose_files } = response.data;

    if (missing_compose_files.includes(mainContainer.name)) {
      console.warn(`Container "${mainContainer.name}" is missing a docker-compose.yml file.`);
      store.setDesiredState(mainContainer.name, "idle");
      return;
    }

    const containersWithUpdates = new_images_containers.filter((name) => name === mainContainer.name);
    if (containersWithUpdates.length === 0) {
      console.info(isGrouped ? `No updates available for containers in group: ${group}` : `No updates available for container: ${mainContainer.name}`);
      return;
    }

    for (const name of containersWithUpdates) {
      store.setDesiredState(name, "updating");
      console.log(`Updating container: ${name}`);

      await axios.post("/api/pull_and_update_containers", { container_names: [name] }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

      console.log(`Container "${name}" updated successfully.`);
    }
  } catch (error) {
    console.error("Error during container update process:", error);
  } finally {
    containersToUpdate.forEach((app) => store.setDesiredState(app.name, "idle"));
  }
}
