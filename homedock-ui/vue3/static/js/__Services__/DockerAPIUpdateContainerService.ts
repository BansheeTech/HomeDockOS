// homedock-ui/vue3/static/js/__Services__/DockerAPIUpdateContainerService.ts
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

interface UpdateResponse {
  message: string;
  updated_containers: string[];
  skipped_containers: string[];
  missing_compose_files: string[];
  containers_data?: Array<{ name: string; composeLink: string }>;
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

  containersToUpdate.forEach((app) => store.setDesiredState(app.name, "updating"));

  try {
    const response = await axios.post<UpdateResponse>("/api/update_containers", { container_names: [mainContainer.name] }, { headers: { "X-HomeDock-CSRF-Token": csrfToken } });

    const { updated_containers, skipped_containers, missing_compose_files } = response.data;

    if (missing_compose_files.includes(mainContainer.name)) {
      console.warn(`Container "${mainContainer.name}" is missing a docker-compose.yml file.`);
      return;
    }

    if (updated_containers.length === 0) {
      console.info(isGrouped ? `No updates available for containers in group: ${group}` : `No updates available for container: ${mainContainer.name}`);
      return;
    }

    console.info(`Successfully updated: ${updated_containers.join(", ")}`);
    if (skipped_containers.length > 0) {
      console.info(`Skipped (no updates): ${skipped_containers.join(", ")}`);
    }
  } catch (error) {
    console.error("Error during container update process:", error);
  } finally {
    containersToUpdate.forEach((app) => store.setDesiredState(app.name, "idle"));
  }
}
