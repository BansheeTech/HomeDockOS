<!-- homedock-ui/vue3/static/js/__Apps__/AppDropzone.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-dropzone flex flex-col h-full overflow-hidden" @dragenter="handleDragEnter" @dragleave="handleDragLeave" @dragover.prevent @drop.prevent.stop="handleDrop">
    <transition name="dragger-fade">
      <div v-if="isDraggingFiles" class="absolute inset-0 z-[9999] pointer-events-none backdrop-blur-sm">
        <div :class="[themeClasses.scopeSelector, themeClasses.dropZoneDragHolder]" class="fullscreen-dragger h-full border-2 border-dashed rounded-lg flex items-center justify-center">
          <div class="flex items-center align-center justify-center flex-col h-full">
            <p class="ant-upload-drag-icon">
              <AnimatedIcon :icons="[cubeIcon, shieldLockIcon]" :iconSize="64" :interval="2000" :class="[themeClasses.dropZoneDragIcon]" class="text-5xl" />
            </p>
            <p :class="[themeClasses.dropZoneDragUpText]" class="px-4 text-balance text-center text-lg font-semibold mt-4">Drop files or folders to upload and encrypt</p>
            <p :class="[themeClasses.dropZoneDragDownText]" class="px-4 text-balance text-center text-sm mt-2">Folders will maintain their structure.</p>
            <p :class="[themeClasses.dropZoneDragDownText]" class="px-4 text-balance text-center text-sm mt-1">Hidden files (.*) are automatically filtered.</p>
          </div>
        </div>
      </div>
    </transition>

    <div class="flex-1 flex flex-col overflow-auto px-4 pt-2 pb-5">
      <div class="mt-2 flex flex-col flex-1 gap-2">
        <div class="dropzone-controls-container flex flex-col gap-2 items-start justify-between flex-shrink-0">
          <div class="dropzone-search-wrapper flex-1 min-w-0 w-full">
            <AutoComplete v-model:value="searchQuery" :options="filteredFiles" :popup-class-name="`${themeClasses.scopeSelector}`" class="w-full">
              <template #option="{ label, isDirectory, fileName }">
                <div class="flex items-center gap-2">
                  <Icon :icon="isDirectory ? folderIcon : fileIcon({ name: fileName, is_directory: false, size: 0, modified: 0 })" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                  <span class="truncate">{{ label }}</span>
                </div>
              </template>
              <InputSearch v-model:value="searchQuery" placeholder="Search files..." class="w-full text-sm" enter-button="Search">
                <template #prefix>
                  <Icon v-if="isSearching" :icon="loadingIcon" :class="[themeClasses.dropZoneInputIcon, 'animate-spin']" class="mx-1" />
                  <Icon v-else :icon="cubeIcon" :class="[themeClasses.dropZoneInputIcon]" class="mx-1" />
                </template>
              </InputSearch>
            </AutoComplete>
          </div>

          <div class="dropzone-actions-wrapper flex items-center gap-2 mt-0.5 w-full">
            <Select v-model:value="sortBy" :class="[themeClasses.scopeSelector, themeClasses.dropZoneSortSelect]" class="dropzone-sort-select h-8 flex-1 rounded-md min-w-[140px] transition duration-150" :popup-class-name="`${themeClasses.scopeSelector}`" :show-search="false">
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
          </div>
        </div>

        <div class="flex items-center justify-start text-[10px] gap-2 flex-shrink-0">
          <span :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5">
            {{ displayedFiles.length }} {{ displayedFiles.length === 1 ? "file" : "files" }}
            <span v-if="searchQuery && searchQuery.trim().length >= 2" class="ml-0.5">(global search)</span>
          </span>
          <span v-if="totalSize !== '0 B' && files.length > 0" :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-full px-2 py-0.5"> {{ totalSize }} total </span>
        </div>

        <div ref="containerRef" class="view-mode-container" @mousedown="handleContainerMouseDown" @contextmenu="showContextMenu($event, null)" @touchstart="handleContainerTouchStart" @touchmove="handleContainerTouchMove" @touchend="handleContainerTouchEnd" @touchcancel="handleContainerTouchEnd">
          <div v-if="displayedFiles.length === 0 && !currentPath" class="flex justify-center items-center text-balance px-2 py-8">
            <Empty :class="[themeClasses.dropZoneEmptyText]" :description="searchQuery && searchQuery.trim().length >= 2 ? 'No files found matching your search across all folders' : 'Drag and drop your files here to store and encrypt them'" />
          </div>

          <transition :name="viewMode === 'grid' ? 'view-mode-fade' : 'list-view-fade'" mode="out-in">
            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" :key="'grid-view'" class="dropzone-icons-container relative w-full select-none" :style="{ height: `${containerHeight}px` }">
              <SelectionBox :visible="isSelectingArea" :style="selectionBoxStyle" />

              <TransitionGroup name="file-item">
                <template v-for="file in positionedFiles" :key="file.name">
                  <div v-if="file.isHeader" :class="[themeClasses.dropZoneTotalSizeScope]" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px`, width: 'calc(100% - 16px)' }" class="flex items-center gap-2 px-3 py-1.5 rounded-md">
                    <Icon :icon="folderIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                    <span class="text-[10px] font-semibold truncate">
                      {{ file.headerText }}
                    </span>
                    <span class="text-[9px] opacity-60 ml-auto"> {{ groupedFilesByFolder.find((g) => (g.folder === "" ? "Homepath" : g.folder) === file.headerText)?.files.length || 0 }} items </span>
                  </div>

                  <div v-else :data-filename="file.name" :class="['group flex flex-col items-center gap-1 cursor-pointer p-2 rounded-lg', 'transition-[background,transform,border,box-shadow] duration-[150ms,200ms,0ms,0ms]', 'w-[100px] h-[120px] z-[1] touch-manipulation select-none outline-none border dropzone-file-item', !(selectedFile === file.name || selectedFiles.has(file.name)) && ['border-transparent', 'shadow-[0_0_0_1px_transparent]', themeClasses.desktopIconBg || 'hover:bg-white/5'], (selectedFile === file.name || selectedFiles.has(file.name)) && [themeClasses.desktopIconBgSelected || 'bg-blue-500/20', themeClasses.desktopIconBorderSelected || 'border-blue-500', themeClasses.desktopIconShadowSelected || 'shadow-[0_0_0_1px_rgba(59,130,246,0.5)]']]" :style="{ position: 'absolute', left: `${file.x}px`, top: `${file.y}px` }" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove($event)" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)">
                    <div :class="['relative w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-2xl', themeClasses.desktopIconContainerBg || 'bg-white/10', 'transition-transform duration-200', !(selectedFile === file.name || selectedFiles.has(file.name)) && (themeClasses.desktopIconContainerBgHover || 'hover:bg-white/20'), (selectedFile === file.name || selectedFiles.has(file.name)) && (themeClasses.desktopIconContainerBgSelected || 'bg-blue-500/30')]">
                      <div v-if="!file.is_directory && file.size > 0" :class="[themeClasses.dropZoneFileSize]" class="absolute -left-1 -top-1 text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap z-10">
                        {{ formatSizeCompact(file.size) }}
                      </div>

                      <div v-if="getRelativeTime(file)" class="absolute -left-1 -bottom-1 flex items-center gap-0.5 z-10">
                        <div v-if="isNewFile(file)" class="w-1.5 h-1.5 bg-green-500 rounded-full ring-1 ring-black/30"></div>
                        <div :class="[themeClasses.dropZoneFileSize]" class="text-[8px] font-medium px-1 py-0.5 rounded whitespace-nowrap">
                          {{ getRelativeTime(file) }}
                        </div>
                      </div>

                      <div v-if="!file.is_directory" class="absolute -right-1 -top-1 flex items-center gap-0.5">
                        <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 animate-spin h-3 w-3" />
                        <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="transition duration-300 h-3 w-3" />
                      </div>

                      <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute -right-1 -top-1 z-20">
                        <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4" />
                      </div>

                      <Icon :icon="fileIcon(file)" :class="[themeClasses.dropZoneFileIcon, file.is_directory && compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-10 w-10 transition duration-300 group-hover:scale-110" />

                      <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center z-10">
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
                </template>
              </TransitionGroup>
            </div>

            <!-- List View -->
            <div v-else :key="`list-view-${currentPath}`" class="dropzone-list-container w-full select-none">
              <SelectionBox :visible="isSelectingArea" :style="selectionBoxStyle" />

              <template v-if="isSearchMode">
                <template v-for="group in groupedFilesByFolder" :key="group.folder">
                  <div :class="[themeClasses.dropZoneTotalSizeScope]" class="flex items-center gap-2 px-2 py-1.5 mt-2 mb-1 rounded-md sticky top-0 z-10">
                    <Icon :icon="folderIcon" :class="[themeClasses.dropZoneFileIcon]" class="w-4 h-4 flex-shrink-0" />
                    <span class="text-[10px] font-semibold truncate">
                      {{ group.folder === "" ? "Homepath" : group.folder }}
                    </span>
                    <span class="text-[9px] opacity-60 ml-auto"> {{ group.files.length }} {{ group.files.length === 1 ? "item" : "items" }} </span>
                  </div>

                  <TransitionGroup name="file-item-list">
                    <div v-for="file in group.files" :key="file.name" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors dropzone-file-item overflow-hidden ml-4', !(selectedFile === file.name || selectedFiles.has(file.name)) && [themeClasses.desktopIconBg || 'hover:bg-white/5'], (selectedFile === file.name || selectedFiles.has(file.name)) && [themeClasses.desktopIconBgSelected || 'bg-blue-500/20']]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove($event)" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)">
                      <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                      <div class="relative flex-shrink-0 z-[1]">
                        <div :class="['relative w-6 h-6 flex items-center justify-center']">
                          <div v-if="isNewFile(file)" class="absolute -left-1 -top-1 w-1.5 h-1.5 bg-green-500 rounded-full z-10 ring-1 ring-black/30"></div>

                          <Icon :icon="fileIcon(file)" :class="[themeClasses.dropZoneFileIcon, file.is_directory && compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />

                          <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                            <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                          </div>
                          <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute -right-1.5 -top-1">
                            <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-3 w-3" />
                          </div>

                          <div v-if="!file.is_directory" class="absolute -right-1 -bottom-1">
                            <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-2 w-2" />
                            <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-2 w-2" />
                          </div>
                        </div>
                      </div>

                      <div class="flex-1 overflow-hidden z-[1]">
                        <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.name">
                          {{ file.name.split("/").pop() }}
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
                </template>
              </template>

              <TransitionGroup v-else name="file-item-list">
                <div v-for="file in sortedFiles" :key="file.name" :data-filename="file.name" :class="['group relative flex items-center gap-3 cursor-pointer px-2 py-1.5 rounded transition-colors dropzone-file-item overflow-hidden', !(selectedFile === file.name || selectedFiles.has(file.name)) && [themeClasses.desktopIconBg || 'hover:bg-white/5'], (selectedFile === file.name || selectedFiles.has(file.name)) && [themeClasses.desktopIconBgSelected || 'bg-blue-500/20']]" @click="handleFileClick(file, $event)" @dblclick="handleFileDoubleClick(file)" @contextmenu.stop="showContextMenu($event, file)" @touchstart="handleFileTouchStart(file, $event)" @touchmove="handleFileTouchMove($event)" @touchend="handleFileTouchEnd(file, $event)" @touchcancel="handleFileTouchEnd(file, $event)">
                  <div v-if="downloadProgresses[file.name] !== undefined && downloadProgresses[file.name] < 100" class="absolute inset-0 bg-blue-500/20 transition-all duration-300 ease-out" :style="{ width: `${downloadProgresses[file.name]}%` }" />

                  <div class="relative flex-shrink-0 z-[1]">
                    <div :class="['relative w-6 h-6 flex items-center justify-center']">
                      <div v-if="isNewFile(file)" class="absolute -left-1 -top-1 w-1.5 h-1.5 bg-green-500 rounded-full z-10 ring-1 ring-black/30"></div>

                      <Icon :icon="fileIcon(file)" :class="[themeClasses.dropZoneFileIcon, file.is_directory && compressingFolders.has(file.name) ? 'opacity-40' : '']" class="h-5 w-5" />

                      <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute inset-0 flex items-center justify-center">
                        <Icon :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-4 w-4 animate-spin" />
                      </div>
                      <div v-if="file.is_directory && compressingFolders.has(file.name)" class="absolute -right-1.5 -top-1">
                        <Icon :icon="zipFileIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-3 w-3" />
                      </div>

                      <div v-if="!file.is_directory" class="absolute -right-1 -bottom-1">
                        <Icon v-if="loadingStates[file.name]" :icon="loadingIcon" :class="[themeClasses.dropZoneLockIcon]" class="animate-spin h-2 w-2" />
                        <Icon v-else :icon="fileStates[file.name] ? lockOpenIcon : lockIcon" :class="[themeClasses.dropZoneLockIcon]" class="h-2 w-2" />
                      </div>
                    </div>
                  </div>

                  <div class="flex-1 overflow-hidden z-[1]">
                    <span :class="[themeClasses.dropZoneFileText]" class="text-xs truncate block" :title="file.display_name || file.name">
                      {{ file.name.split("/").pop() }}
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

    <AppDialog v-model:visible="deleteDialogVisible" type="confirm" :title="deleteDialogTitle" :content="deleteDialogContent" ok-text="Delete" cancel-text="Cancel" @ok="confirmDeleteFromDialog" @cancel="deleteDialogVisible = false" />

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

    <AppDialog v-model:visible="largeFolderWarningVisible" type="info" title="Folder Upload Detected" ok-text="Upload Folder" cancel-text="Cancel" @ok="confirmLargeFolderUpload" @cancel="cancelLargeFolderUpload" :icon="infoIcon" :width="480" :reverse-buttons="true">
      <div class="space-y-3">
        <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">
          You are about to upload <strong>{{ pendingUploadData?.allFiles.length || 0 }} files</strong> across <strong>{{ pendingUploadData?.folders.length || 0 }} directories</strong>. Each file will be encrypted individually, which can be resource-intensive for large folders.
        </p>

        <div :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-lg p-3.5 space-y-2.5">
          <p class="text-sm font-bold flex items-center gap-2">
            <Icon :icon="zipFileIcon" class="w-5 h-5" />
            <span>ZIP Before Uploading</span>
          </p>
          <p class="text-xs leading-relaxed">Cancel this upload and manually compress the folder to a ZIP file first. Then upload that single ZIP file instead:</p>
          <ul class="text-xs space-y-1.5 ml-4 list-disc">
            <li>
              Encrypt <strong>1 file</strong> instead of <strong>{{ pendingUploadData?.allFiles.length || 0 }} files</strong>
            </li>
            <li><strong>Much faster</strong> upload and encryption</li>
            <li><strong>Less resource intensive</strong> on the server</li>
            <li><strong>Easier</strong> to download and restore later</li>
          </ul>
        </div>
      </div>
    </AppDialog>

    <Upload v-model:fileList="fileList" name="file" :multiple="true" :customRequest="customUpload" @change="handleChange" :showUploadList="false" class="fixed bottom-10 right-2 z-50 hidden max-[900px]:block">
      <button :class="[themeClasses.dropZoneSortButton]" class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 active:scale-95 border-none cursor-pointer" title="Upload Files">
        <Icon :icon="cloudUploadIcon" class="w-6 h-6" />
      </button>
    </Upload>

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

    <!-- Upload Status Bubble -->
    <StatusBubble :visible="showUploadStatus" :message="uploadStatusMessage" position="bottom-left" />

    <StatusBar :icon="cubeIcon" :message="statusBarMessage" :info="statusBarInfo" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="cubeIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Drop Zone</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>Your personal encrypted cloud storage built into HomeDock OS. Every file you upload is automatically encrypted with military-grade AES-256-GCM encryption before being stored. Simply drag and drop your files. HomeDock OS encrypts and signs them instantly using your unique user key. Only you can decrypt and access your files.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { computed, onMounted, onUnmounted, ref, watch, nextTick } from "vue";

import { FileEntry } from "../__Types__/DropZoneFileEntry";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDropZoneUploadingStore } from "../__Stores__/useDropZoneUploadingStore";
import { useDropZoneStore } from "../__Stores__/useDropZoneStore";
import { useFileViewerPrefsStore } from "../__Stores__/useFileViewerPrefsStore";
import { storeToRefs } from "pinia";

import { message, Upload, AutoComplete, InputSearch, Empty, Progress, Select, SelectOption, Input } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import cubeIcon from "@iconify-icons/mdi/cube";
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
import infoIcon from "@iconify-icons/mdi/information-outline";
import wordFileIcon from "@iconify-icons/mdi/file-word";
import codeFileIcon from "@iconify-icons/mdi/file-code";
import unknownFileIcon from "@iconify-icons/mdi/file";
import arrowDownThickIcon from "@iconify-icons/mdi/arrow-down-thick";
import cloudUploadIcon from "@iconify-icons/mdi/cloud-upload";
import shieldLockIcon from "@iconify-icons/mdi/shield-lock";
import lockIcon from "@iconify-icons/mdi/lock";
import lockOpenIcon from "@iconify-icons/mdi/lock-open-alert";
import loadingIcon from "@iconify-icons/mdi/loading";
import sortAscIcon from "@iconify-icons/mdi/sort-ascending";
import sortDescIcon from "@iconify-icons/mdi/sort-descending";
import axisArrowIcon from "@iconify-icons/mdi/axis-arrow";
import pencilIcon from "@iconify-icons/mdi/pencil";
import deleteIcon from "@iconify-icons/mdi/delete";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import checkIcon from "@iconify-icons/mdi/check-circle";
import viewGridIcon from "@iconify-icons/mdi/view-grid";
import viewListIcon from "@iconify-icons/mdi/view-list";
import refreshIcon from "@iconify-icons/mdi/refresh";

import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import SelectionBox from "../__Components__/SelectionBox.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import ContextMenu from "../__Components__/ContextMenu.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import StatusBubble from "../__Components__/StatusBubble.vue";

interface UploadFile extends File {
  uid: string;
}

interface GroupedFiles {
  folder: string;
  files: FileEntry[];
}

interface PositionedFileEntry extends FileEntry {
  x: number;
  y: number;
  gridRow: number;
  gridCol: number;
  isHeader?: boolean;
  headerText?: string;
}

const csrfToken = useCsrfToken();
const { themeClasses } = useTheme();
const uploadStore = useDropZoneUploadingStore();
const dropZoneStore = useDropZoneStore();

const files = ref<FileEntry[]>([]);
const currentPath = ref<string>("");
const searchQuery = ref<string>("");
const fileList = ref([]);

const isDraggingFiles = ref(false);
let dragCounter = 0;

// Unified file viewer preferences (shared with AppDrive)
const fileViewerPrefs = useFileViewerPrefsStore();
const { sortBy, sortDirection, viewMode } = storeToRefs(fileViewerPrefs);

const uploadQueue = ref<
  Array<{
    file: UploadFile;
    onProgress?: (event: { percent: number }) => void;
    onSuccess?: (result: any, file: UploadFile) => void;
    onError?: (error: any) => void;
    path?: string;
  }>
>([]);
const activeUploads = ref(0);
const maxConcurrent = 3;
const uploadSessionTotal = ref(0);
const uploadSessionCompleted = ref(0);

const createFolderDialogVisible = ref(false);
const newFolderName = ref("");
const renameDialogVisible = ref(false);
const renameTarget = ref<FileEntry | null>(null);
const renameValue = ref("");
const deleteDialogVisible = ref(false);
const deleteDialogTitle = ref("");
const deleteDialogContent = ref("");
const deleteTargetItem = ref<FileEntry | null>(null);
const largeFolderWarningVisible = ref(false);
const pendingUploadData = ref<{
  allFiles: Array<{ file: File; relativePath: string }>;
  folders: string[];
} | null>(null);

const selectedFile = ref<string | null>(null);
const selectedFiles = ref<Set<string>>(new Set());
const isSelectingArea = ref(false);
const selectionBox = ref({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
const dragStartPoint = ref<{ x: number; y: number } | null>(null);
let wasDragSelection = false;
const DRAG_SELECTION_THRESHOLD = 20;
const containerRef = ref<HTMLElement | null>(null);

const fileStates = ref<Record<string, boolean>>({});
const loadingStates = ref<Record<string, boolean>>({});
const downloadProgresses = ref<Record<string, number>>({});
const compressingFolders = ref<Set<string>>(new Set());
const isSearching = ref(false);
const uploadStatusMessage = ref("");
const showUploadStatus = ref(false);

const containerWidth = ref(0);
const containerAvailableHeight = ref(0);
const isUploadPanelExpanded = ref(false);

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuTarget = ref<FileEntry | null>(null);

const MIN_GRID_SIZE_X = 110;
const GRID_SIZE_Y = 125;

let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;
const DOUBLE_TAP_THRESHOLD = 300;
const DOUBLE_TAP_DISTANCE = 30;

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressStartX = 0;
let longPressStartY = 0;
const LONG_PRESS_DURATION = 500;
const LONG_PRESS_MOVE_THRESHOLD = 10;

let currentTouchFile: FileEntry | null = null;
let hasMoved = false;
let isLongPressing = false;

let containerLongPressTimer: ReturnType<typeof setTimeout> | null = null;
let containerTouchStartX = 0;
let containerTouchStartY = 0;
let containerHasMoved = false;

let searchTimeout: ReturnType<typeof setTimeout> | null = null;
let resizeObserver: ResizeObserver | null = null;
let isProcessingQueue = false;
let isNavigatingFromSearch = false;

const fileIconsMap: Record<string, any> = {
  folder: folderIcon,
  txt: textFileIcon,
  md: textFileIcon,
  pdf: textFileIcon,
  png: imageFileIcon,
  jpg: imageFileIcon,
  jpeg: imageFileIcon,
  gif: imageFileIcon,
  psd: imageFileIcon,
  webp: imageFileIcon,
  mp4: videoFileIcon,
  mkv: videoFileIcon,
  mp3: audioFileIcon,
  wav: audioFileIcon,
  flac: audioFileIcon,
  zip: zipFileIcon,
  rar: zipFileIcon,
  doc: wordFileIcon,
  docx: wordFileIcon,
  pptx: powerpointFileIcon,
  ppt: powerpointFileIcon,
  ppsx: powerpointFileIcon,
  pps: powerpointFileIcon,
  xlsx: excelFileIcon,
  xls: excelFileIcon,
  csv: excelFileIcon,
  exe: codeFileIcon,
  app: codeFileIcon,
  sh: codeFileIcon,
  js: codeFileIcon,
  ts: codeFileIcon,
  py: codeFileIcon,
  c: codeFileIcon,
  cpp: codeFileIcon,
  h: codeFileIcon,
  hpp: codeFileIcon,
  cs: codeFileIcon,
  java: codeFileIcon,
  php: codeFileIcon,
  html: codeFileIcon,
  css: codeFileIcon,
  json: codeFileIcon,
  xml: codeFileIcon,
  sql: codeFileIcon,
  rs: codeFileIcon,
};

const displayedFiles = computed(() => {
  return files.value;
});

const filteredFiles = computed(() => {
  if (searchQuery.value && searchQuery.value.trim().length >= 2) {
    return [];
  }

  const sorted = [...files.value].sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;
    return (a.display_name || a.name).localeCompare(b.display_name || b.name);
  });

  return sorted.map((file) => ({
    value: file.display_name || file.name,
    label: file.display_name || file.name,
    isDirectory: file.is_directory,
    fileName: file.name,
  }));
});

const sortedFiles = computed(() => {
  const sorted = [...displayedFiles.value].sort((a, b) => {
    if (a.is_directory && !b.is_directory) return -1;
    if (!a.is_directory && b.is_directory) return 1;

    let comparison = 0;

    switch (sortBy.value) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "size":
        comparison = a.size - b.size;
        break;
      case "date":
        if (!a.modified && !b.modified) comparison = 0;
        else if (!a.modified) comparison = 1;
        else if (!b.modified) comparison = -1;
        else {
          const aTime = typeof a.modified === "number" ? a.modified : new Date(a.modified).getTime() / 1000;
          const bTime = typeof b.modified === "number" ? b.modified : new Date(b.modified).getTime() / 1000;
          comparison = aTime - bTime;
        }
        break;
    }

    return sortDirection.value === "asc" ? comparison : -comparison;
  });

  if (currentPath.value) {
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

const totalUploadProgress = computed(() => {
  if (uploadSessionTotal.value === 0) return 0;

  let totalProgress = uploadSessionCompleted.value * 100;

  uploadStore.currentlyUploading.forEach((upload) => {
    const progress = uploadStore.uploadProgress[upload.uid] || 0;
    totalProgress += progress;
  });

  return Math.round(totalProgress / uploadSessionTotal.value);
});

const groupedFilesByFolder = computed((): GroupedFiles[] => {
  if (!searchQuery.value || searchQuery.value.trim().length < 2) {
    return [];
  }

  const groups = new Map<string, FileEntry[]>();

  sortedFiles.value.forEach((file) => {
    const folderPath = file.name.includes("/") ? file.name.substring(0, file.name.lastIndexOf("/")) : "";

    if (!groups.has(folderPath)) {
      groups.set(folderPath, []);
    }
    groups.get(folderPath)!.push(file);
  });

  return Array.from(groups.entries())
    .map(([folder, files]) => ({ folder, files }))
    .sort((a, b) => {
      if (a.folder === "" && b.folder !== "") return -1;
      if (a.folder !== "" && b.folder === "") return 1;
      return a.folder.localeCompare(b.folder);
    });
});

const isSearchMode = computed(() => {
  return searchQuery.value && searchQuery.value.trim().length >= 2;
});

const positionedFiles = computed((): PositionedFileEntry[] => {
  const width = containerWidth.value || window.innerWidth - 100;

  const maxCols = Math.max(1, Math.floor(width / MIN_GRID_SIZE_X));

  const availableWidth = width - 16;
  const actualCellWidth = availableWidth / maxCols;

  if (isSearchMode.value) {
    const positioned: PositionedFileEntry[] = [];
    let currentY = 8;

    groupedFilesByFolder.value.forEach((group) => {
      positioned.push({
        name: `__header__${group.folder}`,
        display_name: group.folder === "" ? "Homepath" : group.folder,
        size: 0,
        modified: 0,
        is_directory: true,
        x: 8,
        y: currentY,
        gridRow: 0,
        gridCol: 0,
        isHeader: true,
        headerText: group.folder === "" ? "Homepath" : group.folder,
      });

      currentY += 32;

      group.files.forEach((file, index) => {
        const col = index % maxCols;
        const row = Math.floor(index / maxCols);

        const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
        const y = currentY + row * GRID_SIZE_Y;

        positioned.push({
          ...file,
          x,
          y,
          gridRow: row,
          gridCol: col,
        });
      });

      const rows = Math.ceil(group.files.length / maxCols);
      currentY += rows * GRID_SIZE_Y + 16;
    });

    return positioned;
  }

  return sortedFiles.value.map((file, index) => {
    const col = index % maxCols;
    const row = Math.floor(index / maxCols);

    const x = 8 + col * actualCellWidth + (actualCellWidth - 100) / 2;
    const y = 8 + row * GRID_SIZE_Y;

    return {
      ...file,
      x,
      y,
      gridRow: row,
      gridCol: col,
    };
  });
});

const containerHeight = computed(() => {
  if (positionedFiles.value.length === 0) {
    return 300;
  }

  const maxY = Math.max(...positionedFiles.value.map((f) => f.y));
  const iconHeight = 130;
  const bottomPadding = 16;
  const contentHeight = maxY + iconHeight + bottomPadding;

  return Math.max(contentHeight, 300);
});

const totalSize = computed(() => {
  return formatSize(files.value.reduce((acc, file) => acc + file.size, 0));
});

const selectedSize = computed(() => {
  if (selectedFile.value && selectedFiles.value.size === 0) {
    const file = files.value.find((f) => f.name === selectedFile.value);
    return file ? formatSize(file.size) : formatSize(0);
  }

  if (selectedFiles.value.size > 0) {
    const selectedFilesArray = files.value.filter((file) => selectedFiles.value.has(file.name));
    const selectedTotal = selectedFilesArray.reduce((acc, file) => acc + file.size, 0);
    return formatSize(selectedTotal);
  }

  return totalSize.value;
});

const statusBarInfo = computed(() => {
  if (selectedFile.value || selectedFiles.value.size > 0) {
    return `${selectedSize.value} selected`;
  }
  return `${totalSize.value} total`;
});

const isMobile = computed(() => window.innerWidth < 768);

const statusBarMessage = computed(() => {
  if (searchQuery.value && searchQuery.value.trim().length >= 2) {
    return `Searching all folders for "${searchQuery.value}"`;
  }

  if (!currentPath.value) {
    return `${files.value.length} ${files.value.length === 1 ? "item" : "items"} available`;
  }

  const pathParts = currentPath.value.split("/").filter((p) => p);
  const currentFolder = pathParts[pathParts.length - 1] || "";

  if (isMobile.value) {
    const depth = pathParts.length;
    const dots = "../".repeat(Math.max(0, depth - 1));
    return `${dots}${currentFolder}`;
  }

  return pathParts.join(" / ");
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

const contextMenuItems = computed(() => {
  const items: Array<{ label?: string; icon?: any; action?: () => void; shortcut?: string; disabled?: boolean; divider?: boolean; danger?: boolean }> = [];
  const selectedCount = selectedFiles.value.size;

  if (selectedCount > 1) {
    const selectedFilesList = Array.from(selectedFiles.value)
      .map((name) => files.value.find((f) => f.name === name))
      .filter((f) => f !== undefined) as FileEntry[];

    const hasDirectories = selectedFilesList.some((f) => f.is_directory);
    const onlyFiles = selectedFilesList.filter((f) => !f.is_directory);

    const shouldZip = selectedCount > 3 || hasDirectories;

    items.push({ label: `Selected: ${selectedCount} items`, icon: checkIcon, disabled: true }, { divider: true });

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
            await downloadFile(file.name);
          }
          closeContextMenu();
        },
      });
    }

    items.push(
      {
        label: "Delete All",
        icon: deleteIcon,
        action: () => {
          deleteDialogTitle.value = `Delete ${selectedCount} items?`;
          deleteDialogContent.value = `Are you sure you want to delete ${selectedCount} selected items? This action cannot be undone.`;
          deleteTargetItem.value = null;
          deleteDialogVisible.value = true;
          closeContextMenu();
        },
      },
      { divider: true },
      { label: "New Folder", icon: folderPlusIcon, action: () => showCreateFolderDialog() },
      { label: "Refresh", icon: refreshIcon, action: () => fetchFiles(currentPath.value) }
    );

    return items;
  }

  if (contextMenuTarget.value) {
    if (contextMenuTarget.value.is_directory) {
      items.push({
        label: "Open",
        icon: folderIcon,
        action: () => {
          const folderPath = contextMenuTarget.value!.name;
          closeContextMenu();

          if (isSearchMode.value) {
            isNavigatingFromSearch = true;
            searchQuery.value = "";
            nextTick(() => {
              navigateToFolder(folderPath);
              isNavigatingFromSearch = false;
            });
          } else {
            navigateToFolder(folderPath);
          }
        },
      });

      items.push({
        label: "Download as ZIP",
        icon: arrowDownThickIcon,
        action: () => downloadFolderAsZip(contextMenuTarget.value!.name),
      });

      items.push({ divider: true });

      if (isSearchMode.value) {
        items.push({ label: "Rename Folder", icon: pencilIcon, disabled: true, action: () => {} });
      } else {
        items.push({ label: "Rename Folder", icon: pencilIcon, action: () => startRename(contextMenuTarget.value!) });
      }

      items.push({ label: "Delete Folder", icon: deleteIcon, action: () => deleteItemFromContextMenu(contextMenuTarget.value!) }, { divider: true }, { label: "New Folder", icon: folderPlusIcon, action: () => showCreateFolderDialog() });
    } else {
      items.push({ label: "Download", icon: arrowDownThickIcon, action: () => downloadFile(contextMenuTarget.value!.name) }, { divider: true });

      if (isSearchMode.value) {
        items.push({ label: "Rename File", icon: pencilIcon, disabled: true, action: () => {} });
      } else {
        items.push({ label: "Rename File", icon: pencilIcon, action: () => startRename(contextMenuTarget.value!) });
      }

      items.push({ label: "Delete File", icon: deleteIcon, action: () => deleteItemFromContextMenu(contextMenuTarget.value!) }, { divider: true }, { label: "New Folder", icon: folderPlusIcon, action: () => showCreateFolderDialog() });
    }
  } else {
    items.push({ label: "New Folder", icon: folderPlusIcon, action: () => showCreateFolderDialog() });
    items.push({ label: "Refresh", icon: refreshIcon, action: () => fetchFiles(currentPath.value) });
  }

  return items;
});

watch(searchQuery, (newQuery) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (!newQuery || newQuery.trim().length === 0) {
    if (!isNavigatingFromSearch) {
      fetchFiles(currentPath.value);
    }
    return;
  }

  if (newQuery.trim().length >= 2) {
    searchTimeout = setTimeout(() => {
      fetchFiles("", true);
    }, 300);
  }
});

watch(viewMode, () => {
  nextTick(() => {
    updateContainerWidth();
    reconnectResizeObserver();
  });
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

const isHidden = (name: string): boolean => {
  return name.startsWith(".");
};

const isNewFile = (file: FileEntry) => {
  if (!file.modified) return false;

  const now = new Date();
  const date = typeof file.modified === "number" ? new Date(file.modified * 1000) : new Date(file.modified);
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  return diffInHours < 1;
};

const getRelativeTime = (file: FileEntry): string => {
  if (!file.modified) return "";

  const now = new Date();
  const date = typeof file.modified === "number" ? new Date(file.modified * 1000) : new Date(file.modified);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}y ago`;
};

