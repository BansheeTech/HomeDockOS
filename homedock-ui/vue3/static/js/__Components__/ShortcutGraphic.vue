<!-- homedock-ui/vue3/static/js/__Components__/ShortcutGraphic.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <FolderGraphic v-if="target?.isDirectory" :emblem="folderEmblem" :size="graphicSize" />
  <FileGraphic v-else-if="target" :name="target.fileName" :size="graphicSize" />
  <AppIconGraphic v-else-if="shortcut.iconType === 'image'" :image-src="getShortcutIconUrl(shortcut.iconValue)" :size="size" />
  <AppIconGraphic v-else :icon="getShortcutGlyph(shortcut)" :size="size" />
</template>

<script lang="ts" setup>
import { computed } from "vue";

import type { ShortcutData } from "../__Stores__/desktopStore";
import { getShortcutGlyph, getShortcutIconUrl } from "../__Config__/ShortcutIcons";
import { SPECIAL_FOLDER_ICONS } from "../__Config__/FileIcons";

import AppIconGraphic from "./AppIconGraphic.vue";
import FileGraphic from "./FileGraphic.vue";
import FolderGraphic from "./FolderGraphic.vue";

const APP_TO_GRAPHIC_RATIO = 64 / 52;

const props = withDefaults(defineProps<{ shortcut: ShortcutData; size?: number }>(), { size: 52 });

const target = computed(() => (props.shortcut.type === "file" ? props.shortcut.target : undefined));

const graphicSize = computed(() => Math.round(props.size * APP_TO_GRAPHIC_RATIO));

const folderEmblem = computed(() => {
  const value = target.value;
  if (!value || value.location !== "storage" || value.path) return undefined;
  return SPECIAL_FOLDER_ICONS[value.fileName];
});
</script>
