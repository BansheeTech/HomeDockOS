<!-- homedock-ui/vue3/static/js/__Components__/FolderGraphic.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="folder-graphic-box" :style="{ width: `${size}px`, height: `${size}px` }">
    <div :class="['folder-graphic', open && 'folder-graphic-open', size < SMALL_SIZE && 'folder-graphic-small']" :style="{ '--folder-color': color || DEFAULT_FOLDER_COLOR, transform: size === BASE_SIZE ? undefined : `scale(${size / BASE_SIZE})` }">
      <div class="folder-back"></div>

      <div class="folder-papers">
        <slot />
      </div>

      <div class="folder-front">
        <Transition name="emblem-switch" mode="out-in">
          <span v-if="busy" key="busy" class="folder-emblem folder-busy">
            <Icon :icon="syncIcon" class="folder-busy-glyph" />
          </span>
          <Icon v-else-if="emblem" :key="emblemKey" :icon="emblem" class="folder-emblem" />
        </Transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Icon, type IconifyIcon } from "@iconify/vue";
import syncIcon from "@iconify-icons/mdi/sync";

const DEFAULT_FOLDER_COLOR = "#3b82f6";
const BASE_SIZE = 64;
const SMALL_SIZE = 32;

withDefaults(defineProps<{ color?: string; emblem?: IconifyIcon; emblemKey?: string; open?: boolean; busy?: boolean; size?: number }>(), {
  color: undefined,
  emblem: undefined,
  emblemKey: "emblem",
  open: false,
  busy: false,
  size: BASE_SIZE,
});
</script>

<style scoped>
.folder-graphic-box {
  position: relative;
  flex-shrink: 0;
  pointer-events: none;
  isolation: isolate;
}

.folder-graphic {
  position: absolute;
  top: 0;
  left: 0;
  width: 64px;
  height: 64px;
  transform-origin: top left;
}

.folder-back {
  position: absolute;
  inset: 12px 4px 8px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--folder-color) 78%, black);
}

.folder-back::before {
  content: "";
  position: absolute;
  top: -5px;
  left: 0;
  width: 24px;
  height: 12px;
  border-radius: 5px 7px 0 0;
  background: inherit;
}

.folder-papers {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: transform 0.2s ease-out;
}

.folder-front {
  position: absolute;
  inset: 22px 4px 8px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--folder-color) 80%, white) 0%, var(--folder-color) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 2px 5px rgba(0, 0, 0, 0.25);
  transform-origin: bottom center;
  transition: transform 0.2s ease-out;
}

.folder-emblem {
  width: 20px;
  height: 20px;
  color: color-mix(in srgb, var(--folder-color) 55%, black);
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.35));
}

.folder-busy {
  display: flex;
  align-items: center;
  justify-content: center;
}

.folder-busy-glyph {
  width: 100%;
  height: 100%;
  animation: folder-busy-spin 1.6s linear infinite;
}

@keyframes folder-busy-spin {
  to {
    transform: rotate(360deg);
  }
}

.folder-graphic-small .folder-emblem {
  width: 28px;
  height: 28px;
  filter: none;
}

.folder-graphic-small .folder-front {
  box-shadow: inset 0 2px 0 rgba(255, 255, 255, 0.35);
}

.folder-graphic-open .folder-front {
  transform: perspective(120px) rotateX(-22deg);
}

.folder-graphic-open .folder-papers {
  transform: translateY(-3px);
}

.emblem-switch-enter-active,
.emblem-switch-leave-active {
  transition: all 0.2s ease;
}

.emblem-switch-enter-from {
  opacity: 0;
  transform: scale(0.5) rotate(-15deg);
}

.emblem-switch-leave-to {
  opacity: 0;
  transform: scale(0.5) rotate(15deg);
}
</style>
