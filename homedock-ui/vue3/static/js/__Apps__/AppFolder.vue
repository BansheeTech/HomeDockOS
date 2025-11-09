<!-- homedock-ui/vue3/static/js/__Windows__/FolderView.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="folder-view-container" :class="themeClasses.folderContainerBg">
    <div class="folder-breadcrumb" :class="[themeClasses.folderBreadcrumbBg, themeClasses.folderBreadcrumbBorder]">
      <Icon :icon="desktopIcon" class="breadcrumb-icon" :class="themeClasses.folderBreadcrumbIcon" />
      <span class="breadcrumb-text" :class="themeClasses.folderBreadcrumbText">Desktop</span>
      <Icon :icon="chevronRightIcon" class="breadcrumb-separator" :class="themeClasses.folderBreadcrumbSeparator" />
      <Icon :icon="folderIcon" class="breadcrumb-icon" :class="themeClasses.folderBreadcrumbIcon" />
      <span class="breadcrumb-text folder-name" :class="themeClasses.folderBreadcrumbText">{{ folderName }}</span>
      <span class="app-count" :class="themeClasses.folderAppCount">({{ folderApps.length }} apps)</span>
    </div>

    <div v-if="folderApps.length === 0" class="empty-folder-state">
      <Icon :icon="folderOpenOutlineIcon" class="empty-icon" :class="themeClasses.folderEmptyIcon" />
      <h3 class="empty-title" :class="themeClasses.folderEmptyTitle">Empty folder</h3>
      <p class="empty-description" :class="themeClasses.folderEmptyDescription">Drag apps here to organize them</p>
    </div>

    <div class="folder-apps-grid" ref="containerRef" @contextmenu="handleDesktopContextMenu">
      <TransitionGroup name="icon-appear">
        <div v-for="(app, index) in folderApps" :key="app.id" :class="['desktop-icon group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg w-[100px] z-[1] select-none outline-none border', selectedApp !== app.id && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], selectedApp === app.id && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected]]" :style="getIconStyle(index)" @click="handleClick(app)" @dblclick="handleDoubleClick(app)" @contextmenu="handleContextMenu($event, app)" @touchstart="handleTouchStart($event, app)" @touchmove="handleTouchMove" @touchend="handleTouchEnd($event, app)" :title="`${app.display_name || app.name} (${app.status})`">
          <div :class="['icon-container relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, selectedApp !== app.id && ['border-transparent', themeClasses.desktopIconContainerBgHover], selectedApp === app.id && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(app)]">
            <BaseImage :src="app.image_path" class="app-image rounded-xl" alt="" draggable="false" />
            <Transition name="loading-overlay-fade">
              <div v-if="app.isProcessing === true" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
              </div>
            </Transition>
            <div :class="['status-badge', getStatusBadgeClass(app.status), themeClasses.desktopStatusBadgeBorder, { 'status-pulse': app.status === 'running' }]"></div>
          </div>
          <span class="app-name" :class="[themeClasses.desktopIconText]">{{ app.display_name || app.name }}</span>
        </div>
      </TransitionGroup>
    </div>

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />

    <StatusBar :icon="folderOpenIcon" :message="`${folderName}`" :info="`${folderApps.length} ${folderApps.length === 1 ? 'app' : 'apps'}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="folderOpenIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Folder</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Folders help you organize your apps by grouping related applications together. Create folders by dragging apps on top of each other on the desktop, making it easier to manage and access your installed applications.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useDesktopStore, DockerApp } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";
import BaseImage from "../__Components__/BaseImage.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer, uninstallContainer, updateContainer } from "../__Services__/DockerActions";

import { Icon } from "@iconify/vue";
import desktopIcon from "@iconify-icons/mdi/desktop-mac";
import folderIcon from "@iconify-icons/mdi/folder";
import folderOpenOutlineIcon from "@iconify-icons/mdi/folder-open-outline";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import openIcon from "@iconify-icons/mdi/open-in-new";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import pauseIcon from "@iconify-icons/mdi/cog-pause";
import unpauseIcon from "@iconify-icons/mdi/cog-play";
import uninstallIcon from "@iconify-icons/mdi/delete-alert";
import updateIcon from "@iconify-icons/mdi/shape-circle-plus";
import terminalIcon from "@iconify-icons/mdi/console";
import refreshIcon from "@iconify-icons/mdi/refresh";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import exportIcon from "@iconify-icons/mdi/export";

