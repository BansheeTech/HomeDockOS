<!-- homedock-ui/vue3/static/js/__Components__/AeroPlusWallpaper.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div v-if="isVisible" class="aero-plus-wallpaper" :style="backgroundStyle"></div>
</template>

<script lang="ts" setup>
import { inject, computed, ref } from "vue";

const themeData = inject<{ selectedTheme: string; selectedBack: string }>("data-theme");
const wallpaperTimestamp = inject<{ value: number }>("wallpaper-timestamp", ref(Date.now()));

const isVisible = computed(() => themeData?.selectedTheme === "aeroplus");

const backgroundStyle = computed(() => {
  let wallpaperUrl = "/images/back1.jpg";

  if (themeData?.selectedBack) {
    if (themeData.selectedBack.startsWith("_back_custom")) {
      wallpaperUrl = `/images/user-wallpaper/${themeData.selectedBack}?t=${wallpaperTimestamp.value}`;
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
