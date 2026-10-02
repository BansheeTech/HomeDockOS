// homedock-ui/vue3/static/js/__Composables__/useTrayManager.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, watch } from "vue";

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

export function useTrayPanel(trayId: string | (() => string)) {
  const trayManager = useTrayManager();
  const isOpen = ref(false);
  const resolveId = () => (typeof trayId === "function" ? trayId() : trayId);

  const open = () => {
    trayManager.openTray(resolveId());
    isOpen.value = true;
  };

  const close = () => {
    trayManager.closeTray(resolveId());
    isOpen.value = false;
  };

  const toggle = (event?: Event) => {
    event?.stopPropagation();
    if (isOpen.value) close();
    else open();
  };

  watch(activeTrayId, (active) => {
    if (active !== resolveId() && isOpen.value) isOpen.value = false;
  });

  return { isOpen, open, close, toggle };
}
