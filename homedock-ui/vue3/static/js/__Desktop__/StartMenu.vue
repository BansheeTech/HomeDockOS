<!-- homedock-ui/vue3/static/js/__Desktop__/StartMenu.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="fixed top-0 left-0 right-0 bottom-0 z-[2000]" :class="[isMobile ? '' : 'flex items-end justify-center pb-[58px] md:pb-[62px]', desktopStore.startMenuOpen ? 'pointer-events-auto' : 'pointer-events-none']" @click="handleWrapperClick" @contextmenu="handleWrapperContextMenu">
    <div v-if="isMobile" class="absolute left-0 right-0 top-0 pointer-events-none transition-opacity duration-[400ms] ease-out" :class="[themeClasses.startMenuOverlayBg, desktopStore.startMenuOpen ? 'opacity-100' : 'opacity-0']" :style="{ bottom: `${sheetInset}px` }"></div>

    <div v-if="isMobile" class="hd-sheet-clip absolute left-0 right-0 top-0 overflow-hidden pointer-events-none" :style="{ bottom: `${sheetInset}px` }">
      <Transition :css="false" @enter="onSheetEnter" @leave="onSheetLeave">
        <div v-show="desktopStore.startMenuOpen" ref="sheetRef" class="hd-sheet absolute left-0 right-0 -bottom-[48px] max-h-[calc(80%_+_48px)] flex flex-col pointer-events-auto">
          <div class="hd-sheet-glass absolute left-0 right-0 top-0 rounded-t-xl border-t pointer-events-none" :class="[themeClasses.startMenuSheetBg, themeClasses.startMenuPanelBorder]"></div>

          <div class="hd-sheet-header relative shrink-0 px-4 pt-2.5 pb-3" @touchstart="sheetTouchStart($event, 'header')" @touchmove="sheetTouchMove" @touchend="sheetTouchEnd" @touchcancel="sheetTouchEnd">
            <div ref="grabberRef" class="hd-grabber">
              <span class="hd-grabber-half hd-grabber-left" :class="themeClasses.startMenuSheetGrabber"></span>
              <span class="hd-grabber-half hd-grabber-right" :class="themeClasses.startMenuSheetGrabber"></span>
            </div>

            <div class="hd-stagger flex items-center gap-3" style="--hd-delay: 0ms">
              <Icon :icon="accountIcon" width="26" height="26" class="shrink-0" :class="themeClasses.startMenuUserAvatarColor" />
              <div class="min-w-0 flex-1">
                <div class="flex items-center overflow-hidden text-sm font-medium leading-tight" :class="themeClasses.startMenuUserNameText">
                  <UserGreeting /><span>,</span>
                  <span class="ml-1 min-w-0 truncate username_catcher">{{ userName }}</span>
                </div>
                <div class="truncate text-xs leading-tight opacity-50" :class="themeClasses.startMenuUserNameText">
                  <WelcomeMessage class="!inline" />
                </div>
              </div>
              <button class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 transition-transform duration-150 active:scale-90 cursor-pointer" :class="[themeClasses.startMenuLogoutBg, themeClasses.startMenuLogoutText, themeClasses.startMenuLogoutBgHover, themeClasses.startMenuLogoutTextHover]" @click="handleLogout" :title="$t('Logout')">
                <Icon :icon="logoutIcon" width="20" height="20" />
              </button>
            </div>

            <div class="hd-stagger relative mt-3 flex items-center" style="--hd-delay: 40ms">
              <Icon :icon="searchIcon" :class="themeClasses.startMenuSearchIcon" class="pointer-events-none absolute left-4 h-5 w-5" />
              <input v-model="searchQuery" type="text" enterkeyhint="search" :placeholder="$t('Search apps...')" class="w-full rounded-lg border py-2.5 pl-12 pr-11 text-sm outline-hidden transition-all duration-200" :class="[themeClasses.startMenuSearchInput, themeClasses.startMenuSearchInputText, themeClasses.startMenuSearchInputFocusRing]" />
              <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 rounded-lg border-none bg-transparent p-2 transition-transform duration-150 active:scale-90 cursor-pointer" :class="[themeClasses.startMenuClearButton, themeClasses.startMenuClearButtonHover]">
                <Icon :icon="closeIcon" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="relative mx-4 h-px shrink-0" :class="themeClasses.startMenuSheetHairline"></div>

          <div ref="sheetScrollRef" class="hd-sheet-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-[48px]" @touchstart="sheetTouchStart($event, 'body')" @touchmove="sheetTouchMove" @touchend="sheetTouchEnd" @touchcancel="sheetTouchEnd">
            <section v-if="pinnedApps.length > 0 && !searchQuery" class="hd-stagger mb-3" style="--hd-delay: 80ms">
              <h3 class="m-0 mb-2 px-2 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Pinned") }}</h3>
              <TransitionGroup tag="div" name="pin" class="hd-app-grid relative grid grid-cols-4 gap-1" @enter="onPinEnter" @leave="onPinLeave">
                <div v-for="app in pinnedApps" :key="app.key" :data-pin-key="app.key" class="hd-app-tile flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-transform duration-150 active:scale-90" :class="themeClasses.startMenuAppItemBg" @click="openApp(app)" @contextmenu.stop.prevent="openAppMenu($event, app)" @touchstart.passive="handleAppTouchStart($event, app)" @touchend="cancelLongPress" @touchmove="cancelLongPress">
                  <StartMenuAppIcon :app="app" :size="48" class="pointer-events-none" />
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ appName(app) }}</span>
                </div>
              </TransitionGroup>
            </section>

            <section v-for="(section, index) in mobileSections" :key="section.key" class="hd-stagger mb-3" :style="{ '--hd-delay': `${110 + index * 30}ms` }">
              <h3 class="m-0 mb-2 px-2 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t(section.title) }}</h3>
              <div class="hd-app-grid grid grid-cols-4 gap-1">
                <template v-if="section.key === 'enterprise' && !searchQuery">
                  <EnterpriseSlotRenderer v-for="module in enterpriseSlotModules" :key="module" :module="module" @close-menu="close" @open-window="handleEnterpriseOpenWindow" />
                </template>

                <div v-for="app in section.apps" :key="app.key" class="hd-app-tile flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-transform duration-150 active:scale-90" :class="themeClasses.startMenuAppItemBg" @click="openApp(app)" @contextmenu.stop.prevent="openAppMenu($event, app)" @touchstart.passive="handleAppTouchStart($event, app)" @touchend="cancelLongPress" @touchmove="cancelLongPress">
                  <StartMenuAppIcon :app="app" :size="48" class="pointer-events-none" />
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ appName(app) }}</span>
                </div>
              </div>
            </section>

            <div v-if="searchQuery && mobileSections.length === 0" class="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Icon :icon="searchOffIcon" class="h-8 w-8 opacity-25" :class="themeClasses.startMenuSectionTitle" />
              <p class="m-0 text-sm opacity-70" :class="themeClasses.startMenuUserNameText">{{ $t("No apps found") }}</p>
              <p class="m-0 max-w-[80%] truncate text-xs opacity-40" :class="themeClasses.startMenuUserNameText">“{{ searchQuery }}”</p>
            </div>

            <div class="flex items-center justify-center gap-4 px-6 py-1 pb-2" :class="[themeClasses.startMenuSocialBg, themeClasses.startMenuSocialBorderTop]">
              <a v-for="link in helpLinks" :key="link.url" :href="link.url" target="_blank" class="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" :title="$t(link.label)">
                <Icon :icon="link.icon" width="16" height="16" />
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <Transition v-else name="start-menu">
      <div v-show="desktopStore.startMenuOpen" ref="panelRef" class="flex h-[min(660px,calc(100vh-96px))] w-[640px] flex-col overflow-hidden rounded-xl pointer-events-auto" :class="[themeClasses.startMenuPanelBg, themeClasses.startMenuPanelBorder, themeClasses.startMenuPanelShadow]">
        <div class="shrink-0 px-6 pb-3 pt-5">
          <div class="relative flex items-center">
            <Icon :icon="searchIcon" :class="themeClasses.startMenuSearchIcon" class="pointer-events-none absolute left-4 h-5 w-5" />
            <input ref="searchInputRef" v-model="searchQuery" type="text" :placeholder="$t('Search apps and files...')" class="flex-1 rounded-lg border py-3 pl-12 pr-11 text-sm outline-hidden transition-all duration-200" :class="[themeClasses.startMenuSearchInput, themeClasses.startMenuSearchInputText, themeClasses.startMenuSearchInputFocusRing]" />
            <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 cursor-pointer rounded border-none bg-transparent p-2 transition-all duration-150" :class="[themeClasses.startMenuClearButton, themeClasses.startMenuClearButtonHover]">
              <Icon :icon="closeIcon" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref="panelScrollRef" class="relative min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <Transition name="start-view" mode="out-in">
            <div v-if="isSearching" key="search">
              <section v-if="appResults.length > 0" class="mb-4">
                <h3 class="m-0 mb-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Apps") }}</h3>
                <div class="flex flex-col gap-0.5">
                  <button v-for="(app, index) in appResults" :key="app.key" type="button" :data-result-index="index" class="start-row" :class="index === activeIndex ? themeClasses.startMenuItemBgActive : themeClasses.startMenuItemBgHover" @mousemove="activeIndex = index" @click="openApp(app)" @contextmenu.stop.prevent="openAppMenu($event, app)">
                    <StartMenuAppIcon :app="app" :size="32" />
                    <span class="start-row-text">
                      <span class="start-row-title" :class="themeClasses.startMenuItemText">{{ appName(app) }}</span>
                      <span class="start-row-subtitle" :class="themeClasses.startMenuCategoryText">{{ appSubtitle(app) }}</span>
                    </span>
                  </button>
                </div>
              </section>

              <section v-if="fileResults.length > 0 || fileSearching" class="mb-4">
                <h3 class="m-0 mb-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Files") }}</h3>
                <p v-if="fileResults.length === 0" class="m-0 px-2 py-2 text-xs" :class="themeClasses.startMenuCategoryText">{{ $t("Searching...") }}</p>
                <div class="flex flex-col gap-0.5">
                  <button v-for="(file, index) in fileResults" :key="file.key" type="button" :data-result-index="appResults.length + index" class="start-row" :class="appResults.length + index === activeIndex ? themeClasses.startMenuItemBgActive : themeClasses.startMenuItemBgHover" @mousemove="activeIndex = appResults.length + index" @click="openFile(file)">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center">
                      <FolderGraphic v-if="file.target.isDirectory" :size="30" />
                      <FileGraphic v-else :name="file.target.fileName" :size="30" />
                    </span>
                    <span class="start-row-text">
                      <span class="start-row-title" :class="themeClasses.startMenuItemText">{{ file.target.fileName }}</span>
                      <span class="start-row-subtitle" :class="themeClasses.startMenuCategoryText">{{ fileLocation(file.target) }}</span>
                    </span>
                  </button>
                </div>
              </section>

              <div v-if="hasNoResults" class="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <Icon :icon="searchOffIcon" class="h-8 w-8 opacity-25" :class="themeClasses.startMenuSectionTitle" />
                <p class="m-0 text-sm opacity-70" :class="themeClasses.startMenuUserNameText">{{ $t("No results") }}</p>
                <p class="m-0 max-w-[80%] truncate text-xs opacity-40" :class="themeClasses.startMenuUserNameText">“{{ searchQuery }}”</p>
              </div>
            </div>

            <div v-else-if="view === 'all'" key="all">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="m-0 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("All apps") }}</h3>
                <button type="button" class="start-link cursor-pointer" :class="[themeClasses.startMenuViewAllText, themeClasses.startMenuViewAllTextHover, themeClasses.startMenuItemBgHover]" @click="view = 'home'">
                  <Icon :icon="chevronLeftIcon" class="h-4 w-4" />
                  {{ $t("Back") }}
                </button>
              </div>

              <section v-for="section in desktopSections" :key="section.key" class="mb-4">
                <h4 class="m-0 mb-1 px-1 text-xs font-medium" :class="themeClasses.startMenuCategoryText">{{ $t(section.title) }}</h4>
                <div class="hd-app-grid grid grid-cols-6 gap-1">
                  <template v-if="section.key === 'enterprise'">
                    <EnterpriseSlotRenderer v-for="module in enterpriseSlotModules" :key="module" :module="module" @close-menu="close" @open-window="handleEnterpriseOpenWindow" />
                  </template>

                  <button v-for="app in section.apps" :key="app.key" type="button" class="hd-app-tile start-tile" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)" @contextmenu.stop.prevent="openAppMenu($event, app)">
                    <StartMenuAppIcon :app="app" :size="44" />
                    <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ appName(app) }}</span>
                  </button>
                </div>
              </section>
            </div>

            <div v-else key="home">
              <div class="mb-2 flex items-center justify-between">
                <h3 class="m-0 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Pinned") }}</h3>
                <button type="button" class="start-link cursor-pointer" :class="[themeClasses.startMenuViewAllText, themeClasses.startMenuViewAllTextHover, themeClasses.startMenuItemBgHover]" @click="view = 'all'">
                  {{ $t("All apps") }}
                  <Icon :icon="chevronRightIcon" class="h-4 w-4" />
                </button>
              </div>

              <TransitionGroup v-if="pinnedApps.length > 0" tag="div" name="pin" class="hd-app-grid relative mb-5 grid grid-cols-6 gap-1" @enter="onPinEnter" @leave="onPinLeave">
                <button v-for="app in pinnedApps" :key="app.key" :data-pin-key="app.key" type="button" draggable="true" class="hd-app-tile start-tile" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover, pinDragKey === app.key && 'opacity-40']" @click="openApp(app)" @contextmenu.stop.prevent="openAppMenu($event, app)" @dragstart="onPinDragStart($event, app)" @dragover.prevent @drop.prevent="onPinDrop(app)" @dragend="pinDragKey = null">
                  <StartMenuAppIcon :app="app" :size="44" />
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ appName(app) }}</span>
                </button>
              </TransitionGroup>
              <p v-else class="m-0 mb-5 px-1 py-6 text-center text-xs" :class="themeClasses.startMenuCategoryText">{{ $t("Right-click any app to pin it here.") }}</p>

              <h3 class="m-0 mb-1.5 px-1 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Recommended") }}</h3>
              <div v-if="recommended.length > 0" class="grid grid-cols-2 gap-x-2 gap-y-0.5">
                <template v-for="entry in recommended" :key="entry.key">
                  <button v-if="entry.type === 'app'" type="button" class="start-row" :class="themeClasses.startMenuItemBgHover" @click="openApp(entry.app)" @contextmenu.stop.prevent="openAppMenu($event, entry.app, true)">
                    <StartMenuAppIcon :app="entry.app" :size="32" />
                    <span class="start-row-text">
                      <span class="start-row-title" :class="themeClasses.startMenuItemText">{{ appName(entry.app) }}</span>
                      <span class="start-row-subtitle" :class="themeClasses.startMenuCategoryText">{{ relativeTime(entry.at) }}</span>
                    </span>
                  </button>
                  <button v-else type="button" class="start-row" :class="themeClasses.startMenuItemBgHover" @click="openFile(entry.file)" @contextmenu.stop.prevent="openFileMenu($event, entry.file)">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center">
                      <FolderGraphic v-if="entry.file.target.isDirectory" :size="30" />
                      <FileGraphic v-else :name="entry.file.target.fileName" :size="30" />
                    </span>
                    <span class="start-row-text">
                      <span class="start-row-title" :class="themeClasses.startMenuItemText">{{ entry.file.target.fileName }}</span>
                      <span class="start-row-subtitle" :class="themeClasses.startMenuCategoryText">{{ relativeTime(entry.at) }} · {{ $t(LOCATION_LABELS[entry.file.target.location]) }}</span>
                    </span>
                  </button>
                </template>
              </div>
              <p v-else class="m-0 px-1 py-6 text-center text-xs" :class="themeClasses.startMenuCategoryText">{{ $t("Apps and files you open will show up here.") }}</p>
            </div>
          </Transition>
        </div>

        <div class="flex shrink-0 items-center justify-between gap-3 px-6 py-3" :class="[themeClasses.startMenuFooterBg, themeClasses.startMenuFooterBorder]">
          <div class="flex min-w-0 items-center gap-3">
            <Icon :icon="accountIcon" width="28" height="28" class="shrink-0" :class="themeClasses.startMenuUserAvatarColor" />
            <div class="flex min-w-0 flex-col gap-0.5">
              <div class="flex items-center text-sm font-medium" :class="themeClasses.startMenuUserNameText">
                <UserGreeting /><span>,</span>
                <span class="ml-1 truncate username_catcher">{{ userName }}</span>
              </div>
              <div class="truncate text-xs opacity-50" :class="themeClasses.startMenuUserNameText">
                <WelcomeMessage />
              </div>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border-0 transition-colors cursor-pointer" :class="[themeClasses.startMenuPowerButton, themeClasses.startMenuPowerButtonHover]" :title="$t('Help')" @click="openHelpMenu">
              <Icon :icon="helpIcon" width="20" height="20" />
            </button>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border-0 transition-colors cursor-pointer" :class="[themeClasses.startMenuPowerButton, themeClasses.startMenuPowerButtonHover]" :title="$t('Settings')" @click="openSettings">
              <Icon :icon="settingsIcon" width="20" height="20" />
            </button>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border-0 transition-all cursor-pointer" :class="[themeClasses.startMenuLogoutBg, themeClasses.startMenuLogoutText, themeClasses.startMenuLogoutBgHover, themeClasses.startMenuLogoutTextHover]" :title="$t('Logout')" @click="handleLogout">
              <Icon :icon="logoutIcon" width="20" height="20" />
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <ContextMenu :visible="menu.visible" :x="menu.x" :y="menu.y" :items="menu.items" @close="closeMenu" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, inject, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import axios from "axios";