const readDirectoryRecursively = async (entry: FileSystemDirectoryEntry, basePath: string = ""): Promise<Array<{ file: File; relativePath: string }>> => {
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
};

const extractUniqueFolders = (files: Array<{ file: File; relativePath: string }>): string[] => {
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
};

function formatSize(size: string | number) {
  const numSize = typeof size === "number" ? size : parseFloat(size);
  if (numSize === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numSize) / Math.log(k));
  return Math.round((numSize / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatSizeCompact(size: string | number) {
  const numSize = typeof size === "number" ? size : parseFloat(size);
  if (numSize === 0) return "0B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(numSize) / Math.log(k));
  const value = numSize / Math.pow(k, i);

  const formatted = value >= 100 ? Math.round(value).toString() : value.toFixed(1);
  return formatted + sizes[i];
}

const fileIcon = (file: FileEntry) => {
  if (file.is_directory) {
    if (file.name === "..") {
      return folderArrowLeftIcon;
    }
    return folderIcon;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  return fileIconsMap[extension || "unknown"] || unknownFileIcon;
};

const showStatus = (message: string, duration: number = 0) => {
  uploadStatusMessage.value = message;
  showUploadStatus.value = true;

  if (duration > 0) {
    setTimeout(() => {
      showUploadStatus.value = false;
    }, duration);
  }
};

const hideStatus = () => {
  showUploadStatus.value = false;
};

const fetchFiles = async (path: string = "", forceSearch: boolean = false) => {
  try {
    if ((searchQuery.value.trim() && searchQuery.value.length >= 2) || forceSearch) {
      isSearching.value = true;

      const loadingTimer = setTimeout(() => {
        if (isSearching.value) {
          showStatus("Searching files...");
        }
      }, 200);

      const response = await axios.get("/api/search_files", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        params: { query: searchQuery.value.trim() },
      });

      clearTimeout(loadingTimer);
      files.value = response.data.files || [];
      currentPath.value = "";

      dropZoneStore.setFiles(files.value);
      isSearching.value = false;
      hideStatus();
      return;
    }

    const params = path ? { path } : {};
    const response = await axios.get("/api/get_files", {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      params,
    });

    files.value = response.data.files || [];
    currentPath.value = response.data.current_path || "";

    dropZoneStore.setFiles(files.value);
  } catch (error) {
    isSearching.value = false;
    hideStatus();
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error_message || "Failed to fetch files. Please try again.");
    } else {
      message.error("Failed to fetch files. Please try again.");
    }
  }
};