interface Props {
  folderId: string;
}

const props = defineProps<Props>();

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const { isMobile } = useResponsive();
const { themeClasses } = useTheme();
const { confirm } = useDialog();

const csrfToken = useCsrfToken();

const containerRef = ref<HTMLDivElement | null>(null);

const selectedApp = ref<string | null>(null);
const contextMenuApp = ref<DockerApp | null>(null);
const maxCols = ref<number>(0);

const isHovering = ref(false);

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
const longPressStartX = ref(0);
const longPressStartY = ref(0);
const longPressMoved = ref(false);
const LONG_PRESS_DURATION = 500; // ms
const LONG_PRESS_MOVE_THRESHOLD = 10; // px

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});

const GRID_SIZE_X = ref(110);
const GRID_SIZE_Y = ref(125);
const ICON_PADDING = ref(16);

const folder = computed(() => desktopStore.getFolderById(props.folderId));
const folderName = computed(() => folder.value?.name || "Unknown Folder");
const folderApps = computed(() => {
  const apps = desktopStore.getAppsInFolder(props.folderId);

  const statusPriority: Record<string, number> = {
    running: 1,
    paused: 2,
    restarting: 3,
    created: 4,
    exited: 5,
  };

  return apps.sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;

    if (priorityA === priorityB) {
      return a.name.localeCompare(b.name);
    }

    return priorityA - priorityB;
  });
});

function getStatusBadgeClass(status: string): string {
  const statusClasses: Record<string, string> = {
    running: themeClasses.value.statusBadgeRunning,
    exited: themeClasses.value.statusBadgeExited,
    paused: themeClasses.value.statusBadgePaused,
    created: themeClasses.value.statusBadgeCreated,
    restarting: themeClasses.value.statusBadgeRestarting,
  };
  return statusClasses[status] || themeClasses.value.statusBadgeCreated;
}

function calculateGridSettings() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;

  if (isMobile.value) {
    const MOBILE_COLS = 4;
    const MOBILE_PADDING = 16;
    const availableWidth = containerWidth - MOBILE_PADDING * 2;
    const calculatedGridSizeX = Math.floor(availableWidth / MOBILE_COLS);

    GRID_SIZE_X.value = calculatedGridSizeX;
    GRID_SIZE_Y.value = calculatedGridSizeX + 15;
    ICON_PADDING.value = MOBILE_PADDING;
  } else {
    GRID_SIZE_X.value = 110;
    GRID_SIZE_Y.value = 125;
    ICON_PADDING.value = 16;
  }

  calculateMaxCols();
}

function getIconStyle(index: number): Record<string, string> {
  const cols = maxCols.value || 1;
  const row = Math.floor(index / cols);
  const col = index % cols;

  const style: Record<string, string> = {
    position: "absolute",
    left: `${ICON_PADDING.value + col * GRID_SIZE_X.value}px`,
    top: `${ICON_PADDING.value + row * GRID_SIZE_Y.value}px`,
  };

  if (isMobile.value) {
    style.width = `${GRID_SIZE_X.value}px`;
  }

  return style;
}

function calculateMaxCols() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
  maxCols.value = Math.max(1, Math.floor((containerWidth - ICON_PADDING.value * 2) / GRID_SIZE_X.value));
}

function getContainerClasses(app: DockerApp): string {
  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-50 opacity-75",
    exited: "grayscale brightness-50 opacity-75",
    created: "brightness-50 sepia opacity-50",
  };

  return statusClasses[app.status] || "";
}

function handleClick(app: DockerApp) {
  selectedApp.value = app.id;
}

function handleDoubleClick(app: DockerApp) {
  const isRunning = app.status === "running";

  if (isRunning && app.service_url) {
    window.open(app.service_url, "_blank", "noopener,noreferrer");
  } else {
    windowStore.openWindow("properties", {
      title: `${app.display_name || app.name} - Properties`,
      data: { appId: app.id },
      allowMultiple: true,
    });
  }
}

