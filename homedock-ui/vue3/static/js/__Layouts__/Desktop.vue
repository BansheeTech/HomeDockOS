<!-- homedock-ui/vue3/static/js/__Layouts__/Desktop.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="desktop-container" :class="[themeClasses.back]">
    <Favicon />
    <AeroPlusWallpaper />
    <ScrollBarThemeLoader />
    <TopComment />

    <div class="desktop-content" :style="desktopContentStyle" @click="handleDesktopClick">
      <DesktopIconsGrid ref="desktopIconsGridRef" />

      <VersionControl />

      <WindowManager :show-debug-info="false" />
    </div>

    <Taskbar />

    <StartMenu />

    <Notifications />

    <router-view />
  </div>
</template>

<script lang="ts" setup>
import { ref, inject, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

import { useTheme } from "../__Themes__/ThemeSelector";

import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";

import { useResponsive } from "../__Composables__/useResponsive";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import VersionControl from "../__Components__/VersionControl.vue";
import Notifications from "../__Components__/Notifications.vue";

import WindowManager from "../__Windows__/WindowManager.vue";
import StartMenu from "../__Desktop__/StartMenu.vue";
import Taskbar from "../__Desktop__/Taskbar.vue";
import DesktopIconsGrid from "../__Desktop__/DesktopIconsGrid.vue";

const settingsData = inject<{ userName: string }>("data-settings");

const { themeClasses } = useTheme();

const { taskbarHeight, isMobile, availableHeight } = useResponsive();

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();

const router = useRouter();

const userName = computed(() => settingsData?.userName || "User");

const desktopIconsGridRef = ref<InstanceType<typeof DesktopIconsGrid> | null>(null);

const desktopContentStyle = computed(() => ({
  height: availableHeight.value,
}));

function handleDesktopClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains("desktop-content")) {
    desktopIconsGridRef.value?.deselectIcon();
  }
}

onMounted(() => {
  desktopStore.initialize();
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
