<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopIconsGrid.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="desktop-icons-container" ref="containerRef" @contextmenu="handleDesktopContextMenu" @mousedown="handleDesktopMouseDown">
    <DesktopLoadingOverlay :visible="isLoading" />

    <Transition name="corner-hint-fade">
      <div v-if="!isLoading && desktopStore.mainDockerApps.length === 0" class="absolute top-3 right-3 z-[100] pointer-events-none">
        <button @click="openAppStore" :class="[themeClasses.desktopEmptyBg, themeClasses.desktopEmptyBorder]" class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 pointer-events-auto shadow-md backdrop-blur-sm cursor-pointer border transition-all hover:scale-105 hover:shadow-lg">
          <Icon :icon="widgetsOutlineIcon" class="w-3.5 h-3.5" :class="themeClasses.desktopEmptyIcon" />
          <span :class="[themeClasses.desktopEmptyTitle]" class="text-[10px] font-medium leading-none">{{ $t("Install apps") }}</span>
        </button>
      </div>
    </Transition>

    <MobileDesktopPages v-if="isMobile" :selected-app="selectedApp" :selected-apps="selectedApps" :selected-folder="selectedFolder" :selected-system-icon="selectedSystemIcon" :dragged-app="draggedApp" :dragged-folder="draggedFolder" :dragged-system-icon="draggedSystemIcon" @update:selected-app="selectedApp = $event" @update:selected-apps="selectedApps = $event" @update:selected-folder="selectedFolder = $event" @update:selected-system-icon="selectedSystemIcon = $event" @update:dragged-app="draggedApp = $event" @update:dragged-folder="draggedFolder = $event" @update:dragged-system-icon="draggedSystemIcon = $event" @update:is-wiggle-mode="isWiggleMode = $event" @click="handleClick" @dblclick="handleDoubleClick" @contextmenu="handleContextMenu" @systemicon-contextmenu="handleSystemIconContextMenu" @desktop-contextmenu="handleDesktopContextMenu" @close-context-menu="closeContextMenu" @folder-click="handleFolderClick" @folder-dblclick="handleFolderDoubleClick" @folder-contextmenu="handleFolderContextMenu" @folder-touch-start="handleFolderTouchStart" @widget-contextmenu="handleWidgetContextMenu" />

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
            <PortScanningOverlay :visible="app.status === 'running' && isPortScanning(app) && !app.isProcessing" />
            <div :class="['absolute bottom-1 right-1 w-3 h-3 rounded-full z-[3] pointer-events-none transition-all duration-200', getStatusBadgeClass(app.status), themeClasses.desktopStatusBadgeBorder, app.status === 'running' && 'status-pulse']"></div>
          </div>
          <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ app.display_name || app.name }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup name="icon-appear">
        <div v-for="sysIcon in systemDesktopIcons" :key="sysIcon.id" :class="['group flex flex-col items-center gap-1 cursor-pointer p-3 rounded-lg transition-[left,top,background,transform,border,box-shadow] duration-[400ms,400ms,150ms,200ms,0ms,0ms] ease-[ease,ease,ease,ease,ease,ease] w-[100px] z-[1] touch-none select-none outline-none border', selectedSystemIcon === sysIcon.id || selectedSystemIcons.has(sysIcon.id) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected] : ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], draggedSystemIcon === sysIcon.id || (isDragging && hasMoved && selectedSystemIcons.has(sysIcon.id)) ? 'opacity-70 !cursor-grabbing !z-[1000] !transition-none' : 'hover:-translate-y-0.5 active:cursor-grabbing', isWiggleMode && draggedSystemIcon !== sysIcon.id ? 'icon-wiggle' : '']" :style="getSystemIconStyle(sysIcon)" @mousedown="handleSystemIconMouseDown($event, sysIcon)" @touchstart="handleSystemIconTouchStart($event, sysIcon)" @click="handleSystemIconClick($event, sysIcon)" @dblclick="handleSystemIconDoubleClick(sysIcon)" @contextmenu="handleSystemIconContextMenu($event, sysIcon)" :title="sysIcon.shortcut ? sysIcon.name : $t(sysIcon.name)">
          <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden transition-[background,transform,border-color] duration-[150ms,200ms,0ms] ease-[ease,ease,ease] pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, selectedSystemIcon === sysIcon.id || selectedSystemIcons.has(sysIcon.id) ? [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected] : ['border-transparent', themeClasses.desktopIconContainerBgHover]]">
            <template v-if="sysIcon.shortcut">
              <Transition name="icon-switch" mode="out-in">
                <BaseImage v-if="sysIcon.shortcut.iconType === 'image'" :key="`image:${sysIcon.shortcut.iconValue}`" :src="getShortcutIconUrl(sysIcon.shortcut.iconValue)" class="w-12 h-12 object-contain pointer-events-none rounded-xl" alt="" draggable="false" />
                <div v-else :key="`preset:${sysIcon.shortcut.iconValue}`" :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
                  <Icon :icon="getShortcutGlyph(sysIcon.shortcut)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
                </div>
              </Transition>
              <div class="absolute bottom-1 left-1 w-4 h-4 rounded bg-white border border-black/10 shadow-sm flex items-center justify-center z-[3] pointer-events-none">
                <Icon :icon="arrowTopRightIcon" class="w-3 h-3 text-blue-600" />
              </div>
            </template>
            <div v-else :class="['w-full h-full flex items-center justify-center rounded-lg', themeClasses.iconHolder]">
              <Icon :icon="getSystemIconObject(sysIcon)" class="w-10 h-10 pointer-events-none" :class="themeClasses.explorerItemIcon" />
            </div>
          </div>
          <span :class="[themeClasses.desktopIconText, 'text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap pointer-events-none font-medium']" style="line-height: 1.25rem">{{ sysIcon.shortcut ? sysIcon.name : $t(sysIcon.name) }}</span>
        </div>
      </TransitionGroup>

      <TransitionGroup name="icon-appear">
        <DesktopFolderIcon v-for="folder in displayedFolders" :key="folder.id" :folder="folder" :is-selected="selectedFolder === folder.id || selectedFolders.has(folder.id)" :is-dragging="draggedFolder === folder.id || (isDragging && hasMoved && selectedFolders.has(folder.id))" :is-drop-target="dropTargetFolderId === folder.id" @mousedown="handleFolderMouseDown" @touchstart="handleFolderTouchStart" @click="handleFolderClick" @dblclick="handleFolderDoubleClick" @contextmenu="handleFolderContextMenu" />
      </TransitionGroup>

      <TransitionGroup name="widget-appear" move-class="widget-move-none">
        <div v-for="widget in widgetsStore.instances" :key="widget.instanceId" :class="['absolute z-[1] touch-none select-none outline-none', (draggedWidget === widget.instanceId && widgetHasMoved) || settlingWidget?.id === widget.instanceId ? '!cursor-grabbing !z-[1000]' : 'transition-[left,top] duration-[400ms] ease-[ease] cursor-grab active:cursor-grabbing']" :style="getWidgetStyle(widget)" @mousedown="handleWidgetMouseDown($event, widget)" @click.capture="handleWidgetClickCapture" @contextmenu="handleWidgetContextMenu($event, widget)">
          <DesktopWidgetFrame :instance="widget" />
        </div>
      </TransitionGroup>
    </template>

    <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />

    <AppDialog v-model:visible="showCreateFolderModal" type="info" title="Create New Folder" ok-text="Create" cancel-text="Cancel" @ok="handleCreateFolderOk" @cancel="handleCreateFolderCancel">
      <input v-model="createFolderName" :placeholder="$t('Folder name')" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowInputBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleCreateFolderOk" />
    </AppDialog>

    <ShortcutEditModal v-model:visible="showShortcutModal" :mode="shortcutModalMode" :initial-name="shortcutModalInitial.name" :initial-url="shortcutModalInitial.url" :initial-icon-type="shortcutModalInitial.iconType" :initial-icon-value="shortcutModalInitial.iconValue" @save="handleShortcutSave" />

    <WidgetGalleryModal v-model:visible="showWidgetGallery" @add="handleAddWidget" />

    <AppDialog v-model:visible="showRenameFolderModal" type="info" title="Rename Folder" ok-text="Rename" cancel-text="Cancel" @ok="handleRenameFolderOk" @cancel="handleRenameFolderCancel">
      <input v-model="renameFolderName" :placeholder="$t('Folder name')" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowInputBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleRenameFolderOk" />
    </AppDialog>

    <FolderCustomizeMenu :visible="showCustomizeMenu" :x="customizeMenuPosition.x" :y="customizeMenuPosition.y" :color="customizeFolderColor" :icon="customizeFolderIcon" @update:color="handleCustomizeColorChange" @update:icon="handleCustomizeIconChange" @close="closeCustomizeMenu" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useDesktopStore, DockerApp, DesktopFolder, SystemDesktopIcon } from "../__Stores__/desktopStore";