const uploadFile = async (file: File, onProgress?: (event: { percent: number }) => void, targetPath?: string) => {
  const formData = new FormData();
  formData.append("file", file);

  if (targetPath) {
    formData.append("path", targetPath);
  }

  try {
    const response = await axios.post("/api/upload_file", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded / event.total) * 100);

          const uploadFileTyped = file as UploadFile;
          uploadStore.updateProgress(uploadFileTyped.uid, percent);

          if (onProgress) {
            onProgress({ percent });
          }
        }
      },
    });

    if (!response.data.success) {
      message.error(response.data.error.value || "Upload failed");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 413) {
        message.error("The selected file is larger than 1GB.");
      } else {
        message.error(error.response?.data?.error_message || `Unexpected error occurred: ${error.message}`);
      }
    } else {
      message.error("An unknown error occurred. Please try again.");
    }
    throw error;
  }
};

const downloadFile = async (fileName: string) => {
  if (downloadProgresses.value[fileName] !== undefined && downloadProgresses.value[fileName] < 100 && downloadProgresses.value[fileName] > 0) {
    message.info(`Download for ${fileName} is already in progress.`);
    return;
  }

  try {
    fileStates.value[fileName] = true;
    loadingStates.value[fileName] = true;
    downloadProgresses.value[fileName] = 0;

    const response = await axios.get(`/api/download_file?file=${encodeURIComponent(fileName)}`, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "blob",
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          downloadProgresses.value[fileName] = percentCompleted;
        }
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const downloadName = fileName.split("/").pop() || fileName;
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    setTimeout(() => {
      fileStates.value[fileName] = false;
      loadingStates.value[fileName] = false;
    }, 1000);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error_message || "Failed to download file. Please try again.");
    } else {
      message.error("Failed to download file. Please try again.");
    }
    delete downloadProgresses.value[fileName];
    loadingStates.value[fileName] = false;
    fileStates.value[fileName] = false;
  }
};

