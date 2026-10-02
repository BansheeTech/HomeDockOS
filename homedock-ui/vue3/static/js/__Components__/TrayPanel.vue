<!-- homedock-ui/vue3/static/js/__Components__/TrayPanel.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="tray-panel">
      <div v-if="open" ref="panelRef" role="dialog" :aria-label="title" :class="[themeClasses.installDropdownBg, themeClasses.installDropdownBorder, themeClasses.installDropdownShadow]" class="tray-panel fixed z-[9999] flex flex-col overflow-hidden rounded-2xl border select-none" :style="{ '--tray-panel-width': `${width}px` }">
        <header class="flex items-center gap-2.5 px-3.5 pt-3.5 pb-2.5 flex-shrink-0">
          <AppIconGraphic v-if="icon" :icon="icon" :color="iconColor" :size="28" :class="iconSpin && 'tile-busy'" />
          <div class="flex-1 min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold leading-tight truncate">{{ title }}</p>
            <p v-if="subtitle" :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[11px] leading-tight truncate">{{ subtitle }}</p>
          </div>
          <slot name="accessory" />
        </header>

        <div class="tray-panel-body flex-1 min-h-0 overflow-y-auto px-2 pb-2">
          <slot />
        </div>

        <Transition :css="false" @enter="expandEnter" @leave="(el: Element, done: () => void) => collapseLeave(el, done)">
          <footer v-if="$slots.footer" class="flex-shrink-0 px-3.5 pb-3.5 pt-1">
            <slot name="footer" />
          </footer>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref, watch } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { expandEnter, collapseLeave } from "../__Utils__/collapseLeave";

import type { IconifyIcon } from "@iconify/vue";

import AppIconGraphic from "./AppIconGraphic.vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    anchor?: HTMLElement | null;
    title: string;
    subtitle?: string;
    icon?: IconifyIcon;
    iconColor?: string;
    iconSpin?: boolean;
    width?: number;
  }>(),
  {
    anchor: null,
    subtitle: undefined,
    icon: undefined,
    iconColor: "#3b82f6",
    iconSpin: false,
    width: 320,
  },
);

const emit = defineEmits<{
  close: [];
}>();

const { themeClasses } = useTheme();

const panelRef = ref<HTMLElement | null>(null);

function onPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (!target) return;
  if (panelRef.value?.contains(target)) return;
  if (props.anchor?.contains(target)) return;
  emit("close");
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") emit("close");
}

function listen(active: boolean) {
  if (active) {
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
  } else {
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown);
  }
}

watch(
  () => props.open,
  (open) => listen(open),
  { immediate: true },
);

onBeforeUnmount(() => {
  listen(false);
  if (props.open) emit("close");
});

defineExpose({ panelRef });
</script>

<style scoped>
.tile-busy :deep(.app-icon-glyph) {
  animation: spin 1s linear infinite;
}

.tray-panel {
  right: 0.75rem;
  bottom: 4rem;
  width: min(var(--tray-panel-width), calc(100vw - 1.5rem));
  max-height: calc(100vh - 5.5rem);
  max-height: calc(100dvh - 5.5rem);
  transform-origin: bottom right;
}

.tray-panel-body {
  scrollbar-width: thin;
}

.tray-panel-enter-active {
  transition:
    opacity 0.18s ease,
    transform 0.22s cubic-bezier(0.32, 0.72, 0, 1);
}

.tray-panel-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.tray-panel-enter-from,
.tray-panel-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}
</style>
