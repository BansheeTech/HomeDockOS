<!-- homedock-ui/vue3/static/js/__Widgets__/WidgetShortcut.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="w-full h-full flex items-center px-4 py-3">
    <button v-if="boundShortcut" type="button" class="group w-full h-full flex items-center gap-3 min-w-0 cursor-pointer" @click.stop="openShortcut" :title="boundShortcut.url">
      <div class="shrink-0 w-12 h-12 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center transition-transform duration-200 group-hover:scale-105" :class="themeClasses.desktopWidgetControlBg">
        <img v-if="boundShortcut.iconType === 'image'" :src="getShortcutIconUrl(boundShortcut.iconValue)" class="w-8 h-8 object-contain rounded-lg" alt="" draggable="false" />
        <Icon v-else :icon="getShortcutPresetIcon(boundShortcut.iconValue)" class="w-6 h-6" :class="themeClasses.desktopWidgetAccent" />
      </div>
      <div class="flex-1 min-w-0 flex flex-col items-start leading-tight gap-0.5">
        <span class="text-sm font-semibold truncate max-w-full" :class="themeClasses.desktopWidgetTitle">{{ boundShortcut.name }}</span>
        <span class="text-[10px] truncate max-w-full" :class="themeClasses.desktopWidgetMeta">{{ shortcutHost }}</span>
      </div>
      <Icon :icon="arrowTopRightIcon" class="w-3.5 h-3.5 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" :class="themeClasses.desktopWidgetMeta" />
    </button>

    <div v-else-if="availableShortcuts.length > 0" class="w-full h-full flex flex-col justify-center gap-1 min-w-0 overflow-hidden">
      <span class="text-[10px] font-semibold uppercase tracking-wide shrink-0" :class="themeClasses.desktopWidgetMeta">{{ $t("Choose a shortcut") }}</span>
      <div class="flex items-center gap-1.5 overflow-x-auto">
        <button v-for="option in availableShortcuts" :key="option.shortcutId" type="button" class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer" :class="[themeClasses.desktopWidgetControlBg, themeClasses.desktopWidgetControlBgHover]" :title="option.name" @mousedown.stop @click.stop="bindShortcut(option.shortcutId)">
          <img v-if="option.iconType === 'image'" :src="getShortcutIconUrl(option.iconValue)" class="w-5 h-5 object-contain rounded" alt="" draggable="false" />
          <Icon v-else :icon="getShortcutPresetIcon(option.iconValue)" class="w-4 h-4" :class="themeClasses.desktopWidgetText" />
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
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWidgetsStore } from "../__Stores__/useWidgetsStore";
import { getShortcutPresetIcon, getShortcutIconUrl } from "../__Config__/ShortcutIcons";
import type { WidgetInstance } from "../__Stores__/useWidgetsStore";
import type { WidgetSize } from "../__Config__/WidgetDefaultDetails";

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
  iconType: "preset" | "image";
  iconValue: string;
}

const availableShortcuts = computed<ShortcutOption[]>(() =>
  desktopStore.systemDesktopIcons
    .filter((icon) => icon.shortcut && icon.shortcut.type !== "file")
    .map((icon) => ({
      shortcutId: icon.shortcut!.shortcutId,
      name: icon.name,
      url: icon.shortcut!.url,
      iconType: icon.shortcut!.iconType as "preset" | "image",
      iconValue: icon.shortcut!.iconValue,
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
