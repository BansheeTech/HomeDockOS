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
        <div :class="[themeClasses.storeContMainer, themeClasses.aeroExtraScope]" class="px-4 md:px-6 lg:px-8 py-5">
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

        <div class="px-4 md:px-6 lg:px-8 py-5">
          <div class="mb-6">
            <p :class="[themeClasses.storeAboutTextDescScope]" class="text-sm leading-relaxed mb-3">
              {{ app?.description + "." || "No description available" }}
            </p>
            <div v-if="app?.dependencies && app.dependencies.length >= 1" :class="[themeClasses.storeAboutTextDepsScope]" class="text-xs inline-flex items-center px-2.5 py-1.5 rounded-md">
              <Icon :icon="cubeIcon" class="h-3 w-3 mr-1.5" />
              <span>{{ app?.dependencies.concat().join(", ") }}</span>
            </div>
          </div>

          <div :class="[themeClasses.storeSeparator]" class="h-px mb-6"></div>

          <Transition name="fade-slide" mode="out-in">
            <div v-if="!isAdvancedMode" key="simple">
              <div v-if="userName !== undefined || userPassword !== undefined" class="mb-6">
                <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider mb-3">Access Credentials</h3>
                <div class="space-y-3">
                  <Input v-if="userName !== undefined" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="userName" placeholder="Username" class="w-full" />
                  <InputPassword v-if="userPassword !== undefined" autocomplete="new-password" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="userPassword" placeholder="Password" class="w-full" />
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Port Mappings</h3>
                  <Button :disabled="app?.is_installed" type="link" @click="addPort" size="small"> + Add </Button>
                </div>
                <div class="space-y-2">
                  <div v-for="(port, index) in ports" :key="'port-' + index" class="flex items-center gap-2">
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="ports[index]" placeholder="8080:80" class="flex-1" />
                    <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="app?.is_installed" type="dashed" @click="removePort(index)">
                      <Icon :icon="deleteIcon" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <div class="flex items-center justify-between mb-3">
                  <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider">Volume Mounts</h3>
                  <Button :disabled="app?.is_installed" type="link" @click="addVolume" size="small"> + Add </Button>
                </div>
                <div class="space-y-2">
                  <div v-for="(volume, index) in volumes" :key="'volume-' + index" class="flex items-center gap-2">
                    <Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :disabled="app?.is_installed" v-model:value="volumes[index]" placeholder="/host:/container" class="flex-1">
                      <template #prefix v-if="volume.includes('/DATA/SSLCerts')">
                        <Icon :icon="lockIcon" :class="[themeClasses.installConfigSSLVolumeIcon]" class="h-3.5 w-3.5 -translate-x-0.5" />
                      </template>
                    </Input>
                    <Button :class="[themeClasses.storeLinkHDOSButton]" :disabled="app?.is_installed" type="dashed" @click="removeVolume(index)">
                      <Icon :icon="deleteIcon" />
                    </Button>
                  </div>
                </div>
              </div>

              <div class="mb-6">
                <h3 :class="[themeClasses.storeAboutTextScope]" class="text-xs font-semibold uppercase tracking-wider mb-3">Restart Policy</h3>
                <Select :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :popup-class-name="`${themeClasses.scopeSelector}`" :disabled="app?.is_installed" v-model:value="restartPolicy" class="w-full" :get-popup-container="(trigger: any) => trigger.parentNode">
                  <SelectOption :class="[themeClasses.scopeSelector]" value="always">Always</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="unless-stopped">Unless Stopped</SelectOption>
                  <SelectOption :class="[themeClasses.scopeSelector]" value="no">No</SelectOption>
                </Select>
              </div>
            </div>

            <div v-else key="advanced">
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
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useAppStore } from "../__Stores__/useAppStore";
import { useInstallationStore } from "../__Stores__/useInstallationStore";
import { App } from "../__Types__/AppStoreApp";

import { Button, Select, SelectOption, Input, InputPassword, Switch } from "ant-design-vue";

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

const isAdvancedMode = ref(false);
const ports = ref<string[]>([]);
const volumes = ref<string[]>([]);
const restartPolicy = ref("unless-stopped");
const advancedCompose = ref("");
const userName = ref<string | undefined>(undefined);
const userPassword = ref<string | undefined>(undefined);
const sslEnabled = ref(false);
const hasLoadedConfig = ref(false);
const showExternalWarning = ref(false);
const pendingInstall = ref(false);

const csrfToken = useCsrfToken();

async function fetchAppInfo() {
  if (!app.value?.name || hasLoadedConfig.value) return;

  hasLoadedConfig.value = true;

  try {
    const response = await axios.get("/api/get-appstore-info", {
      params: { containerName: app.value.name },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    if (response.data?.success) {
      ports.value = response.data.data.ports || [];
      volumes.value = response.data.data.volumes || [];
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
  ports.value.push("");
}

function removePort(index: number) {
  ports.value.splice(index, 1);
}

function addVolume() {
  volumes.value.push("");
}

function removeVolume(index: number) {
  volumes.value.splice(index, 1);
}

function handleAdvancedModeToggle(checked: unknown, _e: Event) {
  isAdvancedMode.value = Boolean(checked);
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
          ports: ports.value,
          volumes: volumes.value,
          restartPolicy: restartPolicy.value,
          homedock_csrf_token: currentToken,
        };

    const response = await axios.post("/api/process-config", configData, {
      headers: { "X-HomeDock-CSRF-Token": currentToken },
    });

    if (!response.data.success) {
      console.error(`Failed to process configuration: ${response.data.message}`);
      return;
    }

    await installationStore.trackInstallations();

    await axios.post("/api/app-store-install-container", {
      containerName: app.value.name,
      homedock_csrf_token: currentToken,
    });
  } catch (error) {
    console.error("Error during installation process:", error);
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

watch(
  app,
  (newApp) => {
    if (newApp?.name) {
      fetchAppInfo();
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (app.value?.name) {
    fetchAppInfo();
  }
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
</style>
