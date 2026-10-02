<!-- homedock-ui/vue3/static/js/__Components__/TraySection.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <section class="tray-section">
    <div v-if="title" :class="[themeClasses.storeCardSubtitle]" class="flex items-center gap-1.5 px-1.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider">
      <component :is="collapsible ? 'button' : 'span'" :type="collapsible ? 'button' : undefined" :aria-expanded="collapsible ? expanded : undefined" :class="collapsible ? 'cursor-pointer hover:opacity-80' : ''" class="flex flex-1 items-center gap-1 min-w-0 p-0 bg-transparent border-0 text-left text-inherit uppercase tracking-wider font-semibold transition-opacity duration-150" @click="collapsible && emit('toggle')">
        <span class="flex-1 min-w-0 truncate">{{ title }}</span>
        <Icon v-if="collapsible" :icon="chevronIcon" :class="expanded ? 'rotate-90' : ''" class="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200" />
      </component>
      <slot name="accessory" />
    </div>
    <slot />
  </section>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import chevronIcon from "@iconify-icons/mdi/chevron-right";

withDefaults(
  defineProps<{
    title?: string;
    collapsible?: boolean;
    expanded?: boolean;
  }>(),
  {
    title: undefined,
    collapsible: false,
    expanded: true,
  },
);

const emit = defineEmits<{
  toggle: [];
}>();

const { themeClasses } = useTheme();
</script>
