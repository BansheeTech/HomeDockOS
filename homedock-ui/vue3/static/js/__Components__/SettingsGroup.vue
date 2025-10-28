<!-- homedock-ui/vue3/static/js/__Components__/SettingsGroup.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="settings-group mb-6">
    <div v-if="header" class="px-5 mb-2">
      <h3 :class="[themeClasses.settingsGroupHeader, 'text-xs uppercase font-semibold tracking-wide']">{{ header }}</h3>
    </div>

    <div :class="[themeClasses.settingsGroupBg, themeClasses.settingsGroupBorder, themeClasses.settingsGroupShadow, 'rounded-xl border overflow-hidden shadow-sm']">
      <slot></slot>
    </div>

    <div v-if="footer" class="px-2">
      <p :class="[themeClasses.settingsGroupFooter, 'text-[10px] leading-none ml-2 mt-2']">• {{ footer }}</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

const { themeClasses } = useTheme();

defineProps({
  header: {
    type: String,
    default: "",
  },
  footer: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.settings-group {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
