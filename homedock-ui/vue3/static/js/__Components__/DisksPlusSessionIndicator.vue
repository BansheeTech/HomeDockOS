<!-- homedock-ui/vue3/static/js/__Components__/DisksPlusSessionIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <template v-if="unlocked">
    <span class="flex-shrink-0 flex items-center" :title="countdown ? $t('Auto-locks in {n}', { n: countdown }) : undefined">
      <DisksPlusSessionRing v-if="countdown" :percent="percent" :stroke-class="strokeClass" />
      <Icon v-else :icon="lockOpenIcon" class="w-3 h-3 opacity-50" />
    </span>
    <span class="absolute left-0 bottom-0 h-[2px] transition-[width,background-color] duration-500 ease-linear" :class="barClass" :style="{ width: percent + '%' }" aria-hidden="true"></span>
  </template>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";

import DisksPlusSessionRing from "./DisksPlusSessionRing.vue";

defineProps<{
  unlocked: boolean;
  countdown: string;
  percent: number;
  strokeClass: string;
  barClass: string;
}>();
</script>