const downloadMultipleAsZip = async (fileNames: string[]) => {
  if (fileNames.length === 0) return;

  try {
    fileNames.forEach((name) => {
      const file = files.value.find((f) => f.name === name);
      if (file?.is_directory) {
        compressingFolders.value.add(name);
      }
    });

    const response = await axios.post(
      "/api/download_multiple",
      { files: fileNames },
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
};

const downloadFolderAsZip = async (folderName: string) => {
  try {
    compressingFolders.value.add(folderName);

    const response = await axios.post(
      "/api/download_multiple",
      { files: [folderName] },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    const baseName = folderName.split("/").pop() || folderName;
    link.setAttribute("download", `${baseName}.zip`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    message.error("Failed to download folder as ZIP");
  } finally {
    compressingFolders.value.delete(folderName);
  }
};

const deleteFile = async (fileName: string, silent = false) => {
  try {
    const response = await axios.post("/api/delete_file", { file: fileName }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (response.data.success) {
      if (!silent) {
        message.success(response.data.message);
      }
      return { success: true };
    } else {
      if (!silent) {
        message.error(response.data.error || "Failed to delete file");
      }
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    if (!silent) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data?.error_message || "Failed to delete file. Please try again.");
      } else {
        message.error("Failed to delete file. Please try again.");
      }
    }
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

const processQueue = async () => {
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
          await uploadFile(nextUpload.file, nextUpload.onProgress, nextUpload.path);
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
    await fetchFiles(currentPath.value);
  }
};

const customUpload = async ({ file, onSuccess, onError, onProgress }: any) => {
  const uploadFile = file as UploadFile;

  uploadStore.addToQueue({
    uid: uploadFile.uid,
    name: uploadFile.name,
    size: uploadFile.size,
  });

  uploadQueue.value.push({
    file: uploadFile,
    onProgress,
    onSuccess,
    onError,
    path: currentPath.value,
  });
  processQueue();
};

const processUpload = async (allFiles: Array<{ file: File; relativePath: string }>) => {
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

      const uploadFile = file as UploadFile;
      uploadFile.uid = uid;

      const targetPath = relativePath ? (currentPath.value ? `${currentPath.value}/${relativePath}` : relativePath) : currentPath.value;

      uploadStore.addToQueue({
        uid: uploadFile.uid,
        name: uploadFile.name,
        size: uploadFile.size,
      });

      uploadQueue.value.push({
        file: uploadFile,
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
};

const createFolder = async () => {
  if (!newFolderName.value.trim()) {
    message.error("Folder name cannot be empty");
    return;
  }

  try {
    const response = await axios.post(
      "/api/create_folder",
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
      createFolderDialogVisible.value = false;
      newFolderName.value = "";
      await fetchFiles(currentPath.value);
    } else {
      message.error(response.data.error || "Failed to create folder");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error || "Failed to create folder. Please try again.");
    } else {
      message.error("Failed to create folder. Please try again.");
    }
  }
};

const performRename = async () => {
  if (!renameTarget.value || !renameValue.value.trim()) {
    message.error("New name cannot be empty");
    return;
  }

  try {
    const response = await axios.post(
      "/api/rename_item",
      {
        old_name: renameTarget.value.name,
        new_name: renameValue.value.trim(),
      },
      {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      }
    );

    if (response.data.success) {
      message.success(response.data.message);
      renameDialogVisible.value = false;
      renameTarget.value = null;
      renameValue.value = "";
      await fetchFiles(currentPath.value);
    } else {
      message.error(response.data.error || "Failed to rename item");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      message.error(error.response?.data?.error || "Failed to rename item. Please try again.");
    } else {
      message.error("Failed to rename item. Please try again.");
    }
  }
};

const navigateToFolder = (folderPath: string) => {
  fetchFiles(folderPath);
};

const goBack = () => {
  if (!currentPath.value) return;

  const pathParts = currentPath.value.split("/").filter((p) => p);
  pathParts.pop();
  const newPath = pathParts.join("/");

  fetchFiles(newPath);
};

const handleDragEnter = (e: DragEvent) => {
  e.preventDefault();
  dragCounter++;

  if (e.dataTransfer?.types.includes("Files")) {
    isDraggingFiles.value = true;
  }
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  dragCounter--;

  if (dragCounter === 0) {
    isDraggingFiles.value = false;
  }
};

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  isDraggingFiles.value = false;

  if (!e.dataTransfer) {
    return;
  }

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

    largeFolderWarningVisible.value = true;
    hideStatus();
    return;
  }

  await processUpload(allFiles);
};

const handleChange = (info: any) => {
  if (info.file.status === "done") {
    message.success(`${info.file.name} uploaded successfully`);
  } else if (info.file.status === "error") {
    message.error(`${info.file.name} upload failed.`);
  }
};

const handleFileClick = (file: FileEntry, event?: MouseEvent | TouchEvent) => {
  const e = event;
  if (!e) return;

  if (wasDragSelection) return;

  const isTouchEvent = "touches" in e;

  if (file.name === "..") {
    if (isTouchEvent) {
      const touch = (e as TouchEvent).changedTouches?.[0] || (e as TouchEvent).touches?.[0];
      if (touch) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;
        const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

        if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
          goBack();
          lastTapTime = 0;
          lastTapX = 0;
          lastTapY = 0;
          return;
        } else {
          lastTapTime = now;
          lastTapX = touch.clientX;
          lastTapY = touch.clientY;
          return;
        }
      }
    }
    return;
  }

  if (isTouchEvent) {
    const touch = (e as TouchEvent).changedTouches?.[0] || (e as TouchEvent).touches?.[0];
    if (touch) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime;
      const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

      if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
        handleFileDoubleClick(file);
        lastTapTime = 0;
        lastTapX = 0;
        lastTapY = 0;
        return;
      } else {
        selectedFiles.value.clear();
        selectedFile.value = file.name;
        lastTapTime = now;
        lastTapX = touch.clientX;
        lastTapY = touch.clientY;
        return;
      }
    }
  }

  const isCtrlPressed = (e as MouseEvent)?.ctrlKey || (e as MouseEvent)?.metaKey;

  if (isCtrlPressed) {
    if (selectedFiles.value.has(file.name)) {
      selectedFiles.value.delete(file.name);
    } else {
      selectedFiles.value.add(file.name);
    }
    selectedFile.value = null;
  } else {
    selectedFiles.value.clear();
    selectedFile.value = file.name;
  }
};

