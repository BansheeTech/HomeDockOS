<!-- homedock-ui/vue3/static/js/__Apps__/AppPackager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-packager flex flex-col h-full overflow-hidden">
    <div ref="segmentedContainerRef" class="packager-segmented-container" @mousedown="onSegmentedDrag">
      <Segmented v-model:value="activeTab" :options="segmentedOptions" :class="themeClasses.scopeSelector" class="packager-segmented">
        <template #label="{ payload }">
          <div class="flex items-center justify-center gap-1.5 px-1 py-1">
            <Icon :icon="payload.icon" class="w-4 h-4 flex-shrink-0" />
            <span>{{ payload.label }}</span>
          </div>
        </template>
      </Segmented>
    </div>

    <div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/15">
      <Transition enter-active-class="transition-opacity duration-200 ease-out" leave-active-class="transition-opacity duration-200 ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0" mode="out-in">
        <div v-if="activeTab === 'generator'" key="generator" class="px-4 py-4 space-y-4">
          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" :class="themeClasses.explorerGroupHeader">
            <Icon :icon="fileCodeIcon" class="w-4 h-4" />
            <span>Source Files</span>
          </h3>

          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-1 flex flex-col">
              <label :class="['block text-xs font-medium mb-1.5', themeClasses.windowTitleTextFocused]">Docker Compose *</label>
              <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="composeFileList" name="compose" accept=".yml,.yaml" :multiple="false" :customRequest="handleComposeUpload" @change="handleComposeChange" :showUploadList="false" :maxCount="1" class="compact-dragger h-[160px]">
                <div class="relative h-full">
                  <div class="flex items-center justify-center flex-col h-full" :class="composeFile ? 'pb-10' : ''">
                    <p class="ant-upload-drag-icon">
                      <Icon :icon="composeFile ? checkIcon : fileCodeIcon" :class="['text-3xl', composeFile ? themeClasses.packagerSuccessIcon : themeClasses.dropZoneDragIcon]" />
                    </p>
                    <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-xs']">
                      {{ composeFile ? composeFile.name : "Click or drag .yml/.yaml here" }}
                    </p>
                    <p v-if="parsedData.image" :class="['text-[10px] mt-1', themeClasses.packagerSuccessText]">Detected: {{ parsedData.image }}</p>
                  </div>

                  <div v-if="composeFile" class="absolute bottom-0 left-0 right-0 p-1.5">
                    <Button @click.stop="openComposeEditor" :class="[themeClasses.scopeSelector]" class="w-full flex items-center justify-center" type="primary" size="small">
                      <Icon :icon="editIcon" class="w-3.5 h-3.5 mr-1.5" />
                      <span class="text-xs">Edit Compose</span>
                    </Button>
                  </div>
                </div>
              </UploadDragger>
            </div>

            <div class="flex-1 flex flex-col">
              <label :class="['block text-xs font-medium mb-1.5', themeClasses.windowTitleTextFocused]">App Icon *</label>
              <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="iconFileList" name="icon" accept=".jpg,.jpeg,.png" :multiple="false" :customRequest="handleIconUpload" @change="handleIconChange" :showUploadList="false" :maxCount="1" :beforeUpload="beforeIconUpload" class="compact-dragger h-[160px]">
                <div class="flex items-center justify-center flex-col h-full">
                  <p class="ant-upload-drag-icon">
                    <Icon v-if="!iconPreview" :icon="imageIcon" :class="['text-3xl', themeClasses.dropZoneDragIcon]" />
                    <img v-else :src="iconPreview" class="w-12 h-12 rounded-lg object-cover shadow-sm" />
                  </p>
                  <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-xs']">
                    {{ iconFile ? iconFile.name : "Click or drag image here" }}
                  </p>
                  <p :class="[themeClasses.dropZoneDragDownText, 'px-4 text-balance text-[10px]']">.jpg or .png</p>
                </div>
              </UploadDragger>
            </div>
          </div>

          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider pt-2" :class="themeClasses.explorerGroupHeader">
            <Icon :icon="shapeIcon" class="w-4 h-4" />
            <span>Package Metadata</span>
          </h3>

          <div :class="['rounded-lg border overflow-hidden', themeClasses.windowBorder, themeClasses.explorerResultItem]">
            <div>
              <div class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">App Slug *</label>
                <div class="flex-1">
                  <Input v-model:value="newPackage.slug" placeholder="e.g., my-awesome-app" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" size="small" />
                  <p v-if="newPackage.slug && !isValidSlug(newPackage.slug)" :class="['text-[10px] mt-0.5', themeClasses.packagerErrorText]">Only lowercase letters, numbers and dashes. Cannot start or end with a dash.</p>
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">App Name *</label>
                <div class="flex-1">
                  <Input v-model:value="newPackage.display_name" placeholder="e.g., My Awesome App" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" size="small" />
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">Category *</label>
                <div class="flex-1">
                  <Select v-model:value="newPackage.category" placeholder="Select Category" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'w-full']" :popup-class-name="`${themeClasses.scopeSelector}`" size="small">
                    <SelectOption value="AI">AI</SelectOption>
                    <SelectOption value="Developer Tools">Developer Tools</SelectOption>
                    <SelectOption value="Files & Productivity">Files & Productivity</SelectOption>
                    <SelectOption value="Gaming">Gaming</SelectOption>
                    <SelectOption value="Home & Automation">Home & Automation</SelectOption>
                    <SelectOption value="Media">Media</SelectOption>
                    <SelectOption value="Networking">Networking</SelectOption>
                    <SelectOption value="Social">Social</SelectOption>
                    <SelectOption value="Web Development">Web Development</SelectOption>
                  </Select>
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">Type *</label>
                <div class="flex-1">
                  <Input v-model:value="newPackage.type" placeholder="e.g., Media Server" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" size="small" />
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">Docker Image *</label>
                <div class="flex-1 flex gap-2">
                  <Input v-model:value="newPackage.docker_image" placeholder="e.g., myuser/myapp" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'flex-1']" size="small" />
                  <button v-if="parsedData.image" @click="newPackage.docker_image = parsedData.image.split(':')[0]" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center px-2 py-1 rounded-lg border transition-all duration-150" title="Use detected image">
                    <Icon :icon="refreshIcon" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">Version *</label>
                <div class="flex-1 flex gap-2">
                  <Input v-model:value="newPackage.version" placeholder="e.g., latest" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'flex-1']" size="small" />
                  <button v-if="parsedData.tag" @click="newPackage.version = parsedData.tag" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center justify-center px-2 py-1 rounded-lg border transition-all duration-150" title="Use detected version">
                    <Icon :icon="refreshIcon" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0', themeClasses.windowTitleTextFocused]">Creator (you) *</label>
                <div class="flex-1">
                  <Input v-model:value="newPackage.author" placeholder="Your name or organization" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" size="small" />
                </div>
              </div>

              <div :class="themeClasses.windowBorder" class="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 px-4 py-3 border-t">
                <label :class="['text-xs font-medium w-32 flex-shrink-0 pt-1', themeClasses.windowTitleTextFocused]">Description *</label>
                <div class="flex-1">
                  <Input v-model:value="newPackage.description" placeholder="Describe what this application does..." :maxlength="130" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" size="small" />
                  <p :class="['text-[10px] mt-0.5 text-right', themeClasses.packagerTextMuted]">{{ newPackage.description.length }}/130</p>
                </div>
              </div>
            </div>
          </div>

          <button @click="createPackage" :disabled="!canCreate || isCreating" :class="['w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2', canCreate && !isCreating ? `${themeClasses.packagerSuccessButtonBg} ${themeClasses.packagerSuccessButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer` : `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed`]">
            <Icon :icon="isCreating ? loadingIcon : downloadIcon" :class="['w-4 h-4', isCreating ? 'animate-spin' : '']" />
            {{ isCreating ? "Creating Package..." : "Create & Download .hds Package" }}
          </button>
        </div>

        <div v-else key="manager" class="px-4 py-4 space-y-4">
          <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4" :class="themeClasses.explorerGroupHeader">
            <Icon :icon="packageIcon" class="w-4 h-4" />
            <span>Available Packages</span>
            <span class="opacity-50 font-normal">{{ packageSearch && filteredExternalApps.length !== externalApps.length ? `(${filteredExternalApps.length}/${externalApps.length})` : `(${externalApps.length})` }}</span>
          </h3>

          <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="packageFileList" name="package" accept=".hds" :multiple="true" :customRequest="handlePackageUploadRequest" @change="handlePackageChange" :showUploadList="false" class="compact-dragger-pkg">
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" :class="themeClasses.iconHolder">
                <Icon :icon="isUploading ? loadingIcon : importIcon" :class="['w-5 h-5', isUploading ? 'animate-spin' : '', themeClasses.explorerItemIcon]" />
              </div>
              <div class="flex-1 min-w-0 text-left">
                <p :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium">
                  {{ isUploading ? "Importing package..." : "Import .hds Package" }}
                </p>
                <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5">
                  {{ isUploading ? "Please wait" : "Drop .hds files here or click to browse" }}
                </p>
              </div>
              <div class="flex-shrink-0">
                <Icon :icon="uploadIcon" :class="[themeClasses.windowPlaceholderText]" class="w-5 h-5" />
              </div>
            </div>
          </UploadDragger>

          <div v-if="externalApps.length > 5" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]" class="rounded-lg border overflow-hidden flex items-center gap-2 px-3 py-2">
            <Icon :icon="magnifyIcon" :class="[themeClasses.windowPlaceholderText]" class="w-4 h-4 flex-shrink-0" />
            <input v-model="packageSearch" type="text" placeholder="Search packages by name, author or category..." :class="[themeClasses.windowTitleTextFocused]" class="flex-1 bg-transparent text-xs outline-none placeholder:opacity-50" />
            <button v-if="packageSearch" @click="packageSearch = ''" class="flex-shrink-0">
              <Icon :icon="closeCircleIcon" :class="[themeClasses.windowPlaceholderText]" class="w-3.5 h-3.5 opacity-50 hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div @click="openAppStore" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem, themeClasses.explorerResultItemHover]" class="rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer">
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" :class="themeClasses.settingsIconBgBlue">
                <Icon :icon="storeIcon" class="w-5 h-5 text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium">Browse App Store</p>
                <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5">Find your apps on the App Store</p>
              </div>
              <div class="flex-shrink-0">
                <Icon :icon="chevronRightIcon" :class="[themeClasses.windowPlaceholderText]" class="w-5 h-5" />
              </div>
            </div>
          </div>

          <div v-if="isLoadingExternal" class="flex justify-center items-center h-48">
            <Icon :icon="loadingIcon" :class="[themeClasses.windowPlaceholderText]" class="w-10 h-10 animate-spin opacity-50" />
          </div>

          <div v-else-if="externalApps.length === 0" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]" class="rounded-lg border overflow-hidden">
            <div class="flex items-center gap-3 px-4 py-3">
              <div class="flex-shrink-0">
                <div class="w-2 h-2 rounded-full bg-neutral-400 opacity-50" />
              </div>
              <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" :class="themeClasses.iconHolder">
                <Icon :icon="packageIcon" :class="['w-5 h-5', themeClasses.explorerItemIcon]" class="opacity-50" />
              </div>
              <div class="flex-1 min-w-0">
                <h4 :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium">No packages available</h4>
                <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5">Drop a .hds file above to import your first package</p>
              </div>
            </div>
          </div>

          <template v-else>
            <div v-if="filteredExternalApps.length === 0 && packageSearch" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]" class="rounded-lg border overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3">
                <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" :class="themeClasses.iconHolder">
                  <Icon :icon="magnifyIcon" :class="['w-5 h-5', themeClasses.explorerItemIcon]" class="opacity-50" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium">No packages match "{{ packageSearch }}"</h4>
                  <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5">Try a different search term</p>
                </div>
              </div>
            </div>
            <div class="space-y-4">
              <TransitionGroup appear enter-active-class="transition-all duration-250 ease-out" leave-active-class="transition-all duration-250 ease-in absolute w-full pointer-events-none" enter-from-class="opacity-0 translate-y-2" leave-to-class="opacity-0 -translate-y-2" move-class="transition-transform duration-250 ease-out">
                <div v-for="app in filteredExternalApps" :key="app.filename" :class="[themeClasses.windowBorder, themeClasses.explorerResultItem, themeClasses.explorerResultItemHover]" class="rounded-lg border overflow-hidden transition-all duration-200">
                  <div @click="togglePackageExpand(app.filename)" class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150">
                    <div class="flex-shrink-0">
                      <div class="w-2 h-2 rounded-full" :class="app.is_valid ? 'bg-green-500' : 'bg-red-500'" />
                    </div>

                    <BaseImage v-if="app.manifest?.name && app.manifest?.icon" draggable="false" :src="`user-images/${app.manifest.name}${app.manifest.icon.substring(app.manifest.icon.lastIndexOf('.'))}`" :alt="app.manifest?.display_name || app.manifest?.name || ''" :class="[themeClasses.storeCardImageBack]" class="flex-shrink-0 w-9 h-9 rounded-lg object-cover drop-shadow-sm ring-[1px]" />
                    <div v-else class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg" :class="themeClasses.iconHolder">
                      <Icon :icon="app.is_valid ? packageIcon : alertIcon" :class="['w-5 h-5', themeClasses.explorerItemIcon]" />
                    </div>

                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h4 :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium truncate">
                          {{ app.manifest?.display_name || app.manifest?.name || app.filename }}
                        </h4>
                        <div v-if="app.is_installed" :class="[themeClasses.appPropsUpdateBadgeBg, themeClasses.appPropsUpdateBadgeBorder]" class="flex items-center gap-1 px-1.5 py-0.5 rounded-md border flex-shrink-0">
                          <span :class="[themeClasses.appPropsUpdateBadgeText]" class="text-[9px] font-semibold">Installed</span>
                        </div>
                      </div>
                      <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5 truncate">Packed by {{ app.manifest?.author || "Unknown author" }} &middot; {{ formatFileSize(app.size) }}</p>
                    </div>

                    <div class="flex-shrink-0">
                      <Icon :icon="expandedPackages.has(app.filename) ? chevronUpIcon : chevronDownIcon" :class="[themeClasses.windowPlaceholderText]" class="w-5 h-5 transition-transform duration-200" />
                    </div>
                  </div>

                  <Transition enter-active-class="transition-all duration-200 ease-out" leave-active-class="transition-all duration-200 ease-in" enter-from-class="max-h-0 opacity-0" enter-to-class="max-h-[500px] opacity-100" leave-from-class="max-h-[500px] opacity-100" leave-to-class="max-h-0 opacity-0">
                    <div v-if="expandedPackages.has(app.filename)" class="overflow-hidden">
                      <div class="px-4 pb-4 space-y-3">
                        <p v-if="app.manifest?.description" :class="['text-xs', themeClasses.windowPlaceholderText]">
                          {{ app.manifest.description }}
                        </p>

                        <div :class="['rounded-lg px-3 py-2.5 space-y-1.5', themeClasses.explorerResultItem, themeClasses.windowBorder]" class="border">
                          <div v-if="app.manifest?.docker_image" class="flex items-center gap-2 text-xs">
                            <Icon :icon="dockerIcon" :class="[themeClasses.explorerItemIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span :class="themeClasses.windowPlaceholderText" class="font-medium w-16 flex-shrink-0">Image</span>
                            <span :class="themeClasses.windowTitleTextFocused" class="font-mono truncate">{{ app.manifest.docker_image }}</span>
                          </div>
                          <div v-if="app.manifest?.version" class="flex items-center gap-2 text-xs">
                            <Icon :icon="tagIcon" :class="[themeClasses.explorerItemIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span :class="themeClasses.windowPlaceholderText" class="font-medium w-16 flex-shrink-0">Version</span>
                            <span :class="themeClasses.windowTitleTextFocused">{{ app.manifest.version }}</span>
                          </div>
                          <div v-if="app.manifest?.category" class="flex items-center gap-2 text-xs">
                            <Icon :icon="shapeIcon" :class="[themeClasses.explorerItemIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span :class="themeClasses.windowPlaceholderText" class="font-medium w-16 flex-shrink-0">Category</span>
                            <span :class="themeClasses.windowTitleTextFocused">{{ app.manifest.category }}</span>
                          </div>
                          <div class="flex items-center gap-2 text-xs">
                            <Icon :icon="fileIcon" :class="[themeClasses.explorerItemIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span :class="themeClasses.windowPlaceholderText" class="font-medium w-16 flex-shrink-0">File</span>
                            <span :class="themeClasses.windowTitleTextFocused" class="truncate">{{ app.filename }}</span>
                          </div>
                          <div v-if="app.hash" class="flex items-center gap-2 text-xs">
                            <Icon :icon="fingerprintIcon" :class="[themeClasses.explorerItemIcon]" class="w-3.5 h-3.5 flex-shrink-0" />
                            <span :class="themeClasses.windowPlaceholderText" class="font-medium w-16 flex-shrink-0">Hash</span>
                            <span :class="themeClasses.windowTitleTextFocused" class="font-mono truncate text-[10px]">{{ app.hash }}</span>
                          </div>
                        </div>

                        <p v-if="!app.is_valid" :class="themeClasses.packagerErrorText" class="flex items-center gap-1.5 text-xs">
                          <Icon :icon="alertIcon" class="w-3.5 h-3.5" />
                          {{ app.validation_message }}
                        </p>

                        <div class="grid grid-cols-2 gap-1.5">
                          <button
                            v-if="importedApps.find((a) => a.name === app.manifest?.name)"
                            @click.stop="
                              selectedImportedApp = app.manifest?.name;
                              exportImported();
                            "
                            :disabled="isExporting"
                            :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]"
                            class="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-xs"
                          >
                            <Icon :icon="isExporting ? loadingIcon : downloadIcon" :class="['w-3.5 h-3.5', isExporting ? 'animate-spin' : '']" />
                            <span>{{ isExporting ? "Exporting..." : "Download .hds" }}</span>
                          </button>
                          <button @click.stop="deletePackage(app.filename)" :disabled="app.is_installed || isPackageBeingInstalled(app.manifest?.name) || deletingApp === app.filename" :class="['flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-xs', app.is_installed || isPackageBeingInstalled(app.manifest?.name) || deletingApp === app.filename ? `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed border-transparent` : `${themeClasses.packagerDangerButtonBg} ${themeClasses.packagerDangerButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer border-transparent`]" :title="app.is_installed ? 'Cannot delete: App is installed. Uninstall it from App Store first.' : isPackageBeingInstalled(app.manifest?.name) ? 'Cannot delete: App is currently installing' : deletingApp === app.filename ? 'Deleting...' : 'Delete package'">
                            <Icon :icon="deletingApp === app.filename ? loadingIcon : deleteIcon" :class="['w-3.5 h-3.5', deletingApp === app.filename ? 'animate-spin' : '']" />
                            <span>{{ deletingApp === app.filename ? "Deleting..." : "Delete .hds" }}</span>
                          </button>
                          <button v-if="app.is_valid" @click.stop="openBadgeDialog(app)" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="col-span-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-xs">
                            <Icon :icon="shareIcon" class="w-3.5 h-3.5" />
                            <span>Share your .hds Package</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </div>
              </TransitionGroup>
            </div>
          </template>

          <div class="pt-2">
            <h3 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider mb-4" :class="themeClasses.explorerGroupHeader">
              <Icon :icon="storePlusIcon" class="w-4 h-4" />
              <span>Full App Store Bundle</span>
            </h3>

            <div :class="[themeClasses.windowBorder, themeClasses.explorerResultItem]" class="hdstore-card rounded-lg border overflow-hidden">
              <div class="flex items-center gap-3 px-4 py-3">
                <div class="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Icon :icon="storePlusIcon" class="w-5 h-5 text-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <p :class="[themeClasses.windowTitleTextFocused]" class="text-sm font-medium">HomeDock OS App Store</p>
                  <p :class="[themeClasses.windowPlaceholderText]" class="text-xs mt-0.5">Bundle all your packages into a single file</p>
                </div>
              </div>
              <p :class="[themeClasses.windowPlaceholderText]" class="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider">Useful for:</p>
              <div :class="[themeClasses.windowPlaceholderText]" class="px-4 pb-3 grid hdstore-features gap-x-3 gap-y-1 text-[10px]">
                <div class="flex items-center gap-1.5"><Icon :icon="exportIcon" class="w-3 h-3 flex-shrink-0" /><span>Export all your .hds packages</span></div>
                <div class="flex items-center gap-1.5"><Icon :icon="importIcon" class="w-3 h-3 flex-shrink-0" /><span>Import them on any instance</span></div>
                <div class="flex items-center gap-1.5"><Icon :icon="downloadIcon" class="w-3 h-3 flex-shrink-0" /><span>Back up your curated App Store</span></div>
                <div class="flex items-center gap-1.5"><Icon :icon="refreshIcon" class="w-3 h-3 flex-shrink-0" /><span>Migrate apps between your devices</span></div>
                <div class="flex items-center gap-1.5"><Icon :icon="shareIcon" class="w-3 h-3 flex-shrink-0" /><span>Share with any other user</span></div>
                <div class="flex items-center gap-1.5"><Icon :icon="packageIcon" class="w-3 h-3 flex-shrink-0" /><span>Up to 300 packages per .hdstore file</span></div>
              </div>
              <div class="px-4 pb-3 flex gap-2">
                <label :class="[isPreviewingStore ? [themeClasses.packagerButtonDisabledBg, themeClasses.packagerButtonDisabledText, 'cursor-not-allowed border-transparent'] : [themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover, 'cursor-pointer border']]" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-xs">
                  <Icon :icon="isPreviewingStore ? loadingIcon : importIcon" :class="['w-3.5 h-3.5', isPreviewingStore ? 'animate-spin' : '']" />
                  <span>{{ isPreviewingStore ? "Reading..." : "Import .hdstore" }}</span>
                  <input
                    type="file"
                    accept=".hdstore"
                    class="hidden"
                    :disabled="isPreviewingStore"
                    @change="
                      (e: Event) => {
                        const f = (e.target as HTMLInputElement).files?.[0];
                        if (f) importStore(f);
                        (e.target as HTMLInputElement).value = '';
                      }
                    "
                  />
                </label>
                <button v-if="externalApps.filter((a) => a.is_valid).length > 0" @click="showExportStoreDialog = true" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover, 'cursor-pointer border']" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150 text-xs">
                  <Icon :icon="exportIcon" class="w-3.5 h-3.5" />
                  <span>Export .hdstore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <AppDialog v-model:visible="isEditingCompose" type="info" title="Edit Docker Compose" ok-text="Save & Re-parse" cancel-text="Cancel" :ok-cancel="true" :width="1200" @ok="saveComposeEdit" @cancel="cancelComposeEdit">
      <div class="hidden lg:grid lg:grid-cols-2 gap-4" style="height: 480px">
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="fileCodeIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
            <label :class="['block text-sm font-medium', themeClasses.packagerText]">Docker Compose Content</label>
          </div>
          <textarea v-model="composeContent" :class="[themeClasses.hubTextArea, 'compose-editor w-full flex-1 rounded-lg font-mono text-xs resize-none p-3']" placeholder="Paste your docker-compose.yml content here..." spellcheck="false"></textarea>
        </div>

        <div class="flex flex-col overflow-hidden">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="codeIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
            <label :class="['block text-sm font-medium', themeClasses.packagerText]">DevHooks Reference</label>
            <span :class="['text-xs px-2 py-0.5 rounded', themeClasses.packagerBadgeBg, themeClasses.packagerBadgeText]">{{ devHooks.length }} available</span>
          </div>
          <div class="flex-1 overflow-y-auto pr-2">
            <p :class="['text-xs mb-3 pb-3 border-b', themeClasses.packagerTextMuted, themeClasses.packagerCardBorder]">Use these placeholders in your Docker Compose file. They will be automatically replaced when installing the package.</p>
            <div class="space-y-3">
              <div v-for="hook in devHooks" :key="hook.placeholder" :class="['p-3 rounded-lg border', usedDevHooks.includes(hook.placeholder) ? 'border-green-600/50' : themeClasses.packagerCardBorder, themeClasses.packagerHookItemBg]">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2">
                      <code :class="['text-xs font-mono px-2 py-0.5 rounded font-semibold', themeClasses.packagerCodeBg, themeClasses.packagerCodeText]">
                        {{ hook.placeholder }}
                      </code>
                      <span v-if="usedDevHooks.includes(hook.placeholder)" :class="['text-xs', themeClasses.packagerSuccessText]">Used</span>
                    </div>
                    <p :class="['text-xs', themeClasses.packagerTextMuted]">
                      {{ hook.description }}
                    </p>
                    <div :class="['text-xs font-mono p-2 rounded border', themeClasses.packagerExampleBg, themeClasses.packagerExampleBorder]">
                      <p :class="['leading-relaxed', themeClasses.packagerExampleText]" style="white-space: pre-line">{{ hook.example }}</p>
                    </div>
                  </div>
                  <button @click="copyToClipboard(hook.placeholder)" :class="['p-1.5 rounded transition-colors flex-shrink-0', themeClasses.packagerCopyHover]" title="Copy to clipboard">
                    <Icon :icon="copyIcon" :class="['w-4 h-4', themeClasses.packagerCopyIcon]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:hidden flex flex-col space-y-4">
        <div class="flex flex-col">
          <div class="flex items-center gap-2 mb-2">
            <Icon :icon="fileCodeIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
            <label :class="['block text-sm font-medium', themeClasses.packagerText]">Docker Compose Content</label>
          </div>
          <textarea v-model="composeContent" :class="[themeClasses.hubTextArea, 'compose-editor w-full rounded-lg font-mono text-xs resize-none p-3']" placeholder="Paste your docker-compose.yml content here..." spellcheck="false" rows="15"></textarea>
        </div>

        <div :class="['rounded-lg border', themeClasses.packagerCardBorder]">
          <button @click="showDevHooks = !showDevHooks" :class="['w-full px-4 py-3 flex items-center justify-between text-left transition-colors rounded-t-lg', 'hover:opacity-80']">
            <div class="flex items-center gap-2">
              <Icon :icon="codeIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
              <span :class="['font-medium text-sm', themeClasses.packagerText]">DevHooks Reference</span>
              <span :class="['text-xs px-2 py-0.5 rounded', themeClasses.packagerBadgeBg, themeClasses.packagerBadgeText]">{{ devHooks.length }} available</span>
            </div>
            <Icon :icon="showDevHooks ? chevronUpIcon : chevronDownIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
          </button>

          <div v-if="showDevHooks" :class="['p-4 border-t max-h-96 overflow-y-auto', themeClasses.packagerCardBorder]">
            <p :class="['text-xs mb-3 pb-3 border-b', themeClasses.packagerTextMuted, themeClasses.packagerCardBorder]">Use these placeholders in your Docker Compose file. They will be automatically replaced when installing the package.</p>
            <div class="space-y-3">
              <div v-for="hook in devHooks" :key="hook.placeholder" :class="['p-3 rounded-lg border', usedDevHooks.includes(hook.placeholder) ? 'border-green-600/50' : themeClasses.packagerCardBorder, themeClasses.packagerHookItemBg]">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <code :class="['text-xs font-mono px-2 py-0.5 rounded-xl', themeClasses.packagerCodeBg, themeClasses.packagerCodeText]">
                        {{ hook.placeholder }}
                      </code>
                      <span v-if="usedDevHooks.includes(hook.placeholder)" :class="['text-xs', themeClasses.packagerSuccessText]">Used</span>
                    </div>
                    <p :class="['text-xs', themeClasses.packagerTextMuted]">
                      {{ hook.description }}
                    </p>
                    <div :class="['text-xs font-mono p-2 rounded border', themeClasses.packagerExampleBg, themeClasses.packagerExampleBorder]">
                      <p :class="['leading-relaxed', themeClasses.packagerExampleText]" style="white-space: pre-line">{{ hook.example }}</p>
                    </div>
                  </div>
                  <button @click="copyToClipboard(hook.placeholder)" :class="['p-1.5 rounded transition-colors flex-shrink-0', themeClasses.packagerCopyHover]" title="Copy to clipboard">
                    <Icon :icon="copyIcon" :class="['w-4 h-4', themeClasses.packagerCopyIcon]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showOverwriteDialog" type="error" title="Package Already Exists" ok-text="Close" :ok-cancel="false" @ok="closeConflictDialog">
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <Icon :icon="alertIcon" :class="['w-6 h-6', themeClasses.packagerErrorText]" />
          <div class="flex-1">
            <p :class="['font-semibold mb-2', themeClasses.packagerText]">Cannot import package</p>
            <p :class="['text-sm mb-2', themeClasses.packagerTextMuted]">
              The package <strong>{{ overwriteData?.displayName }}</strong> ({{ overwriteData?.appSlug }}) is already installed and has the following files:
            </p>
            <ul :class="['text-sm -space-y-1 mb-2', themeClasses.packageConflictFileList]">
              <li v-for="file in overwriteData?.existingFiles" :key="file" class="flex items-start gap-1">
                <span>•</span>
                <code class="text-xs font-mono">{{ file }}</code>
              </li>
            </ul>
            <div :class="[themeClasses.packageConflictInstructionBorder]">
              <p :class="['text-sm font-semibold mb-1', themeClasses.packageConflictInstructionTitle]">To upload a new version:</p>
              <p :class="['text-xs', themeClasses.packageConflictInstructionText]">
                1. Go to the <strong>"Imported Packages"</strong> section below<br />
                2. Delete the existing package completely<br />
                3. Then upload the new version
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>

    <PackagerBadgeDialog v-model:visible="showBadgeDialog" :app="badgeApp" />

    <AppDialog
      v-model:visible="showExportStoreDialog"
      type="info"
      title="Export .hdstore App Store Bundle"
      ok-text="Export Selected"
      cancel-text="Cancel"
      :ok-cancel="true"
      :width="500"
      @ok="exportStore"
      @cancel="
        showExportStoreDialog = false;
        selectedStoreApps = new Set();
      "
    >
      <div class="space-y-3">
        <p :class="['text-xs', themeClasses.packagerTextMuted]">Select packages to include in the .hdstore bundle (max 300).</p>

        <button @click="selectAllStoreApps" :class="[themeClasses.windowBorder, themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-150 text-xs">
          {{ selectedStoreApps.size === externalApps.filter((a) => a.is_valid).length ? "Deselect All" : "Select All" }}
        </button>

        <div class="max-h-64 overflow-y-auto space-y-1.5">
          <div v-for="app in externalApps.filter((a) => a.is_valid && a.manifest?.name)" :key="app.manifest.name" @click="toggleStoreAppSelection(app.manifest.name)" :class="['flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-all duration-150', selectedStoreApps.has(app.manifest.name) ? 'border-blue-500/50 bg-blue-500/10' : [themeClasses.windowBorder, themeClasses.explorerResultItem]]">
            <div class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" :class="selectedStoreApps.has(app.manifest.name) ? 'bg-blue-500 border-blue-500' : themeClasses.windowBorder">
              <Icon v-if="selectedStoreApps.has(app.manifest.name)" :icon="checkIcon" class="w-3 h-3 text-white" />
            </div>
            <BaseImage v-if="app.manifest?.icon" draggable="false" :src="`user-images/${app.manifest.name}${app.manifest.icon.substring(app.manifest.icon.lastIndexOf('.'))}`" :alt="app.manifest.display_name || app.manifest.name" :class="[themeClasses.storeCardImageBack]" class="flex-shrink-0 w-7 h-7 rounded-md object-cover ring-[1px]" />
            <div class="flex-1 min-w-0">
              <p :class="themeClasses.windowTitleTextFocused" class="text-xs font-medium truncate">{{ app.manifest.display_name || app.manifest.name }}</p>
              <p :class="themeClasses.packagerTextMuted" class="text-[10px] truncate">Packed by {{ app.manifest.author || "Unknown" }} &middot; {{ app.manifest.docker_image || "latest" }}</p>
            </div>
            <span :class="themeClasses.packagerTextMuted" class="text-[10px] flex-shrink-0">{{ formatStoreSize(app.size) }}</span>
          </div>
        </div>

        <div class="grid transition-all duration-200 ease-in-out" :style="{ gridTemplateRows: selectedStoreApps.size > 0 ? '1fr' : '0fr' }">
          <div class="overflow-hidden">
            <p :class="['text-xs', themeClasses.packagerSuccessText]">{{ selectedStoreApps.size }} package(s) selected</p>
          </div>
        </div>
      </div>
    </AppDialog>

    <AppDialog
      v-model:visible="showImportStoreDialog"
      type="info"
      title="Import .hdstore App Store Bundle"
      :ok-text="isImportingStore ? 'Importing...' : importStorePreview ? `Import ${importStorePreview.packages.filter((p: any) => !p.already_exists).length} Package(s)` : 'Import'"
      cancel-text="Cancel"
      :ok-cancel="true"
      :ok-disabled="isImportingStore || !importStorePreview || importStorePreview.packages.filter((p: any) => !p.already_exists).length === 0"
      :loading="isImportingStore"
      :width="500"
      :close-on-ok="false"
      :mask-closable="!isImportingStore"
      @ok="confirmImportStore"
      @cancel="
        showImportStoreDialog = false;
        importStorePreview = null;
        pendingImportFile = null;
      "
    >
      <div v-if="importStorePreview" class="space-y-3">
        <p :class="['text-xs', themeClasses.packagerTextMuted]">
          {{ importStorePreview.package_count }} package(s) found in this bundle.
          <template v-if="importStorePreview.packages.filter((p: any) => p.already_exists).length > 0"> {{ importStorePreview.packages.filter((p: any) => p.already_exists).length }} already exist and will be skipped. </template>
        </p>

        <div class="max-h-64 overflow-y-auto space-y-1.5">
          <div v-for="pkg in importStorePreview.packages" :key="pkg.filename" :class="['flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150', pkg.already_exists ? 'opacity-50' : '', [themeClasses.windowBorder, themeClasses.explorerResultItem]]">
            <div class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md" :class="themeClasses.iconHolder">
              <Icon :icon="pkg.already_exists ? checkIcon : packageIcon" :class="['w-4 h-4', themeClasses.explorerItemIcon]" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p :class="themeClasses.windowTitleTextFocused" class="text-xs font-medium truncate">{{ pkg.display_name || pkg.name || pkg.filename }}</p>
                <div v-if="pkg.already_exists" :class="[themeClasses.appPropsUpdateBadgeBg, themeClasses.appPropsUpdateBadgeBorder]" class="flex items-center px-1.5 py-0.5 rounded-md border flex-shrink-0">
                  <span :class="[themeClasses.appPropsUpdateBadgeText]" class="text-[9px] font-semibold">Exists</span>
                </div>
              </div>
              <p :class="themeClasses.packagerTextMuted" class="text-[10px] truncate">{{ pkg.author || "Unknown" }} &middot; {{ pkg.category || "Uncategorized" }} &middot; {{ pkg.version || "latest" }}</p>
            </div>
          </div>
        </div>
      </div>
    </AppDialog>

    <StatusBar :icon="packageIcon" :message="activeTab === 'generator' ? 'Packager' : `${externalApps.length} ${externalApps.length === 1 ? 'package' : 'packages'} available`" :info="activeTab === 'generator' ? (usedDevHooks.length ? `${usedDevHooks.length} DevHooks detected` : 'Ready to create') : `${importedApps.length} imported apps`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="packageIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Packager</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p v-if="activeTab === 'generator'">Create custom .hds packages with your docker-compose files to be able to import any application into the HomeDock OS App Store. Use DevHooks to make your packages dynamic and compatible with different environments such as Windows, macOS and Linux.</p>
            <p v-else>Import packages from others or export your already imported apps, share them, keep them private or publish your own .hds files on GitHub. Once exported, all packages are verified with SHA256 hashes to ensure integrity and avoid third party modifications.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";
