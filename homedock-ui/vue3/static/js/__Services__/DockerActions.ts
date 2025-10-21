// homedock-ui/vue3/static/js/__Services__/DockerActions.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { AxiosError } from "axios";
import { notifyError } from "../__Components__/Notifications.vue";
import { useDesktopStore, DockerApp } from "../__Stores__/desktopStore";
import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";
import { useAppStore } from "../__Stores__/useAppStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";

import { startContainers } from "./DockerAPIStartContainerService";
import { stopContainers } from "./DockerAPIStopContainerService";
import { restartContainers } from "./DockerAPIRestartContainerService";
import { pauseContainers } from "./DockerAPIPauseContainerService";
import { unpauseContainers } from "./DockerAPIUnpauseContainerService";
import { uninstallContainers } from "./DockerAPIUninstallContainerService";
import { updateContainers } from "./DockerAPIUpdateContainerService";

export async function startContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await startContainers(selectedAppsStore.applications, app.name, csrfToken);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error starting container:", error);
    }
  } finally {
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function stopContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await stopContainers(selectedAppsStore.applications, app.name, csrfToken);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error stopping container:", error);
    }
  } finally {
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function restartContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await restartContainers(selectedAppsStore.applications, app.name, csrfToken);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error restarting container:", error);
    }
  } finally {
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function pauseContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await pauseContainers(selectedAppsStore.applications, app.name, csrfToken);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error pausing container:", error);
    }
  } finally {
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function unpauseContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await unpauseContainers(selectedAppsStore.applications, app.name, csrfToken);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error unpausing container:", error);
    }
  } finally {
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function uninstallContainer(app: DockerApp, csrfToken: string, themeClass?: string) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();
  const appStore = useAppStore();

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await uninstallContainers(selectedAppsStore.applications, app.name, csrfToken);

    appStore.updateAppInstallationStatus(app.name, false);
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error uninstalling container:", error);
    }
    desktopStore.updateDockerApp(app.id, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
  }
}

export async function updateContainer(app: DockerApp, csrfToken: string, themeClass?: string, skipQueue: boolean = false) {
  const desktopStore = useDesktopStore();
  const selectedAppsStore = useSelectedAppsStore();
  const updateStore = useAppUpdateStore();

  if (!skipQueue) {
    updateStore.addToQueue({
      name: app.name,
      display_name: app.display_name || app.name,
      image_path: app.image_path,
    });
    return;
  }

  try {
    desktopStore.updateDockerApp(app.id, { isProcessing: true });
    selectedAppsStore.setProcessing(app.name, true);

    await updateContainers(selectedAppsStore.applications, app.name, csrfToken);

    desktopStore.updateDockerAppByName(app.name, { has_update: false });
  } catch (error) {
    if (error instanceof AxiosError && themeClass) {
      notifyError(error, themeClass);
    } else {
      console.error("Error updating container:", error);
    }
  } finally {
    desktopStore.updateDockerAppByName(app.name, { isProcessing: false });
    selectedAppsStore.setProcessing(app.name, false);
    updateStore.finishUpdating();
  }
}
