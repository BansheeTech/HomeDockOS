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
              <button class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-0 transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuLogoutBg, themeClasses.startMenuLogoutText, themeClasses.startMenuLogoutBgHover, themeClasses.startMenuLogoutTextHover]" @click="handleLogout" :title="$t('Logout')">
                <Icon :icon="logoutIcon" width="20" height="20" />
              </button>
            </div>

            <div class="hd-stagger relative mt-3 flex items-center" style="--hd-delay: 40ms">
              <Icon :icon="searchIcon" :class="themeClasses.startMenuSearchIcon" class="pointer-events-none absolute left-4 h-5 w-5" />
              <input v-model="searchQuery" type="text" enterkeyhint="search" :placeholder="$t('Search apps...')" class="w-full rounded-lg border py-2.5 pl-12 pr-11 text-sm outline-none transition-all duration-200" :class="[themeClasses.startMenuSearchInput, themeClasses.startMenuSearchInputText, themeClasses.startMenuSearchInputFocusRing]" />
              <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 rounded-lg border-none bg-transparent p-2 transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuClearButton, themeClasses.startMenuClearButtonHover]">
                <Icon :icon="closeIcon" class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="relative mx-4 h-px shrink-0" :class="themeClasses.startMenuSheetHairline"></div>

          <div ref="sheetScrollRef" class="hd-sheet-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-[48px]" @touchstart="sheetTouchStart($event, 'body')" @touchmove="sheetTouchMove" @touchend="sheetTouchEnd" @touchcancel="sheetTouchEnd">
            <section v-if="pinnedApps.length > 0" class="hd-stagger mb-3" style="--hd-delay: 80ms">
              <h3 class="m-0 mb-2 px-2 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Pinned") }}</h3>
              <div class="hd-app-grid grid grid-cols-4 gap-1">
                <div v-for="app in pinnedApps" :key="app.id" class="hd-app-tile flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-transform duration-150 active:scale-90" :class="themeClasses.startMenuAppItemBg" @click="openApp(app)">
                  <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px]" :class="[app.type === 'system' ? themeClasses.startMenuAppIconBg : 'bg-transparent', getContainerClasses(app)]">
                    <Icon v-if="app.type === 'system'" :icon="app.icon || defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                    <BaseImage v-else-if="app.image_path" :src="app.image_path" alt="" class="h-full w-full rounded-[10px] object-cover" draggable="false" />
                  </div>
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ $t(app.name) }}</span>
                </div>
              </div>
            </section>

            <section v-if="filteredSystemApps.length > 0 || !searchQuery" class="hd-stagger mb-3" style="--hd-delay: 110ms">
              <h3 class="m-0 mb-2 px-2 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("System Applications") }}</h3>
              <div class="hd-app-grid grid grid-cols-4 gap-1">
                <EnterpriseStartMenuSlots @close-menu="close" @open-window="handleEnterpriseOpenWindow" />

                <div v-for="app in filteredSystemApps" :key="app.id" class="hd-app-tile flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-transform duration-150 active:scale-90" :class="themeClasses.startMenuAppItemBg" @click="openApp(app)" @contextmenu.stop.prevent="handleSystemAppContextMenu($event, app)" @touchstart.passive="handleSystemAppTouchStart($event, app)" @touchend="handleSystemAppTouchEnd" @touchmove="handleSystemAppTouchMove">
                  <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px]" :class="themeClasses.startMenuAppIconBg">
                    <Icon :icon="app.icon || defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                  </div>
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ $t(app.name) }}</span>
                </div>
              </div>
            </section>

            <section v-if="filteredInstalledApps.length > 0" class="hd-stagger mb-3" style="--hd-delay: 140ms">
              <h3 class="m-0 mb-2 px-2 text-[0.6875rem] font-semibold uppercase tracking-wide" :class="themeClasses.startMenuSectionTitle">{{ $t("Installed Applications") }}</h3>
              <div class="hd-app-grid grid grid-cols-4 gap-1">
                <div v-for="app in filteredInstalledApps" :key="app.id" class="hd-app-tile flex cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-transform duration-150 active:scale-90" :class="themeClasses.startMenuAppItemBg" @click="openApp(app)">
                  <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px] bg-transparent" :class="getContainerClasses(app)">
                    <BaseImage v-if="app.image_path" :src="app.image_path" alt="" class="h-full w-full rounded-[10px] object-cover" draggable="false" />
                    <Icon v-else :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                  </div>
                  <span class="hd-app-label" :class="themeClasses.startMenuAppNameText">{{ app.name }}</span>
                </div>
              </div>
            </section>

            <div v-if="hasNoResults" class="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Icon :icon="searchOffIcon" class="h-8 w-8 opacity-25" :class="themeClasses.startMenuSectionTitle" />
              <p class="m-0 text-sm opacity-70" :class="themeClasses.startMenuUserNameText">{{ $t("No apps found") }}</p>
              <p class="m-0 max-w-[80%] truncate text-xs opacity-40" :class="themeClasses.startMenuUserNameText">“{{ searchQuery }}”</p>
            </div>

            <div class="flex items-center justify-center gap-4 px-6 py-1 pb-2" :class="[themeClasses.startMenuSocialBg, themeClasses.startMenuSocialBorderTop]">
              <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" class="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="GitHub">
                <Icon :icon="githubIcon" width="16" height="16" />
              </a>
              <a href="https://www.homedock.cloud" target="_blank" class="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" :title="$t('Website')">
                <Icon :icon="websiteIcon" width="16" height="16" />
              </a>
              <a href="https://docs.homedock.cloud" target="_blank" class="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" :title="$t('Documentation')">
                <Icon :icon="docsIcon" width="16" height="16" />
              </a>
              <a href="https://discord.gg/Zj3JCYsRWw" target="_blank" class="flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-150 active:scale-90" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="Discord">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <Transition v-else name="start-menu">
      <div v-show="desktopStore.startMenuOpen" class="rounded-xl w-[600px] max-h-[700px] flex flex-col overflow-hidden pointer-events-auto" :class="[themeClasses.startMenuPanelBg, themeClasses.startMenuPanelBorder, themeClasses.startMenuPanelShadow]">
        <div class="p-3 max-md:!p-3 max-md:!px-4 max-md:!pt-4" :class="themeClasses.startMenuSectionBg">
          <div class="relative flex items-center gap-3">
            <Icon :icon="searchIcon" :class="themeClasses.startMenuSearchIcon" class="absolute left-4 w-5 h-5 pointer-events-none" />
            <input ref="searchInputRef" v-model="searchQuery" type="text" :placeholder="$t('Search apps...')" class="flex-1 py-3 pr-4 pl-12 rounded-lg border text-sm outline-none transition-all duration-200" :class="[themeClasses.startMenuSearchInput, themeClasses.startMenuSearchInputText, themeClasses.startMenuSearchInputFocusRing]" />
            <button v-if="searchQuery" @click="clearSearch" class="absolute right-2 p-2 border-none bg-transparent cursor-pointer rounded transition-all duration-150" :class="[themeClasses.startMenuClearButton, themeClasses.startMenuClearButtonHover]">
              <Icon :icon="closeIcon" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Pinned Apps (Not Implemented Yet for Future use) -->
        <div v-if="pinnedApps.length > 0" class="flex-shrink-0 px-6 py-3 max-md:!px-4 max-md:!py-2 md:overflow-y-auto max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">{{ $t("Pinned") }}</h3>
          <div class="md:grid md:gap-3 w-full max-md:flex max-md:overflow-x-auto max-md:gap-3 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
            <div v-for="app in pinnedApps" :key="app.id" class="group flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 w-full min-w-0 hover:-translate-y-0.5 max-md:py-2 max-md:px-1 max-md:gap-1.5 max-md:w-[90px] max-md:min-w-[90px] max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)">
              <div class="flex items-center justify-center w-12 h-12 rounded-[10px] transition-all duration-200 overflow-hidden max-md:w-[44px] max-md:h-[44px] group-hover:scale-110" :class="[{ 'bg-transparent p-0': app.type === 'docker' }, app.type === 'system' ? themeClasses.startMenuAppIconBg : '', getContainerClasses(app)]">
                <Icon v-if="app.type === 'system' && app.icon" :icon="app.icon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                <Icon v-else-if="app.type === 'system'" :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                <BaseImage v-else-if="app.type === 'docker' && app.image_path" :src="app.image_path" alt="" class="w-full h-full object-cover rounded-[10px]" draggable="false" />
              </div>
              <span class="text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ $t(app.name) }}</span>
            </div>
          </div>
        </div>
        <div class="flex-shrink-0 px-6 py-2 max-md:!px-4 max-md:!py-2 max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">{{ $t("System Applications") }}</h3>
          <div class="md:max-h-[13rem] md:overflow-y-auto md:pr-2 apps-section-scroll max-md:overflow-y-visible">
            <div class="md:grid md:gap-1 w-full max-md:flex max-md:overflow-x-auto max-md:gap-1 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
              <EnterpriseStartMenuSlots @close-menu="close" @open-window="handleEnterpriseOpenWindow" />

              <div v-for="app in filteredSystemApps" :key="app.id" class="group flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 w-full min-w-0 hover:-translate-y-0.5 max-md:py-2 max-md:px-1 max-md:gap-1.5 max-md:w-[90px] max-md:min-w-[90px] max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)" @contextmenu.stop.prevent="handleSystemAppContextMenu($event, app)" @touchstart.passive="handleSystemAppTouchStart($event, app)" @touchend="handleSystemAppTouchEnd" @touchmove="handleSystemAppTouchMove">
                <div class="flex items-center justify-center w-12 h-12 rounded-[10px] transition-all duration-200 overflow-hidden max-md:w-[44px] max-md:h-[44px] group-hover:scale-110" :class="themeClasses.startMenuAppIconBg">
                  <Icon v-if="app.icon" :icon="app.icon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                  <Icon v-else :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                </div>
                <span class="text-xs text-center w-full line-clamp-2 leading-none max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ $t(app.name) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredInstalledApps.length > 0" class="flex-shrink-0 px-6 py-2 max-md:!px-4 max-md:!py-2 max-md:overflow-y-visible" :class="themeClasses.startMenuSectionBg">
          <h3 class="text-[0.6875rem] font-semibold uppercase tracking-wide m-0 mb-3 max-md:!text-xs max-md:!mb-2" :class="themeClasses.startMenuSectionTitle">{{ $t("Installed Applications") }}</h3>
          <div class="md:max-h-[11rem] md:overflow-y-auto md:pr-2 apps-section-scroll max-md:overflow-y-visible">
            <div class="md:grid md:gap-1 w-full max-md:flex max-md:overflow-x-auto max-md:gap-1 apps-scroll-container" :style="isMobile ? {} : { gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }">
              <div v-for="app in filteredInstalledApps" :key="app.id" class="group flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 w-full min-w-0 hover:-translate-y-0.5 max-md:py-2 max-md:px-1 max-md:gap-1.5 max-md:w-[90px] max-md:min-w-[90px] max-md:flex-shrink-0" :class="[themeClasses.startMenuAppItemBg, themeClasses.startMenuAppItemBgHover]" @click="openApp(app)">
                <div class="flex items-center justify-center w-12 h-12 rounded-[10px] transition-all duration-200 overflow-hidden max-md:w-[44px] max-md:h-[44px] group-hover:scale-110 bg-transparent p-0" :class="getContainerClasses(app)">
                  <BaseImage v-if="app.image_path" :src="app.image_path" alt="" class="w-full h-full object-cover rounded-[10px]" draggable="false" />
                  <Icon v-else :icon="defaultAppIcon" width="32" height="32" :class="themeClasses.startMenuAppIconColor" />
                </div>
                <span class="text-xs text-center w-full overflow-hidden text-ellipsis whitespace-nowrap leading-none max-md:!text-xs" :class="themeClasses.startMenuAppNameText">{{ app.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-center gap-4 px-6 py-1" :class="[themeClasses.startMenuSocialBg, themeClasses.startMenuSocialBorderTop]">
          <a href="https://github.com/BansheeTech/HomeDockOS" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" title="GitHub">
            <Icon :icon="githubIcon" width="16" height="16" />
          </a>
          <a href="https://www.homedock.cloud" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" :title="$t('Website')">
            <Icon :icon="websiteIcon" width="16" height="16" />
          </a>
          <a href="https://docs.homedock.cloud" target="_blank" class="flex items-center justify-center w-6 h-6 rounded-full transition-all hover:-translate-y-0.5" :class="[themeClasses.startMenuSocialLinkBg, themeClasses.startMenuSocialLinkText, themeClasses.startMenuSocialLinkBgHover, themeClasses.startMenuSocialLinkTextHover]" :title="$t('Documentation')">
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
          <button class="flex items-center justify-center w-9 h-9 rounded-lg border-0 cursor-pointer transition-all max-md:!w-10 max-md:!h-10" :class="[themeClasses.startMenuLogoutBg, themeClasses.startMenuLogoutText, themeClasses.startMenuLogoutBgHover, themeClasses.startMenuLogoutTextHover]" @click="handleLogout" :title="$t('Logout')">
            <Icon :icon="logoutIcon" width="20" height="20" />
          </button>
        </div>
      </div>
    </Transition>

    <ContextMenu :visible="systemAppContextMenu.visible" :x="systemAppContextMenu.x" :y="systemAppContextMenu.y" :items="systemAppContextMenuItems" @close="closeSystemAppContextMenu" />
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

import type { SettingsData } from "../__Types__/SettingsData";

import { Icon } from "@iconify/vue";
import searchIcon from "@iconify-icons/mdi/magnify";
import searchOffIcon from "@iconify-icons/mdi/magnify-close";
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
import EnterpriseStartMenuSlots from "../__Components__/EnterpriseStartMenuSlots.vue";
import ContextMenu, { type ContextMenuItem } from "../__Components__/ContextMenu.vue";

import monitorPlusIcon from "@iconify-icons/mdi/monitor-cellphone-star";

import { clientSignOut } from "../__Services__/ClientSignOut";
import { useDisksPlusStore } from "../__Stores__/useDisksPlusStore";

const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const disksPlusStore = useDisksPlusStore();
const { isMobile, gridColumns, taskbarHeightPx } = useResponsive();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const settingsData = inject<SettingsData | null>("data-settings", null);
const userName = computed(() => settingsData?.user_name || "User");

const searchQuery = ref("");
const searchInputRef = ref<HTMLInputElement | null>(null);

const longPressTriggered = ref(false);

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

const hasNoResults = computed(() => searchQuery.value.length > 0 && filteredSystemApps.value.length === 0 && filteredInstalledApps.value.length === 0);

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
  if (longPressTriggered.value) {
    longPressTriggered.value = false;
    return;
  }

  if (Date.now() - dragEndedAt < 250) {
    return;
  }

  if (app.type === "system") {
    desktopStore.openSystemApp(app.id);
  } else if (app.type === "docker" && app.dockerApp) {
    const isRunning = app.dockerApp.status === "running";

    if (isRunning && app.dockerApp.service_url) {
      desktopStore.openDockerApp(app.dockerApp);
    } else {
      windowStore.openUniqueWindow("properties", app.dockerApp.id, {
        title: `${app.dockerApp.display_name || app.dockerApp.name} - Properties`,
        data: { appId: app.dockerApp.id },
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

async function handleLogout() {
  await disksPlusStore.lock();
  clientSignOut(csrfToken.value);
}

function handleEnterpriseOpenWindow(windowType: string, options: any) {
  windowStore.openWindow(windowType, options);
}

const systemAppContextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
});
const contextMenuSystemApp = ref<CombinedApp | null>(null);

const systemAppIconMap: Record<string, string> = {
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

function handleSystemAppContextMenu(event: MouseEvent, app: CombinedApp) {
  event.preventDefault();
  event.stopPropagation();

  if (desktopStore.isSystemIconOnDesktop(app.id)) {
    return;
  }

  contextMenuSystemApp.value = app;
  systemAppContextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
  };
}

const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const longPressApp = ref<CombinedApp | null>(null);
const LONG_PRESS_DURATION = 500;

function handleSystemAppTouchStart(event: TouchEvent, app: CombinedApp) {
  if (desktopStore.isSystemIconOnDesktop(app.id)) {
    return;
  }

  longPressApp.value = app;
  longPressTriggered.value = false;

  const touch = event.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;

  longPressTimer.value = setTimeout(() => {
    longPressTriggered.value = true;
    contextMenuSystemApp.value = app;
    systemAppContextMenu.value = {
      visible: true,
      x: touchX,
      y: touchY,
    };
  }, LONG_PRESS_DURATION);
}

function handleSystemAppTouchEnd() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
  longPressApp.value = null;
}

function handleSystemAppTouchMove() {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
}

function closeSystemAppContextMenu() {
  systemAppContextMenu.value.visible = false;
  contextMenuSystemApp.value = null;
}

const systemAppContextMenuItems = computed<ContextMenuItem[]>(() => {
  const app = contextMenuSystemApp.value;
  if (!app) return [];

  const items: ContextMenuItem[] = [];
  const isOnDesktop = desktopStore.isSystemIconOnDesktop(app.id);

  if (!isOnDesktop) {
    items.push({
      label: "Add to Desktop",
      icon: monitorPlusIcon,
      action: () => {
        const iconString = systemAppIconMap[app.id] || "mdi:application";
        desktopStore.addSystemIconToDesktop(app.id, app.name, iconString);
        closeSystemAppContextMenu();
      },
    });
    items.push({ divider: true });
  }

  items.push({
    label: "Dismiss",
    icon: closeIcon,
    action: () => {
      closeSystemAppContextMenu();
    },
  });

  return items;
});

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
  },
);
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

@media (prefers-reduced-motion: reduce) {
  .hd-grabber-half {
    transition: none;
    transform: none !important;
  }
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

@media (prefers-reduced-motion: reduce) {
  .hd-sheet-revealing .hd-stagger {
    animation: none;
  }
}

.apps-scroll-container,
.apps-section-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.apps-scroll-container::-webkit-scrollbar,
.apps-section-scroll::-webkit-scrollbar {
  display: none;
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