import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { Icon } from "@iconify/vue";
import { Input, Select, SelectOption, Button, UploadDragger, Segmented, message } from "ant-design-vue";

import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";
import BaseImage from "../__Components__/BaseImage.vue";
import PackagerBadgeDialog from "../__Components__/PackagerBadgeDialog.vue";

import packageIcon from "@iconify-icons/mdi/package-variant";
import importIcon from "@iconify-icons/mdi/import";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import refreshIcon from "@iconify-icons/mdi/refresh";
import loadingIcon from "@iconify-icons/mdi/loading";
import checkIcon from "@iconify-icons/mdi/check-circle";
import alertIcon from "@iconify-icons/mdi/alert-circle";
import deleteIcon from "@iconify-icons/mdi/delete";
import fileCodeIcon from "@iconify-icons/mdi/file-code";
import imageIcon from "@iconify-icons/mdi/image";
import codeIcon from "@iconify-icons/mdi/code-braces";
import copyIcon from "@iconify-icons/mdi/content-copy";
import chevronDownIcon from "@iconify-icons/mdi/chevron-down";
import chevronUpIcon from "@iconify-icons/mdi/chevron-up";
import sparklesIcon from "@iconify-icons/mdi/sparkles";
import folderMultipleIcon from "@iconify-icons/mdi/folder-multiple";
import editIcon from "@iconify-icons/mdi/pencil";
import tagIcon from "@iconify-icons/mdi/tag";
import dockerIcon from "@iconify-icons/mdi/docker";
import fileIcon from "@iconify-icons/mdi/file-outline";
import shapeIcon from "@iconify-icons/mdi/shape-outline";
import fingerprintIcon from "@iconify-icons/mdi/fingerprint";
import storeIcon from "@iconify-icons/mdi/widgets-outline";
import chevronRightIcon from "@iconify-icons/mdi/chevron-right";
import shareIcon from "@iconify-icons/mdi/share-variant-outline";
import exportIcon from "@iconify-icons/mdi/export-variant";
import storePlusIcon from "@iconify-icons/mdi/store-plus";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import closeCircleIcon from "@iconify-icons/mdi/close-circle";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const { confirm } = useDialog();
const appStore = useAppStore();
const installationStore = useInstallationStore();
const desktopStore = useDesktopStore();

