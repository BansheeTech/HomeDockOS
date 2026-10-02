<!-- homedock-ui/vue3/static/js/__Components__/TaskProgress.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="space-y-1.5">
    <div :class="[themeClasses.storeInfoBarDivider]" class="relative h-1.5 rounded-full overflow-hidden">
      <div v-if="percent === null" class="task-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-blue-500"></div>
      <div v-else class="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-[width] duration-300 ease-out" :style="{ width: `${percent}%` }"></div>
    </div>
    <p :class="[themeClasses.storeCardSubtitle]" class="m-0 flex justify-between gap-3 text-[11px] tabular-nums">
      <span class="truncate">{{ label }}</span>
      <span v-if="detail" class="flex-shrink-0">{{ detail }}</span>
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

defineProps<{
  percent: number | null;
  label: string;
  detail?: string;
}>();

const { themeClasses } = useTheme();
</script>

<style scoped>
.task-indeterminate {
  animation: task-indeterminate 1.2s ease-in-out infinite;
}

@keyframes task-indeterminate {
  from {
    left: -33%;
  }
  to {
    left: 100%;
  }
}
</style>
