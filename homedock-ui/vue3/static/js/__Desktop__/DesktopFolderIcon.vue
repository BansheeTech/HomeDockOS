<!-- homedock-ui/vue3/static/js/__Desktop__/DesktopFolderIcon.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['desktop-folder group flex flex-col items-center gap-1 cursor-pointer px-3 py-1.5 md:p-3 rounded-lg w-[100px] z-[1] touch-none select-none outline-none border', !isSelected && ['border-transparent', 'shadow-[0_0_0_1px_transparent]'], isSelected && [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected, themeClasses.desktopIconShadowSelected], isDragging && 'opacity-70 !cursor-grabbing !z-[1000] !transition-none', itemAdded && 'folder-bounce', isWiggleMode && 'icon-wiggle', isDropTarget && 'folder-drop-target']" :style="getStyle" @mousedown="handleMouseDown" @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @click="handleClick" @dblclick="handleDoubleClick" @contextmenu="handleContextMenu">
    <div :class="['folder-container relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-visible pointer-events-none border', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerScaleHover, !isSelected && ['border-transparent', themeClasses.desktopIconContainerBgHover], isSelected && [themeClasses.desktopIconContainerBgSelected, themeClasses.desktopIconContainerBorderSelected]]" :style="{ backgroundColor: folder.color }">
      <div v-if="itemCount > 0" class="folder-papers-stack">
        <BaseImage v-for="(item, index) in previewItems" :key="item.id" :src="item.image_path" class="folder-paper-icon" :class="`paper-icon-${index}`" alt="" draggable="false" />
      </div>

      <Transition name="icon-switch" mode="out-in">
        <Icon :key="folder.icon || 'default'" :icon="displayIcon" :class="['w-10 h-10 pointer-events-none absolute inset-0 m-auto z-10', themeClasses.folderIconColor, themeClasses.folderIconShadow]" />
      </Transition>

      <Transition name="loading-indicator-fade">
        <div v-if="hasProcessingApps" :class="['absolute -top-2 -left-2 w-5 h-5 flex items-center justify-center rounded-full z-[20] pointer-events-none shadow-lg', themeClasses.folderLoadingBg]">
          <div :class="['w-3 h-3 rounded-full border-[2px] animate-spin', themeClasses.folderLoadingSpinner, themeClasses.folderLoadingSpinnerTop]"></div>
        </div>
      </Transition>

      <Transition name="badge-pop">
        <div v-if="itemCount > 0" :key="itemCount" :class="['absolute bottom-1 right-1 min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-[10px] text-[0.65rem] font-semibold z-[20] pointer-events-none', themeClasses.folderBadgeBg, themeClasses.folderBadgeText, themeClasses.folderBadgeBorder, themeClasses.folderBadgeShadow]">{{ itemCount }}</div>
      </Transition>
    </div>
    <span class="folder-name" :class="[themeClasses.desktopIconText]">{{ folder.name }}</span>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, type CSSProperties } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { useResponsive } from "../__Composables__/useResponsive";

import { useDesktopStore, type DesktopFolder } from "../__Stores__/desktopStore";

import BaseImage from "../__Components__/BaseImage.vue";

import { Icon } from "@iconify/vue";
import folderIcon from "@iconify-icons/mdi/folder";
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

const iconMap: Record<string, typeof folderIcon> = {
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

const displayIcon = computed(() => {
  if (props.folder.icon && iconMap[props.folder.icon]) {
    return iconMap[props.folder.icon];
  }
  return folderIcon;
});

const previewItems = computed(() => {
  const apps = props.folder.items.map((appId) => desktopStore.dockerApps.find((app) => app.id === appId)).filter((app) => app !== undefined); // Filtrar undefined
  return apps.slice(0, 4);
});

const hasProcessingApps = computed(() => {
  return props.folder.items.some((appId) => {
    const app = desktopStore.dockerApps.find((a) => a.id === appId);
    return app?.isProcessing === true;
  });
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
  transition: left 0.4s ease, top 0.4s ease, background 0.15s ease, transform 0.2s ease, border-color 0s, box-shadow 0s;
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
  transform: scale(1.05) rotate(6deg);
  transition: transform 0.15s ease-out;
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
  transition: background 0.15s ease, transform 0.2s ease, border-color 0s;
}

.desktop-folder:hover .folder-container {
  transform: scale(1.05);
}

.folder-papers-stack {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  pointer-events: none;
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

.paper-icon-0 {
  top: 10px;
  left: 12px;
  transform: translateY(-2px) rotate(-5deg);
  z-index: 4;
  animation: paper-appear 0.4s ease-out 0.05s both;
}

.paper-icon-1 {
  top: 8px;
  left: 20px;
  transform: translateY(-4px) rotate(3deg);
  z-index: 3;
  animation: paper-appear 0.4s ease-out 0.1s both;
}

.paper-icon-2 {
  top: 9px;
  left: 28px;
  transform: translateY(-3px) rotate(-2deg);
  z-index: 2;
  animation: paper-appear 0.4s ease-out 0.15s both;
}

.paper-icon-3 {
  top: 11px;
  left: 36px;
  transform: translateY(-1px) rotate(4deg);
  z-index: 1;
  animation: paper-appear 0.4s ease-out 0.2s both;
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
  line-height: 1.25rem;
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

/* Loading Indicator Fade Transition */
.loading-indicator-fade-enter-active,
.loading-indicator-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.loading-indicator-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.loading-indicator-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* Icon Switch Transition */
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
