<!-- src/static/js/__Components__/ScrollBarThemeLoader.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template></template>

<script setup lang="ts">
import { watchEffect } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

const { themeClasses } = useTheme();

watchEffect(() => {
  document.documentElement.style.setProperty("--scrollbar-theme-thumb", themeClasses.value.scrollbarThumb);
  document.documentElement.style.setProperty("--scrollbar-theme-track", themeClasses.value.scrollbarTrack);
  document.documentElement.style.setProperty("--scrollbar-theme-wxpx", themeClasses.value.scrollbarWxPx);
});
</script>
<style>
html,
body {
  height: 100%;
}

:root {
  --scrollbar-theme-thumb: rgba(0, 0, 0, 0.3);
  --scrollbar-theme-track: rgba(255, 255, 255, 0.1);
  --scrollbar-theme-wxpx: 4px;
}

*::-webkit-scrollbar {
  width: var(--scrollbar-theme-wxpx);
  height: var(--scrollbar-theme-wxpx);
  border-radius: 10px;
}

*::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-theme-thumb);
  background-clip: content-box;
  border: 2px solid transparent;
  border-radius: 10px;
}

*::-webkit-scrollbar-track {
  background-color: var(--scrollbar-theme-track);
}

@supports not selector(::-webkit-scrollbar) {
  * {
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-theme-thumb) var(--scrollbar-theme-track);
  }
}
</style>
