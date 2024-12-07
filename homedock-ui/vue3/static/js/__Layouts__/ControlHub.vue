<!-- src/static/js/__Layouts__/ControlHub.vue -->
<!-- Copyright © 2023-2025 Banshee -->
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
          <Card title="Control Hub" body="Streamline, supervise, synchronize..." :mdi_icon="nutIcon" id="controlHub" :collapsible="false">
            <ControlHubRender :apps="apps" :isLoading="isLoading" />
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

import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";
import ControlHubRender from "../__Components__/ControlHubRender.vue";

import nutIcon from "@iconify-icons/mdi/nut";

import { fetchContainers } from "../__Services__/DockerAPIFetchContainerData";

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");
const { themeClasses } = useTheme();

const activePath = ref("/control-hub");

interface App {
  name: string;
  HDRole: string;
  image: string;
}

const apps = ref<App[]>([]);
const isLoading = ref(true);

async function loadContainers(csrfToken: string) {
  try {
    isLoading.value = true;
    const fetchedApps = await fetchContainers(csrfToken);
    apps.value = fetchedApps;
  } catch (error) {
    console.error("Error loading containers:", error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadContainers(csrfToken.value);
});
</script>

<style scoped></style>
