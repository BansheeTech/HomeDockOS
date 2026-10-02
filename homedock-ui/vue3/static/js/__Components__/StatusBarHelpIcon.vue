<!-- homedock-ui/vue3/static/js/__Components__/StatusBarHelpIcon.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <WindowIcon v-if="ownWindow?.icon" :window="ownWindow" :size="20" />
  <Icon v-else-if="icon" :icon="icon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import { Icon } from "@iconify/vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { STATUS_BAR_WINDOW } from "../__Composables__/statusBarContext";

import WindowIcon from "./WindowIcon.vue";

defineProps<{ icon?: any }>();

const { themeClasses } = useTheme();

const ownWindow = inject(
  STATUS_BAR_WINDOW,
  computed(() => null),
);
</script>
