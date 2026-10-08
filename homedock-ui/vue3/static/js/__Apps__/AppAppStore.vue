<!-- homedock-ui/vue3/static/js/__Apps__/AppAppStore.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootRef" class="app-appstore relative flex flex-col h-full overflow-hidden">
    <div class="flex flex-1 min-h-0">
      <AppStoreSidebar v-if="!isMobileLayout" :view="view" :query="appStore.searchQuery" :categories="appStore.categoryCounts" :installing-count="installingCount" :installed-count="appStore.installedCount" :updates-count="updatesCount" @update:view="selectView" @update:query="appStore.setSearchQuery" @add-own="openPackager" />

      <main ref="scrollRef" class="flex-1 min-w-0 min-h-0 overflow-y-auto">
        <div :class="isMobileLayout ? 'px-4 pt-3' : 'px-6 pt-5'" class="appstore-content pb-8">
          <template v-if="activeView !== 'updates'">
            <button v-if="isMobileLayout && activeView === 'category'" type="button" class="flex items-center -ml-1.5 mb-1 text-[15px] text-blue-500 cursor-pointer" @click="selectView('categories')">
              <Icon :icon="chevronLeftIcon" class="w-6 h-6" />
              <span>{{ $t("Categories") }}</span>
            </button>

            <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div class="min-w-0">
                <h1 :class="[themeClasses.storeModalAppName, isMobileLayout ? 'text-[28px] leading-tight' : 'text-2xl']" class="m-0 font-bold tracking-tight truncate">{{ pageTitle }}</h1>
                <p v-if="pageSubtitle" :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[13px]">{{ pageSubtitle }}</p>
              </div>
              <Segmented v-if="showSort" :value="appStore.sortMode" :options="sortOptions" size="small" :class="themeClasses.scopeSelector" @change="(value) => appStore.setSortMode(value as AppSortMode)" />
            </div>

            <div v-if="showMobileSearch" class="relative flex items-center mb-5">
              <Icon :icon="searchIcon" :class="[themeClasses.explorerSearchIcon]" class="absolute left-2.5 w-[18px] h-[18px] pointer-events-none" />
              <input :value="appStore.searchQuery" type="text" enterkeyhint="search" :placeholder="$t('Search apps...')" autocomplete="off" spellcheck="false" :class="[themeClasses.explorerSearchInput, themeClasses.explorerSearchInputText]" class="w-full h-9 pl-9 pr-9 rounded-[10px] border text-[15px] outline-hidden" @input="appStore.setSearchQuery(($event.target as HTMLInputElement).value)" />
              <button v-if="appStore.searchQuery" type="button" :aria-label="$t('Clear')" :class="[themeClasses.explorerClearButton]" class="absolute right-2 flex items-center justify-center w-5 h-5 cursor-pointer" @click="appStore.setSearchQuery('')">
                <Icon :icon="closeCircleIcon" class="w-[18px] h-[18px]" />
              </button>
            </div>
          </template>

          <Transition name="view-fade" mode="out-in">
            <AppStoreUpdates v-if="activeView === 'updates'" key="updates" :large="isMobileLayout" />
            <AppStoreDiscover v-else-if="activeView === 'discover'" key="discover" @select-category="(category) => selectView(`category:${category}`)" />
            <AppStoreCategoryList v-else-if="activeView === 'categories'" key="categories" :categories="appStore.categoryCounts" @select="(category) => selectView(`category:${category}`)" @add-own="openPackager" />
            <AppStoreInstalling v-else-if="activeView === 'installing'" key="installing" />
            <div v-else key="list">
              <Transition name="view-fade">
                <div v-if="isMobileLayout && activeView === 'installed' && installingCount" :class="[themeClasses.storeListSeparator]" class="mb-5 pb-2 border-b">
                  <AppStoreInstalling />
                </div>
              </Transition>
              <AppStoreList :empty-text="emptyText" />
            </div>
          </Transition>
        </div>
      </main>
    </div>

    <AppStoreTabBar v-if="isMobileLayout" :view="view" :updates-count="updatesCount" :installing-count="installingCount" @select="selectTab" />

    <AppStoreStoresTip :visible="showStoresTip" :compact="isMobileLayout" @dismiss="showStoresTip = false" @open-stores="openThirdPartyStores" />

    <StatusBar :icon="widgetsOutlineIcon" :message="`${appStore.apps.length} ${appStore.apps.length === 1 ? $t('app') : $t('apps')} ${$t('available')}`" :info="`${appStore.installedCount} ${$t('installed')}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <StatusBarHelpIcon :icon="widgetsOutlineIcon" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ $t("App Store") }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs md:leading-4 space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("Discover and install curated applications for your HomeDock OS. Browse curated apps, search by category, and manage your installed applications. All apps are containerized and run securely within your HomeDock OS environment.") }}</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, computed, watch, watchEffect } from "vue";
import { useI18n } from "vue-i18n";

import { useAppStore } from "../__Stores__/useAppStore";
import type { AppSortMode } from "../__Stores__/useAppStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useAppUpdateStore } from "../__Stores__/useAppUpdateStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import { Segmented } from "ant-design-vue";

