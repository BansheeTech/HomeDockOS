<!-- homedock-ui/vue3/static/js/__Components__/ContextMenu.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="context-menu-fade">
      <div v-if="visible" ref="menuRef" class="context-menu" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder, themeClasses.contextMenuShadow]" :style="menuStyle" @click.stop @contextmenu.prevent>
        <div v-for="(item, index) in items" :key="index" class="context-menu-item group" :class="[themeClasses.contextMenuItem, !item.disabled && !item.divider ? [themeClasses.contextMenuItemBgHover, themeClasses.contextMenuItemTextHover] : '', item.disabled ? themeClasses.contextMenuItemDisabled : '', { divider: item.divider }]" @click="handleItemClick(item)">
          <template v-if="!item.divider">
            <Icon v-if="item.icon" :icon="item.icon" width="16" height="16" class="item-icon" :class="[themeClasses.contextMenuIcon, themeClasses.contextMenuIconHover]" />
            <span class="item-label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="item-shortcut" :class="themeClasses.contextMenuShortcut">{{ item.shortcut }}</span>
          </template>
          <div v-else class="divider-line" :class="themeClasses.contextMenuDivider"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Icon } from "@iconify/vue";
import { useTheme } from "../__Themes__/ThemeSelector";

export interface ContextMenuItem {
  label?: string;
  icon?: any;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
  divider?: boolean;
}

interface Props {
  items: ContextMenuItem[];
  visible: boolean;
  x: number;
  y: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  itemClick: [item: ContextMenuItem];
}>();

const { themeClasses } = useTheme();

const menuRef = ref<HTMLElement | null>(null);
const adjustedPosition = ref({ x: 0, y: 0 });

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

function handleItemClick(item: ContextMenuItem) {
  if (item.disabled || item.divider) return;

  emit("itemClick", item);

  if (item.action) {
    item.action();
  }

  emit("close");
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
.context-menu {
  position: fixed;
  z-index: 9999;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border-radius: 8px;
  padding: 0.25rem;
  min-width: 200px;
  user-select: none;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s ease;
}

.context-menu-item.disabled {
  cursor: not-allowed;
}

.context-menu-item.divider {
  padding: 0.25rem 0;
  cursor: default;
}

.divider-line {
  height: 1px;
  margin: 0 0.5rem;
}

.item-icon {
  flex-shrink: 0;
}

.item-label {
  flex: 1;
}

.item-shortcut {
  font-size: 0.75rem;
  margin-left: auto;
}

/* Transitions */
.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition: all 0.15s ease;
}

.context-menu-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
