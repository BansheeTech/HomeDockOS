<!-- homedock-ui/vue3/static/js/__Apps__/AppAppDrive.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-appdrive flex flex-col h-full overflow-hidden" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @dragover.prevent @drop.prevent.stop="handleDrop">
    <transition name="dragger-fade">
      <div v-if="isDraggingFiles && !isReadOnly" class="absolute inset-0 z-[9999] pointer-events-none backdrop-blur-sm">
        <div :class="[themeClasses.scopeSelector, themeClasses.dropZoneDragHolder]" class="fullscreen-dragger h-full border-2 border-dashed rounded-lg flex items-center justify-center">
          <div class="flex items-center align-center justify-center flex-col h-full">
            <p class="ant-upload-drag-icon">
              <Icon :icon="cubeScanIcon" :class="[themeClasses.dropZoneDragIcon]" class="text-5xl w-16 h-16" />
            </p>
            <p :class="[themeClasses.dropZoneDragUpText]" class="px-4 text-balance text-center text-lg font-semibold mt-4">Drop files or folders to upload to {{ selectedContainerName }}</p>
            <p :class="[themeClasses.dropZoneDragDownText]" class="px-4 text-balance text-center text-sm mt-2">Folders will maintain their structure.</p>
            <p :class="[themeClasses.dropZoneDragDownText]" class="px-4 text-balance text-center text-sm mt-1">Hidden files (.*) are automatically filtered.</p>
          </div>
        </div>
      </div>
    </transition>

    <div class="flex-1 flex flex-col overflow-auto px-4 pt-2 pb-5">
      <div class="mt-2 flex flex-col flex-1 gap-2">
        <div class="appdrive-controls-container flex flex-col gap-2 items-start justify-between flex-shrink-0">
          <div class="appdrive-selectors flex gap-2 w-full flex-wrap">
            <Select v-model:value="selectedContainer" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="appdrive-container-select h-8 flex-1 rounded-md min-w-[180px] transition duration-150" :popup-class-name="`${themeClasses.scopeSelector} appdrive-container-dropdown`" :show-search="false" placeholder="Select an application" @change="(val) => handleContainerChange(val as string)" :loading="isLoadingContainers">
              <template #suffixIcon>
                <Icon :icon="dockerIcon" class="w-4 h-4" />
              </template>
              <SelectOption v-for="container in mainContainers" :key="container.name" :value="container.name">
                <div class="flex items-center gap-2">
                  <div class="relative flex-shrink-0">
                    <BaseImage :src="getAppInfo(container.name).iconPath" :alt="getAppInfo(container.name).displayName" class="w-4 h-4 rounded" draggable="false" />
                    <span :class="[container.status === 'running' ? 'bg-green-500' : 'bg-gray-400']" class="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-black/20"></span>
                  </div>
                  <span class="truncate">{{ getAppInfo(container.name).displayName }}</span>
                  <span class="text-[10px] opacity-60">({{ container.mounts_count }} mount{{ container.mounts_count > 1 ? "s" : "" }})</span>
                </div>
              </SelectOption>
            </Select>

            <Select v-if="mounts.length > 1" v-model:value="selectedMountIndex" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="appdrive-mount-select h-8 flex-1 rounded-md min-w-[200px] transition duration-150" :popup-class-name="`${themeClasses.scopeSelector} appdrive-mount-dropdown`" :show-search="false" placeholder="Select mount" @change="handleMountChange">
              <template #suffixIcon>
                <Icon :icon="folderIcon" class="w-4 h-4" />
              </template>
              <SelectOption v-for="(mount, index) in mounts" :key="index" :value="index">
                <div class="flex items-center gap-2">
                  <Icon :icon="mount.read_only ? lockIcon : folderIcon" class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate text-xs">{{ mount.container_path }}</span>
                </div>
              </SelectOption>
            </Select>
          </div>

          <div class="appdrive-actions-wrapper flex items-center gap-2 mt-0.5 w-full">
            <Select v-model:value="sortBy" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="appdrive-sort-select h-8 flex-1 rounded-md min-w-[140px] transition duration-150" :popup-class-name="`${themeClasses.scopeSelector}`" :show-search="false">
              <template #suffixIcon>
                <Icon :icon="axisArrowIcon" class="w-4 h-4" />
              </template>
              <SelectOption value="name">Sort by Name</SelectOption>
              <SelectOption value="size">Sort by Size</SelectOption>
              <SelectOption value="date">Sort by Date</SelectOption>
            </Select>

            <button @click="toggleSortDirection" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-1 border rounded-md transition-colors h-8 flex items-center justify-center flex-shrink-0" :title="sortDirection === 'asc' ? 'Sort Ascending' : 'Sort Descending'">
              <Icon :icon="sortDirection === 'asc' ? sortAscIcon : sortDescIcon" class="w-4 h-4" />
            </button>

            <button @click="toggleViewMode" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-1 border rounded-md transition-colors h-8 flex items-center justify-center flex-shrink-0" :title="viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'">
              <Icon :icon="viewMode === 'grid' ? viewListIcon : viewGridIcon" class="w-4 h-4" />
            </button>

            <button @click="refreshFiles" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-1 border rounded-md transition-colors h-8 flex items-center justify-center flex-shrink-0" title="Refresh">
              <Icon :icon="refreshIcon" :class="{ 'animate-spin': isLoading }" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <transition name="breadcrumb-slide">
          <div v-if="currentPath" class="flex items-center gap-1 text-[11px] flex-shrink-0 flex-wrap">
            <button @click="navigateToRoot" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity flex items-center gap-1">
              <Icon :icon="homeIcon" class="w-3 h-3" />
              <span>Root</span>
            </button>
            <template v-for="(part, index) in pathParts" :key="index">
              <Icon :icon="chevronRightIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-3 h-3 opacity-50" />
              <button @click="navigateToPathIndex(index)" :class="[themeClasses.dropZoneSortButton]" class="px-2 py-0.5 rounded hover:opacity-80 transition-opacity truncate max-w-[150px]">
                {{ part }}
              </button>
            </template>
          </div>
        </transition>

        <div class="flex items-center justify-start text-[10px] gap-2 flex-shrink-0">
          <span :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5"> {{ files.length }} {{ files.length === 1 ? "item" : "items" }} </span>
          <span v-if="totalSize !== '0 B' && files.length > 0" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5"> {{ totalSize }} total </span>
          <span v-if="isReadOnly" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5 flex items-center gap-1">
            <Icon :icon="lockIcon" class="w-3 h-3" />
            Read-only
          </span>
          <span v-if="containerPath" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5 opacity-60 truncate max-w-[200px]" :title="containerPath"> {{ containerPath }} </span>
        </div>

        <div ref="containerRef" class="view-mode-container" @mousedown="handleContainerMouseDown" @contextmenu="showContextMenu($event, null)" @touchstart="handleContainerTouchStart" @touchmove="handleContainerTouchMove" @touchend="handleContainerTouchEnd" @touchcancel="handleContainerTouchEnd">
          <div v-if="!selectedContainer" class="appdrive-container-picker relative w-full select-none" :style="{ height: `${containerPickerHeight}px` }">
            <TransitionGroup name="container-icon">
              <div v-for="positioned in positionedContainers" :key="positioned.name" @click="selectContainer(positioned.name)" :style="{ position: 'absolute', left: `${positioned.x}px`, top: `${positioned.y}px` }" :class="['group flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg border border-transparent', 'transition-[background,transform,border,box-shadow] duration-150', 'w-[100px] h-[120px] select-none', 'hover:-translate-y-0.5', themeClasses.desktopIconBg || 'hover:bg-white/5']">
                <div class="relative">
                  <div :class="['relative w-16 h-16 flex items-center justify-center rounded-2xl overflow-hidden border border-transparent', 'transition-[background,transform,border-color] duration-150', themeClasses.desktopIconContainerBg, themeClasses.desktopIconContainerBgHover]">
                    <BaseImage :src="getAppInfo(positioned.name).iconPath" :alt="getAppInfo(positioned.name).displayName" class="w-12 h-12 object-contain rounded-xl" draggable="false" />
                    <span :class="[positioned.status === 'running' ? 'bg-green-500' : 'bg-gray-400', themeClasses.desktopStatusBadgeBorder]" class="absolute bottom-1 right-1 w-3 h-3 rounded-full"></span>
                  </div>
                  <div :class="[themeClasses.dropZoneFileSize]" class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full z-10">
                    <Icon :icon="folderIcon" class="w-3.5 h-3.5" />
                  </div>
                </div>
                <span :class="[themeClasses.desktopIconText]" class="text-xs text-center max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium">{{ getAppInfo(positioned.name).displayName }}</span>
              </div>
            </TransitionGroup>
            <div v-if="mainContainers.length === 0 && !isLoadingContainers" class="flex justify-center items-center w-full py-8">
              <Empty :class="[themeClasses.dropZoneEmptyText]" description="No containers with accessible mounts found" />
            </div>
          </div>

          <transition v-else-if="selectedContainer" :name="viewMode === 'grid' ? 'view-mode-fade' : 'list-view-fade'" mode="out-in">
            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" :key="'grid-view'" class="appdrive-icons-container relative w-full select-none" :style="{ height: `${gridContainerHeight}px` }">
              <div v-if="isSelectingArea" class="absolute pointer-events-none z-[100] border-2 border-blue-500 bg-blue-500/20" :style="selectionBoxStyle" />
              <div v-if="files.length === 0 && !currentPath && !isLoading" class="absolute inset-0 flex justify-center items-center text-balance px-2 py-8">
                <Empty :class="[themeClasses.dropZoneEmptyText]" :description="isReadOnly ? 'This mount is empty' : 'This mount is empty. Drag and drop files to upload.'" />
              </div>
              <TransitionGroup name="file-item">
                <template v-for="file in positionedFiles" :key="file.name">
                  <div v-if="file.name === '__back__'" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" @click="handleBackClick" @contextmenu.prevent @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)" :class="['group flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg appdrive-file-item touch-manipulation select-none', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px]', themeClasses.desktopIconBg || 'hover:bg-white/5']">
                    <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg || 'bg-white/10', 'transition-transform duration-200 group-hover:scale-105']">
                      <Icon :icon="folderArrowLeftIcon" :class="[themeClasses.dropZoneFileIcon]" class="h-10 w-10" />
                    </div>
                    <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center">..</span>
                  </div>

                  <div v-else :data-filename="file.name" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" :class="['group flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg appdrive-file-item touch-manipulation select-none', 'transition-[background,transform,border] duration-150', 'w-[100px] h-[120px] border', selectedFile === file.name || selectedFiles.has(file.name) ? [themeClasses.desktopIconBgSelected || 'bg-blue-500/20', themeClasses.desktopIconBorderSelected || 'border-blue-500'] : ['border-transparent', themeClasses.desktopIconBg || 'hover:bg-white/5']]" @click="handleFileClick(file, $event)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)">
                    <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg || 'bg-white/10', 'transition-transform duration-200 group-hover:scale-105', (selectedFile === file.name || selectedFiles.has(file.name)) && (themeClasses.desktopIconContainerBgSelected || 'bg-blue-500/30')]">
                      <div v-if="!file.is_directory && file.size > 0" :class="[themeClasses.dropZoneFileSize]" class="absolute -left-1 -top-1 text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap z-10">
                        {{ formatSizeCompact(file.size) }}
                      </div>

                      <div v-if="getRelativeTime(file)" class="absolute -left-1 -bottom-1 flex items-center gap-0.5 z-10">
                        <div :class="[themeClasses.dropZoneFileSize]" class="text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap">
                          {{ getRelativeTime(file) }}
                        </div>
                      </div>

                      <div v-if="compressingFolders.has(file.name)" class="absolute -right-1 -top-1 z-20">
                        <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4" />
                      </div>

                      <Icon :icon="fileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-10 w-10 transition duration-300 group-hover:scale-110" />

                      <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center z-10">
                        <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-7 w-7 animate-spin" />
                      </div>
                    </div>

                    <span :class="[themeClasses.dropZoneFileText]" class="text-[11px] leading-tight text-center line-clamp-2 w-full px-1 break-words" :title="file.display_name">
                      {{ file.display_name }}
                    </span>

                    <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute -bottom-1 left-2 right-2">
                      <Progress :percent="downloadProgresses[file.name]" :class="[themeClasses.scopeSelector]" :show-info="false" :size="2" status="active" class="h-1 rounded-full" />
                    </div>
                  </div>
                </template>
              </TransitionGroup>
            </div>

            <!-- List View -->
            <div v-else :key="`list-view-${currentPath}`" class="appdrive-list-container w-full select-none">
              <div v-if="isSelectingArea" class="absolute pointer-events-none z-[100] border-2 border-blue-500 bg-blue-500/20" :style="selectionBoxStyle" />
              <div v-if="files.length === 0 && !currentPath && !isLoading" class="flex justify-center items-center text-balance px-2 py-8">
                <Empty :class="[themeClasses.dropZoneEmptyText]" :description="isReadOnly ? 'This mount is empty' : 'This mount is empty. Drag and drop files to upload.'" />
              </div>
              <TransitionGroup name="file-item-list">
                <div v-if="currentPath" key="back-button" @click="handleBackClick" @contextmenu.prevent @touchstart="handleBackTouchStart" @touchmove="handleFileTouchMove" @touchend="handleBackTouchEnd($event)" @touchcancel="handleBackTouchEnd($event)" :class="['group flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors appdrive-file-item touch-manipulation select-none', themeClasses.desktopIconBg || 'hover:bg-white/5']">
                  <div class="relative flex-shrink-0 z-[1]">
                    <div :class="['relative w-6 h-6 flex items-center justify-center']">
                      <Icon :icon="folderArrowLeftIcon" :class="[themeClasses.dropZoneFileIcon]" class="h-5 w-5" />
                    </div>
                  </div>
                  <span :class="[themeClasses.dropZoneFileText]" class="text-xs">..</span>
                </div>

                <div v-for="file in sortedFiles" :key="file.name" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors appdrive-file-item touch-manipulation select-none overflow-hidden', selectedFile === file.name || selectedFiles.has(file.name) ? [themeClasses.desktopIconBgSelected || 'bg-blue-500/20'] : [themeClasses.desktopIconBg || 'hover:bg-white/5']]" @click="handleFileClick(file, $event)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)">
                  <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                  <div class="relative flex-shrink-0 z-[1]">
                    <div :class="['relative w-6 h-6 flex items-center justify-center']">
                      <Icon :icon="fileIcon(file)" :class="[themeClasses.dropZoneFileIcon, compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />
                      <div v-if="compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                        <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                      </div>
                      <div v-if="compressingFolders.has(file.name)" class="absolute -right-1.5 -top-1">
                        <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-3 w-3" />
                      </div>
                    </div>
                  </div>

                  <div class="flex-1 overflow-hidden z-[1]">
                    <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.display_name">
                      {{ file.display_name }}
                    </span>
                  </div>

                  <div v-if="!file.is_directory" :class="[themeClasses.dropZoneFileSize]" class="list-view-size text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                    {{ formatSize(file.size) }}
                  </div>

                  <div v-if="getRelativeTime(file)" :class="[themeClasses.dropZoneFileSize]" class="list-view-time text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 z-[1]">
                    {{ getRelativeTime(file) }}
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </transition>
        </div>
      </div>
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
        </p>
        <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">The folder structure will be preserved inside the container's volume.</p>
      </div>
    </AppDialog>

    <transition name="upload-slide-up">
      <Upload v-if="selectedContainer && !isReadOnly" v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleUploadChange" :showUploadList="false" class="fixed bottom-10 right-2 z-50 hidden max-[900px]:block">
        <button :class="[themeClasses.dropZoneSortButton]" class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 active:scale-95 border-none cursor-pointer" title="Upload Files">
          <Icon :icon="cloudUploadIcon" class="w-6 h-6" />
        </button>
      </Upload>
    </transition>

    <transition name="upload-slide-up">
      <div v-if="uploadStore.isUploading" class="border-t" :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]">
        <div :class="[themeClasses.hrSelector]"></div>

        <div @click="isUploadPanelExpanded = !isUploadPanelExpanded" class="flex items-center gap-2 h-7 pb-0.5 px-3 cursor-pointer hover:opacity-80 transition-opacity">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" :class="[themeClasses.dropZoneDragIcon]" class="flex-shrink-0">
              <rect width="24" height="24" fill="none" />
              <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.3">
                <path stroke-dasharray="2 4" stroke-dashoffset="6" d="M12 21c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9">
                  <animate attributeName="stroke-dashoffset" dur="0.6s" repeatCount="indefinite" values="6;0" />
                </path>
                <path stroke-dasharray="32" stroke-dashoffset="32" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9">
                  <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.1s" dur="0.4s" values="32;0" />
                </path>
                <path stroke-dasharray="10" stroke-dashoffset="10" d="M12 16v-7.5">
                  <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" values="10;0" />
                </path>
                <path stroke-dasharray="6" stroke-dashoffset="6" d="M12 8.5l3.5 3.5M12 8.5l-3.5 3.5">
                  <animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.2s" values="6;0" />
                </path>
              </g>
            </svg>

            <span :class="[themeClasses.dropZoneDragUpText]" class="text-[10px] leading-none truncate"> {{ uploadSessionCompleted }} of {{ uploadSessionTotal }} </span>
          </div>

          <div class="flex mt-1.5 items-center flex-1 max-w-xs">
            <Progress :percent="totalUploadProgress" :class="[themeClasses.scopeSelector]" :show-info="false" :size="2" status="active" class="rounded-full flex-1" />
          </div>

          <Icon :icon="chevronUpIcon" :class="[themeClasses.dropZoneFileIcon, 'transition-transform duration-200', isUploadPanelExpanded && 'rotate-180']" class="w-3.5 h-3.5 flex-shrink-0" />
        </div>

        <transition name="expand-height">
          <div v-if="isUploadPanelExpanded" :class="[themeClasses.dropZoneFileDisplayer]">
            <div :class="[themeClasses.hrSelector]"></div>
            <div class="max-h-60 overflow-y-auto py-1">
              <template v-for="(upload, index) in uploadStore.currentlyUploading" :key="upload.uid">
                <div class="px-3 py-1.5">
                  <div class="flex items-center gap-1.5">
                    <Icon :icon="cubeIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-1.5 mb-0.5">
                        <p :class="[themeClasses.dropZoneFileText]" class="text-[11px] font-medium truncate flex-1" :title="upload.name">
                          {{ upload.name }}
                        </p>
                        <span :class="[themeClasses.dropZoneFileSize]" class="text-[9px] font-semibold px-1 rounded whitespace-nowrap"> {{ uploadStore.uploadProgress[upload.uid] || 0 }}% </span>
                      </div>
                      <Progress :percent="uploadStore.uploadProgress[upload.uid] || 0" :class="[themeClasses.scopeSelector]" :show-info="false" :size="1.5" status="active" class="rounded-full" />
                    </div>
                  </div>
                </div>
                <div v-if="index < uploadStore.currentlyUploading.length - 1 || uploadStore.queue.length > 0" :class="[themeClasses.hrSelector]"></div>
              </template>

              <template v-for="(upload, index) in uploadStore.queue.slice(0, 3)" :key="upload.uid">
                <div class="px-3 py-1.5 opacity-40">
                  <div class="flex items-center gap-1.5">
                    <Icon :icon="cubeIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                    <div class="flex items-center gap-1.5 flex-1 min-w-0">
                      <p :class="[themeClasses.dropZoneFileText]" class="text-[11px] truncate flex-1" :title="upload.name">
                        {{ upload.name }}
                      </p>
                      <span :class="[themeClasses.dropZoneFileSize]" class="text-[9px] font-medium px-1 rounded whitespace-nowrap"> Waiting... </span>
                    </div>
                  </div>
                </div>
                <div v-if="index < Math.min(2, uploadStore.queue.length - 1)" :class="[themeClasses.hrSelector]"></div>
              </template>

              <template v-if="uploadStore.queue.length > 3">
                <div :class="[themeClasses.hrSelector]"></div>
                <div class="px-3 py-1 text-center">
                  <span :class="[themeClasses.dropZoneFilesCount]" class="text-[9px] opacity-60"> And {{ uploadStore.queue.length - 3 }} more in queue... </span>
                </div>
              </template>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <StatusBubble :visible="showUploadStatus" :message="uploadStatusMessage" position="bottom-left" />

    <StatusBar :icon="cubeScanIcon" :message="statusBarMessage" :info="statusBarInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="cubeScanIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">App Drive</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Access and manage files stored in your applications volumes. Browse, upload, download, and organize files directly within the application mapped directories. Only volumes mounted within HomeDock OS data directory are accessible for security.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, onMounted, onUnmounted, ref, watch, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useAppDriveUploadingStore, type UploadFile } from "../__Stores__/useAppDriveUploadingStore";
