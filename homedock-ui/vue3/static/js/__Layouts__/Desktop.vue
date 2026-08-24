<!-- homedock-ui/vue3/static/js/__Layouts__/Desktop.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="desktop-container" :class="[themeClasses.desktopBack]">
    <Favicon />
    <AeroPlusWallpaper />
    <ScrollBarThemeLoader />
    <TopComment />

    <div class="desktop-content" :style="desktopContentStyle" @click="handleDesktopClick">
      <DesktopIconsGrid ref="desktopIconsGridRef" />

      <VersionControl />

      <WindowManager />

      <QuickView />
    </div>

    <Taskbar />

    <StartMenu />

    <Notifications />

    <ScreenshotOverlay />

    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useSSEStore } from "../__Stores__/useSSEStore";
import { useSystemStatsStore } from "../__Stores__/useSystemStatsStore";
import { useWhatsNewStore } from "../__Stores__/useWhatsNewStore";

import { releaseNotes } from "../__Data__/WhatsNewData";

import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useResponsive } from "../__Composables__/useResponsive";
import { useMobileZoomPrevention } from "../__Composables__/useMobileZoomPrevention";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import VersionControl from "../__Components__/VersionControl.vue";
import Notifications from "../__Components__/Notifications.vue";
import ScreenshotOverlay from "../__Components__/ScreenshotOverlay.vue";

import WindowManager from "../__Windows__/WindowManager.vue";
import StartMenu from "../__Desktop__/StartMenu.vue";
import Taskbar from "../__Desktop__/Taskbar.vue";
import DesktopIconsGrid from "../__Desktop__/DesktopIconsGrid.vue";
import QuickView from "../__Desktop__/QuickView.vue";

const { themeClasses } = useTheme();

const { availableHeight } = useResponsive();

useMobileZoomPrevention();

const desktopStore = useDesktopStore();
const whatsNewStore = useWhatsNewStore();
const csrfToken = useCsrfToken();
const sseStore = useSSEStore();
useSystemStatsStore();

const desktopIconsGridRef = ref<InstanceType<typeof DesktopIconsGrid> | null>(null);

const desktopContentStyle = computed(() => ({
  height: availableHeight.value,
}));

function handleDesktopClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("desktop-content")) {
    desktopIconsGridRef.value?.deselectIcon();
  }
}

onMounted(async () => {
  desktopStore.initialize();
  sseStore.startPolling();

  if (releaseNotes.entries.length > 0) {
    await whatsNewStore.load(csrfToken.value);

    if (whatsNewStore.isUnseen(releaseNotes.id)) {
      whatsNewStore.open();
    }
  }
});

onUnmounted(() => {
  sseStore.stopPolling();
});
</script>

<style scoped>
.desktop-container {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
}

.desktop-content {
  position: relative;
  width: 100%;
  z-index: 1;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