const handleFileDoubleClick = (file: FileEntry) => {
  if (file.name === "..") {
    goBack();
    return;
  }

  if (file.is_directory) {
    if (isSearchMode.value) {
      isNavigatingFromSearch = true;
      searchQuery.value = "";
      nextTick(() => {
        navigateToFolder(file.name);
        isNavigatingFromSearch = false;
      });
    } else {
      navigateToFolder(file.name);
    }
  } else {
    downloadFile(file.name);
  }
};

const handleFileTouchStart = (file: FileEntry, event: TouchEvent) => {
  const touch = event.touches[0];
  if (!touch) return;

  currentTouchFile = file;
  hasMoved = false;
  isLongPressing = false;

  longPressStartX = touch.clientX;
  longPressStartY = touch.clientY;

  if (file.name !== "..") {
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
};

const handleFileTouchMove = (event: TouchEvent) => {
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
};

const handleFileTouchEnd = (file: FileEntry, event: TouchEvent) => {
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

  if (!hasMoved && currentTouchFile) {
    const now = Date.now();
    const touch = event.changedTouches[0];
    if (!touch) return;

    const timeSinceLastTap = now - lastTapTime;
    const distance = Math.sqrt(Math.pow(touch.clientX - lastTapX, 2) + Math.pow(touch.clientY - lastTapY, 2));

    if (timeSinceLastTap < DOUBLE_TAP_THRESHOLD && distance < DOUBLE_TAP_DISTANCE) {
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
};

const handleContainerTouchStart = (event: TouchEvent) => {
  const target = event.target as HTMLElement;
  const isFileItem = target.closest(".dropzone-file-item");
  if (isFileItem) return;

  const isControl = target.closest(".dropzone-controls-container");
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
};

const handleContainerTouchMove = (event: TouchEvent) => {
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
};

const handleContainerTouchEnd = () => {
  if (containerLongPressTimer) {
    clearTimeout(containerLongPressTimer);
    containerLongPressTimer = null;
  }

  if (!containerHasMoved) {
    selectedFile.value = null;
    selectedFiles.value.clear();
  }

  containerHasMoved = false;
};

const handleContainerMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement;

  const isControl = target.closest(".dropzone-controls-container");
  if (isControl) return;

  if (displayedFiles.value.length === 0) return;

  if (e.button !== 0) return;

  const rect = (e.currentTarget as HTMLElement)?.getBoundingClientRect();
  if (!rect) return;

  const startX = e.clientX - rect.left;
  const startY = e.clientY - rect.top;

  dragStartPoint.value = { x: startX, y: startY };

  const isFileItem = target.closest(".dropzone-file-item");

  if (!isFileItem) {
    isSelectingArea.value = true;
    selectionBox.value.startX = startX;
    selectionBox.value.startY = startY;
    selectionBox.value.currentX = startX;
    selectionBox.value.currentY = startY;

    selectedFile.value = null;
    selectedFiles.value.clear();
  }

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (e: MouseEvent) => {
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
      selectedFile.value = null;
      selectedFiles.value.clear();
    }
  }

  if (isSelectingArea.value) {
    selectionBox.value.currentX = mouseX;
    selectionBox.value.currentY = mouseY;
    updateSelectedFilesInBox();
  }
};

const handleMouseUp = () => {
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
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
};

const updateSelectedFilesInBox = () => {
  const boxX = Math.min(selectionBox.value.startX, selectionBox.value.currentX);
  const boxY = Math.min(selectionBox.value.startY, selectionBox.value.currentY);
  const boxWidth = Math.abs(selectionBox.value.currentX - selectionBox.value.startX);
  const boxHeight = Math.abs(selectionBox.value.currentY - selectionBox.value.startY);

  selectedFiles.value.clear();

  const container = containerRef.value;
  const containerRect = container?.getBoundingClientRect();
  if (!containerRect) return;

  document.querySelectorAll(".dropzone-file-item").forEach((element) => {
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
      if (fileName && fileName !== "..") selectedFiles.value.add(fileName);
    }
  });
};

