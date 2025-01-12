<!-- homedock-ui/vue3/static/js/__Components__/SettingsSeparator.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex items-center">
    <span class="mr-2 flex items-center">
      <Icon :icon="mdi_icon" size="15px" class="mr-1" />
      {{ text }}
    </span>
    <div :class="[themeClasses.formLineSet]" class="flex-grow border-t"></div>
  </div>
</template>

<script lang="ts" setup>
import { PropType } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon, IconifyIcon } from "@iconify/vue";

const { themeClasses } = useTheme();

defineProps({
  text: {
    type: String,
    required: true,
  },
  mdi_icon: {
    type: [String, Object] as PropType<string | IconifyIcon>,
    required: true,
  },
});
</script>

<style scoped></style>
