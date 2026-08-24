<!-- homedock-ui/vue3/static/js/__Components__/ShortcutEditModal.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <AppDialog :visible="visible" type="info" :title="mode === 'create' ? 'Create Shortcut' : 'Edit Shortcut'" :icon="linkIcon" :ok-text="mode === 'create' ? 'Create' : 'Save'" cancel-text="Cancel" :ok-disabled="!canSave" :close-on-ok="false" @update:visible="emit('update:visible', $event)" @ok="handleOk" @cancel="handleCancel">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <span class="section-label" :class="[themeClasses.contextMenuText]">{{ $t("Name") }}</span>
        <input v-model="name" :placeholder="$t('Shortcut name')" maxlength="32" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowInputBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleOk" />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="section-label" :class="[themeClasses.contextMenuText]">{{ $t("URL") }}</span>
        <input v-model="url" placeholder="https://example.com" maxlength="2048" spellcheck="false" autocapitalize="off" autocomplete="off" class="w-full px-3 py-2 rounded-lg text-sm border outline-none transition-colors" :class="[themeClasses.windowInputBg, themeClasses.windowBorder, themeClasses.windowText, themeClasses.windowBorderFocused]" @keyup.enter="handleOk" />
      </div>

      <div class="flex flex-col gap-1.5">
        <span class="section-label" :class="[themeClasses.contextMenuText]">{{ $t("Icon") }}</span>
        <div class="icon-palette">
          <div v-for="preset in SHORTCUT_PRESET_ICONS" :key="preset.id" class="icon-swatch" :class="[themeClasses.contextMenuItemHover, { selected: iconType === 'preset' && iconValue === preset.id }]" :title="$t(preset.label)" @click="selectPreset(preset.id)">
            <Icon :icon="preset.icon" class="swatch-icon" :class="[themeClasses.contextMenuText]" />
          </div>
        </div>

        <button type="button" class="upload-icon-button w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border outline-none transition-colors cursor-pointer" :class="[themeClasses.windowInputBg, themeClasses.windowBorder, themeClasses.windowText, { 'upload-selected': iconType === 'image', 'drop-active': isDropActive }]" @click="fileInputRef?.click()" @dragover.prevent="isDropActive = true" @dragleave.prevent="isDropActive = false" @drop.prevent="handleDrop">
          <div v-if="isUploading" class="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin opacity-70"></div>
          <img v-else-if="iconType === 'image' && iconValue" :src="getShortcutIconUrl(iconValue)" class="w-5 h-5 object-contain rounded pointer-events-none" alt="" />
          <Icon v-else :icon="uploadIcon" class="w-4 h-4 opacity-80" />
          <span>{{ $t("Upload icon") }}</span>
        </button>

        <input ref="fileInputRef" type="file" accept=".jpg,.jpeg,.png" class="hidden" @change="handleFileSelect" />
        <p v-if="uploadError" class="text-xs m-0 text-red-500">{{ uploadError }}</p>
      </div>
    </div>
  </AppDialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import axios from "axios";
import { Icon } from "@iconify/vue";
import { useI18n } from "vue-i18n";

import linkIcon from "@iconify-icons/mdi/link-variant";
import uploadIcon from "@iconify-icons/mdi/tray-arrow-up";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { SHORTCUT_PRESET_ICONS, getShortcutIconUrl } from "../__Config__/ShortcutIcons";

import AppDialog from "./AppDialog.vue";

export interface ShortcutModalResult {
  name: string;
  url: string;
  icon_type: "preset" | "image";
  icon_value: string;
}

interface Props {
  visible: boolean;
  mode: "create" | "edit";
  initialName?: string;
  initialUrl?: string;
  initialIconType?: "preset" | "image";
  initialIconValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialName: "",
  initialUrl: "",
  initialIconType: "preset",
  initialIconValue: "web",
});

const emit = defineEmits<{
  "update:visible": [value: boolean];
  save: [result: ShortcutModalResult];
  cancel: [];
}>();

const { themeClasses } = useTheme();
const { t } = useI18n();
const csrfToken = useCsrfToken();

const name = ref("");
const url = ref("");
const iconType = ref<"preset" | "image">("preset");
const iconValue = ref("web");

const fileInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isDropActive = ref(false);
const uploadError = ref("");

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      name.value = props.initialName;
      url.value = props.initialUrl;
      iconType.value = props.initialIconType;
      iconValue.value = props.initialIconValue;
      isUploading.value = false;
      isDropActive.value = false;
      uploadError.value = "";
    }
  },
);

const normalizedUrl = computed(() => {
  const trimmed = url.value.trim();
  if (!trimmed) return "";
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
});

const canSave = computed(() => {
  if (!name.value.trim() || isUploading.value) return false;
  return /^https?:\/\/.+/.test(normalizedUrl.value);
});

function selectPreset(presetId: string) {
  iconType.value = "preset";
  iconValue.value = presetId;
  uploadError.value = "";
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    uploadIconFile(file);
  }
  input.value = "";
}

function handleDrop(e: DragEvent) {
  isDropActive.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    uploadIconFile(file);
  }
}

async function uploadIconFile(file: File) {
  uploadError.value = "";
  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/shortcuts/upload-icon", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.success && response.data.filename) {
      iconType.value = "image";
      iconValue.value = response.data.filename;
    } else {
      uploadError.value = response.data.message || t("Invalid file");
    }
  } catch (error: any) {
    uploadError.value = error?.response?.data?.message || t("Invalid file");
  } finally {
    isUploading.value = false;
  }
}

function handleOk() {
  if (!canSave.value) return;

  emit("save", {
    name: name.value.trim(),
    url: normalizedUrl.value,
    icon_type: iconType.value,
    icon_value: iconValue.value,
  });
  emit("update:visible", false);
}

function handleCancel() {
  emit("cancel");
  emit("update:visible", false);
}
</script>

<style scoped>
.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon-palette {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  justify-items: center;
  gap: 0.375rem;
  margin-bottom: 0.5rem;
}

.icon-swatch {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-swatch:hover {
  transform: scale(1.1);
}

.icon-swatch.selected {
  background: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.upload-icon-button.upload-selected {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.upload-icon-button.drop-active {
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.7);
}

.swatch-icon {
  width: 18px;
  height: 18px;
  opacity: 0.85;
}

.icon-swatch:hover .swatch-icon {
  opacity: 1;
}
</style>