const activeTab = ref<"generator" | "manager">("generator");
const segmentedOptions = [
  { value: "generator", payload: { label: ".hds Package Generator", icon: sparklesIcon } },
  { value: "manager", payload: { label: ".hds Package Manager", icon: folderMultipleIcon } },
];

const segmentedContainerRef = ref<HTMLElement | null>(null);
const onSegmentedDrag = (e: MouseEvent) => {
  const el = segmentedContainerRef.value;
  if (!el || el.scrollWidth <= el.clientWidth) return;
  const startX = e.pageX;
  const startScroll = el.scrollLeft;
  const onMove = (ev: MouseEvent) => {
    el.scrollLeft = startScroll - (ev.pageX - startX);
  };
  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  };
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
};

watch(activeTab, (val) => {
  nextTick(() => {
    const container = segmentedContainerRef.value;
    if (!container || container.scrollWidth <= container.clientWidth) return;
    const items = container.querySelectorAll<HTMLElement>(".ant-segmented-item");
    const idx = segmentedOptions.findIndex((o) => o.value === val);
    const target = items[idx];
    if (!target) return;
    const left = target.offsetLeft - (container.clientWidth - target.offsetWidth) / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  });
});

const MAX_HDS_PACKAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_COMPOSE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ICON_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const showDevHooks = ref(false);
const expandedPackages = ref<Set<string>>(new Set());

