<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopIconsGrid.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="desktop-icons-container" ref="containerRef" @contextmenu="handleDesktopContextMenu" @mousedown="handleDesktopMouseDown">
    <Transition name="loading-fade">
      <div v-if="isLoading" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-[100]">
        <div :class="[themeClasses.desktopLoadingBg, themeClasses.desktopLoadingBorder]" class="flex flex-col items-center gap-4 px-12 py-8 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
          <div class="w-12 h-12 border-4 border-white/10 rounded-full animate-spin" :class="[themeClasses.desktopLoadingSpinner]" style="border-top-color: currentColor"></div>
          <p :class="[themeClasses.desktopLoadingText]" class="text-sm font-medium m-0 tracking-wide">Loading applications...</p>
          <div :class="[themeClasses.desktopLoadingBarBg]" class="w-[200px] h-[3px] rounded-[3px] overflow-hidden">
            <div :class="[themeClasses.desktopLoadingBarFill]" class="h-full bg-[length:200%_100%] animate-[loading-bar-animation_1.5s_ease-in-out_infinite]"></div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="corner-hint-fade">
      <div v-if="!isLoading && desktopStore.mainDockerApps.length === 0" class="absolute top-3 right-3 z-[100] pointer-events-none">
        <button @click="openAppStore" :class="[themeClasses.desktopEmptyBg, themeClasses.desktopEmptyBorder]" class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 pointer-events-auto shadow-md backdrop-blur-sm cursor-pointer border transition-all hover:scale-105 hover:shadow-lg">
          <Icon :icon="widgetsOutlineIcon" class="w-3.5 h-3.5" :class="themeClasses.desktopEmptyIcon" />
          <span :class="[themeClasses.desktopEmptyTitle]" class="text-[10px] font-medium leading-none">Install apps</span>
        </button>
      </div>
    </Transition>

    <MobileDesktopPages v-if="isMobile" :selected-app="selectedApp" :selected-apps="selectedApps" :selected-folder="selectedFolder" :selected-system-icon="selectedSystemIcon" :dragged-app="draggedApp" :dragged-folder="draggedFolder" :dragged-system-icon="draggedSystemIcon" @update:selected-app="selectedApp = $event" @update:selected-apps="selectedApps = $event" @update:selected-folder="selectedFolder = $event" @update:selected-system-icon="selectedSystemIcon = $event" @update:dragged-app="draggedApp = $event" @update:dragged-folder="draggedFolder = $event" @update:dragged-system-icon="draggedSystemIcon = $event" @update:is-wiggle-mode="isWiggleMode = $event" @click="handleClick" @dblclick="handleDoubleClick" @contextmenu="handleContextMenu" @systemicon-contextmenu="handleSystemIconContextMenu" @desktop-contextmenu="handleDesktopContextMenu" @close-context-menu="closeContextMenu" @folder-click="handleFolderClick" @folder-dblclick="handleFolderDoubleClick" @folder-contextmenu="handleFolderContextMenu" @folder-touch-start="handleFolderTouchStart" />

    <template v-else>
      <SelectionBox :visible="isSelectingArea" :style="selectionBoxStyle" />

      <TransitionGroup name="icon-appear">
        <div v-for="app in mainDockerApps" :key="app.id" :class="['group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease] w-[100px] z-[1] touch-none select-none outline-none border', !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], draggedApp === app.id || (isDragging && hasMoved && selectedApps.has(app.id)) ? 'opacity-70 !cursor-grabbing !z-[1000] !transition-none' : 'hover:-translate-y-0.5 active:cursor-grabbing']" :style="getIconStyle(app)" @mousedown="handleMouseDown($event, app)" @touchstart.passive="handleTouchStart($event, app)" @click="handleClick(app, $event)" @dblclick="handleDoubleClick(app)" @contextmenu="handleContextMenu($event, app)" :title="`${app.display_name || app.name} (${app.status})`">
          <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !(selectedApp === app.id || selectedApps.has(app.id)) && ['border-transparent', themeClasses.desktopIconContainerBgHover], (selectedApp === app.id || selectedApps.has(app.id)) && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected], getContainerClasses(app)]">
            <BaseImage :src="app.image_path" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
            <Transition name="loading-overlay-fade">
              <div v-if="app.isProcessing === true" class="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl pointer-events-none z-[2]">
                <div class="w-8 h-8 rounded-full border-[3px] border-white/30 border-t-blue-500 animate-spin shadow-lg"></div>
              </div>
            </Transition>
            <div :class="['absolute bottom-1 right-1 w-3 h-3 rounded-full z-[3] pointer-events-none transition-all duration-200', getStatusBadgeClass(app.status), themeClasses.desktopStatusBadgeBorder, app.status === 'running' && 'status-pulse']"></div>
          </div>
          <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ app.display_name || app.name }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup name="icon-appear">
        <div v-for="sysIcon in systemDesktopIcons" :key="sysIcon.id" :class="['group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease] w-[100px] z-[1] touch-none select-none outline-none border', selectedSystemIcon === sysIcon.id || selectedSystemIcons.has(sysIcon.id) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected] : ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], draggedSystemIcon === sysIcon.id || (isDragging && hasMoved && selectedSystemIcons.has(sysIcon.id)) ? 'opacity-70 !cursor-grabbing !z-[1000] !transition-none' : 'hover:-translate-y-0.5 active:cursor-grabbing', isWiggleMode && draggedSystemIcon !== sysIcon.id ? 'icon-wiggle' : '']" :style="getSystemIconStyle(sysIcon)" @mousedown="handleSystemIconMouseDown($event, sysIcon)" @touchstart="handleSystemIconTouchStart($event, sysIcon)" @click="handleSystemIconClick($event, sysIcon)" @dblclick="handleSystemIconDoubleClick(sysIcon)" @contextmenu="handleSystemIconContextMenu($event, sysIcon)" :title="sysIcon.name">
          <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, selectedSystemIcon === sysIcon.id || selectedSystemIcons.has(sysIcon.id) ? [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected] : ['border-transparent', themeClasses.desktopIconContainerBgHover]]">
            <div :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
              <Icon :icon="getSystemIconObject(sysIcon)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
            </div>
          </div>
          <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ sysIcon.name }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup name="icon-appear">
        <DesktopFolderIcon v-for="folder in displayedFolders" :key="folder.id" :folder="folder" :is-selected="selectedFolder === folder.id || selectedFolders.has(folder.id)" :is-dragging="draggedFolder === folder.id || (isDragging && hasMoved && selectedFolders.has(folder.id))" :is-drop-target="dropTargetFolderId === folder.id" @mousedown="handleFolderMouseDown" @touchstart="handleFolderTouchStart" @click="handleFolderClick" @dblclick="handleFolderDoubleClick" @contextmenu="handleFolderContextMenu" />
      </TransitionGroup>
    </template>

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />

    <AppDialog v-model:visible="showCreateFolderModal" type="info" title="Create New Folder" ok-text="Create" cancel-text="Cancel" @ok="handleCreateFolderOk" @cancel="handleCreateFolderCancel">
      <input v-model="createFolderName" placeholder="Folder name" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleCreateFolderOk" />
    </AppDialog>

    <AppDialog v-model:visible="showRenameFolderModal" type="info" title="Rename Folder" ok-text="Rename" cancel-text="Cancel" @ok="handleRenameFolderOk" @cancel="handleRenameFolderCancel">
      <input v-model="renameFolderName" placeholder="Folder name" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleRenameFolderOk" />
    </AppDialog>

    <FolderCustomizeMenu :visible="showCustomizeMenu" :x="customizeMenuPosition.x" :y="customizeMenuPosition.y" :color="customizeFolderColor" :icon="customizeFolderIcon" @update:color="handleCustomizeColorChange" @update:icon="handleCustomizeIconChange" @close="closeCustomizeMenu" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