import { useDesktopStore, shortcutTargetData, type ShortcutTarget } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useFileExplorerStore, type RecentItem } from "../__Stores__/useFileExplorerStore";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";
import { useResponsive } from "../__Composables__/useResponsive";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useAppQuickActions } from "../__Composables__/useAppQuickActions";
import { useStartMenuApps, type StartMenuApp } from "../__Composables__/useStartMenuApps";
import { useTheme } from "../__Themes__/ThemeSelector";
import { startContainer, stopContainer, restartContainer } from "../__Services__/DockerActions";
import { clientSignOut } from "../__Services__/ClientSignOut";
import { flyIcon, landBounce, isRectVisibleWithin, nextFrame, type FlightTarget } from "../__Utils__/IconFlight";

import type { SettingsData } from "../__Types__/SettingsData";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import searchOffIcon from "@iconify-icons/mdi/magnify-close";
import closeIcon from "@iconify-icons/mdi/close";
import accountIcon from "@iconify-icons/mdi/account-circle";
import logoutIcon from "@iconify-icons/mdi/logout";
import githubIcon from "@iconify-icons/mdi/github";
import websiteIcon from "@iconify-icons/mdi/web";
import docsIcon from "@iconify-icons/mdi/lifebuoy";
import helpIcon from "@iconify-icons/mdi/help-circle-outline";
import settingsIcon from "@iconify-icons/mdi/tune";
import chevronLeftIcon from "@iconify-icons/mdi/chevron-left";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import openIcon from "@iconify-icons/mdi/open-in-new";
import pinIcon from "@iconify-icons/mdi/pin-outline";
import unpinIcon from "@iconify-icons/mdi/pin-off-outline";
import monitorPlusIcon from "@iconify-icons/mdi/monitor-cellphone-star";
import playIcon from "@iconify-icons/mdi/play";
import stopIcon from "@iconify-icons/mdi/stop";
import restartIcon from "@iconify-icons/mdi/restart";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import historyRemoveIcon from "@iconify-icons/mdi/history";

