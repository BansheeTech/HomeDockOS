<!-- homedock-ui/vue3/static/js/__Apps__/AppFileExplorer.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="containerRef" class="app-fileexplorer flex h-full overflow-hidden" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @dragover.prevent @drop.prevent.stop="handleDrop">
    <transition name="dragger-fade">
      <div v-if="isDraggingFiles && canUpload" class="absolute inset-0 z-[9999] pointer-events-none backdrop-blur-sm">
        <div :class="[themeClasses.scopeSelector, themeClasses.dropZoneDragHolder]" class="fullscreen-dragger h-full border-2 border-dashed rounded-lg flex items-center justify-center">
          <div class="flex items-center align-center justify-center flex-col h-full">
            <p class="ant-upload-drag-icon">
              <Icon :icon="currentLocation === 'dropzone' ? cubeIcon : cloudUploadIcon" :class="[themeClasses.dropZoneDragIcon]" class="text-5xl w-16 h-16" />
            </p>
            <p :class="[themeClasses.dropZoneDragUpText]" class="px-4 text-balance text-center text-lg font-semibold mt-4">
              {{ currentLocation === "dropzone" ? "Drop files to upload and encrypt" : "Drop files to upload" }}
            </p>
            <p :class="[themeClasses.dropZoneDragDownText]" class="px-4 text-balance text-center text-sm mt-2">Folders will maintain their structure.</p>
          </div>
        </div>
      </div>
    </transition>

    <div v-if="!isMobileLayout" :class="[themeClasses.fileExplorerSidebar]" class="fileexplorer-sidebar w-52 flex-shrink-0 flex flex-col border-r overflow-hidden">
      <div class="flex-1 overflow-y-auto py-2 px-2">
        <div class="sidebar-section mb-3">
          <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">Locations</div>

          <div class="storage-section">
            <button @click="toggleStorageExpanded" :class="[currentLocation === 'storage' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
              <Icon :icon="folderIcon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate flex-1">Storage</span>
              <Icon :icon="isStorageExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
            </button>

            <div :class="['expand-wrapper', !isStorageExpanded && 'collapsed']">
              <div class="expand-content">
                <div class="pl-4 mt-0.5 space-y-0.5 max-h-52 overflow-y-auto">
                  <button @click="setLocation('storage')" :class="[currentLocation === 'storage' && !currentPath ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs">
                    <Icon :icon="folderOpenIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">All Files</span>
                  </button>
                  <button v-for="folder in defaultStorageFolders" :key="folder" @click="selectStorageFolder(folder)" :class="[currentLocation === 'storage' && currentPath === folder ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs">
                    <Icon :icon="specialFolderIcons[folder] || folderIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">{{ folder }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="dropzone-section">
            <button @click="toggleDropZoneExpanded" :class="[currentLocation === 'dropzone' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
              <Icon :icon="cubeIcon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate flex-1">Drop Zone</span>
              <Icon :icon="lockIcon" class="w-3 h-3 opacity-50" />
              <Icon :icon="isDropZoneExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
            </button>

            <div :class="['expand-wrapper', !isDropZoneExpanded && 'collapsed']">
              <div class="expand-content">
                <div class="pl-4 mt-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                  <button @click="setLocation('dropzone')" :class="[currentLocation === 'dropzone' && !currentPath ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs">
                    <Icon :icon="folderOpenIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">All Files</span>
                  </button>
                  <button v-for="folder in dropZoneFolders" :key="folder" @click="selectDropZoneFolder(folder)" :class="[currentLocation === 'dropzone' && currentPath === folder ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs">
                    <Icon :icon="folderIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">{{ folder }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="appdrive-section">
            <button @click="toggleAppDriveExpanded" :class="[currentLocation === 'appdrive' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
              <Icon :icon="cubeScanIcon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate flex-1">App Drive</span>
              <Icon :icon="dockerIcon" class="w-3 h-3 opacity-50" />
              <Icon :icon="isAppDriveExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
            </button>

            <div :class="['expand-wrapper', !isAppDriveExpanded && 'collapsed']">
              <div class="expand-content">
                <div class="pl-4 mt-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                  <button v-for="container in mainContainers" :key="container.name" @click="selectAppDriveContainer(container.name)" :class="[selectedContainer === container.name && currentLocation === 'appdrive' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs">
                    <div class="relative flex-shrink-0">
                      <BaseImage :src="getAppInfo(container.name).iconPath" :alt="getAppInfo(container.name).displayName" class="w-4 h-4 rounded" draggable="false" />
                      <span :class="[container.status === 'running' ? 'bg-green-500' : 'bg-gray-400']" class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-black/20"></span>
                    </div>
                    <span class="truncate">{{ getAppInfo(container.name).displayName }}</span>
                  </button>
                  <div v-if="mainContainers.length === 0 && !isLoadingContainers" :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] px-2 py-1 opacity-60">No apps available</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div :class="[themeClasses.hrSelector]" class="my-2"></div>

        <div class="sidebar-section">
          <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">System Apps</div>

          <button @click="setLocation('systemapps')" :class="[currentLocation === 'systemapps' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
            <Icon :icon="appsIcon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">Applications</span>
            <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ systemApps.length }}</span>
          </button>

          <button @click="setLocation('utilities')" :class="[currentLocation === 'utilities' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
            <Icon :icon="toolboxOutlineIcon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">Utilities</span>
            <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ utilitiesApps.length }}</span>
          </button>
        </div>

        <div :class="[themeClasses.hrSelector]" class="my-2"></div>

        <div class="sidebar-section">
          <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">Quick Access</div>

          <button @click="setLocation('favorites')" :class="[currentLocation === 'favorites' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
            <Icon :icon="starIcon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">Favorites</span>
            <span v-if="fileExplorerStore.favoritesCount > 0" :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ fileExplorerStore.favoritesCount }}</span>
          </button>

          <button @click="setLocation('recents')" :class="[currentLocation === 'recents' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
            <Icon :icon="historyIcon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">Recents</span>
            <span v-if="fileExplorerStore.recentsCount > 0" :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ fileExplorerStore.recentsCount }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden">
      <div :class="[themeClasses.fileExplorerToolbar]" class="fileexplorer-toolbar flex items-center gap-2 px-3 py-2 border-b flex-shrink-0">
        <div v-if="isMobileLayout" class="relative">
          <div v-if="isNavPopoverOpen" class="fixed inset-0 z-40" @click="isNavPopoverOpen = false"></div>

          <button @click="isNavPopoverOpen = !isNavPopoverOpen" :class="[themeClasses.dropZoneSortButton]" class="p-1.5 rounded transition-colors relative z-50" title="Navigation">
            <div class="nav-burger-icon" :class="{ 'nav-burger-open': isNavPopoverOpen }">
              <Icon :icon="menuIcon" class="nav-burger-menu w-4 h-4" />
              <Icon :icon="closeIcon" class="nav-burger-close w-4 h-4" />
            </div>
          </button>

          <transition name="popover-fade">
            <div v-if="isNavPopoverOpen" class="nav-popover absolute top-full left-0 mt-1 z-50 w-56 max-h-[70vh] overflow-y-auto rounded-lg shadow-xl border" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder]">
              <div class="py-2 px-2">
                <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">Locations</div>

                <div class="storage-section">
                  <button @click="toggleStorageExpanded" :class="[currentLocation === 'storage' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
                    <Icon :icon="folderIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate flex-1">Storage</span>
                    <Icon :icon="isStorageExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
                  </button>

                  <div :class="['expand-wrapper', !isStorageExpanded && 'collapsed']">
                    <div class="expand-content">
                      <div class="pl-4 mt-0.5 space-y-0.5 max-h-52 overflow-y-auto">
                        <button
                          @click="
                            setLocation('storage');
                            isNavPopoverOpen = false;
                          "
                          :class="[currentLocation === 'storage' && !currentPath ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs"
                        >
                          <Icon :icon="folderOpenIcon" class="w-4 h-4 flex-shrink-0" />
                          <span class="truncate">All Files</span>
                        </button>
                        <button
                          v-for="folder in defaultStorageFolders"
                          :key="folder"
                          @click="
                            selectStorageFolder(folder);
                            isNavPopoverOpen = false;
                          "
                          :class="[currentLocation === 'storage' && currentPath === folder ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs"
                        >
                          <Icon :icon="specialFolderIcons[folder] || folderIcon" class="w-4 h-4 flex-shrink-0" />
                          <span class="truncate">{{ folder }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="dropzone-section">
                  <button @click="toggleDropZoneExpanded" :class="[currentLocation === 'dropzone' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
                    <Icon :icon="cubeIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate flex-1">Drop Zone</span>
                    <Icon :icon="lockIcon" class="w-3 h-3 opacity-50" />
                    <Icon :icon="isDropZoneExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
                  </button>

                  <div :class="['expand-wrapper', !isDropZoneExpanded && 'collapsed']">
                    <div class="expand-content">
                      <div class="pl-4 mt-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                        <button
                          @click="
                            setLocation('dropzone');
                            isNavPopoverOpen = false;
                          "
                          :class="[currentLocation === 'dropzone' && !currentPath ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs"
                        >
                          <Icon :icon="folderOpenIcon" class="w-4 h-4 flex-shrink-0" />
                          <span class="truncate">All Files</span>
                        </button>
                        <button
                          v-for="folder in dropZoneFolders"
                          :key="folder"
                          @click="
                            selectDropZoneFolder(folder);
                            isNavPopoverOpen = false;
                          "
                          :class="[currentLocation === 'dropzone' && currentPath === folder ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs"
                        >
                          <Icon :icon="folderIcon" class="w-4 h-4 flex-shrink-0" />
                          <span class="truncate">{{ folder }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="appdrive-section">
                  <button @click="toggleAppDriveExpanded" :class="[currentLocation === 'appdrive' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]" class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm">
                    <Icon :icon="cubeScanIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate flex-1">App Drive</span>
                    <Icon :icon="dockerIcon" class="w-3 h-3 opacity-50" />
                    <Icon :icon="isAppDriveExpanded ? chevronDownIcon : chevronRightIcon" class="w-3 h-3 transition-transform" />
                  </button>

                  <div :class="['expand-wrapper', !isAppDriveExpanded && 'collapsed']">
                    <div class="expand-content">
                      <div class="pl-4 mt-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                        <button
                          v-for="container in mainContainers"
                          :key="container.name"
                          @click="
                            selectAppDriveContainer(container.name);
                            isNavPopoverOpen = false;
                          "
                          :class="[selectedContainer === container.name && currentLocation === 'appdrive' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                          class="w-full flex items-center gap-2 px-2 py-1 rounded text-left transition-colors text-xs"
                        >
                          <div class="relative flex-shrink-0">
                            <BaseImage :src="getAppInfo(container.name).iconPath" :alt="getAppInfo(container.name).displayName" class="w-4 h-4 rounded" draggable="false" />
                            <span :class="[container.status === 'running' ? 'bg-green-500' : 'bg-gray-400']" class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-black/20"></span>
                          </div>
                          <span class="truncate">{{ getAppInfo(container.name).displayName }}</span>
                        </button>
                        <div v-if="mainContainers.length === 0 && !isLoadingContainers" :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] px-2 py-1 opacity-60">No apps available</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div :class="[themeClasses.hrSelector]" class="my-2"></div>

                <div class="sidebar-section">
                  <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">System Apps</div>

                  <button
                    @click="
                      setLocation('systemapps');
                      isNavPopoverOpen = false;
                    "
                    :class="[currentLocation === 'systemapps' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                    class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                  >
                    <Icon :icon="appsIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">Applications</span>
                    <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ systemApps.length }}</span>
                  </button>

                  <button
                    @click="
                      setLocation('utilities');
                      isNavPopoverOpen = false;
                    "
                    :class="[currentLocation === 'utilities' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                    class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                  >
                    <Icon :icon="toolboxOutlineIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">Utilities</span>
                    <span :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ utilitiesApps.length }}</span>
                  </button>
                </div>

                <div :class="[themeClasses.hrSelector]" class="my-2"></div>

                <div class="sidebar-section">
                  <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">Quick Access</div>

                  <button
                    @click="
                      setLocation('favorites');
                      isNavPopoverOpen = false;
                    "
                    :class="[currentLocation === 'favorites' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                    class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                  >
                    <Icon :icon="starIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">Favorites</span>
                    <span v-if="fileExplorerStore.favoritesCount > 0" :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ fileExplorerStore.favoritesCount }}</span>
                  </button>

                  <button
                    @click="
                      setLocation('recents');
                      isNavPopoverOpen = false;
                    "
                    :class="[currentLocation === 'recents' ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                    class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                  >
                    <Icon :icon="historyIcon" class="w-4 h-4 flex-shrink-0" />
                    <span class="truncate">Recents</span>
                    <span v-if="fileExplorerStore.recentsCount > 0" :class="[themeClasses.fileExplorerBadge]" class="text-[9px] px-1.5 rounded-full ml-auto">{{ fileExplorerStore.recentsCount }}</span>
                  </button>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <transition name="mobile-search-icon">
          <button v-if="!isSearchExpanded && (currentLocation === 'storage' || currentLocation === 'dropzone' || (currentLocation === 'appdrive' && selectedContainer))" @click="isSearchExpanded = true" :class="[themeClasses.dropZoneSortButton]" class="h-7 w-7 rounded transition-colors flex items-center justify-center flex-shrink-0" title="Search">
            <Icon :icon="magnifyIcon" class="w-4 h-4" />
          </button>
        </transition>

        <transition name="mobile-search-expand" @after-enter="focusSearchInput">
          <div v-if="isSearchExpanded" class="flex-1 flex items-center gap-2 min-w-0">
            <AutoComplete v-model:value="searchQuery" :options="filteredSearchOptions" :popup-class-name="`${themeClasses.scopeSelector}`" class="flex-1 min-w-0" @select="handleSearchSelect">
              <template #option="{ label, isDirectory }">
                <div class="flex items-center gap-2">
                  <Icon :icon="isDirectory ? folderIcon : unknownFileIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ label }}</span>
                </div>
              </template>
              <InputSearch ref="searchInputRef" v-model:value="searchQuery" placeholder="Search..." class="w-full text-sm [&_.ant-input-affix-wrapper]:!h-7 [&_.ant-input-affix-wrapper]:!py-0 [&_.ant-input-search-button]:!h-7 [&_.ant-input-search-button]:!flex [&_.ant-input-search-button]:!items-center [&_.ant-input-search-button]:!justify-center" size="small" enter-button @search="() => performSearch()">
                <template #prefix>
                  <Icon v-if="isSearching" :icon="loadingIcon" :class="[themeClasses.dropZoneInputIcon, 'animate-spin']" class="mx-1" />
                  <Icon v-else :icon="currentLocation === 'dropzone' ? cubeIcon : currentLocation === 'appdrive' ? cubeScanIcon : folderIcon" :class="[themeClasses.dropZoneInputIcon]" class="mx-1" />
                </template>
              </InputSearch>
            </AutoComplete>
            <button
              @click="
                isSearchExpanded = false;
                searchQuery = '';
              "
              :class="[themeClasses.dropZoneSortButton]"
              class="h-7 w-7 rounded transition-colors flex items-center justify-center flex-shrink-0"
              title="Cancel"
            >
              <Icon :icon="closeIcon" class="w-4 h-4" />
            </button>
          </div>
        </transition>

        <transition name="mobile-controls-fade">
          <Select v-if="currentLocation === 'appdrive' && mounts.length > 1 && !isSearchExpanded && !isMobileLayout" v-model:value="selectedMountIndex" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="min-w-[180px] rounded text-xs flex-shrink-0 [&_.ant-select-selector]:!min-h-0 [&_.ant-select-selector]:!h-7 [&_.ant-select-selector]:!py-0 [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selection-item]:!flex [&_.ant-select-selection-item]:!items-center" :popup-class-name="`${themeClasses.scopeSelector}`" :show-search="false" @change="handleMountChange" size="small">
            <template #suffixIcon>
              <Icon :icon="dockerIcon" class="w-3 h-3" />
            </template>
            <SelectOption v-for="(mount, index) in mounts" :key="index" :value="index">
              <div class="flex items-center gap-2 text-xs">
                <Icon :icon="mount.read_only ? lockIcon : folderIcon" class="w-3 h-3 flex-shrink-0" />
                <span class="truncate">{{ mount.container_path }}</span>
              </div>
            </SelectOption>
          </Select>
        </transition>

        <div v-if="isMobileLayout && currentLocation === 'appdrive' && mounts.length > 1 && !isSearchExpanded" class="relative">
          <div v-if="isVolumePopoverOpen" class="fixed inset-0 z-40" @click="isVolumePopoverOpen = false"></div>

          <button @click="isVolumePopoverOpen = !isVolumePopoverOpen" :class="[themeClasses.dropZoneSortButton]" class="h-7 w-7 rounded transition-colors flex items-center justify-center relative z-50" :title="mounts[selectedMountIndex]?.container_path || 'Select Volume'">
            <Icon :icon="dockerIcon" class="w-4 h-4" />
          </button>

          <transition name="popover-fade">
            <div v-if="isVolumePopoverOpen" class="absolute top-full left-0 mt-1 z-50 w-56 max-h-[50vh] overflow-y-auto rounded-lg shadow-xl border" :class="[themeClasses.contextMenuBg, themeClasses.contextMenuBorder]">
              <div class="py-2 px-2">
                <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="text-[10px] font-semibold uppercase tracking-wider px-2 mb-1 opacity-60">Volumes</div>
                <button
                  v-for="(mount, index) in mounts"
                  :key="index"
                  @click="
                    selectedMountIndex = index;
                    handleMountChange();
                    isVolumePopoverOpen = false;
                  "
                  :class="[selectedMountIndex === index ? themeClasses.fileExplorerSidebarItemActive : themeClasses.fileExplorerSidebarItem]"
                  class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left transition-colors text-sm"
                >
                  <Icon :icon="mount.read_only ? lockIcon : folderIcon" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate flex-1">{{ mount.container_path }}</span>
                  <Icon v-if="selectedMountIndex === index" :icon="checkIcon" class="w-3 h-3 flex-shrink-0 opacity-70" />
                </button>
              </div>
            </div>
          </transition>
        </div>

        <div v-if="!isSearchExpanded" class="flex-1"></div>

        <transition name="mobile-controls-fade">
          <div v-if="!isSearchExpanded" class="flex items-center gap-2 flex-shrink-0">
            <template v-if="currentLocation !== 'systemapps' && currentLocation !== 'utilities'">
              <Select v-model:value="sortBy" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="w-24 rounded text-xs [&_.ant-select-selector]:!min-h-0 [&_.ant-select-selector]:!h-7 [&_.ant-select-selector]:!py-0 [&_.ant-select-selector]:!leading-7 [&_.ant-select-selection-item]:!leading-7" :popup-class-name="`${themeClasses.scopeSelector}`" :show-search="false" size="small">
                <SelectOption value="name">Name</SelectOption>
                <SelectOption value="size">Size</SelectOption>
                <SelectOption value="date">Date</SelectOption>
              </Select>

              <button @click="toggleSortDirection" :class="[themeClasses.dropZoneSortButton]" class="h-7 w-7 rounded transition-colors flex items-center justify-center" :title="sortDirection === 'asc' ? 'Ascending' : 'Descending'">
                <Icon :icon="sortDirection === 'asc' ? sortAscIcon : sortDescIcon" class="w-4 h-4" />
              </button>
            </template>

            <button @click="toggleViewMode" :class="[themeClasses.dropZoneSortButton]" class="h-7 w-7 rounded transition-colors flex items-center justify-center" :title="viewMode === 'grid' ? 'List View' : 'Grid View'">
              <Icon :icon="viewMode === 'grid' ? viewListIcon : viewGridIcon" class="w-4 h-4" />
            </button>

            <button v-if="currentLocation !== 'systemapps' && currentLocation !== 'utilities'" @click="refreshFiles" :class="[themeClasses.dropZoneSortButton]" class="h-7 w-7 rounded transition-colors flex items-center justify-center" title="Refresh">
              <Icon :icon="refreshIcon" :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
            </button>
          </div>
        </transition>
      </div>

      <div v-if="showBreadcrumbs" ref="breadcrumbsRef" :class="[themeClasses.fileExplorerBreadcrumbs]" class="flex items-center gap-1 px-3 py-1.5 text-[11px] border-b flex-shrink-0 overflow-x-scroll [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button @click="navigateToRoot" :class="[themeClasses.dropZoneSortButton]" class="px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity flex items-center gap-1 flex-shrink-0">
          <Icon :icon="locationIcon" class="w-3 h-3" />
          <span>{{ locationLabel }}</span>
        </button>
        <template v-for="(part, index) in pathParts" :key="index">
          <Icon :icon="chevronRightIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-3 h-3 opacity-50 flex-shrink-0" />
          <button @click="navigateToPathIndex(index)" :class="[themeClasses.dropZoneSortButton]" class="px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity truncate max-w-[120px] flex-shrink-0">
            {{ part }}
          </button>
        </template>
      </div>

      <div :class="[themeClasses.fileExplorerInfoBar]" class="flex items-center gap-2 px-3 py-1 text-[10px] border-b flex-shrink-0">
        <span :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5">
          <template v-if="currentLocation === 'systemapps'"> {{ systemAppsAsFiles.length }} {{ systemAppsAsFiles.length === 1 ? "app" : "apps" }} </template>
          <template v-else-if="currentLocation === 'utilities'"> {{ utilitiesAsFiles.length }} {{ utilitiesAsFiles.length === 1 ? "utility" : "utilities" }} </template>
          <template v-else>
            {{ displayFiles.length }} {{ displayFiles.length === 1 ? "item" : "items" }}
            <span v-if="isSearchMode" class="ml-0.5">(global search)</span>
          </template>
        </span>
        <span v-if="totalSize !== '0 B' && displayFiles.length > 0 && !isSpecialLocation && currentLocation !== 'systemapps' && currentLocation !== 'utilities'" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5"> {{ totalSize }} total </span>
        <span v-if="isReadOnly" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5 flex items-center gap-1">
          <Icon :icon="lockIcon" class="w-3 h-3" />
          Read-only
        </span>
        <span v-if="currentLocation === 'dropzone'" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5 flex items-center gap-1">
          <Icon :icon="shieldLockIcon" class="w-3 h-3" />
          Encrypted
        </span>
      </div>

      <div ref="filesAreaRef" class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2 relative" @mousedown="handleContainerMouseDown" @contextmenu="showContextMenu($event, null)" @touchstart="handleContainerTouchStart" @touchmove="handleContainerTouchMove" @touchend="handleContainerTouchEnd" @touchcancel="handleContainerTouchEnd">
        <SelectionBox :visible="isSelectingArea" :style="selectionBoxStyle" />

        <transition name="location-fade" mode="out-in">
          <div :key="`${currentLocation}-${selectedContainer || ''}-${currentPath}`">
            <div v-if="isLoading" class="flex flex-col items-center justify-center h-full text-center py-12">
              <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-12 h-12 animate-spin mb-4" />
              <p :class="[themeClasses.dropZoneEmptyText]" class="text-sm">Loading...</p>
            </div>

            <div v-else-if="sortedFiles.length === 0 && currentLocation !== 'systemapps' && currentLocation !== 'utilities'" class="flex flex-col items-center justify-center h-full text-center py-12">
              <Icon :icon="emptyIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-16 h-16 opacity-30 mb-4" />
              <p :class="[themeClasses.dropZoneEmptyText]" class="text-sm">{{ emptyMessage }}</p>
            </div>
            <transition v-else :name="viewMode === 'grid' ? 'view-mode-fade' : 'list-view-fade'" mode="out-in">
              <div v-if="viewMode === 'grid'" key="grid-view" class="w-full select-none" :style="{ minHeight: `${gridContainerHeight}px` }">
                <template v-if="currentLocation === 'systemapps'">
                  <div class="fileexplorer-grid" :style="{ height: `${systemAppsGridHeight}px` }">
                    <div v-for="app in positionedSystemApps" :key="app.name" :data-filename="app.name" :style="{ position: 'absolute', left: `${app.x}px`, top: `${app.y}px` }" :class="['inline-flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px] select-none', isFileSelected(app) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected] : ['border-transparent', themeClasses.desktopIconBg]]" @click="handleFileClick(app, $event)" @dblclick="handleFileDoubleClick(app)" @touchstart="handleFileTouchStart(app, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(app, $event)">
                      <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg, isFileSelected(app) && themeClasses.desktopIconContainerBgSelected]">
                        <Icon :icon="getFileIcon(app)" :class="[themeClasses.dropZoneFileIcon]" class="h-10 w-10" />
                      </div>
                      <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="app.display_name">
                        {{ app.display_name }}
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else-if="currentLocation === 'utilities'">
                  <div class="fileexplorer-grid" :style="{ height: `${utilitiesGridHeight}px` }">
                    <div v-for="util in positionedUtilities" :key="util.name" :data-filename="util.name" :style="{ position: 'absolute', left: `${util.x}px`, top: `${util.y}px` }" :class="['inline-flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px] select-none', isFileSelected(util) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected] : ['border-transparent', themeClasses.desktopIconBg]]" @click="handleFileClick(util, $event)" @dblclick="handleFileDoubleClick(util)" @touchstart="handleFileTouchStart(util, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(util, $event)">
                      <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg, isFileSelected(util) && themeClasses.desktopIconContainerBgSelected]">
                        <Icon :icon="getFileIcon(util)" :class="[themeClasses.dropZoneFileIcon]" class="h-10 w-10" />
                      </div>
                      <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="util.display_name">
                        {{ util.display_name }}
                      </span>
                    </div>
                  </div>
                </template>
                <template v-else-if="isSpecialLocation && groupedDisplayFiles.length > 0">
                  <div v-for="group in groupedDisplayFiles" :key="group.key" class="mb-4">
                    <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="flex items-center gap-2 px-1 py-1.5 mb-2 text-xs font-semibold opacity-80">
                      <Icon :icon="group.icon" class="w-4 h-4" />
                      <span>{{ group.label }}</span>
                      <span class="opacity-50 font-normal">({{ group.files.length }})</span>
                    </div>
                    <div class="fileexplorer-grid" :style="{ height: `${group.gridHeight}px` }">
                      <div v-for="file in group.positionedFiles" :key="`${group.key}-${file.name}`" :data-filename="file.name" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" :class="['inline-flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px] select-none', isFileSelected(file) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected] : ['border-transparent', themeClasses.desktopIconBg]]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                        <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg, isFileSelected(file) && themeClasses.desktopIconContainerBgSelected]">
                          <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon]" class="h-10 w-10" />
                        </div>
                        <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="file.display_name || file.name">
                          {{ getDisplayName(file) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="isSearchMode">
                  <div v-for="group in groupedFilesByFolder" :key="group.folder" class="mb-4">
                    <div :class="[themeClasses.dropZoneTotalSizeScope]" class="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-md sticky top-0 z-30">
                      <Icon :icon="folderIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                      <span class="text-[10px] font-semibold truncate">
                        {{ group.folder === "" ? "Root" : group.folder }}
                      </span>
                      <span class="text-[9px] opacity-60 ml-auto flex-shrink-0 whitespace-nowrap"> {{ group.files.length }} {{ group.files.length === 1 ? "item" : "items" }} </span>
                    </div>
                    <div class="fileexplorer-grid" :style="{ height: `${group.gridHeight}px` }">
                      <TransitionGroup name="file-item">
                        <div v-for="file in group.positionedFiles" :key="file.name" :data-filename="file.name" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" :class="['inline-flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px] select-none', isFileSelected(file) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected] : ['border-transparent', themeClasses.desktopIconBg]]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                          <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg, isFileSelected(file) && themeClasses.desktopIconContainerBgSelected]">
                            <div v-if="!file.is_directory && file.size > 0" :class="[themeClasses.dropZoneFileSize]" class="absolute -left-1 -top-1 text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap z-10">
                              {{ formatSizeCompact(file.size) }}
                            </div>
                            <div v-if="getRelativeTime(file)" class="absolute -left-1 -bottom-1 flex items-center gap-0.5 z-10">
                              <div :class="[themeClasses.dropZoneFileSize]" class="text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap">
                                {{ getRelativeTime(file) }}
                              </div>
                            </div>
                            <div v-if="currentLocation === 'dropzone' && !file.is_directory" class="absolute -right-1 -top-1 flex items-center gap-0.5">
                              <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-3 w-3" />
                              <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-3 w-3" />
                            </div>
                            <div v-if="compressingFolders.has(file.name)" class="absolute -right-1 -top-1 z-20">
                              <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4" />
                            </div>

                            <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-10 w-10 transition duration-300 group-hover:scale-110" />

                            <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center z-10">
                              <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-7 w-7 animate-spin" />
                            </div>
                          </div>

                          <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="file.display_name || file.name">
                            {{ file.name.split("/").pop() }}
                          </span>
                          <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute -bottom-1 left-2 right-2">
                            <Progress :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector]" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                          </div>
                        </div>
                      </TransitionGroup>
                    </div>
                  </div>
                </template>
                <div v-else class="fileexplorer-grid" :style="{ height: `${gridContainerHeight}px` }">
                  <TransitionGroup name="file-item">
                    <div v-for="file in positionedFiles" :key="file.name" :data-filename="file.name" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" :class="['inline-flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border', 'transition-[background,border] duration-150', 'w-[100px] h-[120px] select-none', isFileSelected(file) ? [themeClasses.desktopIconBgSelected, themeClasses.desktopIconBorderSelected] : ['border-transparent', themeClasses.desktopIconBg]]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                      <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg, isFileSelected(file) && themeClasses.desktopIconContainerBgSelected]">
                        <div v-if="!file.is_directory && file.size > 0" :class="[themeClasses.dropZoneFileSize]" class="absolute -left-1 -top-1 text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap z-10">
                          {{ formatSizeCompact(file.size) }}
                        </div>
                        <div v-if="getRelativeTime(file)" class="absolute -left-1 -bottom-1 flex items-center gap-0.5 z-10">
                          <div :class="[themeClasses.dropZoneFileSize]" class="text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap">
                            {{ getRelativeTime(file) }}
                          </div>
                        </div>
                        <div v-if="currentLocation === 'dropzone' && !file.is_directory" class="absolute -right-1 -top-1 flex items-center gap-0.5">
                          <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-3 w-3" />
                          <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-3 w-3" />
                        </div>
                        <div v-if="compressingFolders.has(file.name)" class="absolute -right-1 -top-1 z-20">
                          <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4" />
                        </div>

                        <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-10 w-10 transition duration-300 group-hover:scale-110" />

                        <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center z-10">
                          <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-7 w-7 animate-spin" />
                        </div>
                      </div>

                      <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="file.display_name || file.name">
                        {{ getDisplayName(file) }}
                      </span>
                      <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute -bottom-1 left-2 right-2">
                        <Progress :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector]" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
              <div v-else :key="`list-view-${currentPath}`" class="fileexplorer-list w-full select-none">
                <template v-if="currentLocation === 'systemapps'">
                  <div v-for="app in systemAppsAsFiles" :key="app.name" :data-filename="app.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors overflow-hidden', isFileSelected(app) ? themeClasses.desktopIconBgSelected : themeClasses.desktopIconBg]" @click="handleFileClick(app, $event)" @dblclick="handleFileDoubleClick(app)" @touchstart="handleFileTouchStart(app, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(app, $event)">
                    <div class="relative flex-shrink-0 z-[1]">
                      <Icon :icon="getFileIcon(app)" :class="[themeClasses.dropZoneFileIcon]" class="h-5 w-5" />
                    </div>
                    <div class="flex-1 overflow-hidden z-[1]">
                      <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="(app as any)._appDescription">
                        {{ app.display_name }}
                      </span>
                    </div>
                    <div :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">App</div>
                  </div>
                </template>
                <template v-else-if="currentLocation === 'utilities'">
                  <div v-for="util in utilitiesAsFiles" :key="util.name" :data-filename="util.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors overflow-hidden', isFileSelected(util) ? themeClasses.desktopIconBgSelected : themeClasses.desktopIconBg]" @click="handleFileClick(util, $event)" @dblclick="handleFileDoubleClick(util)" @touchstart="handleFileTouchStart(util, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(util, $event)">
                    <div class="relative flex-shrink-0 z-[1]">
                      <Icon :icon="getFileIcon(util)" :class="[themeClasses.dropZoneFileIcon]" class="h-5 w-5" />
                    </div>
                    <div class="flex-1 overflow-hidden z-[1]">
                      <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="(util as any)._appDescription">
                        {{ util.display_name }}
                      </span>
                    </div>
                    <div :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">Utility</div>
                  </div>
                </template>
                <template v-else-if="isSpecialLocation">
                  <div v-for="group in groupedDisplayFiles" :key="group.key" class="mb-4">
                    <div :class="[themeClasses.fileExplorerSidebarSectionTitle]" class="flex items-center gap-2 px-1 py-1.5 mb-2 text-xs font-semibold opacity-80">
                      <Icon :icon="group.icon" class="w-4 h-4" />
                      <span>{{ group.label }}</span>
                      <span class="opacity-50 font-normal">({{ group.files.length }})</span>
                    </div>
                    <div v-for="file in group.files" :key="`${group.key}-${file.name}`" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors overflow-hidden', isFileSelected(file) ? themeClasses.desktopIconBgSelected : themeClasses.desktopIconBg]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                      <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                      <div class="relative flex-shrink-0 z-[1]">
                        <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />

                        <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                          <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                        </div>
                      </div>

                      <div class="flex-1 overflow-hidden z-[1]">
                        <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.display_name || file.name">
                          {{ getDisplayName(file) }}
                        </span>
                      </div>

                      <div v-if="getRelativeTime(file)" :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                        {{ getRelativeTime(file) }}
                      </div>
                    </div>
                  </div>
                </template>
                <template v-else-if="isSearchMode">
                  <template v-for="group in groupedFilesByFolder" :key="group.folder">
                    <div :class="[themeClasses.dropZoneTotalSizeScope]" class="flex items-center gap-2 px-2 py-1.5 mt-2 mb-1 rounded-md sticky top-0 z-30">
                      <Icon :icon="folderIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                      <span class="text-[10px] font-semibold truncate">
                        {{ group.folder === "" ? "Root" : group.folder }}
                      </span>
                      <span class="text-[9px] opacity-60 ml-auto flex-shrink-0 whitespace-nowrap"> {{ group.files.length }} {{ group.files.length === 1 ? "item" : "items" }} </span>
                    </div>

                    <TransitionGroup name="file-item-list">
                      <div v-for="file in group.files" :key="file.name" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors overflow-hidden ml-4', isFileSelected(file) ? themeClasses.desktopIconBgSelected : themeClasses.desktopIconBg]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                        <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                        <div class="relative flex-shrink-0 z-[1]">
                          <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />
                          <div v-if="currentLocation === 'dropzone' && !file.is_directory" class="absolute -right-1 -bottom-1">
                            <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-2 w-2" />
                            <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-2 w-2" />
                          </div>

                          <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                            <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                          </div>
                        </div>

                        <div class="flex-1 overflow-hidden z-[1]">
                          <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.name">
                            {{ file.name.split("/").pop() }}
                          </span>
                        </div>

                        <div v-if="!file.is_directory" :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                          {{ formatSize(file.size) }}
                        </div>

                        <div v-if="getRelativeTime(file)" :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                          {{ getRelativeTime(file) }}
                        </div>
                      </div>
                    </TransitionGroup>
                  </template>
                </template>
                <TransitionGroup v-else name="file-item-list">
                  <div v-for="file in sortedFiles" :key="file.name" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors overflow-hidden', isFileSelected(file) ? themeClasses.desktopIconBgSelected : themeClasses.desktopIconBg]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)">
                    <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                    <div class="relative flex-shrink-0 z-[1]">
                      <Icon :icon="getFileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />
                      <div v-if="currentLocation === 'dropzone' && !file.is_directory" class="absolute -right-1 -bottom-1">
                        <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-2 w-2" />
                        <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-2 w-2" />
                      </div>

                      <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                        <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                      </div>
                    </div>

                    <div class="flex-1 overflow-hidden z-[1]">
                      <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.display_name || file.name">
                        {{ getDisplayName(file) }}
                      </span>
                    </div>

                    <div v-if="!file.is_directory" :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                      {{ formatSize(file.size) }}
                    </div>

                    <div v-if="getRelativeTime(file)" :class="[themeClasses.dropZoneFileSize]" class="text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                      {{ getRelativeTime(file) }}
                    </div>
                  </div>
                </TransitionGroup>
              </div>
            </transition>
          </div>
        </transition>
      </div>
      <transition name="upload-slide-up">
        <div v-if="isUploading" class="border-t" :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]">
          <div :class="[themeClasses.hrSelector]"></div>

          <div @click="currentUploads.length > 0 && (isUploadPanelExpanded = !isUploadPanelExpanded)" class="flex items-center gap-2 h-7 pb-0.5 px-3" :class="currentUploads.length > 0 ? 'cursor-pointer hover:opacity-80' : 'cursor-default'" style="transition: opacity 0.15s ease">
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneDragIcon]" class="w-3.5 h-3.5 flex-shrink-0 animate-spin" />
              <span :class="[themeClasses.dropZoneDragUpText]" class="text-[10px] leading-none truncate">
                <template v-if="currentUploads.length > 0"
                  >{{ currentUploads.length }} uploading<template v-if="currentQueue.length > 0">, {{ currentQueue.length }} queued</template></template
                >
                <template v-else>{{ currentQueue.length }} queued, waiting...</template>
              </span>
            </div>

            <div class="flex mt-1.5 items-center flex-1 max-w-xs">
              <Progress :percent="totalUploadProgress" :class="[themeClasses.scopeSelector]" :show-info="false" :size="2" status="active" class="rounded-full flex-1" />
            </div>

            <Icon v-if="currentUploads.length > 0" :icon="chevronUpIcon" :class="[themeClasses.dropZoneFileIcon, 'transition-transform duration-200', isUploadPanelExpanded && 'rotate-180']" class="w-3.5 h-3.5 flex-shrink-0" />
          </div>

          <div :class="['expand-wrapper', !isUploadPanelExpanded && 'collapsed']">
            <div class="expand-content">
              <div :class="[themeClasses.dropZoneFileDisplayer]">
                <div :class="[themeClasses.hrSelector]"></div>
                <div class="max-h-40 overflow-y-auto py-1">
                  <div v-for="upload in currentUploads" :key="upload.uid" class="px-3 py-1.5">
                    <div class="flex items-center gap-1.5">
                      <Icon :icon="cubeIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5 mb-0.5">
                          <p :class="[themeClasses.dropZoneFileText]" class="text-[11px] font-medium truncate flex-1" :title="upload.name">
                            {{ upload.name }}
                          </p>
                          <span :class="[themeClasses.dropZoneFileSize]" class="text-[9px] font-semibold px-1 rounded whitespace-nowrap"> {{ uploadProgress[upload.uid] || 0 }}% </span>
                        </div>
                        <Progress :percent="uploadProgress[upload.uid] || 0" :class="[themeClasses.scopeSelector]" :show-info="false" :size="1.5" status="active" class="rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
      <StatusBar :icon="statusBarIcon" :message="statusBarMessage" :info="statusBarInfo" :showHelp="true">
        <template #help>
          <div class="space-y-2.5 max-w-sm">
            <div class="flex items-center gap-2">
              <Icon :icon="folderMultipleIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
              <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">File Explorer</h4>
            </div>

            <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
              <p><strong>Storage:</strong> Your personal file storage. Files are stored as-is without encryption.</p>
              <p><strong>Drop Zone:</strong> Encrypted storage. Every file is automatically encrypted with AES-256-GCM using your unique user key.</p>
              <p><strong>App Drive:</strong> Access files from your Docker containers' mounted volumes.</p>
            </div>
          </div>
        </template>
      </StatusBar>
    </div>
    <ContextMenu :visible="contextMenuVisible" :x="contextMenuX" :y="contextMenuY" :items="contextMenuItems" @close="closeContextMenu" />
    <AppDialog v-model:visible="deleteDialogVisible" type="confirm" :title="deleteDialogTitle" :content="deleteDialogContent" ok-text="Delete" cancel-text="Cancel" @ok="confirmDelete" @cancel="deleteDialogVisible = false" />

    <AppDialog v-model:visible="createFolderDialogVisible" type="info" title="Create New Folder" ok-text="Create" cancel-text="Cancel" @ok="createFolder" @cancel="createFolderDialogVisible = false" :icon="folderPlusIcon">
      <div class="mb-1">
        <label :class="[themeClasses.notTextDown]" class="text-sm block mb-2">Folder name (max 255 characters)</label>
        <Input v-model:value="newFolderName" placeholder="Enter folder name..." @pressEnter="createFolder" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-10" autofocus :maxlength="255">
          <template #prefix>
            <Icon :icon="folderIcon" :class="[themeClasses.formIcon]" class="mr-0.5 transition duration-300" width="16" height="16" />
          </template>
        </Input>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="renameDialogVisible" type="info" title="Rename Item" ok-text="Rename" cancel-text="Cancel" @ok="performRename" @cancel="renameDialogVisible = false" :icon="pencilIcon">
      <div class="mb-1">
        <label :class="[themeClasses.notTextDown]" class="text-sm block mb-2">New name (max 255 characters)</label>
        <Input v-model:value="renameValue" placeholder="Enter new name..." @pressEnter="performRename" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" class="h-10" autofocus :maxlength="255">
          <template #prefix>
            <Icon :icon="pencilIcon" :class="[themeClasses.formIcon]" class="mr-0.5 transition duration-300" width="16" height="16" />
          </template>
        </Input>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="folderUploadWarningVisible" type="info" title="Folder Upload Detected" ok-text="Upload Folder" cancel-text="Cancel" @ok="confirmFolderUpload" @cancel="cancelFolderUpload" :icon="folderIcon" :width="480" :reverse-buttons="true">
      <div class="space-y-3">
        <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">
          You are about to upload <strong>{{ pendingUploadData?.allFiles.length || 0 }} files</strong> across <strong>{{ pendingUploadData?.folders.length || 0 }} directories</strong>.
          <span v-if="currentLocation === 'dropzone'"> Each file will be encrypted individually.</span>
        </p>
        <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">The folder structure will be preserved.</p>
      </div>
    </AppDialog>
    <Upload v-if="canUpload" v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleUploadChange" :showUploadList="false" class="fixed bottom-10 right-2 z-50 hidden max-[900px]:block">
      <button :class="[themeClasses.dropZoneSortButton]" class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 active:scale-95 border-none cursor-pointer" title="Upload Files">
        <Icon :icon="cloudUploadIcon" class="w-6 h-6" />
      </button>
    </Upload>

    <StatusBubble :visible="showUploadStatus" :message="uploadStatusMessage" position="bottom-left" />
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useFileExplorerStore, type FileExplorerLocation } from "../__Stores__/useFileExplorerStore";
import { useUploadingStore, type UploadLocation } from "../__Stores__/useUploadingStore";
import { useFileViewerPrefsStore } from "../__Stores__/useFileViewerPrefsStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { getStartMenuApps } from "../__Config__/WindowDefaultDetails";
import { UTILITIES_APPS } from "../__Config__/UtilitiesDefaultDetails";

