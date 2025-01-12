<!-- homedock-ui/vue3/static/js/__Layouts__/SystemLogs.vue -->
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
          <div class="mb-4">
            <Card title="Login attempts" body="In-depth recent login attempts" :mdi_icon="accountAlertIcon" id="loginAttempts" :collapsible="true">
              <LoginAttempts />
            </Card>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-4">
            <div>
              <Card title="CPU Temperature" body="In-depth CPU insights" :mdi_icon="thermometherLowIcon" id="cpuTemp" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_temperature" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="°c" :streamFill="[1]" />
              </Card>
            </div>
            <div>
              <Card title="CPU Usage" body="In-depth CPU insights" :mdi_icon="speedometerMediumIcon" id="cpuUsage" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_cpu_usage" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="%" :streamFill="[1]" />
              </Card>
            </div>
            <div>
              <Card title="RAM Usage" body="In-depth RAM insights" :mdi_icon="memoryIcon" id="ramUsage" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_ram_usage" :csrfToken="csrfToken" :streamLines="3" :streamData="['avg', 'max', 'min']" :streamStyle="['solid', 'dashed', 'dashed']" :streamBorderWidth="[3, 1, 1]" leftLegend="%" :streamFill="[1]" />
              </Card>
            </div>
            <div>
              <Card title="Network Usage" body="In-depth network insights" :mdi_icon="networkStrength2Icon" id="networkUsage" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_network_usage" :csrfToken="csrfToken" :streamLines="2" :streamData="['download', 'upload']" :streamStyle="['solid', 'dashed']" :streamBorderWidth="[3, 1]" leftLegend="GBs" :streamFill="[1]" />
              </Card>
            </div>
            <div>
              <Card title="System Disk Usage" body="In-depth System Disk insights" :mdi_icon="microSdIcon" id="internalDiskUsage" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_disk_usage" :csrfToken="csrfToken" :streamLines="1" :streamData="['avg']" :streamStyle="['solid']" leftLegend="%" :streamFill="[1]" />
              </Card>
            </div>
            <div v-if="!settingsData.externalDiskDisabled">
              <Card title="External Disk Usage" body="In-depth external disk insights" :mdi_icon="hardDiskIcon" id="externalDiskUsage" :collapsible="true">
                <ChartDetails apiEndpoint="/api/system-logs/serve_external_disk_usage" :csrfToken="csrfToken" :streamData="['avg']" :streamStyle="['solid']" leftLegend="%" :streamFill="[1]" />
              </Card>
            </div>
          </div>
        </main>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { inject, ref } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import Favicon from "../__Components__/Favicon.vue";
import ScrollBarThemeLoader from "../__Components__/ScrollBarThemeLoader.vue";
import TopComment from "../__Components__/TopComment.vue";
import NetworkOffline from "../__Components__/NetworkOffline.vue";
import Footer from "../__Components__/Footer.vue";
import NavBar from "../__Components__/NavBar.vue";
import MenuBar from "../__Components__/MenuBar.vue";
import Card from "../__Components__/Card.vue";
import LoginAttempts from "../__Components__/LoginAttempts.vue";
import ChartDetails from "../__Components__/ChartDetails.vue";

import AeroPlusWallpaper from "../__Components__/AeroPlusWallpaper.vue";
import thermometherLowIcon from "@iconify-icons/mdi/thermometer-low";
import speedometerMediumIcon from "@iconify-icons/mdi/speedometer-medium";
import memoryIcon from "@iconify-icons/mdi/memory";
import networkStrength2Icon from "@iconify-icons/mdi/network-strength-2";
import microSdIcon from "@iconify-icons/mdi/micro-sd";
import hardDiskIcon from "@iconify-icons/mdi/harddisk";
import accountAlertIcon from "@iconify-icons/mdi/account-alert";

const settingsData = inject<{
  userName: string;
  externalDiskDisabled: boolean;
}>("data-settings");

if (!settingsData) {
  throw new Error("Settings data is missing!");
}

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");
const { themeClasses } = useTheme();

const activePath = ref("/system-logs");
</script>

<style scoped></style>