import UserGreeting from "../__Components__/UserGreeting.vue";
import WelcomeMessage from "../__Components__/WelcomeMessage.vue";
import EnterpriseSlotRenderer from "../__Components__/EnterpriseSlotRenderer.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";
import FileGraphic from "../__Components__/FileGraphic.vue";
import FolderGraphic from "../__Components__/FolderGraphic.vue";
import StartMenuAppIcon from "./StartMenuAppIcon.vue";

interface FileEntryTarget {
  key: string;
  target: ShortcutTarget;
  recent?: RecentItem;
}

interface StorageSearchEntry {
  name: string;
  is_directory: boolean;
}

type RecommendedEntry = { type: "app"; key: string; app: StartMenuApp; at: number } | { type: "file"; key: string; file: FileEntryTarget; at: number };

const LOCATION_LABELS: Record<ShortcutTarget["location"], string> = {
  storage: "Storage",
  dropzone: "Drop Zone",
  appdrive: "App Drive",
  disksplus: "Disks+",
};

const KIND_LABELS: Record<StartMenuApp["kind"], string> = {
  system: "System",
  enterprise: "Enterprise",
  docker: "App",
  utility: "Utility",
  game: "Game",
};

const STATUS_LABELS: Record<string, string> = {
  running: "Running",
  paused: "Paused",
  exited: "Stopped",
  created: "Created",
  restarting: "Restarting",
};