import { message, Upload, AutoComplete, InputSearch, Progress, Select, SelectOption, Input } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import folderIcon from "@iconify-icons/mdi/folder";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";
import folderArrowLeftIcon from "@iconify-icons/mdi/folder-arrow-left";
import folderPlusIcon from "@iconify-icons/mdi/folder-plus";
import folderMultipleIcon from "@iconify-icons/mdi/folder-multiple";
import notebookIcon from "@iconify-icons/mdi/notebook";
import fileDocumentMultipleIcon from "@iconify-icons/mdi/file-document-multiple";
import imageMultipleIcon from "@iconify-icons/mdi/image-multiple";
import videoBoxIcon from "@iconify-icons/mdi/video-box";
import musicBoxMultipleIcon from "@iconify-icons/mdi/music-box-multiple";
import downloadBoxIcon from "@iconify-icons/mdi/download-box";
import textFileIcon from "@iconify-icons/mdi/file-document";
import pdfFileIcon from "@iconify-icons/mdi/file-pdf-box";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/zip-box";
import excelFileIcon from "@iconify-icons/mdi/file-excel";
import powerpointFileIcon from "@iconify-icons/mdi/file-powerpoint";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";
import cloudUploadIcon from "@iconify-icons/mdi/cloud-upload";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";
import loadingIcon from "@iconify-icons/mdi/loading";
import sortAscIcon from "@iconify-icons/mdi/sort-ascending";
import sortDescIcon from "@iconify-icons/mdi/sort-descending";
import pencilIcon from "@iconify-icons/mdi/pencil";
import brushIcon from "@iconify-icons/mdi/brush";
import deleteIcon from "@iconify-icons/mdi/delete";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import viewGridIcon from "@iconify-icons/mdi/view-grid";
import viewListIcon from "@iconify-icons/mdi/view-list";
import refreshIcon from "@iconify-icons/mdi/refresh";
import dockerIcon from "@iconify-icons/mdi/docker";
import starIcon from "@iconify-icons/mdi/star";
import starOutlineIcon from "@iconify-icons/mdi/star-outline";
import historyIcon from "@iconify-icons/mdi/history";
import cubeIcon from "@iconify-icons/mdi/cube";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import checkIcon from "@iconify-icons/mdi/check-circle";
import menuIcon from "@iconify-icons/mdi/menu";
import closeIcon from "@iconify-icons/mdi/close";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import crosshairsGpsIcon from "@iconify-icons/mdi/crosshairs-gps";
import appsIcon from "@iconify-icons/mdi/apps";
import toolboxOutlineIcon from "@iconify-icons/mdi/toolbox-outline";
import informationOutlineIcon from "@iconify-icons/mdi/information-outline";

