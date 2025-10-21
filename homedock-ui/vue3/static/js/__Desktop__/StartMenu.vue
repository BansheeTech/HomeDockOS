<!-- homedock-ui/vue3/static/js/__Desktop__/StartMenu.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 z-[2000] flex items-end justify-center pb-[58px] md:pb-[62px] max-md:bottom-14 max-md:pb-0" :class="desktopStore.startMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'" @click="handleWrapperClick" @contextmenu="handleWrapperContextMenu">
    <Transition name="start-menu">
      <div v-show="desktopStore.startMenuOpen" class="rounded-xl w-[600px] max-h-[700px] flex flex-col overflow-hidden pointer-events-auto" :class="[themeClasses.startMenuPanelBg, themeClasses.startMenuPanelBorder, themeClasses.startMenuPanelShadow, { 'start-menu-fullscreen': isMobile }]">
        <div class="p-3 max-md:!p-3 max-md:!px-4 max-md:!pt-4" :class="themeClasses.startMenuSectionBg">
          <div class="relative flex items-center gap-3">
            <Icon :icon="searchIcon" :class="themeClasses.startMenuSearchIcon" class="absolute left-4 w-5 h-5 pointer-events-none" />
            <input ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Search apps..." class="flex-1 py-3 pr-4 pl-12 rounded-lg border text-sm outline-none transition-all duration-200" :class="[themeClasses.startMenuSearchInput, themeClasses.startMenuSearchInputText, themeClasses.startMenuSearchInputFocusRing]" />
            <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 p-2 border-none bg-transparent cursor-pointer rounded transition-all duration-150" :class="[themeClasses.startMenuClearButton, themeClasses.startMenuClearButtonHover]">
              <Icon :icon="closeIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Pinned Apps (Not Implemented Yet for Future use) -->
        <div v-if="pinnedApps.length > 0" class="flex-shrink-0 px-6 py-3 max-md:!px-4 max-md:!py-2 md:overflow-y-auto max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">Pinned</h3>
          <div class="md:grid md:gap-3 w-full max-md:flex max-md:overflow-x-auto max-md:gap-3 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
            <div v-for="app in pinnedApps" :key="app.id" class="app-item max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)">
              <div class="app-icon" :class="[{ 'bg-transparent p-0': app.type === 'docker' }, app.type === 'system' ? themeClasses.startMenuAppIconBg : '', getContainerClasses(app)]">
                <Icon v-if="app.type === 'system' && app.icon" :icon="app.icon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                <Icon v-else-if="app.type === 'system'" :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                <BaseImage v-else-if="app.type === 'docker' && app.image_path" :src="app.image_path" alt="" class="w-full h-full object-cover rounded-[10px]" draggable="false" />
              </div>
              <span class="text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ app.name }}</span>
            </div>
          </div>
        </div>

        <div class="flex-shrink-0 px-6 py-2 pt-4 max-md:!px-4 max-md:!py-2 max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">System Applications</h3>
          <div class="md:max-h-[11.5rem] md:overflow-y-auto md:pr-2 apps-section-scroll max-md:overflow-y-visible">
            <div class="md:grid md:gap-1 w-full max-md:flex max-md:overflow-x-auto max-md:gap-1 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
              <div v-for="app in filteredSystemApps" :key="app.id" class="app-item max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)">
                <div class="app-icon" :class="themeClasses.startMenuAppIconBg">
                  <Icon v-if="app.icon" :icon="app.icon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                  <Icon v-else :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                </div>
                <span class="text-xs text-center w-full overflow-hidden whitespace-nowrap max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ app.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredInstalledApps.length > 0" class="flex-shrink-0 px-6 py-2 max-md:!px-4 max-md:!py-2 max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">Installed Applications</h3>
          <div class="md:max-h-[11.5rem] md:overflow-y-auto md:pr-2 apps-section-scroll max-md:overflow-y-visible">
            <div class="md:grid md:gap-1 w-full max-md:flex max-md:overflow-x-auto max-md:gap-1 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
              <div v-for="app in filteredInstalledApps" :key="app.id" class="app-item max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)">
                <div class="app-icon bg-transparent p-0" :class="getContainerClasses(app)">
                  <BaseImage v-if="app.image_path" :src="app.image_path" alt="" class="w-full h-full object-cover rounded-[10px]" draggable="false" />
                  <Icon v-else :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                </div>
                <span class="text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ app.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-4 px-6 py-1" :class="[themeClasses.startMenuSocialBg, themeClasses.startMenuSocialBorderTop]">
          <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="GitHub">
            <Icon :icon="githubIcon" width="16" height="16" />
          </a>
          <a href="https://www.homedock.cloud" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="Website">
            <Icon :icon="websiteIcon" width="16" height="16" />
          </a>
          <a href="https://docs.homedock.cloud" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="Documentation">
            <Icon :icon="docsIcon" width="16" height="16" />
          </a>
          <a href="https://discord.gg/Zj3JCYsRWw" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="Discord">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-[16px] h-[16px]" viewBox="0 0 24 24">
              <path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
            </svg>
          </a>
        </div>

        <div class="flex items-center justify-between px-6 py-4 max-md:!px-4 max-md:!py-3" :class="[themeClasses.startMenuFooterBg, themeClasses.startMenuFooterBorder]">
          <div class="flex items-center gap-3">
            <Icon :icon="accountIcon" width="24" height="24" class="max-md:!w-5 max-md:!h-5" :class="themeClasses.startMenuUserAvatarColor" />
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center text-sm font-medium max-md:!text-[0.8125rem]" :class="themeClasses.startMenuUserNameText">
                <UserGreeting /><span>,</span>
                <span class="ml-1 username_catcher">{{ userName }}</span>
              </div>
              <div class="text-xs opacity-50 max-md:!text-[0.6875rem]" :class="themeClasses.startMenuUserNameText">
                <WelcomeMessage />
              </div>
            </div>
          </div>
          <button class="flex items-center justify-center w-9 h-9 rounded-lg border-0 cursor-pointer transition-all max-md:!w-10 max-md:!h-10" :class="[themeClasses.startMenuLogoutBg, themeClasses.startMenuLogoutText, themeClasses.startMenuLogoutBgHover, themeClasses.startMenuLogoutTextHover]" @click="handleLogout" title="Logout">
            <Icon :icon="logoutIcon" width="20" height="20" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, watch, nextTick } from "vue";