import AppStoreSidebar from "../__Components__/AppStoreSidebar.vue";
import AppStoreTabBar from "../__Components__/AppStoreTabBar.vue";
import AppStoreDiscover from "../__Components__/AppStoreDiscover.vue";
import AppStoreCategoryList from "../__Components__/AppStoreCategoryList.vue";
import AppStoreInstalling from "../__Components__/AppStoreInstalling.vue";
import AppStoreStoresTip from "../__Components__/AppStoreStoresTip.vue";
import AppStoreList from "../__Components__/AppStoreList.vue";
import AppStoreUpdates from "../__Components__/AppStoreUpdates.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBarHelpIcon from "../__Components__/StatusBarHelpIcon.vue";

import { Icon } from "@iconify/vue";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeCircleIcon from "@iconify-icons/mdi/close-circle";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";

const MOBILE_ENTER_THRESHOLD = 600;
const MOBILE_EXIT_THRESHOLD = 680;

const { themeClasses } = useTheme();
const { t } = useI18n();

const appStore = useAppStore();
const desktopStore = useDesktopStore();
const updateStore = useAppUpdateStore();
const installationStore = useInstallationStore();
const windowStore = useWindowStore();
const csrfToken = useCsrfToken();

const rootRef = ref<HTMLElement | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const isMobileLayout = ref(false);
const view = ref("discover");

let resizeObserver: ResizeObserver | null = null;

const selectedCategory = computed(() => (view.value.startsWith("category:") ? view.value.slice("category:".length) : ""));

const activeView = computed(() => {
  if (appStore.searchQuery.trim()) return "search";
  if (selectedCategory.value) return "category";
  return view.value;
});

const updatesCount = computed(() => desktopStore.dockerApps.filter((app) => app.has_update === true && !updateStore.isUpdating(app.name)).length);

const installingCount = computed(() => (installationStore.currentlyInstalling ? 1 : 0) + installationStore.queue.length);

const sortOptions = computed(() => [
  { label: t("Recommended"), value: "recommended" },
  { label: t("Name"), value: "name" },
]);

const countLabel = (count: number) => `${count} ${count === 1 ? t("app") : t("apps")}`;

const pageTitle = computed(() => {
  switch (activeView.value) {
    case "search":
      return `“${appStore.searchQuery.trim()}”`;
    case "category":
      return t(selectedCategory.value);
    case "installed":
      return t("Installed Apps");
    case "categories":
      return t("Categories");
    case "installing":
      return t("Installing Apps");
    default:
      return t("Discover");
  }
});

const pageSubtitle = computed(() => {
  if (activeView.value === "discover") return t("Configure and install applications");
  if (activeView.value === "categories") return "";
  if (activeView.value === "installing") return countLabel(installingCount.value);
  return countLabel(appStore.matchingApps.length);
});

const showSort = computed(() => !["discover", "categories", "installing"].includes(activeView.value));

const showMobileSearch = computed(() => isMobileLayout.value && ["discover", "categories", "search"].includes(activeView.value));

const emptyText = computed(() => (activeView.value === "installed" ? t("Get started by installing your first application") : t("No applications available under this search term")));

function selectView(next: string) {
  view.value = next;
  appStore.setSearchQuery("");
  if (scrollRef.value) scrollRef.value.scrollTop = 0;
}

function selectTab(tab: string) {
  if (tab === "categories" && selectedCategory.value) return selectView("categories");
  if (tab === view.value && !appStore.searchQuery) {
    scrollRef.value?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  selectView(tab);
}

function openPackager() {
  desktopStore.openSystemApp("packager");
}

watch(isMobileLayout, (mobile) => {
  if (!mobile && view.value === "categories") view.value = "discover";
  if (mobile && view.value === "installing") view.value = "installed";
});

watch(installingCount, (count, previous) => {
  if (count === 0 && view.value === "installing") selectView("installed");
  if (count > 0 && previous === 0) offerStoresTip();
});

const STORES_TIP_KEY = "hdos-appstore-stores-tip-seen";
const STORES_TIP_DELAY = 900;

const showStoresTip = ref(false);

function storesTipSeen(): boolean {
  try {
    return localStorage.getItem(STORES_TIP_KEY) === "1";
  } catch {
    return true;
  }
}

function offerStoresTip() {
  if (storesTipSeen() || appStore.apps.some((app) => app.is_external)) return;
  try {
    localStorage.setItem(STORES_TIP_KEY, "1");
  } catch {
    return;
  }
  setTimeout(() => (showStoresTip.value = true), STORES_TIP_DELAY);
}

function openThirdPartyStores() {
  showStoresTip.value = false;
  const id = windowStore.openWindow("packager", { data: { tab: "stores" } });
  windowStore.updateWindowData(id, { tab: "stores" });
}

watchEffect(() => {
  const searching = activeView.value === "search";
  appStore.setListFilter({
    category: searching ? "" : selectedCategory.value,
    installedOnly: !searching && view.value === "installed",
  });
});

function updateMobileLayout(width: number) {
  if (width <= 0) return;
  if (!isMobileLayout.value && width < MOBILE_ENTER_THRESHOLD) isMobileLayout.value = true;
  else if (isMobileLayout.value && width > MOBILE_EXIT_THRESHOLD) isMobileLayout.value = false;
}

onMounted(() => {
  appStore.setSearchQuery("");
  appStore.loadApps(csrfToken.value);

  if (rootRef.value) {
    updateMobileLayout(rootRef.value.clientWidth);
    resizeObserver = new ResizeObserver((entries) => updateMobileLayout(entries[0]?.contentRect.width ?? 0));
    resizeObserver.observe(rootRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.appstore-content {
  container-type: inline-size;
  container-name: appstore-content;
}

.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.15s ease;
}

.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
}
</style>
