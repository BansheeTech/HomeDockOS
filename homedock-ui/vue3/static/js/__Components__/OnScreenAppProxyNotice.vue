<!-- homedock-ui/vue3/static/js/__Components__/OnScreenAppProxyNotice.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
    <AppIconGraphic :image-src="icon" :size="56" />
    <div class="flex flex-col gap-1">
      <p :class="[themeClasses.hubCardTextAppName]" class="font-bold text-sm">{{ displayName }}</p>
      <p :class="[themeClasses.hubCardTextRepo]" class="text-xs max-w-sm">{{ $t("This app doesn't seem to work under a proxy and may require manual configuration.") }}</p>
    </div>
    <button v-if="canOpenExternally" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors cursor-pointer" @click="emit('openExternal')">
      {{ $t("Open in a new tab") }}
    </button>
  </div>
</template>

<script lang="ts" setup>
import AppIconGraphic from "./AppIconGraphic.vue";
import { useTheme } from "../__Themes__/ThemeSelector";

defineProps<{
  displayName: string;
  icon: string;
  canOpenExternally: boolean;
}>();

const emit = defineEmits<{ openExternal: [] }>();

const { themeClasses } = useTheme();
</script>