import { useDesktopStore, DockerApp, DesktopFolder, SystemDesktopIcon } from "../__Stores__/desktopStore";
import { useDesktopDragSelection } from "../__Composables__/useDesktopDragSelection";
import { useDesktopDragAndDrop } from "../__Composables__/useDesktopDragAndDrop";
import { useDesktopGrid } from "../__Composables__/useDesktopGrid";

import type { GridConfig, DragItem, SelectionState } from "../__Composables__/desktopDragTypes";

import { useWindowStore } from "../__Stores__/windowStore";
import { useSelectedAppsStore } from "../__Stores__/selectedAppsStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";

import { useResponsive } from "../__Composables__/useResponsive";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";

import { useTheme } from "../__Themes__/ThemeSelector";

import { fetchContainers, startContainerPolling, stopContainerPolling } from "../__Services__/DockerAPIFetchContainerData";

import BaseImage from "../__Components__/BaseImage.vue";
import SelectionBox from "../__Components__/SelectionBox.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import DesktopFolderIcon from "./DesktopFolderIcon.vue";
import FolderCustomizeMenu from "../__Components__/FolderCustomizeMenu.vue";
import MobileDesktopPages from "./MobileDesktopPages.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import { startContainer, stopContainer, restartContainer, pauseContainer, unpauseContainer, uninstallContainer, updateContainer } from "../__Services__/DockerActions";

import { Icon } from "@iconify/vue";
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
import resetIcon from "@iconify-icons/mdi/restore";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import checkIcon from "@iconify-icons/mdi/check-circle";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import folderPlusIcon from "@iconify-icons/mdi/folder-plus";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import folderEditIcon from "@iconify-icons/mdi/folder-edit";
import folderRemoveIcon from "@iconify-icons/mdi/folder-remove";
import paletteIcon from "@iconify-icons/mdi/palette";

import cloudIcon from "@iconify-icons/mdi/cloud";
import monitorOffIcon from "@iconify-icons/mdi/monitor-off";
import fileSearchIcon from "@iconify-icons/mdi/file-search";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import packageVariantIcon from "@iconify-icons/mdi/package-variant";
import cubeIcon from "@iconify-icons/mdi/cube";
import nutIcon from "@iconify-icons/mdi/nut";
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant";
import tuneIcon from "@iconify-icons/mdi/tune";
import cloudQuestionIcon from "@iconify-icons/mdi/cloud-question";
import toolboxOutlineIcon from "@iconify-icons/mdi/toolbox-outline";
import folderMultipleIcon from "@iconify-icons/mdi/folder-multiple";

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const selectedAppsStore = useSelectedAppsStore();
const updateStore = useAppUpdateStore();
const { isMobile, isPortrait, isLandscape, windowWidth, windowHeight } = useResponsive();
const { themeClasses } = useTheme();
const { confirm } = useDialog();

const csrfToken = useCsrfToken();

const containerRef = ref<HTMLDivElement | null>(null);

const desktopGrid = useDesktopGrid(containerRef);

updateStore.setProcessor(async (appName: string) => {
  const app = desktopStore.dockerApps.find((a) => a.name === appName);
  if (app) {
    await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector, true);
  }
});

