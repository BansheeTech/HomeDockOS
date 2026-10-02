<!-- homedock-ui/vue3/static/js/__Windows__/WindowManager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <PrismWindowManager :store="prismStore" :resolveComponent="resolveComponent" :resolveConfig="resolveConfig" :taskbarHeight="taskbarHeightPx" :isMobile="isMobile" :labels="labels" :classes="prismClasses" :appearance="appearance">
    <template #icon="{ window }">
      <span v-if="window.icon" class="window-icon-wrap" :title="iconTitle(window)" @contextmenu.stop.prevent="(e: MouseEvent) => openSystemMenu(e, window)">
        <WindowIcon :window="{ appId: window.appId, icon: window.icon as string | IconifyIcon }" :size="isCupertino ? 16 : 20" />
        <Icon v-if="dependencyLabel(window)" :icon="dependencyBadgeIcon" class="window-icon-badge" width="9" height="9" />
      </span>
    </template>

    <template #titleBarExtra="{ window }">
      <EnterpriseIndicator v-if="window.appId === 'enterprise-window'" size="mini" />
    </template>

    <template #loading>
      <WindowLoading />
    </template>

    <template #minimize-icon>
      <Icon :icon="minimizeIcon" :width="isMobile ? 18 : 16" :height="isMobile ? 18 : 16" />
    </template>
    <template #maximize-icon="{ window }">
      <Icon :icon="window.isMaximized ? restoreIcon : maximizeIcon" width="12" height="12" />
    </template>
    <template #close-icon>
      <Icon :icon="closeIcon" :width="isMobile ? 18 : 16" :height="isMobile ? 18 : 16" />
    </template>
  </PrismWindowManager>

  <ContextMenu :visible="systemMenu.visible" :x="systemMenu.x" :y="systemMenu.y" :items="systemMenuItems" @close="closeSystemMenu" />
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@iconify/vue";
import type { IconifyIcon } from "@iconify/vue";
import minimizeIcon from "@iconify-icons/mdi/window-minimize";
import maximizeIcon from "@iconify-icons/mdi/window-maximize";
import restoreIcon from "@iconify-icons/mdi/window-restore";
import closeIcon from "@iconify-icons/mdi/close";
import dependencyBadgeIcon from "@iconify-icons/mdi/cube-outline";

import { PrismWindowManager, type PrismClassMap, type WindowState } from "@prism-wm/vue";

import { getPrismStore, useWindowStore } from "../__Stores__/windowStore";
import { getAppById } from "../__Config__/WindowDefaultDetails";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import WindowIcon from "../__Components__/WindowIcon.vue";
import WindowLoading from "../__Components__/WindowLoading.vue";
import EnterpriseIndicator from "../__Components__/EnterpriseIndicator.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";

const windowStore = useWindowStore();
const prismStore = getPrismStore();
const { isMobile, taskbarHeightPx } = useResponsive();
const { themeClasses, appearance } = useTheme();
const { t } = useI18n();

const resolveComponent = (win: WindowState) => getAppById(win.appId)?.component ?? null;
const resolveConfig = (win: WindowState) => getAppById(win.appId);

const labels = computed(() => ({
  minimize: t("Minimize"),
  maximize: t("Maximize"),
  restore: t("Restore"),
  close: t("Close"),
}));

const isCupertino = computed(() => appearance.value === "cupertino");

const prismClasses = computed<Partial<PrismClassMap>>(() => ({
  window: `${themeClasses.value.windowBg} ${themeClasses.value.windowShadow}`,
  windowInactive: themeClasses.value.windowBorder,
  windowActive: themeClasses.value.windowBorderFocused,
  titleBar: `${themeClasses.value.windowTitleBarBg} ${themeClasses.value.windowTitleBarBorder}`,
  title: themeClasses.value.windowTitleText,
  titleActive: themeClasses.value.windowTitleTextFocused,
  iconContainer: themeClasses.value.windowTitleText,
  iconContainerActive: themeClasses.value.windowTitleTextFocused,
  control: isCupertino.value ? "" : `${themeClasses.value.windowButtonText} ${themeClasses.value.windowButtonBgHover} ${themeClasses.value.windowButtonTextHover}`,
  closeControl: isCupertino.value ? "" : `${themeClasses.value.windowButtonText} ${themeClasses.value.windowCloseButtonBgHover} ${themeClasses.value.windowCloseButtonTextHover}`,
}));

function dependencyLabel(win: WindowState): string {
  const name = (win.data as { dependencyOf?: unknown } | undefined)?.dependencyOf;
  return typeof name === "string" && name ? t("Dependency of {name}", { name }) : "";
}

function iconTitle(win: WindowState): string {
  const label = dependencyLabel(win);
  return label ? `${label} · ${t("System menu")}` : t("System menu");
}

const systemMenu = ref({ visible: false, x: 0, y: 0, windowId: "" });

const menuTarget = computed(() => (systemMenu.value.windowId ? windowStore.getWindowById(systemMenu.value.windowId) : null));

function openSystemMenu(e: MouseEvent, win: WindowState) {
  systemMenu.value = { visible: true, x: e.clientX, y: e.clientY, windowId: win.id };
}

function closeSystemMenu() {
  systemMenu.value.visible = false;
}

const systemMenuItems = computed<ContextMenuItem[]>(() => {
  const win = menuTarget.value;
  if (!win) return [];

  const config = getAppById(win.appId);
  const items: ContextMenuItem[] = [];

  const isDialog = win.kind === "dialog";

  if (!isDialog && config?.minimizable !== false) {
    items.push({
      label: "Minimize",
      icon: minimizeIcon,
      action: () => {
        windowStore.minimizeWindow(win.id);
        closeSystemMenu();
      },
    });
  }

  if (!isDialog && !isMobile.value && config?.maximizable !== false) {
    items.push({
      label: win.isMaximized ? "Restore" : "Maximize",
      icon: win.isMaximized ? restoreIcon : maximizeIcon,
      action: () => {
        windowStore.toggleMaximize(win.id);
        closeSystemMenu();
      },
    });
  }

  if (config?.closeable !== false) {
    if (items.length > 0) {
      items.push({ divider: true });
    }
    items.push({
      label: "Close",
      icon: closeIcon,
      action: () => {
        void windowStore.requestClose(win.id);
        closeSystemMenu();
      },
    });
  }

  return items;
});
</script>

<style>
.pwm-window.pwm-active {
  box-shadow:
    0 8px 32px rgba(59, 130, 246, 0.2),
    0 0 0 1px rgba(59, 130, 246, 0.3);
}

.pwm-window.pwm-maximized {
  border: none;
  box-shadow: none;
}

.pwm-window.pwm-fullscreen-mobile {
  border: none !important;
}

.pwm-scrim,
.pwm-window[data-pwm-blocked]::after {
  background: rgba(0, 0, 0, 0.35);
}

.pwm-snap-preview {
  background: rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
  animation:
    pwm-snap-in 0.16s ease-out,
    hdos-snap-pulse 1.5s ease-in-out infinite;
}

@keyframes hdos-snap-pulse {
  0%,
  100% {
    background: rgba(59, 130, 246, 0.15);
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.4);
  }
  50% {
    background: rgba(59, 130, 246, 0.25);
    box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.7);
  }
}
</style>

<style scoped>
.window-icon-wrap {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.window-icon-badge {
  position: absolute;
  right: -3px;
  top: -3px;
  border-radius: 9999px;
  padding: 1px;
  background: rgb(168 85 247);
  color: #fff;
  pointer-events: none;
}
</style>