const showContextMenu = (event: MouseEvent, file: FileEntry | null = null) => {
  event.preventDefault();

  if (file?.name === "..") {
    file = null;
  }

  if (file && !selectedFiles.value.has(file.name)) {
    selectedFile.value = file.name;
    selectedFiles.value.clear();
  } else if (!file) {
    selectedFile.value = "";
    selectedFiles.value.clear();
  }

  contextMenuTarget.value = file;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
  contextMenuTarget.value = null;
};

const showCreateFolderDialog = () => {
  newFolderName.value = "";
  createFolderDialogVisible.value = true;
};

const startRename = (file: FileEntry) => {
  renameTarget.value = file;
  const fileName = file.display_name || file.name.split("/").pop() || file.name;
  renameValue.value = fileName;
  renameDialogVisible.value = true;
};

const deleteItemFromContextMenu = (item: FileEntry) => {
  const itemType = item.is_directory ? "folder" : "file";
  const itemName = item.display_name || item.name.split("/").pop() || item.name;

  deleteTargetItem.value = item;
  deleteDialogTitle.value = `Delete ${itemType}?`;
  deleteDialogContent.value = `Are you sure you want to delete "${itemName}"?${item.is_directory ? " This will delete all files inside." : ""}`;
  deleteDialogVisible.value = true;
};

