<!-- src/static/js/__Components__/NavBar.vue -->
<!-- Copyright © 2023-2025 Banshee -->
<!-- https://www.banshee.pro -->

<template>
  <div :class="[themeClasses.back, themeClasses.aeroExtraScope]" class="h-[92px] flex fixed top-0 w-full">
    <div :class="['flex justify-start items-center p-4 pl-6 lg:pl-10 transition-all duration-300 ease-in-out', isMenuCollapsed ? 'w-[108px]' : 'w-[220px]']">
      <div class="mr-3 hidden lg:block">
        <button :class="[themeClasses.hambIcon]" @click="toggleMenu">
          <Icon :class="{ rotate: !isMenuCollapsed }" :icon="menuIcon" class="mr-0.5 transition duration-300" width="24" height="24" />
        </button>
      </div>
      <a draggable="false" class="brand-logo" href="/dashboard">
        <BaseImage draggable="false" :class="[themeClasses.logo, 'transition-all duration-300 ease-in-out', isMenuCollapsed ? 'w-0 h-0 overflow-hidden' : 'w-[34px] h-[34px]']" src="/images/logo_trans.svg" alt="logo" />
      </a>
    </div>

    <div class="flex-grow flex items-center justify-between p-2">
      <span class="font-semibold hidden lg:block">
        <h1 class="text-[28px] mb-0">
          <UserGreeting :class="[themeClasses.greetingMain]" />
          <span :class="[themeClasses.greetingMain]" class="font-light">,</span>
          <span :class="[themeClasses.greetingNext]" class="font-medium ml-2">{{ settingsData.userName }}</span>
        </h1>
        <h3 :class="[themeClasses.greetingMain]" class="font-normal mb-0">Welcome to HomeDock OS</h3>
      </span>

      <div class="flex items-center justify-end w-full lg:w-auto">
        <Space direction="vertical" class="mr-4 mb-1">
          <DatePicker :popupClassName="themeClasses.scopeSelector" :class="[themeClasses.datePicker, themeClasses.scopeSelector]" v-model:value="currentDate" :inputReadOnly="true" :autofocus="false" :allowClear="false" class="w-32 mt-1 hidden lg:block" />
        </Space>

        <NotificationBell class="px-4 mt-1" />

        <a href="#" class="px-3">
          <Icon :class="[themeClasses.navBarIcon]" :icon="accountIcon" class="w-5 h-5" />
        </a>

        <div class="px-3 mt-2 block lg:hidden">
          <button :class="[themeClasses.hambIcon]" @click="toggleDrawer">
            <Icon :class="{ rotate: !isMenuCollapsed }" :icon="menuIcon" class="mr-0.5 transition duration-300" width="24" height="24" />
          </button>

          <Drawer :class="[themeClasses.scopeSelector]" v-model:open="isDrawerOpen" placement="right" :closable="false" width="280">
            <MenuContent :mode="'drawer'" :themeClasses="themeClasses" :activePath="activePath" :onSignOut="handleSignOut" />
          </Drawer>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { useUserInterfaceStore } from "../__Stores__/useUserInterface";

import { DatePicker, Space, Drawer } from "ant-design-vue";
import dayjs from "dayjs";

import { Icon } from "@iconify/vue";
import menuIcon from "@iconify-icons/mdi/menu";
import accountIcon from "@iconify-icons/mdi/account";

import BaseImage from "../__Components__/BaseImage.vue";
import UserGreeting from "../__Components__/UserGreeting.vue";
import NotificationBell from "../__Components__/NotificationBell.vue";
import MenuContent from "../__Components__/MenuContent.vue";

import { clientSignOut } from "../__Services__/ClientSignOut";

const settingsData = inject<{
  userName: string;
}>("data-settings");

if (!settingsData) {
  throw new Error("Settings data is missing!");
}

const currentDate = ref<dayjs.Dayjs>(dayjs());
const userInterfaceStore = useUserInterfaceStore();
const { themeClasses } = useTheme();

const toggleMenu = () => {
  userInterfaceStore.toggleMenu();
};

const isMenuCollapsed = computed(() => userInterfaceStore.isMenuCollapsed);
const isDrawerOpen = ref(false);

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

const activePath = ref(window.location.pathname);

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

const handleSignOut = () => {
  clientSignOut(csrfToken);
};
</script>

<style scoped>
::v-deep(.ant-picker-input input) {
  cursor: pointer !important;
}

.rotate {
  transition: transform 0.3s;
  transform: rotate(180deg);
}

:global(.dark-mode-theme .ant-picker-panel-container) {
  background-color: rgb(24, 24, 27) !important;
}

:global(.aero-mode-theme .ant-picker-panel-container) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(200%) !important;
}

:global(.dark-mode-theme .ant-picker-cell-inner) {
  color: rgb(187, 187, 187) !important;
}

:global(.aero-mode-theme .ant-picker-cell-inner) {
  color: rgba(255, 255, 255, 0.526) !important;
}

:global(.dark-mode-theme .ant-picker-header-super-prev-btn) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-picker-header-super-prev-btn) {
  color: rgb(255, 255, 255) !important;
}

:global(.dark-mode-theme .ant-picker-header-super-next-btn) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-picker-header-super-next-btn) {
  color: rgb(255, 255, 255) !important;
}

:global(.dark-mode-theme .ant-picker-header-prev-btn) {
  color: rgb(137, 137, 137) !important;
}

:global(.aero-mode-theme .ant-picker-header-prev-btn) {
  color: rgba(255, 255, 255, 0.504) !important;
}

:global(.dark-mode-theme .ant-picker-header-next-btn) {
  color: rgb(137, 137, 137) !important;
}

:global(.aero-mode-theme .ant-picker-header-next-btn) {
  color: rgba(255, 255, 255, 0.504) !important;
}

:global(.dark-mode-theme .ant-picker-header-view) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-picker-header-view) {
  color: rgba(255, 255, 255, 0.499) !important;
}

:global(.dark-mode-theme thead th) {
  color: rgb(70, 70, 70) !important;
}

:global(.aero-mode-theme thead th) {
  color: rgb(255, 255, 255) !important;
}

:global(.dark-mode-theme .ant-picker-input) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-picker-input) {
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme .ant-picker-input input) {
  color: #909090 !important;
}

::v-deep(.aero-mode-theme .ant-picker-input input) {
  color: #ffffff8a !important;
}

::v-deep(.dark-mode-theme .ant-picker-suffix) {
  color: #909090 !important;
}

::v-deep(.aero-mode-theme .ant-picker-suffix) {
  color: #ffffff8a !important;
}

:global(.white-mode-theme.ant-drawer-content) {
  background-color: rgb(243, 244, 246) !important;
}

:global(.dark-mode-theme.ant-drawer-content) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme.ant-drawer-content) {
  background-color: rgba(0, 0, 0, 0) !important;
}

:global(.ant-drawer-content-wrapper) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(100%) !important;
}

:global(.ant-picker-dropdown.aero-mode-theme) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(100%) !important;
  overflow: hidden !important;
  border-radius: 8px !important;
}

:global(.ant-drawer-mask) {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>
