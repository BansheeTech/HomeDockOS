<!-- homedock-ui/vue3/static/js/__Components__/AppStoreAppCard.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.storeRowHover]" class="app-row group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer" @click="onInstall(app)">
    <!-- App Icon -->
    <div class="relative flex-shrink-0">
      <BaseImage draggable="false" :src="app.picture_path || 'docker-icons/notfound.jpg'" :alt="app.name" :class="[themeClasses.storeCardImageBack]" class="app-icon w-16 h-16 min-h-16 min-w-16 rounded-2xl drop-shadow-md ring-[1px]" />
      <Icon v-if="installationStore.currentlyInstalling === app.name" :icon="loadingIcon" :class="[themeClasses.storeIconLoadingInstalling]" class="absolute rounded-full top-2 left-2 w-12 h-12 text-current animate-spin" />
    </div>

    <!-- App Info -->
    <div class="flex flex-col flex-1 min-w-0 gap-0.5">
      <div class="flex items-center gap-2">
        <h3 :class="[themeClasses.storeCardTextAppName]" class="font-semibold text-sm truncate">
          {{ app.display_name || app.name }}
        </h3>
        <span v-if="isNew(app)" class="flex-shrink-0 text-[10px] font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-full">NEW</span>
        <span v-if="app.is_external" class="flex-shrink-0">
          <Icon :icon="packageIcon" class="w-3.5 h-3.5 text-amber-500" />
        </span>
      </div>
      <div class="relative h-4 overflow-hidden">
        <p :class="[themeClasses.storeCardSubtitle]" class="text-xs truncate absolute inset-0 transition duration-300 group-hover:opacity-0 group-hover:-translate-y-2">{{ app.type }}</p>
        <p :class="[themeClasses.storeCardTextRepo]" class="text-xs truncate absolute inset-0 opacity-0 translate-y-2 transition duration-300 group-hover:opacity-100 group-hover:translate-y-0">{{ app.docker_image }}</p>
      </div>
      <p :class="[themeClasses.storeDescription]" class="text-xs line-clamp-1 leading-relaxed">{{ app.description }}</p>
    </div>

    <!-- GET / Status Pill -->
    <div class="flex-shrink-0" @click.stop="onInstall(app)">
      <Transition name="pill-fade" mode="out-in">
        <button v-if="app.is_installed" key="installed" :class="[themeClasses.storeCardInstalledPill]" class="app-pill px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200">
          Installed
        </button>

        <button v-else-if="installationStore.currentlyInstalling === app.name" key="installing" :class="[themeClasses.storeCardInstallingPill]" class="app-pill px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5">
          <Icon :icon="loadingIcon" class="w-3 h-3 animate-spin" />
          <span>Installing</span>
        </button>

        <button v-else-if="installationStore.queue.includes(app.name)" key="queued" :class="[themeClasses.storeCardQueuedPill]" class="app-pill px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-1.5">
          <Icon :icon="queueIcon" class="w-3 h-3" />
          <span>Queued</span>
        </button>

        <button v-else key="get" :class="[themeClasses.storeCardGetPill]" class="app-pill px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200">
          GET
        </button>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTheme } from "../__Themes__/ThemeSelector";

import { useInstallationStore } from "../__Stores__/useInstallationStore";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import queueIcon from "@iconify-icons/mdi/queue";
import packageIcon from "@iconify-icons/mdi/package-variant-closed";

import { App } from "../__Types__/AppStoreApp";

import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const installationStore = useInstallationStore();

defineProps<{
  app: App;
  onInstall: (app: App) => void;
}>();

const isNew = (app: App) => {
  if (!app.is_new) return false;

  if (typeof app.new_until === "boolean") {
    return app.new_until;
  }

  if (typeof app.new_until === "string") {
    const today = new Date().toISOString().slice(0, 10);
    return new Date(app.new_until) >= new Date(today);
  }

  return false;
};
</script>

<style scoped>
.pill-fade-enter-active,
.pill-fade-leave-active {
  transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
}
.pill-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.pill-fade-enter-to {
  opacity: 1;
  transform: scale(1);
}
.pill-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
.pill-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.app-icon {
  transition: all 200ms ease;
}

.app-row:hover .app-icon {
  transform: scale(1.05);
}

.app-pill {
  transition: all 200ms ease;
}

.app-pill:hover {
  transform: scale(1.05);
}
</style>
