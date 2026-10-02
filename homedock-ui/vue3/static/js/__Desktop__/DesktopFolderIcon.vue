<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopFolderIcon.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['desktop-folder group flex flex-col items-center justify-center gap-0.5 md:gap-1 cursor-pointer px-3 md:p-3 rounded-lg w-[100px] z-[1] select-none outline-none border', isMobile ? (isWiggleMode ? 'touch-none' : 'touch-pan-x') : 'touch-none', !isSelected && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], isSelected && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && 'opacity-70 !cursor-grabbing !z-[1000] !transition-none', itemAdded && 'folder-bounce', isWiggleMode && 'icon-wiggle', isDropTarget && 'folder-drop-target']" :style="getStyle" @mousedown="handleMouseDown" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @click="handleClick" @dblclick="handleDoubleClick" @contextmenu="handleContextMenu">
    <div class="folder-container relative w-16 h-16 shrink-0 pointer-events-none">
      <FolderGraphic :color="folder.color" :emblem="emblemIcon" :emblem-key="folder.icon" :open="isDropTarget" :busy="!!processingApp">
        <template v-for="item in papers" :key="item.id">
          <BaseImage v-if="item.imageSrc" :src="item.imageSrc" class="folder-paper-icon" :class="item.paperClass" alt="" draggable="false" />
          <AppIconGraphic v-else-if="item.appImage" :image-src="item.appImage" :size="18" class="folder-paper-app" :class="item.paperClass" />
          <AppIconGraphic v-else-if="item.appIcon" :icon="item.appIcon" :color="item.appColor" :size="18" class="folder-paper-app" :class="item.paperClass" />
          <ShortcutGraphic v-else-if="item.shortcut" :shortcut="item.shortcut" :size="18" class="folder-paper-app" :class="item.paperClass" />
          <div v-else class="folder-paper-icon folder-paper-preset" :class="item.paperClass">
            <Icon :icon="item.presetIcon" class="folder-paper-preset-icon" />
          </div>
        </template>
        <Transition name="paper-swap">
          <AppIconGraphic v-if="processingApp" :key="processingApp.id" :image-src="processingApp.image_path" :size="28" class="folder-paper-app folder-paper-processing" />
        </Transition>
      </FolderGraphic>

      <Transition name="badge-pop">
        <div v-if="itemCount > 0" :key="itemCount" :class="['absolute bottom-0 -right-0.5 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-[10px] text-[0.65rem] font-semibold z-[20] pointer-events-none', themeClasses.folderBadgeBg, themeClasses.folderBadgeText, themeClasses.folderBadgeBorder, themeClasses.folderBadgeShadow]">{{ itemCount }}</div>
      </Transition>
    </div>
    <span class="folder-name" :class="[themeClasses.desktopIconText]"><UpdatedDot :visible="hasUpdatedApps" />{{ folder.name }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, ref, watch, type CSSProperties } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { useResponsive } from "../__Composables__/useResponsive";

import { useDesktopStore, type DesktopFolder, type ShortcutData } from "../__Stores__/desktopStore";

import BaseImage from "../__Components__/BaseImage.vue";
import FolderGraphic from "../__Components__/FolderGraphic.vue";
import AppIconGraphic from "../__Components__/AppIconGraphic.vue";
import ShortcutGraphic from "../__Components__/ShortcutGraphic.vue";
import UpdatedDot from "../__Components__/UpdatedDot.vue";

import { getShortcutPresetIcon, getShortcutIconUrl } from "../__Config__/ShortcutIcons";
import { getAppById } from "../__Config__/WindowDefaultDetails";