const togglePackageExpand = (filename: string) => {
  const next = new Set(expandedPackages.value);
  if (next.has(filename)) {
    next.delete(filename);
  } else {
    next.add(filename);
  }
  expandedPackages.value = next;
};

const devHooks = [
  {
    placeholder: "[[HD_LOCAL_IP]]",
    description: "Local IP address of the system",
    example: "192.168.1.100",
  },
  {
    placeholder: "[[HD_INTERNET_IP]]",
    description: "Public internet IP address",
    example: "203.0.113.45",
  },
  {
    placeholder: "[[HD_USER_NAME]]",
    description: "HomeDock OS Username",
    example: "admin",
  },
  {
    placeholder: "[[HD_PASSWORD]]",
    description: "Auto-generated simple password",
    example: "apple_banana_1234",
  },
  {
    placeholder: "[[HD_SYSTEM_PASSWORD]]",
    description: "Auto-generated secure password (20 chars)",
    example: "aB3dE5fG7hI9jK1lM3nO",
  },
  {
    placeholder: "[[HD_RND_STR]]",
    description: "Random string (16 chars)",
    example: "xY4zW9qR2sT7vU1p",
  },
  {
    placeholder: "[[INSTALL_PATH]]",
    description: "App configuration storage path",
    example: "Linux: /DATA/HomeDock/AppData/\nmacOS: /Users/{username}/HomeDock/AppData/\nWindows: /mnt/c/HomeDock/AppData/",
  },
  {
    placeholder: "[[APP_MOUNT_POINT]]",
    description: "App data storage path",
    example: "Linux: /DATA/HomeDock/AppFolders/\nmacOS: /Users/{username}/HomeDock/AppFolders/\nWindows: /mnt/c/HomeDock/AppFolders/",
  },
  {
    placeholder: "[[SSL_CERT_PATH]]",
    description: "SSL certificates directory path",
    example: "Linux: /DATA/SSLCerts\nmacOS: /Users/{username}/HomeDock/SSLCerts\nWindows: /mnt/c/HomeDock/SSLCerts\n\nMake sure to mount them as :ro (read-only) in your Docker Compose.",
  },
];