import { useDesktopStore, DockerApp } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { getStartMenuApps } from "../__Config__/WindowDefaultDetails";
import { useResponsive } from "../__Composables__/useResponsive";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import closeIcon from "@iconify-icons/mdi/close";
import accountIcon from "@iconify-icons/mdi/account-circle";
import logoutIcon from "@iconify-icons/mdi/logout";
import defaultAppIcon from "@iconify-icons/mdi/application";
import githubIcon from "@iconify-icons/mdi/github";
import websiteIcon from "@iconify-icons/mdi/web";
import docsIcon from "@iconify-icons/mdi/lifebuoy";

import BaseImage from "../__Components__/BaseImage.vue";
import UserGreeting from "../__Components__/UserGreeting.vue";
import WelcomeMessage from "../__Components__/WelcomeMessage.vue";

import { clientSignOut } from "../__Services__/ClientSignOut";

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const { isMobile, gridColumns } = useResponsive();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const settingsData = inject<{ userName: string }>("data-settings");
const userName = computed(() => settingsData?.userName || "User");

const searchQuery = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

const systemApps = getStartMenuApps();

interface CombinedApp {
  id: string;
  name: string;
  description?: string;
  icon?: any;
  image_path?: string;
  type: "system" | "docker";
  dockerApp?: DockerApp;
}

const systemApplications = computed<CombinedApp[]>(() => {
  return systemApps.map((app) => ({
    id: app.id,
    name: app.name,
    description: app.description,
    icon: app.icon,
    type: "system" as const,
  }));
});

const installedApplications = computed<CombinedApp[]>(() => {
  const statusPriority: Record<string, number> = {
    running: 1,
    paused: 2,
    created: 3,
    exited: 4,
  };

  return desktopStore.mainDockerApps
    .map((dockerApp) => ({
      id: `docker:${dockerApp.id}`,
      name: dockerApp.display_name || dockerApp.name,
      description: dockerApp.image,
      image_path: dockerApp.image_path,
      type: "docker" as const,
      dockerApp,
    }))
    .sort((a, b) => {
      const priorityA = statusPriority[a.dockerApp?.status || ""] || 999;
      const priorityB = statusPriority[b.dockerApp?.status || ""] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name);
    });
});

const allApps = computed<CombinedApp[]>(() => {
  return [...systemApplications.value, ...installedApplications.value];
});