import ContextMenu from "../__Components__/ContextMenu.vue";
import SelectionBox from "../__Components__/SelectionBox.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBubble from "../__Components__/StatusBubble.vue";
import BaseImage from "../__Components__/BaseImage.vue";

interface FileEntry {
  name: string;
  display_name?: string;
  size: number;
  modified: number;
  is_directory: boolean;
}

interface PositionedFileEntry extends FileEntry {
  x: number;
  y: number;
}

interface ContainerInfo {
  name: string;
  sanitized_name: string;
  status: string;
  mounts_count: number;
}

interface MountInfo {
  host_path: string;
  container_path: string;
  type: string;
  read_only: boolean;
}

interface GroupedFiles {
  folder: string;
  files: FileEntry[];
  positionedFiles: PositionedFileEntry[];
  gridHeight: number;
}

const props = defineProps<{
  _windowId?: string;
  initialLocation?: "storage" | "dropzone" | "appdrive";
  initialContainer?: string;
  initialMountIndex?: number;
}>();

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();
const fileExplorerStore = useFileExplorerStore();
const uploadStore = useUploadingStore();
const fileViewerPrefs = useFileViewerPrefsStore();
const windowStore = useWindowStore();

const { sortBy, sortDirection, viewMode } = storeToRefs(fileViewerPrefs);