const composeFile = ref<File | null>(null);
const composeFileList = ref<any[]>([]);
const composeContent = ref<string>("");
const composeContentBackup = ref<string>("");
const isEditingCompose = ref(false);
const iconFile = ref<File | null>(null);
const iconFileList = ref<any[]>([]);
const iconPreview = ref<string | null>(null);
const isCreating = ref(false);
const parsedData = ref<any>({});

const usedDevHooks = computed(() => {
  const content = composeContent.value;
  if (!content) return [];

  return devHooks.map((hook) => hook.placeholder).filter((placeholder) => content.includes(placeholder));
});

const newPackage = ref({
  slug: "",
  display_name: "",
  category: "Media",
  type: "",
  description: "",
  docker_image: "",
  author: "",
  version: "latest",
});

const isValidSlug = (slug: string): boolean => {
  if (!slug) return false;
  if (!/^[a-z0-9\-]+$/.test(slug)) return false;
  if (slug[0] === "-" || slug[slug.length - 1] === "-") return false;
  return true;
};

const canCreate = computed(() => {
  return composeFile.value && iconFile.value && newPackage.value.slug && isValidSlug(newPackage.value.slug) && newPackage.value.display_name && newPackage.value.category && newPackage.value.type && newPackage.value.description && newPackage.value.docker_image && newPackage.value.author;
});

