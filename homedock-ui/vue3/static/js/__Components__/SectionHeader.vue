<!-- homedock-ui/vue3/static/js/__Components__/SectionHeader.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="section-header mb-4">
    <div class="flex items-center gap-2 mb-1">
      <Icon v-if="icon" :icon="icon" :class="[themeClasses.navBarIcon]" class="h-5 w-5" />
      <h2 :class="[themeClasses.mainText]" class="text-base font-semibold m-0">{{ title }}</h2>
    </div>
    <p v-if="description" :class="[themeClasses.subText]" class="text-xs m-0 ml-7 opacity-70">{{ description }}</p>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { Icon, IconifyIcon } from "@iconify/vue";

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  icon: {
    type: [String, Object] as PropType<string | IconifyIcon>,
    default: null,
  },
});

const { themeClasses } = useTheme();
</script>

<style scoped>
.section-header {
  user-select: none;
}
</style>
