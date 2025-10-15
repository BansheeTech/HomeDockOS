<!-- homedock-ui/vue3/static/js/__Components__/ColorPickerMenu.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="color-picker-fade">
      <div v-if="visible" ref="menuRef" class="color-picker-menu" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuShadow]" :style="menuStyle" @click.stop @contextmenu.prevent>
        <div class="color-picker-header" :class="[themeClasses.contextMenuText]">
          <span class="header-text">Choose Color</span>
        </div>

        <div class="color-palette">
          <div v-for="color in predefinedColors" :key="color" class="color-swatch" :class="{ selected: modelValue === color }" :style="{ backgroundColor: color }" @click="selectColor(color)" :title="color">
            <Icon v-if="modelValue === color" :icon="checkIcon" class="check-icon" />
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

interface Props {
  visible: boolean;
  x: number;
  y: number;
  modelValue: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  close: [];
  apply: [color: string];
  cancel: [];
}>();

const { themeClasses } = useTheme();

const menuRef = ref<HTMLElement | null>(null);
const adjustedPosition = ref({ x: 0, y: 0 });

const predefinedColors = [
  "#3b82f6", // Blue (default)
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#84cc16", // Lime
  "#eab308", // Yellow
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
  "#a855f7", // Purple
  "#8b5cf6", // Violet
  "#6366f1", // Indigo
  "#64748b", // Slate
  "#6b7280", // Gray
  "#78716c", // Stone
  "#000000", // Black
];

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
  emit("update:modelValue", color);
  emit("apply", color);
  emit("close");
}

function handleClickOutside(e: MouseEvent) {
  if (props.visible && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit("cancel");
    emit("close");
  }
}

function handleEscKey(e: KeyboardEvent) {
  if (e.key === "Escape" && props.visible) {
    emit("cancel");
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
.color-picker-menu {
  position: fixed;
  z-index: 9999;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 8px;
  padding: 0.75rem;
  min-width: 240px;
  user-select: none;
}

.color-picker-header {
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-swatch:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.color-swatch.selected {
  border-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
}

.check-icon {
  width: 14px;
  height: 14px;
  color: white;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Transitions */
.color-picker-fade-enter-active,
.color-picker-fade-leave-active {
  transition: all 0.15s ease;
}

.color-picker-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.color-picker-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
