<!-- homedock-ui/vue3/static/js/__Components__/KeepWindowOpenBadge.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="badge-pop">
    <span v-if="visible" role="status" :class="[themeClasses.appPropsDependencyWarningBg, themeClasses.appPropsDependencyWarningBorder, themeClasses.appPropsDependencyWarningText]" class="inline-flex items-center gap-1.5 h-7 pl-2 pr-3 rounded-full border text-xs font-medium">
      <Icon :icon="loadingIcon" :class="[themeClasses.appPropsDependencyWarningIcon]" class="w-3.5 h-3.5 animate-spin" />
      <span>{{ $t("Please don't close this window") }}</span>
    </span>
  </Transition>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";

defineProps<{
  visible: boolean;
}>();

const { themeClasses } = useTheme();
</script>

<style scoped>
.badge-pop-enter-active,
.badge-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.badge-pop-enter-from,
.badge-pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