import { useFileViewerPrefsStore } from "../__Stores__/useFileViewerPrefsStore";
import { storeToRefs } from "pinia";

import { message, Upload, Empty, Progress, Select, SelectOption, Input } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import cubeScanIcon from "@iconify-icons/mdi/cube-scan";
import dockerIcon from "@iconify-icons/mdi/docker";
import folderIcon from "@iconify-icons/mdi/folder";
import folderArrowLeftIcon from "@iconify-icons/mdi/folder-arrow-left";
import folderPlusIcon from "@iconify-icons/mdi/folder-plus";
import textFileIcon from "@iconify-icons/mdi/file-document";
import imageFileIcon from "@iconify-icons/mdi/file-image";
import videoFileIcon from "@iconify-icons/mdi/file-video";
import audioFileIcon from "@iconify-icons/mdi/file-music";
import zipFileIcon from "@iconify-icons/mdi/zip-box";
import excelFileIcon from "@iconify-icons/mdi/file-excel";
import powerpointFileIcon from "@iconify-icons/mdi/file-powerpoint";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";
import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import cloudUploadIcon from "@iconify-icons/mdi/cloud-upload";
import axisArrowIcon from "@iconify-icons/mdi/axis-arrow";
import sortAscIcon from "@iconify-icons/mdi/sort-ascending";
import sortDescIcon from "@iconify-icons/mdi/sort-descending";
import viewListIcon from "@iconify-icons/mdi/view-list";
import viewGridIcon from "@iconify-icons/mdi/view-grid";
import lockIcon from "@iconify-icons/mdi/lock";
import pencilIcon from "@iconify-icons/mdi/pencil";
import deleteIcon from "@iconify-icons/mdi/delete";
import homeIcon from "@iconify-icons/mdi/home";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import cubeIcon from "@iconify-icons/mdi/cube";
import refreshIcon from "@iconify-icons/mdi/refresh";
import checkIcon from "@iconify-icons/mdi/check-circle";
import loadingIcon from "@iconify-icons/mdi/loading";