const SYSTEM_ICON_STRINGS: Record<string, string> = {
  apphome: "mdi:cloud",
  finder: "mdi:file-search",
  fileexplorer: "mdi:folder-multiple",
  appstore: "mdi:widgets-outline",
  appdrive: "mdi:cube-scan",
  packager: "mdi:package-variant",
  dropzone: "mdi:cube",
  controlhub: "mdi:nut",
  systemlogs: "mdi:chart-timeline-variant",
  settings: "mdi:tune",
  about: "mdi:cloud-question",
  utilities: "mdi:toolbox-outline",
};

const discordIcon = {
  body: '<path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />',
  width: 24,
  height: 24,
};

const helpLinks = [
  { label: "GitHub", url: "https://github.com/BansheeTech/HomeDockOS", icon: githubIcon },
  { label: "Website", url: "https://www.homedock.cloud", icon: websiteIcon },
  { label: "Documentation", url: "https://docs.homedock.cloud", icon: docsIcon },
  { label: "Discord", url: "https://discord.gg/Zj3JCYsRWw", icon: discordIcon },
];

const RECOMMENDED_LIMIT = 6;
const FILE_RESULTS_LIMIT = 6;
const FILE_SEARCH_MIN_LENGTH = 2;
const FILE_SEARCH_DEBOUNCE_MS = 300;
const LONG_PRESS_DURATION = 500;

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const fileExplorerStore = useFileExplorerStore();
const disksPlusStore = useDisksPlusStore();
const { isMobile, taskbarHeightPx } = useResponsive();
const { themeClasses } = useTheme();
const { t, locale } = useI18n();
const csrfToken = useCsrfToken();
const { quickActionsFor } = useAppQuickActions();
const { systemApps, enterpriseApps, enterpriseSlotModules, installedApps, utilityApps, gameApps, pinnedApps, recentApps, appName, matchesQuery, searchApps, launchApp } = useStartMenuApps();

const settingsData = inject<SettingsData | null>("data-settings", null);
const userName = computed(() => settingsData?.user_name || "User");

const searchQuery = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const panelScrollRef = ref<HTMLElement | null>(null);
const view = ref<"home" | "all">("home");
const activeIndex = ref(0);
const pinDragKey = ref<string | null>(null);

const fileResults = ref<FileEntryTarget[]>([]);
const fileSearching = ref(false);
let fileSearchTimer: ReturnType<typeof setTimeout> | null = null;
let fileSearchSeq = 0;

const isSearching = computed(() => searchQuery.value.trim().length > 0);

const appSections = computed(() => [
  { key: "enterprise", title: "Enterprise", apps: enterpriseApps.value },
  { key: "system", title: "System Applications", apps: systemApps.value },
  { key: "installed", title: "Installed Applications", apps: installedApps.value },
  { key: "utilities", title: "Utilities", apps: utilityApps.value },
  { key: "games", title: "Games", apps: gameApps.value },
]);

const desktopSections = computed(() => appSections.value.filter((section) => section.apps.length > 0 || (section.key === "enterprise" && enterpriseSlotModules.value.length > 0)));

const mobileSections = computed(() => {
  if (!searchQuery.value) return desktopSections.value;

  return appSections.value.map((section) => ({ ...section, apps: section.apps.filter((app) => matchesQuery(app, searchQuery.value)) })).filter((section) => section.apps.length > 0);
});

const appResults = computed(() => (isSearching.value ? searchApps(searchQuery.value) : []));

const resultCount = computed(() => appResults.value.length + fileResults.value.length);

const hasNoResults = computed(() => isSearching.value && resultCount.value === 0 && !fileSearching.value);

const recommended = computed<RecommendedEntry[]>(() => {
  const apps: RecommendedEntry[] = recentApps.value.map(({ app, at }) => ({ type: "app", key: `app-${app.key}`, app, at }));
  const files: RecommendedEntry[] = fileExplorerStore.recents.map((item) => ({ type: "file", key: `file-${item.location}-${item.container ?? ""}-${item.disk ?? ""}-${item.name}`, file: recentFileTarget(item), at: item.accessed_at }));

  return [...apps, ...files].sort((a, b) => b.at - a.at).slice(0, RECOMMENDED_LIMIT);
});

function baseName(path: string): string {
  return path.split("/").filter(Boolean).pop() || path;
}

function parentPath(path: string): string {
  return path.split("/").filter(Boolean).slice(0, -1).join("/");
}

function recentFileTarget(item: RecentItem): FileEntryTarget {
  return {
    key: `${item.location}-${item.name}`,
    recent: item,
    target: {
      location: item.location,
      path: item.path,
      fileName: baseName(item.name),
      isDirectory: item.is_directory,
      container: item.container,
      mountIndex: item.mount_index,
      diskId: item.disk,
    },
  };
}

function storageFileTarget(entry: StorageSearchEntry): FileEntryTarget {
  return {
    key: `storage-${entry.name}`,
    target: {
      location: "storage",
      path: parentPath(entry.name),
      fileName: baseName(entry.name),
      isDirectory: entry.is_directory,
    },
  };
}

function fileLocation(target: ShortcutTarget): string {
  return [t(LOCATION_LABELS[target.location]), ...target.path.split("/").filter(Boolean)].join(" / ");
}

function appSubtitle(app: StartMenuApp): string {
  if (app.kind === "docker" && app.dockerApp) return t(STATUS_LABELS[app.dockerApp.status] || "App");
  return t(KIND_LABELS[app.kind]);
}