function handleContextMenu(e: MouseEvent, app: DockerApp) {
  e.preventDefault();
  e.stopPropagation();

  selectedApp.value = app.id;
  contextMenuApp.value = app;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleDesktopContextMenu(e: MouseEvent) {
  if ((e.target as HTMLElement).closest(".desktop-icon")) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  selectedApp.value = null;
  contextMenuApp.value = null;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (!contextMenuApp.value) {
    return [
      {
        label: "Refresh",
        icon: refreshIcon,
        action: () => {},
      },
    ];
  }

  const app = contextMenuApp.value;
  const isRunning = app.status === "running";
  const isExited = app.status === "exited";
  const isPaused = app.status === "paused";

  const items: ContextMenuItem[] = [];

  if (isRunning && app.service_url) {
    items.push({
      label: "Open",
      icon: openIcon,
      action: () => {
        if (contextMenuApp.value?.service_url) {
          window.open(contextMenuApp.value.service_url, "_blank", "noopener,noreferrer");
        }
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: isRunning ? "Stop" : "Start",
    icon: isRunning ? stopIcon : playIcon,
    action: async () => {
      if (!contextMenuApp.value) return;
      if (isRunning) {
        await stopContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      } else {
        await startContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isPaused,
  });

  items.push({
    label: "Restart",
    icon: restartIcon,
    action: async () => {
      if (contextMenuApp.value) {
        await restartContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isExited,
  });

  items.push({ divider: true });

  items.push({
    label: isPaused ? "Unpause" : "Pause",
    icon: isPaused ? unpauseIcon : pauseIcon,
    action: async () => {
      if (!contextMenuApp.value) return;
      if (isPaused) {
        await unpauseContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      } else {
        await pauseContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
    disabled: isExited,
  });

  items.push({ divider: true });

  items.push({
    label: "View Logs",
    icon: terminalIcon,
    action: () => {
      if (contextMenuApp.value) {
        windowStore.openWindow("logs", {
          title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - Logs`,
          data: { appName: contextMenuApp.value.name },
          allowMultiple: true,
        });
      }
    },
  });

  items.push({
    label: "Update",
    icon: updateIcon,
    action: async () => {
      if (contextMenuApp.value) {
        await updateContainer(contextMenuApp.value, csrfToken.value, themeClasses.value.scopeSelector);
      }
    },
  });

  items.push({
    label: "Refresh",
    icon: refreshIcon,
    action: () => {},
  });

  items.push({ divider: true });

  items.push({
    label: "Properties",
    icon: propertiesIcon,
    action: () => {
      if (!contextMenuApp.value) return;
      windowStore.openWindow("properties", {
        title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - Properties`,
        data: { appId: contextMenuApp.value.id },
        allowMultiple: true,
      });
    },
  });

  items.push({ divider: true });
  items.push({
    label: "Remove from Folder",
    icon: exportIcon,
    action: () => {
      if (contextMenuApp.value) {
        desktopStore.removeAppFromFolder(contextMenuApp.value.id);
      }
    },
  });

  items.push({ divider: true });

  items.push({
    label: "Uninstall",
    icon: uninstallIcon,
    action: () => {
      if (!contextMenuApp.value) return;
      const appToUninstall = contextMenuApp.value;

      confirm({
        title: "Confirm Uninstall",
        content: `Are you sure you want to uninstall ${appToUninstall.display_name || appToUninstall.name}? This action cannot be undone.`,
        okText: "Uninstall",
        cancelText: "Cancel",
        onOk: async () => {
          await uninstallContainer(appToUninstall, csrfToken.value, themeClasses.value.scopeSelector);
        },
      });
    },
  });

  return items;
});

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuApp.value = null;
}

function handleTouchStart(e: TouchEvent, app: DockerApp) {
  if (e.touches.length > 1) return;

  const touch = e.touches[0];

  longPressStartX.value = touch.clientX;
  longPressStartY.value = touch.clientY;
  longPressMoved.value = false;

  longPressTimer = setTimeout(() => {
    if (!longPressMoved.value) {
      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: touch.clientX,
        clientY: touch.clientY,
      });

      handleContextMenu(contextMenuEvent, app);

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, LONG_PRESS_DURATION);
}

function handleTouchMove(e: TouchEvent) {
  if (!longPressTimer) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - longPressStartX.value;
  const deltaY = touch.clientY - longPressStartY.value;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance > LONG_PRESS_MOVE_THRESHOLD) {
    longPressMoved.value = true;

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
}

function handleTouchEnd(e: TouchEvent, app: DockerApp) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  longPressMoved.value = false;
}

function isMouseOver(x: number, y: number): boolean {
  if (!containerRef.value) return false;
  const rect = containerRef.value.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function onGlobalMouseMove(e: MouseEvent) {
  isHovering.value = isMouseOver(e.clientX, e.clientY);
}

function onGlobalMouseUp(e: MouseEvent) {
  if (isHovering.value && desktopStore.draggedAppIds.length > 0) {
    e.preventDefault();
    e.stopPropagation();

    desktopStore.draggedAppIds.forEach((appId) => {
      const app = desktopStore.dockerApps.find((a) => a.id === appId);
      if (app && app.folderId !== props.folderId) {
        desktopStore.addAppToFolder(appId, props.folderId);
      }
    });

    desktopStore.clearDraggedApps();
  }
  isHovering.value = false;
}

watch(
  () => desktopStore.draggedAppIds.length > 0,
  (isDragging) => {
    if (isDragging) {
      document.addEventListener("mousemove", onGlobalMouseMove, true);
      document.addEventListener("mouseup", onGlobalMouseUp, true);
    } else {
      document.removeEventListener("mousemove", onGlobalMouseMove, true);
      document.removeEventListener("mouseup", onGlobalMouseUp, true);
      isHovering.value = false;
    }
  }
);

watch(
  folderName,
  (newName) => {
    const folderWindow = windowStore.windows.find((w) => w.appId === "folder-view" && w.data?.folderId === props.folderId);
    if (folderWindow) {
      windowStore.updateWindowTitle(folderWindow.id, newName);
    }
  },
  { immediate: false }
);

function handleResize() {
  calculateGridSettings();
}

watch(
  () => isMobile.value,
  () => {
    calculateGridSettings();
  }
);

onMounted(() => {
  calculateGridSettings();

  window.addEventListener("resize", handleResize);

  if (containerRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      calculateGridSettings();
    });
    resizeObserver.observe(containerRef.value);

    (containerRef.value as any).__resizeObserver = resizeObserver;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);

  if (containerRef.value && (containerRef.value as any).__resizeObserver) {
    (containerRef.value as any).__resizeObserver.disconnect();
  }

  document.removeEventListener("mousemove", onGlobalMouseMove, true);
  document.removeEventListener("mouseup", onGlobalMouseUp, true);

  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
});
</script>

<style scoped>
.folder-view-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Breadcrumb */
.folder-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1rem;
  border-bottom: 1px solid transparent;
}

.breadcrumb-icon {
  width: 18px;
  height: 18px;
}

.breadcrumb-separator {
  width: 16px;
  height: 16px;
}

.breadcrumb-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.folder-name {
  font-weight: 600;
}

.app-count {
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

/* Empty state */
.empty-folder-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  width: 64px;
  height: 64px;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.empty-description {
  font-size: 0.875rem;
  margin: 0;
}

/* Apps grid */
.folder-apps-grid {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 1rem;
  overflow-y: auto;
  overflow-x: hidden;
  user-select: none;
}

/* Desktop Icon */
.desktop-icon {
  transition: all 0.3s ease;
}

.desktop-icon:hover {
  transform: translateY(-2px);
}

.icon-container {
  transition: background 0.15s ease, transform 0.2s ease;
}

.app-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  pointer-events: none;
}

.status-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 3;
  pointer-events: none;
  transition: all 0.2s ease;
}

.status-badge.status-pulse {
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}

.app-name {
  font-size: 0.75rem;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

/* Icon Appear Animation */
.icon-appear-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.icon-appear-leave-active {
  transition: all 0.3s ease-in;
}

.icon-appear-enter-from {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.icon-appear-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.icon-appear-move {
  transition: transform 0.4s ease;
}

/* Loading Overlay Fade Animation */
.loading-overlay-fade-enter-active {
  transition: opacity 0.3s ease-out;
}

.loading-overlay-fade-leave-active {
  transition: opacity 0.4s ease-in;
}

.loading-overlay-fade-enter-from,
.loading-overlay-fade-leave-to {
  opacity: 0;
}

.loading-overlay-fade-enter-to,
.loading-overlay-fade-leave-from {
  opacity: 1;
}
</style>