const isLoading = ref(true);
const foldersLoaded = ref(false);
const draggedFolder = ref<string | null>(null);
const draggedSystemIcon = ref<string | null>(null);
const isWiggleMode = ref(false);
const dropTargetFolderId = ref<string | null>(null);

const GRID_SIZE_X = ref(110);
const GRID_SIZE_Y = ref(125);
const ICON_PADDING = ref(16);

const gridConfig = computed<GridConfig>(() => ({
  sizeX: GRID_SIZE_X.value,
  sizeY: GRID_SIZE_Y.value,
  padding: ICON_PADDING.value,
  iconWidth: 100,
  iconHeight: 130,
}));

const {
  selectedApp,
  selectedApps,
  selectedFolder,
  selectedFolders,
  selectedSystemIcon,
  selectedSystemIcons,
  isSelectingArea,
  selectionBox,
  selectionBoxStyle: composableSelectionBoxStyle,
  selectItem,
  clearSelection,
} = useDesktopDragSelection({
  containerRef,
  gridConfig,
  enableBoxSelection: true,
  enableMultiSelect: true,
});

const contextMenuApp = ref<DockerApp | null>(null);
const contextMenuFolder = ref<DesktopFolder | null>(null);
const contextMenuSystemIcon = ref<SystemDesktopIcon | null>(null);

const selectionState = computed<SelectionState>(() => ({
  selectedApp: selectedApp.value,
  selectedApps: selectedApps.value,
  selectedFolder: selectedFolder.value,
  selectedFolders: selectedFolders.value,
  selectedSystemIcon: selectedSystemIcon.value,
  selectedSystemIcons: selectedSystemIcons.value,
}));

const {
  isDragging,
  hasMoved,
  findNextAvailablePosition,
  checkDropOnFolder,
  startDrag: composableStartDrag,
  updateDrag,
  endDrag: composableEndDrag,
} = useDesktopDragAndDrop({
  mode: "direct",
  containerId: "desktop",
  containerRef,
  gridConfig,
  selection: selectionState,
  onDropOnFolder: (folder, appIds) => {
    appIds.forEach((appId) => {
      desktopStore.addAppToFolder(appId, folder.id);
    });
  },
});

const draggedApp = ref<string | null>(null);

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});

const showCreateFolderModal = ref(false);
const createFolderName = ref("New Folder");
const createFolderPosition = ref<{ x: number; y: number; row: number; col: number } | null>(null);

const showRenameFolderModal = ref(false);
const renameFolderId = ref<string | null>(null);
const renameFolderName = ref("");

const showCustomizeMenu = ref(false);
const customizeFolderId = ref<string | null>(null);
const customizeFolderColor = ref("#3b82f6");
const customizeFolderIcon = ref("");
const customizeMenuPosition = ref({ x: 0, y: 0 });

function openCreateFolderModal() {
  if (isMobile.value) {
    createFolderPosition.value = null;
  } else {
    createFolderPosition.value = findNextAvailablePosition();
  }

  createFolderName.value = "New Folder";
  showCreateFolderModal.value = true;
}

function handleCreateFolderOk() {
  if (createFolderName.value.trim()) {
    if (isMobile.value) {
      desktopStore.createFolder(createFolderName.value.trim());
      initializeGridPositions();
    } else if (createFolderPosition.value) {
      const pos = createFolderPosition.value;
      desktopStore.createFolder(createFolderName.value.trim(), pos.x, pos.y, pos.row, pos.col);
    }
    showCreateFolderModal.value = false;
  }
}

function handleCreateFolderCancel() {
  showCreateFolderModal.value = false;
  createFolderName.value = "New Folder";
  createFolderPosition.value = null;
}

function openRenameFolderModal(folderId: string, currentName: string) {
  renameFolderId.value = folderId;
  renameFolderName.value = currentName;
  showRenameFolderModal.value = true;
}

function handleRenameFolderOk() {
  if (renameFolderId.value && renameFolderName.value.trim()) {
    desktopStore.renameFolder(renameFolderId.value, renameFolderName.value.trim());
    showRenameFolderModal.value = false;
  }
}

function handleRenameFolderCancel() {
  showRenameFolderModal.value = false;
  renameFolderId.value = null;
  renameFolderName.value = "";
}

function openCustomizeMenu(folderId: string, currentColor: string, currentIcon: string, x: number, y: number) {
  customizeFolderId.value = folderId;
  customizeFolderColor.value = currentColor || "#3b82f6";
  customizeFolderIcon.value = currentIcon || "";
  customizeMenuPosition.value = { x, y };
  showCustomizeMenu.value = true;
}

function handleCustomizeColorChange(color: string) {
  if (customizeFolderId.value) {
    desktopStore.updateFolderColor(customizeFolderId.value, color);
  }
}

function handleCustomizeIconChange(icon: string) {
  if (customizeFolderId.value) {
    desktopStore.updateFolderIcon(customizeFolderId.value, icon);
  }
}

function closeCustomizeMenu() {
  showCustomizeMenu.value = false;
  customizeFolderId.value = null;
}

const mainDockerApps = computed(() => desktopStore.desktopRootApps);

const systemDesktopIcons = computed(() => desktopStore.systemDesktopIcons);

const desktopFolders = computed(() => desktopStore.desktopFolders);

const displayedFolders = computed(() => {
  return foldersLoaded.value ? desktopFolders.value : [];
});

const selectionBoxStyle = composableSelectionBoxStyle;

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