function relativeTime(at: number): string {
  const seconds = Math.round(at - Date.now() / 1000);
  const format = new Intl.RelativeTimeFormat(locale.value, { numeric: "auto" });

  for (const [unit, length] of RELATIVE_UNITS) {
    if (Math.abs(seconds) >= length) return format.format(Math.round(seconds / length), unit);
  }

  return format.format(0, "second");
}

function openApp(app: StartMenuApp) {
  if (longPressTriggered) {
    longPressTriggered = false;
    return;
  }

  if (Date.now() - dragEndedAt < 250) {
    return;
  }

  launchApp(app);
  close();
}

function openFile(file: FileEntryTarget) {
  windowStore.openFileInApp("fileexplorer", { data: shortcutTargetData(file.target) });
  close();
}

function openSettings() {
  desktopStore.openSystemApp("settings");
  close();
}

function close() {
  desktopStore.closeStartMenu();
}

function clearSearch() {
  searchQuery.value = "";
  searchInputRef.value?.focus();
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

async function handleLogout() {
  await disksPlusStore.lock();
  clientSignOut(csrfToken.value);
}

function handleEnterpriseOpenWindow(windowType: string, options: any) {
  windowStore.openWindow(windowType, options);
}

const menu = ref<{ visible: boolean; x: number; y: number; items: ContextMenuItem[] }>({ visible: false, x: 0, y: 0, items: [] });

function showMenu(x: number, y: number, items: ContextMenuItem[]) {
  menu.value = { visible: true, x, y, items };
}

function closeMenu() {
  menu.value.visible = false;
}

const DESKTOP_ICON_WAIT_FRAMES = 30;
const ARRIVAL_AFTER_CLOSE_MS = 250;

const flyingPinKey = ref<string | null>(null);
const pendingArrivals: HTMLElement[] = [];

function sourceIconOf(source?: HTMLElement | null): HTMLElement | null {
  const icon = source?.querySelector<HTMLElement>(".app-icon") ?? null;
  return icon && isRectVisibleWithin(icon.getBoundingClientRect(), null) ? icon : null;
}

function activeScrollContainer(): HTMLElement | null {
  return isMobile.value ? sheetScrollRef.value : panelScrollRef.value;
}

function activePanel(): HTMLElement | null {
  return isMobile.value ? sheetRef.value : panelRef.value;
}

function findPinnedIcon(key: string): HTMLElement | null {
  const tiles = activeScrollContainer()?.querySelectorAll<HTMLElement>("[data-pin-key]") ?? [];
  const tile = Array.from(tiles).find((el) => el.dataset.pinKey === key);
  return tile?.querySelector<HTMLElement>(".app-icon") ?? null;
}

function centeredTarget(rect: DOMRect, width: number): FlightTarget {
  return { left: rect.left + rect.width / 2 - width / 2, top: rect.top + rect.height / 2 - width / 2, width };
}

async function togglePinWithFeedback(app: StartMenuApp, source?: HTMLElement | null) {
  const sourceIcon = sourceIconOf(source);

  if (desktopStore.isAppPinned(app.key) || !sourceIcon) {
    desktopStore.togglePinApp(app.key);
    return;
  }

  flyingPinKey.value = app.key;
  desktopStore.togglePinApp(app.key);
  await nextTick();

  try {
    const target = findPinnedIcon(app.key);

    if (target && isRectVisibleWithin(target.getBoundingClientRect(), activeScrollContainer())) {
      target.style.visibility = "hidden";
      await flyIcon(sourceIcon, target.getBoundingClientRect());
      target.style.visibility = "";
      landBounce(target);
      return;
    }

    const container = activeScrollContainer();
    const backButton = !isMobile.value && view.value === "all" ? container?.querySelector<HTMLElement>(".start-link") : null;
    const anchor = backButton?.getBoundingClientRect() ?? container?.getBoundingClientRect();
    if (!anchor) return;

    const width = sourceIcon.getBoundingClientRect().width * 0.4;
    const fallback = backButton ? centeredTarget(anchor, width) : { left: anchor.left + anchor.width / 2 - width / 2, top: anchor.top, width };

    await flyIcon(sourceIcon, fallback, { fadeOut: true });
    if (backButton) landBounce(backButton);
  } finally {
    flyingPinKey.value = null;
  }
}

function onPinEnter(el: Element, done: () => void) {
  const tile = el as HTMLElement;

  if (tile.dataset.pinKey === flyingPinKey.value) {
    done();
    return;
  }

  const animation = tile.animate([{ opacity: 0, transform: "scale(0.6)" }, { opacity: 1, transform: "scale(1)" }], { duration: 360, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" });
  animation.onfinish = () => done();
  animation.oncancel = () => done();
}

function onPinLeave(el: Element, done: () => void) {
  const tile = el as HTMLElement;
  const { offsetLeft, offsetTop, offsetWidth, offsetHeight } = tile;

  Object.assign(tile.style, { position: "absolute", left: `${offsetLeft}px`, top: `${offsetTop}px`, width: `${offsetWidth}px`, height: `${offsetHeight}px`, margin: "0" });

  const animation = tile.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.6)" }], { duration: 240, easing: "ease-in" });
  animation.onfinish = () => done();
  animation.oncancel = () => done();
}

async function waitForDesktopIcon(iconId: string): Promise<HTMLElement | null> {
  for (let frame = 0; frame < DESKTOP_ICON_WAIT_FRAMES; frame++) {
    await nextFrame();

    const icon = desktopStore.systemDesktopIcons.find((entry) => entry.id === iconId);
    const placed = icon && (icon.gridRow !== undefined || icon.x !== undefined);
    const el = Array.from(document.querySelectorAll<HTMLElement>("[data-desktop-icon]")).find((entry) => entry.dataset.desktopIcon === iconId);

    if (el && (placed || frame === DESKTOP_ICON_WAIT_FRAMES - 1)) return el;
  }

  return null;
}

function isCoveredByPanel(rect: DOMRect): boolean {
  const panel = activePanel()?.getBoundingClientRect();
  if (!panel) return false;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return centerX >= panel.left && centerX <= panel.right && centerY >= panel.top && centerY <= panel.bottom;
}

async function addToDesktop(app: StartMenuApp, source?: HTMLElement | null) {
  const iconId = `system-icon-${app.key}`;
  const sourceIcon = sourceIconOf(source);

  if (sourceIcon) desktopStore.arrivingIconId = iconId;

  const added = app.kind === "enterprise" ? desktopStore.addSystemIconToDesktop(app.key, app.name, app.icon, app.moduleName) : desktopStore.addSystemIconToDesktop(app.key, app.name, SYSTEM_ICON_STRINGS[app.key] || app.icon || "mdi:application");

  if (!added || !sourceIcon) {
    desktopStore.arrivingIconId = null;
    return;
  }

  try {
    const target = await waitForDesktopIcon(iconId);
    const graphic = target?.firstElementChild as HTMLElement | null;
    const rect = graphic?.querySelector<HTMLElement>(".app-icon")?.getBoundingClientRect() ?? graphic?.getBoundingClientRect();

    if (!graphic || !rect || !isRectVisibleWithin(rect, null)) {
      const width = sourceIcon.getBoundingClientRect().width * 0.4;
      await flyIcon(sourceIcon, { left: window.innerWidth / 2 - width / 2, top: -width, width }, { fadeOut: true });
      return;
    }

    const covered = isCoveredByPanel(rect);
    await flyIcon(sourceIcon, rect, { fadeOut: covered });

    desktopStore.arrivingIconId = null;
    await nextFrame();

    if (covered) {
      pendingArrivals.push(graphic);
    } else {
      landBounce(graphic, { glow: true });
    }
  } finally {
    desktopStore.arrivingIconId = null;
  }
}

watch(
  () => desktopStore.startMenuOpen,
  (open) => {
    if (open || pendingArrivals.length === 0) return;

    const arrivals = pendingArrivals.splice(0);
    setTimeout(() => arrivals.forEach((el) => el.isConnected && landBounce(el, { glow: true })), ARRIVAL_AFTER_CLOSE_MS);
  },
);

function dockerMenuItems(app: StartMenuApp): ContextMenuItem[] {
  const dockerApp = app.dockerApp;
  if (!dockerApp) return [];

  const isRunning = dockerApp.status === "running";
  const isPaused = dockerApp.status === "paused";
  const isExited = dockerApp.status === "exited";
  const scope = themeClasses.value.scopeSelector;

  return [
    { divider: true },
    {
      label: isRunning ? "Stop" : t("Start", 2),
      icon: isRunning ? stopIcon : playIcon,
      disabled: isPaused,
      action: () => (isRunning ? stopContainer(dockerApp, csrfToken.value, scope) : startContainer(dockerApp, csrfToken.value, scope)),
    },
    { label: "Restart", icon: restartIcon, disabled: isExited, action: () => restartContainer(dockerApp, csrfToken.value, scope) },
    { divider: true },
    quickActionsFor(dockerApp),
    { divider: true },
    {
      label: "Properties",
      icon: propertiesIcon,
      action: () => {
        windowStore.openUniqueWindow("properties", dockerApp.id, {
          title: `${dockerApp.display_name || dockerApp.name} - ${t("Properties")}`,
          data: { appId: dockerApp.id },
        });
        close();
      },
    },
  ];
}

function appMenuItems(app: StartMenuApp, fromRecommended: boolean, source?: HTMLElement | null): ContextMenuItem[] {
  const pinned = desktopStore.isAppPinned(app.key);
  const items: ContextMenuItem[] = [
    {
      label: "Open",
      icon: openIcon,
      action: () => {
        launchApp(app);
        close();
      },
    },
    { label: pinned ? "Unpin from Start" : "Pin to Start", icon: pinned ? unpinIcon : pinIcon, action: () => togglePinWithFeedback(app, source) },
  ];

  if (app.kind !== "docker" && !desktopStore.isSystemIconOnDesktop(app.key)) {
    items.push({ label: "Add to Desktop", icon: monitorPlusIcon, action: () => addToDesktop(app, source) });
  }

  items.push(...dockerMenuItems(app));

  if (fromRecommended) {
    items.push({ divider: true }, { label: "Remove from Recommended", icon: historyRemoveIcon, action: () => desktopStore.removeFromRecent(app.key) });
  }

  return items;
}

function openAppMenu(event: MouseEvent, app: StartMenuApp, fromRecommended = false) {
  showMenu(event.clientX, event.clientY, appMenuItems(app, fromRecommended, event.currentTarget as HTMLElement | null));
}

function openFileMenu(event: MouseEvent, file: FileEntryTarget) {
  const recent = file.recent;
  const items: ContextMenuItem[] = [{ label: "Open", icon: folderOpenIcon, action: () => openFile(file) }];

  if (recent) {
    items.push({ divider: true }, { label: "Remove from Recommended", icon: historyRemoveIcon, action: () => fileExplorerStore.removeFromRecents({ location: recent.location, path: recent.path, name: recent.name }) });
  }

  showMenu(event.clientX, event.clientY, items);
}

function openHelpMenu(event: MouseEvent) {
  showMenu(
    event.clientX,
    event.clientY,
    helpLinks.map((link) => ({ label: link.label, icon: link.icon, action: () => window.open(link.url, "_blank", "noopener,noreferrer") })),
  );
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;

function handleAppTouchStart(event: TouchEvent, app: StartMenuApp) {
  cancelLongPress();
  longPressTriggered = false;

  const touch = event.touches[0];
  const x = touch.clientX;
  const y = touch.clientY;
  const source = event.currentTarget as HTMLElement | null;

  longPressTimer = setTimeout(() => {
    longPressTimer = null;
    longPressTriggered = true;
    showMenu(x, y, appMenuItems(app, false, source));
  }, LONG_PRESS_DURATION);
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

function onPinDragStart(event: DragEvent, app: StartMenuApp) {
  pinDragKey.value = app.key;

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", app.key);
  }
}

function onPinDrop(target: StartMenuApp) {
  if (pinDragKey.value && pinDragKey.value !== target.key) {
    desktopStore.movePinnedApp(pinDragKey.value, target.key);
  }

  pinDragKey.value = null;
}

function scrollActiveIntoView() {
  nextTick(() => {
    panelScrollRef.value?.querySelector(`[data-result-index="${activeIndex.value}"]`)?.scrollIntoView({ block: "nearest" });
  });
}

function openActiveResult() {
  const index = activeIndex.value;

  if (index < appResults.value.length) {
    openApp(appResults.value[index]);
  } else if (fileResults.value[index - appResults.value.length]) {
    openFile(fileResults.value[index - appResults.value.length]);
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!desktopStore.startMenuOpen || isMobile.value || menu.value.visible) return;

  if (event.key === "Escape") {
    event.preventDefault();
    if (searchQuery.value) {
      clearSearch();
    } else if (view.value === "all") {
      view.value = "home";
    } else {
      close();
    }
    return;
  }

  if (!isSearching.value || event.target !== searchInputRef.value || resultCount.value === 0) return;

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    activeIndex.value = (activeIndex.value + step + resultCount.value) % resultCount.value;
    scrollActiveIntoView();
  } else if (event.key === "Enter") {
    event.preventDefault();
    openActiveResult();
  }
}

watch(searchQuery, (query) => {
  activeIndex.value = 0;
  fileResults.value = [];

  if (fileSearchTimer) clearTimeout(fileSearchTimer);
  const seq = ++fileSearchSeq;
  const needle = query.trim();

  if (isMobile.value || needle.length < FILE_SEARCH_MIN_LENGTH) {
    fileSearching.value = false;
    return;
  }

  fileSearching.value = true;
  fileSearchTimer = setTimeout(async () => {
    try {
      const { data } = await axios.get<{ files?: StorageSearchEntry[] }>("/api/storage/search", { params: { query: needle }, headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
      if (seq === fileSearchSeq) fileResults.value = (data.files ?? []).slice(0, FILE_RESULTS_LIMIT).map(storageFileTarget);
    } catch {
      if (seq === fileSearchSeq) fileResults.value = [];
    } finally {
      if (seq === fileSearchSeq) fileSearching.value = false;
    }
  }, FILE_SEARCH_DEBOUNCE_MS);
});

watch(
  () => desktopStore.startMenuOpen,
  (isOpen) => {
    if (!isOpen) {
      searchQuery.value = "";
      view.value = "home";
      closeMenu();
      return;
    }

    fileExplorerStore.fetchRecents();

    if (!isMobile.value) {
      nextTick(() => {
        if (panelScrollRef.value) panelScrollRef.value.scrollTop = 0;
        setTimeout(() => searchInputRef.value?.focus(), 100);
      });
    }
  },
);

onMounted(() => {
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  cancelLongPress();
  if (fileSearchTimer) clearTimeout(fileSearchTimer);
});

const SHEET_IN_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const SHEET_OUT_EASE = "cubic-bezier(0.4, 0, 1, 1)";
const SHEET_DISMISS_DISTANCE = 96;
const SHEET_DISMISS_VELOCITY = 0.55;

const SHEET_MAX_STRETCH = 48;

const sheetRef = ref<HTMLElement | null>(null);
const sheetScrollRef = ref<HTMLElement | null>(null);
const grabberRef = ref<HTMLElement | null>(null);

const sheetInset = computed(() => taskbarHeightPx.value);

const GRABBER_IDLE_MS = 140;
const GRABBER_MIN_DELTA = 1.5;

let grabberTilt: -1 | 0 | 1 = 0;
let grabberIdleTimer: ReturnType<typeof setTimeout> | null = null;
let grabberFlattenTimer: ReturnType<typeof setTimeout> | null = null;

function paintGrabberTilt(tilt: -1 | 0 | 1) {
  if (tilt === grabberTilt) return;
  grabberTilt = tilt;

  const grabber = grabberRef.value;
  if (!grabber) return;

  grabber.classList.toggle("is-up", tilt === -1);
  grabber.classList.toggle("is-down", tilt === 1);
}

function setGrabberTilt(tilt: -1 | 0 | 1) {
  if (grabberFlattenTimer) {
    clearTimeout(grabberFlattenTimer);
    grabberFlattenTimer = null;
  }
  paintGrabberTilt(tilt);
}

function tiltGrabberFor(tilt: -1 | 0 | 1, durationMs: number) {
  setGrabberTilt(tilt);
  grabberFlattenTimer = setTimeout(() => {
    grabberFlattenTimer = null;
    paintGrabberTilt(0);
  }, durationMs);
}

function tiltGrabberFromGesture(delta: number) {
  if (Math.abs(delta) < GRABBER_MIN_DELTA) return;

  setGrabberTilt(delta > 0 ? 1 : -1);

  if (grabberIdleTimer) {
    clearTimeout(grabberIdleTimer);
  }

  grabberIdleTimer = setTimeout(() => {
    grabberIdleTimer = null;
    paintGrabberTilt(0);
  }, GRABBER_IDLE_MS);
}

function stopGrabberIdleTimer() {
  if (grabberIdleTimer) {
    clearTimeout(grabberIdleTimer);
    grabberIdleTimer = null;
  }
}

let dragArmed = false;
let dragActive = false;
let dragDetached = false;
let dragStartY = 0;
let dragLastY = 0;
let dragLastT = 0;
let dragVelocity = 0;
let dragOffset = 0;
let dragEndedAt = 0;
let dragFrame = 0;
let restTimer: ReturnType<typeof setTimeout> | null = null;

function setSheetMoving(panel: HTMLElement, moving: boolean) {
  if (restTimer) {
    clearTimeout(restTimer);
    restTimer = null;
  }

  panel.classList.toggle("is-moving", moving);
}

function restSheet(panel: HTMLElement) {
  panel.classList.remove("is-moving");

  if (dragOffset === 0) {
    panel.style.transition = "none";
    panel.style.transform = "";
  }
}

function settleSheetAfter(panel: HTMLElement, delayMs: number) {
  if (restTimer) {
    clearTimeout(restTimer);
  }

  restTimer = setTimeout(() => {
    restTimer = null;
    restSheet(panel);
  }, delayMs);
}

function applySheetOffset() {
  const panel = sheetRef.value;
  if (!panel) return;
  panel.style.transform = `translate3d(0, ${dragOffset}px, 0)`;
}

function scheduleSheetOffset() {
  if (dragFrame) return;

  dragFrame = requestAnimationFrame(() => {
    dragFrame = 0;
    applySheetOffset();
  });
}

function cancelScheduledOffset() {
  if (dragFrame) {
    cancelAnimationFrame(dragFrame);
    dragFrame = 0;
  }
}

let sheetPhase = 0;

function waitForSheet(panel: HTMLElement, done: () => void, fallbackMs: number) {
  let settled = false;

  const finish = () => {
    if (settled) return;
    settled = true;
    panel.removeEventListener("transitionend", onEnd);
    clearTimeout(timer);
    done();
  };

  const onEnd = (event: TransitionEvent) => {
    if (event.target === panel && event.propertyName === "transform") {
      finish();
    }
  };

  const timer = setTimeout(finish, fallbackMs);
  panel.addEventListener("transitionend", onEnd);
}

function onSheetEnter(el: Element, done: () => void) {
  const panel = el as HTMLElement;
  const phase = ++sheetPhase;

  dragArmed = false;
  dragActive = false;
  dragOffset = 0;
  cancelScheduledOffset();
  setSheetMoving(panel, true);

  if (sheetScrollRef.value) {
    sheetScrollRef.value.scrollTop = 0;
  }

  panel.style.transition = "none";

  const hidden = panel.offsetHeight + 24;
  panel.style.transform = `translate3d(0, ${hidden}px, 0)`;

  panel.classList.remove("hd-sheet-revealing");
  void panel.offsetHeight;
  panel.classList.add("hd-sheet-revealing");

  tiltGrabberFor(-1, 440);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (phase !== sheetPhase) return;
      panel.style.transition = `transform 440ms ${SHEET_IN_EASE}`;
      panel.style.transform = "translate3d(0, 0, 0)";
    });
  });

  waitForSheet(
    panel,
    () => {
      if (phase === sheetPhase) {
        settleSheetAfter(panel, 0);
      }
      done();
    },
    660,
  );
}

