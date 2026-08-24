<!-- homedock-ui/vue3/static/js/__Windows__/WindowManager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <PrismWindowManager :store="prismStore" :resolveComponent="resolveComponent" :resolveConfig="resolveConfig" :taskbarHeight="taskbarHeightPx" :isMobile="isMobile" :labels="labels" :classes="prismClasses" :appearance="appearance">
    <template #icon="{ window }">
      <BaseImage v-if="isImageIcon(window.icon)" :src="window.icon" alt="" class="window-icon rounded-[3px]" width="16" height="16" draggable="false" :title="t('System menu')" @contextmenu.stop.prevent="(e: MouseEvent) => openSystemMenu(e, window)" />
      <Icon v-else-if="window.icon" :icon="window.icon as string | IconifyIcon" class="window-icon" width="16" height="16" :title="t('System menu')" @contextmenu.stop.prevent="(e: MouseEvent) => openSystemMenu(e, window)" />
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

import { PrismWindowManager, type PrismClassMap, type WindowState } from "@prism-wm/vue";

import { getPrismStore, useWindowStore, isImageIcon } from "../__Stores__/windowStore";
import { getAppById } from "../__Config__/WindowDefaultDetails";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import BaseImage from "../__Components__/BaseImage.vue";
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
  iconContainer: isCupertino.value ? themeClasses.value.windowTitleText : `transition duration-150 ${themeClasses.value.windowIconContainerBg} ${themeClasses.value.windowTitleText}`,
  iconContainerActive: isCupertino.value ? themeClasses.value.windowTitleTextFocused : `transition duration-150 ${themeClasses.value.windowIconContainerBgFocused} ${themeClasses.value.windowTitleTextFocused}`,
  control: isCupertino.value ? "" : `${themeClasses.value.windowButtonText} ${themeClasses.value.windowButtonBgHover} ${themeClasses.value.windowButtonTextHover}`,
  closeControl: isCupertino.value ? "" : `${themeClasses.value.windowButtonText} ${themeClasses.value.windowCloseButtonBgHover} ${themeClasses.value.windowCloseButtonTextHover}`,
}));

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

@media (prefers-reduced-motion: reduce) {
  .pwm-snap-preview {
    animation: none;
  }
}
</style>

<style scoped>
.window-icon {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .window-icon {
    width: 18px;
    height: 18px;
  }
}
</style>