const files = ref<FileEntry[]>([]);
const currentPath = ref("");
const currentLocation = ref<FileExplorerLocation>("storage");
const isLoading = ref(false);
const searchQuery = ref("");
const isSearching = ref(false);

const containers = ref<ContainerInfo[]>([]);
const mounts = ref<MountInfo[]>([]);
const selectedContainer = ref<string | null>(null);
const selectedMountIndex = ref(0);
const isLoadingContainers = ref(false);
const isAppDriveExpanded = ref(false);
const isStorageExpanded = ref(false);
const isDropZoneExpanded = ref(false);
const defaultStorageFolders = ["Notes", "Documents", "Photos", "Videos", "Music", "Downloads"];
function isProtectedFolder(file: FileEntry): boolean {
  return currentLocation.value === "storage" && !currentPath.value && file.is_directory && defaultStorageFolders.includes(file.name);
}
const dropZoneFolders = ref<string[]>([]);
const isLoadingDropZoneFolders = ref(false);
const selectedFile = ref<string | null>(null);
const selectedFiles = ref<Set<string>>(new Set());
const isSelectingArea = ref(false);
const selectionBox = ref({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
const dragStartPoint = ref<{ x: number; y: number } | null>(null);
const dragStartedOnItem = ref(false);
let wasDragSelection = false;

const DRAG_SELECTION_THRESHOLD = 20;
const DOUBLE_TAP_THRESHOLD = 300;
const DOUBLE_TAP_DISTANCE = 30;
const LONG_PRESS_DURATION = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;
const DOUBLE_CLICK_DEBOUNCE = 400;
const SELECTION_PADDING_X = 12;
const SELECTION_PADDING_Y = 8;

let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressStartX = 0;
let longPressStartY = 0;
let currentTouchFile: FileEntry | null = null;
let hasMoved = false;
let isLongPressing = false;
let lastDoubleClickTime = 0;
let containerLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let containerTouchStartX = 0;
let containerTouchStartY = 0;
let containerHasMoved = false;
const fileList = ref<any[]>([]);
const isDraggingFiles = ref(false);
const dragCounter = ref(0);
const isUploadPanelExpanded = ref(false);
interface QueuedUpload {
  file: File;
  uid: string;
  targetPath: string;
  location: string;
  container?: string;
  mountIndex?: number;
}
const uploadQueue = ref<QueuedUpload[]>([]);
const activeUploads = ref(0);
const maxConcurrentUploads = 3;
let isProcessingUploadQueue = false;
const uploadStatusMessage = ref("");
const showUploadStatus = ref(false);
const fileStates = ref<Record<string, boolean>>({});
const loadingStates = ref<Record<string, boolean>>({});
const downloadProgresses = ref<Record<string, number>>({});
const compressingFolders = ref<Set<string>>(new Set());
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuFile = ref<FileEntry | null>(null);

const deleteDialogVisible = ref(false);
const deleteDialogTitle = ref("");
const deleteDialogContent = ref("");
const fileToDelete = ref<FileEntry | null>(null);

const createFolderDialogVisible = ref(false);
const newFolderName = ref("");

const renameDialogVisible = ref(false);
const renameValue = ref("");
const fileToRename = ref<FileEntry | null>(null);

const folderUploadWarningVisible = ref(false);
const pendingUploadData = ref<{ allFiles: Array<{ file: File; relativePath: string }>; folders: string[] } | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const filesAreaRef = ref<HTMLElement | null>(null);
const breadcrumbsRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<InstanceType<typeof InputSearch> | null>(null);
const containerWidth = ref(0);
const MIN_GRID_SIZE_X = 110;
const GRID_SIZE_Y = 125;
const MOBILE_ENTER_THRESHOLD = 600;
const MOBILE_EXIT_THRESHOLD = 680;
const isMobileLayout = ref(typeof window !== "undefined" && window.innerWidth < MOBILE_ENTER_THRESHOLD);

function updateMobileLayout(width: number) {
  if (width <= 0) return;
  if (!isMobileLayout.value && width < MOBILE_ENTER_THRESHOLD) {
    isMobileLayout.value = true;
    isNavPopoverOpen.value = false;
  } else if (isMobileLayout.value && width > MOBILE_EXIT_THRESHOLD) {
    isMobileLayout.value = false;
    isNavPopoverOpen.value = false;
    isSearchExpanded.value = false;
  }
}
const isNavPopoverOpen = ref(false);
const isVolumePopoverOpen = ref(false);
const isSearchExpanded = ref(false);
const TEXT_EXTENSIONS = new Set(["txt", "md", "markdown", "json", "yml", "yaml", "xml", "conf", "ini", "env", "log", "js", "ts", "jsx", "tsx", "mjs", "cjs", "vue", "svelte", "astro", "py", "pyw", "pyi", "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "css", "scss", "sass", "less", "styl", "html", "htm", "xhtml", "sql", "csv", "tsv", "c", "cpp", "h", "hpp", "cs", "java", "kt", "kts", "go", "rs", "rb", "php", "pl", "pm", "r", "rmd", "swift", "m", "mm", "scala", "groovy", "lua", "tcl", "tex", "latex", "sty", "cls", "bib", "bst", "dtx", "ins", "dockerfile", "makefile", "cmake", "gradle", "properties", "toml", "lock", "gitignore", "gitattributes", "editorconfig", "prettierrc", "eslintrc", "babelrc"]);
const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico", "tif", "tiff"]);
const MEDIA_EXTENSIONS = new Set(["mp4", "webm", "ogv", "ogg", "mp3", "wav", "aac", "flac", "m4a"]);
const PDF_EXTENSIONS = new Set(["pdf"]);
const fileIconsMap: Record<string, any> = {
  folder: folderIcon,
  txt: textFileIcon,
  md: textFileIcon,
  pdf: pdfFileIcon,
  png: imageFileIcon,
  jpg: imageFileIcon,
  jpeg: imageFileIcon,
  gif: imageFileIcon,
  webp: imageFileIcon,
  mp4: videoFileIcon,
  mkv: videoFileIcon,
  avi: videoFileIcon,
  mp3: audioFileIcon,
  wav: audioFileIcon,
  flac: audioFileIcon,
  zip: zipFileIcon,
  rar: zipFileIcon,
  "7z": zipFileIcon,
  tar: zipFileIcon,
  gz: zipFileIcon,
  doc: wordFileIcon,
  docx: wordFileIcon,
  xls: excelFileIcon,
  xlsx: excelFileIcon,
  csv: excelFileIcon,
  ppt: powerpointFileIcon,
  pptx: powerpointFileIcon,
  js: codeFileIcon,
  ts: codeFileIcon,
  py: codeFileIcon,
  java: codeFileIcon,
  cpp: codeFileIcon,
  c: codeFileIcon,
  h: codeFileIcon,
  html: codeFileIcon,
  css: codeFileIcon,
  json: codeFileIcon,
  xml: codeFileIcon,
  sh: codeFileIcon,
  sql: codeFileIcon,
};
const mainContainers = computed(() => {
  return containers.value
    .filter((container) => {
      const app = desktopStore.dockerApps.find((a) => a.name === container.name);
      return !app?.HDRole || app.HDRole !== "dependency";
    })
    .sort((a, b) => {
      if (a.status === "running" && b.status !== "running") return -1;
      if (a.status !== "running" && b.status === "running") return 1;
      return a.name.localeCompare(b.name);
    });
});
const systemApps = computed(() => {
  return getStartMenuApps().filter((app) => app.category !== "utilities");
});
const utilitiesApps = computed(() => {
  return UTILITIES_APPS;
});
const systemAppsAsFiles = computed((): FileEntry[] => {
  return systemApps.value.map(
    (app) =>
      ({
        name: app.id,
        display_name: app.name,
        size: 0,
        modified: 0,
        is_directory: false,
        is_app: true,
        _appId: app.id,
        _appIcon: app.icon,
        _appDescription: app.description,
      } as FileEntry)
  );
});

const utilitiesAsFiles = computed((): FileEntry[] => {
  return utilitiesApps.value.map(
    (util) =>
      ({
        name: util.id,
        display_name: util.name,
        size: 0,
        modified: 0,
        is_directory: false,
        is_app: true,
        _appId: util.id,
        _appIcon: util.icon,
        _appDescription: util.description,
      } as FileEntry)
  );
});

const selectedMount = computed(() => {
  if (mounts.value.length === 0 || selectedMountIndex.value < 0 || selectedMountIndex.value >= mounts.value.length) {
    return null;
  }
  return mounts.value[selectedMountIndex.value];
});

const isReadOnly = computed(() => {
  if (currentLocation.value === "appdrive") {
    return selectedMount.value?.read_only || false;
  }
  return false;
});

const canUpload = computed(() => {
  if (currentLocation.value === "favorites" || currentLocation.value === "recents" || currentLocation.value === "systemapps" || currentLocation.value === "utilities") {
    return false;
  }
  if (currentLocation.value === "appdrive") {
    return selectedContainer.value && !isReadOnly.value;
  }
  return true;
});

const isSpecialLocation = computed(() => {
  return currentLocation.value === "favorites" || currentLocation.value === "recents" || currentLocation.value === "systemapps" || currentLocation.value === "utilities";
});

const showBreadcrumbs = computed(() => {
  if (isSpecialLocation.value) return false;
  if (currentLocation.value === "appdrive" && !selectedContainer.value) return false;
  return true;
});

const locationLabel = computed(() => {
  switch (currentLocation.value) {
    case "storage":
      return "Storage";
    case "dropzone":
      return "Drop Zone";
    case "appdrive":
      return getAppInfo(selectedContainer.value || "").displayName || "App Drive";
    case "systemapps":
      return "System Apps";
    case "utilities":
      return "Utilities";
    default:
      return "";
  }
});

const locationIcon = computed(() => {
  switch (currentLocation.value) {
    case "storage":
      return folderIcon;
    case "dropzone":
      return cubeIcon;
    case "appdrive":
      return cubeScanIcon;
    case "systemapps":
      return appsIcon;
    case "utilities":
      return toolboxOutlineIcon;
    default:
      return folderIcon;
  }
});

const emptyIcon = computed(() => {
  switch (currentLocation.value) {
    case "favorites":
      return starOutlineIcon;
    case "recents":
      return historyIcon;
    case "systemapps":
      return appsIcon;
    case "utilities":
      return toolboxOutlineIcon;
    default:
      return folderIcon;
  }
});

const emptyMessage = computed(() => {
  switch (currentLocation.value) {
    case "favorites":
      return "No favorites yet. Right-click on files to add them.";
    case "recents":
      return "No recent files.";
    case "appdrive":
      if (!selectedContainer.value) return "Select an application from the sidebar.";
      return isReadOnly.value ? "This mount is empty." : "Drag and drop files to upload.";
    case "systemapps":
      return "No system apps available.";
    case "utilities":
      return "No utilities available.";
    default:
      return "Drag and drop files to upload.";
  }
});

const pathParts = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split("/").filter((p) => p);
});

const displayFiles = computed(() => {
  if (currentLocation.value === "favorites") {
    return fileExplorerStore.favorites.map((f) => ({
      name: f.name,
      display_name: f.name,
      size: 0,
      modified: f.added_at,
      is_directory: f.is_directory,
      _meta: f,
      _source: f.location,
      _sourcePath: f.path,
      _container: f.container,
    }));
  }
  if (currentLocation.value === "recents") {
    return fileExplorerStore.recents.map((r) => ({
      name: r.name,
      display_name: r.name,
      size: 0,
      modified: r.accessed_at,
      is_directory: r.is_directory,
      _meta: r,
      _source: r.location,
      _sourcePath: r.path,
      _container: r.container,
    }));
  }
  return files.value;
});
function positionFilesInGrid(files: any[], width: number) {
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  return files.map((file, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = row * GRID_SIZE_Y;

    return { ...file, x, y };
  });
}
function calculateGridHeight(itemCount: number, width: number) {
  if (itemCount === 0) return 0;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const rows = Math.ceil(itemCount / maxCols);
  return rows * GRID_SIZE_Y;
}
const groupedDisplayFiles = computed(() => {
  if (!isSpecialLocation.value || currentLocation.value === "systemapps" || currentLocation.value === "utilities") return [];

  const width = containerWidth.value || 400;

  const groups: Array<{
    key: string;
    label: string;
    icon: any;
    files: any[];
    positionedFiles: any[];
    gridHeight: number;
  }> = [];

  const storageFiles = displayFiles.value.filter((f: any) => f._source === "storage");
  const dropzoneFiles = displayFiles.value.filter((f: any) => f._source === "dropzone");
  const appdriveFiles = displayFiles.value.filter((f: any) => f._source === "appdrive");

  if (storageFiles.length > 0) {
    groups.push({
      key: "storage",
      label: "Storage",
      icon: folderIcon,
      files: storageFiles,
      positionedFiles: positionFilesInGrid(storageFiles, width),
      gridHeight: calculateGridHeight(storageFiles.length, width),
    });
  }

  if (dropzoneFiles.length > 0) {
    groups.push({
      key: "dropzone",
      label: "Drop Zone (Encrypted)",
      icon: cubeIcon,
      files: dropzoneFiles,
      positionedFiles: positionFilesInGrid(dropzoneFiles, width),
      gridHeight: calculateGridHeight(dropzoneFiles.length, width),
    });
  }

  if (appdriveFiles.length > 0) {
    groups.push({
      key: "appdrive",
      label: "App Drive (Docker Volumes)",
      icon: cubeScanIcon,
      files: appdriveFiles,
      positionedFiles: positionFilesInGrid(appdriveFiles, width),
      gridHeight: calculateGridHeight(appdriveFiles.length, width),
    });
  }

  return groups;
});

const sortedFiles = computed(() => {
  const sorted = [...displayFiles.value].sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;

    let comparison = 0;
    switch (sortBy.value) {
      case "name":
        comparison = (a.display_name || a.name).localeCompare(b.display_name || b.name);
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "date":
        comparison = a.modified - b.modified;
        break;
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });
  if (currentPath.value && !isSpecialLocation.value) {
    const parentEntry: FileEntry = {
      name: "..",
      display_name: "..",
      size: 0,
      modified: 0,
      is_directory: true,
    };
    return [parentEntry, ...sorted];
  }

  return sorted;
});

const positionedFiles = computed((): PositionedFileEntry[] => {
  const width = containerWidth.value || 400;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  return sortedFiles.value.map((file, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    return {
      ...file,
      x,
      y,
    };
  });
});
const positionedSystemApps = computed((): PositionedFileEntry[] => {
  const width = containerWidth.value || 400;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  return systemAppsAsFiles.value.map((app, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    return { ...app, x, y };
  });
});
const positionedUtilities = computed((): PositionedFileEntry[] => {
  const width = containerWidth.value || 400;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  return utilitiesAsFiles.value.map((util, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);
    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    return { ...util, x, y };
  });
});
const systemAppsGridHeight = computed(() => {
  if (systemApps.value.length === 0) return 0;
  const width = containerWidth.value || 400;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const rows = Math.ceil(systemApps.value.length / maxCols);
  return rows * GRID_SIZE_Y + 16;
});
const utilitiesGridHeight = computed(() => {
  if (utilitiesApps.value.length === 0) return 0;
  const width = containerWidth.value || 400;
  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const rows = Math.ceil(utilitiesApps.value.length / maxCols);
  return rows * GRID_SIZE_Y + 16;
});
const groupedFilesByFolder = computed((): GroupedFiles[] => {
  if (!isSearchMode.value) {
    return [];
  }

  const width = containerWidth.value || 400;
  const groups = new Map<string, FileEntry[]>();

  sortedFiles.value.forEach((file) => {
    if (file.name === "..") return;
    const folderPath = file.name.includes("/") ? file.name.substring(0, file.name.lastIndexOf("/")) : "";

    if (!groups.has(folderPath)) {
      groups.set(folderPath, []);
    }
    groups.get(folderPath)!.push(file);
  });

  return Array.from(groups.entries())
    .map(([folder, files]) => ({
      folder,
      files,
      positionedFiles: positionFilesInGrid(files, width) as PositionedFileEntry[],
      gridHeight: calculateGridHeight(files.length, width),
    }))
    .sort((a, b) => {
      if (a.folder === "" && b.folder !== "") return -1;
      if (a.folder !== "" && b.folder === "") return 1;
      return a.folder.localeCompare(b.folder);
    });
});