import ContextMenu from "../__Components__/ContextMenu.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import StatusBubble from "../__Components__/StatusBubble.vue";
import BaseImage from "../__Components__/BaseImage.vue";

interface Props {
  containerName?: string;
  mountIndex?: number;
}

const props = defineProps<Props>();

interface FileEntry {
  name: string;
  display_name: string;
  size: number;
  modified: number;
  is_directory: boolean;
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

interface PositionedFileEntry extends FileEntry {
  x: number;
  y: number;
}

const MIN_GRID_SIZE_X = 110;
const GRID_SIZE_Y = 125;

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const desktopStore = useDesktopStore();
const uploadStore = useAppDriveUploadingStore();

const containers = ref<ContainerInfo[]>([]);
const mounts = ref<MountInfo[]>([]);
const files = ref<FileEntry[]>([]);

const selectedContainer = ref<string | undefined>(undefined);
const selectedMountIndex = ref<number>(0);
const currentPath = ref<string>("");

const selectedMount = computed(() => {
  if (mounts.value.length === 0 || selectedMountIndex.value < 0 || selectedMountIndex.value >= mounts.value.length) {
    return null;
  }
  return mounts.value[selectedMountIndex.value];
});

const containerPath = computed(() => selectedMount.value?.container_path || "");
const isReadOnly = computed(() => selectedMount.value?.read_only || false);

const isLoadingContainers = ref<boolean>(false);
const isLoading = ref<boolean>(false);

const selectedFile = ref<string>("");
const selectedFiles = ref<Set<string>>(new Set());
const isSelectingArea = ref(false);
const selectionBox = ref({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
const dragStartPoint = ref<{ x: number; y: number } | null>(null);
let wasDragSelection = false;
const DRAG_SELECTION_THRESHOLD = 20;

const fileViewerPrefs = useFileViewerPrefsStore();
const { sortBy, sortDirection, viewMode } = storeToRefs(fileViewerPrefs);

const isDraggingFiles = ref<boolean>(false);
const dragCounter = ref<number>(0);

const fileList = ref<any[]>([]);
const downloadProgresses = ref<Record<string, number>>({});
const compressingFolders = ref<Set<string>>(new Set());

const uploadQueue = ref<
  Array<{
    file: UploadFile;
    path: string;
    onProgress?: (event: { percent: number }) => void;
    onSuccess?: (result: any, file: UploadFile) => void;
    onError?: (error: any) => void;
  }>
>([]);
const activeUploads = ref(0);
const maxConcurrent = 3;
const uploadSessionTotal = ref(0);
const uploadSessionCompleted = ref(0);
const isUploadPanelExpanded = ref(false);
const uploadStatusMessage = ref("");
const showUploadStatus = ref(false);
let isProcessingQueue = false;

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref<number>(0);
const stableGridCols = ref<number>(0);
let resizeObserver: ResizeObserver | null = null;

let loadFilesRequestId = 0;

const contextMenuVisible = ref<boolean>(false);
const contextMenuX = ref<number>(0);
const contextMenuY = ref<number>(0);
const contextMenuFile = ref<FileEntry | null>(null);

const deleteDialogVisible = ref<boolean>(false);
const deleteDialogTitle = ref<string>("");
const deleteDialogContent = ref<string>("");
const fileToDelete = ref<FileEntry | null>(null);

const createFolderDialogVisible = ref<boolean>(false);
const newFolderName = ref<string>("");

const renameDialogVisible = ref<boolean>(false);
const renameValue = ref<string>("");

const folderUploadWarningVisible = ref<boolean>(false);
const pendingUploadData = ref<{
  allFiles: Array<{ file: File; relativePath: string }>;
  folders: string[];
} | null>(null);
const fileToRename = ref<FileEntry | null>(null);

function getAppInfo(containerName: string) {
  const app = desktopStore.dockerApps.find((a) => a.name === containerName);
  return {
    displayName: app?.display_name || containerName,
    iconPath: app?.image_path || "docker-icons/notfound.jpg",
  };
}

const mainContainers = computed(() => {
  return containers.value.filter((container) => {
    const app = desktopStore.dockerApps.find((a) => a.name === container.name);
    return !app?.HDRole || app.HDRole !== "dependency";
  });
});

const selectedContainerName = computed(() => {
  const container = containers.value.find((c) => c.name === selectedContainer.value);
  if (!container) return "";
  const appInfo = getAppInfo(container.name);
  return appInfo.displayName;
});

const totalUploadProgress = computed(() => {
  if (uploadSessionTotal.value === 0) return 0;

  let totalProgress = uploadSessionCompleted.value * 100;

  uploadStore.currentlyUploading.forEach((upload) => {
    const progress = uploadStore.uploadProgress[upload.uid] || 0;
    totalProgress += progress;
  });

  return Math.round(totalProgress / uploadSessionTotal.value);
});

watch(
  () => uploadStore.totalUploading,
  (newTotal, oldTotal) => {
    if (oldTotal !== undefined && newTotal < oldTotal) {
      const completed = oldTotal - newTotal;
      uploadSessionCompleted.value += completed;
    }

    uploadSessionTotal.value = uploadSessionCompleted.value + newTotal;

    if (newTotal === 0 && uploadSessionTotal.value > 0) {
      setTimeout(() => {
        uploadSessionTotal.value = 0;
        uploadSessionCompleted.value = 0;
        isUploadPanelExpanded.value = false;
      }, 3000);
    }
  },
  { immediate: true }
);

const pathParts = computed(() => {
  if (!currentPath.value) return [];
  return currentPath.value.split("/").filter((p) => p);
});

const sortedFiles = computed(() => {
  const sorted = [...files.value];

  sorted.sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;

    let comparison = 0;
    switch (sortBy.value) {
      case "name":
        comparison = a.display_name.localeCompare(b.display_name);
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

  return sorted;
});

const positionedFiles = computed((): PositionedFileEntry[] => {
  const width = containerWidth.value || window.innerWidth - 100;
  const maxCols = stableGridCols.value || Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  const allItems: PositionedFileEntry[] = [];
  let startIndex = 0;

  if (currentPath.value) {
    allItems.push({
      name: "__back__",
      display_name: "..",
      size: 0,
      modified: 0,
      is_directory: true,
      x: 8 + (actualCellWidth - 100) / 2,
      y: 8,
    });
    startIndex = 1;
  }

  sortedFiles.value.forEach((file, index) => {
    const adjustedIndex = index + startIndex;
    const col = adjustedIndex % maxCols;
    const row = Math.floor(adjustedIndex / maxCols);

    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    allItems.push({
      ...file,
      x,
      y,
    });
  });

  return allItems;
});

const gridContainerHeight = computed(() => {
  if (positionedFiles.value.length === 0) {
    return 300;
  }

  const maxY = Math.max(...positionedFiles.value.map((f) => f.y));
  const iconHeight = 130;
  const bottomPadding = 16;
  const contentHeight = maxY + iconHeight + bottomPadding;

  return Math.max(contentHeight, 300);
});

interface PositionedContainer extends ContainerInfo {
  x: number;
  y: number;
}

const positionedContainers = computed((): PositionedContainer[] => {
  const width = containerWidth.value || window.innerWidth - 100;
  // Use stableGridCols to prevent layout thrashing from scrollbar changes
  const maxCols = stableGridCols.value || Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));
  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  return mainContainers.value.map((container, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);

    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    return {
      ...container,
      x,
      y,
    };
  });
});

const containerPickerHeight = computed(() => {
  if (positionedContainers.value.length === 0) {
    return 300;
  }

  const maxY = Math.max(...positionedContainers.value.map((c) => c.y));
  const iconHeight = 130;
  const bottomPadding = 16;
  const contentHeight = maxY + iconHeight + bottomPadding;

  return Math.max(contentHeight, 300);
});

const selectionBoxStyle = computed(() => {
  const x = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const y = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const width = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const height = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);
  return {
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

const totalSize = computed(() => {
  const total = files.value.reduce((acc, file) => acc + (file.is_directory ? 0 : file.size), 0);
  return formatSize(total);
});

const statusBarMessage = computed(() => {
  if (!selectedContainer.value) return "Select an application";
  return selectedContainerName.value;
});

const statusBarInfo = computed(() => {
  if (!selectedContainer.value) return "Browse application files";
  return `${files.value.length} items`;
});

const contextMenuItems = computed(() => {
  const items: any[] = [];
  const selectedCount = selectedFiles.value.size;

  if (selectedCount > 1) {
    const selectedFilesList = Array.from(selectedFiles.value)
      .map((name) => files.value.find((f) => f.name === name))
      .filter((f) => f !== undefined) as FileEntry[];

    const hasDirectories = selectedFilesList.some((f) => f.is_directory);
    const onlyFiles = selectedFilesList.filter((f) => !f.is_directory);

    const shouldZip = selectedCount > 3 || hasDirectories;

    items.push({ label: `Selected: ${selectedCount} items`, icon: checkIcon, disabled: true });
    items.push({ divider: true });

    if (shouldZip) {
      items.push({
        label: "Download as ZIP",
        icon: zipFileIcon,
        action: async () => {
          const fileNames = selectedFilesList.map((f) => f.name);
          closeContextMenu();
          await downloadMultipleAsZip(fileNames);
        },
      });
    } else if (onlyFiles.length > 0) {
      items.push({
        label: "Download All",
        icon: arrowDownThickIcon,
        action: async () => {
          for (const file of onlyFiles) {
            await downloadFile(file);
          }
          closeContextMenu();
        },
      });
    }

    if (!isReadOnly.value) {
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

      items.push({ divider: true });

      items.push({
        label: "New Folder",
        icon: folderPlusIcon,
        action: () => (createFolderDialogVisible.value = true),
      });
    }

    items.push({
      label: "Refresh",
      icon: refreshIcon,
      action: () => refreshFiles(),
    });

    return items;
  }

  if (contextMenuFile.value) {
    if (contextMenuFile.value.is_directory) {
      items.push({
        label: "Open",
        icon: folderIcon,
        action: () => {
          const folderPath = contextMenuFile.value!.name;
          closeContextMenu();
          loadFiles(folderPath);
        },
      });

      items.push({
        label: "Download as ZIP",
        icon: arrowDownThickIcon,
        action: () => downloadFile(contextMenuFile.value!),
      });

      items.push({ divider: true });

      if (!isReadOnly.value) {
        items.push({
          label: "Rename Folder",
          icon: pencilIcon,
          action: () => openRenameDialog(contextMenuFile.value!),
        });
        items.push({
          label: "Delete Folder",
          icon: deleteIcon,
          danger: true,
          action: () => openDeleteDialog(contextMenuFile.value!),
        });

        items.push({ divider: true });

        items.push({
          label: "New Folder",
          icon: folderPlusIcon,
          action: () => (createFolderDialogVisible.value = true),
        });
      }
    } else {
      items.push({
        label: "Download",
        icon: arrowDownThickIcon,
        action: () => downloadFile(contextMenuFile.value!),
      });

      items.push({ divider: true });

      if (!isReadOnly.value) {
        items.push({
          label: "Rename File",
          icon: pencilIcon,
          action: () => openRenameDialog(contextMenuFile.value!),
        });
        items.push({
          label: "Delete File",
          icon: deleteIcon,
          danger: true,
          action: () => openDeleteDialog(contextMenuFile.value!),
        });

        items.push({ divider: true });

        items.push({
          label: "New Folder",
          icon: folderPlusIcon,
          action: () => (createFolderDialogVisible.value = true),
        });
      }
    }
  } else if (selectedContainer.value) {
    if (!isReadOnly.value) {
      items.push({
        label: "New Folder",
        icon: folderPlusIcon,
        action: () => (createFolderDialogVisible.value = true),
      });
    }
    items.push({
      label: "Refresh",
      icon: refreshIcon,
      action: () => refreshFiles(),
    });
  }

  return items;
});

function sanitizeContainerName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "").substring(0, 128);
}

function sanitizeMountIndex(index: unknown): number | null {
  if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
    return null;
  }
  return index;
}

