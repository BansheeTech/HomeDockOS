<!-- homedock-ui/vue3/static/js/__Apps__/AppAppStore.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-appstore flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto p-4">
      <div class="mb-6">
        <SectionHeader title="Featured Apps" description="You better check these out!" :icon="licenseIcon">
          <template #action>
            <button @click="desktopStore.openSystemApp('packager')" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover, themeClasses.windowBorder]" class="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all duration-150">
              <Icon :icon="packageIcon" class="w-3.5 h-3.5" />
              <span>Add your own apps</span>
            </button>
          </template>
        </SectionHeader>
        <Banners />
      </div>

      <div>
        <SectionHeader title="App Store" description="Configure and install applications" :icon="widgetsOutlineIcon" />
        <AppStoreSearch :apps="apps" />
        <AppStoreCategories :apps="apps" />
        <AppStoreList :apps="apps" />
      </div>
    </div>

    <StatusBar :icon="widgetsOutlineIcon" :message="`${appStore.apps.length} ${appStore.apps.length === 1 ? 'app' : 'apps'} available`" :info="`${installedAppsCount} installed`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="widgetsOutlineIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">App Store</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Discover and install curated applications for your HomeDock OS. Browse curated apps, search by category, and manage your installed applications. All apps are containerized and run securely within your HomeDock OS environment.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, computed } from "vue";
import { useAppStore } from "../__Stores__/useAppStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { Icon } from "@iconify/vue";

import SectionHeader from "../__Components__/SectionHeader.vue";
import Banners from "../__Components__/Banners.vue";
import AppStoreSearch from "../__Components__/AppStoreSearch.vue";
import AppStoreCategories from "../__Components__/AppStoreCategories.vue";
import AppStoreList from "../__Components__/AppStoreList.vue";
import StatusBar from "../__Components__/StatusBar.vue";

import licenseIcon from "@iconify-icons/mdi/license";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import packageIcon from "@iconify-icons/mdi/package-variant";

import { useDesktopStore } from "../__Stores__/desktopStore";

const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const apps = ref([]);
const appStore = useAppStore();

const csrfToken = useCsrfToken();

const installedAppsCount = computed(() => {
  return appStore.apps.filter((app) => app.is_installed).length;
});

onMounted(() => {
  appStore.loadApps(csrfToken.value);
});
</script>
