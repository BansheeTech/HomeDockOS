<!-- homedock-ui/vue3/static/js/__Layouts__/Dashboard.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Favicon />
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
        <MenuBar :activePath />
      </aside>
      <div :class="[themeClasses.back]" class="flex flex-col flex-1 pl-4 pt-3 pr-4 max-w-full overflow-x-hidden">
        <main class="flex-1 overflow-auto max-w-full holder">
          <Card title="System Stats" body="Real time host statistics" :mdi_icon="CardIconChip" id="sysStats" :collapsible="true">
            <StatsLoad :csrfToken="csrfToken" />
          </Card>

          <Card title="App Insights" body="Manage your apps" :mdi_icon="CardIconApps" id="appInsights" :collapsible="false">
            <template #actions>
              <DropdownActions :csrfToken="csrfToken" />
            </template>
            <template #default>
              <div class="overflow-x-auto">
                <AppRender />
              </div>
            </template>
          </Card>
        </main>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import Favicon from "../__Components__/Favicon.vue";
import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import StatsLoad from "../__Components__/StatsLoad.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";
import AppRender from "../__Components__/AppRender.vue";
import DropdownActions from "../__Components__/DropdownActions.vue";

import CardIconChip from "@iconify-icons/mdi/chip";
import CardIconApps from "@iconify-icons/mdi/apps";

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");
const { themeClasses } = useTheme();

const activePath = ref("/dashboard");
</script>

<style scoped></style>
