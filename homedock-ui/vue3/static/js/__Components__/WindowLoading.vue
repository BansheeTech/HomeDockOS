<!-- homedock-ui/vue3/static/js/__Components__/WindowLoading.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<script setup lang="ts">
import { useTheme } from "../__Themes__/ThemeSelector";
import { computed } from "vue";

const { themeClasses } = useTheme();

const uniqueId = computed(() => `svg-${Math.random().toString(36).substring(2, 11)}`);
const animId1 = computed(() => `${uniqueId.value}-anim1`);
const animId2 = computed(() => `${uniqueId.value}-anim2`);
</script>

<template>
  <div class="flex items-center justify-center w-full h-full">
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" :class="themeClasses.windowLoadingIcon">
      <rect width="24" height="24" fill="none" />
      <rect width="7.33" height="7.33" x="1" y="1" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate :id="animId1" attributeName="x" :begin="`0;${animId2}.end+0.2s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" :begin="`0;${animId2}.end+0.2s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" :begin="`0;${animId2}.end+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`0;${animId2}.end+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="1" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="1" y="8.33" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.1s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="1" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="8.33" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="1" y="15.66" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="1;4;1" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.2s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="8.33" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="8.33" y="15.66" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate attributeName="x" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="8.33;11.33;8.33" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.3s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
      <rect width="7.33" height="7.33" x="15.66" y="15.66" fill="currentColor" stroke-width="0.5" stroke="currentColor">
        <animate :id="animId2" attributeName="x" :begin="`${animId1}.begin+0.4s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="y" :begin="`${animId1}.begin+0.4s`" dur="0.6s" values="15.66;18.66;15.66" />
        <animate attributeName="width" :begin="`${animId1}.begin+0.4s`" dur="0.6s" values="7.33;1.33;7.33" />
        <animate attributeName="height" :begin="`${animId1}.begin+0.4s`" dur="0.6s" values="7.33;1.33;7.33" />
      </rect>
    </svg>
  </div>
</template>

<style scoped></style>
