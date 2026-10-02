<!-- homedock-ui/vue3/static/js/__Components__/UpdatedDot.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="updated-dot">
    <span v-if="visible" class="updated-dot" :class="themeClasses.desktopUpdatedDot"></span>
  </Transition>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

defineProps<{ visible: boolean }>();

const { themeClasses } = useTheme();
</script>

<style scoped>
.updated-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 4px;
  border-radius: 9999px;
  vertical-align: 1px;
}

.updated-dot-enter-active,
.updated-dot-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.updated-dot-enter-from,
.updated-dot-leave-to {
  opacity: 0;
  transform: scale(0.4);
}
</style>
