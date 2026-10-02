<!-- homedock-ui/vue3/static/js/__Components__/AppIconGraphic.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="['app-icon', !fluid && size < SMALL_SIZE && 'app-icon-small', status && `app-icon-${status}`]" :style="{ width: fluid ? '100%' : `${size}px`, height: fluid ? '100%' : `${size}px`, '--app-color': color || DEFAULT_APP_COLOR }">
    <template v-if="imageSrc">
      <span class="app-icon-clip">
        <span v-if="transparent" class="app-icon-backdrop" :style="{ '--backdrop-blur': `${backdropBlur}px` }" aria-hidden="true">
          <BaseImage :src="imageSrc" alt="" class="app-icon-backdrop-image" draggable="false" />
        </span>
        <BaseImage :src="imageSrc" alt="" :class="['app-icon-image', transparent && 'app-icon-image-inset']" :style="artworkStyle" draggable="false" @load="onImageLoad" />
      </span>
      <span class="app-icon-rim"></span>
    </template>
    <span v-else class="app-icon-tile">
      <slot name="glyph">
        <Icon :icon="icon || defaultAppIcon" :width="glyphSize" :height="glyphSize" class="app-icon-glyph" :style="glyphColor ? { color: glyphColor } : undefined" />
      </slot>
    </span>
    <slot />
  </div>
</template>

<script lang="ts">
import type { ArtworkPlacement } from "../__Utils__/AppIconArtwork";

const placementCache = new Map<string, ArtworkPlacement | null>();
</script>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";

import { measureArtwork, DEFAULT_APP_COLOR, OPAQUE_FORMATS } from "../__Utils__/AppIconArtwork";

import { Icon } from "@iconify/vue";
import defaultAppIcon from "@iconify-icons/mdi/application";

import BaseImage from "./BaseImage.vue";

const SMALL_SIZE = 28;
const GLYPH_RATIO = 0.58;
const SMALL_GLYPH_RATIO = 0.68;

const props = withDefaults(defineProps<{ icon?: any; color?: string; glyphColor?: string; imageSrc?: string; status?: string; size?: number; fluid?: boolean }>(), {
  icon: undefined,
  color: undefined,
  glyphColor: undefined,
  imageSrc: undefined,
  status: undefined,
  size: 48,
  fluid: false,
});

const glyphSize = computed(() => Math.round(props.size * (props.size < SMALL_SIZE ? SMALL_GLYPH_RATIO : GLYPH_RATIO)));

const placement = ref<ArtworkPlacement | null>(null);
const transparent = computed(() => placement.value !== null);

const backdropBlur = computed(() => (props.fluid ? 16 : Math.max(4, Math.round(props.size * 0.3))));

const artworkStyle = computed(() => {
  const value = placement.value;
  return value ? { transform: `translate(${value.x}%, ${value.y}%) scale(${value.scale})` } : undefined;
});

watch(
  () => props.imageSrc,
  (src) => {
    placement.value = src ? (placementCache.get(src) ?? null) : null;
  },
  { immediate: true },
);

function onImageLoad(event: Event) {
  const src = props.imageSrc;
  if (!src || OPAQUE_FORMATS.test(src)) return;

  if (placementCache.has(src)) {
    placement.value = placementCache.get(src) ?? null;
    return;
  }

  let result: ArtworkPlacement | null = null;
  try {
    result = measureArtwork(event.target as HTMLImageElement);
  } catch {
    result = null;
  }

  placementCache.set(src, result);
  if (props.imageSrc === src) placement.value = result;
}
</script>

<style scoped>
.app-icon {
  position: relative;
  flex-shrink: 0;
  border-radius: 22.5%;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.18),
    0 3px 8px rgba(0, 0, 0, 0.14);
  transition:
    filter 0.5s ease,
    opacity 0.5s ease;
}

.app-icon-paused {
  filter: brightness(0.5) grayscale(0) sepia(0);
  opacity: 0.75;
}

.app-icon-exited {
  filter: brightness(0.5) grayscale(1) sepia(0);
  opacity: 0.75;
}

.app-icon-created {
  filter: brightness(0.5) grayscale(0) sepia(1);
  opacity: 0.5;
}

.app-icon-tile {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background: linear-gradient(180deg, color-mix(in srgb, var(--app-color) 72%, white) 0%, var(--app-color) 55%, color-mix(in srgb, var(--app-color) 82%, black) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
}

.app-icon-glyph {
  color: #ffffff;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
}

.app-icon-clip {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  -webkit-clip-path: inset(0 round 22.5%);
  clip-path: inset(0 round 22.5%);
}

.app-icon-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
}

.app-icon-backdrop {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  overflow: hidden;
  background: var(--app-color);
}

.app-icon-backdrop::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 45%, rgba(0, 0, 0, 0.28) 100%);
}

.app-icon-backdrop-image {
  position: absolute;
  inset: -30%;
  width: 160%;
  height: 160%;
  object-fit: cover;
  filter: blur(var(--backdrop-blur)) saturate(1.6);
  opacity: 0.9;
  user-select: none;
  -webkit-user-drag: none;
}

.app-icon-image-inset {
  position: relative;
  object-fit: contain;
  border-radius: 0;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
}

.app-icon-rim {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  pointer-events: none;
}

.app-icon-small {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.app-icon-small .app-icon-tile {
  box-shadow: inset 0 0 0 0.5px rgba(0, 0, 0, 0.18);
}

.app-icon-small .app-icon-glyph {
  filter: none;
}
</style>