function onSheetLeave(el: Element, done: () => void) {
  const panel = el as HTMLElement;
  const phase = ++sheetPhase;
  const hidden = panel.offsetHeight + 24;

  dragArmed = false;
  dragActive = false;
  cancelScheduledOffset();
  setSheetMoving(panel, true);

  panel.style.transition = `transform 280ms ${SHEET_OUT_EASE}`;
  stopGrabberIdleTimer();
  tiltGrabberFor(1, 280);

  requestAnimationFrame(() => {
    if (phase !== sheetPhase) return;
    panel.style.transform = `translate3d(0, ${hidden}px, 0)`;
  });

  waitForSheet(
    panel,
    () => {
      if (phase === sheetPhase) {
        panel.classList.remove("hd-sheet-revealing");
        dragOffset = 0;
        setSheetMoving(panel, false);
        panel.style.transition = "none";
        panel.style.transform = "";
      }
      done();
    },
    420,
  );
}

function sheetTouchStart(event: TouchEvent, source: "header" | "body") {
  if (event.touches.length !== 1) return;

  if (event.target instanceof HTMLElement && event.target.closest("input")) {
    dragArmed = false;
    dragActive = false;
    return;
  }

  const touch = event.touches[0];
  dragStartY = touch.clientY;
  dragLastY = touch.clientY;
  dragLastT = event.timeStamp;
  dragVelocity = 0;
  dragArmed = true;
  dragActive = source === "header";
  dragDetached = false;
}