onMounted(async () => {
  fileViewerPrefs.load();
  await loadContainers();

  if (props.containerName) {
    const sanitizedName = sanitizeContainerName(props.containerName);
    if (sanitizedName) {
      const containerExists = containers.value.some((c) => c.name === sanitizedName);
      if (containerExists) {
        selectedContainer.value = sanitizedName;
        await handleContainerChange(sanitizedName);

        const sanitizedIndex = sanitizeMountIndex(props.mountIndex);
        if (sanitizedIndex !== null && sanitizedIndex < mounts.value.length) {
          selectedMountIndex.value = sanitizedIndex;
          await loadFiles();
        }
      }
    }
  }

  nextTick(() => {
    updateContainerWidth();
    setupResizeObserver();
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

watch(viewMode, () => {
  nextTick(() => {
    updateContainerWidth();
  });
});

watch(
  () => desktopStore.dockerApps.length,
  () => {
    loadContainers();
  }
);

function updateContainerWidth() {
  if (containerRef.value) {
    const newWidth = containerRef.value.clientWidth;
    const newCols = Math.max(1, Math.floor(newWidth / MIN_GRID_SIZE_X));

    if (stableGridCols.value === 0) {
      stableGridCols.value = newCols;
      containerWidth.value = newWidth;
    } else if (newCols !== stableGridCols.value) {
      const widthDiff = Math.abs(newWidth - containerWidth.value);
      if (widthDiff > 20) {
        stableGridCols.value = newCols;
        containerWidth.value = newWidth;
      }
    }
  }
}

function setupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newCols = Math.max(1, Math.floor(newWidth / MIN_GRID_SIZE_X));

        // Stabilize columns: only update if columns actually change significantly
        if (stableGridCols.value === 0) {
          stableGridCols.value = newCols;
          containerWidth.value = newWidth;
        } else if (newCols !== stableGridCols.value) {
          const widthDiff = Math.abs(newWidth - containerWidth.value);
          if (widthDiff > 20) {
            stableGridCols.value = newCols;
            containerWidth.value = newWidth;
          }
        }
      }
    });
    resizeObserver.observe(containerRef.value);
  }
}