const confirmDeleteFromDialog = async () => {
  if (!deleteTargetItem.value && selectedFiles.value.size > 0) {
    const selectedFilesList = Array.from(selectedFiles.value);
    let successCount = 0;
    let failCount = 0;

    for (const fileName of selectedFilesList) {
      const result = await deleteFile(fileName, true);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (failCount === 0) {
      message.success(`${successCount} ${successCount === 1 ? "item" : "items"} deleted successfully`);
    } else if (successCount === 0) {
      message.error(`Failed to delete ${failCount} ${failCount === 1 ? "item" : "items"}`);
    } else {
      message.warning(`${successCount} ${successCount === 1 ? "item" : "items"} deleted, ${failCount} failed`);
    }

    selectedFiles.value.clear();
    selectedFile.value = null;
    deleteDialogVisible.value = false;
    await fetchFiles(currentPath.value);
    return;
  }

  if (!deleteTargetItem.value) return;

  await deleteFile(deleteTargetItem.value.name);
  deleteDialogVisible.value = false;
  deleteTargetItem.value = null;
  await fetchFiles(currentPath.value);
};

const confirmLargeFolderUpload = async () => {
  if (!pendingUploadData.value) return;

  largeFolderWarningVisible.value = false;

  const { allFiles } = pendingUploadData.value;
  pendingUploadData.value = null;

  await nextTick();
  await processUpload(allFiles);
};

const cancelLargeFolderUpload = () => {
  largeFolderWarningVisible.value = false;
  pendingUploadData.value = null;
};

const toggleSortDirection = () => {
  sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === "grid" ? "list" : "grid";

  nextTick(() => {
    updateContainerWidth();
  });
};

const updateContainerWidth = () => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth;
    containerAvailableHeight.value = containerRef.value.clientHeight;
  }
};

