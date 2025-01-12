<!-- src/static/js/__Layouts__/AppStore.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <AeroPlusWallpaper />
  <ScrollBarThemeLoader />
  <TopComment />
  <NetworkOffline />
  <div class="flex flex-col min-h-screen">
    <header class="top-0 left-0 z-10">
      <NavBar />
    </header>

    <div class="h-24"></div>
    <div class="flex flex-1 overflow-hidden">
      <aside class="hidden lg:block relative">
        <MenuBar :activePath="activePath" />
      </aside>
      <div :class="[themeClasses.back]" class="flex flex-col flex-1 pl-4 pt-3 pr-4 max-w-full overflow-x-hidden">
        <main class="flex-1 overflow-auto max-w-full holder">
          <Card title="Featured Apps" body="You better check these out!" :mdi_icon="licenseIcon" id="featuredApps" :collapsible="true">
            <Banners />
          </Card>

          <Card title="App Store" body="Configure and install applications" :mdi_icon="widgetsOutlineIcon" id="appStoreLegit" :collapsible="false">
            <AppStoreSearch :apps="apps" />
            <AppStoreCategories :apps="apps" />
            <AppStoreList :apps="apps" />
          </Card>
        </main>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useAppStore } from "../__Stores__/useAppStore";

import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";

import licenseIcon from "@iconify-icons/mdi/license";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";

import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import Banners from "../__Components__/Banners.vue";
import AppStoreSearch from "../__Components__/AppStoreSearch.vue";
import AppStoreCategories from "../__Components__/AppStoreCategories.vue";
import AppStoreList from "../__Components__/AppStoreList.vue";

const { themeClasses } = useTheme();
const activePath = "/app-store";
const apps = ref([]);

const appStore = useAppStore();

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

onMounted(() => {
  appStore.loadApps(csrfToken);
});
</script>

<style scoped></style>
