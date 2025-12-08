<!-- homedock-ui/vue3/static/js/__Apps__/AppInstallConfig.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-install-config h-full flex flex-col overflow-hidden" style="container-type: inline-size; container-name: window">
    <div v-if="!app" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Icon :icon="loadingIcon" :class="[themeClasses.installConfigLoadingIcon]" class="animate-spin h-12 w-12 mx-auto mb-4" />
        <p :class="[themeClasses.installConfigLoadingText]">Loading application details...</p>
      </div>
    </div>

    <div v-else class="flex flex-col h-full overflow-hidden">
      <div class="flex-1 overflow-y-auto">
        <div :class="[themeClasses.storeContMainer, themeClasses.aeroExtraScope]" class="px-4 py-4">
          <div class="flex items-center gap-4 mb-4">
            <div class="relative flex-shrink-0 group">
              <BaseImage draggable="false" :src="app?.picture_path || 'docker-icons/notfound.jpg'" :alt="app?.name" :class="[themeClasses.storeModalImageBack]" class="w-16 h-16 rounded-xl shadow-md transition ring-[1px] duration-200 group-hover:scale-105" />
              <div v-if="sslEnabled" :class="[themeClasses.storePopupSSLFlag]" class="absolute flex items-center justify-center p-1 rounded-full -top-1 -right-1 shadow-sm border">
                <Icon :icon="lockIcon" class="h-2.5 w-2.5" />
              </div>
              <div v-if="app?.is_external" class="absolute flex items-center justify-center p-1 rounded-full -bottom-2 -right-2 shadow-md border bg-amber-600 border-gray-100 animate-bounce">
                <Icon :icon="packageIcon" class="h-4 w-4 text-white" />
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h1 :class="[themeClasses.storeModalAppName]" class="text-xl md:text-2xl font-bold mb-1">
                {{ app?.display_name || app?.name }}
              </h1>
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <span :class="[themeClasses.storeModalAppType]" class="font-medium">{{ app?.type }}</span>
                <span :class="[themeClasses.storeModalAppCategory]">•</span>
                <span :class="[themeClasses.storeModalAppCategory]">{{ app?.category }}</span>
                <div v-if="app?.is_external" class="flex items-center px-2 py-0.5 rounded-md bg-amber-600 text-white font-medium">
                  <Icon :icon="packageIcon" class="mr-1 h-3 w-3" />
                  <span>External Package</span>
                </div>
                <div v-if="sslEnabled" :class="[themeClasses.storeTextSSLFlag]" class="flex items-center">
                  <Icon :icon="lockIcon" class="mr-1 h-3 w-3" />
                  <span class="font-medium">HTTPS</span>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons flex items-center gap-2">
            <Transition name="button-fade" mode="out-in">
              <Button v-if="app?.is_installed" key="installed" :class="[themeClasses.storeButtonInstalled]" class="action-button-primary flex items-center justify-center" type="default">
                <Icon :icon="checkBoldIcon" class="mr-1.5" />
                Installed
              </Button>
              <Button v-else-if="installationStore.currentlyInstalling === app?.name" key="installing" :class="[themeClasses.storeButtonInstalling]" class="action-button-primary flex items-center justify-center" type="default">
                <Icon :icon="loadingIcon" class="mr-1.5 animate-spin" />
                Installing...
              </Button>
              <Button v-else-if="app?.name && installationStore.queue.includes(app.name)" key="queued" :class="[themeClasses.storeButtonQueued]" class="action-button-primary flex items-center justify-center" type="default">
                <Icon :icon="queueIcon" class="mr-1.5" />
                Queued
              </Button>
              <Button v-else :class="[themeClasses.storeButtonInstall]" key="install" class="action-button-primary flex items-center justify-center" type="primary" @click="handleInstall">
                <Icon :icon="downloadIcon" class="mr-1.5" />
                Install
              </Button>
            </Transition>

            <a :href="app?.is_external ? 'https://www.homedock.cloud' : `https://www.homedock.cloud/apps/${app?.name.toLowerCase()}`" target="_blank" class="flex-shrink-0">
              <Button :class="[themeClasses.storeLinkHDOSButton]" class="flex items-center" type="dashed">
                <Icon :icon="earthIcon" class="w-4 h-4" />
              </Button>
            </a>

            <div class="flex-shrink-0">
              <Switch v-model:checked="isAdvancedMode" @change="handleAdvancedModeToggle">
                <template #checkedChildren>
                  <span class="flex items-center">
                    <Icon :icon="emoticonHappyOutlineIcon" class="h-4 w-4" />
                    <span class="text-transparent">.</span>
                  </span>
                </template>
                <template #unCheckedChildren>
                  <span class="flex items-center">
                    <Icon :icon="xmlIcon" class="h-4 w-4" />
                    <span class="text-transparent">.</span>
                  </span>
                </template>
              </Switch>
            </div>
          </div>
        </div>

        <div class="px-4">
          <p :class="[themeClasses.storeAboutTextDescScope]" class="text-sm leading-relaxed mb-3">
            {{ app?.description + "." || "No description available" }}
          </p>

          <div v-show="screenshots.length > 0" class="mb-0">
            <div ref="screenshotsContainer" class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide select-none" :class="{ 'cursor-grab': !isDragging, 'cursor-grabbing': isDragging }" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag">
              <template v-for="(screenshot, index) in screenshots" :key="`screenshot-${index}`">
                <button @click="openScreenshotModal(index)" :class="[themeClasses.screenshotThumb]" class="flex-shrink-0 w-[160px] h-[100px] md:w-[200px] md:h-[125px] lg:w-[280px] lg:h-[175px] xl:w-[320px] xl:h-[200px] rounded-lg overflow-hidden border-2 border-transparent transition-all duration-200 hover:scale-[1.01] hover:shadow-lg active:translate-y-0 active:scale-[0.98]">
                  <img draggable="false" :src="screenshot" :alt="`${app?.name} screenshot ${index + 1}`" class="w-full h-full object-cover pointer-events-none" />
                </button>
              </template>
            </div>
          </div>

          <div class="mb-6">
            <div v-if="dependenciesText" :class="[themeClasses.storeAboutTextDepsScope]" class="text-xs inline-flex items-start px-2.5 py-1.5 rounded-md">
              <Icon :icon="cubeIcon" class="h-3 w-3 min-h-3 min-w-3 mt-[1px] mr-1.5" />
              <span>{{ dependenciesText }}</span>
            </div>
          </div>

          <Transition name="fade-slide" mode="out-in">
            <div v-if="!isAdvancedMode" key="simple">
              <div v-if="userName !== undefined || userPassword !== undefined" class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                  <Icon :icon="accountKeyIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                  <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Access Credentials</h3>
                </div>
                <div class="space-y-3">
                  <Input v-if="userName !== undefined" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="userName" placeholder="Username" class="w-full" />
                  <InputPassword v-if="userPassword !== undefined" autocomplete="new-password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="userPassword" placeholder="Password" class="w-full" />
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="portIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                    <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Port Mappings</h3>
                  </div>
                  <Button :disabled="app?.is_installed" type="link" @click="addPort" size="small"> + Add </Button>
                </div>
                <div v-if="portMappings.length > 0" class="space-y-2">
                  <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs mb-1">
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Host</span>
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Container</span>
                    <span class="w-8"></span>
                  </div>
                  <div v-for="(port, index) in portMappings" :key="'port-' + index" class="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="portMappings[index].host" placeholder="8080" />
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="portMappings[index].container" placeholder="80" />
                    <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="app?.is_installed" type="text" size="small" @click="removePort(index)">
                      <Icon :icon="deleteIcon" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="folderIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                    <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Volume Mounts</h3>
                  </div>
                  <Button :disabled="app?.is_installed" type="link" @click="addVolume" size="small"> + Add </Button>
                </div>
                <div v-if="volumeMappings.length > 0" class="space-y-2">
                  <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs mb-1">
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Host Path</span>
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Container Path</span>
                    <span class="w-8"></span>
                  </div>
                  <div v-for="(volume, index) in volumeMappings" :key="'volume-' + index" class="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="volumeMappings[index].host" placeholder="/host/path">
                      <template #prefix v-if="isSSLCertPath(volume.host)">
                        <Icon :icon="lockIcon" :class="[themeClasses.installConfigSSLVolumeIcon]" class="h-3.5 w-3.5 -translate-x-0.5" />
                      </template>
                    </Input>
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="volumeMappings[index].container" placeholder="/container/path" />
                    <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="app?.is_installed" type="text" size="small" @click="removeVolume(index)">
                      <Icon :icon="deleteIcon" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                  <Icon :icon="networkIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                  <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Network</h3>
                </div>
                <div v-if="networkMappings.length > 0" class="flex items-center gap-2">
                  <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector}`" :disabled="app?.is_installed" v-model:value="networkMappings[0].type" class="w-full" @change="handleNetworkTypeChange(0)">
                    <SelectOption :class="[themeClasses.scopeSelector]" value="host">Host</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="bridge">Bridge</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="homedock_network">HomeDock OS Network</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="none">None</SelectOption>
                    <SelectOption :class="[themeClasses.scopeSelector]" value="other">Other</SelectOption>
                  </Select>
                </div>
                <Input v-if="networkMappings.length > 0 && networkMappings[0].type === 'other'" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="networkMappings[0].customName" placeholder="custom-network-name" class="w-full mt-2" />
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="envIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                    <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Environment Variables</h3>
                  </div>
                  <Button :disabled="app?.is_installed" type="link" @click="addEnvVar" size="small"> + Add </Button>
                </div>
                <div v-if="envVars.length > 0" class="space-y-2">
                  <div class="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs mb-1">
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Key</span>
                    <span :class="[themeClasses.installConfigLabel]" class="font-medium">Value</span>
                    <span class="w-8"></span>
                  </div>
                  <div v-for="(envVar, index) in envVars" :key="'env-' + index" class="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="envVars[index].key" placeholder="VARIABLE_NAME" />
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="envVars[index].value" placeholder="value" />
                    <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="app?.is_installed" type="text" size="small" @click="removeEnvVar(index)">
                      <Icon :icon="deleteIcon" class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider mb-3">Restart Policy</h3>
                <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector}`" :disabled="app?.is_installed" v-model:value="restartPolicy" class="w-full">
                  <SelectOption :class="[themeClasses.scopeSelector]" value="always">Always</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="unless-stopped">Unless Stopped</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="no">No</SelectOption>
                </Select>
              </div>

              <div class="mb-6">
                <div class="flex items-center gap-2 mb-3">
                  <Icon :icon="capabilityIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                  <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Capabilities</h3>
                </div>
                <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector}`" :disabled="app?.is_installed" v-model:value="capabilities" mode="multiple" placeholder="Select capabilities" class="w-full">
                  <SelectOption :class="[themeClasses.scopeSelector]" value="NET_ADMIN">NET_ADMIN (Network administration)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="NET_RAW">NET_RAW (Raw sockets)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_ADMIN">SYS_ADMIN (System administration)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_MODULE">SYS_MODULE (Load kernel modules)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_PTRACE">SYS_PTRACE (Trace processes)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="IPC_LOCK">IPC_LOCK (Lock memory)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_TIME">SYS_TIME (Modify system time)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_NICE">SYS_NICE (Modify process priorities)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="DAC_OVERRIDE">DAC_OVERRIDE (Bypass file permissions)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="CHOWN">CHOWN (Change file ownership)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="FOWNER">FOWNER (Bypass permission checks)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SETUID">SETUID (Manipulate process UIDs)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SETGID">SETGID (Manipulate process GIDs)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="NET_BIND_SERVICE">NET_BIND_SERVICE (Bind ports &lt; 1024)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="SYS_RESOURCE">SYS_RESOURCE (Override resource limits)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="MKNOD">MKNOD (Create special files)</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="AUDIT_WRITE">AUDIT_WRITE (Write to audit log)</SelectOption>
                </Select>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <Icon :icon="privilegedIcon" class="h-4 w-4" :class="[themeClasses.storeAboutTextScope]" />
                    <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Privileged Mode</h3>
                  </div>
                </div>
                <Switch :disabled="app?.is_installed" :checked="privilegedMode" @change="handlePrivilegedModeChange">
                  <template #checkedChildren>
                    <span>On</span>
                  </template>
                  <template #unCheckedChildren>
                    <span>Off</span>
                  </template>
                </Switch>
              </div>
            </div>

            <div v-else key="advanced" class="mb-2">
              <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider mb-3">Advanced Configuration</h3>
              <textarea :disabled="app?.is_installed" v-model="advancedCompose" :class="[themeClasses.hubTextArea]" class="flex-1 rounded-lg w-full font-mono text-xs resize-none p-3" style="height: 500px"></textarea>
            </div>
          </Transition>
        </div>
      </div>

      <StatusBar :icon="downloadIcon" message="Install App" :info="app?.name ? `Installing ${app.display_name || app.name}` : 'Configure application'" :showHelp="true">
        <template #help>
          <div class="space-y-2.5 max-w-sm">
            <div class="flex items-center gap-2">
              <Icon :icon="downloadIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
              <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Install App</h4>
            </div>

            <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
              <p>Configure your application before installation using simple mode with form fields or advanced mode with direct compose editing. Set ports, volumes, credentials, and restart policies to customize how your application runs. Toggle between modes using the switch to choose your preferred configuration method.</p>
            </div>
          </div>
        </template>
      </StatusBar>
    </div>

    <AppDialog v-model:visible="showExternalWarning" type="warning" title="External Package Warning" ok-text="Install Anyway" cancel-text="Cancel" @ok="handleExternalWarningOk" @cancel="handleExternalWarningCancel">
      <div class="space-y-4">
        <div class="flex items-start gap-3">
          <Icon :icon="alertIcon" class="w-6 h-6 text-red-500 flex-shrink-0" />
          <div class="flex-1">
            <p :class="['font-semibold mb-3', themeClasses.externalWarningTitle]" class="text-sm">You are about to install an external package</p>
            <p :class="['text-sm mb-2', themeClasses.externalWarningText]">This application was not added or verified by the HomeDock OS team. External packages can potentially be dangerous if they contain malicious code.</p>

            <div :class="['border rounded-lg p-3 mb-3', themeClasses.externalWarningAuthorBg, themeClasses.externalWarningAuthorBorder]">
              <p :class="['text-sm font-semibold', themeClasses.externalWarningAuthorTitle]">HDS Package Author:</p>
              <p :class="['text-sm', themeClasses.externalWarningAuthorText]">{{ app?.author || "Unknown" }}</p>
            </div>

            <p :class="['text-sm font-semibold mb-2', themeClasses.externalWarningTitle]">Security Recommendations:</p>
            <ul :class="['text-xs -space-y-1', themeClasses.externalWarningListText]">
              <li class="flex items-start gap-1">
                <span class="mt-0.5">•</span>
                <span>Only install packages from authors you trust</span>
              </li>
              <li class="flex items-start gap-1">
                <span class="mt-0.5">•</span>
                <span>Review the package configuration before installing</span>
              </li>
              <li class="flex items-start gap-1">
                <span class="mt-0.5">•</span>
                <span>Be cautious of packages requesting unusual permissions</span>
              </li>
              <li class="flex items-start gap-1">
                <span class="mt-0.5">•</span>
                <span>Report suspicious packages to <a href="mailto:support@homedock.cloud" :class="[themeClasses.hyperLink]">support@homedock.cloud</a></span>
              </li>
            </ul>

            <p :class="['text-xs mt-2 underline', themeClasses.externalWarningDisclaimerText]">By proceeding, you acknowledge the risks associated with installing external packages.</p>
          </div>
        </div>
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showScreenshotModal" type="info" title="Screenshot Preview" ok-text="Close" :ok-cancel="false" :width="1200" @ok="closeScreenshotModal">
      <div class="flex items-center justify-center min-h-[400px]">
        <img v-if="screenshots[currentScreenshotModal]" :src="screenshots[currentScreenshotModal]" :alt="`${app?.name} screenshot ${currentScreenshotModal + 1}`" class="max-w-full max-h-[70vh] mx-auto rounded-lg object-contain" />
      </div>
    </AppDialog>

    <AppDialog v-model:visible="showPrivilegedWarning" type="warning" title="Privileged Mode Warning" ok-text="I Understand, Enable" cancel-text="Cancel" @ok="handlePrivilegedWarningConfirm" @cancel="handlePrivilegedWarningCancel" :icon="alertIcon" :width="480" :reverse-buttons="true">
      <div class="space-y-3">
        <p :class="[themeClasses.notTextDown]" class="text-sm leading-relaxed">Enabling <strong>Privileged Mode</strong> grants the container <strong>unrestricted access</strong> to all host system resources and devices. This removes all security isolation provided by Docker.</p>

        <div :class="[themeClasses.dropZoneTotalSizeScope]" class="rounded-lg p-3.5 space-y-2.5">
          <p class="text-sm font-bold flex items-center gap-2">
            <Icon :icon="privilegedIcon" class="w-5 h-5" />
            <span>Security Risks</span>
          </p>
          <p class="text-xs leading-relaxed">With Privileged Mode enabled, the container can:</p>
          <ul class="text-xs space-y-1.5 ml-4 list-disc">
            <li>Access <strong>all host devices</strong> and hardware</li>
            <li>Modify <strong>kernel parameters</strong> and load modules</li>
            <li>Potentially <strong>compromise the entire host</strong> system</li>
            <li>Bypass <strong>all container security</strong> mechanisms</li>
          </ul>
        </div>

        <p :class="[themeClasses.notTextDown]" class="text-xs leading-relaxed font-semibold">Only enable if absolutely necessary and you trust this application completely.</p>
      </div>
    </AppDialog>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { App } from "../__Types__/AppStoreApp";

import { Button, Select, SelectOption, Input, InputPassword, Switch } from "ant-design-vue";

import { notifyError, notifyWarning } from "../__Components__/Notifications.vue";

import { Icon } from "@iconify/vue";
import downloadIcon from "@iconify-icons/mdi/download";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";
import cubeIcon from "@iconify-icons/mdi/cube";
import xmlIcon from "@iconify-icons/mdi/xml";
import emoticonHappyOutlineIcon from "@iconify-icons/mdi/emoticon-happy-outline";
import deleteIcon from "@iconify-icons/mdi/delete";
import earthIcon from "@iconify-icons/mdi/earth";
import queueIcon from "@iconify-icons/mdi/queue";
import loadingIcon from "@iconify-icons/mdi/loading";
import lockIcon from "@iconify-icons/mdi/lock";
import packageIcon from "@iconify-icons/mdi/package-variant-closed";
import alertIcon from "@iconify-icons/mdi/alert-circle";
import portIcon from "@iconify-icons/mdi/ethernet";
import folderIcon from "@iconify-icons/mdi/folder-open";
import networkIcon from "@iconify-icons/mdi/lan";
import envIcon from "@iconify-icons/mdi/code-braces";
import capabilityIcon from "@iconify-icons/mdi/shield-check";
import privilegedIcon from "@iconify-icons/mdi/shield-crown";
import accountKeyIcon from "@iconify-icons/mdi/account-key";

import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import AppDialog from "../__Components__/AppDialog.vue";

interface Props {
  app?: App;
}

const props = defineProps<Props>();

const { themeClasses } = useTheme();
const appStoreInstance = useAppStore();
const installationStore = useInstallationStore();

const app = computed(() => {
  if (!props.app?.name) return props.app;

  const updatedApp = appStoreInstance.apps.find((a) => a.name === props.app?.name);

  return updatedApp || props.app;
});

const dependenciesText = computed(() => {
  if (!app.value?.dependencies || app.value.dependencies.length === 0) {
    return "";
  }

  const deps = app.value.dependencies;

  if (deps.length === 1) {
    return `This application will also install ${deps[0]}`;
  } else if (deps.length === 2) {
    return `This application will also install ${deps[0]} and ${deps[1]}`;
  } else if (deps.length === 3) {
    return `This application will also install ${deps[0]}, ${deps[1]} and ${deps[2]}`;
  } else {
    const first3 = deps.slice(0, 3).join(", ");
    const remaining = deps.length - 3;
    return `This application will also install ${first3} and ${remaining} more`;
  }
});

interface PortMapping {
  host: string;
  container: string;
}

interface VolumeMapping {
  host: string;
  container: string;
}

interface EnvVar {
  key: string;
  value: string;
}

interface NetworkMapping {
  type: string;
  customName: string;
}

const isAdvancedMode = ref(false);
const portMappings = ref<PortMapping[]>([]);
const volumeMappings = ref<VolumeMapping[]>([]);
const networkMappings = ref<NetworkMapping[]>([]);
const envVars = ref<EnvVar[]>([]);
const capabilities = ref<string[]>([]);
const privilegedMode = ref(false);
const restartPolicy = ref("unless-stopped");
const advancedCompose = ref("");
const userName = ref<string | undefined>(undefined);
const userPassword = ref<string | undefined>(undefined);
const sslEnabled = ref(false);
const hasLoadedConfig = ref(false);
const showExternalWarning = ref(false);
const pendingInstall = ref(false);
const showPrivilegedWarning = ref(false);
const pendingPrivilegedChange = ref(false);
const screenshots = ref<string[]>([]);
const showScreenshotModal = ref(false);
const currentScreenshotModal = ref(0);
const screenshotsContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const scrollLeft = ref(0);
const clickThreshold = ref(5);
const hasDragged = ref(false);

const csrfToken = useCsrfToken();

function parsePortString(portStr: string): PortMapping {
  const parts = portStr.split(":");
  if (parts.length === 2) {
    return { host: parts[0].trim(), container: parts[1].trim() };
  }
  return { host: "", container: "" };
}

function parseVolumeString(volumeStr: string): VolumeMapping {
  const parts = volumeStr.split(":");
  if (parts.length >= 2) {
    return { host: parts[0].trim(), container: parts.slice(1).join(":").trim() };
  }
  return { host: "", container: "" };
}

function isSSLCertPath(path: string): boolean {
  if (!path) return false;
  if (path.startsWith("/DATA/SSLCerts")) return true;
  if (/^\/Users\/[^/]+\/HomeDock\/SSLCerts/.test(path)) return true;
  if (path.startsWith("/mnt/c/HomeDock/SSLCerts")) return true;
  return false;
}

async function fetchAppInfo() {
  if (!app.value?.name || hasLoadedConfig.value) return;

  hasLoadedConfig.value = true;

  try {
    const response = await axios.get("/api/get-appstore-info", {
      params: { containerName: app.value.name },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data?.success) {
      const ports = response.data.data.ports || [];
      const volumes = response.data.data.volumes || [];
      const environment = response.data.data.environment || {};
      const networksData = response.data.data.networks || [];
      const capabilitiesData = response.data.data.capabilities || [];
      const privilegedData = response.data.data.privileged || false;

      portMappings.value = ports.map((p: string) => parsePortString(p));
      volumeMappings.value = volumes.map((v: string) => parseVolumeString(v));

      const networkList = Array.isArray(networksData) ? networksData : [];
      if (networkList.length === 0) {
        networkMappings.value = [{ type: "homedock_network", customName: "" }];
      } else {
        networkMappings.value = networkList.map((net: string) => {
          if (["host", "bridge", "homedock_network", "none"].includes(net)) {
            return { type: net, customName: "" };
          } else {
            return { type: "other", customName: net };
          }
        });
      }

      envVars.value = Object.entries(environment).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      capabilities.value = Array.isArray(capabilitiesData) ? capabilitiesData : [];
      privilegedMode.value = Boolean(privilegedData);

      advancedCompose.value = response.data.data.ymlContent || "";
      restartPolicy.value = "unless-stopped";
      userName.value = response.data.data.user_name || undefined;
      userPassword.value = response.data.data.password || undefined;
      sslEnabled.value = response.data.data.ssl_enabled || false;
    } else {
      console.error("Failed to fetch app info:", response.data.message);
      hasLoadedConfig.value = false;
    }
  } catch (error) {
    console.error("Error fetching app info:", error);
    hasLoadedConfig.value = false;
  }
}

function addPort() {
  portMappings.value.push({ host: "", container: "" });
}

function removePort(index: number) {
  portMappings.value.splice(index, 1);
}

function addVolume() {
  volumeMappings.value.push({ host: "", container: "" });
}

function removeVolume(index: number) {
  volumeMappings.value.splice(index, 1);
}

function handleNetworkTypeChange(index: number) {
  if (networkMappings.value[index].type !== "other") {
    networkMappings.value[index].customName = "";
  }
}

function addEnvVar() {
  envVars.value.push({ key: "", value: "" });
}

function removeEnvVar(index: number) {
  envVars.value.splice(index, 1);
}

function handleAdvancedModeToggle(checked: unknown, _e: Event) {
  isAdvancedMode.value = Boolean(checked);
}

function convertPortMappingsToStrings(): string[] {
  return portMappings.value.map((pm) => `${pm.host}:${pm.container}`).filter((p) => p !== ":");
}

function convertVolumeMappingsToStrings(): string[] {
  return volumeMappings.value.map((vm) => `${vm.host}:${vm.container}`).filter((v) => v !== ":");
}

function convertEnvVarsToObject(): Record<string, string> {
  const envObj: Record<string, string> = {};
  envVars.value.forEach((env) => {
    if (env.key && env.value) {
      envObj[env.key] = env.value;
    }
  });
  return envObj;
}

function convertNetworkMappingsToArray(): string[] {
  return networkMappings.value
    .map((nm) => {
      if (nm.type === "other") {
        return nm.customName.trim();
      } else {
        return nm.type;
      }
    })
    .filter((n) => n !== "");
}

async function handleInstall() {
  if (!app.value?.name) return;

  if (app.value.is_external && !pendingInstall.value) {
    showExternalWarning.value = true;
    return;
  }

  try {
    pendingInstall.value = false;
    const currentToken = csrfToken.value;
    const configData = isAdvancedMode.value
      ? {
          containerName: app.value.name,
          configType: "advanced",
          ymlContent: advancedCompose.value,
          homedock_csrf_token: currentToken,
        }
      : {
          containerName: app.value.name,
          configType: "simple",
          userName: userName.value,
          userPassword: userPassword.value,
          ports: convertPortMappingsToStrings(),
          volumes: convertVolumeMappingsToStrings(),
          networks: convertNetworkMappingsToArray(),
          environment: convertEnvVarsToObject(),
          capabilities: capabilities.value,
          privileged: privilegedMode.value,
          restartPolicy: restartPolicy.value,
          homedock_csrf_token: currentToken,
        };

    try {
      const response = await axios.post("/api/process-config", configData, {
        headers: { "X-HomeDock-CSRF-Token": currentToken },
      });

      if (!response.data.success) {
        console.error(`Failed to process configuration: ${response.data.message}`);
        notifyWarning(response.data.message || "Failed to process configuration", themeClasses.value.scopeSelector, 10);
        return;
      }
    } catch (configError: any) {
      if (configError.response?.status === 400 && configError.response?.data?.message) {
        notifyWarning(configError.response.data.message, themeClasses.value.scopeSelector, 10);
      } else if (configError.response) {
        notifyError(configError, themeClasses.value.scopeSelector);
      } else {
        notifyWarning("Failed to process configuration", themeClasses.value.scopeSelector);
      }

      return;
    }

    await installationStore.trackInstallations();

    await axios.post("/api/app-store-install-container", {
      containerName: app.value.name,
      homedock_csrf_token: currentToken,
    });
  } catch (error: any) {
    console.error("Error during installation process:", error);
    if (error.response) {
      notifyError(error, themeClasses.value.scopeSelector);
    } else {
      notifyWarning("An unexpected error occurred during installation", themeClasses.value.scopeSelector);
    }
  }
}

function handleExternalWarningOk() {
  showExternalWarning.value = false;
  pendingInstall.value = true;
  handleInstall();
}

function handleExternalWarningCancel() {
  showExternalWarning.value = false;
  pendingInstall.value = false;
}

function handlePrivilegedModeChange(checked: boolean | string | number, e: Event) {
  const isChecked = Boolean(checked);
  if (isChecked && !privilegedMode.value) {
    pendingPrivilegedChange.value = true;
    showPrivilegedWarning.value = true;
  } else {
    privilegedMode.value = isChecked;
  }
}

function handlePrivilegedWarningConfirm() {
  showPrivilegedWarning.value = false;
  privilegedMode.value = true;
  pendingPrivilegedChange.value = false;
}

function handlePrivilegedWarningCancel() {
  showPrivilegedWarning.value = false;
  privilegedMode.value = false;
  pendingPrivilegedChange.value = false;
}

function loadScreenshots() {
  if (!app.value?.name || !app.value?.screenshot_count) {
    screenshots.value = [];
    return;
  }

  const appName = app.value.name.toLowerCase();
  screenshots.value = Array.from({ length: app.value.screenshot_count }, (_, i) => `/images/app-store-screenshots/${appName}-${i + 1}.webp`);
}

function startDrag(e: MouseEvent) {
  if (!screenshotsContainer.value) return;
  isDragging.value = true;
  hasDragged.value = false;
  startX.value = e.pageX - screenshotsContainer.value.offsetLeft;
  scrollLeft.value = screenshotsContainer.value.scrollLeft;
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value || !screenshotsContainer.value) return;
  e.preventDefault();
  const x = e.pageX - screenshotsContainer.value.offsetLeft;
  const walk = (x - startX.value) * 2;

  if (Math.abs(walk) > clickThreshold.value) {
    hasDragged.value = true;
  }

  screenshotsContainer.value.scrollLeft = scrollLeft.value - walk;
}

function endDrag() {
  isDragging.value = false;
}

function openScreenshotModal(index: number) {
  if (hasDragged.value) {
    hasDragged.value = false;
    return;
  }
  currentScreenshotModal.value = index;
  showScreenshotModal.value = true;
}

function closeScreenshotModal() {
  showScreenshotModal.value = false;
}

function previousScreenshotModal() {
  if (currentScreenshotModal.value > 0) {
    currentScreenshotModal.value--;
  }
}

function nextScreenshotModal() {
  if (currentScreenshotModal.value < screenshots.value.length - 1) {
    currentScreenshotModal.value++;
  }
}

function handleKeyboardNavigation(event: KeyboardEvent) {
  if (!showScreenshotModal.value || screenshots.value.length <= 1) return;

  if (event.key === "ArrowLeft") {
    previousScreenshotModal();
  } else if (event.key === "ArrowRight") {
    nextScreenshotModal();
  } else if (event.key === "Escape") {
    closeScreenshotModal();
  }
}

watch(
  app,
  (newApp) => {
    if (newApp?.name) {
      fetchAppInfo();
      loadScreenshots();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (app.value?.name) {
    fetchAppInfo();
    loadScreenshots();
  }

  window.addEventListener("keydown", handleKeyboardNavigation);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyboardNavigation);
});
</script>

<style scoped>
.action-button-primary {
  flex: 1;
}

@container window (min-width: 640px) {
  .action-button-primary {
    flex: initial;
  }
}

/* Transitions > Install Button Status */
.button-fade-enter-active,
.button-fade-leave-active {
  transition: opacity 0.25s ease-in-out, transform 0.25s ease-in-out;
}

.button-fade-enter-from,
.button-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.button-fade-enter-to,
.button-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Transitions > Configuration Mode Switch */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Textarea Styling */
textarea {
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: 1px solid rgba(129, 129, 129, 0.281);
}

textarea:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
}

textarea:disabled {
  opacity: 0.6;
  user-select: none !important;
}

/* Hide Scrollbar */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