const reconnectResizeObserver = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }

  if (containerRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width;
        containerAvailableHeight.value = entry.contentRect.height;
      }
    });
    resizeObserver.observe(containerRef.value);
  }
};

onMounted(() => {
  fileViewerPrefs.load();
  fetchFiles();

  updateContainerWidth();
  reconnectResizeObserver();
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style scoped>
:deep(.compact-dragger .ant-upload-drag) {
  min-height: auto !important;
  height: auto !important;
}

.dropzone-controls-container {
  flex-direction: column;
  align-items: flex-start;
}

.dropzone-search-wrapper {
  width: 100%;
}

.dropzone-actions-wrapper {
  width: 100%;
  flex-shrink: 0;
}

.dropzone-sort-select {
  flex: 1;
}

/* View mode container */
.view-mode-container {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
}

/* Icons container */
.dropzone-icons-container {
  position: relative;
  width: 100%;
  user-select: none;
}

@container window (min-width: 900px) {
  .dropzone-controls-container {
    flex-direction: row;
    align-items: center;
  }

  .dropzone-search-wrapper {
    width: auto;
  }

  .dropzone-actions-wrapper {
    width: auto;
  }

  .dropzone-sort-select {
    flex: none;
    width: auto;
  }
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

.list-view-fade-enter-from {
  opacity: 0;
}

.list-view-fade-leave-to {
  opacity: 0;
}

.dropzone-list-container {
  min-height: 100px;
  padding: 4px 0;
}

@container window (max-width: 500px) {
  .dropzone-list-container .list-view-size {
    display: none;
  }
}

@container window (max-width: 350px) {
  .dropzone-list-container .list-view-time {
    display: none;
  }
}

.fullscreen-dragger {
  position: absolute !important;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

.dragger-fade-enter-active {
  transition: opacity 0.2s ease-out;
}

.dragger-fade-leave-active {
  transition: opacity 0.15s ease-in;
}

.dragger-fade-enter-from,
.dragger-fade-leave-to {
  opacity: 0;
}

/* Upload progress panel transition */
.upload-slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.upload-slide-up-leave-active {
  transition: all 0.25s ease-in;
}

.upload-slide-up-enter-from {
  opacity: 0;
  max-height: 0;
}

.upload-slide-up-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Expand height transition for detail view */
.expand-height-enter-active {
  transition: all 0.25s ease-out;
  overflow: hidden;
}

.expand-height-leave-active {
  transition: all 0.2s ease-in;
  overflow: hidden;
}

.expand-height-enter-from,
.expand-height-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-height-enter-to,
.expand-height-leave-from {
  max-height: 240px;
  opacity: 1;
}
</style>
