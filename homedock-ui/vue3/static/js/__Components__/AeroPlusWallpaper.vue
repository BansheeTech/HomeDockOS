<!-- homedock-ui/vue3/static/js/__Components__/AeroPlusWallpaper.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <template v-if="isVisible">
    <div v-for="layer in layers" :key="layer.id" class="aero-plus-wallpaper" :class="{ 'aero-plus-wallpaper-incoming': layer.animate, 'aero-plus-wallpaper-blurred': blurred }" :style="{ backgroundImage: `url('${layer.url}')` }" @animationend="onLayerDone(layer.id, $event)"></div>
  </template>
</template>

<script lang="ts" setup>
import { inject, computed, ref, watch } from "vue";

import type { ThemeData } from "../__Types__/ThemeData";

const { blurred = false } = defineProps<{ blurred?: boolean }>();

const HASH_STORAGE_KEY = "wallpaperHash";

const themeData = inject<ThemeData | null>("data-theme", null);

const isVisible = computed(() => themeData?.selected_theme === "aeroplus");
const wallpaperHash = ref(localStorage.getItem(HASH_STORAGE_KEY) || "");

function djb2(bytes: Uint8Array): string {
  let h = 5381;
  for (let i = 0; i < bytes.length; i++) h = ((h * 33) ^ bytes[i]) >>> 0;
  return h.toString(16);
}

watch(
  () => themeData?.selected_back,
  async (back) => {
    if (!back?.startsWith("_back_custom")) {
      wallpaperHash.value = "";
      localStorage.removeItem(HASH_STORAGE_KEY);
      return;
    }
    const res = await fetch(`/images/user-wallpaper/${back}`);
    if (!res.ok) return;
    const newHash = djb2(new Uint8Array(await res.arrayBuffer()));
    if (newHash !== wallpaperHash.value) {
      wallpaperHash.value = newHash;
      localStorage.setItem(HASH_STORAGE_KEY, newHash);
    }
  },
  { immediate: true },
);

const resolvedUrl = computed(() => {
  if (themeData?.selected_back) {
    if (themeData.selected_back.startsWith("_back_custom")) {
      return `/images/user-wallpaper/${themeData.selected_back}${wallpaperHash.value ? `?h=${wallpaperHash.value}` : ""}`;
    }
    return `/images/wallpapers/${themeData.selected_back}`;
  }
  return "/images/back1.jpg";
});

type Layer = { id: number; url: string; animate: boolean };

let nextId = 0;
const layers = ref<Layer[]>(isVisible.value ? [{ id: ++nextId, url: resolvedUrl.value, animate: false }] : []);

function preload(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = url;
  });
}

async function pushLayer(url: string) {
  await preload(url);
  if (!isVisible.value || resolvedUrl.value !== url) return;
  if (layers.value.at(-1)?.url === url) return;
  layers.value.push({ id: ++nextId, url, animate: true });
}

watch(resolvedUrl, (next) => isVisible.value && pushLayer(next));

watch(isVisible, (visible) => (visible ? pushLayer(resolvedUrl.value) : (layers.value = [])));

function onLayerDone(id: number, e: AnimationEvent) {
  if (e.animationName !== "aero-wallpaper-zoom") return;
  const top = layers.value.at(-1);
  if (top?.id === id) layers.value = [{ ...top, animate: false }];
}
</script>

<style scoped>
.aero-plus-wallpaper {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-size: cover;
  background-position: center center;
  opacity: 1;
  z-index: 0;
}

.aero-plus-wallpaper-blurred {
  top: -240px;
  left: -240px;
  right: -240px;
  bottom: -240px;
  width: auto;
  height: auto;
  filter: blur(120px) saturate(1.5) brightness(0.6);
}

.aero-plus-wallpaper-incoming {
  z-index: 1;
  transform-origin: center center;
  will-change: transform, opacity;
  animation:
    aero-wallpaper-fade 750ms cubic-bezier(0.4, 0, 0.2, 1) forwards,
    aero-wallpaper-zoom 1250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes aero-wallpaper-fade {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes aero-wallpaper-zoom {
  0% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
