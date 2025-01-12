<!-- homedock-ui/vue3/static/js/__Components__/SettingsBoxFold.vue -->
<!-- Copyright © 2023-2024 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.boxFoldScope]" class="form-group mb-2 px-4 py-2 transition-all rounded-xl duration-300 ease-in-out border">
    <slot></slot>
    <div :class="[themeClasses.boxFoldSepper]" class="flex-grow h-[4px] rounded-full mt-4 mb-2"></div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

const { themeClasses } = useTheme();
</script>

<style scoped></style>