import { useWidgetsStore, WIDGET_MAX_INSTANCES, type WidgetInstance } from "../__Stores__/useWidgetsStore";
import { useQuickViewStore } from "../__Stores__/useQuickViewStore";
import { shortcutLabel } from "../__Utils__/PlatformKeys";
import { getWidgetDims, getWidgetDefinition, type WidgetDefinition, type WidgetSize } from "../__Config__/WidgetDefaultDetails";
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
import PortScanningOverlay from "../__Components__/PortScanningOverlay.vue";
import DesktopLoadingOverlay from "../__Components__/DesktopLoadingOverlay.vue";
import SelectionBox from "../__Components__/SelectionBox.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import DesktopFolderIcon from "./DesktopFolderIcon.vue";
import FolderCustomizeMenu from "../__Components__/FolderCustomizeMenu.vue";
import MobileDesktopPages from "./MobileDesktopPages.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import ShortcutEditModal, { type ShortcutModalResult } from "../__Components__/ShortcutEditModal.vue";
import DesktopWidgetFrame from "./DesktopWidgetFrame.vue";
import WidgetGalleryModal from "../__Components__/WidgetGalleryModal.vue";

import { getShortcutGlyph, getShortcutIconUrl } from "../__Config__/ShortcutIcons";

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
import quickViewIcon from "@iconify-icons/mdi/view-dashboard-variant-outline";
import resetIcon from "@iconify-icons/mdi/restore";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import checkIcon from "@iconify-icons/mdi/check-circle";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import folderPlusIcon from "@iconify-icons/mdi/folder-plus";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import folderEditIcon from "@iconify-icons/mdi/folder-edit";
import folderRemoveIcon from "@iconify-icons/mdi/folder-remove";
import paletteIcon from "@iconify-icons/mdi/palette";
import pencilIcon from "@iconify-icons/mdi/pencil";
import linkPlusIcon from "@iconify-icons/mdi/link-plus";
import linkOffIcon from "@iconify-icons/mdi/link-variant-off";
import arrowTopRightIcon from "@iconify-icons/mdi/arrow-top-right";
import widgetsPlusIcon from "@iconify-icons/mdi/auto-awesome-mosaic";
import resizeIcon from "@iconify-icons/mdi/resize";

