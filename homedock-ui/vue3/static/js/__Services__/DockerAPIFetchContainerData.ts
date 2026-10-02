// homedock-ui/vue3/static/js/__Services__/DockerAPIFetchContainerData.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";

let pollIntervalRef: ReturnType<typeof setInterval> | null = null;
let pollInFlight = false;

let lastRequestId = 0;
let lastAppliedRequestId = 0;

let csrfTokenGetter: (() => string) | null = null;

export function setCsrfTokenGetter(getter: () => string) {
  csrfTokenGetter = getter;
}

export async function fetchContainers(csrfToken: string): Promise<any[]> {
  const selectedAppsStore = useSelectedAppsStore();
  const token = csrfTokenGetter ? csrfTokenGetter() : csrfToken;
  const requestId = ++lastRequestId;
  try {
    const response = await axios.get("/api/containers", {
      headers: { "X-HomeDock-CSRF-Token": token },
    });

    if (requestId < lastAppliedRequestId) {
      return selectedAppsStore.applications;
    }

    if (response.status === 200) {
      lastAppliedRequestId = requestId;
      const backendApps = response.data;
      const orderedApps = restoreOrder(backendApps);

      selectedAppsStore.setApplications(orderedApps);
      return orderedApps;
    }
    return [];
  } catch (error) {
    selectedAppsStore.setFetchFailed(true);
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
  pollIntervalRef = setInterval(() => {
    if (pollInFlight) return;
    pollInFlight = true;
    const token = csrfTokenGetter ? csrfTokenGetter() : csrfToken;
    fetchContainers(token)
      .catch(() => {})
      .finally(() => {
        pollInFlight = false;
      });
  }, interval);
}

export function stopContainerPolling() {
  if (pollIntervalRef) {
    clearInterval(pollIntervalRef);
    pollIntervalRef = null;
  }
}
