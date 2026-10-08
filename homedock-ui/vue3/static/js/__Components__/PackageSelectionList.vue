<!-- homedock-ui/vue3/static/js/__Components__/PackageSelectionList.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="space-y-3">
    <p :class="[themeClasses.packagerTextMuted]" class="text-xs">
      {{ summary }}
      <template v-if="existingCount > 0"> {{ $t("{n} already imported and cannot be selected.", { n: existingCount }) }}</template>
    </p>

    <button type="button" :class="[themeClasses.storeCardGetPill]" class="h-7 px-3.5 rounded-full text-xs font-semibold cursor-pointer" @click="emit('toggle-all')">{{ allSelected ? $t("Deselect All") : $t("Select All") }}</button>

    <div class="max-h-64 overflow-y-auto space-y-0.5">
      <div v-for="pkg in packages" :key="pkg.filename || pkg.name" :class="[pkg.already_exists ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer', selected.has(pkg.name) && !pkg.already_exists ? 'bg-blue-500/10' : themeClasses.storeRowHover]" class="flex items-center gap-3 px-2.5 py-1.5 rounded-xl transition-colors duration-150" @click="!pkg.already_exists && emit('toggle', pkg.name)">
        <span :class="selected.has(pkg.name) && !pkg.already_exists ? 'bg-blue-500 border-blue-500' : themeClasses.windowBorder" class="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0">
          <Icon v-if="selected.has(pkg.name) && !pkg.already_exists" :icon="checkIcon" class="w-3 h-3 text-white" />
        </span>
        <AppIconGraphic :icon="packageIcon" :size="28" />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 min-w-0">
            <p :class="[themeClasses.storeModalAppName]" class="m-0 text-xs font-medium truncate">{{ pkg.display_name || pkg.name || pkg.filename }}</p>
            <span v-if="pkg.already_exists" :class="[themeClasses.storeCardSubtitle]" class="text-[10px] font-semibold flex-shrink-0">{{ $t("Exists") }}</span>
          </div>
          <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-[10px] truncate">{{ pkg.author || $t("Unknown") }} · {{ pkg.category ? $t(pkg.category) : $t("Uncategorized") }} · {{ pkg.version || "latest" }}</p>
        </div>
      </div>
    </div>

    <p v-if="selected.size > 0" :class="[themeClasses.packagerSuccessText]" class="m-0 text-xs">{{ selectedLabel }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import checkIcon from "@iconify-icons/mdi/check";
import packageIcon from "@iconify-icons/mdi/package-variant";

import AppIconGraphic from "./AppIconGraphic.vue";

const props = defineProps<{
  packages: any[];
  selected: Set<string>;
  summary: string;
  selectedLabel: string;
}>();

const emit = defineEmits<{
  (e: "toggle", name: string): void;
  (e: "toggle-all"): void;
}>();

const { themeClasses } = useTheme();

const existingCount = computed(() => props.packages.filter((pkg) => pkg.already_exists).length);
const allSelected = computed(() => props.selected.size > 0 && props.selected.size === props.packages.length - existingCount.value);
</script>