async function loadContainers() {
  isLoadingContainers.value = true;
  try {
    const response = await axios.get("/api/appdrive/containers", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    containers.value = response.data.containers || [];
  } catch (error: any) {
    message.error("Failed to load containers");
  } finally {
    isLoadingContainers.value = false;
  }
}

function selectContainer(containerName: string) {
  selectedContainer.value = containerName;
  handleContainerChange(containerName);
}

async function handleContainerChange(containerName: string) {
  selectedMountIndex.value = 0;
  currentPath.value = "";

  if (!containerName) {
    files.value = [];
    mounts.value = [];
    return;
  }

  try {
    const response = await axios.get("/api/appdrive/mounts", {
      params: { container: containerName },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });
    mounts.value = response.data.mounts || [];

    if (mounts.value.length > 0) {
      await loadFiles();
    } else {
      files.value = [];
    }
  } catch (error: any) {
    files.value = [];
    mounts.value = [];
    message.error(error.response?.data?.error || "Failed to load mounts");
  }
}

async function handleMountChange() {
  currentPath.value = "";
  await loadFiles();
}

async function loadFiles(path: string = "") {
  if (!selectedContainer.value || mounts.value.length === 0) return;

  selectedFile.value = "";
  selectedFiles.value.clear();

  const currentRequestId = ++loadFilesRequestId;
  isLoading.value = true;

  try {
    const response = await axios.get("/api/appdrive/files", {
      params: {
        container: selectedContainer.value,
        mount: selectedMountIndex.value,
        path: path,
      },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (currentRequestId !== loadFilesRequestId) {
      return;
    }

    files.value = response.data.files || [];
    currentPath.value = path;
  } catch (error: any) {
    if (currentRequestId !== loadFilesRequestId) {
      return;
    }
    message.error(error.response?.data?.error || "Failed to load files");
  } finally {
    if (currentRequestId === loadFilesRequestId) {
      isLoading.value = false;
    }
  }
}

async function refreshFiles() {
  await loadFiles(currentPath.value);
}

const DOUBLE_CLICK_DELAY = 300;
let clickTimeout: ReturnType<typeof setTimeout> | null = null;
let lastClickedFile: string | null = null;

const LONG_PRESS_DURATION = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;
const DOUBLE_TAP_THRESHOLD = 300;
const DOUBLE_TAP_DISTANCE = 30;

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressStartX = 0;
let longPressStartY = 0;
let currentTouchFile: FileEntry | null = null;
let hasMoved = false;
let isLongPressing = false;
let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
let backButtonTouching = false;
let backButtonHasMoved = false;

let containerLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let containerTouchStartX = 0;
let containerTouchStartY = 0;
let containerHasMoved = false;

function handleFileClick(file: FileEntry, e?: MouseEvent | TouchEvent) {
  if (wasDragSelection) return;

  if (lastClickedFile === file.name && clickTimeout) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
    lastClickedFile = null;
    handleFileDoubleClick(file);
  } else {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
    }
    lastClickedFile = file.name;

    const isCtrlPressed = (e as MouseEvent)?.ctrlKey || (e as MouseEvent)?.metaKey;

    if (isCtrlPressed) {
      if (selectedFiles.value.has(file.name)) {
        selectedFiles.value.delete(file.name);
      } else {
        selectedFiles.value.add(file.name);
      }
      selectedFile.value = "";
    } else {
      selectedFiles.value.clear();
      selectedFile.value = file.name;
    }

    clickTimeout = setTimeout(() => {
      clickTimeout = null;
      lastClickedFile = null;
    }, DOUBLE_CLICK_DELAY);
  }
}

function handleFileDoubleClick(file: FileEntry) {
  if (file.is_directory) {
    loadFiles(file.name);
  } else {
    downloadFile(file);
  }
}

function handleBackClick() {
  if (clickTimeout) {
    clearTimeout(clickTimeout);
    clickTimeout = null;
  }
  if (lastClickedFile === "..") {
    lastClickedFile = null;
    navigateUp();
  } else {
    lastClickedFile = "..";
    clickTimeout = setTimeout(() => {
      clickTimeout = null;
      lastClickedFile = null;
    }, DOUBLE_CLICK_DELAY);
  }
}

function navigateUp() {
  if (!currentPath.value) return;
  const parts = currentPath.value.split("/");
  parts.pop();
  const newPath = parts.join("/");
  loadFiles(newPath);
}

function navigateToRoot() {
  loadFiles("");
}

function navigateToPathIndex(index: number) {
  const parts = pathParts.value.slice(0, index + 1);
  const newPath = parts.join("/");
  loadFiles(newPath);
}

function handleFileTouchStart(file: FileEntry, event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;

  currentTouchFile = file;
  hasMoved = false;
  isLongPressing = false;

  longPressStartX = touch.clientX;
  longPressStartY = touch.clientY;

  if (file.name !== "__back__") {
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
}

function handleFileTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;

  const distance = Math.sqrt(Math.pow(touch.clientX - longPressStartX, 2) + Math.pow(touch.clientY - longPressStartY, 2));

  if (distance > LONG_PRESS_MOVE_THRESHOLD) {
    hasMoved = true;
    backButtonHasMoved = true; // Also track for back button
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
      if (file.name === "__back__") {
        navigateUp();
      } else {
        handleFileDoubleClick(file);
      }
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

function handleBackTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  if (!touch) return;

  backButtonTouching = true;
  backButtonHasMoved = false;
  longPressStartX = touch.clientX;
  longPressStartY = touch.clientY;
}

function handleBackTouchEnd(event: TouchEvent) {
  if (!backButtonTouching || backButtonHasMoved) {
    backButtonTouching = false;
    backButtonHasMoved = false;
    return;
  }

  const now = Date.now();
  const touch = event.changedTouches[0];
  if (!touch) {
    backButtonTouching = false;
    return;
  }

  const timeSinceLastTap = now - lastTapTime;
  const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

  if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
    event.preventDefault();
    navigateUp();
    lastTapTime = 0;
    lastTapX = 0;
    lastTapY = 0;
  } else {
    lastTapTime = now;
    lastTapX = touch.clientX;
    lastTapY = touch.clientY;
  }

  backButtonTouching = false;
}

function handleContainerTouchStart(event: TouchEvent) {
  const target = event.target as HTMLElement;
  const isFileItem = target.closest(".appdrive-file-item");
  if (isFileItem) return;

  const isControl = target.closest(".appdrive-controls-container");
  if (isControl) return;

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
    selectedFile.value = "";
    selectedFiles.value.clear();
  }

  containerHasMoved = false;
}