function sheetTouchMove(event: TouchEvent) {
  if (!dragArmed || event.touches.length !== 1) return;

  const touch = event.touches[0];

  if (!dragActive) {
    const scrolled = sheetScrollRef.value ? sheetScrollRef.value.scrollTop : 0;
    const delta = touch.clientY - dragStartY;

    if (delta > 6 && scrolled <= 0) {
      dragActive = true;
      dragStartY = touch.clientY;
    } else {
      if (delta < -2 || scrolled > 0) {
        dragArmed = false;
      }
      return;
    }
  }

  if (!dragDetached) {
    dragDetached = true;
    cancelLongPress();
    if (sheetRef.value) {
      sheetRef.value.style.transition = "none";
      setSheetMoving(sheetRef.value, true);
    }
  }

  const raw = touch.clientY - dragStartY;
  dragOffset = raw > 0 ? raw : Math.max(-SHEET_MAX_STRETCH, -Math.sqrt(-raw) * 3);

  const elapsed = Math.max(1, event.timeStamp - dragLastT);
  dragVelocity = (touch.clientY - dragLastY) / elapsed;
  tiltGrabberFromGesture(touch.clientY - dragLastY);
  dragLastY = touch.clientY;
  dragLastT = event.timeStamp;

  scheduleSheetOffset();

  if (event.cancelable) {
    event.preventDefault();
  }
}