const importedApps = ref<any[]>([]);
const selectedImportedApp = ref("");
const isExporting = ref(false);

const selectedPackage = ref<File | null>(null);
const packageFileList = ref<any[]>([]);
const isUploading = ref(false);

const showOverwriteDialog = ref(false);
const overwriteData = ref<{
  displayName: string;
  appSlug: string;
  existingFiles: string[];
} | null>(null);

const externalApps = ref<any[]>([]);
const packageSearch = ref("");
const filteredExternalApps = computed(() => {
  const q = packageSearch.value.trim().toLowerCase();
  if (!q) return externalApps.value;
  return externalApps.value.filter((app: any) => {
    const name = (app.manifest?.display_name || app.manifest?.name || app.filename || "").toLowerCase();
    const author = (app.manifest?.author || "").toLowerCase();
    const category = (app.manifest?.category || "").toLowerCase();
    return name.includes(q) || author.includes(q) || category.includes(q);
  });
});
const isLoadingExternal = ref(false);
const deletingApp = ref<string | null>(null);

onMounted(() => {
  loadData();
});

watch(
  () => appStore.apps,
  () => {
    externalApps.value = externalApps.value.map((pkg) => {
      const appInStore = appStore.apps.find((app) => app.name === pkg.manifest?.name);
      return {
        ...pkg,
        is_installed: appInStore?.is_installed || false,
      };
    });
  },
  { deep: true },
);

const loadData = async () => {
  await Promise.all([loadImportedApps(), loadExternalApps()]);
};