async function downloadFile(file: FileEntry) {
  try {
    downloadProgresses.value[file.name] = 0;

    if (file.is_directory) {
      compressingFolders.value.add(file.name);
    }

    const response = await axios.get("/api/appdrive/download", {
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

    if (file.is_directory) {
      compressingFolders.value.delete(file.name);
    }

    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.is_directory ? `${file.display_name}.zip` : file.display_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      delete downloadProgresses.value[file.name];
    }, 1000);
  } catch (error: any) {
    if (file.is_directory) {
      compressingFolders.value.delete(file.name);
      message.error("Failed to download folder as ZIP");
    } else {
      message.error("Failed to download file");
    }
    delete downloadProgresses.value[file.name];
  }
}

const isCompressingMultiple = ref(false);

async function downloadMultipleAsZip(fileNames: string[]) {
  if (fileNames.length === 0) return;

  try {
    isCompressingMultiple.value = true;

    fileNames.forEach((name) => {
      const file = files.value.find((f) => f.name === name);
      if (file?.is_directory) {
        compressingFolders.value.add(name);
      }
    });

    const response = await axios.post(
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

    const contentDisposition = response.headers["content-disposition"];
    let filename = "download.zip";
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1].replace(/[<>:"/\\|?*]/g, "_");
    }

    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`Downloaded ${fileNames.length} items as ZIP`);
  } catch (error: any) {
    message.error("Failed to download files as ZIP");
  } finally {
    isCompressingMultiple.value = false;
    fileNames.forEach((name) => {
      compressingFolders.value.delete(name);
    });
  }
}

async function uploadFile(file: File, onProgress?: (event: { percent: number }) => void, targetPath?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("container", selectedContainer.value!);
  formData.append("mount", String(selectedMountIndex.value));

  if (targetPath) {
    formData.append("path", targetPath);
  }

  try {
    const response = await axios.post("/api/appdrive/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);

          const uploadFileTyped = file as unknown as UploadFile;
          uploadStore.updateProgress(uploadFileTyped.uid, percent);

          if (onProgress) {
            onProgress({ percent });
          }
        }
      },
    });

    if (!response.data.success) {
      message.error(response.data.error || "Upload failed");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 413) {
        message.error("The selected file is larger than the maximum allowed size.");
      } else {
        message.error(error.response?.data?.error || `Unexpected error occurred: ${error.message}`);
      }
    } else {
      message.error("An unknown error occurred. Please try again.");
    }
    throw error;
  }
}

