<!-- homedock-ui/vue3/static/js/__Components__/AppStoreAppCard.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.storeRowHover]" class="group flex items-center gap-3 h-[76px] -mx-2.5 px-2.5 rounded-[22px] cursor-pointer transition-colors duration-150" @click="openAppDetails(app)">
    <AppIconGraphic :image-src="app.picture_path || 'docker-icons/notfound.jpg'" :size="56">
      <div v-if="installationStore.currentlyInstalling === app.name" :class="[themeClasses.storeIconLoadingInstalling]" class="absolute inset-0 rounded-[inherit] flex items-center justify-center">
        <Icon :icon="loadingIcon" class="w-7 h-7 animate-spin" />
      </div>
    </AppIconGraphic>

    <div :class="[themeClasses.storeListSeparator]" class="flex-1 min-w-0 self-stretch flex items-center gap-3 border-b">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 min-w-0">
          <h3 :class="[themeClasses.storeModalAppName]" class="m-0 text-[13px] font-semibold truncate">{{ app.display_name || app.name }}</h3>
          <span v-if="app.is_new" class="flex-shrink-0 text-[10px] font-semibold text-blue-500">NEW</span>
          <Icon v-if="app.is_external" :icon="packageIcon" class="flex-shrink-0 w-3.5 h-3.5 text-amber-500" />
        </div>
        <p :class="[themeClasses.storeCardSubtitle]" class="m-0 text-xs truncate">{{ app.type }}</p>
        <p :class="[themeClasses.storeDescription]" class="m-0 text-[11px] truncate">{{ app.description }}</p>
      </div>

      <div class="flex-shrink-0" @click.stop>
        <Transition name="pill-fade" mode="out-in">
          <span v-if="installationStore.currentlyInstalling === app.name" key="installing" :class="[themeClasses.storeCardInstallingPill]" class="flex items-center justify-center gap-1.5 min-w-[76px] h-7 px-3 rounded-full text-xs font-bold">
            <Icon :icon="loadingIcon" class="w-3 h-3 animate-spin" />
            <span>{{ $t("Installing") }}</span>
          </span>

          <span v-else-if="installationStore.queue.includes(app.name)" key="queued" :class="[themeClasses.storeCardQueuedPill]" class="flex items-center justify-center gap-1.5 min-w-[76px] h-7 px-3 rounded-full text-xs font-bold">
            <Icon :icon="queueIcon" class="w-3 h-3" />
            <span>{{ $t("Queued") }}</span>
          </span>

          <button v-else-if="app.is_installed" key="open" :class="[themeClasses.storeCardInstalledPill]" class="min-w-[76px] h-7 px-4 rounded-full border-0 text-xs font-bold cursor-pointer transition-colors duration-150" @click="openInstalledApp(app)">
            {{ $t("Open") }}
          </button>

          <button v-else key="get" :class="[themeClasses.storeCardGetPill]" class="min-w-[76px] h-7 px-4 rounded-full border-0 text-xs font-bold cursor-pointer transition-colors duration-150" @click="openAppDetails(app)">
            {{ $t("Get") }}
          </button>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { useAppStoreActions } from "../__Composables__/useAppStoreActions";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import queueIcon from "@iconify-icons/mdi/queue";
import packageIcon from "@iconify-icons/mdi/package-variant-closed";

import { App } from "../__Types__/AppStoreApp";

import AppIconGraphic from "../__Components__/AppIconGraphic.vue";

defineProps<{
  app: App;
}>();

const { themeClasses } = useTheme();

const installationStore = useInstallationStore();
const { openAppDetails, openInstalledApp } = useAppStoreActions();
</script>

<style scoped>
.pill-fade-enter-active,
.pill-fade-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.pill-fade-enter-from,
.pill-fade-leave-to {
  opacity: 0;
}
</style>