import { Icon } from "@iconify/vue";
import gamepadIcon from "@iconify-icons/mdi/gamepad-variant";
import movieIcon from "@iconify-icons/mdi/movie";
import musicIcon from "@iconify-icons/mdi/music";
import codeIcon from "@iconify-icons/mdi/code-braces";
import cloudIcon from "@iconify-icons/mdi/cloud";
import heartIcon from "@iconify-icons/mdi/heart";
import starIcon from "@iconify-icons/mdi/star";
import downloadIcon from "@iconify-icons/mdi/download";
import cogIcon from "@iconify-icons/mdi/cog";
import imageIcon from "@iconify-icons/mdi/image";
import fileIcon from "@iconify-icons/mdi/file-document";
import bookIcon from "@iconify-icons/mdi/book";
import briefcaseIcon from "@iconify-icons/mdi/briefcase";
import schoolIcon from "@iconify-icons/mdi/school";
import homeIcon from "@iconify-icons/mdi/home";
import lockIcon from "@iconify-icons/mdi/lock";

const iconMap: Record<string, typeof gamepadIcon> = {
  gamepad: gamepadIcon,
  movie: movieIcon,
  music: musicIcon,
  code: codeIcon,
  cloud: cloudIcon,
  heart: heartIcon,
  star: starIcon,
  download: downloadIcon,
  cog: cogIcon,
  image: imageIcon,
  file: fileIcon,
  book: bookIcon,
  briefcase: briefcaseIcon,
  school: schoolIcon,
  home: homeIcon,
  lock: lockIcon,
};

interface Props {
  folder: DesktopFolder;
  isSelected?: boolean;
  isDragging?: boolean;
  isWiggleMode?: boolean;
  isDropTarget?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  isDragging: false,
  isWiggleMode: false,
  isDropTarget: false,
});

const emit = defineEmits<{
  mousedown: [e: MouseEvent, folder: DesktopFolder];
  touchstart: [e: TouchEvent, folder: DesktopFolder];
  touchmove: [e: TouchEvent, folder: DesktopFolder];
  touchend: [e: TouchEvent, folder: DesktopFolder];
  click: [folder: DesktopFolder, e: MouseEvent];
  dblclick: [folder: DesktopFolder];
  contextmenu: [e: MouseEvent, folder: DesktopFolder];
}>();

const { themeClasses } = useTheme();
const { isMobile } = useResponsive();
const desktopStore = useDesktopStore();

const itemAdded = ref(false);

const itemCount = computed(() => props.folder.items.length);

const emblemIcon = computed(() => (props.folder.icon ? iconMap[props.folder.icon] : undefined));

const folderItems = computed(() => {
  const items: Array<{ id: string; imageSrc?: string; appImage?: string; presetIcon?: any; appIcon?: any; appColor?: string; shortcut?: ShortcutData }> = [];

  props.folder.items.forEach((itemId) => {
    const icon = desktopStore.systemDesktopIcons.find((i) => i.id === itemId);

    if (icon?.shortcut?.type === "file") {
      items.push({ id: itemId, shortcut: icon.shortcut });
    } else if (icon?.shortcut) {
      if (icon.shortcut.iconType === "image") {
        items.push({ id: itemId, imageSrc: getShortcutIconUrl(icon.shortcut.iconValue) });
      } else {
        items.push({ id: itemId, presetIcon: getShortcutPresetIcon(icon.shortcut.iconValue) });
      }
    } else if (icon) {
      const app = getAppById(icon.appId);
      items.push({ id: itemId, appIcon: app?.icon ?? icon.icon, appColor: app?.color });
    } else {
      const app = desktopStore.dockerApps.find((a) => a.id === itemId);
      if (app) {
        items.push({ id: itemId, appImage: app.image_path });
      }
    }
  });

  return items;
});

const MIN_FOCUS_MS = 1800;

const focusedAppId = ref<string | null>(null);
let focusedSince = 0;
let focusTimer: ReturnType<typeof setTimeout> | undefined;

const hasUpdatedApps = computed(() => props.folder.items.some((itemId) => desktopStore.dockerApps.find((a) => a.id === itemId)?.recently_updated === true));

const processingIds = computed(() => props.folder.items.filter((itemId) => desktopStore.dockerApps.find((a) => a.id === itemId)?.isProcessing === true));

