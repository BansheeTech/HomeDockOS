<!-- homedock-ui/vue3/static/js/__Components__/EnterpriseStartMenuSlots.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-for="module in startMenuModules" :key="module.name" class="contents" @contextmenu.stop.prevent="handleContextMenu($event, module)" @touchstart.passive="handleTouchStart($event, module)" @touchend="handleTouchEnd" @touchmove="handleTouchMove">
    <EnterpriseSlotRenderer :module="module.name" @close-menu="$emit('close-menu')" @open-window="(type: string, opts: Record<string, unknown>) => $emit('open-window', type, opts)" />
  </div>

  <ContextMenu :visible="contextMenu.visible" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenuItems" @close="closeContextMenu" />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";
import EnterpriseSlotRenderer from "./EnterpriseSlotRenderer.vue";
import ContextMenu, { type ContextMenuItem } from "./ContextMenu.vue";
import { useDesktopStore } from "../__Stores__/desktopStore";

import monitorPlusIcon from "@iconify-icons/mdi/monitor-cellphone-star";
import closeIcon from "@iconify-icons/mdi/close";

defineEmits<{
  (e: "close-menu"): void;
  (e: "open-window", windowType: string, options: any): void;
}>();

const desktopStore = useDesktopStore();

interface EnterpriseModuleWithEntry {
  name: string;
  entry: {
    slot?: string;
    order?: number;
    desktopMeta?: {
      id: string;
      moduleName: string;
      displayName: string;
      icon: any;
    };
  };
}

const startMenuModules = ref<EnterpriseModuleWithEntry[]>([]);

function loadModules(): void {
  if (!EnterpriseSRILoader.isReady()) {
    setTimeout(loadModules, 100);
    return;
  }

  startMenuModules.value = EnterpriseSRILoader.getModulesBySlot("startMenu") as EnterpriseModuleWithEntry[];
}

onMounted(() => {
  loadModules();
});

const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});
const contextMenuModule = ref<EnterpriseModuleWithEntry | null>(null);

const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const LONG_PRESS_DURATION = 500;

function handleContextMenu(event: MouseEvent, module: EnterpriseModuleWithEntry) {
  const meta = module.entry.desktopMeta;
  if (!meta || desktopStore.isSystemIconOnDesktop(meta.id)) {
    return;
  }

  contextMenuModule.value = module;
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
  };
}

function handleTouchStart(event: TouchEvent, module: EnterpriseModuleWithEntry) {
  const meta = module.entry.desktopMeta;
  if (!meta || desktopStore.isSystemIconOnDesktop(meta.id)) {
    return;
  }

  const touch = event.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;

  longPressTimer.value = setTimeout(() => {
    contextMenuModule.value = module;
    contextMenu.value = {
      visible: true,
      x: touchX,
      y: touchY,
    };
  }, LONG_PRESS_DURATION);
}

function handleTouchEnd() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}

function handleTouchMove() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}

function closeContextMenu() {
  contextMenu.value.visible = false;
  contextMenuModule.value = null;
}

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const module = contextMenuModule.value;
  if (!module?.entry.desktopMeta) return [];

  const meta = module.entry.desktopMeta;
  const items: ContextMenuItem[] = [];
  const isOnDesktop = desktopStore.isSystemIconOnDesktop(meta.id);

  if (!isOnDesktop) {
    items.push({
      label: "Add to Desktop",
      icon: monitorPlusIcon,
      action: () => {
        desktopStore.addSystemIconToDesktop(meta.id, meta.displayName, meta.icon, meta.moduleName);
        closeContextMenu();
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: "Dismiss",
    icon: closeIcon,
    action: () => {
      closeContextMenu();
    },
  });

  return items;
});
</script>
