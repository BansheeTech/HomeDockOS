<!-- homedock-ui/vue3/static/js/__Components__/EnterpriseIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <span class="inline-flex items-center font-semibold uppercase tracking-wide whitespace-nowrap text-white select-none bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600" :class="[sizeClasses, glow ? 'shadow-lg shadow-violet-500/40' : '']">
    <svg class="flex-shrink-0 h-3 w-3 min-h-3 min-w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" fill-opacity="0" d="M12 3l2.35 5.76l6.21 0.46l-4.76 4.02l1.49 6.04l-5.29 -3.28l-5.29 3.28l1.49 -6.04l-4.76 -4.02l6.21 -0.46Z">
        <animate fill="freeze" attributeName="fill-opacity" begin="0.5s" dur="0.5s" values="0;1" />
      </path>
      <path fill="none" stroke="currentColor" stroke-dasharray="36" stroke-dashoffset="36" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3L9.65 8.76L3.44 9.22L8.2 13.24L6.71 19.28L12 16M12 3L14.35 8.76L20.56 9.22L15.8 13.24L17.29 19.28L12 16">
        <animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="36;0" />
        <animate attributeName="d" dur="1.5s" repeatCount="indefinite" values="M12 3L9.65 8.76L3.44 9.22L8.2 13.24L6.71 19.28L12 16M12 3L14.35 8.76L20.56 9.22L15.8 13.24L17.29 19.28L12 16;M12 7L10.82 10.38L7.24 10.45L10.1 12.62L9.06 16.05L12 14M12 7L13.18 10.38L16.76 10.45L13.9 12.62L14.94 16.05L12 14;M12 3L9.65 8.76L3.44 9.22L8.2 13.24L6.71 19.28L12 16M12 3L14.35 8.76L20.56 9.22L15.8 13.24L17.29 19.28L12 16" />
      </path>
    </svg>
    <span v-if="size !== 'mini'">{{ label }}</span>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";

interface Props {
  label?: string;
  size?: "mini" | "xs" | "sm" | "md";
  glow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  label: "Enterprise",
  size: "sm",
  glow: false,
});

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    mini: "p-0.5 rounded-full gap-0",
    xs: "px-1 text-[9px] rounded-md gap-0.5",
    sm: "py-[2px] px-2 text-[10px] rounded-md gap-1",
    md: "py-[3px] px-2 text-[11px] rounded-lg gap-1",
  };
  return sizes[props.size];
});
</script>
