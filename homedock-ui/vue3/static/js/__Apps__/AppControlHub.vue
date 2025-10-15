<!-- homedock-ui/vue3/static/js/__Apps__/AppControlHub.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-controlhub flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto p-5">
      <ControlHubRender :apps="apps" :isLoading="isLoading" />
    </div>

    <StatusBar :icon="nutIcon" :message="`${apps.length} ${apps.length === 1 ? 'app' : 'apps'} installed`" :info="`${runningAppsCount} running`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="nutIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Control Hub</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Centralized interface for managing all your installed applications. Export and import configurations, edit app specific settings with save or recreate options, and monitor real-time logs for debugging. Complete control over all your applications in one place.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { Icon } from "@iconify/vue";

import ControlHubRender from "../__Components__/ControlHubRender.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import nutIcon from "@iconify-icons/mdi/nut";

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();

const apps = computed(() => desktopStore.mainDockerApps);
const runningAppsCount = computed(() => apps.value.filter((app) => app.status === "running").length);
const isLoading = computed(() => false);
</script>
