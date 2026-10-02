<!-- homedock-ui/vue3/static/js/__Components__/DisksPlusSessionRing.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <svg class="w-3.5 h-3.5 flex-shrink-0 -rotate-90" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5" class="opacity-20" />
    <circle
      cx="8"
      cy="8"
      r="6"
      fill="none"
      :class="strokeClass"
      stroke-width="1.5"
      stroke-linecap="round"
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset="CIRCUMFERENCE * (1 - percent / 100)"
      style="
        transition:
          stroke-dashoffset 500ms linear,
          stroke 500ms linear;
      "
    />
  </svg>
</template>

<script lang="ts" setup>
defineProps<{
  percent: number;
  strokeClass: string;
}>();

const CIRCUMFERENCE = 37.7;
</script>