function getIconStyle(app: DockerApp): Record<string, string> {
  const baseStyle: Record<string, string> = {};

  if (isMobile.value) {
    baseStyle.width = `${GRID_SIZE_X.value}px`;
  }

  if (app.x !== undefined && app.y !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${app.x}px`,
      top: `${app.y}px`,
    };
  }

  if (app.gridRow !== undefined && app.gridCol !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${ICON_PADDING.value + app.gridCol * GRID_SIZE_X.value}px`,
      top: `${ICON_PADDING.value + app.gridRow * GRID_SIZE_Y.value}px`,
    };
  }

  return {
    ...baseStyle,
    position: "absolute",
    opacity: "0",
    pointerEvents: "none",
    left: "0",
    top: "0",
  };
}

function getSystemIconStyle(icon: SystemDesktopIcon): Record<string, string> {
  const baseStyle: Record<string, string> = {};

  if (isMobile.value) {
    baseStyle.width = `${GRID_SIZE_X.value}px`;
  }

  if (icon.x !== undefined && icon.y !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${icon.x}px`,
      top: `${icon.y}px`,
    };
  }

  if (icon.gridRow !== undefined && icon.gridCol !== undefined) {
    return {
      ...baseStyle,
      position: "absolute",
      left: `${ICON_PADDING.value + icon.gridCol * GRID_SIZE_X.value}px`,
      top: `${ICON_PADDING.value + icon.gridRow * GRID_SIZE_Y.value}px`,
    };
  }

  return {
    ...baseStyle,
    position: "absolute",
    left: `${ICON_PADDING.value}px`,
    top: `${ICON_PADDING.value}px`,
  };
}

function handleSystemIconMouseDown(e: MouseEvent, icon: SystemDesktopIcon) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  hasMoved.value = false;
  startSystemIconDrag(icon, e.clientX, e.clientY);
}

function handleSystemIconClick(e: MouseEvent, icon: SystemDesktopIcon) {
  if (isWiggleMode.value) return;
  if (hasMoved.value) return;

  const isCtrlPressed = e.ctrlKey || e.metaKey;
  selectItem({ type: "systemicon", id: icon.id }, { ctrl: isCtrlPressed });
}

function handleSystemIconDoubleClick(icon: SystemDesktopIcon) {
  if (isWiggleMode.value) return;
  if (!hasMoved.value) {
    desktopStore.openSystemApp(icon.appId);
  }
}

function handleSystemIconContextMenu(e: MouseEvent, icon: SystemDesktopIcon) {
  e.preventDefault();
  e.stopPropagation();

  selectedApp.value = null;
  selectedApps.value.clear();
  selectedFolder.value = null;
  selectedFolders.value.clear();
  selectedSystemIcons.value.clear();
  selectedSystemIcon.value = icon.id;

  contextMenuApp.value = null;
  contextMenuFolder.value = null;
  contextMenuSystemIcon.value = icon;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function getSystemIconObject(icon: SystemDesktopIcon) {
  if (typeof icon.icon === "object" && icon.icon !== null) {
    return icon.icon;
  }

  const iconMap: Record<string, any> = {
    "mdi:cloud": cloudIcon,
    "mdi:file-search": fileSearchIcon,
    "mdi:folder-multiple": folderMultipleIcon,
    "mdi:widgets-outline": widgetsOutlineIcon,
    "mdi:cube-scan": cubeScanIcon,
    "mdi:package-variant": packageVariantIcon,
    "mdi:cube": cubeIcon,
    "mdi:nut": nutIcon,
    "mdi:chart-timeline-variant": chartTimelineVariantIcon,
    "mdi:tune": tuneIcon,
    "mdi:cloud-question": cloudQuestionIcon,
    "mdi:toolbox-outline": toolboxOutlineIcon,
  };
  return iconMap[icon.icon] || cloudIcon;
}

function startSystemIconDrag(icon: SystemDesktopIcon, clientX: number, clientY: number) {
  draggedSystemIcon.value = icon.id;
  composableStartDrag({ type: "systemicon", id: icon.id }, clientX, clientY);
  window.addEventListener("mousemove", handleSystemIconMouseMove);
  window.addEventListener("mouseup", handleSystemIconMouseUp);
}

function handleSystemIconMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  updateDrag(e.clientX, e.clientY);
}

function handleSystemIconMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  composableEndDrag();
  window.removeEventListener("mousemove", handleSystemIconMouseMove);
  window.removeEventListener("mouseup", handleSystemIconMouseUp);
  draggedSystemIcon.value = null;
}

function handleSystemIconTouchStart(e: TouchEvent, icon: SystemDesktopIcon) {
  if (!isMobile.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  startSystemIconTouchDrag(icon, touch.clientX, touch.clientY);
}

function startSystemIconTouchDrag(icon: SystemDesktopIcon, clientX: number, clientY: number) {
  draggedSystemIcon.value = icon.id;
  composableStartDrag({ type: "systemicon", id: icon.id }, clientX, clientY);
  window.addEventListener("touchmove", handleSystemIconTouchMove, { passive: false });
  window.addEventListener("touchend", handleSystemIconTouchEnd);
}

function handleSystemIconTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  updateDrag(touch.clientX, touch.clientY);
}

function handleSystemIconTouchEnd(e: TouchEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  composableEndDrag();
  window.removeEventListener("touchmove", handleSystemIconTouchMove);
  window.removeEventListener("touchend", handleSystemIconTouchEnd);
  draggedSystemIcon.value = null;
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

function calculateGridSettings() {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;

  if (isMobile.value) {
    const MOBILE_COLS = isPortrait.value ? 4 : 6;
    const MOBILE_PADDING = 16;

    const innerContainerWidth = containerWidth - MOBILE_PADDING * 2;

    const availableWidth = innerContainerWidth - MOBILE_PADDING * 2;

    const calculatedGridSizeX = Math.floor(availableWidth / MOBILE_COLS);

    GRID_SIZE_X.value = calculatedGridSizeX;
    GRID_SIZE_Y.value = calculatedGridSizeX + 15;
    ICON_PADDING.value = MOBILE_PADDING;
  } else {
    GRID_SIZE_X.value = 110;
    GRID_SIZE_Y.value = 125;
    ICON_PADDING.value = 16;
  }
}

function getAllSelectedItems(): DragItem[] {
  const items: DragItem[] = [];

  selectedApps.value.forEach((id) => {
    items.push({ type: "app", id });
  });

  selectedFolders.value.forEach((id) => {
    items.push({ type: "folder", id });
  });

  selectedSystemIcons.value.forEach((id) => {
    items.push({ type: "systemicon", id });
  });

  return items;
}

function initializeGridPositions() {
  desktopGrid.initializeItemPositions();
}

function startDrag(app: DockerApp, clientX: number, clientY: number) {
  draggedApp.value = app.id;
  composableStartDrag({ type: "app", id: app.id }, clientX, clientY);

  const allSelected = getAllSelectedItems();
  const appIds = allSelected.filter((item) => item.type === "app").map((item) => item.id);
  const draggedIds = appIds.length > 0 ? appIds : [app.id];
  desktopStore.setDraggedApps(draggedIds);
}

function handleMouseDown(e: MouseEvent, app: DockerApp) {
  if (isMobile.value) return;

  if (e.button !== 0) return;

  hasMoved.value = false;

  startDrag(app, e.clientX, e.clientY);

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleTouchStart(e: TouchEvent, app: DockerApp) {
  if (!isMobile.value) return;

  if (e.touches.length > 1) return;

  const touch = e.touches[0];

  hasMoved.value = false;

  startDrag(app, touch.clientX, touch.clientY);

  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", handleTouchEnd);
  document.addEventListener("touchcancel", handleTouchEnd);
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  updateDrag(e.clientX, e.clientY);

  if (hasMoved.value) {
    e.preventDefault();
    const containerRect = containerRef.value?.getBoundingClientRect();
    if (containerRect) {
      const targetFolder = checkDropOnFolder(e.clientX - containerRect.left, e.clientY - containerRect.top);
      dropTargetFolderId.value = targetFolder?.id || null;
    }
  }
}

function handleMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  if (hasMoved.value) {
    e.preventDefault();
  }

  endDrag();

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

function handleTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  if (e.touches.length > 1) {
    handleTouchEnd(e);
    return;
  }

  const touch = e.touches[0];

  updateDrag(touch.clientX, touch.clientY);

  if (hasMoved.value) {
    e.preventDefault();
    const containerRect = containerRef.value?.getBoundingClientRect();
    if (containerRect) {
      const targetFolder = checkDropOnFolder(touch.clientX - containerRect.left, touch.clientY - containerRect.top);
      dropTargetFolderId.value = targetFolder?.id || null;
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (!isDragging.value || !draggedApp.value) return;

  e.preventDefault();

  endDrag();

  document.removeEventListener("touchmove", handleTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleTouchEnd);
  document.removeEventListener("touchcancel", handleTouchEnd);
}

function endDrag() {
  if (!draggedApp.value) return;
  composableEndDrag();
  draggedApp.value = null;
  dropTargetFolderId.value = null;
  desktopStore.clearDraggedApps();
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  if (contextMenuSystemIcon.value) {
    const sysIcon = contextMenuSystemIcon.value;
    const items: ContextMenuItem[] = [
      {
        label: "Refresh",
        icon: refreshIcon,
        action: async () => {
          await fetchContainers(csrfToken.value);
        },
      },
    ];

    if (!sysIcon.isPermanent) {
      items.push({ divider: true });
      items.push({
        label: "Remove from Desktop",
        icon: monitorOffIcon,
        action: () => {
          desktopStore.removeSystemIconFromDesktop(sysIcon.appId);
          closeContextMenu();
        },
      });
    }

    return items;
  }

  if (contextMenuFolder.value) {
    const folder = contextMenuFolder.value;
    const folderApps = folder.items.map((appId) => desktopStore.dockerApps.find((a) => a.id === appId)).filter((a) => a !== undefined && a.HDRole !== "dependency") as DockerApp[];

    const items: ContextMenuItem[] = [
      {
        label: "Open",
        icon: folderOpenIcon,
        action: () => {
          desktopStore.openFolder(folder.id);
        },
      },
      { divider: true },
      {
        label: "Rename",
        icon: folderEditIcon,
        action: () => {
          openRenameFolderModal(folder.id, folder.name);
        },
      },
      {
        label: "Customize",
        icon: paletteIcon,
        action: () => {
          const x = contextMenu.value.x;
          const y = contextMenu.value.y;
          openCustomizeMenu(folder.id, folder.color || "#3b82f6", folder.icon || "", x, y);
        },
      },
    ];

    if (folderApps.length > 0) {
      items.push({ divider: true });
      items.push({
        label: `Update Apps (${folderApps.length})`,
        icon: updateIcon,
        action: () => {
          for (const app of folderApps) {
            updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
      });
    }

    items.push({ divider: true });
    items.push({
      label: "Delete Folder",
      icon: folderRemoveIcon,
      action: () => {
        const itemCount = folder.items.length;
        const message = itemCount > 0 ? `Delete "${folder.name}"? ${itemCount} app(s) will be moved to desktop.` : `Delete "${folder.name}"?`;

        confirm({
          title: "Delete Folder",
          content: message,
          okText: "Delete",
          cancelText: "Cancel",
          onOk: () => {
            desktopStore.deleteFolder(folder.id);
          },
        });
      },
    });

    return items;
  }

  if (!contextMenuApp.value) {
    const totalApps = desktopStore.dockerApps.filter((app) => app.HDRole !== "dependency").length;

    return [
      {
        label: "New Folder",
        icon: folderPlusIcon,
        action: () => {
          openCreateFolderModal();
        },
        disabled: desktopStore.mainDockerApps.length === 0,
      },
      { divider: true },
      {
        label: "Refresh",
        icon: refreshIcon,
        action: async () => {
          await fetchContainers(csrfToken.value);
        },
      },
      {
        label: `Update All Apps (${totalApps})`,
        icon: updateIcon,
        action: () => {
          for (const app of desktopStore.dockerApps.filter((a) => a.HDRole !== "dependency")) {
            updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
        disabled: totalApps === 0,
      },
      { divider: true },
      {
        label: "Reset Icon Positions",
        icon: resetIcon,
        action: () => {
          confirm({
            title: "Reset Icon Positions",
            content: "Reset all icon and folder positions to default grid? Folders will appear first, followed by apps.",
            okText: "Reset",
            cancelText: "Cancel",
            onOk: () => {
              desktopStore.resetIconPositions();
              initializeGridPositions();
            },
          });
        },
      },
    ];
  }

  const selectedCount = selectedApps.value.size;
  if (selectedCount > 1) {
    const selectedAppsList = Array.from(selectedApps.value)
      .map((id) => mainDockerApps.value.find((a) => a.id === id))
      .filter((a) => a !== undefined && a.HDRole !== "dependency") as DockerApp[];

    const hasRunning = selectedAppsList.some((a) => a.status === "running");
    const hasStopped = selectedAppsList.some((a) => a.status === "exited");
    const hasPaused = selectedAppsList.some((a) => a.status === "paused");

    return [
      {
        label: `Selected: ${selectedCount} apps`,
        icon: checkIcon,
        action: () => {},
        disabled: true,
      },
      { divider: true },
      {
        label: "Start All",
        icon: playIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status !== "running") {
              await startContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasStopped,
      },
      {
        label: "Stop All",
        icon: stopIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "running") {
              await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      },
      {
        label: "Restart All",
        icon: restartIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status !== "exited") {
              await restartContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: selectedAppsList.every((a) => a.status === "exited"),
      },
      { divider: true },
      {
        label: "Pause All",
        icon: pauseIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "running") {
              await pauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      },
      {
        label: "Unpause All",
        icon: unpauseIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            if (app.status === "paused") {
              await unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasPaused,
      },
      { divider: true },
      {
        label: "Update All",
        icon: updateIcon,
        action: async () => {
          for (const app of selectedAppsList) {
            await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
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
    action: () => {
      loadContainers();
    },
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

async function loadContainers() {
  try {
    isLoading.value = true;
    await fetchContainers(csrfToken.value);
  } catch (error) {
  } finally {
    isLoading.value = false;
  }
}

function openAppStore() {
  desktopStore.openSystemApp("appstore");
}

function handleClick(app: DockerApp, e?: MouseEvent) {
  if (isWiggleMode.value) return;

  if (!hasMoved.value) {
    const event = e || (window.event as MouseEvent);
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;
    selectItem({ type: "app", id: app.id }, { ctrl: isCtrlPressed });
  }
}

function handleDoubleClick(app: DockerApp) {
  if (isWiggleMode.value) return;

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

function deselectIcon() {
  clearSelection();
}

function handleFolderMouseDown(e: MouseEvent, folder: DesktopFolder) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  draggedFolder.value = folder.id;
  composableStartDrag({ type: "folder", id: folder.id }, e.clientX, e.clientY);

  document.addEventListener("mousemove", handleFolderMouseMove);
  document.addEventListener("mouseup", handleFolderMouseUp);
}

function handleFolderTouchStart(e: TouchEvent, folder: DesktopFolder) {
  if (!isMobile.value) return;
  if (e.touches.length > 1) return;

  const touch = e.touches[0];
  draggedFolder.value = folder.id;
  composableStartDrag({ type: "folder", id: folder.id }, touch.clientX, touch.clientY);

  document.addEventListener("touchmove", handleFolderTouchMove, { passive: false });
  document.addEventListener("touchend", handleFolderTouchEnd);
  document.addEventListener("touchcancel", handleFolderTouchEnd);
}

function handleFolderMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  updateDrag(e.clientX, e.clientY);

  if (hasMoved.value) {
    e.preventDefault();
  }
}

function handleFolderMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  if (hasMoved.value) {
    e.preventDefault();
  }

  composableEndDrag();

  document.removeEventListener("mousemove", handleFolderMouseMove);
  document.removeEventListener("mouseup", handleFolderMouseUp);

  draggedFolder.value = null;
}

function handleFolderTouchMove(e: TouchEvent) {
  if (!isDragging.value || !draggedFolder.value) return;
  if (e.touches.length > 1) {
    handleFolderTouchEnd(e);
    return;
  }

  const touch = e.touches[0];

  updateDrag(touch.clientX, touch.clientY);

  if (hasMoved.value) {
    e.preventDefault();
  }
}

function handleFolderTouchEnd(e: TouchEvent) {
  if (!isDragging.value || !draggedFolder.value) return;

  e.preventDefault();
  composableEndDrag();

  document.removeEventListener("touchmove", handleFolderTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleFolderTouchEnd);
  document.removeEventListener("touchcancel", handleFolderTouchEnd);

  draggedFolder.value = null;
}

function handleFolderClick(folder: DesktopFolder, e?: MouseEvent) {
  if (isWiggleMode.value) return;

  if (!hasMoved.value) {
    const event = e || (window.event as MouseEvent);
    const isCtrlPressed = event?.ctrlKey || event?.metaKey;
    selectItem({ type: "folder", id: folder.id }, { ctrl: isCtrlPressed });
  }
}

function handleFolderDoubleClick(folder: DesktopFolder) {
  if (isWiggleMode.value) return;

  desktopStore.openFolder(folder.id);
}

function handleFolderContextMenu(e: MouseEvent, folder: DesktopFolder) {
  if (isWiggleMode.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  selectedFolder.value = folder.id;
  selectedFolders.value.clear();
  selectedApp.value = null;
  selectedApps.value.clear();
  selectedSystemIcon.value = null;
  selectedSystemIcons.value.clear();
  contextMenuApp.value = null;
  contextMenuFolder.value = folder;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleContextMenu(e: MouseEvent, app: DockerApp) {
  if (isWiggleMode.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  if (!selectedApps.value.has(app.id)) {
    selectedApp.value = app.id;
    selectedApps.value.clear();
  }

  selectedFolder.value = null;
  selectedFolders.value.clear();
  selectedSystemIcon.value = null;
  selectedSystemIcons.value.clear();
  contextMenuApp.value = app;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

function handleDesktopMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("desktop-icons-container")) {
    if (e.button !== 0) return;

    const containerRect = containerRef.value?.getBoundingClientRect();
    if (!containerRect) return;

    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    isSelectingArea.value = true;
    selectionBox.value.startX = x;
    selectionBox.value.startY = y;
    selectionBox.value.currentX = x;
    selectionBox.value.currentY = y;

    clearSelection();

    document.addEventListener("mousemove", handleDesktopMouseMove);
    document.addEventListener("mouseup", handleDesktopMouseUp);
  }
}

function handleDesktopMouseMove(e: MouseEvent) {
  if (!isSelectingArea.value) return;

  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return;

  selectionBox.value.currentX = e.clientX - containerRect.left;
  selectionBox.value.currentY = e.clientY - containerRect.top;

  updateSelectedAppsInBox();
}

function handleDesktopMouseUp(_e: MouseEvent) {
  if (!isSelectingArea.value) return;

  isSelectingArea.value = false;

  document.removeEventListener("mousemove", handleDesktopMouseMove);
  document.removeEventListener("mouseup", handleDesktopMouseUp);
}

function updateSelectedAppsInBox() {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedApps.value.clear();
  selectedFolders.value.clear();
  selectedSystemIcons.value.clear();

  const boxLeft = boxX;
  const boxTop = boxY;
  const boxRight = boxX + boxWidth;
  const boxBottom = boxY + boxHeight;

  mainDockerApps.value.forEach((app) => {
    if (app.x === undefined || app.y === undefined) return;

    const iconLeft = app.x;
    const iconTop = app.y;
    const iconRight = app.x + 100;
    const iconBottom = app.y + 130;

    const intersects = boxLeft < iconRight && boxRight > iconLeft && boxTop < iconBottom && boxBottom > iconTop;

    if (intersects) {
      selectedApps.value.add(app.id);
    }
  });

  desktopStore.desktopFolders.forEach((folder) => {
    if (folder.x === undefined || folder.y === undefined) return;

    const iconLeft = folder.x;
    const iconTop = folder.y;
    const iconRight = folder.x + 100;
    const iconBottom = folder.y + 130;

    const intersects = boxLeft < iconRight && boxRight > iconLeft && boxTop < iconBottom && boxBottom > iconTop;

    if (intersects) {
      selectedFolders.value.add(folder.id);
    }
  });

  systemDesktopIcons.value.forEach((icon) => {
    if (icon.x === undefined || icon.y === undefined) return;

    const iconLeft = icon.x;
    const iconTop = icon.y;
    const iconRight = icon.x + 100;
    const iconBottom = icon.y + 130;

    const intersects = boxLeft < iconRight && boxRight > iconLeft && boxTop < iconBottom && boxBottom > iconTop;

    if (intersects) {
      selectedSystemIcons.value.add(icon.id);
    }
  });
}

function handleDesktopContextMenu(e: MouseEvent) {
  if (isWiggleMode.value) {
    e.preventDefault();
    return;
  }

  const isValidDesktopClick = isMobile.value || (e.target as HTMLElement).classList.contains("desktop-icons-container");

  if (isValidDesktopClick) {
    e.preventDefault();

    deselectIcon();

    contextMenuApp.value = null;
    contextMenuFolder.value = null;
    contextMenuSystemIcon.value = null;

    contextMenu.value = {
      visible: true,
      x: e.clientX,
      y: e.clientY,
    };
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuApp.value = null;
  contextMenuFolder.value = null;
  contextMenuSystemIcon.value = null;
}

defineExpose({
  deselectIcon,
});

watch(
  () => selectedAppsStore.applications,
  (newApps, oldApps) => {
    const filteredApps = newApps.filter((app) => {
      const desiredState = selectedAppsStore.getDesiredState(app.name);
      return desiredState !== "uninstalling";
    });

    const appsChanged = !oldApps || oldApps.length !== newApps.length || filteredApps.length !== desktopStore.dockerApps.length || JSON.stringify(filteredApps.map((a) => ({ id: a.id, status: a.status, ports: a.ports, usagePercent: a.usagePercent, memoryUsagePercent: a.memoryUsagePercent, networkRxBytes: a.networkRxBytes, networkTxBytes: a.networkTxBytes, service_url: a.service_url }))) !== JSON.stringify(desktopStore.dockerApps.map((a) => ({ id: a.id, status: a.status, ports: a.ports, usagePercent: a.usagePercent, memoryUsagePercent: a.memoryUsagePercent, networkRxBytes: a.networkRxBytes, networkTxBytes: a.networkTxBytes, service_url: a.service_url })));

    if (appsChanged) {
      desktopStore.loadDockerApps(filteredApps);
      initializeGridPositions();
    }

    if (filteredApps.length === 0) {
      desktopStore.loadDockerApps([]);
    }
  }
);

watch(
  () => desktopGrid.itemsWithoutPosition.value.length,
  (count) => {
    if (count > 0) {
      initializeGridPositions();
    }
  }
);

const externalDragMousePos = ref({ x: 0, y: 0 });

function handleExternalDragMove(e: MouseEvent) {
  externalDragMousePos.value = { x: e.clientX, y: e.clientY };
}

function handleExternalDragDrop(e: MouseEvent) {
  if (!desktopStore.dragSourceFolderId) return;

  const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
  const isOverFolderWindow = elementsAtPoint.some((el) => el.classList.contains("folder-view-container") || el.classList.contains("folder-apps-grid"));

  if (isOverFolderWindow) {
    return;
  }

  const containerRect = containerRef.value?.getBoundingClientRect();
  if (!containerRect) return;

  const isInDesktop = e.clientX >= containerRect.left && e.clientX <= containerRect.right && e.clientY >= containerRect.top && e.clientY <= containerRect.bottom;

  if (isInDesktop) {
    const dropX = e.clientX - containerRect.left;
    const dropY = e.clientY - containerRect.top;

    const targetFolder = checkDropOnFolder(dropX, dropY);

    if (targetFolder && targetFolder.id !== desktopStore.dragSourceFolderId) {
      desktopStore.draggedAppIds.forEach((appId) => {
        desktopStore.addAppToFolder(appId, targetFolder.id);
      });
    } else if (!targetFolder) {
      desktopStore.draggedAppIds.forEach((appId) => {
        desktopStore.removeAppFromFolder(appId);
      });

      setTimeout(() => {
        initializeGridPositions();
      }, 50);
    }
  }

  desktopStore.clearDraggedApps();
}

watch(
  () => desktopStore.dragSourceFolderId,
  (sourceFolderId) => {
    if (sourceFolderId && desktopStore.draggedAppIds.length > 0) {
      document.addEventListener("mousemove", handleExternalDragMove, true);
      document.addEventListener("mouseup", handleExternalDragDrop, true);
    } else {
      document.removeEventListener("mousemove", handleExternalDragMove, true);
      document.removeEventListener("mouseup", handleExternalDragDrop, true);
    }
  }
);

onMounted(() => {
  calculateGridSettings();

  loadContainers();

  startContainerPolling(csrfToken.value, 5000);

  desktopStore.loadFolders();

  setTimeout(() => {
    foldersLoaded.value = true;
  }, 150);

  window.addEventListener("resize", handleResize);
});

function handleResize() {
  calculateGridSettings();
  initializeGridPositions();
}

watch(
  () => [isMobile.value, isPortrait.value, isLandscape.value],
  () => {
    calculateGridSettings();
    initializeGridPositions();
  }
);

onUnmounted(() => {
  stopContainerPolling();

  window.removeEventListener("resize", handleResize);

  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);

  document.removeEventListener("touchmove", handleTouchMove, { passive: false } as AddEventListenerOptions);
  document.removeEventListener("touchend", handleTouchEnd);
  document.removeEventListener("touchcancel", handleTouchEnd);

  document.removeEventListener("mousemove", handleExternalDragMove, true);
  document.removeEventListener("mouseup", handleExternalDragDrop, true);
});
</script>

<style scoped>
.desktop-icons-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 1rem;
  user-select: none;
  overflow: hidden;
}

/* Vue Transitions */
.loading-fade-enter-active {
  transition: opacity 0.3s ease;
}

.loading-fade-leave-active {
  transition: opacity 0.5s ease;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

.corner-hint-fade-enter-active {
  transition: opacity 0.4s ease-out, transform 0.4s ease-out;
}

.corner-hint-fade-leave-active {
  transition: opacity 0.3s ease-in, transform 0.3s ease-in;
}

.corner-hint-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.corner-hint-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.corner-hint-fade-enter-to,
.corner-hint-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

.opacity-fade-enter-active,
.opacity-fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.opacity-fade-enter-from,
.opacity-fade-leave-to {
  opacity: 0;
}

.opacity-fade-enter-to,
.opacity-fade-leave-from {
  opacity: 1;
}

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
  transition: left 0.4s ease, top 0.4s ease, transform 0.4s ease;
}

/* Animations */
@keyframes loading-bar-animation {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
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

.status-pulse {
  animation: pulse-badge 2s ease-in-out infinite;
}
</style>
