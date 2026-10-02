<!-- homedock-ui/vue3/static/js/__Components__/PackagerCreate.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <div class="mb-4">
      <h1 :class="[themeClasses.storeModalAppName, large ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ $t("Create Package") }}</h1>
      <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ $t("Turn any Docker Compose file into an app of your App Store") }}</p>
    </div>

    <div class="create-layout">
      <div class="min-w-0">
        <h2 :class="groupTitleClass">{{ $t("Identity") }}</h2>
        <div :class="groupClass">
          <label class="form-row cursor-pointer" @dragover.prevent @drop.prevent.stop="onIconDrop">
            <span class="relative flex-shrink-0">
              <AppIconGraphic v-if="iconPreview" :image-src="iconPreview" :size="44" />
              <span v-else :class="[themeClasses.storeListSeparator, themeClasses.storeCardSubtitle]" class="flex items-center justify-center w-11 h-11 rounded-[10px] border-[1.5px] border-dashed">
                <Icon :icon="imagePlusIcon" class="w-5 h-5" />
              </span>
            </span>
            <span class="flex-1 min-w-0">
              <span :class="[themeClasses.storeModalAppName]" class="block text-[13px]">{{ $t("Icon") }}</span>
              <span :class="[themeClasses.storeCardSubtitle]" class="block text-xs truncate">{{ iconFile ? iconFile.name : $t("Click or drag image here (.jpg, .png)") }}</span>
            </span>
            <input type="file" accept=".jpg,.jpeg,.png" class="hidden" @change="onIconPick" />
          </label>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-name">{{ $t("Name") }}</label>
            <input id="pkg-name" v-model="newPackage.display_name" :class="inputClass" placeholder="My Awesome App" />
          </div>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-slug">{{ $t("Slug") }}</label>
            <input id="pkg-slug" v-model="newPackage.slug" :class="inputClass" class="font-mono" placeholder="my-awesome-app" />
          </div>
          <p v-if="newPackage.slug && !isValidSlug(newPackage.slug)" :class="[themeClasses.packagerErrorText]" class="m-0 px-3 pb-2 -mt-1 text-[11px]">{{ $t("Only lowercase letters, numbers and dashes. Cannot start or end with a dash.") }}</p>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-type">{{ $t("Type") }}</label>
            <input id="pkg-type" v-model="newPackage.type" :class="inputClass" placeholder="Media Server" />
          </div>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <span :class="labelClass">{{ $t("Category") }}</span>
            <Select v-model:value="newPackage.category" :bordered="false" :class="[themeClasses.scopeSelector]" :popup-class-name="themeClasses.scopeSelector" class="flex-1 min-w-0 -ml-3">
              <SelectOption v-for="category in CATEGORIES" :key="category" :value="category">{{ $t(category) }}</SelectOption>
            </Select>
          </div>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-description">{{ $t("Description") }}</label>
            <input id="pkg-description" v-model="newPackage.description" :maxlength="130" :class="inputClass" :placeholder="$t('Describe what this application does...')" />
            <span :class="[themeClasses.storeCardSubtitle]" class="text-[11px] tabular-nums flex-shrink-0">{{ newPackage.description.length }}/130</span>
          </div>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-author">{{ $t("Creator") }}</label>
            <input id="pkg-author" v-model="newPackage.author" :class="inputClass" :placeholder="$t('Your name or organization')" />
          </div>
        </div>

        <h2 :class="groupTitleClass">{{ $t("Container") }}</h2>
        <div :class="groupClass">
          <label class="form-row cursor-pointer" @dragover.prevent @drop.prevent.stop="onComposeDrop">
            <AppIconGraphic :icon="fileCodeIcon" :color="composeFile ? '#059669' : '#64748b'" :size="28" />
            <span class="flex-1 min-w-0">
              <span :class="[themeClasses.storeModalAppName]" class="block text-[13px] truncate">{{ composeFile ? composeFile.name : $t("Compose file") }}</span>
              <span :class="[composeFile && parsedData.image ? themeClasses.packagerSuccessText : themeClasses.storeCardSubtitle]" class="block text-xs truncate">{{ composeFile && parsedData.image ? `${$t("Detected")}: ${parsedData.image}` : $t("Click or drag .yml/.yaml file here") }}</span>
            </span>
            <button v-if="composeFile" type="button" :class="[themeClasses.storeCardGetPill]" class="flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold cursor-pointer flex-shrink-0" @click.prevent="openComposeEditor">
              <Icon :icon="editIcon" class="w-3.5 h-3.5" />
              <span>{{ $t("Edit Compose") }}</span>
            </button>
            <input type="file" accept=".yml,.yaml" class="hidden" @change="onComposePick" />
          </label>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-image">{{ $t("Docker Image") }}</label>
            <input id="pkg-image" v-model="newPackage.docker_image" :class="inputClass" class="font-mono" placeholder="myuser/myapp" />
            <button v-if="parsedData.image" type="button" :title="$t('Use detected image')" :class="[themeClasses.storeCardSubtitle]" class="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer flex-shrink-0 hover:opacity-70" @click="newPackage.docker_image = parsedData.image.split(':')[0]">
              <Icon :icon="refreshIcon" class="w-4 h-4" />
            </button>
          </div>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <label :class="labelClass" for="pkg-version">{{ $t("Version") }}</label>
            <input id="pkg-version" v-model="newPackage.version" :class="inputClass" class="font-mono" placeholder="latest" />
            <button v-if="parsedData.tag" type="button" :title="$t('Use detected version')" :class="[themeClasses.storeCardSubtitle]" class="flex items-center justify-center w-7 h-7 rounded-full cursor-pointer flex-shrink-0 hover:opacity-70" @click="newPackage.version = parsedData.tag">
              <Icon :icon="refreshIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <h2 :class="groupTitleClass">{{ $t("Extras") }}</h2>
        <div :class="groupClass">
          <div class="form-row">
            <div class="flex-1 min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px]">{{ $t("Add Default Credentials") }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs">{{ $t("If this app ships with hardcoded login credentials, specify them here so users know how to sign in.") }}</p>
            </div>
            <Switch v-model:checked="hasDefaultCredentials" size="small" :class="themeClasses.scopeSelector" />
          </div>
          <template v-if="hasDefaultCredentials">
            <div :class="dividerClass"></div>
            <div class="form-row">
              <label :class="labelClass" for="pkg-user">{{ $t("Username") }}</label>
              <input id="pkg-user" v-model="newPackage.default_username" :class="inputClass" placeholder="admin" />
            </div>
            <div :class="dividerClass"></div>
            <div class="form-row">
              <label :class="labelClass" for="pkg-password">{{ $t("Password") }}</label>
              <input id="pkg-password" v-model="newPackage.default_password" :class="inputClass" placeholder="admin123" />
            </div>
          </template>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <div class="flex-1 min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px]">{{ $t("Add Suggested Port") }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs">{{ $t("For apps using network_mode: host that don't expose ports explicitly. HomeDock OS will use this port for the access button when no port mappings are detected.") }}</p>
            </div>
            <Switch v-model:checked="hasSuggestedPort" size="small" :class="themeClasses.scopeSelector" />
          </div>
          <template v-if="hasSuggestedPort">
            <div :class="dividerClass"></div>
            <div class="form-row">
              <label :class="labelClass" for="pkg-port">{{ $t("Port") }}</label>
              <input id="pkg-port" v-model="newPackage.suggested_port" :class="inputClass" class="font-mono" placeholder="8080" />
            </div>
          </template>
          <div :class="dividerClass"></div>
          <div class="form-row">
            <div class="flex-1 min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px]">{{ $t("Add Suggested Trail") }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs">{{ $t("Path suffix appended after the port in the access URL. For apps that don't serve their UI at root.") }}</p>
            </div>
            <Switch v-model:checked="hasSuggestedTrail" size="small" :class="themeClasses.scopeSelector" />
          </div>
          <template v-if="hasSuggestedTrail">
            <div :class="dividerClass"></div>
            <div class="form-row">
              <label :class="labelClass" for="pkg-trail">{{ $t("URL Trail") }}</label>
              <input id="pkg-trail" v-model="newPackage.suggested_trail" :class="inputClass" class="font-mono" placeholder="admin" />
            </div>
          </template>
        </div>

        <div class="flex justify-end mt-4">
          <button type="button" :disabled="!canCreate || isCreating" class="flex items-center gap-2 h-8 px-5 rounded-full bg-blue-600 text-white text-xs font-semibold cursor-pointer transition-colors duration-150 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-blue-600" @click="createPackage">
            <Icon v-if="isCreating" :icon="loadingIcon" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ isCreating ? $t("Creating Package...") : $t("Create & Download .hds Package") }}</span>
          </button>
        </div>
      </div>

      <aside class="create-preview min-w-0">
        <h2 :class="groupTitleClass">{{ $t("How it will look in the App Store") }}</h2>
        <div :class="[themeClasses.storeInfoBar]" class="rounded-2xl border px-4 pt-4">
          <div :class="[themeClasses.storeListSeparator]" class="flex items-center gap-3.5 pb-4 border-b">
            <AppIconGraphic v-if="iconPreview" :image-src="iconPreview" :size="64" />
            <AppIconGraphic v-else :icon="packageIcon" :size="64" />
            <div class="min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[17px] font-bold truncate">{{ previewName }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ previewType }} · {{ $t(newPackage.category) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-3 h-[76px]">
            <AppIconGraphic v-if="iconPreview" :image-src="iconPreview" :size="52" />
            <AppIconGraphic v-else :icon="packageIcon" :size="52" />
            <div class="flex-1 min-w-0">
              <p :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold truncate">{{ previewName }}</p>
              <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ previewType }}</p>
              <p :class="[themeClasses.storeDescription]" class="m-0 text-[11px] truncate">{{ newPackage.description || $t("Describe what this application does...") }}</p>
            </div>
            <span :class="[themeClasses.storeCardGetPill]" class="flex items-center justify-center min-w-[68px] h-7 px-3.5 rounded-full text-xs font-bold flex-shrink-0">{{ $t("Get") }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { usePackager, isValidSlug } from "../__Composables__/usePackager";

import { Select, SelectOption, Switch } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import imagePlusIcon from "@iconify-icons/mdi/image-plus-outline";
import fileCodeIcon from "@iconify-icons/mdi/file-code-outline";
import editIcon from "@iconify-icons/mdi/pencil-outline";
import refreshIcon from "@iconify-icons/mdi/refresh";
import loadingIcon from "@iconify-icons/mdi/loading";
import packageIcon from "@iconify-icons/mdi/package-variant";

import AppIconGraphic from "./AppIconGraphic.vue";

defineProps<{
  large?: boolean;
}>();

const CATEGORIES = ["AI", "Developer Tools", "Files & Productivity", "Gaming", "Home & Automation", "Media", "Networking", "Social", "Web Development"];

const { themeClasses } = useTheme();
const { newPackage, iconFile, iconPreview, composeFile, parsedData, hasDefaultCredentials, hasSuggestedPort, hasSuggestedTrail, canCreate, isCreating, loadIconFile, loadComposeFile, openComposeEditor, createPackage } = usePackager();

const groupTitleClass = computed(() => [themeClasses.value.storeCardSubtitle, "m-0 mt-5 first:mt-0 mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider"]);
const groupClass = computed(() => [themeClasses.value.storeInfoBar, "rounded-xl border overflow-hidden"]);
const dividerClass = computed(() => [themeClasses.value.storeInfoBarDivider, "h-px ml-3"]);
const labelClass = computed(() => [themeClasses.value.storeCardSubtitle, "w-28 flex-shrink-0 text-[13px]"]);
const inputClass = computed(() => [themeClasses.value.storeModalAppName, "flex-1 min-w-0 h-8 bg-transparent text-[13px] outline-none placeholder:opacity-40"]);

const previewName = computed(() => newPackage.value.display_name || "My Awesome App");
const previewType = computed(() => newPackage.value.type || "Application");

function firstFile(event: Event | DragEvent): File | undefined {
  if ("dataTransfer" in event && event.dataTransfer) return event.dataTransfer.files?.[0];
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  return file;
}

function onIconPick(event: Event) {
  const file = firstFile(event);
  if (file) loadIconFile(file);
}

function onIconDrop(event: DragEvent) {
  const file = firstFile(event);
  if (file) loadIconFile(file);
}

function onComposePick(event: Event) {
  const file = firstFile(event);
  if (file) loadComposeFile(file);
}

function onComposeDrop(event: DragEvent) {
  const file = firstFile(event);
  if (file) loadComposeFile(file);
}
</script>

<style scoped>
.create-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 6px 12px;
}

@container packager-content (min-width: 820px) {
  .create-layout {
    grid-template-columns: minmax(0, 1fr) 300px;
  }

  .create-preview {
    position: sticky;
    top: 0;
  }
}
</style>
