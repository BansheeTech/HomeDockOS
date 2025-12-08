<!-- homedock-ui/vue3/static/js/__Apps__/AppPackager.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-packager flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-auto">
      <div class="flex gap-2 border-b" :class="themeClasses.packagerCardBorder">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id as 'generator' | 'manager'" :class="['px-4 py-3 font-medium text-sm transition-colors border-b-2 -mb-px flex items-center justify-center', activeTab === tab.id ? themeClasses.packagerTabActive : `border-transparent ${themeClasses.packagerTabHover}`, themeClasses.packagerText]">
          <Icon :icon="tab.icon" class="w-4 h-4 mr-2" />
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'generator'">
        <div :class="['mb-6 rounded-lg p-5', themeClasses.packagerCardBorder]">
          <div class="flex items-center gap-2 mb-4">
            <Icon :icon="plusIcon" :class="['w-6 h-6', themeClasses.packagerText]" />
            <h3 :class="['text-lg font-semibold', themeClasses.packagerText]">Package Generator</h3>
          </div>

          <div class="space-y-6">
            <div class="flex flex-col md:flex-row gap-4 md:gap-6">
              <div class="flex-1 flex flex-col">
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Docker Compose * </label>
                <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="composeFileList" name="compose" accept=".yml,.yaml" :multiple="false" :customRequest="handleComposeUpload" @change="handleComposeChange" :showUploadList="false" :maxCount="1" class="compact-dragger h-[180px]">
                  <div class="relative h-full">
                    <div class="flex items-center justify-center flex-col h-full" :class="composeFile ? 'pb-12' : ''">
                      <p class="ant-upload-drag-icon">
                        <Icon :icon="composeFile ? checkIcon : fileCodeIcon" :class="['text-4xl', composeFile ? themeClasses.packagerSuccessIcon : themeClasses.dropZoneDragIcon]" />
                      </p>
                      <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-sm']">
                        {{ composeFile ? composeFile.name : "Click or drag .yml/.yaml here" }}
                      </p>
                      <p v-if="parsedData.image" :class="['text-xs mt-1', themeClasses.packagerSuccessText]">✓ Detected: {{ parsedData.image }}</p>
                    </div>

                    <div v-if="composeFile" class="absolute bottom-0 left-0 right-0 p-2">
                      <Button @click.stop="openComposeEditor" :class="[themeClasses.scopeSelector]" class="w-full flex items-center justify-center" type="primary" size="small">
                        <Icon :icon="editIcon" class="w-4 h-4 mr-2" />
                        <span>Edit Compose</span>
                      </Button>
                    </div>
                  </div>
                </UploadDragger>
              </div>

              <div class="flex-1 flex flex-col">
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> App Icon * </label>
                <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="iconFileList" name="icon" accept=".jpg,.jpeg,.png" :multiple="false" :customRequest="handleIconUpload" @change="handleIconChange" :showUploadList="false" :maxCount="1" :beforeUpload="beforeIconUpload" class="compact-dragger h-[180px]">
                  <div class="flex items-center align-center justify-center flex-col h-full">
                    <p class="ant-upload-drag-icon">
                      <Icon v-if="!iconPreview" :icon="imageIcon" :class="['text-5xl', themeClasses.dropZoneDragIcon]" />
                      <img v-else :src="iconPreview" class="w-16 h-16 rounded object-cover" />
                    </p>
                    <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-sm']">
                      {{ iconFile ? iconFile.name : "Click or drag image here" }}
                    </p>
                    <p :class="[themeClasses.dropZoneDragDownText, 'px-4 text-balance text-xs']">.jpg or .png</p>
                  </div>
                </UploadDragger>
              </div>
            </div>

            <div class="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-4">
              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> App Slug * <span class="text-xs opacity-70">(for filenames)</span> </label>
                <Input v-model:value="newPackage.slug" placeholder="e.g., my-awesome-app" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" />
                <p :class="['text-xs mt-1', themeClasses.packagerTextMuted]">Lowercase, no spaces (use dashes)</p>
              </div>

              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> App Name * <span class="text-xs opacity-70">(display name)</span> </label>
                <Input v-model:value="newPackage.display_name" placeholder="e.g., My Awesome App" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" />
                <p :class="['text-xs mt-1', themeClasses.packagerTextMuted]">The pretty name users will see</p>
              </div>

              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Category * </label>
                <Select v-model:value="newPackage.category" placeholder="Select Category" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'w-full']" :popup-class-name="`${themeClasses.scopeSelector}`">
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

              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Type * </label>
                <Input v-model:value="newPackage.type" placeholder="e.g., Media Server" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" />
              </div>

              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Docker Image * </label>
                <div class="flex gap-2">
                  <Input v-model:value="newPackage.docker_image" placeholder="e.g., myuser/myapp" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'flex-1']" />
                  <Button v-if="parsedData.image" @click="newPackage.docker_image = parsedData.image.split(':')[0]" :class="[themeClasses.scopeSelector]" class="flex items-center justify-center" type="primary" title="Use detected image">
                    <Icon :icon="refreshIcon" class="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Version * </label>
                <div class="flex gap-2">
                  <Input v-model:value="newPackage.version" placeholder="e.g., latest" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput, 'flex-1']" />
                  <Button v-if="parsedData.tag" @click="newPackage.version = parsedData.tag" :class="[themeClasses.scopeSelector]" class="flex items-center justify-center" type="primary" title="Use detected version">
                    <Icon :icon="refreshIcon" class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Author * </label>
              <Input v-model:value="newPackage.author" placeholder="Your name or organization" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" />
            </div>

            <div>
              <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Description * </label>
              <Input v-model:value="newPackage.description" placeholder="Describe what this application does..." :maxlength="130" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" />
            </div>

            <button @click="createPackage" :disabled="!canCreate || isCreating" :class="['w-full py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2', canCreate && !isCreating ? `${themeClasses.packagerSuccessButtonBg} ${themeClasses.packagerSuccessButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer` : `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed`]">
              <Icon :icon="isCreating ? loadingIcon : downloadIcon" :class="['w-5 h-5', isCreating ? 'animate-spin' : '']" />
              {{ isCreating ? "Creating Package..." : "Create & Download .hds Package" }}
            </button>
          </div>
        </div>
      </div>

      <div v-else>
        <div :class="['mb-8 rounded-lg p-5', themeClasses.packagerCardBorder]">
          <div class="flex items-center gap-2 mb-4">
            <Icon :icon="importIcon" :class="['w-6 h-6', themeClasses.packagerText]" />
            <h3 :class="['text-lg font-semibold', themeClasses.packagerText]">Import Package to App Store</h3>
          </div>
          <p :class="['text-sm mb-4', themeClasses.packagerTextMuted]">Upload a .hds package to automatically install it and make it available in the App Store.</p>

          <div class="space-y-4">
            <div>
              <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Upload .hds Package </label>
              <UploadDragger :class="[themeClasses.dropZoneDragHolder, themeClasses.scopeSelector]" v-model:file-list="packageFileList" name="package" accept=".hds" :multiple="false" :customRequest="handlePackageUploadRequest" @change="handlePackageChange" :showUploadList="false" :maxCount="1" class="compact-dragger">
                <div class="flex items-center align-center justify-center flex-col py-6">
                  <p class="ant-upload-drag-icon">
                    <Icon :icon="uploadIcon" :class="['text-5xl', themeClasses.dropZoneDragIcon]" />
                  </p>
                  <p :class="[themeClasses.dropZoneDragUpText, 'px-4 text-balance text-sm']">
                    {{ selectedPackage ? selectedPackage.name : "Click or drag .hds file here" }}
                  </p>
                  <p :class="[themeClasses.dropZoneDragDownText, 'px-4 text-balance text-xs']">
                    {{ selectedPackage ? formatFileSize(selectedPackage.size) : "Will appear instantly in App Store" }}
                  </p>
                </div>
              </UploadDragger>
            </div>

            <button @click="uploadPackage" :disabled="!selectedPackage || isUploading" :class="['w-full py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2', selectedPackage && !isUploading ? `${themeClasses.packagerPrimaryButtonBg} ${themeClasses.packagerPrimaryButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer` : `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed`]">
              <Icon :icon="isUploading ? loadingIcon : uploadIcon" :class="['w-5 h-5', isUploading ? 'animate-spin' : '']" />
              {{ isUploading ? "Importing..." : "Import to App Store" }}
            </button>
          </div>
        </div>

        <div :class="['mb-8 rounded-lg p-5', themeClasses.packagerCardBorder]">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <Icon :icon="folderIcon" :class="['w-6 h-6', themeClasses.packagerText]" />
              <h3 :class="['text-lg font-semibold', themeClasses.packagerText]">Imported Packages</h3>
            </div>
            <button @click="loadData" :class="['p-2 rounded-md transition-colors', themeClasses.buttonBG, themeClasses.buttonHover]" title="Refresh list">
              <Icon :icon="refreshIcon" :class="['w-5 h-5', themeClasses.packagerText]" />
            </button>
          </div>
          <p :class="['text-sm mb-4', themeClasses.packagerTextMuted]">These packages are already available in your App Store. Delete to remove completely.</p>

          <div v-if="isLoadingExternal" class="flex items-center justify-center py-8">
            <Icon :icon="loadingIcon" :class="['w-8 h-8 animate-spin', themeClasses.packagerTextMuted]" />
          </div>

          <div v-else-if="externalApps.length === 0" :class="['text-center py-8 text-sm', themeClasses.packagerTextMuted]">No imported packages found. Upload a .hds file to get started.</div>

          <div v-else class="space-y-3">
            <div v-for="app in externalApps" :key="app.filename" :class="['relative rounded-lg p-4 border', themeClasses.packagerListItemBg, app.is_valid ? themeClasses.packagerListItemBorder : themeClasses.packagerErrorBorder]">
              <button @click="deletePackage(app.filename)" :disabled="app.is_installed || isPackageBeingInstalled(app.manifest?.name) || deletingApp === app.filename" :class="['absolute top-2 right-2 p-2 rounded-md transition-colors flex items-center justify-center', app.is_installed || isPackageBeingInstalled(app.manifest?.name) || deletingApp === app.filename ? `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed` : `${themeClasses.packagerDangerButtonBg} ${themeClasses.packagerDangerButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer`]" :title="app.is_installed ? 'Cannot delete: App is installed. Uninstall it from App Store first.' : isPackageBeingInstalled(app.manifest?.name) ? 'Cannot delete: App is currently installing' : deletingApp === app.filename ? 'Deleting...' : 'Delete package'">
                <Icon :icon="deletingApp === app.filename ? loadingIcon : deleteIcon" :class="['w-4 h-4', deletingApp === app.filename ? 'animate-spin' : '']" />
              </button>

              <div class="flex items-center gap-2 mb-2">
                <Icon :icon="app.is_valid ? packageIcon : alertIcon" :class="['w-5 h-5', app.is_valid ? 'text-amber-600' : themeClasses.packagerErrorText]" />
                <h4 :class="['font-semibold text-sm', themeClasses.packagerText]">
                  {{ app.manifest?.display_name || app.manifest?.name || app.filename }}
                </h4>
              </div>

              <p v-if="app.manifest" :class="['text-xs mb-3', themeClasses.packagerTextMuted]">
                {{ app.manifest.description }}
              </p>

              <div :class="['text-xs space-y-1', themeClasses.packagerListMetaText]">
                <p v-if="app.manifest" class="flex items-center gap-2">
                  <Icon :icon="accountIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium', themeClasses.packagerListMetaLabel]">HDS Publisher:</span>
                  <span>{{ app.manifest.author }}</span>
                </p>
                <p v-if="app.manifest?.docker_image" class="flex items-center gap-2">
                  <Icon :icon="dockerIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium', themeClasses.packagerListMetaLabel]">Image:</span>
                  <span class="font-mono">{{ app.manifest.docker_image }}</span>
                </p>
                <p v-if="app.manifest" class="flex items-center gap-2">
                  <Icon :icon="tagIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium', themeClasses.packagerListMetaLabel]">Version:</span>
                  <span>{{ app.manifest.version }}</span>
                </p>
                <p v-if="app.manifest" class="flex items-center gap-2">
                  <Icon :icon="shapeIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium', themeClasses.packagerListMetaLabel]">Category:</span>
                  <span>{{ app.manifest.category }}</span>
                </p>
                <p class="flex items-center gap-2">
                  <Icon :icon="fileIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium', themeClasses.packagerListMetaLabel]">File:</span>
                  <span>{{ app.filename }} ({{ formatFileSize(app.size) }})</span>
                </p>
                <p v-if="app.hash" class="flex items-center gap-2 min-w-0">
                  <Icon :icon="fingerprintIcon" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span :class="['font-medium flex-shrink-0', themeClasses.packagerListMetaLabel]">Hash:</span>
                  <span class="truncate">{{ app.hash }}</span>
                </p>
                <p v-if="!app.is_valid" :class="themeClasses.packagerErrorText">
                  <Icon :icon="alertIcon" class="w-3 h-3 inline" />
                  {{ app.validation_message }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div :class="['rounded-lg p-5', themeClasses.packagerCardBorder]">
          <div class="flex items-center gap-2 mb-4">
            <Icon :icon="exportIcon" :class="['w-6 h-6', themeClasses.packagerText]" />
            <h3 :class="['text-lg font-semibold', themeClasses.packagerText]">Export Imported Apps</h3>
          </div>
          <p :class="['text-sm mb-4', themeClasses.packagerTextMuted]">Export any imported app as a .hds package to share or backup.</p>

          <div v-if="importedApps.length === 0" :class="['text-sm text-center py-4', themeClasses.packagerTextMuted]">No imported apps available. Import a .hds package first to export it.</div>

          <div v-else class="space-y-4">
            <div>
              <label :class="['block text-sm font-medium mb-2', themeClasses.packagerText]"> Select Imported App to Export </label>
              <Select v-model:value="selectedImportedApp" placeholder="-- Select an app --" class="w-full" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector}`">
                <SelectOption v-for="app in importedApps" :key="app.name" :value="app.name">{{ app.display_name || app.name }} ({{ app.metadata.category }})</SelectOption>
              </Select>
            </div>

            <button @click="exportImported" :disabled="!selectedImportedApp || isExporting" :class="['w-full py-2.5 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2', selectedImportedApp && !isExporting ? `${themeClasses.packagerPrimaryButtonBg} ${themeClasses.packagerPrimaryButtonBgHover} ${themeClasses.packagerPrimaryButtonText} cursor-pointer` : `${themeClasses.packagerButtonDisabledBg} ${themeClasses.packagerButtonDisabledText} cursor-not-allowed`]">
              <Icon :icon="isExporting ? loadingIcon : downloadIcon" :class="['w-5 h-5', isExporting ? 'animate-spin' : '']" />
              {{ isExporting ? "Exporting..." : "Export as .hds" }}
            </button>
          </div>
        </div>
      </div>
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
                      <span v-if="usedDevHooks.includes(hook.placeholder)" :class="['text-xs', themeClasses.packagerSuccessText]">✓ Used</span>
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
                      <span v-if="usedDevHooks.includes(hook.placeholder)" :class="['text-xs', themeClasses.packagerSuccessText]">✓ Used</span>
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

    <StatusBar :icon="packageIcon" :message="activeTab === 'generator' ? 'Packager' : `${externalApps.length} external ${externalApps.length === 1 ? 'package' : 'packages'}`" :info="activeTab === 'generator' ? (usedDevHooks.length ? `${usedDevHooks.length} DevHooks detected` : 'Ready to create') : `${importedApps.length} imported apps`" :showHelp="true">
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

import { ref, onMounted, computed, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDialog } from "../__Composables__/useDialog";
import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { Icon } from "@iconify/vue";
import { Input, Select, SelectOption, Button, UploadDragger, message } from "ant-design-vue";

import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";

import packageIcon from "@iconify-icons/mdi/package-variant";
import plusIcon from "@iconify-icons/mdi/plus-circle";
import exportIcon from "@iconify-icons/mdi/export";
import importIcon from "@iconify-icons/mdi/import";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import folderIcon from "@iconify-icons/mdi/folder-open";
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
import accountIcon from "@iconify-icons/mdi/account";
import tagIcon from "@iconify-icons/mdi/tag";
import dockerIcon from "@iconify-icons/mdi/docker";
import fileIcon from "@iconify-icons/mdi/file-outline";
import shapeIcon from "@iconify-icons/mdi/shape-outline";
import fingerprintIcon from "@iconify-icons/mdi/fingerprint";

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();
const { confirm } = useDialog();
const appStore = useAppStore();
const installationStore = useInstallationStore();

const activeTab = ref<"generator" | "manager">("generator");
const tabs = [
  { id: "generator", label: "Package Generator", icon: sparklesIcon },
  { id: "manager", label: "Package Manager", icon: folderMultipleIcon },
];

const MAX_HDS_PACKAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_COMPOSE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ICON_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const showDevHooks = ref(false);
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

const canCreate = computed(() => {
  return composeFile.value && iconFile.value && newPackage.value.slug && newPackage.value.display_name && newPackage.value.category && newPackage.value.type && newPackage.value.description && newPackage.value.docker_image && newPackage.value.author;
});

// Export Import
const importedApps = ref<any[]>([]);
const selectedImportedApp = ref("");
const isExporting = ref(false);

// Import Package
const selectedPackage = ref<File | null>(null);
const packageFileList = ref<any[]>([]);
const isUploading = ref(false);

// Overwrite dialog
const showOverwriteDialog = ref(false);
const overwriteData = ref<{
  displayName: string;
  appSlug: string;
  existingFiles: string[];
} | null>(null);

// External
const externalApps = ref<any[]>([]);
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
  { deep: true }
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
  isLoadingExternal.value = true;

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

const handlePackageChange = (info: any) => {
  const { fileList } = info;
  if (fileList.length > 0) {
    const file = fileList[0].originFileObj;

    if (!file.name.endsWith(".hds")) {
      message.error("Please upload a .hds file");
      packageFileList.value = [];
      selectedPackage.value = null;
      return;
    }

    if (file.size > MAX_HDS_PACKAGE_SIZE) {
      message.error(`Package file is too large. Maximum size: ${formatFileSize(MAX_HDS_PACKAGE_SIZE)}`);
      packageFileList.value = [];
      selectedPackage.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);

      const isZIP = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;

      if (!isZIP) {
        message.error("Invalid .hds file. Package must be a valid HDS file.");
        packageFileList.value = [];
        selectedPackage.value = null;
        return;
      }

      selectedPackage.value = file;
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  } else {
    selectedPackage.value = null;
  }
};

const uploadPackage = async () => {
  if (!selectedPackage.value) return;

  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append("file", selectedPackage.value);

    const response = await axios.post("/api/pkg/upload", formData, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    if (!response.data.success) {
      message.error(`Upload failed: ${response.data.message}`);
      return;
    }

    const displayName = response.data.display_name || selectedPackage.value.name;
    message.success(`Successfully imported ${displayName}! The app is now available in your App Store.`);
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
      }
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
  }
);
</script>

<style scoped>
/* Compact dragg */
:deep(.compact-dragger .ant-upload-drag) {
  height: 180px !important;
  min-height: 180px !important;
  max-height: 180px !important;
}

.compose-editor {
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

.compose-editor:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
}
</style>
