<!-- homedock-ui/vue3/static/js/__Components__/AeroPlusWallpaper.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="isVisible" class="aero-plus-wallpaper" :style="backgroundStyle"></div>
</template>

<script lang="ts" setup>
import { inject, computed, ref, watch } from "vue";

import type { ThemeData } from "../__Types__/ThemeData";

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

const backgroundStyle = computed(() => {
  let wallpaperUrl = "/images/back1.jpg";

  if (themeData?.selected_back) {
    if (themeData.selected_back.startsWith("_back_custom")) {
      wallpaperUrl = `/images/user-wallpaper/${themeData.selected_back}${wallpaperHash.value ? `?h=${wallpaperHash.value}` : ""}`;
    } else {
      wallpaperUrl = `/images/wallpapers/${themeData.selected_back}`;
    }
  }

  return {
    backgroundImage: `url('${wallpaperUrl}')`,
  };
});
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
</style>