async function processQueue() {
  if (isProcessingQueue) return;

  isProcessingQueue = true;

  try {
    while (activeUploads.value < maxConcurrent && uploadQueue.value.length > 0) {
      const nextUpload = uploadQueue.value.shift();
      if (!nextUpload) break;

      activeUploads.value++;

      uploadStore.startUpload({
        uid: nextUpload.file.uid,
        name: nextUpload.file.name,
        size: nextUpload.file.size,
      });

      (async () => {
        try {
          await uploadFile(nextUpload.file as unknown as File, nextUpload.onProgress, nextUpload.path);
          fileList.value = fileList.value.filter((f: any) => f.uid !== nextUpload.file.uid);

          uploadStore.completeUpload(nextUpload.file.uid);

          if (nextUpload.onSuccess) nextUpload.onSuccess(null, nextUpload.file);
        } catch (error) {
          uploadStore.cancelUpload(nextUpload.file.uid);

          if (nextUpload.onError) nextUpload.onError(error);
        } finally {
          activeUploads.value--;

          processQueue();
        }
      })();
    }
  } finally {
    isProcessingQueue = false;
  }

  if (activeUploads.value === 0 && uploadQueue.value.length === 0) {
    await loadFiles(currentPath.value);
  }
}

function customUpload({ file, onSuccess, onError, onProgress }: any) {
  const uploadFileTyped = file as UploadFile;

  uploadStore.addToQueue({
    uid: uploadFileTyped.uid,
    name: uploadFileTyped.name,
    size: uploadFileTyped.size,
  });

  uploadQueue.value.push({
    file: uploadFileTyped,
    onProgress,
    onSuccess,
    onError,
    path: currentPath.value,
  });
  processQueue();
}

function handleUploadChange(_info: any) {
  fileList.value = [];
}

function handleDragEnter(e: DragEvent) {
  if (isReadOnly.value) return;
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

function isHidden(name: string): boolean {
  return name.startsWith(".");
}

function showStatus(message: string, duration: number = 0) {
  uploadStatusMessage.value = message;
  showUploadStatus.value = true;

  if (duration > 0) {
    setTimeout(() => {
      showUploadStatus.value = false;
    }, duration);
  }
}

function hideStatus() {
  showUploadStatus.value = false;
}

async function readDirectoryRecursively(entry: FileSystemDirectoryEntry, basePath: string = ""): Promise<Array<{ file: File; relativePath: string }>> {
  const results: Array<{ file: File; relativePath: string }> = [];

  return new Promise((resolve, reject) => {
    const dirReader = entry.createReader();
    const readEntries = () => {
      dirReader.readEntries(
        async (entries) => {
          if (entries.length === 0) {
            resolve(results);
            return;
          }

          for (const entry of entries) {
            if (isHidden(entry.name)) {
              continue;
            }

            const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

            if (entry.isFile) {
              const fileEntry = entry as FileSystemFileEntry;
              const file = await new Promise<File>((resolve, reject) => {
                fileEntry.file(resolve, reject);
              });

              results.push({ file, relativePath: basePath });
            } else if (entry.isDirectory) {
              const dirEntry = entry as FileSystemDirectoryEntry;
              const subResults = await readDirectoryRecursively(dirEntry, entryPath);
              results.push(...subResults);
            }
          }

          readEntries();
        },
        (error) => {
          reject(error);
        }
      );
    };

    readEntries();
  });
}

function extractUniqueFolders(files: Array<{ file: File; relativePath: string }>): string[] {
  const folders = new Set<string>();

  files.forEach(({ relativePath }) => {
    if (relativePath) {
      const parts = relativePath.split("/");
      let currentPath = "";

      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        folders.add(currentPath);
      }
    }
  });

  const sortedFolders = Array.from(folders).sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return a.localeCompare(b);
  });

  return sortedFolders;
}

async function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  dragCounter.value = 0;
  isDraggingFiles.value = false;

  if (isReadOnly.value || !selectedContainer.value) return;

  if (!e.dataTransfer) return;

  showStatus("Scanning dropped items...");

  const allFiles: Array<{ file: File; relativePath: string }> = [];

  if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    const entries: Array<FileSystemEntry> = [];
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      const item = e.dataTransfer.items[i];
      if (item.kind === "file") {
        const entry = item.webkitGetAsEntry();
        if (entry && !isHidden(entry.name)) {
          entries.push(entry);
        }
      }
    }

    for (const entry of entries) {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) => {
          fileEntry.file(resolve, reject);
        });
        allFiles.push({ file, relativePath: "" });
      } else if (entry.isDirectory) {
        showStatus("Processing folders structure...");

        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirFiles = await readDirectoryRecursively(dirEntry, dirEntry.name);
        allFiles.push(...dirFiles);
      }
    }
  } else {
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      if (!isHidden(file.name)) {
        allFiles.push({ file, relativePath: "" });
      }
    }
  }

  if (allFiles.length === 0) {
    hideStatus();
    return;
  }

  const folders = extractUniqueFolders(allFiles);

  if (folders.length > 0) {
    pendingUploadData.value = { allFiles, folders };
    folderUploadWarningVisible.value = true;
    hideStatus();
    return;
  }

  await processUpload(allFiles);
}

