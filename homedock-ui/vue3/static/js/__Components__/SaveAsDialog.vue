<!-- homedock-ui/vue3/static/js/__Components__/SaveAsDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog v-model:visible="visible" title="Save As" ok-text="Save" cancel-text="Cancel" @ok="emit('confirm')" @cancel="emit('cancel')">
    <div class="space-y-2">
      <input v-model="name" type="text" :placeholder="$t('File name...')" :class="[themeClasses.windowInputBg, themeClasses.windowText, themeClasses.windowBorder]" class="w-full px-3 py-2 text-sm rounded-lg border outline-none" @keyup.enter="emit('confirm')" />
      <div class="flex items-center gap-1.5">
        <Icon :icon="folderIcon" :class="['w-3 h-3 opacity-40', themeClasses.windowText]" />
        <span :class="['text-[11px] opacity-40', themeClasses.windowText]">{{ $t("Saving in Storage/{folder}", { folder }) }}</span>
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { Icon } from "@iconify/vue";
import folderIcon from "@iconify-icons/mdi/folder";

import { useTheme } from "../__Themes__/ThemeSelector";

import AppDialog from "./AppDialog.vue";

defineProps<{ folder: string }>();

const visible = defineModel<boolean>("visible", { required: true });
const name = defineModel<string>("name", { required: true });

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const { themeClasses } = useTheme();
</script>