const gridContainerHeight = computed(() => {
  if (positionedFiles.value.length === 0) {
    return 200;
  }
  const maxY = Math.max(...positionedFiles.value.map((f) => f.y));
  return maxY + GRID_SIZE_Y + 16;
});

const totalSize = computed(() => {
  const total = files.value.reduce((sum, f) => sum + (f.size || 0), 0);
  return formatSize(total);
});

const filteredSearchOptions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return [];

  const sorted = [...files.value]
    .filter((f) => (f.display_name || f.name).toLowerCase().includes(searchQuery.value.toLowerCase()))
    .sort((a, b) => {
      if (a.is_directory && !b.is_directory) return -1;
      if (!a.is_directory && b.is_directory) return 1;
      return (a.display_name || a.name).localeCompare(b.display_name || b.name);
    })
    .slice(0, 15);

  return sorted.map((f) => ({
    value: f.name,
    label: f.display_name || f.name.split("/").pop() || f.name,
    isDirectory: f.is_directory,
    fileName: f.name,
  }));
});
const isSearchMode = computed(() => {
  return searchQuery.value && searchQuery.value.trim().length >= 2;
});

const currentUploadLocation = computed((): UploadLocation | null => {
  if (currentLocation.value === "storage" || currentLocation.value === "dropzone" || currentLocation.value === "appdrive") {
    return currentLocation.value as UploadLocation;
  }
  return null;
});
const isUploading = computed(() => {
  const loc = currentUploadLocation.value;
  if (!loc) return false;
  return uploadStore.isUploadingAt(loc);
});

const currentUploads = computed(() => {
  const loc = currentUploadLocation.value;
  if (!loc) return [];
  return uploadStore.currentlyUploadingAt(loc);
});

const currentQueue = computed(() => {
  const loc = currentUploadLocation.value;
  if (!loc) return [];
  return uploadStore.queueAt(loc);
});

const uploadProgress = computed(() => {
  const loc = currentUploadLocation.value;
  if (!loc) return {};
  return uploadStore.uploadProgressAt(loc);
});

const totalUploadProgress = computed(() => {
  const uploads = currentUploads.value;
  if (uploads.length === 0) return 0;

  let totalProgress = 0;
  uploads.forEach((upload) => {
    totalProgress += uploadProgress.value[upload.uid] || 0;
  });
  return Math.round(totalProgress / uploads.length);
});

const statusBarIcon = computed(() => {
  switch (currentLocation.value) {
    case "storage":
      return folderIcon;
    case "dropzone":
      return cubeIcon;
    case "appdrive":
      return cubeScanIcon;
    case "favorites":
      return starIcon;
    case "recents":
      return historyIcon;
    default:
      return folderMultipleIcon;
  }
});

const statusBarMessage = computed(() => {
  switch (currentLocation.value) {
    case "storage":
      return "Storage";
    case "dropzone":
      return "Drop Zone (Encrypted)";
    case "appdrive":
      return selectedContainer.value ? getAppInfo(selectedContainer.value).displayName : "App Drive";
    case "favorites":
      return "Favorites";
    case "recents":
      return "Recents";
    default:
      return "File Explorer";
  }
});

const statusBarInfo = computed(() => {
  if (currentLocation.value === "appdrive" && selectedMount.value) {
    return selectedMount.value.container_path;
  }
  return `${displayFiles.value.length} items`;
});

