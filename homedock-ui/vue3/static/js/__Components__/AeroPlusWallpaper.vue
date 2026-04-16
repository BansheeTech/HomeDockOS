<!-- homedock-ui/vue3/static/js/__Components__/AeroPlusWallpaper.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="isVisible" class="aero-plus-wallpaper" :style="backgroundStyle"></div>
</template>

<script lang="ts" setup>
import { inject, computed, ref, watch } from "vue";

const themeData = inject<{ selectedTheme: string; selectedBack: string }>("data-theme");

const isVisible = computed(() => themeData?.selectedTheme === "aeroplus");
const wallpaperHash = ref("");

watch(
  () => themeData?.selectedBack,
  async (back) => {
    if (!back?.startsWith("_back_custom")) {
      wallpaperHash.value = "";
      return;
    }
    const res = await fetch(`/images/user-wallpaper/${back}`);
    if (!res.ok) return;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let h = 5381;
    for (let i = 0; i < bytes.length; i++) h = ((h * 33) ^ bytes[i]) >>> 0;
    wallpaperHash.value = h.toString(16);
  },
  { immediate: true },
);

const backgroundStyle = computed(() => {
  let wallpaperUrl = "/images/back1.jpg";

  if (themeData?.selectedBack) {
    if (themeData.selectedBack.startsWith("_back_custom")) {
      wallpaperUrl = `/images/user-wallpaper/${themeData.selectedBack}${wallpaperHash.value ? `?h=${wallpaperHash.value}` : ""}`;
    } else {
      wallpaperUrl = `/images/wallpapers/${themeData.selectedBack}`;
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