async function processUpload(allFiles: Array<{ file: File; relativePath: string }>) {
  showStatus(`Enqueueing ${allFiles.length} ${allFiles.length === 1 ? "file" : "files"} for upload...`);

  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 50));

  const baseTimestamp = Date.now();
  const chunkSize = 20;

  for (let i = 0; i < allFiles.length; i += chunkSize) {
    const chunk = allFiles.slice(i, i + chunkSize);

    for (let j = 0; j < chunk.length; j++) {
      const { file, relativePath } = chunk[j];
      const fileIndex = i + j;

      const uid = `${baseTimestamp}-${fileIndex}-${Math.random().toString(36).substring(2, 11)}-${file.name}`;

      const uploadFileItem = file as unknown as UploadFile;
      uploadFileItem.uid = uid;

      const targetPath = relativePath ? (currentPath.value ? `${currentPath.value}/${relativePath}` : relativePath) : currentPath.value;

      const displayName = relativePath ? `${relativePath}/${file.name}` : file.name;

      uploadStore.addToQueue({
        uid: uploadFileItem.uid,
        name: displayName,
        size: uploadFileItem.size,
      });

      uploadQueue.value.push({
        file: uploadFileItem,
        path: targetPath,
        onProgress: undefined,
        onSuccess: undefined,
        onError: undefined,
      });
    }

    if (i + chunkSize < allFiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  showStatus("Starting upload...", 2000);

  await nextTick();
  processQueue();
}

async function confirmFolderUpload() {
  if (!pendingUploadData.value) return;

  folderUploadWarningVisible.value = false;
  const { allFiles } = pendingUploadData.value;
  pendingUploadData.value = null;

  await processUpload(allFiles);
}

function cancelFolderUpload() {
  folderUploadWarningVisible.value = false;
  pendingUploadData.value = null;
}

function handleContainerMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement;

  const isControl = target.closest(".appdrive-controls-container");
  if (isControl) return;

  if (files.value.length === 0 && !currentPath.value) return;

  if (e.button !== 0) return;

  const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
  if (!rect) return;

  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  dragStartPoint.value = { x: startX, y: startY };

  const isFileItem = target.closest(".appdrive-file-item");

  if (!isFileItem) {
    isSelectingArea.value = true;
    selectionBox.value.startX = startX;
    selectionBox.value.startY = startY;
    selectionBox.value.currentX = startX;
    selectionBox.value.currentY = startY;

    selectedFile.value = "";
    selectedFiles.value.clear();
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
}

function handleMouseMove(e: MouseEvent) {
  const container = containerRef.value;
  const rect = container?.getBoundingClientRect();
  if (!rect) return;

  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;

  mouseX = Math.max(0, Math.min(mouseX, rect.width));
  mouseY = Math.max(0, Math.min(mouseY, rect.height));

  if (!isSelectingArea.value && dragStartPoint.value) {
    const distance = Math.sqrt(Math.pow(mouseX - dragStartPoint.value.x, 2) + Math.pow(mouseY - dragStartPoint.value.y, 2));

    if (distance > DRAG_SELECTION_THRESHOLD) {
      isSelectingArea.value = true;
      selectionBox.value.startX = dragStartPoint.value.x;
      selectionBox.value.startY = dragStartPoint.value.y;
      selectedFile.value = "";
      selectedFiles.value.clear();
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
    selectedFile.value = "";
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
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
}

function updateSelectedFilesInBox() {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedFiles.value.clear();

  const container = containerRef.value;
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) return;

  document.querySelectorAll(".appdrive-file-item").forEach((element) => {
    const rect = element.getBoundingClientRect();

    const iconLeft = rect.left - containerRect.left;
    const iconTop = rect.top - containerRect.top;
    const iconRight = iconLeft + rect.width;
    const iconBottom = iconTop + rect.height;

    const boxRight = boxX + boxWidth;
    const boxBottom = boxY + boxHeight;

    const intersects = boxX < iconRight && boxRight > iconLeft && boxY < iconBottom && boxBottom > iconTop;

    if (intersects) {
      const fileName = element.getAttribute("data-filename");
      if (fileName) selectedFiles.value.add(fileName);
    }
  });
}

function showContextMenu(e: MouseEvent, file: FileEntry | null) {
  e.preventDefault();

  if (!selectedContainer.value) {
    return;
  }

  if (file && !selectedFiles.value.has(file.name)) {
    selectedFile.value = file.name;
    selectedFiles.value.clear();
  } else if (!file) {
    selectedFile.value = "";
    selectedFiles.value.clear();
  }

  contextMenuFile.value = file;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;
}

function closeContextMenu() {
  contextMenuVisible.value = false;
  contextMenuFile.value = null;
}

function openDeleteDialog(file: FileEntry) {
  fileToDelete.value = file;
  deleteDialogTitle.value = `Delete ${file.is_directory ? "Folder" : "File"}`;
  deleteDialogContent.value = `Are you sure you want to delete "${file.display_name}"?${file.is_directory ? " This will delete all contents." : ""}`;
  deleteDialogVisible.value = true;
}

async function confirmDelete() {
  if (!fileToDelete.value && selectedFiles.value.size > 0) {
    const selectedFilesList = Array.from(selectedFiles.value);
    let successCount = 0;
    let errorCount = 0;

    for (const fileName of selectedFilesList) {
      try {
        await axios.post(
          "/api/appdrive/delete",
          {
            container: selectedContainer.value,
            mount: selectedMountIndex.value,
            file: fileName,
          },
          {
            headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          }
        );
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
    await loadFiles(currentPath.value);
    deleteDialogVisible.value = false;
    return;
  }

  if (!fileToDelete.value) return;

  try {
    await axios.post(
      "/api/appdrive/delete",
      {
        container: selectedContainer.value,
        mount: selectedMountIndex.value,
        file: fileToDelete.value.name,
      },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      }
    );
    message.success(`Deleted ${fileToDelete.value.display_name}`);
    await loadFiles(currentPath.value);
  } catch (error: any) {
    message.error(error.response?.data?.error || "Failed to delete");
  } finally {
    deleteDialogVisible.value = false;
    fileToDelete.value = null;
  }
}

async function createFolder() {
  if (!newFolderName.value.trim()) {
    message.error("Please enter a folder name");
    return;
  }

  try {
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
    newFolderName.value = "";
    createFolderDialogVisible.value = false;
    await loadFiles(currentPath.value);
  } catch (error: any) {
    message.error(error.response?.data?.error || "Failed to create folder");
  }
}

function openRenameDialog(file: FileEntry) {
  fileToRename.value = file;
  renameValue.value = file.display_name;
  renameDialogVisible.value = true;
}

async function performRename() {
  if (!fileToRename.value || !renameValue.value.trim()) {
    message.error("Please enter a new name");
    return;
  }

  try {
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
    renameDialogVisible.value = false;
    fileToRename.value = null;
    renameValue.value = "";
    await loadFiles(currentPath.value);
  } catch (error: any) {
    message.error(error.response?.data?.error || "Failed to rename");
  }
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
}

function toggleViewMode() {
  viewMode.value = viewMode.value === "grid" ? "list" : "grid";
}

function fileIcon(file: FileEntry) {
  if (file.is_directory) return folderIcon;

  const ext = file.display_name.split(".").pop()?.toLowerCase() || "";

  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"];
  const videoExts = ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm"];
  const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"];
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2", "xz"];
  const codeExts = ["js", "ts", "py", "java", "c", "cpp", "h", "go", "rs", "rb", "php", "html", "css", "scss", "vue", "jsx", "tsx", "json", "xml", "yaml", "yml", "sh", "bash", "sql"];
  const docExts = ["doc", "docx"];
  const excelExts = ["xls", "xlsx", "csv"];
  const pptExts = ["ppt", "pptx"];
  const textExts = ["txt", "md", "log", "ini", "conf", "cfg"];

  if (imageExts.includes(ext)) return imageFileIcon;
  if (videoExts.includes(ext)) return videoFileIcon;
  if (audioExts.includes(ext)) return audioFileIcon;
  if (archiveExts.includes(ext)) return zipFileIcon;
  if (codeExts.includes(ext)) return codeFileIcon;
  if (docExts.includes(ext)) return wordFileIcon;
  if (excelExts.includes(ext)) return excelFileIcon;
  if (pptExts.includes(ext)) return powerpointFileIcon;
  if (textExts.includes(ext)) return textFileIcon;

  return unknownFileIcon;
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
  const sizes = ["B", "K", "M", "G", "T"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

function getRelativeTime(file: FileEntry): string {
  const now = Date.now() / 1000;
  const diff = now - file.modified;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return "";
}
</script>

<style scoped>
.dragger-fade-enter-active,
.dragger-fade-leave-active {
  transition: opacity 0.2s ease;
}
.dragger-fade-enter-from,
.dragger-fade-leave-to {
  opacity: 0;
}

/* View mode transition (Grid <-> List) */
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

/* List view transition fade only */
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

/* Container icon transitions */
.container-icon-enter-active,
.container-icon-leave-active {
  transition: all 0.3s ease;
}
.container-icon-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.container-icon-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
.container-icon-move {
  transition: transform 0.3s ease;
}

/* File item transitions - Grid View */
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

/* File item transitions - List View */
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

/* View mode container */
.view-mode-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
}

/* Icons container */
.appdrive-icons-container {
  position: relative;
  width: 100%;
  user-select: none;
}

.appdrive-list-container {
  min-height: 100px;
  padding: 4px 0;
}

/* Fix vertical alignment for container and mount select */
.appdrive-container-select :deep(.ant-select-selection-item),
.appdrive-mount-select :deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
}

/* Fix placeholder color to inherit from theme */
.appdrive-container-select :deep(.ant-select-selection-placeholder),
.appdrive-mount-select :deep(.ant-select-selection-placeholder) {
  color: inherit;
  opacity: 0.5;
}

@container window (max-width: 500px) {
  .appdrive-list-container .list-view-size {
    display: none;
  }
}

@container window (max-width: 350px) {
  .appdrive-list-container .list-view-time {
    display: none;
  }
}

/* Breadcrumb slide transition */
.breadcrumb-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.breadcrumb-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 1, 1);
}

.breadcrumb-slide-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.breadcrumb-slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}

.breadcrumb-slide-enter-to,
.breadcrumb-slide-leave-from {
  max-height: 32px;
}

.upload-slide-up-enter-active,
.upload-slide-up-leave-active {
  transition: all 0.3s ease;
}
.upload-slide-up-enter-from,
.upload-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.expand-height-enter-active,
.expand-height-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.expand-height-enter-from,
.expand-height-leave-to {
  max-height: 0;
  opacity: 0;
}
.expand-height-enter-to,
.expand-height-leave-from {
  max-height: 300px;
  opacity: 1;
}
</style>

<style>
/* Global styles for dropdowns (rendered in portal) */
.appdrive-container-dropdown .ant-select-item-option-content,
.appdrive-mount-dropdown .ant-select-item-option-content {
  display: flex;
  align-items: center;
}
</style>
