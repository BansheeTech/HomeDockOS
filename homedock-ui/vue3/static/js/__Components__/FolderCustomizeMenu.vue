<!-- homedock-ui/vue3/static/js/__Components__/FolderCustomizeMenu.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="customize-fade">
      <div v-if="visible" ref="menuRef" class="customize-menu" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuShadow]" :style="menuStyle" @click.stop @contextmenu.prevent>
        <div class="section-header" :class="[themeClasses.contextMenuText]">
          <span>Color</span>
        </div>
        <div class="color-palette">
          <div v-for="color in predefinedColors" :key="color" class="color-swatch" :class="{ selected: selectedColor === color }" :style="{ backgroundColor: color }" @click="selectColor(color)" :title="color">
            <Icon v-if="selectedColor === color" :icon="checkIcon" class="check-icon" />
          </div>
        </div>

        <div class="section-header mt-3" :class="[themeClasses.contextMenuText]">
          <span>Icon</span>
        </div>
        <div class="icon-palette">
          <div class="icon-swatch" :class="[themeClasses.contextMenuItemHover, { selected: !selectedIcon }]" @click="selectIcon('')" title="None">
            <Icon :icon="folderIcon" class="swatch-icon" :class="[themeClasses.contextMenuText]" />
          </div>
          <div v-for="iconOption in predefinedIcons" :key="iconOption.id" class="icon-swatch" :class="[themeClasses.contextMenuItemHover, { selected: selectedIcon === iconOption.id }]" @click="selectIcon(iconOption.id)" :title="iconOption.label">
            <Icon :icon="iconOption.icon" class="swatch-icon" :class="[themeClasses.contextMenuText]" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import checkIcon from "@iconify-icons/mdi/check";
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

interface Props {
  visible: boolean;
  x: number;
  y: number;
  color: string;
  icon: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:color": [value: string];
  "update:icon": [value: string];
  close: [];
}>();

const { themeClasses } = useTheme();

const menuRef = ref<HTMLElement | null>(null);
const adjustedPosition = ref({ x: 0, y: 0 });
const selectedColor = ref(props.color);
const selectedIcon = ref(props.icon);

const predefinedColors = ["#3b82f6", "#06b6d4", "#10b981", "#84cc16", "#eab308", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#a855f7", "#8b5cf6", "#6366f1", "#64748b", "#6b7280", "#78716c", "#000000"];

const predefinedIcons = [
  { id: "gamepad", icon: gamepadIcon, label: "Games" },
  { id: "movie", icon: movieIcon, label: "Movies" },
  { id: "music", icon: musicIcon, label: "Music" },
  { id: "code", icon: codeIcon, label: "Code" },
  { id: "cloud", icon: cloudIcon, label: "Cloud" },
  { id: "heart", icon: heartIcon, label: "Favorites" },
  { id: "star", icon: starIcon, label: "Important" },
  { id: "download", icon: downloadIcon, label: "Downloads" },
  { id: "cog", icon: cogIcon, label: "Settings" },
  { id: "image", icon: imageIcon, label: "Images" },
  { id: "file", icon: fileIcon, label: "Documents" },
  { id: "book", icon: bookIcon, label: "Books" },
  { id: "briefcase", icon: briefcaseIcon, label: "Work" },
  { id: "school", icon: schoolIcon, label: "School" },
  { id: "home", icon: homeIcon, label: "Home" },
  { id: "lock", icon: lockIcon, label: "Private" },
];

watch(
  () => props.color,
  (val) => {
    selectedColor.value = val;
  }
);
watch(
  () => props.icon,
  (val) => {
    selectedIcon.value = val;
  }
);

function adjustPosition() {
  if (!props.visible) return;

  nextTick(() => {
    if (!menuRef.value) return;

    const menuRect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = props.x;
    let y = props.y;

    if (x + menuRect.width > viewportWidth) {
      x = Math.max(10, viewportWidth - menuRect.width - 10);
    }
    x = Math.max(10, x);

    if (y + menuRect.height > viewportHeight) {
      y = Math.max(10, viewportHeight - menuRect.height - 10);
    }
    y = Math.max(10, y);

    adjustedPosition.value = { x, y };
  });
}

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedColor.value = props.color;
      selectedIcon.value = props.icon;
      adjustedPosition.value = { x: props.x, y: props.y };
      adjustPosition();
    }
  }
);

watch(
  () => [props.x, props.y],
  () => {
    if (props.visible) {
      adjustedPosition.value = { x: props.x, y: props.y };
      adjustPosition();
    }
  }
);

const menuStyle = computed(() => ({
  left: `${adjustedPosition.value.x}px`,
  top: `${adjustedPosition.value.y}px`,
}));

function selectColor(color: string) {
  selectedColor.value = color;
  emit("update:color", color);
}

function selectIcon(iconId: string) {
  selectedIcon.value = iconId;
  emit("update:icon", iconId);
}

function handleClickOutside(e: MouseEvent) {
  if (props.visible && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit("close");
  }
}

function handleEscKey(e: KeyboardEvent) {
  if (e.key === "Escape" && props.visible) {
    emit("close");
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleEscKey);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleEscKey);
});
</script>

<style scoped>
.customize-menu {
  position: fixed;
  z-index: 9999;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 8px;
  padding: 0.75rem;
  min-width: 220px;
  user-select: none;
}

.section-header {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.375rem;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-swatch:hover {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-swatch.selected {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}

.check-icon {
  width: 12px;
  height: 12px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

.icon-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;
}

.icon-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-swatch:hover {
  transform: scale(1.1);
}

.icon-swatch.selected {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.swatch-icon {
  width: 18px;
  height: 18px;
  opacity: 0.85;
}

.icon-swatch:hover .swatch-icon {
  opacity: 1;
}

/* Transitions */
.customize-fade-enter-active,
.customize-fade-leave-active {
  transition: all 0.15s ease;
}

.customize-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.customize-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
