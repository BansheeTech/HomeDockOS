// homedock-ui/vue3/static/js/__Services__/DockerAPIFetchContainerData.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import axios from "axios";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

let pollIntervalRef: ReturnType<typeof setInterval> | null = null;

export async function fetchContainers(csrfToken: string): Promise<any[]> {
  const selectedAppsStore = useSelectedAppsStore();
  try {
    const response = await axios.get("/api/containers", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken },
    });

    if (response.status === 200) {
      const backendApps = response.data;
      const orderedApps = restoreOrder(backendApps);

      selectedAppsStore.setApplications(orderedApps);
      return orderedApps;
    }
    return [];
  } catch (error) {
    console.error("Error fetching containers:", error);
    throw error;
  }
}

function restoreOrder(apps: any[]) {
  const ORDER_KEY = "dashboardLocalOrder";
  const savedOrder = localStorage.getItem(ORDER_KEY);
  if (!savedOrder) return apps;

  const order = JSON.parse(savedOrder) as string[];
  const mainApps = apps.filter((app) => app.HDRole !== "dependency");
  const dependencies = apps.filter((app) => app.HDRole === "dependency");

  const orderedMainApps = order.map((name) => mainApps.find((app) => app.name === name)).filter(Boolean) as any[];

  const newApps = mainApps.filter((app) => !order.includes(app.name));

  return [...orderedMainApps, ...newApps, ...dependencies];
}

export function startContainerPolling(csrfToken: string, interval = 3000) {
  stopContainerPolling();
  pollIntervalRef = setInterval(() => fetchContainers(csrfToken), interval);
}

export function stopContainerPolling() {
  if (pollIntervalRef) {
    clearInterval(pollIntervalRef);
    pollIntervalRef = null;
  }
}