const selectionBoxStyle = computed(() => {
  const minX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const minY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const width = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const height = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);
  return {
    left: `${minX}px`,
    top: `${minY}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});
function cleanMenuItems(items: any[]): any[] {
  const result: any[] = [];
  let lastWasDivider = true;

  for (const item of items) {
    if (item.divider) {
      if (!lastWasDivider) {
        result.push(item);
        lastWasDivider = true;
      }
    } else {
      result.push(item);
      lastWasDivider = false;
    }
  }
  while (result.length > 0 && result[result.length - 1].divider) {
    result.pop();
  }

  return result;
}

const contextMenuItems = computed(() => {
  const items: any[] = [];
  const file = contextMenuFile.value;
  const selectedCount = selectedFiles.value.size;
  if (file && file.name === "..") {
    return [];
  }
  if (selectedCount > 1) {
    const selectedFilesList = Array.from(selectedFiles.value)
      .map((name) => displayFiles.value.find((f) => f.name === name))
      .filter((f) => f !== undefined) as FileEntry[];

    const hasDirectories = selectedFilesList.some((f) => f.is_directory);
    const hasProtectedFolders = selectedFilesList.some((f) => isProtectedFolder(f));
    const onlyFiles = selectedFilesList.filter((f) => !f.is_directory);
    const shouldZip = selectedCount > 3 || hasDirectories;
    const isNonDownloadableLocation = ["favorites", "recents", "systemapps", "utilities"].includes(currentLocation.value);

    items.push({ label: `Selected: ${selectedCount} items`, icon: checkIcon, disabled: true });
    items.push({ divider: true });

    if (!isNonDownloadableLocation) {
      if (shouldZip) {
        items.push({
          label: "Download as ZIP",
          icon: zipFileIcon,
          action: async () => {
            const fileNames = selectedFilesList.map((f) => f.name);
            closeContextMenu();
            await downloadAsZip(fileNames);
          },
        });
      } else if (onlyFiles.length > 0) {
        items.push({
          label: "Download All",
          icon: arrowDownThickIcon,
          action: async () => {
            for (const f of onlyFiles) {
              await downloadFile(f);
            }
            closeContextMenu();
          },
        });
      }
    }

    if (!isReadOnly.value && !isSpecialLocation.value && !hasProtectedFolders) {
      items.push({
        label: "Delete All",
        icon: deleteIcon,
        danger: true,
        action: () => {
          deleteDialogTitle.value = `Delete ${selectedCount} items?`;
          deleteDialogContent.value = `Are you sure you want to delete ${selectedCount} selected items? This action cannot be undone.`;
          fileToDelete.value = null;
          deleteDialogVisible.value = true;
          closeContextMenu();
        },
      });
    }

    items.push({ divider: true });
    if (canUpload.value) {
      items.push({ label: "New Folder", icon: folderPlusIcon, action: () => (createFolderDialogVisible.value = true) });
    }
    items.push({ label: "Refresh", icon: refreshIcon, action: refreshFiles });

    return cleanMenuItems(items);
  }
  if (file) {
    if (isSpecialLocation.value && (file as any)._source) {
      const meta = file as any;
      const isFavorites = currentLocation.value === "favorites";

      items.push({
        label: file.is_directory ? "Locate Folder" : "Locate File",
        icon: crosshairsGpsIcon,
        action: () => locateFileFromSpecial(file),
      });

      items.push({
        label: isFavorites ? "Remove from Favorites" : "Remove from Recents",
        icon: isFavorites ? starIcon : historyIcon,
        action: () => {
          if (isFavorites) {
            fileExplorerStore.removeFromFavorites({
              location: meta._source,
              path: meta._sourcePath || "",
              name: file.name,
            });
            message.success("Removed from favorites");
          } else {
            fileExplorerStore.removeFromRecents({
              location: meta._source,
              path: meta._sourcePath || "",
              name: file.name,
            });
            message.success("Removed from recents");
          }
        },
      });
    } else if (currentLocation.value === "systemapps" || currentLocation.value === "utilities") {
      items.push({
        label: "Open",
        icon: folderIcon,
        action: () => handleFileDoubleClick(file),
      });
    } else {
      if (file.is_directory) {
        items.push({ label: "Open", icon: folderIcon, action: () => openFolder(file) });
        items.push({
          label: "Download as ZIP",
          icon: zipFileIcon,
          action: () => downloadAsZip([file.name]),
        });
      } else {
        const extension = file.name.split(".").pop()?.toLowerCase() || "";
        const fileNameLower = file.name.toLowerCase();

        if (TEXT_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(fileNameLower)) {
          items.push({ label: "Open in Notepad", icon: textFileIcon, action: () => openInNotepad(file) });
        }
        if (IMAGE_EXTENSIONS.has(extension)) {
          items.push({ label: "Open in Image Viewer", icon: imageFileIcon, action: () => openInImageViewer(file) });
          items.push({ label: "Open in Brusher", icon: brushIcon, action: () => openInBrusher(file) });
        }
        if (MEDIA_EXTENSIONS.has(extension)) {
          items.push({ label: "Open in Media Player", icon: videoFileIcon, action: () => openInMediaPlayer(file) });
        }
        if (PDF_EXTENSIONS.has(extension)) {
          items.push({ label: "Open in PDF Viewer", icon: pdfFileIcon, action: () => openInPDFViewer(file) });
        }
        items.push({ label: "Download", icon: arrowDownThickIcon, action: () => downloadFile(file) });
      }

      items.push({ divider: true });
      const isFav = fileExplorerStore.isFavorite(currentLocation.value as "storage" | "dropzone" | "appdrive", currentPath.value, file.name);
      items.push({
        label: isFav ? "Remove from Favorites" : "Add to Favorites",
        icon: isFav ? starIcon : starOutlineIcon,
        action: () => toggleFavorite(file),
      });

      if (!isReadOnly.value && !isProtectedFolder(file)) {
        items.push({ divider: true });
        items.push({ label: "Rename", icon: pencilIcon, action: () => showRenameDialog(file) });
        items.push({ label: "Delete", icon: deleteIcon, danger: true, action: () => showDeleteDialog(file) });
      }

      items.push({ divider: true });
      items.push({ label: "Properties", icon: informationOutlineIcon, action: () => showFileProperties(file) });
    }
  } else {
    if (canUpload.value) {
      items.push({ label: "New Folder", icon: folderPlusIcon, action: () => (createFolderDialogVisible.value = true) });
      items.push({ label: "Upload Files", icon: cloudUploadIcon, action: triggerFileUpload });
    }
    items.push({ label: "Refresh", icon: refreshIcon, action: refreshFiles });
  }

  return cleanMenuItems(items);
});
function getAppInfo(containerName: string) {
  const app = desktopStore.dockerApps.find((a) => a.name === containerName);
  return {
    displayName: app?.display_name || containerName,
    iconPath: app?.image_path || "docker-icons/notfound.jpg",
  };
}
const specialFolderIcons: Record<string, any> = {
  Notes: notebookIcon,
  Documents: fileDocumentMultipleIcon,
  Photos: imageMultipleIcon,
  Videos: videoBoxIcon,
  Music: musicBoxMultipleIcon,
  Downloads: downloadBoxIcon,
};

function getFileIcon(file: FileEntry) {
  if ((file as any).is_app && (file as any)._appIcon) {
    return (file as any)._appIcon;
  }

  if (file.is_directory) {
    if (file.name === "..") {
      return folderArrowLeftIcon;
    }
    const folderName = file.display_name || file.name.split("/").pop() || file.name;
    if (currentLocation.value === "storage" && !currentPath.value && specialFolderIcons[folderName]) {
      return specialFolderIcons[folderName];
    }
    return folderIcon;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return fileIconsMap[ext] || unknownFileIcon;
}

function getDisplayName(file: FileEntry) {
  if (file.display_name) return file.display_name;
  return file.name.split("/").pop() || file.name;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatSizeCompact(bytes: number): string {
  if (bytes === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "K", "M", "G"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function getRelativeTime(file: FileEntry): string {
  if (!file.modified || file.name === "..") return "";
  const now = Date.now();
  const modified = typeof file.modified === "number" ? file.modified * 1000 : new Date(file.modified).getTime();
  const diff = now - modified;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return "";
}

function isFileSelected(file: FileEntry): boolean {
  return selectedFile.value === file.name || selectedFiles.value.has(file.name);
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  fileViewerPrefs.save();
}

function toggleViewMode() {
  viewMode.value = viewMode.value === "grid" ? "list" : "grid";
  fileViewerPrefs.save();
}

function focusSearchInput() {
  nextTick(() => {
    const inputEl = searchInputRef.value?.$el?.querySelector("input");
    if (inputEl) {
      inputEl.focus();
    }
  });
}
function setLocation(location: FileExplorerLocation) {
  currentLocation.value = location;
  currentPath.value = "";
  selectedFile.value = null;
  selectedFiles.value.clear();
  isNavPopoverOpen.value = false;
  searchQuery.value = "";

  if (location !== "appdrive") {
    selectedContainer.value = null;
    mounts.value = [];
  }

  if (location === "storage" || location === "dropzone") {
    loadFiles();
  } else if (location === "appdrive") {
    loadContainers();
  }
}
function openApp(appId: string) {
  windowStore.openWindow(appId, {
    allowMultiple: true,
  });
}

function toggleAppDriveExpanded() {
  isAppDriveExpanded.value = !isAppDriveExpanded.value;
  if (isAppDriveExpanded.value) {
    isStorageExpanded.value = false;
    isDropZoneExpanded.value = false;
    if (containers.value.length === 0) {
      loadContainers();
    }
  }
}

function toggleStorageExpanded() {
  isStorageExpanded.value = !isStorageExpanded.value;
  if (isStorageExpanded.value) {
    isDropZoneExpanded.value = false;
    isAppDriveExpanded.value = false;
  }
}

function selectStorageFolder(folderName: string) {
  currentLocation.value = "storage";
  currentPath.value = folderName;
  selectedFile.value = null;
  selectedFiles.value.clear();
  isNavPopoverOpen.value = false;
  searchQuery.value = "";
  loadFiles();
}

function toggleDropZoneExpanded() {
  isDropZoneExpanded.value = !isDropZoneExpanded.value;
  if (isDropZoneExpanded.value) {
    isStorageExpanded.value = false;
    isAppDriveExpanded.value = false;
    if (dropZoneFolders.value.length === 0) {
      loadDropZoneFolders();
    }
  }
}

async function loadDropZoneFolders() {
  isLoadingDropZoneFolders.value = true;
  try {
    const response = await axios.get("/api/dropzone/files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    dropZoneFolders.value = (response.data.files || []).filter((f: FileEntry) => f.is_directory && f.name !== "..").map((f: FileEntry) => f.display_name || f.name);
  } catch (error) {
    console.error("Error loading Drop Zone folders:", error);
  } finally {
    isLoadingDropZoneFolders.value = false;
  }
}

function selectDropZoneFolder(folderName: string) {
  currentLocation.value = "dropzone";
  currentPath.value = folderName;
  selectedFile.value = null;
  selectedFiles.value.clear();
  isNavPopoverOpen.value = false;
  searchQuery.value = "";
  loadFiles();
}

function selectAppDriveContainer(containerName: string) {
  currentLocation.value = "appdrive";
  selectedContainer.value = containerName;
  currentPath.value = "";
  isNavPopoverOpen.value = false;
  searchQuery.value = "";
  loadMounts(containerName);
}

function navigateToRoot() {
  currentPath.value = "";
  loadFiles();
}

function navigateToPathIndex(index: number) {
  const parts = pathParts.value.slice(0, index + 1);
  currentPath.value = parts.join("/");
  loadFiles();
}

function navigateUp() {
  const parts = pathParts.value;
  parts.pop();
  currentPath.value = parts.join("/");
  loadFiles();
}

function openFolder(file: FileEntry) {
  if (!file.is_directory) return;
  if (isSearchMode.value) {
    searchQuery.value = "";
    currentPath.value = file.name;
  } else {
    currentPath.value = currentPath.value ? `${currentPath.value}/${file.display_name || file.name}` : file.display_name || file.name;
  }
  loadFiles();
}
async function loadFiles() {
  if (isSpecialLocation.value) return;

  isLoading.value = true;
  try {
    let endpoint = "";
    const params: Record<string, string> = {};

    if (currentLocation.value === "storage") {
      endpoint = "/api/storage/files";
      if (currentPath.value) params.path = currentPath.value;
    } else if (currentLocation.value === "dropzone") {
      endpoint = "/api/dropzone/files";
      if (currentPath.value) params.path = currentPath.value;
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      endpoint = "/api/appdrive/files";
      params.container = selectedContainer.value;
      params.mount = String(selectedMountIndex.value);
      if (currentPath.value) params.path = currentPath.value;
    } else {
      files.value = [];
      return;
    }

    const response = await axios.get(endpoint, {
      params,
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    files.value = response.data.files || [];
    if (!currentPath.value && isDropZoneExpanded.value && currentLocation.value === "dropzone") {
      dropZoneFolders.value = (response.data.files || []).filter((f: FileEntry) => f.is_directory && f.name !== "..").map((f: FileEntry) => f.display_name || f.name);
    }
  } catch (error) {
    console.error("Failed to load files:", error);
    files.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function loadContainers() {
  isLoadingContainers.value = true;
  try {
    const response = await axios.get("/api/appdrive/containers", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    containers.value = response.data.containers || [];
  } catch (error) {
    console.error("Failed to load containers:", error);
    containers.value = [];
  } finally {
    isLoadingContainers.value = false;
  }
}

async function loadMounts(containerName: string, initialMountIndex?: number) {
  try {
    const response = await axios.get("/api/appdrive/mounts", {
      params: { container: containerName },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    mounts.value = response.data.mounts || [];
    const mountIdx = initialMountIndex ?? 0;
    selectedMountIndex.value = mountIdx < mounts.value.length ? mountIdx : 0;
    loadFiles();
  } catch (error) {
    console.error("Failed to load mounts:", error);
    mounts.value = [];
  }
}

function handleMountChange() {
  currentPath.value = "";
  loadFiles();
}

function refreshFiles() {
  if (currentLocation.value === "favorites") {
    fileExplorerStore.fetchFavorites();
  } else if (currentLocation.value === "recents") {
    fileExplorerStore.fetchRecents();
  } else {
    loadFiles();
  }
}

async function performSearch(forceSearch = false) {
  if (!searchQuery.value || (searchQuery.value.length < 2 && !forceSearch)) return;

  isSearching.value = true;
  try {
    let endpoint = "";
    const params: Record<string, string> = { query: searchQuery.value.trim() };

    if (currentLocation.value === "storage") {
      endpoint = "/api/storage/search";
    } else if (currentLocation.value === "dropzone") {
      endpoint = "/api/dropzone/search";
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      endpoint = "/api/appdrive/search";
      params.container = selectedContainer.value;
      params.mount = String(selectedMountIndex.value);
    } else {
      return;
    }

    const response = await axios.get(endpoint, {
      params,
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    files.value = response.data.files || [];
    currentPath.value = "";
  } catch (error) {
    console.error("Search failed:", error);
  } finally {
    isSearching.value = false;
  }
}

function handleSearchSelect(value: string | number | { value: string | number; label: string }, _option?: any) {
  const searchValue = typeof value === "object" ? String(value.value) : String(value);
  const file = files.value.find((f) => f.name === searchValue || f.display_name === searchValue);
  if (file) {
    searchQuery.value = "";
    if (file.is_directory) {
      currentPath.value = file.name;
      loadFiles();
    } else {
      if (file.name.includes("/")) {
        const pathParts = file.name.split("/");
        pathParts.pop();
        const parentPath = pathParts.join("/");
        currentPath.value = parentPath;
        loadFiles();
      }
    }
  }
}
function handleFileClick(file: FileEntry, event: MouseEvent) {
  if (wasDragSelection) return;
  if (file.name === "..") return;

  if (event.ctrlKey || event.metaKey) {
    if (selectedFiles.value.has(file.name)) {
      selectedFiles.value.delete(file.name);
      if (selectedFile.value === file.name) {
        selectedFile.value = null;
      }
    } else {
      selectedFiles.value.add(file.name);
    }
  } else if (event.shiftKey && selectedFile.value) {
    const fileNames = sortedFiles.value.map((f) => f.name);
    const startIdx = fileNames.indexOf(selectedFile.value);
    const endIdx = fileNames.indexOf(file.name);
    const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
    selectedFiles.value.clear();
    for (let i = from; i <= to; i++) {
      selectedFiles.value.add(fileNames[i]);
    }
  } else {
    selectedFile.value = file.name;
    selectedFiles.value.clear();
  }
}

async function openInNotepad(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "text",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "text",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }
    let textContent: string;
    if (currentLocation.value === "appdrive") {
      textContent = await response.data.text();
    } else {
      textContent = response.data;
    }

    const fileName = file.display_name || file.name.split("/").pop() || file.name;

    windowStore.openFileInApp("notepad", {
      title: `Notepad - ${fileName}`,
      data: {
        externalFile: {
          path: file.name,
          content: textContent,
          source: currentLocation.value,
          container: currentLocation.value === "appdrive" ? selectedContainer.value : undefined,
          mountIndex: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
        },
      },
    });
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      delete downloadProgresses.value[file.name];
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
    }, 500);
  } catch (error) {
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = false;
      loadingStates.value[file.name] = false;
    }
    message.error("Failed to open file");
  }
}

async function openInImageViewer(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }

    const fileName = file.display_name || file.name.split("/").pop() || file.name;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    windowStore.openFileInApp("imageviewer", {
      data: {
        imageFile: {
          name: fileName,
          extension: extension,
          buffer: response.data,
        },
      },
    });
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      delete downloadProgresses.value[file.name];
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
    }, 500);
  } catch (error) {
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = false;
      loadingStates.value[file.name] = false;
    }
    message.error("Failed to open image");
  }
}

async function openInPDFViewer(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }

    const fileName = file.display_name || file.name.split("/").pop() || file.name;

    windowStore.openFileInApp("pdfviewer", {
      data: {
        pdfFile: {
          name: fileName,
          buffer: response.data,
        },
      },
    });
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      delete downloadProgresses.value[file.name];
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
    }, 500);
  } catch (error) {
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = false;
      loadingStates.value[file.name] = false;
    }
    message.error("Failed to open PDF");
  }
}

async function openInMediaPlayer(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }

    const fileName = file.display_name || file.name.split("/").pop() || file.name;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    windowStore.openFileInApp("mediaplayer", {
      data: {
        mediaFile: {
          name: fileName,
          extension: extension,
          buffer: response.data,
        },
      },
    });
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      delete downloadProgresses.value[file.name];
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
    }, 500);
  } catch (error) {
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = false;
      loadingStates.value[file.name] = false;
    }
    message.error("Failed to open media file");
  }
}

async function openInBrusher(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "arraybuffer",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }

    const fileName = file.display_name || file.name.split("/").pop() || file.name;
    const extension = file.name.split(".").pop()?.toLowerCase() || "";

    windowStore.openFileInApp("brusher", {
      title: `Brusher - ${fileName}`,
      data: {
        imageFile: {
          name: fileName,
          extension: extension,
          buffer: response.data,
        },
      },
    });
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      delete downloadProgresses.value[file.name];
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
    }, 500);
  } catch (error) {
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = false;
      loadingStates.value[file.name] = false;
    }
    message.error("Failed to open image in Brusher");
  }
}

async function verifyFileExists(source: string, path: string, fileName: string, container?: string, mountIndex?: number): Promise<boolean> {
  try {
    let endpoint = "";
    const params: Record<string, string> = {};

    if (source === "storage") {
      endpoint = "/api/storage/files";
      if (path) params.path = path;
    } else if (source === "dropzone") {
      endpoint = "/api/dropzone/files";
      if (path) params.path = path;
    } else if (source === "appdrive" && container) {
      endpoint = "/api/appdrive/files";
      params.container = container;
      params.mount = String(mountIndex || 0);
      if (path) params.path = path;
    } else {
      return false;
    }

    const response = await axios.get(endpoint, {
      params,
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    const filesList = response.data.files || [];
    return filesList.some((f: FileEntry) => f.name === fileName || f.display_name === fileName);
  } catch (error) {
    return false;
  }
}

async function handleFileDoubleClick(file: FileEntry) {
  const now = Date.now();
  if (now - lastDoubleClickTime < DOUBLE_CLICK_DEBOUNCE) {
    return;
  }
  lastDoubleClickTime = now;

  if ((file as any).is_app && (file as any)._appId) {
    openApp((file as any)._appId);
    return;
  }
  if (file.name === "..") {
    navigateUp();
    return;
  }
  if (isSpecialLocation.value && (file as any)._source) {
    const meta = file as any;
    const sourcePath = meta._sourcePath || "";
    const isFavorite = currentLocation.value === "favorites";
    const exists = await verifyFileExists(meta._source, sourcePath, file.name, meta._container, meta._meta?.mount_index);

    if (!exists) {
      message.error(`File "${file.display_name || file.name}" no longer exists`);
      if (isFavorite) {
        fileExplorerStore.removeFromFavorites({
          location: meta._source,
          path: sourcePath,
          name: file.name,
        });
      } else {
        fileExplorerStore.removeFromRecents({
          location: meta._source,
          path: sourcePath,
          name: file.name,
        });
      }
      return;
    }

    if (meta._source === "appdrive" && meta._container) {
      currentLocation.value = "appdrive";
      selectedContainer.value = meta._container;
      isAppDriveExpanded.value = true;
      if (file.is_directory) {
        currentPath.value = meta._sourcePath ? `${meta._sourcePath}/${file.name}` : file.name;
      } else {
        currentPath.value = meta._sourcePath || "";
      }
      const mountIdx = meta._meta?.mount_index !== undefined ? meta._meta.mount_index : 0;
      loadMounts(meta._container, mountIdx).then(() => {
        loadFiles();
      });
    } else {
      currentLocation.value = meta._source;
      if (file.is_directory) {
        currentPath.value = meta._sourcePath ? `${meta._sourcePath}/${file.name}` : file.name;
      } else {
        currentPath.value = meta._sourcePath || "";
      }
      loadFiles();
    }
    return;
  }

  if (file.is_directory) {
    openFolder(file);
  } else {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const fileNameLower = file.name.toLowerCase();

    if (TEXT_EXTENSIONS.has(extension) || TEXT_EXTENSIONS.has(fileNameLower)) {
      openInNotepad(file);
    } else if (IMAGE_EXTENSIONS.has(extension)) {
      openInImageViewer(file);
    } else if (MEDIA_EXTENSIONS.has(extension)) {
      openInMediaPlayer(file);
    } else if (PDF_EXTENSIONS.has(extension)) {
      openInPDFViewer(file);
    } else {
      downloadFile(file);
    }
  }
}

async function downloadFile(file: FileEntry) {
  if (downloadProgresses.value[file.name] !== undefined && downloadProgresses.value[file.name] > 0 && downloadProgresses.value[file.name] < 100) {
    message.info("Download already in progress");
    return;
  }
  if (file.is_directory) {
    await downloadAsZip([file.name]);
    return;
  }

  try {
    if (currentLocation.value === "dropzone") {
      fileStates.value[file.name] = true;
      loadingStates.value[file.name] = true;
    }
    if (currentLocation.value === "appdrive" && file.is_directory) {
      compressingFolders.value.add(file.name);
    }
    downloadProgresses.value[file.name] = 0;

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.get("/api/storage/download", {
        params: { file: file.name },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "dropzone") {
      response = await axios.get(`/api/dropzone/download?file=${encodeURIComponent(file.name)}`, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.get("/api/appdrive/download", {
        params: {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: file.name,
        },
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            downloadProgresses.value[file.name] = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          }
        },
      });
    } else {
      throw new Error("Invalid location or missing container");
    }
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const downloadName = file.display_name || file.name.split("/").pop() || "download";
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    if (!isSpecialLocation.value) {
      fileExplorerStore.addToRecents({
        location: currentLocation.value as "storage" | "dropzone" | "appdrive",
        path: currentPath.value,
        name: file.name,
        is_directory: false,
        container: currentLocation.value === "appdrive" ? selectedContainer.value || undefined : undefined,
        mount_index: currentLocation.value === "appdrive" ? selectedMountIndex.value : undefined,
      });
    }
    setTimeout(() => {
      if (currentLocation.value === "dropzone") {
        fileStates.value[file.name] = false;
        loadingStates.value[file.name] = false;
      }
      delete downloadProgresses.value[file.name];
    }, 1000);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error_message || "Failed to download file. Please try again.");
    } else {
      message.error("Failed to download file. Please try again.");
    }
    delete downloadProgresses.value[file.name];
    if (currentLocation.value === "dropzone") {
      loadingStates.value[file.name] = false;
      fileStates.value[file.name] = false;
    }
    if (currentLocation.value === "appdrive") {
      compressingFolders.value.delete(file.name);
    }
  }
}

async function downloadAsZip(fileNames: string[]) {
  if (fileNames.length === 0) return;

  try {
    fileNames.forEach((name) => {
      const file = files.value.find((f) => f.name === name);
      if (file?.is_directory) {
        compressingFolders.value.add(name);
      }
    });

    let response;

    if (currentLocation.value === "storage") {
      response = await axios.post(
        "/api/storage/download-multiple",
        { files: fileNames },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          responseType: "blob",
        }
      );
    } else if (currentLocation.value === "dropzone") {
      response = await axios.post(
        "/api/dropzone/download-multiple",
        { files: fileNames },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          responseType: "blob",
        }
      );
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      response = await axios.post(
        "/api/appdrive/download-multiple",
        {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          files: fileNames,
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          responseType: "blob",
        }
      );
    } else {
      throw new Error("Invalid location or missing container");
    }
    const contentDisposition = response.headers["content-disposition"];
    let filename = "download.zip";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1].replace(/[<>:"/\\|?*]/g, "_");
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    message.success(`Downloaded ${fileNames.length} items as ZIP`);
  } catch (error) {
    message.error("Failed to download files as ZIP");
  } finally {
    fileNames.forEach((name) => {
      compressingFolders.value.delete(name);
    });
  }
}

function showDeleteDialog(file: FileEntry) {
  fileToDelete.value = file;
  deleteDialogTitle.value = file.is_directory ? "Delete Folder" : "Delete File";
  deleteDialogContent.value = `Are you sure you want to delete "${file.display_name || file.name}"?`;
  deleteDialogVisible.value = true;
}

async function confirmDelete() {
  if (selectedFiles.value.size > 0 && !fileToDelete.value) {
    const selectedFilesList = Array.from(selectedFiles.value);
    let successCount = 0;
    let errorCount = 0;

    for (const fileName of selectedFilesList) {
      try {
        if (currentLocation.value === "storage") {
          await axios.post("/api/storage/delete", { file: fileName }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
        } else if (currentLocation.value === "dropzone") {
          await axios.post("/api/dropzone/delete", { file: fileName }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
        } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
          await axios.post(
            "/api/appdrive/delete",
            {
              container: selectedContainer.value,
              mount: selectedMountIndex.value,
              file: fileName,
            },
            { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } }
          );
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      message.success(`Deleted ${successCount} item${successCount > 1 ? "s" : ""}`);
    }
    if (errorCount > 0) {
      message.error(`Failed to delete ${errorCount} item${errorCount > 1 ? "s" : ""}`);
    }

    selectedFiles.value.clear();
    selectedFile.value = null;
    refreshFiles();
    deleteDialogVisible.value = false;
    return;
  }
  if (!fileToDelete.value) return;

  try {
    if (currentLocation.value === "storage") {
      await axios.post("/api/storage/delete", { file: fileToDelete.value.name }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
    } else if (currentLocation.value === "dropzone") {
      const response = await axios.post("/api/dropzone/delete", { file: fileToDelete.value.name }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });
      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.error || "Failed to delete file");
        return;
      }
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      await axios.post(
        "/api/appdrive/delete",
        {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          file: fileToDelete.value.name,
        },
        { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } }
      );
      message.success(`Deleted ${fileToDelete.value.display_name || fileToDelete.value.name}`);
    } else {
      message.success("Deleted successfully");
    }

    refreshFiles();
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error_message || error.response?.data?.error || "Failed to delete");
    } else {
      message.error("Failed to delete");
    }
  } finally {
    deleteDialogVisible.value = false;
    fileToDelete.value = null;
  }
}

function showRenameDialog(file: FileEntry) {
  fileToRename.value = file;
  renameValue.value = file.display_name || file.name.split("/").pop() || "";
  renameDialogVisible.value = true;
}

async function performRename() {
  if (!fileToRename.value || !renameValue.value.trim()) {
    message.error("Please enter a new name");
    return;
  }

  try {
    if (currentLocation.value === "storage") {
      await axios.post(
        "/api/storage/rename",
        {
          old_name: fileToRename.value.name,
          new_name: renameValue.value.trim(),
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );
      message.success(`Renamed to "${renameValue.value}"`);
    } else if (currentLocation.value === "dropzone") {
      const response = await axios.post(
        "/api/dropzone/rename",
        {
          old_name: fileToRename.value.name,
          new_name: renameValue.value.trim(),
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );

      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.error || "Failed to rename item");
        return;
      }
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      await axios.post(
        "/api/appdrive/rename",
        {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          old_name: fileToRename.value.name,
          new_name: renameValue.value.trim(),
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );
      message.success(`Renamed to "${renameValue.value}"`);
    }

    renameDialogVisible.value = false;
    fileToRename.value = null;
    renameValue.value = "";
    refreshFiles();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error || "Failed to rename");
    } else {
      message.error("Failed to rename");
    }
  }
}

async function createFolder() {
  if (!newFolderName.value.trim()) {
    message.error("Please enter a folder name");
    return;
  }

  try {
    if (currentLocation.value === "storage") {
      await axios.post(
        "/api/storage/create-folder",
        {
          name: newFolderName.value.trim(),
          path: currentPath.value,
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );
      message.success(`Created folder "${newFolderName.value}"`);
    } else if (currentLocation.value === "dropzone") {
      const response = await axios.post(
        "/api/dropzone/create-folder",
        {
          name: newFolderName.value.trim(),
          path: currentPath.value,
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );

      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.error || "Failed to create folder");
        return;
      }
    } else if (currentLocation.value === "appdrive" && selectedContainer.value) {
      await axios.post(
        "/api/appdrive/create-folder",
        {
          container: selectedContainer.value,
          mount: selectedMountIndex.value,
          name: newFolderName.value.trim(),
          path: currentPath.value,
        },
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );
      message.success(`Created folder "${newFolderName.value}"`);
    }

    createFolderDialogVisible.value = false;
    newFolderName.value = "";
    refreshFiles();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error || "Failed to create folder. Please try again.");
    } else {
      message.error("Failed to create folder. Please try again.");
    }
  }
}

async function toggleFavorite(file: FileEntry) {
  const loc = currentLocation.value as "storage" | "dropzone" | "appdrive";
  const isFav = fileExplorerStore.isFavorite(loc, currentPath.value, file.name);

  if (isFav) {
    await fileExplorerStore.removeFromFavorites({
      location: loc,
      path: currentPath.value,
      name: file.name,
    });
    message.success("Removed from favorites");
  } else {
    await fileExplorerStore.addToFavorites({
      location: loc,
      path: currentPath.value,
      name: file.name,
      is_directory: file.is_directory,
      container: loc === "appdrive" ? selectedContainer.value || undefined : undefined,
      mount_index: loc === "appdrive" ? selectedMountIndex.value : undefined,
    });
    message.success("Added to favorites");
  }
}

async function locateFileFromSpecial(file: FileEntry) {
  const meta = file as any;
  if (!meta._source) return;

  const sourcePath = meta._sourcePath || "";
  const isFavorite = currentLocation.value === "favorites";
  const exists = await verifyFileExists(meta._source, sourcePath, file.name, meta._container, meta._meta?.mount_index);

  if (!exists) {
    message.error(`"${file.display_name || file.name}" no longer exists`);
    if (isFavorite) {
      fileExplorerStore.removeFromFavorites({
        location: meta._source,
        path: sourcePath,
        name: file.name,
      });
    } else {
      fileExplorerStore.removeFromRecents({
        location: meta._source,
        path: sourcePath,
        name: file.name,
      });
    }
    return;
  }

  if (meta._source === "appdrive" && meta._container) {
    currentLocation.value = "appdrive";
    selectedContainer.value = meta._container;
    isAppDriveExpanded.value = true;
    currentPath.value = sourcePath;
    const mountIdx = meta._meta?.mount_index !== undefined ? meta._meta.mount_index : 0;
    loadMounts(meta._container, mountIdx).then(() => {
      loadFiles().then(() => {
        selectedFiles.value.clear();
        selectedFiles.value.add(file.name);
        selectedFile.value = file.name;
      });
    });
  } else {
    currentLocation.value = meta._source;
    currentPath.value = sourcePath;
    loadFiles().then(() => {
      selectedFiles.value.clear();
      selectedFiles.value.add(file.name);
      selectedFile.value = file.name;
    });
  }
}
function triggerFileUpload() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.onchange = (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files) {
      handleFilesUpload(Array.from(files));
    }
  };
  input.click();
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  dragCounter.value++;
  if (e.dataTransfer?.types.includes("Files")) {
    isDraggingFiles.value = true;
  }
}

function handleDragLeave(e: DragEvent) {
  e.preventDefault();
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDraggingFiles.value = false;
  }
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  dragCounter.value = 0;
  isDraggingFiles.value = false;

  if (!canUpload.value) return;

  const items = e.dataTransfer?.items;
  if (!items) return;

  const allFiles: Array<{ file: File; relativePath: string }> = [];
  const folders: string[] = [];

  const processEntry = async (entry: FileSystemEntry, path: string = ""): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry;
      return new Promise((resolve) => {
        fileEntry.file((file) => {
          if (!file.name.startsWith(".")) {
            allFiles.push({ file, relativePath: path ? `${path}/${file.name}` : file.name });
          }
          resolve();
        });
      });
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry;
      const dirPath = path ? `${path}/${entry.name}` : entry.name;
      folders.push(dirPath);
      const reader = dirEntry.createReader();
      return new Promise((resolve) => {
        reader.readEntries(async (entries) => {
          for (const e of entries) {
            await processEntry(e, dirPath);
          }
          resolve();
        });
      });
    }
  };

  const entries: FileSystemEntry[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (entry) entries.push(entry);
  }

  for (const entry of entries) {
    await processEntry(entry);
  }

  if (folders.length > 0) {
    pendingUploadData.value = { allFiles, folders };
    folderUploadWarningVisible.value = true;
  } else {
    handleFilesUpload(allFiles.map((f) => f.file));
  }
}

function confirmFolderUpload() {
  if (pendingUploadData.value) {
    handleFilesUpload(
      pendingUploadData.value.allFiles.map((f) => f.file),
      pendingUploadData.value.allFiles
    );
  }
  folderUploadWarningVisible.value = false;
  pendingUploadData.value = null;
}

function cancelFolderUpload() {
  folderUploadWarningVisible.value = false;
  pendingUploadData.value = null;
}

async function processUploadQueue() {
  if (isProcessingUploadQueue) return;
  isProcessingUploadQueue = true;

  try {
    while (activeUploads.value < maxConcurrentUploads && uploadQueue.value.length > 0) {
      const nextUpload = uploadQueue.value.shift();
      if (!nextUpload) break;

      activeUploads.value++;

      const loc = nextUpload.location as UploadLocation;

      uploadStore.startUpload(loc, {
        uid: nextUpload.uid,
        name: nextUpload.file.name,
        size: nextUpload.file.size,
      });
      (async () => {
        try {
          const formData = new FormData();
          formData.append("file", nextUpload.file);

          if (nextUpload.targetPath) {
            formData.append("path", nextUpload.targetPath);
          }

          let endpoint = "";
          if (nextUpload.location === "storage") {
            endpoint = "/api/storage/upload";
          } else if (nextUpload.location === "dropzone") {
            endpoint = "/api/dropzone/upload";
          } else if (nextUpload.location === "appdrive" && nextUpload.container) {
            endpoint = "/api/appdrive/upload";
            formData.append("container", nextUpload.container);
            formData.append("mount", String(nextUpload.mountIndex || 0));
          }

          const response = await axios.post(endpoint, formData, {
            headers: {
              "X-HomeDock-CSRF-Token": csrfToken.value,
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                uploadStore.updateProgress(loc, nextUpload.uid, percent);
              }
            },
          });

          if (!response.data.success) {
            uploadStore.cancelUpload(loc, nextUpload.uid);
            message.error(response.data.error || "Upload failed");
          } else {
            uploadStore.completeUpload(loc, nextUpload.uid);
          }
        } catch (error) {
          uploadStore.cancelUpload(loc, nextUpload.uid);
          if (axios.isAxiosError(error)) {
            if (error.response?.status === 413) {
              message.error("The selected file is larger than the maximum allowed size.");
            } else {
              message.error(error.response?.data?.error_message || error.response?.data?.error || `Failed to upload ${nextUpload.file.name}`);
            }
          } else {
            message.error(`Failed to upload ${nextUpload.file.name}`);
          }
        } finally {
          activeUploads.value--;
          processUploadQueue();
        }
      })();
    }
  } finally {
    isProcessingUploadQueue = false;
  }
  if (activeUploads.value === 0 && uploadQueue.value.length === 0) {
    setTimeout(() => {
      refreshFiles();
      isUploadPanelExpanded.value = false;
    }, 500);
  }
}

async function handleFilesUpload(filesList: File[], withPaths?: Array<{ file: File; relativePath: string }>) {
  if (!canUpload.value) return;
  const location = currentLocation.value;
  const container = selectedContainer.value || undefined;
  const mountIndex = selectedMountIndex.value;
  const basePath = currentPath.value;
  const isValidLocation = location === "storage" || location === "dropzone" || location === "appdrive";
  if (!isValidLocation) return;

  const loc = location as UploadLocation;

  for (let i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    const relativePath = withPaths ? withPaths[i].relativePath : file.name;
    const uid = `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 11)}`;
    let targetPath = "";
    if (withPaths) {
      const pathPart = relativePath.split("/").slice(0, -1).join("/");
      if (pathPart) {
        targetPath = basePath ? `${basePath}/${pathPart}` : pathPart;
      } else if (basePath) {
        targetPath = basePath;
      }
    } else if (basePath) {
      targetPath = basePath;
    }
    uploadStore.addToQueue(loc, {
      uid,
      name: file.name,
      size: file.size,
    });
    uploadQueue.value.push({
      file,
      uid,
      targetPath,
      location,
      container,
      mountIndex,
    });
  }
  processUploadQueue();
}

function customUpload(options: any) {
  const { file } = options;
  handleFilesUpload([file]);
}

function handleUploadChange(_info: any) {}
function showContextMenu(event: MouseEvent, file: FileEntry | null) {
  event.preventDefault();
  if (file && file.name === "..") return;
  contextMenuFile.value = file;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function closeContextMenu() {
  contextMenuVisible.value = false;
  contextMenuFile.value = null;
}

function showFileProperties(file: FileEntry) {
  closeContextMenu();
  windowStore.openWindow("fileproperties", {
    title: `${file.display_name || file.name} - Properties`,
    allowMultiple: true,
    data: {
      file: {
        name: file.name,
        display_name: file.display_name,
        size: file.size,
        modified: file.modified,
        is_directory: file.is_directory,
      },
      location: currentLocation.value,
      path: currentPath.value,
      container: selectedContainer.value,
    },
  });
}

function handleContainerMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  if (isMobileLayout.value) return;

  const target = event.target as HTMLElement;
  if (target.closest(".fileexplorer-toolbar, .fileexplorer-sidebar, .fileexplorer-breadcrumbs, .fileexplorer-info-bar")) return;
  const hasItems = sortedFiles.value.length > 0 || (currentLocation.value === "systemapps" && systemAppsAsFiles.value.length > 0) || (currentLocation.value === "utilities" && utilitiesAsFiles.value.length > 0);
  if (!hasItems) return;
  if (!filesAreaRef.value) return;

  const rect = filesAreaRef.value.getBoundingClientRect();
  let startX = event.clientX - rect.left;
  let startY = event.clientY - rect.top;
  const maxX = rect.width - SELECTION_PADDING_X;
  const maxY = rect.height - SELECTION_PADDING_Y;
  startX = Math.max(SELECTION_PADDING_X, Math.min(startX, maxX));
  startY = Math.max(SELECTION_PADDING_Y, Math.min(startY, maxY));

  dragStartPoint.value = { x: startX, y: startY };
  const fileItem = target.closest("[data-filename]");
  dragStartedOnItem.value = !!fileItem;

  if (dragStartedOnItem.value) {
  } else {
    isSelectingArea.value = true;
    selectionBox.value.startX = startX;
    selectionBox.value.startY = startY;
    selectionBox.value.currentX = startX;
    selectionBox.value.currentY = startY;

    if (!event.ctrlKey && !event.metaKey) {
      selectedFile.value = null;
      selectedFiles.value.clear();
    }
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(event: MouseEvent) {
  if (!filesAreaRef.value) return;

  const rect = filesAreaRef.value.getBoundingClientRect();
  let mouseX = event.clientX - rect.left;
  let mouseY = event.clientY - rect.top;
  const maxX = rect.width - SELECTION_PADDING_X;
  const maxY = rect.height - SELECTION_PADDING_Y;
  mouseX = Math.max(SELECTION_PADDING_X, Math.min(mouseX, maxX));
  mouseY = Math.max(SELECTION_PADDING_Y, Math.min(mouseY, maxY));

  if (!isSelectingArea.value && dragStartPoint.value) {
    const distance = Math.sqrt(Math.pow(mouseX - dragStartPoint.value.x, 2) + Math.pow(mouseY - dragStartPoint.value.y, 2));

    if (distance > DRAG_SELECTION_THRESHOLD) {
      isSelectingArea.value = true;
      selectionBox.value.startX = dragStartPoint.value.x;
      selectionBox.value.startY = dragStartPoint.value.y;
      selectedFile.value = null;
      selectedFiles.value.clear();
      if (dragStartedOnItem.value) {
        wasDragSelection = true;
      }
    }
  }

  if (isSelectingArea.value) {
    selectionBox.value.currentX = mouseX;
    selectionBox.value.currentY = mouseY;
    updateSelectedFilesInBox();
  }
}

function handleMouseUp() {
  const didDrag = Math.abs(selectionBox.value.currentX - selectionBox.value.startX) > 5 || Math.abs(selectionBox.value.currentY - selectionBox.value.startY) > 5;

  if (!didDrag && isSelectingArea.value) {
    selectedFile.value = null;
    selectedFiles.value.clear();
  }

  if (isSelectingArea.value && didDrag) {
    wasDragSelection = true;
    setTimeout(() => {
      wasDragSelection = false;
    }, 50);
  }

  isSelectingArea.value = false;
  dragStartPoint.value = null;
  dragStartedOnItem.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

function updateSelectedFilesInBox() {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedFiles.value.clear();

  const container = filesAreaRef.value;
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) return;

  container?.querySelectorAll("[data-filename]").forEach((element) => {
    const fileName = element.getAttribute("data-filename");
    if (!fileName || fileName === "..") return;

    const rect = element.getBoundingClientRect();
    const elX = rect.left - containerRect.left;
    const elY = rect.top - containerRect.top;
    const elWidth = rect.width;
    const elHeight = rect.height;
    const overlapsX = elX < boxX + boxWidth && elX + elWidth > boxX;
    const overlapsY = elY < boxY + boxHeight && elY + elHeight > boxY;

    if (overlapsX && overlapsY) {
      selectedFiles.value.add(fileName);
    }
  });
}

function handleContainerTouchStart(event: TouchEvent) {
  const target = event.target as HTMLElement;
  const isFileItem = target.closest(".fileexplorer-file-item, [data-filename]");
  if (isFileItem) return;

  const touch = event.touches[0];
  if (!touch) return;

  containerTouchStartX = touch.clientX;
  containerTouchStartY = touch.clientY;
  containerHasMoved = false;

  containerLongPressTimer = setTimeout(() => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const syntheticEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    showContextMenu(syntheticEvent, null);
    containerLongPressTimer = null;
  }, LONG_PRESS_DURATION);
}

function handleContainerTouchMove(event: TouchEvent) {
  if (!containerLongPressTimer) return;

  const touch = event.touches[0];
  if (!touch) return;

  const distance = Math.sqrt(Math.pow(touch.clientX - containerTouchStartX, 2) + Math.pow(touch.clientY - containerTouchStartY, 2));

  if (distance > LONG_PRESS_MOVE_THRESHOLD) {
    containerHasMoved = true;
    if (containerLongPressTimer) {
      clearTimeout(containerLongPressTimer);
      containerLongPressTimer = null;
    }
  }
}

function handleContainerTouchEnd() {
  if (containerLongPressTimer) {
    clearTimeout(containerLongPressTimer);
    containerLongPressTimer = null;
  }

  if (!containerHasMoved) {
    selectedFile.value = null;
    selectedFiles.value.clear();
  }

  containerHasMoved = false;
}

function handleFileTouchStart(file: FileEntry, event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;

  currentTouchFile = file;
  hasMoved = false;
  isLongPressing = false;

  longPressStartX = touch.clientX;
  longPressStartY = touch.clientY;
  if (file.name === "..") return;

  longPressTimer = setTimeout(() => {
    isLongPressing = true;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    const syntheticEvent = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    showContextMenu(syntheticEvent, file);
  }, LONG_PRESS_DURATION);
}

function handleFileTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;

  const distance = Math.sqrt(Math.pow(touch.clientX - longPressStartX, 2) + Math.pow(touch.clientY - longPressStartY, 2));

  if (distance > LONG_PRESS_MOVE_THRESHOLD) {
    hasMoved = true;
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }
}

function handleFileTouchEnd(file: FileEntry, event: TouchEvent) {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }

  if (isLongPressing) {
    isLongPressing = false;
    hasMoved = false;
    currentTouchFile = null;
    return;
  }

  if (!hasMoved && currentTouchFile === file) {
    const now = Date.now();
    const touch = event.changedTouches[0];
    if (!touch) {
      hasMoved = false;
      currentTouchFile = null;
      return;
    }

    const timeSinceLastTap = now - lastTapTime;
    const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
      event.preventDefault();
      handleFileDoubleClick(file);
      lastTapTime = 0;
      lastTapX = 0;
      lastTapY = 0;
    } else {
      selectedFiles.value.clear();
      selectedFile.value = file.name;
      lastTapTime = now;
      lastTapX = touch.clientX;
      lastTapY = touch.clientY;
    }
  }

  hasMoved = false;
  currentTouchFile = null;
}
let resizeObserver: ResizeObserver | null = null;
let filesResizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  await fileExplorerStore.initialize();
  if (props.initialLocation === "appdrive" && props.initialContainer) {
    currentLocation.value = "appdrive";
    selectedContainer.value = props.initialContainer;
    isAppDriveExpanded.value = true;
    await loadContainers();
    await loadMounts(props.initialContainer, props.initialMountIndex);
  } else if (props.initialLocation === "dropzone") {
    currentLocation.value = "dropzone";
    isDropZoneExpanded.value = true;
    loadFiles();
    loadContainers();
  } else if (props.initialLocation === "storage") {
    currentLocation.value = "storage";
    isStorageExpanded.value = true;
    loadFiles();
    loadContainers();
  } else {
    loadFiles();
    loadContainers();
  }

  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateMobileLayout(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.value);
    updateMobileLayout(containerRef.value.clientWidth);
  }
  if (filesAreaRef.value) {
    filesResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    filesResizeObserver.observe(filesAreaRef.value);
    containerWidth.value = filesAreaRef.value.clientWidth;
  }
  if (props._windowId) {
    window.addEventListener(`homedock:open-file-${props._windowId}`, handleIncomingNavigation as unknown as EventListener);
  }
});
async function handleIncomingNavigation(event: CustomEvent) {
  const data = event.detail;
  if (data?.initialLocation === "appdrive" && data?.initialContainer) {
    currentLocation.value = "appdrive";
    selectedContainer.value = data.initialContainer;
    currentPath.value = "";
    isAppDriveExpanded.value = true;
    await loadMounts(data.initialContainer, data.initialMountIndex);
  }
}

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (filesResizeObserver) {
    filesResizeObserver.disconnect();
  }
  if (props._windowId) {
    window.removeEventListener(`homedock:open-file-${props._windowId}`, handleIncomingNavigation as unknown as EventListener);
  }
});
watch(currentPath, () => {
  nextTick(() => {
    if (breadcrumbsRef.value) {
      breadcrumbsRef.value.scrollLeft = breadcrumbsRef.value.scrollWidth;
    }
  });
});
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

watch(searchQuery, (newVal) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
  if (!newVal || newVal.trim().length < 2) {
    loadFiles();
    return;
  }
  const canSearch = currentLocation.value === "dropzone" || currentLocation.value === "storage" || (currentLocation.value === "appdrive" && selectedContainer.value);
  if (newVal.trim().length >= 2 && canSearch) {
    searchTimeout = setTimeout(() => {
      performSearch(true);
    }, 300);
  }
});
watch(
  () => desktopStore.dockerApps.length,
  async () => {
    await loadContainers();
    if (currentLocation.value === "appdrive" && selectedContainer.value) {
      const containerExists = containers.value.some((c) => c.name === selectedContainer.value);
      if (!containerExists) {
        selectedContainer.value = "";
        mounts.value = [];
        files.value = [];
      }
    }
  }
);
watch(
  () => desktopStore.dockerApps.map((app) => ({ name: app.name, status: app.status })),
  (newStatuses) => {
    containers.value = containers.value.map((container) => {
      const storeApp = newStatuses.find((app) => app.name === container.name);
      if (storeApp && storeApp.status !== container.status) {
        return { ...container, status: storeApp.status };
      }
      return container;
    });
  },
  { deep: true }
);
</script>

<style scoped>
.fileexplorer-sidebar {
  min-width: 180px;
}

.fileexplorer-grid {
  position: relative;
  width: 100%;
  user-select: none;
}
.fileexplorer-grid--flex {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 4px;
}

.dragger-fade-enter-active,
.dragger-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dragger-fade-enter-from,
.dragger-fade-leave-to {
  opacity: 0;
}
.expand-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.2s ease-out;
}

.expand-wrapper.collapsed {
  grid-template-rows: 0fr;
}

.expand-wrapper > .expand-content {
  overflow: hidden;
}

.expand-height-enter-active,
.expand-height-leave-active {
  transition: opacity 0.2s ease;
}

.expand-height-enter-from,
.expand-height-leave-to {
  opacity: 0;
}
.view-mode-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-mode-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
}

.view-mode-fade-enter-from {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

.view-mode-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-8px);
}
.list-view-fade-enter-active {
  transition: opacity 0.2s ease;
}

.list-view-fade-leave-active {
  transition: opacity 0.15s ease;
}

.list-view-fade-enter-from,
.list-view-fade-leave-to {
  opacity: 0;
}
.location-fade-enter-active,
.location-fade-leave-active {
  transition: opacity 0.15s ease;
}

.location-fade-enter-from,
.location-fade-leave-to {
  opacity: 0;
}
.file-item-enter-active,
.file-item-leave-active {
  transition: all 0.3s ease;
}

.file-item-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.file-item-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.file-item-move {
  transition: transform 0.3s ease;
}
.file-item-list-enter-active,
.file-item-list-leave-active {
  transition: all 0.2s ease;
}

.file-item-list-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.file-item-list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

.file-item-list-move {
  transition: transform 0.2s ease;
}

.upload-slide-up-enter-active,
.upload-slide-up-leave-active {
  transition: all 0.3s ease;
}

.upload-slide-up-enter-from,
.upload-slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.nav-burger-icon {
  position: relative;
  width: 16px;
  height: 16px;
}

.nav-burger-menu,
.nav-burger-close {
  position: absolute;
  inset: 0;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
}

.nav-burger-menu {
  opacity: 1;
  transform: rotate(0deg);
}

.nav-burger-close {
  opacity: 0;
  transform: rotate(-90deg);
}

.nav-burger-open .nav-burger-menu {
  opacity: 0;
  transform: rotate(90deg);
}

.nav-burger-open .nav-burger-close {
  opacity: 1;
  transform: rotate(0deg);
}
.popover-fade-enter-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.popover-fade-leave-active {
  transition: all 0.1s cubic-bezier(0.4, 0, 1, 1);
}

.popover-fade-enter-from {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-2px) scale(0.98);
}
.mobile-search-icon-enter-active,
.mobile-search-icon-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-search-icon-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.mobile-search-icon-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.mobile-search-expand-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-search-expand-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.mobile-search-expand-enter-from {
  opacity: 0;
  transform: scaleX(0.3);
  transform-origin: left center;
}

.mobile-search-expand-leave-to {
  opacity: 0;
  transform: scaleX(0.3);
  transform-origin: left center;
}
.mobile-controls-fade-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
}

.mobile-controls-fade-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
}

.mobile-controls-fade-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.mobile-controls-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