const loadImportedApps = async () => {
  try {
    const response = await axios.get("/api/pkg/imported", {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    if (response.data.success) {
      importedApps.value = response.data.apps;

      if (importedApps.value.length > 0) {
        selectedImportedApp.value = importedApps.value[0].name;
      } else {
        selectedImportedApp.value = "";
      }
    }
  } catch (error) {
    console.error("Error loading imported apps:", error);
  }
};

const loadExternalApps = async () => {
  expandedPackages.value = new Set();

  const isFirstLoad = externalApps.value.length === 0 && !isLoadingExternal.value;
  if (isFirstLoad) {
    isLoadingExternal.value = true;
  }

  try {
    const response = await axios.get("/api/pkg/list", {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    if (response.data.success) {
      externalApps.value = response.data.apps;
    }
  } catch (error) {
    console.error("Error loading external apps:", error);
  } finally {
    isLoadingExternal.value = false;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

const isPackageBeingInstalled = (appSlug: string): boolean => {
  return installationStore.currentlyInstalling === appSlug || installationStore.queue.includes(appSlug);
};

const handleComposeUpload = async ({ file }: any) => {
  return false;
};

const handleComposeChange = async (info: any) => {
  const { fileList } = info;
  if (fileList.length > 0) {
    const file = fileList[0].originFileObj;

    if (file.size > MAX_COMPOSE_FILE_SIZE) {
      message.error(`Compose file is too large. Maximum size: ${formatFileSize(MAX_COMPOSE_FILE_SIZE)}`);
      composeFileList.value = [];
      return;
    }

    composeFile.value = file;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;

      if (!content || content.trim().length === 0) {
        message.error("File is empty. Please upload a valid Docker Compose file.");
        composeFileList.value = [];
        composeFile.value = null;
        return;
      }

      if (/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/.test(content.slice(0, 1024))) {
        message.error("Binary file detected. Docker Compose must be a plain text YML file.");
        composeFileList.value = [];
        composeFile.value = null;
        composeContent.value = "";
        return;
      }

      if (!/:\s*\S/.test(content)) {
        message.error("Invalid YML format. File must contain YML key-value pairs (key: value).");
        composeFileList.value = [];
        composeFile.value = null;
        composeContent.value = "";
        return;
      }

      const dangerousPatterns = ["<?php", "<script", "eval(", "exec(", "__import__"];
      for (const pattern of dangerousPatterns) {
        if (content.includes(pattern)) {
          message.error(`Dangerous content detected: ${pattern}`);
          composeFileList.value = [];
          composeFile.value = null;
          composeContent.value = "";
          return;
        }
      }

      composeContent.value = content;
      await parseComposeFromContent();
    };
    reader.readAsText(file, "UTF-8");
  } else {
    composeFile.value = null;
    composeContent.value = "";
  }
};

const parseComposeFromContent = async () => {
  if (!composeContent.value) return;

  try {
    const blob = new Blob([composeContent.value], { type: "text/yaml" });
    const file = new File([blob], composeFile.value?.name || "docker-compose.yml", { type: "text/yaml" });

    const formData = new FormData();
    formData.append("compose", file);

    const response = await axios.post("/api/pkg/parse-compose", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    if (response.status === 200) {
      parsedData.value = response.data.data || {};

      if (parsedData.value.image) {
        const parts = parsedData.value.image.split(":");
        newPackage.value.docker_image = parts[0];
        if (parts[1]) {
          newPackage.value.version = parts[1];
        }
      }

      if (parsedData.value.container_name) {
        const containerName = parsedData.value.container_name;

        newPackage.value.slug = containerName.toLowerCase();

        newPackage.value.display_name = containerName.charAt(0).toUpperCase() + containerName.slice(1);
      }
    }
  } catch (error) {
    console.error("Error parsing compose:", error);
  }
};

const openComposeEditor = () => {
  composeContentBackup.value = composeContent.value;
  isEditingCompose.value = true;
};

const saveComposeEdit = async () => {
  await parseComposeFromContent();
};

const cancelComposeEdit = () => {
  composeContent.value = composeContentBackup.value;
  isEditingCompose.value = false;
};

const beforeIconUpload = (file: any) => {
  const validTypes = ["image/jpeg", "image/png", "image/jpg"];
  const isValidType = validTypes.includes(file.type);

  if (!isValidType) {
    message.error("Please upload a .jpg, .jpeg, or .png file");
    return false;
  }

  const isValidSize = file.size <= MAX_ICON_FILE_SIZE;
  if (!isValidSize) {
    message.error(`Icon file is too large. Maximum size: ${formatFileSize(MAX_ICON_FILE_SIZE)}`);
    return false;
  }

  return true;
};

const handleIconUpload = async ({ file }: any) => {
  return false;
};

const handleIconChange = (info: any) => {
  const { fileList } = info;
  if (fileList.length > 0) {
    const file = fileList[0].originFileObj;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);

      const isJPEG = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

      if (!isJPEG && !isPNG) {
        message.error("Invalid image format. Only JPG and PNG images are allowed.");
        iconFileList.value = [];
        iconFile.value = null;
        iconPreview.value = null;
        return;
      }

      iconFile.value = file;

      const previewReader = new FileReader();
      previewReader.onload = (e) => {
        iconPreview.value = e.target?.result as string;
      };
      previewReader.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
  } else {
    iconFile.value = null;
    iconPreview.value = null;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  message.success(`Copied: ${text}`);
};

const createPackage = async () => {
  if (!canCreate.value) return;

  isCreating.value = true;

  try {
    const formData = new FormData();

    if (composeContent.value) {
      const blob = new Blob([composeContent.value], { type: "text/yaml" });
      const file = new File([blob], composeFile.value?.name || "docker-compose.yml", { type: "text/yaml" });
      formData.append("compose", file);
    } else {
      formData.append("compose", composeFile.value!);
    }

    formData.append("icon", iconFile.value!);
    formData.append("slug", newPackage.value.slug);
    formData.append("display_name", newPackage.value.display_name);
    formData.append("category", newPackage.value.category);
    formData.append("type", newPackage.value.type);
    formData.append("description", newPackage.value.description);
    formData.append("docker_image", newPackage.value.docker_image);
    formData.append("author", newPackage.value.author);
    formData.append("version", newPackage.value.version);

    const response = await axios.post("/api/pkg/create", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${newPackage.value.slug}.hds`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    message.success(`Successfully created ${newPackage.value.slug}.hds`);

    composeFile.value = null;
    composeFileList.value = [];
    composeContent.value = "";
    iconFile.value = null;
    iconFileList.value = [];
    iconPreview.value = null;
    parsedData.value = {};
    newPackage.value = {
      slug: "",
      display_name: "",
      category: "Media",
      type: "",
      description: "",
      docker_image: "",
      author: "",
      version: "latest",
    };
  } catch (error) {
    console.error("Creation error:", error);
    message.error("Creation failed. Please try again.");
  } finally {
    isCreating.value = false;
  }
};

const exportImported = async () => {
  if (!selectedImportedApp.value) return;

  isExporting.value = true;

  try {
    const response = await axios.get(`/api/pkg/export-imported?app_name=${selectedImportedApp.value}`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedImportedApp.value}.hds`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    message.success(`Successfully exported ${selectedImportedApp.value}.hds`);
  } catch (error) {
    console.error("Export error:", error);
    message.error("Export failed. Please try again.");
  } finally {
    isExporting.value = false;
  }
};

const handlePackageUploadRequest = async ({ file }: any) => {
  return false;
};

const uploadQueue: File[] = [];
let processingQueue = false;

const validateHdsFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!file.name.endsWith(".hds")) {
      message.error(`"${file.name}" is not a .hds file`);
      return resolve(false);
    }
    if (file.size > MAX_HDS_PACKAGE_SIZE) {
      message.error(`"${file.name}" is too large. Maximum size: ${formatFileSize(MAX_HDS_PACKAGE_SIZE)}`);
      return resolve(false);
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const bytes = new Uint8Array(e.target?.result as ArrayBuffer);
      const isZIP = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
      if (!isZIP) {
        message.error(`"${file.name}" is not a valid HDS package`);
        return resolve(false);
      }
      resolve(true);
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

const uploadSinglePackage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post("/api/pkg/upload", formData, {
    headers: {
      "X-HomeDock-CSRF-Token": csrfToken.value,
    },
  });

  if (!response.data.success) {
    message.error(`Upload failed: ${response.data.message}`);
    return;
  }

  const displayName = response.data.display_name || file.name;
  message.success(`Successfully imported ${displayName}!`);
};

const processUploadQueue = async () => {
  if (processingQueue) return;
  processingQueue = true;
  isUploading.value = true;

  try {
    while (uploadQueue.length > 0) {
      const file = uploadQueue.shift()!;
      const valid = await validateHdsFile(file);
      if (!valid) continue;

      try {
        await uploadSinglePackage(file);
      } catch (error: any) {
        console.error("Upload error:", error);
        if (error.response?.status === 409 && error.response?.data?.code === "PACKAGE_EXISTS") {
          selectedPackage.value = file;
          overwriteData.value = {
            displayName: error.response.data.display_name,
            appSlug: error.response.data.app_slug,
            existingFiles: error.response.data.existing_files,
          };
          showOverwriteDialog.value = true;
        } else {
          message.error(`Failed to import "${file.name}".`);
        }
      }
    }

    loadExternalApps();
    loadImportedApps();
    await appStore.loadApps(csrfToken.value);
  } finally {
    processingQueue = false;
    isUploading.value = false;
    selectedPackage.value = null;
    packageFileList.value = [];
  }
};

const handlePackageChange = (info: any) => {
  const file = info.file?.originFileObj;
  if (!file) return;

  if (!uploadQueue.some((f) => f.name === file.name && f.size === file.size)) {
    uploadQueue.push(file);
  }
  packageFileList.value = [];
  processUploadQueue();
};

const uploadPackage = async () => {
  if (!selectedPackage.value) return;
  isUploading.value = true;
  try {
    await uploadSinglePackage(selectedPackage.value);
    selectedPackage.value = null;
    packageFileList.value = [];
    loadExternalApps();
    loadImportedApps();
    await appStore.loadApps(csrfToken.value);
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error.response?.status === 409 && error.response?.data?.code === "PACKAGE_EXISTS") {
      overwriteData.value = {
        displayName: error.response.data.display_name,
        appSlug: error.response.data.app_slug,
        existingFiles: error.response.data.existing_files,
      };
      showOverwriteDialog.value = true;
    } else {
      message.error("Upload failed. Please try again.");
    }
  } finally {
    isUploading.value = false;
  }
};

const openAppStore = () => {
  desktopStore.openSystemApp("appstore");
};

const badgeApp = ref<any>(null);
const showBadgeDialog = ref(false);

const openBadgeDialog = (app: any) => {
  badgeApp.value = app;
  showBadgeDialog.value = true;
};

const showExportStoreDialog = ref(false);
const selectedStoreApps = ref<Set<string>>(new Set());
const isExportingStore = ref(false);
const isImportingStore = ref(false);
const isPreviewingStore = ref(false);

const showImportStoreDialog = ref(false);
const importStorePreview = ref<any>(null);
const pendingImportFile = ref<File | null>(null);

const MAX_HDSTORE_PACKAGES = 300;

const toggleStoreAppSelection = (slug: string) => {
  const next = new Set(selectedStoreApps.value);
  if (next.has(slug)) next.delete(slug);
  else if (next.size < MAX_HDSTORE_PACKAGES) next.add(slug);
  selectedStoreApps.value = next;
};

const selectAllStoreApps = () => {
  const validApps = externalApps.value.filter((a) => a.is_valid && a.manifest?.name);
  if (selectedStoreApps.value.size === validApps.length) {
    selectedStoreApps.value = new Set();
  } else {
    selectedStoreApps.value = new Set(validApps.slice(0, MAX_HDSTORE_PACKAGES).map((a) => a.manifest.name));
  }
};

const formatStoreSize = (bytes: number) => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const exportStore = async () => {
  if (selectedStoreApps.value.size === 0) return;
  isExportingStore.value = true;

  try {
    const apps = Array.from(selectedStoreApps.value).join(",");
    const response = await axios.get(`/api/pkg/export-hdstore?apps=${encodeURIComponent(apps)}`, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"] || "";
    const filenameMatch = disposition.match(/filename="?([^";\s]+)"?/);
    const filename = filenameMatch ? filenameMatch[1] : "HomeDockOSAppStore.hdstore";

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    message.success(`Exported ${selectedStoreApps.value.size} package(s)`);
    showExportStoreDialog.value = false;
    selectedStoreApps.value = new Set();
  } catch {
    message.error("Export failed. Please try again.");
  } finally {
    isExportingStore.value = false;
  }
};

const importStore = async (file: File) => {
  if (!file.name.endsWith(".hdstore")) {
    message.error("File must be a .hdstore package");
    return;
  }
  isPreviewingStore.value = true;

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post("/api/pkg/preview-hdstore", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.success) {
      const existingNames = new Set(externalApps.value.map((a: any) => a.manifest?.name).filter(Boolean));

      const packages = (response.data.packages || []).map((pkg: any) => ({
        ...pkg,
        already_exists: existingNames.has(pkg.name),
      }));

      importStorePreview.value = { ...response.data, packages };
      pendingImportFile.value = file;
      showImportStoreDialog.value = true;
    } else {
      message.error(response.data.message || "Preview failed");
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || "Failed to read .hdstore file.");
  } finally {
    isPreviewingStore.value = false;
  }
};

const confirmImportStore = async () => {
  if (!pendingImportFile.value) return;
  isImportingStore.value = true;

  try {
    const formData = new FormData();
    formData.append("file", pendingImportFile.value);

    const response = await axios.post("/api/pkg/import-hdstore", formData, {
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data.success) {
      const { imported, skipped } = response.data;
      message.success(`Imported ${imported.length} package(s)`);
      if (skipped.length > 0) {
        message.warning(`${skipped.length} package(s) skipped`);
      }
      loadExternalApps();
      loadImportedApps();
      await appStore.loadApps(csrfToken.value);
    } else {
      message.error(response.data.message || "Import failed");
    }
  } catch (error: any) {
    message.error(error.response?.data?.message || "Import failed. Please try again.");
  } finally {
    isImportingStore.value = false;
    showImportStoreDialog.value = false;
    importStorePreview.value = null;
    pendingImportFile.value = null;
  }
};

const closeConflictDialog = () => {
  showOverwriteDialog.value = false;
  overwriteData.value = null;
  selectedPackage.value = null;
  packageFileList.value = [];
};

const deletePackage = async (filename: string) => {
  const app = externalApps.value.find((a) => a.filename === filename);
  const appSlug = app?.manifest?.name;

  if (app?.is_installed) {
    message.error("Cannot delete this package: The app is currently installed. Please uninstall it from the App Store first.");
    return;
  }

  if (appSlug && isPackageBeingInstalled(appSlug)) {
    message.error("Cannot delete this package: The app is currently installing. Please wait for the installation to complete.");
    return;
  }

  confirm({
    title: "Confirm Deletion",
    content: `Are you sure you want to completely delete ${filename}? This will remove it from the App Store.`,
    okText: "Delete",
    cancelText: "Cancel",
    onOk: async () => {
      await performDelete(filename);
    },
  });
};

const performDelete = async (filename: string) => {
  deletingApp.value = filename;

  try {
    const response = await axios.post(
      "/api/pkg/delete",
      { filename },
      {
        headers: {
          "Content-Type": "application/json",
          "X-HomeDock-CSRF-Token": csrfToken.value,
        },
      },
    );

    if (!response.data.success) {
      message.error(`Deletion failed: ${response.data.message}`);
      return;
    }

    message.success("Package and all associated files deleted successfully");

    loadExternalApps();
    loadImportedApps();

    await appStore.loadApps(csrfToken.value);
  } catch (error: any) {
    console.error("Deletion error:", error);

    if (error.response?.status === 409) {
      message.error(error.response.data.message || "Cannot delete: App is currently installed");
    } else {
      message.error("Deletion failed. Please try again.");
    }
  } finally {
    deletingApp.value = null;
  }
};

watch(
  () => newPackage.value.slug,
  (newSlug, oldSlug) => {
    if (!composeContent.value || !oldSlug || !newSlug) return;
    if (newSlug === oldSlug) return;

    try {
      const containerNameRegex = new RegExp(`(\\s*container_name:\\s*)${oldSlug}\\b`, "g");

      if (containerNameRegex.test(composeContent.value)) {
        composeContent.value = composeContent.value.replace(containerNameRegex, `$1${newSlug}`);
      } else {
        const serviceRegex = /(services:\s*\n\s+[\w-]+:\s*\n)/;
        if (serviceRegex.test(composeContent.value)) {
          composeContent.value = composeContent.value.replace(serviceRegex, `$1    container_name: ${newSlug}\n`);
        }
      }
    } catch (error) {
      console.error("Error updating container_name:", error);
    }
  },
);
</script>

<style scoped>
.packager-segmented-container {
  overflow-x: auto;
  scrollbar-width: none;
  padding: 1rem 1rem 0;
}

.packager-segmented-container::-webkit-scrollbar {
  display: none;
}

:deep(.compact-dragger .ant-upload-drag) {
  height: 160px !important;
  min-height: 160px !important;
  max-height: 160px !important;
}

:deep(.compact-dragger-sm .ant-upload-drag) {
  height: 120px !important;
  min-height: 120px !important;
  max-height: 120px !important;
}

:deep(.compact-dragger-pkg .ant-upload-drag) {
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  padding: 0 !important;
}

:deep(.compact-dragger-pkg .ant-upload-drag .ant-upload) {
  padding: 0 !important;
}

:deep(.compact-dragger .ant-upload-drag.ant-upload-drag-hover),
:deep(.compact-dragger-pkg .ant-upload-drag.ant-upload-drag-hover) {
  background: rgba(59, 130, 246, 0.15) !important;
}

.compose-editor {
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

.compose-editor:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
}

.hdstore-card {
  container-type: inline-size;
}

.hdstore-features {
  grid-template-columns: 1fr;
}

@container (min-width: 650px) {
  .hdstore-features {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