function sheetTouchEnd() {
  if (!dragActive) {
    dragArmed = false;
    return;
  }

  dragArmed = false;
  dragActive = false;
  dragEndedAt = Date.now();

  const shouldDismiss = dragOffset > SHEET_DISMISS_DISTANCE || (dragVelocity > SHEET_DISMISS_VELOCITY && dragOffset > 24);

  if (shouldDismiss) {
    close();
    return;
  }

  const pushedDown = dragOffset > 2;
  const wasStretched = dragOffset < -2;
  dragOffset = 0;
  cancelScheduledOffset();

  const panel = sheetRef.value;

  if (panel) {
    panel.style.transition = `transform 340ms ${SHEET_IN_EASE}`;
    applySheetOffset();
    settleSheetAfter(panel, 360);
  }

  stopGrabberIdleTimer();

  if (pushedDown) {
    tiltGrabberFor(-1, 340);
  } else if (wasStretched) {
    tiltGrabberFor(1, 340);
  } else {
    setGrabberTilt(0);
  }
}
</script>

<style scoped>
/* Vue Transitions - Desktop panel */
.start-menu-enter-active,
.start-menu-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.start-menu-enter-from,
.start-menu-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.start-view-enter-active,
.start-view-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.start-view-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.start-view-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.start-tile {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.25rem;
  cursor: pointer;
  transition:
    background 0.15s ease,
    transform 0.15s ease;
}

.start-tile:active {
  transform: scale(0.95);
}

.hd-app-grid > .pin-move {
  transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
}

.start-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  padding: 0.4375rem 0.625rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

.start-row-text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.start-row-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.25;
}

.start-row-subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.6875rem;
  line-height: 1.3;
}

.start-link {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: background 0.15s ease;
}

.hd-sheet {
  -webkit-tap-highlight-color: transparent;
}

.hd-sheet-glass {
  bottom: -4rem;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: 0;
  box-shadow: 0 -18px 45px -12px rgba(0, 0, 0, 0.45);
}

/* The whole sheet travels as one composited layer */
.hd-sheet.is-moving {
  will-change: transform;
}

.hd-grabber {
  display: flex;
  justify-content: center;
  width: 2.25rem;
  height: 4px;
  margin: 0 auto 0.75rem;
}

.hd-grabber-half {
  display: block;
  flex: none;
  width: 50%;
  height: 4px;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.hd-grabber-left {
  transform-origin: left center;
  border-radius: 999px 0 0 999px;
}

.hd-grabber-right {
  transform-origin: right center;
  border-radius: 0 999px 999px 0;
}

.hd-grabber.is-up .hd-grabber-left {
  transform: rotate(-8deg) translateX(0.6px);
}

.hd-grabber.is-up .hd-grabber-right {
  transform: rotate(8deg) translateX(-0.6px);
}

.hd-grabber.is-down .hd-grabber-left {
  transform: rotate(8deg) translateX(0.6px);
}

.hd-grabber.is-down .hd-grabber-right {
  transform: rotate(-8deg) translateX(-0.6px);
}

/* touch-action is latched when the gesture starts */
.hd-sheet-header {
  touch-action: none;
}

.hd-sheet-scroll {
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hd-sheet-scroll::-webkit-scrollbar {
  display: none;
}

.hd-app-label {
  width: 100%;
  text-align: center;
  font-size: 0.75rem;
  line-height: 1.15;
  min-height: 1.725rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
}

/* Staggered reveal of the sheet contents */
.hd-sheet-revealing .hd-stagger {
  animation: hd-sheet-rise 380ms cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--hd-delay, 0ms);
}

@keyframes hd-sheet-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>

<style>
.hd-app-grid > *:not(.hd-app-tile) > * {
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
}

.hd-app-grid > *:not(.hd-app-tile) > * > div:first-child {
  width: 3rem !important;
  height: 3rem !important;
}
</style>