import cloudIcon from "@iconify-icons/mdi/cloud";
import { homedockIcon } from "../__Config__/HomeDockIcon";
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
const widgetsStore = useWidgetsStore();
const windowStore = useWindowStore();
const quickView = useQuickViewStore();
const selectedAppsStore = useSelectedAppsStore();
const updateStore = useAppUpdateStore();
const { isMobile, isPortrait, isLandscape, windowWidth, windowHeight } = useResponsive();
const { themeClasses } = useTheme();
const { t } = useI18n();
const { confirm, info } = useDialog();

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
  onDropOnFolder: (folder, itemIds) => {
    itemIds.forEach((itemId) => {
      if (itemId.startsWith("shortcut-")) {
        desktopStore.addShortcutToFolder(itemId, folder.id);
      } else {
        desktopStore.addAppToFolder(itemId, folder.id);
      }
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
const createFolderName = ref(t("New Folder"));
const createFolderPosition = ref<{ x: number; y: number; row: number; col: number } | null>(null);

const showRenameFolderModal = ref(false);
const renameFolderId = ref<string | null>(null);
const renameFolderName = ref("");

const showCustomizeMenu = ref(false);
const customizeFolderId = ref<string | null>(null);
const customizeFolderColor = ref("#3b82f6");
const customizeFolderIcon = ref("");
const customizeMenuPosition = ref({ x: 0, y: 0 });

const showShortcutModal = ref(false);
const shortcutModalMode = ref<"create" | "edit">("create");
const editingShortcutId = ref<string | null>(null);
const shortcutModalInitial = ref<{ name: string; url: string; iconType: "preset" | "image"; iconValue: string }>({ name: "", url: "", iconType: "preset", iconValue: "web" });

function openShortcutModal(icon?: SystemDesktopIcon) {
  if (icon?.shortcut && icon.shortcut.type === "file") return;

  if (icon?.shortcut) {
    shortcutModalMode.value = "edit";
    editingShortcutId.value = icon.shortcut.shortcutId;
    shortcutModalInitial.value = { name: icon.name, url: icon.shortcut.url, iconType: icon.shortcut.iconType as "preset" | "image", iconValue: icon.shortcut.iconValue };
  } else {
    shortcutModalMode.value = "create";
    editingShortcutId.value = null;
    shortcutModalInitial.value = { name: "", url: "", iconType: "preset", iconValue: "web" };
  }
  showShortcutModal.value = true;
}

async function handleShortcutSave(result: ShortcutModalResult) {
  if (shortcutModalMode.value === "edit" && editingShortcutId.value) {
    await desktopStore.updateShortcut(editingShortcutId.value, result, csrfToken.value);
  } else {
    await desktopStore.addShortcut(result, csrfToken.value);
  }
}

function openCreateFolderModal() {
  if (isMobile.value) {
    createFolderPosition.value = null;
  } else {
    createFolderPosition.value = findNextAvailablePosition();
  }

  createFolderName.value = t("New Folder");
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
  createFolderName.value = t("New Folder");
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

const contextMenuWidget = ref<WidgetInstance | null>(null);
const showWidgetGallery = ref(false);

const draggedWidget = ref<string | null>(null);
const widgetHasMoved = ref(false);
const widgetDragPos = ref({ x: 0, y: 0 });
const settlingWidget = ref<{ id: string; x: number; y: number } | null>(null);
let widgetDragStart = { mouseX: 0, mouseY: 0, x: 0, y: 0, instance: null as WidgetInstance | null };

function widgetPixelRect(widget: WidgetInstance): { width: number; height: number } {
  const dims = getWidgetDims(widget.type, widget.size);
  return {
    width: dims.cols * GRID_SIZE_X.value - 10,
    height: dims.rows * GRID_SIZE_Y.value - 10,
  };
}

function getWidgetStyle(widget: WidgetInstance): Record<string, string> {
  const { width, height } = widgetPixelRect(widget);
  const left = ICON_PADDING.value + widget.gridCol * GRID_SIZE_X.value;
  const top = ICON_PADDING.value + widget.gridRow * GRID_SIZE_Y.value;

  const style: Record<string, string> = { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` };

  if (draggedWidget.value === widget.instanceId && widgetHasMoved.value) {
    style.left = `${widgetDragPos.value.x}px`;
    style.top = `${widgetDragPos.value.y}px`;
  } else if (settlingWidget.value?.id === widget.instanceId) {
    style.left = `${settlingWidget.value.x}px`;
    style.top = `${settlingWidget.value.y}px`;
  }

  return style;
}

function widgetGridBounds(): { maxCols: number; maxRows: number } {
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
  const containerHeight = containerRef.value?.clientHeight || window.innerHeight;

  return {
    maxCols: Math.max(1, Math.floor((containerWidth - ICON_PADDING.value * 2) / GRID_SIZE_X.value)),
    maxRows: Math.max(1, Math.floor((containerHeight - ICON_PADDING.value * 2) / GRID_SIZE_Y.value)),
  };
}

function iconOccupiedCells(): Set<string> {
  const cells = new Set<string>();
  const pad = ICON_PADDING.value;
  const gx = GRID_SIZE_X.value;
  const gy = GRID_SIZE_Y.value;

  const addItem = (item: { x?: number; y?: number }) => {
    if (item.x === undefined || item.y === undefined) return;
    cells.add(`${Math.round((item.y - pad) / gy)},${Math.round((item.x - pad) / gx)}`);
  };

  mainDockerApps.value.forEach(addItem);
  desktopFolders.value.forEach(addItem);
  systemDesktopIcons.value.forEach(addItem);

  return cells;
}

function isWidgetRectFree(row: number, col: number, cols: number, rows: number, excludeInstanceId?: string): boolean {
  const { maxCols, maxRows } = widgetGridBounds();
  if (row < 0 || col < 0 || col + cols > maxCols || row + rows > maxRows) return false;

  const iconCells = iconOccupiedCells();
  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) {
      if (iconCells.has(`${r},${c}`)) return false;
    }
  }

  return !widgetsStore.instances.some((other) => {
    if (other.instanceId === excludeInstanceId) return false;
    const rect = widgetsStore.instanceRect(other);
    return row < rect.row + rect.rows && rect.row < row + rows && col < rect.col + rect.cols && rect.col < col + cols;
  });
}

function findWidgetSlot(cols: number, rows: number, excludeInstanceId?: string): { row: number; col: number } | null {
  const { maxCols, maxRows } = widgetGridBounds();

  for (let row = 0; row + rows <= maxRows; row++) {
    for (let col = 0; col + cols <= maxCols; col++) {
      if (isWidgetRectFree(row, col, cols, rows, excludeInstanceId)) {
        return { row, col };
      }
    }
  }

  return null;
}

function findDesktopWidgetOnlySlot(cols: number, rows: number): { row: number; col: number } {
  const DESKTOP_COLS = 20;

  for (let row = 0; row < 100; row++) {
    for (let col = 0; col + cols <= DESKTOP_COLS; col++) {
      const free = !widgetsStore.instances.some((other) => {
        const rect = widgetsStore.instanceRect(other);
        return row < rect.row + rect.rows && rect.row < row + rows && col < rect.col + rect.cols && rect.col < col + cols;
      });
      if (free) return { row, col };
    }
  }

  return { row: 0, col: 0 };
}

function handleAddWidget(def: WidgetDefinition) {
  if (widgetsStore.instances.length >= WIDGET_MAX_INSTANCES) {
    info({
      title: "Widget limit",
      content: t("You can have up to {n} widgets. Remove one to add another.", { n: WIDGET_MAX_INSTANCES }),
      okText: "OK",
      okCancel: false,
    });
    return;
  }

  const dims = getWidgetDims(def.id, def.defaultSize);

  if (isMobile.value) {
    const slot = findDesktopWidgetOnlySlot(dims.cols, dims.rows);
    widgetsStore.add(def.id, slot.row, slot.col);
    return;
  }

  const slot = findWidgetSlot(dims.cols, dims.rows);
  if (!slot) {
    info({
      title: "No space available",
      content: "There is no free space for this widget. Move or remove something first.",
      okText: "OK",
      okCancel: false,
    });
    return;
  }

  widgetsStore.add(def.id, slot.row, slot.col);
}

function resizeWidget(widget: WidgetInstance, size: WidgetSize) {
  if (widget.size === size) return;

  if (isMobile.value) {
    widgetsStore.resize(widget.instanceId, size);
    widgetsStore.setMobilePosition(widget.instanceId, null);
    return;
  }

  const dims = getWidgetDims(widget.type, size);

  if (isWidgetRectFree(widget.gridRow, widget.gridCol, dims.cols, dims.rows, widget.instanceId)) {
    widgetsStore.resize(widget.instanceId, size);
    return;
  }

  const slot = findWidgetSlot(dims.cols, dims.rows, widget.instanceId);
  if (slot) {
    widgetsStore.resize(widget.instanceId, size, slot.row, slot.col);
  }
}

function handleWidgetMouseDown(e: MouseEvent, widget: WidgetInstance) {
  if (isMobile.value) return;
  if (e.button !== 0) return;

  e.preventDefault();
  clearSelection();

  widgetDragStart = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    x: ICON_PADDING.value + widget.gridCol * GRID_SIZE_X.value,
    y: ICON_PADDING.value + widget.gridRow * GRID_SIZE_Y.value,
    instance: widget,
  };
  draggedWidget.value = widget.instanceId;
  widgetHasMoved.value = false;
  suppressWidgetClick = false;
  settlingWidget.value = null;
  widgetDragPos.value = { x: widgetDragStart.x, y: widgetDragStart.y };

  document.addEventListener("mousemove", handleWidgetMouseMove);
  document.addEventListener("mouseup", handleWidgetMouseUp);
}

let widgetMoveRaf: number | null = null;
let lastWidgetMouse = { x: 0, y: 0 };
let suppressWidgetClick = false;

function handleWidgetClickCapture(e: MouseEvent) {
  if (suppressWidgetClick) {
    suppressWidgetClick = false;
    e.preventDefault();
    e.stopPropagation();
  }
}

function handleWidgetMouseMove(e: MouseEvent) {
  lastWidgetMouse = { x: e.clientX, y: e.clientY };

  if (widgetMoveRaf !== null) return;
  widgetMoveRaf = requestAnimationFrame(() => {
    widgetMoveRaf = null;
    applyWidgetDrag();
  });
}

function applyWidgetDrag() {
  const widget = widgetDragStart.instance;
  if (!widget || !draggedWidget.value) return;

  const deltaX = lastWidgetMouse.x - widgetDragStart.mouseX;
  const deltaY = lastWidgetMouse.y - widgetDragStart.mouseY;

  if (!widgetHasMoved.value && Math.sqrt(deltaX * deltaX + deltaY * deltaY) <= 5) return;
  widgetHasMoved.value = true;

  const { width, height } = widgetPixelRect(widget);
  const containerWidth = containerRef.value?.clientWidth || window.innerWidth;
  const containerHeight = containerRef.value?.clientHeight || window.innerHeight;
  const pad = ICON_PADDING.value;

  widgetDragPos.value = {
    x: Math.round(Math.max(pad, Math.min(widgetDragStart.x + deltaX, containerWidth - width - pad))),
    y: Math.round(Math.max(pad, Math.min(widgetDragStart.y + deltaY, containerHeight - height - pad))),
  };
}

function handleWidgetMouseUp() {
  if (widgetMoveRaf !== null) {
    cancelAnimationFrame(widgetMoveRaf);
    widgetMoveRaf = null;
    applyWidgetDrag();
  }

  const widget = widgetDragStart.instance;

  if (widget && widgetHasMoved.value) {
    const dims = getWidgetDims(widget.type, widget.size);
    const col = Math.round((widgetDragPos.value.x - ICON_PADDING.value) / GRID_SIZE_X.value);
    const row = Math.round((widgetDragPos.value.y - ICON_PADDING.value) / GRID_SIZE_Y.value);

    settlingWidget.value = { id: widget.instanceId, x: widgetDragPos.value.x, y: widgetDragPos.value.y };

    if ((row !== widget.gridRow || col !== widget.gridCol) && isWidgetRectFree(row, col, dims.cols, dims.rows, widget.instanceId)) {
      widgetsStore.move(widget.instanceId, row, col);
    }

    const settlingId = widget.instanceId;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (settlingWidget.value?.id === settlingId) {
          settlingWidget.value = null;
        }
      });
    });
  }

  suppressWidgetClick = widgetHasMoved.value;

  draggedWidget.value = null;
  widgetHasMoved.value = false;
  widgetDragStart.instance = null;

  document.removeEventListener("mousemove", handleWidgetMouseMove);
  document.removeEventListener("mouseup", handleWidgetMouseUp);
}

function handleWidgetContextMenu(e: MouseEvent, widget: WidgetInstance) {
  if (isWiggleMode.value) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  clearSelection();
  contextMenuApp.value = null;
  contextMenuFolder.value = null;
  contextMenuSystemIcon.value = null;
  contextMenuWidget.value = widget;

  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
  };
}

const mainDockerApps = computed(() => desktopStore.desktopRootApps);

const systemDesktopIcons = computed(() => desktopStore.desktopRootSystemIcons);

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

  if (!selectedSystemIcons.value.has(icon.id)) {
    selectedSystemIcons.value.clear();
  } else {
    const isShortcut = !!icon.shortcut;
    for (const other of systemDesktopIcons.value) {
      if (selectedSystemIcons.value.has(other.id) && !!other.shortcut !== isShortcut) {
        selectedSystemIcons.value.delete(other.id);
      }
    }
  }

  selectedApp.value = null;
  selectedApps.value.clear();
  selectedFolder.value = null;
  selectedFolders.value.clear();
  selectedSystemIcon.value = icon.id;

  contextMenuApp.value = null;
  contextMenuFolder.value = null;
  contextMenuWidget.value = null;
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
    "homedock:logo": homedockIcon,
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

function setDraggedShortcuts(icon: SystemDesktopIcon) {
  if (!icon.shortcut) return;

  const allSelected = getAllSelectedItems();
  const draggableIds = allSelected.filter((item) => item.type === "app" || (item.type === "systemicon" && isShortcutIconId(item.id))).map((item) => item.id);
  const draggedIds = draggableIds.length > 0 ? draggableIds : [icon.id];
  desktopStore.setDraggedApps(draggedIds);
}

function startSystemIconDrag(icon: SystemDesktopIcon, clientX: number, clientY: number) {
  draggedSystemIcon.value = icon.id;
  composableStartDrag({ type: "systemicon", id: icon.id }, clientX, clientY);
  setDraggedShortcuts(icon);
  window.addEventListener("mousemove", handleSystemIconMouseMove);
  window.addEventListener("mouseup", handleSystemIconMouseUp);
}

function handleSystemIconMouseMove(e: MouseEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  updateDrag(e.clientX, e.clientY);

  if (hasMoved.value) {
    const draggedIcon = desktopStore.systemDesktopIcons.find((i) => i.id === draggedSystemIcon.value);
    if (draggedIcon?.shortcut) {
      const containerRect = containerRef.value?.getBoundingClientRect();
      if (containerRect) {
        const targetFolder = checkDropOnFolder(e.clientX - containerRect.left, e.clientY - containerRect.top);
        dropTargetFolderId.value = targetFolder?.id || null;
      }
    }
  }
}

function handleSystemIconMouseUp(e: MouseEvent) {
  if (!isDragging.value || !draggedSystemIcon.value) return;
  composableEndDrag();
  window.removeEventListener("mousemove", handleSystemIconMouseMove);
  window.removeEventListener("mouseup", handleSystemIconMouseUp);
  draggedSystemIcon.value = null;
  dropTargetFolderId.value = null;
  desktopStore.clearDraggedApps();
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

function isPortScanning(app: DockerApp): boolean {
  if (!app.ports || app.ports.length === 0) return false;
  if (app.ports.includes("disabled")) return true;
  if (app.ports.includes("hostmode")) return false;
  const unique = new Set(app.ports);
  return unique.size !== app.ports.length;
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

function isShortcutIconId(id: string): boolean {
  return desktopStore.systemDesktopIcons.find((i) => i.id === id)?.shortcut !== undefined;
}

function startDrag(app: DockerApp, clientX: number, clientY: number) {
  draggedApp.value = app.id;
  composableStartDrag({ type: "app", id: app.id }, clientX, clientY);

  const allSelected = getAllSelectedItems();
  const draggableIds = allSelected.filter((item) => item.type === "app" || (item.type === "systemicon" && isShortcutIconId(item.id))).map((item) => item.id);
  const draggedIds = draggableIds.length > 0 ? draggableIds : [app.id];
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
  if (contextMenuWidget.value) {
    const widget = contextMenuWidget.value;
    const def = getWidgetDefinition(widget.type);
    const items: ContextMenuItem[] = [];

    const sizeKeys = Object.keys(def?.sizes || {}) as WidgetSize[];
    if (sizeKeys.length > 1) {
      sizeKeys.forEach((sizeKey) => {
        items.push({
          label: sizeKey === "s" ? "Small" : sizeKey === "m" ? "Medium" : "Large",
          icon: widget.size === sizeKey ? checkIcon : resizeIcon,
          action: () => resizeWidget(widget, sizeKey),
          disabled: widget.size === sizeKey,
        });
      });
      items.push({ divider: true });
    }

    items.push({
      label: "Remove Widget",
      icon: monitorOffIcon,
      action: () => {
        widgetsStore.remove(widget.instanceId);
        closeContextMenu();
      },
    });

    return items;
  }

  const multiApps = mainDockerApps.value.filter((a) => selectedApps.value.has(a.id) && a.HDRole !== "dependency");
  const multiIcons = systemDesktopIcons.value.filter((i) => selectedSystemIcons.value.has(i.id));
  const multiFolders = displayedFolders.value.filter((f) => selectedFolders.value.has(f.id));
  const multiCount = multiApps.length + multiIcons.length + multiFolders.length;

  if ((contextMenuApp.value || contextMenuSystemIcon.value || contextMenuFolder.value) && multiCount > 1) {
    const multiShortcuts = multiIcons.filter((i) => i.shortcut);
    const multiRemovable = multiIcons.filter((i) => !i.shortcut && !i.isPermanent);

    const hasRunning = multiApps.some((a) => a.status === "running");
    const hasStopped = multiApps.some((a) => a.status === "exited");
    const hasPaused = multiApps.some((a) => a.status === "paused");

    const items: ContextMenuItem[] = [
      {
        label: multiApps.length === multiCount ? t("Selected: {n} apps", { n: multiCount }) : t("Selected: {n} items", { n: multiCount }),
        icon: checkIcon,
        action: () => {},
        disabled: true,
      },
    ];

    if (multiApps.length > 0) {
      items.push({ divider: true });
      items.push({
        label: "Start All",
        icon: playIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status !== "running") {
              await startContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasStopped,
      });
      items.push({
        label: "Stop All",
        icon: stopIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "running") {
              await stopContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      });
      items.push({
        label: "Restart All",
        icon: restartIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status !== "exited") {
              await restartContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: multiApps.every((a) => a.status === "exited"),
      });
      items.push({ divider: true });
      items.push({
        label: "Pause All",
        icon: pauseIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "running") {
              await pauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasRunning,
      });
      items.push({
        label: "Unpause All",
        icon: unpauseIcon,
        action: async () => {
          for (const app of multiApps) {
            if (app.status === "paused") {
              await unpauseContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
            }
          }
        },
        disabled: !hasPaused,
      });
      items.push({ divider: true });
      items.push({
        label: "Update All",
        icon: updateIcon,
        action: async () => {
          for (const app of multiApps) {
            await updateContainer(app, csrfToken.value, themeClasses.value.scopeSelector);
          }
        },
      });
    }

    if (multiRemovable.length > 0) {
      items.push({ divider: true });
      items.push({
        label: t("Remove from Desktop ({n})", { n: multiRemovable.length }),
        icon: monitorOffIcon,
        action: () => {
          for (const icon of multiRemovable) {
            desktopStore.removeSystemIconFromDesktop(icon.appId);
          }
          closeContextMenu();
        },
      });
    }

    if (multiShortcuts.length > 0) {
      items.push({ divider: true });
      items.push({
        label: t("Delete Shortcuts ({n})", { n: multiShortcuts.length }),
        icon: linkOffIcon,
        action: () => {
          confirm({
            title: "Delete Shortcuts",
            content: t("Delete {n} shortcuts?", { n: multiShortcuts.length }),
            okText: "Delete",
            cancelText: "Cancel",
            onOk: async () => {
              for (const icon of multiShortcuts) {
                await desktopStore.removeShortcut(icon.shortcut!.shortcutId, csrfToken.value);
              }
            },
          });
        },
      });
    }

    if (multiFolders.length > 0) {
      items.push({ divider: true });
      items.push({
        label: t("Delete Folders ({n})", { n: multiFolders.length }),
        icon: folderRemoveIcon,
        action: () => {
          const itemCount = multiFolders.reduce((total, folder) => total + folder.items.length, 0);
          const message = itemCount > 0 ? t("Delete {n} folders? {m} item(s) will be moved to desktop.", { n: multiFolders.length, m: itemCount }) : t("Delete {n} folders?", { n: multiFolders.length });

          confirm({
            title: "Delete Folders",
            content: message,
            okText: "Delete",
            cancelText: "Cancel",
            onOk: () => {
              for (const folder of multiFolders) {
                desktopStore.deleteFolder(folder.id);
              }
            },
          });
        },
      });
    }

    return items;
  }

  if (contextMenuSystemIcon.value) {
    const sysIcon = contextMenuSystemIcon.value;

    if (sysIcon.shortcut) {
      const shortcutId = sysIcon.shortcut.shortcutId;
      const isFileShortcut = sysIcon.shortcut.type === "file";

      return [
        {
          label: "Open",
          icon: openIcon,
          action: () => {
            desktopStore.openSystemApp(sysIcon.appId);
          },
        },
        { divider: true },
        ...(!isFileShortcut
          ? [
              {
                label: "Edit Shortcut",
                icon: pencilIcon,
                action: () => {
                  openShortcutModal(sysIcon);
                },
              },
              { divider: true },
            ]
          : []),
        {
          label: "Delete Shortcut",
          icon: linkOffIcon,
          action: () => {
            confirm({
              title: "Delete Shortcut",
              content: t(`Delete "{name}"?`, { name: sysIcon.name }),
              okText: "Delete",
              cancelText: "Cancel",
              onOk: async () => {
                await desktopStore.removeShortcut(shortcutId, csrfToken.value);
              },
            });
          },
        },
      ];
    }

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
        label: t("Update Apps ({n})", { n: folderApps.length }),
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
        const message = itemCount > 0 ? t(`Delete "{name}"? {n} app(s) will be moved to desktop.`, { name: folder.name, n: itemCount }) : t(`Delete "{name}"?`, { name: folder.name });

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
      {
        label: "New Shortcut",
        icon: linkPlusIcon,
        action: () => {
          openShortcutModal();
        },
      },
      {
        label: "Add Widget",
        icon: widgetsPlusIcon,
        action: () => {
          showWidgetGallery.value = true;
        },
      },
      ...(!isMobile.value
        ? [
            { divider: true },
            {
              label: "Quick View",
              icon: quickViewIcon,
              shortcut: shortcutLabel("↑"),
              action: () => {
                quickView.toggle();
              },
              disabled: !windowStore.appWindows.some((w) => !w.isMinimized && !w.isClosing) || windowStore.hasOpenDialog,
            },
          ]
        : []),
      { divider: true },
      {
        label: "Refresh",
        icon: refreshIcon,
        action: async () => {
          await fetchContainers(csrfToken.value);
        },
      },
      {
        label: t("Update All Apps ({n})", { n: totalApps }),
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
      {
        label: "Personalize",
        icon: paletteIcon,
        action: () => {
          const id = windowStore.openWindow("settings", { data: { tab: "theme" } });
          windowStore.updateWindowData(id, { tab: "theme" });
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
          desktopStore.launchDockerApp(contextMenuApp.value);
        }
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: isRunning ? "Stop" : t("Start", 2),
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
        windowStore.openUniqueWindow("logs", contextMenuApp.value.name, {
          title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - ${t("Logs")}`,
          data: { appName: contextMenuApp.value.name },
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
      windowStore.openUniqueWindow("properties", contextMenuApp.value.id, {
        title: `${contextMenuApp.value.display_name || contextMenuApp.value.name} - ${t("Properties")}`,
        data: { appId: contextMenuApp.value.id },
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
        content: t("Are you sure you want to uninstall {name}? This action cannot be undone.", { name: appToUninstall.display_name || appToUninstall.name }),
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
    desktopStore.launchDockerApp(app);
  } else {
    windowStore.openUniqueWindow("properties", app.id, {
      title: `${app.display_name || app.name} - ${t("Properties")}`,
      data: { appId: app.id },
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

  if (!selectedFolders.value.has(folder.id)) {
    selectedFolders.value.clear();
  }

  selectedApp.value = null;
  selectedApps.value.clear();
  selectedSystemIcon.value = null;
  selectedSystemIcons.value.clear();
  selectedFolder.value = folder.id;
  contextMenuApp.value = null;
  contextMenuWidget.value = null;
  contextMenuSystemIcon.value = null;
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

  contextMenuWidget.value = null;
  contextMenuFolder.value = null;
  contextMenuSystemIcon.value = null;
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
    contextMenuWidget.value = null;

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
  contextMenuWidget.value = null;
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
  },
);

watch(
  () => desktopGrid.itemsWithoutPosition.value.length,
  (count) => {
    if (count > 0) {
      initializeGridPositions();
    }
  },
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
      desktopStore.draggedAppIds.forEach((itemId) => {
        if (itemId.startsWith("shortcut-")) {
          desktopStore.addShortcutToFolder(itemId, targetFolder.id);
        } else {
          desktopStore.addAppToFolder(itemId, targetFolder.id);
        }
      });
    } else if (!targetFolder) {
      desktopStore.draggedAppIds.forEach((itemId) => {
        if (itemId.startsWith("shortcut-")) {
          desktopStore.removeShortcutFromFolder(itemId);
        } else {
          desktopStore.removeAppFromFolder(itemId);
        }
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
  },
);

onMounted(() => {
  calculateGridSettings();

  loadContainers();

  startContainerPolling(csrfToken.value, 5000);

  desktopStore.loadFolders();
  desktopStore.loadShortcuts(csrfToken.value);
  desktopStore.loadAppViewModes(csrfToken.value);
  desktopStore.loadCertificateTrust();
  widgetsStore.load();

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
  },
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

  if (widgetMoveRaf !== null) {
    cancelAnimationFrame(widgetMoveRaf);
    widgetMoveRaf = null;
  }
  document.removeEventListener("mousemove", handleWidgetMouseMove);
  document.removeEventListener("mouseup", handleWidgetMouseUp);
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
.corner-hint-fade-enter-active {
  transition:
    opacity 0.4s ease-out,
    transform 0.4s ease-out;
}

.corner-hint-fade-leave-active {
  transition:
    opacity 0.3s ease-in,
    transform 0.3s ease-in;
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
  transition:
    left 0.4s ease,
    top 0.4s ease,
    transform 0.4s ease;
}

/* Widgets position themselves via transform during drag — a transform-transitioning
   move-class would make TransitionGroup's FLIP clobber that inline transform every render */
.widget-move-none {
  transition: none !important;
}

/* Widget entry never animates opacity — a fading ancestor makes Chromium drop the
   backdrop-filter until the fade ends, so the blur would pop instead of ramping.
   The materialize effect is the frame's own blur(0)→full transition. */
.widget-appear-enter-active {
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.widget-appear-enter-from {
  transform: translateY(18px) scale(0.95);
}

.widget-appear-leave-active {
  transition: all 0.25s ease-in;
}

.widget-appear-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

/* Animations */
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

/* Icon Switch Transition (matches DesktopFolderIcon customize animation) */
.icon-switch-enter-active,
.icon-switch-leave-active {
  transition: all 0.2s ease;
}

.icon-switch-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-15deg);
}

.icon-switch-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(15deg);
}
</style>
