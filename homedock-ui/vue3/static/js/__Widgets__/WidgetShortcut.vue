<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetShortcut.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="w-full h-full flex items-center px-4 py-3">
    <button v-if="boundShortcut" type="button" class="group w-full h-full flex items-center gap-3 min-w-0 cursor-pointer" @click.stop="openShortcut" :title="boundShortcut.url">
      <div class="shrink-0 transition-transform duration-200 group-hover:scale-105">
        <ShortcutGraphic :key="`${boundShortcut.shortcut.iconType}:${boundShortcut.shortcut.iconValue}`" :shortcut="boundShortcut.shortcut" :size="48" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col items-start leading-tight gap-0.5">
        <span class="text-sm font-semibold truncate max-w-full" :class="themeClasses.desktopWidgetTitle">{{ boundShortcut.name }}</span>
        <span class="text-[10px] truncate max-w-full" :class="themeClasses.desktopWidgetMeta">{{ shortcutHost }}</span>
      </div>
      <Icon :icon="arrowTopRightIcon" class="w-3.5 h-3.5 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" :class="themeClasses.desktopWidgetMeta" />
    </button>

    <div v-else-if="availableShortcuts.length > 0" class="w-full h-full flex flex-col justify-center gap-1 min-w-0 overflow-hidden">
      <span class="text-[10px] font-semibold uppercase tracking-wide shrink-0" :class="themeClasses.desktopWidgetMeta">{{ $t("Choose a shortcut") }}</span>
      <div class="flex items-center gap-1.5 overflow-x-auto py-2 -my-2 px-1 -mx-1">
        <button v-for="option in availableShortcuts" :key="option.shortcutId" type="button" class="shrink-0 p-0.5 border-0 bg-transparent cursor-pointer transition-transform duration-150 hover:scale-110" :title="option.name" @mousedown.stop @click.stop="bindShortcut(option.shortcutId)">
          <ShortcutGraphic :key="`${option.shortcut.iconType}:${option.shortcut.iconValue}`" :shortcut="option.shortcut" :size="28" />
        </button>
      </div>
    </div>

    <div v-else class="w-full flex flex-col items-center justify-center gap-1.5">
      <Icon :icon="linkOffIcon" class="w-6 h-6" :class="themeClasses.desktopWidgetMeta" />
      <span class="text-xs text-center" :class="themeClasses.desktopWidgetMeta">{{ $t("No shortcuts yet") }}</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "@iconify/vue";

import arrowTopRightIcon from "@iconify-icons/mdi/arrow-top-right";
import linkOffIcon from "@iconify-icons/mdi/link-variant-off";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useDesktopStore, type ShortcutData } from "../__Stores__/desktopStore";
import { useWidgetsStore } from "../__Stores__/useWidgetsStore";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

import ShortcutGraphic from "../__Components__/ShortcutGraphic.vue";

const props = defineProps<{
  instance: WidgetInstance;
  size: WidgetSize;
}>();

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const widgetsStore = useWidgetsStore();

interface ShortcutOption {
  shortcutId: string;
  name: string;
  url: string;
  shortcut: ShortcutData;
}

const availableShortcuts = computed<ShortcutOption[]>(() =>
  desktopStore.systemDesktopIcons
    .filter((icon) => icon.shortcut && icon.shortcut.type !== "file")
    .map((icon) => ({
      shortcutId: icon.shortcut!.shortcutId,
      name: icon.name,
      url: icon.shortcut!.url,
      shortcut: icon.shortcut!,
    })),
);

const boundShortcut = computed<ShortcutOption | null>(() => {
  const shortcutId = props.instance.settings?.shortcutId;
  if (typeof shortcutId !== "string" || !shortcutId) return null;
  return availableShortcuts.value.find((option) => option.shortcutId === shortcutId) || null;
});

const shortcutHost = computed(() => {
  if (!boundShortcut.value) return "";
  try {
    return new URL(boundShortcut.value.url).host;
  } catch {
    return boundShortcut.value.url;
  }
});

function bindShortcut(shortcutId: string) {
  widgetsStore.updateSettings(props.instance.instanceId, { shortcutId });
}

function openShortcut() {
  if (!boundShortcut.value) return;
  window.open(boundShortcut.value.url, "_blank", "noopener,noreferrer");
}
</script>
