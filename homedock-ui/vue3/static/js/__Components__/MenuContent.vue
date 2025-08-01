<!-- homedock-ui/vue3/static/js/__Components__/MenuContent.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <ul class="space-y-1">
    <div :class="[themeClasses.menuSubMargin, mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-6']">
      <div :class="[mode === 'drawer' ? 'pt-6' : '']"></div>

      <li :class="[mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-1']">
        <span :class="['flex items-center space-x-1 font-bold uppercase text-[11px] ml-6', mode === 'sidebar' && isCollapsed ? 'justify-center' : '']">
          <Icon v-if="mode === 'drawer' || !isCollapsed" :icon="homeVariantIcon" class="min-w-3 min-h-3 h-3 w-3" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-1 text-ellipsis overflow-hidden">HomeDock OS</span>
        </span>
      </li>
      <li class="group">
        <a href="/dashboard" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/dashboard' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="landPlotsIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">Dashboard</span>
        </a>
      </li>
    </div>

    <div :class="[themeClasses.menuSubMargin, mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-6']">
      <li :class="[mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-1']">
        <div :class="['flex items-center space-x-1 font-bold uppercase text-[11px] ml-6', mode === 'sidebar' && isCollapsed ? 'justify-center' : '']">
          <Icon v-if="mode === 'drawer' || !isCollapsed" :icon="chartBubbleIcon" class="min-w-3 min-h-3 h-3 w-3" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-1 text-ellipsis overflow-hidden">Integrations</span>
        </div>
      </li>
      <li class="group">
        <a href="/app-store" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/app-store' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="widgetsOutlineIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">App Store</span>
        </a>
      </li>
      <li class="group">
        <a href="/control-hub" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/control-hub' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="nutIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">Control Hub</span>
        </a>
      </li>
      <li class="group">
        <a href="/system-logs" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/system-logs' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="chartTimelineVariantIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">System Logs</span>
        </a>
      </li>
      <li class="group">
        <a href="/drop-zone" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/drop-zone' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="cubeIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">Drop Zone</span>
        </a>
      </li>
    </div>

    <div :class="[themeClasses.menuSubMargin, mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-6']">
      <li :class="[mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-1']">
        <div :class="['flex items-center space-x-1 font-bold uppercase text-[11px] ml-6', mode === 'sidebar' && isCollapsed ? 'justify-center' : '']">
          <Icon v-if="mode === 'drawer' || !isCollapsed" :icon="cogIcon" class="min-w-3 min-h-3 h-3 w-3" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-1 text-ellipsis overflow-hidden">Settings</span>
        </div>
      </li>
      <li class="group">
        <a href="/settings" :class="['menu-link flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8', activePath === '/settings' ? themeClasses.menuActiveLink : themeClasses.menuInactiveLink]">
          <Icon :icon="tuneIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">Settings</span>
        </a>
      </li>
    </div>

    <div :class="[themeClasses.menuSubMargin]" class="pb-6">
      <li :class="[mode === 'sidebar' && isCollapsed ? 'pb-0' : 'pb-1']">
        <div :class="['flex items-center space-x-1 font-bold uppercase text-[11px] ml-6', mode === 'sidebar' && isCollapsed ? 'justify-center' : '']">
          <Icon v-if="mode === 'drawer' || !isCollapsed" :icon="connectionIcon" class="min-w-3 min-h-3 h-3 w-3" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-1 text-ellipsis overflow-hidden">Connection</span>
        </div>
      </li>
      <li class="group">
        <span @click="handleSignOut" :class="[themeClasses.menuInactiveLink, 'cursor-pointer flex items-center p-2 text-sm font-light rounded-lg w-full mb-2 transition duration-300 ease-in-out', mode === 'sidebar' && isCollapsed ? 'justify-center' : 'pl-8']">
          <Icon :icon="isSigningOut ? loadingIcon : accountOffIcon" class="h-5 w-5 min-w-5 min-h-5 transition duration-300 group-hover:scale-110" :class="{ 'animate-spin': isSigningOut }" />
          <span v-if="mode === 'drawer' || !isCollapsed" class="ml-4 text-ellipsis overflow-hidden">Sign Out</span>
        </span>
      </li>
    </div>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { Icon } from "@iconify/vue";
import homeVariantIcon from "@iconify-icons/mdi/home-variant";
import landPlotsIcon from "@iconify-icons/mdi/land-plots";
import chartBubbleIcon from "@iconify-icons/mdi/chart-bubble";
import widgetsOutlineIcon from "@iconify-icons/mdi/widgets-outline";
import nutIcon from "@iconify-icons/mdi/nut";
import chartTimelineVariantIcon from "@iconify-icons/mdi/chart-timeline-variant";
import cogIcon from "@iconify-icons/mdi/cog";
import tuneIcon from "@iconify-icons/mdi/tune";
import connectionIcon from "@iconify-icons/mdi/connection";
import accountOffIcon from "@iconify-icons/mdi/account-off";
import loadingIcon from "@iconify-icons/mdi/loading";
import cubeIcon from "@iconify-icons/mdi/cube";

const isSigningOut = ref(false);

const props = defineProps<{
  mode: "sidebar" | "drawer";
  themeClasses: Record<string, string>;
  activePath: string;
  isCollapsed?: boolean;
  onSignOut: () => void;
}>();

const handleSignOut = async () => {
  try {
    isSigningOut.value = true;
    props.onSignOut();
  } catch (error) {
    console.error("Error signing out:", error);
    isSigningOut.value = false;
  }
};
</script>
