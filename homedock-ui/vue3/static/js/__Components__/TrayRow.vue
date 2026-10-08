<!-- homedock-ui/vue3/static/js/__Components__/TrayRow.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :role="interactive ? 'button' : undefined" :tabindex="interactive ? 0 : undefined" :class="[interactive ? [themeClasses.storeRowHover, 'cursor-pointer'] : '', highlighted ? 'bg-blue-500/10' : '']" class="tray-row flex items-center gap-2.5 w-full min-h-[40px] px-1.5 py-1.5 rounded-[10px] text-left outline-hidden transition-colors duration-150" @keydown.enter.self="interactive && ($event.currentTarget as HTMLElement).click()">
    <slot name="leading" />
    <div class="flex-1 min-w-0">
      <p :class="[themeClasses.storeModalAppName]" class="m-0 text-xs font-medium leading-snug truncate">
        <slot name="title">{{ title }}</slot>
      </p>
      <div v-if="subtitle || $slots.subtitle" :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[11px] leading-snug">
        <slot name="subtitle">{{ subtitle }}</slot>
      </div>
    </div>
    <slot name="trailing" />
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    interactive?: boolean;
    highlighted?: boolean;
  }>(),
  {
    title: "",
    subtitle: undefined,
    interactive: false,
    highlighted: false,
  },
);

const { themeClasses } = useTheme();
</script>
