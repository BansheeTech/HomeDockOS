// homedock-ui/vue3/static/js/__Composables__/useTrayManager.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref } from "vue";

const activeTrayId = ref<string | null>(null);

export function useTrayManager() {
  const registerTray = (trayId: string, isOpen: boolean) => {
    if (isOpen) {
      if (activeTrayId.value && activeTrayId.value !== trayId) {
        return false;
      }
      activeTrayId.value = trayId;
      return true;
    } else {
      if (activeTrayId.value === trayId) {
        activeTrayId.value = null;
      }
      return true;
    }
  };

  const openTray = (trayId: string) => {
    if (activeTrayId.value && activeTrayId.value !== trayId) {
      closeTray(activeTrayId.value);
    }
    activeTrayId.value = trayId;
  };

  const closeTray = (trayId: string) => {
    if (activeTrayId.value === trayId) {
      activeTrayId.value = null;
    }
  };

  const isActiveTray = (trayId: string) => {
    return activeTrayId.value === trayId;
  };

  const getActiveTrayId = () => {
    return activeTrayId.value;
  };

  return {
    registerTray,
    openTray,
    closeTray,
    isActiveTray,
    getActiveTrayId,
    activeTrayId,
  };
}
