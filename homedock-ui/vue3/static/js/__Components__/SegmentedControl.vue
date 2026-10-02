<!-- homedock-ui/vue3/static/js/__Components__/SegmentedControl.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div role="tablist" :class="[themeClasses.segmentedTrack]" class="segmented relative inline-grid max-w-full p-0.5 rounded-[9px]" :style="{ '--segments': options.length }">
    <span v-if="activeIndex >= 0" :class="[themeClasses.segmentedThumb]" class="segmented-thumb absolute top-0.5 bottom-0.5 left-0.5 rounded-[7px]" :style="{ transform: `translateX(${activeIndex * 100}%)` }" aria-hidden="true"></span>
    <button v-for="option in options" :key="option.value" type="button" role="tab" :aria-selected="option.value === modelValue" :class="option.value === modelValue ? themeClasses.segmentedTextActive : themeClasses.segmentedText" class="relative z-[1] flex items-center justify-center gap-1.5 min-w-0 h-7 px-3.5 bg-transparent border-0 text-xs font-medium cursor-pointer transition-colors duration-150" @click="emit('update:modelValue', option.value)">
      <Icon v-if="option.icon" :icon="option.icon" class="w-3.5 h-3.5 flex-shrink-0" />
      <span class="truncate">{{ option.label }}</span>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import type { IconifyIcon } from "@iconify/vue";

const props = defineProps<{
  modelValue: string;
  options: { value: string; label: string; icon?: IconifyIcon }[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const { themeClasses } = useTheme();

const activeIndex = computed(() => props.options.findIndex((option) => option.value === props.modelValue));
</script>

<style scoped>
.segmented {
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
}

.segmented-thumb {
  width: calc((100% - 4px) / var(--segments));
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
</style>