function syncFocus() {
  clearTimeout(focusTimer);
  focusTimer = undefined;

  const current = focusedAppId.value;
  const ids = processingIds.value;

  if (current && ids.includes(current)) return;

  const next = ids[0] ?? null;
  if (next === current) return;

  const remaining = current ? MIN_FOCUS_MS - (Date.now() - focusedSince) : 0;
  if (remaining > 0) {
    focusTimer = setTimeout(syncFocus, remaining);
    return;
  }

  focusedAppId.value = next;
  focusedSince = Date.now();
}

watch(processingIds, syncFocus, { immediate: true });

onBeforeUnmount(() => clearTimeout(focusTimer));

const processingApp = computed(() => (focusedAppId.value ? desktopStore.dockerApps.find((a) => a.id === focusedAppId.value) : undefined));

const papers = computed(() => {
  const app = processingApp.value;

  if (!app) {
    return folderItems.value.slice(0, 4).map((item, index) => ({ ...item, paperClass: `paper-icon-${index}` }));
  }

  return folderItems.value
    .filter((item) => item.id !== app.id)
    .slice(0, 2)
    .map((item, index) => ({ ...item, paperClass: `paper-side-${index}` }));
});

const getStyle = computed<CSSProperties>(() => {
  let GRID_SIZE_X = 110;
  let GRID_SIZE_Y = 125;
  let ICON_PADDING = 16;
  let width: string | undefined;

  if (isMobile.value) {
    const containerWidth = window.innerWidth;
    const MOBILE_COLS = 4;
    const MOBILE_PADDING = 16;
    const availableWidth = containerWidth - MOBILE_PADDING * 2;
    const calculatedGridSizeX = Math.floor(availableWidth / MOBILE_COLS);

    GRID_SIZE_X = calculatedGridSizeX;
    GRID_SIZE_Y = calculatedGridSizeX + 15;
    ICON_PADDING = MOBILE_PADDING;
    width = `${GRID_SIZE_X}px`;
  }

  if (props.folder.x !== undefined && props.folder.y !== undefined) {
    return {
      position: "absolute" as const,
      left: `${props.folder.x}px`,
      top: `${props.folder.y}px`,
      ...(width && { width }),
    };
  }

  if (props.folder.gridRow !== undefined && props.folder.gridCol !== undefined) {
    return {
      position: "absolute" as const,
      left: `${ICON_PADDING + props.folder.gridCol * GRID_SIZE_X}px`,
      top: `${ICON_PADDING + props.folder.gridRow * GRID_SIZE_Y}px`,
      ...(width && { width }),
    };
  }

  return {
    position: "absolute" as const,
    opacity: "0",
    pointerEvents: "none" as const,
    left: "0",
    top: "0",
    ...(width && { width }),
  };
});

watch(itemCount, (newCount, oldCount) => {
  if (oldCount !== undefined && newCount > oldCount) {
    itemAdded.value = true;
    setTimeout(() => {
      itemAdded.value = false;
    }, 600);
  }
});

function handleMouseDown(e: MouseEvent) {
  emit("mousedown", e, props.folder);
}

function handleTouchStart(e: TouchEvent) {
  emit("touchstart", e, props.folder);
}

function handleTouchMove(e: TouchEvent) {
  emit("touchmove", e, props.folder);
}

function handleTouchEnd(e: TouchEvent) {
  emit("touchend", e, props.folder);
}

function handleClick(e: MouseEvent) {
  emit("click", props.folder, e);
}

function handleDoubleClick() {
  emit("dblclick", props.folder);
}

function handleContextMenu(e: MouseEvent) {
  emit("contextmenu", e, props.folder);
}
</script>

<style scoped>
.desktop-folder {
  transition:
    left 0.4s ease,
    top 0.4s ease,
    background 0.15s ease,
    transform 0.2s ease,
    border-color 0s,
    box-shadow 0s;
}

.desktop-folder:hover {
  transform: translateY(-2px);
}

.desktop-folder.dragging {
  transition: none;
}

.desktop-folder:active {
  cursor: grabbing;
}

/* Drop target */
.folder-drop-target .folder-container {
  transform: scale(1.08);
}