const pinnedApps = computed(() => {
  return allApps.value.filter((app) => desktopStore.pinnedApps.includes(app.id));
});

const filteredSystemApps = computed(() => {
  if (!searchQuery.value) {
    return systemApplications.value;
  }

  const query = searchQuery.value.toLowerCase();
  return systemApplications.value.filter((app) => app.name.toLowerCase().includes(query) || (app.description && app.description.toLowerCase().includes(query)));
});

const filteredInstalledApps = computed(() => {
  if (!searchQuery.value) {
    return installedApplications.value;
  }

  const query = searchQuery.value.toLowerCase();
  return installedApplications.value.filter((app) => app.name.toLowerCase().includes(query) || (app.description && app.description.toLowerCase().includes(query)));
});

function getContainerClasses(app: CombinedApp): string {
  if (app.type !== "docker" || !app.dockerApp) return "";

  const statusClasses: Record<string, string> = {
    running: "",
    paused: "brightness-50 opacity-75",
    exited: "grayscale brightness-50 opacity-75",
    created: "brightness-50 sepia opacity-50",
  };

  return statusClasses[app.dockerApp.status] || "";
}

function openApp(app: CombinedApp) {
  if (app.type === "system") {
    desktopStore.openSystemApp(app.id);
  } else if (app.type === "docker" && app.dockerApp) {
    const isRunning = app.dockerApp.status === "running";

    if (isRunning && app.dockerApp.service_url) {
      desktopStore.openDockerApp(app.dockerApp);
    } else {
      windowStore.openWindow("properties", {
        title: `${app.dockerApp.display_name || app.dockerApp.name} - Properties`,
        data: { appId: app.dockerApp.id },
        allowMultiple: true,
      });
    }
  }
  close();
}

function close() {
  desktopStore.closeStartMenu();
  searchQuery.value = "";
}

function clearSearch() {
  searchQuery.value = "";
}

function handleWrapperClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close();
  }
}

async function handleWrapperContextMenu(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    event.preventDefault();
    const x = event.clientX;
    const y = event.clientY;

    close();

    await nextTick();

    const desktopElement = document.querySelector(".desktop-icons-container") as HTMLElement;
    if (desktopElement) {
      const contextMenuEvent = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
      });
      desktopElement.dispatchEvent(contextMenuEvent);
    }
  }
}

function handleLogout() {
  clientSignOut(csrfToken.value);
}

watch(
  () => desktopStore.startMenuOpen,
  (isOpen) => {
    if (isOpen && !isMobile.value) {
      nextTick(() => {
        setTimeout(() => {
          if (searchInputRef.value) {
            searchInputRef.value.focus();
          }
        }, 100);
      });
    }
  }
);
</script>

<style scoped>
@media (max-width: 768px) {
  .start-menu-fullscreen {
    width: 100vw !important;
    max-width: 100vw !important;
    max-height: 100% !important;
    border-radius: 12px 12px 0 0 !important;
    border: none !important;
    border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    -webkit-overflow-scrolling: touch;
  }

  .start-menu-fullscreen {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .start-menu-fullscreen::-webkit-scrollbar {
    display: none;
  }
}

@media (min-width: 769px) {
  .start-menu-fullscreen {
    width: 100% !important;
    height: auto !important;
    max-height: 80vh !important;
    border-radius: 12px 12px 0 0 !important;
  }
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  min-width: 0;
}

@media (max-width: 768px) {
  .app-item {
    padding: 0.5rem 0.25rem !important;
    gap: 0.375rem !important;
  }
}

.app-item:hover {
  transform: translateY(-2px);
}

.app-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 10px;
  transition: all 0.2s ease;
  overflow: hidden;
}

@media (max-width: 768px) {
  .app-icon {
    width: 44px !important;
    height: 44px !important;
  }
}

.app-item:hover .app-icon {
  transform: scale(1.1);
}

/* Vue Transitions */
@media (min-width: 769px) {
  .start-menu-enter-active,
  .start-menu-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .start-menu-enter-from,
  .start-menu-leave-to {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
}

/* Transitions - Mobile slide up */
@media (max-width: 768px) {
  .start-menu-enter-active,
  .start-menu-leave-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .start-menu-enter-from,
  .start-menu-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }

  .apps-scroll-container {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .apps-scroll-container::-webkit-scrollbar {
    display: none;
  }

  .apps-scroll-container .app-item {
    width: 90px;
    min-width: 90px;
  }
}
</style>
