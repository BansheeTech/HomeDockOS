<!-- homedock-ui/vue3/static/js/__Components__/FileGraphic.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="file-graphic-box" :style="{ width: `${size}px`, height: `${size}px` }">
    <div :class="['file-graphic', size < SMALL_SIZE && 'file-graphic-small']" :style="{ '--file-color': kind.color, transform: size === BASE_SIZE ? undefined : `scale(${size / BASE_SIZE})` }">
      <div class="file-sheet">
        <div class="file-paper"></div>
        <div class="file-fold"></div>
        <Icon v-if="kind.glyph" :icon="kind.glyph" class="file-glyph" />
        <span v-if="label" class="file-label">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { Icon } from "@iconify/vue";

import { fileExtension, fileKindFor } from "../__Config__/FileIcons";

const BASE_SIZE = 64;
const SMALL_SIZE = 32;
const MAX_LABEL_LENGTH = 4;

const props = withDefaults(defineProps<{ name: string; size?: number }>(), {
  size: BASE_SIZE,
});

const kind = computed(() => fileKindFor(props.name));

const label = computed(() => {
  const extension = fileExtension(props.name);
  return extension && extension.length <= MAX_LABEL_LENGTH ? extension.toUpperCase() : "";
});
</script>

<style scoped>
.file-graphic-box {
  position: relative;
  flex-shrink: 0;
  pointer-events: none;
}

.file-graphic {
  position: absolute;
  top: 0;
  left: 0;
  width: 64px;
  height: 64px;
  transform-origin: top left;
}

.file-sheet {
  position: absolute;
  inset: 4px 10px;
  filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.25));
}

.file-paper {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: linear-gradient(180deg, #ffffff 0%, #eef0f3 100%);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  clip-path: polygon(0 0, calc(100% - 13px) 0, 100% 13px, 100% 100%, 0 100%);
}

.file-fold {
  position: absolute;
  top: 0;
  right: 0;
  width: 13px;
  height: 13px;
  border-bottom-left-radius: 3px;
  background: linear-gradient(45deg, #d5d9e0 0%, #c3c8d1 50%, transparent 50%);
}

.file-glyph {
  position: absolute;
  top: 15px;
  left: 50%;
  width: 22px;
  height: 22px;
  transform: translateX(-50%);
  color: var(--file-color);
}

.file-label {
  position: absolute;
  bottom: 5px;
  left: 4px;
  right: 4px;
  height: 11px;
  border-radius: 2px;
  background: var(--file-color);
  color: #ffffff;
  font-size: 7.5px;
  font-weight: 700;
  line-height: 11px;
  letter-spacing: 0.03em;
  text-align: center;
}

.file-graphic-small .file-sheet {
  filter: none;
}

.file-graphic-small .file-paper {
  box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--file-color) 25%, transparent);
}

.file-graphic-small .file-glyph {
  top: 18px;
  width: 30px;
  height: 30px;
}

.file-graphic-small .file-label {
  display: none;
}
</style>