/* Bounce animation */
.folder-bounce {
  animation: folder-bounce-animation 0.6s cubic-bezier(0.36, 0, 0.66, -0.56);
}

@keyframes folder-bounce-animation {
  0% {
    transform: scale(1) translateY(0);
  }
  25% {
    transform: scale(1.1) translateY(-8px);
  }
  50% {
    transform: scale(0.95) translateY(0);
  }
  75% {
    transform: scale(1.05) translateY(-4px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.folder-container {
  transition: transform 0.2s ease;
}

.desktop-folder:hover .folder-container {
  transform: scale(1.05);
}

.folder-container .folder-paper-app {
  position: absolute;
  transition: all 0.3s ease;
}

.folder-paper-icon {
  position: absolute;
  width: 18px;
  height: 18px;
  object-fit: contain;
  border-radius: 3px;
  opacity: 1;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.folder-paper-preset {
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-paper-preset-icon {
  width: 12px;
  height: 12px;
  color: rgba(55, 65, 81, 0.9);
}

.paper-icon-0 {
  top: 10px;
  left: 12px;
  transform: translateY(-2px) rotate(-5deg);
  z-index: 4;
  animation: paper-appear 0.4s ease-out 0.05s backwards;
}

.paper-icon-1 {
  top: 8px;
  left: 20px;
  transform: translateY(-4px) rotate(3deg);
  z-index: 3;
  animation: paper-appear 0.4s ease-out 0.1s backwards;
}

.paper-icon-2 {
  top: 9px;
  left: 28px;
  transform: translateY(-3px) rotate(-2deg);
  z-index: 2;
  animation: paper-appear 0.4s ease-out 0.15s backwards;
}

.paper-icon-3 {
  top: 11px;
  left: 36px;
  transform: translateY(-1px) rotate(4deg);
  z-index: 1;
  animation: paper-appear 0.4s ease-out 0.2s backwards;
}

.folder-container .folder-paper-processing {
  top: -2px;
  left: 18px;
  z-index: 4;
  animation:
    paper-rise 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) both,
    paper-bob 1.6s ease-in-out 0.4s infinite;
}

@keyframes paper-bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.paper-side-0 {
  top: 5px;
  left: 7px;
  transform: rotate(-10deg);
  z-index: 2;
  animation: paper-appear 0.4s ease-out 0.1s backwards;
}

.paper-side-1 {
  top: 5px;
  left: 39px;
  transform: rotate(10deg);
  z-index: 2;
  animation: paper-appear 0.4s ease-out 0.15s backwards;
}

.folder-container .paper-swap-leave-active {
  z-index: 3;
  animation: paper-sink 0.3s ease-in both;
}

@keyframes paper-sink {
  to {
    opacity: 0;
    transform: translateY(16px) scale(0.6);
  }
}

@keyframes paper-rise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.6);
  }
  to {
    opacity: 1;
  }
}

@keyframes paper-appear {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.5) rotate(15deg);
  }
  to {
    opacity: 1;
  }
}

/* Badge Pop Animation */
.badge-pop-enter-active {
  animation: badge-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.badge-pop-leave-active {
  animation: badge-pop 0.3s reverse;
}

@keyframes badge-pop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Folder Name */
.folder-name {
  font-size: 0.75rem;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 500;
  line-height: 1.125rem;
}

@media (min-width: 768px) {
  .folder-name {
    line-height: 1.25rem;
  }
}

/* Wiggle Animation */
.icon-wiggle {
  animation: wiggle-animation 0.4s ease-in-out infinite alternate;
}

@keyframes wiggle-animation {
  0% {
    transform: rotate(-1deg) translateY(0);
  }
  25% {
    transform: rotate(1deg) translateY(-1px);
  }
  50% {
    transform: rotate(-1.5deg) translateY(0);
  }
  75% {
    transform: rotate(1.5deg) translateY(-1px);
  }
  100% {
    transform: rotate(-1deg) translateY(0);
  }
}
</style>
