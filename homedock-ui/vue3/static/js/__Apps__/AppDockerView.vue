<!-- homedock-ui/vue3/static/js/__Apps__/AppDockerView.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-docker-view flex flex-col h-full overflow-hidden">
    <div v-if="blocker" class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="w-14 h-14 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
      <div class="flex flex-col gap-1.5">
        <p :class="[themeClasses.hubCardTextAppName]" class="font-bold text-sm">{{ blockerTitle }}</p>
        <p :class="[themeClasses.hubCardTextRepo]" class="text-xs max-w-md leading-relaxed">{{ blockerBody }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="blocker === 'wrong_host' && blockerAlternative" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors" @click="goToAlternative">
          {{ $t("Go to {domain}", { domain: blockerAlternative }) }}
        </button>
        <button v-else :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors" @click="blocker = null">
          {{ $t("Try anyway") }}
        </button>
        <button v-if="serviceUrl" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors" @click="blocker === 'untrusted' ? openInNewTab() : openPortInNewTab()">
          {{ $t("Open in a new tab") }}
        </button>
        <a href="https://docs.homedock.cloud/homedock-os/desktop/#on-screen-apps" target="_blank" rel="noopener noreferrer" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors">
          {{ $t("Learn more") }}
        </a>
      </div>
    </div>

    <div v-else-if="errorMessage" class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="w-14 h-14 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
      <div class="flex flex-col gap-1">
        <p :class="[themeClasses.hubCardTextAppName]" class="font-bold text-sm">{{ displayName }}</p>
        <p :class="[themeClasses.hubCardTextRepo]" class="text-xs max-w-sm">{{ errorMessage }}</p>
      </div>
      <button v-if="serviceUrl" :class="[themeClasses.explorerActionButton, themeClasses.explorerActionButtonHover]" class="rounded-lg px-3 py-1.5 text-xs transition-colors" @click="openInNewTab">
        {{ $t("Open in a new tab") }}
      </button>
    </div>

    <div v-else class="relative flex-1 min-h-0">
      <OnScreenAppsBackdrop v-if="frameReady" />

      <iframe v-if="appUrl || !appPort" :src="appUrl ?? 'about:blank'" :title="displayName" class="absolute inset-0 w-full h-full border-0" :class="frameReady ? 'opacity-100' : 'opacity-0 pointer-events-none'" allow="clipboard-read; clipboard-write; fullscreen; autoplay; camera; microphone; display-capture" @load="onFrameLoad" />

      <OnScreenAppsLoader v-if="appPort && !loaderGone" class="absolute inset-0 transition-opacity duration-500 ease-out" :class="frameReady ? 'opacity-0 pointer-events-none' : 'opacity-100'" :port="appPort" :subpath="''" :slug="app?.slug || appName" :display-name="displayName" :icon="appIcon" :can-open-externally="!!serviceUrl" @ready="onLoaderReady" @failed="loaderFailed = $event" @open-external="openInNewTab" />
    </div>

    <StatusBar :message="displayName" :info="frameHost || undefined" :loading="barLoading" :error="barError" :showHelp="true">
      <template #icon>
        <BaseImage draggable="false" :src="appIcon" alt="" class="w-3.5 h-3.5 flex-shrink-0 rounded-[3px]" />
      </template>

      <template #extra>
        <div class="flex items-center gap-1">
          <button :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" :title="$t('Properties')" @click="openProperties">
            <Icon :icon="propertiesIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
          <button v-if="hasAppDrive" :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" :title="$t('App Drive volumes')" @click="openAppDrive">
            <Icon :icon="folderOpenIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
          <button :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" :title="$t('Logs')" @click="openLogs">
            <Icon :icon="logsIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
          <button v-if="serviceUrl" :class="['flex items-center justify-center w-5 h-5 rounded-full transition-colors cursor-pointer border-0 bg-transparent', themeClasses.statusBarHelpButton]" :title="$t('Open in a new tab')" @click="openInNewTab">
            <Icon :icon="newTabIcon" class="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </template>

      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <BaseImage draggable="false" :src="appIcon" alt="" class="w-5 h-5 rounded-[4px]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">{{ displayName }}</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>{{ $t("This application is served at its own address. HomeDock OS matches that name to the port the container listens on and forwards the connection untouched, so the app behaves exactly as it would on its own port.") }}</p>
            <p>{{ $t("Its port stays closed to the outside: every request passes through HomeDock OS and requires your session.") }}</p>
            <p v-if="serviceUrl" class="flex items-start gap-1.5">
              <Icon :icon="newTabIcon" class="w-3.5 h-3.5 flex-shrink-0 mt-px opacity-70" />
              <span>{{ $t("This button opens the same address in a new tab. The direct port route is still listed under the app's Properties.") }}</span>
            </p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";

import { Icon } from "@iconify/vue";
import propertiesIcon from "@iconify-icons/mdi/information-outline";
import logsIcon from "@iconify-icons/mdi/script-text";
import newTabIcon from "@iconify-icons/mdi/open-in-new";
import folderOpenIcon from "@iconify-icons/mdi/folder-open";

import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";
import OnScreenAppsLoader from "../__Components__/OnScreenAppsLoader.vue";
import OnScreenAppsBackdrop from "../__Components__/OnScreenAppsBackdrop.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { hostSupportsAppWindows, isAddressLiteral, isMulticastTrail, requestAppToken, buildAppSubdomainUrl, probeSubdomainReachable, diagnoseSubdomainBlocker, subdomainTrail, type SubdomainBlocker } from "../__Composables__/useAppSubdomain";

interface Props {
  appName?: string;
  data?: {
    appName?: string;
  };
}

const props = defineProps<Props>();

const { t } = useI18n();
const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();
const windowStore = useWindowStore();
const csrfToken = useCsrfToken();

const fallbackIcon = "docker-icons/notfound.jpg";

const appName = computed(() => props.appName || props.data?.appName || "");
const app = computed(() => desktopStore.mainDockerApps.find((candidate) => candidate.name === appName.value));
const displayName = computed(() => app.value?.display_name || appName.value || "Unknown");
const appIcon = computed(() => app.value?.image_path || fallbackIcon);
const serviceUrl = computed(() => app.value?.service_url || null);

const errorMessage = ref<string | null>(null);
const frameHost = ref<string | null>(null);
const loaderFailed = ref(false);
const blocker = ref<SubdomainBlocker | null>(null);
const blockerAlternative = ref<string | null>(null);
const hasAppDrive = ref(false);

// HDOS00105
const appUrl = ref<string | null>(null);

// HDOS00107
const FRAME_LOAD_TIMEOUT = 2500;
const FRAME_FADE = 560;

// HDOS00120
const APP_PAINTED_SIGNAL = "homedock:app-painted";
const REVEAL_FLOOR = 900;

const frameReady = ref(false);
const loaderGone = ref(false);

let frameTimer: ReturnType<typeof setTimeout> | null = null;
let loaderTimer: ReturnType<typeof setTimeout> | null = null;
let floorTimer: ReturnType<typeof setTimeout> | null = null;
let readyAt = 0;

const appPort = computed(() => {
  const match = /\/app\/(\d+)/.exec(serviceUrl.value || "");

  return match ? Number(match[1]) : null;
});

// HDOS00105
const revealFrame = () => {
  if (frameReady.value) return;

  // HDOS00120
  const pending = readyAt ? REVEAL_FLOOR - (Date.now() - readyAt) : 0;

  if (pending > 0) {
    if (!floorTimer) floorTimer = setTimeout(revealFrame, pending);
    return;
  }

  if (frameTimer) clearTimeout(frameTimer);
  if (floorTimer) clearTimeout(floorTimer);

  frameReady.value = true;
  loaderTimer = setTimeout(() => (loaderGone.value = true), FRAME_FADE);
};

const onFrameLoad = () => revealFrame();

// HDOS00120
const onAppMessage = (event: MessageEvent) => {
  if (event.data !== APP_PAINTED_SIGNAL || !appUrl.value) return;
  if (event.origin !== new URL(appUrl.value).origin) return;

  revealFrame();
};

const onLoaderReady = (url: string) => {
  appUrl.value = url;
  frameHost.value = new URL(url).host;
  readyAt = Date.now();

  frameTimer = setTimeout(revealFrame, FRAME_LOAD_TIMEOUT);
};

const barError = computed(() => Boolean(loaderFailed.value || errorMessage.value || blocker.value));

const barLoading = computed(() => !frameHost.value && !barError.value);

const currentTrail = computed(() => subdomainTrail() || "");

const wildcardRecord = computed(() => `*.${currentTrail.value}`);

const blockerTitle = computed(() => {
  switch (blocker.value) {
    case "certificate":
      return t("Your certificate does not cover app subdomains");
    case "wrong_host":
      return t("Open HomeDock OS from {domain}", { domain: blockerAlternative.value ?? "" });
    case "untrusted":
      return t("This certificate is not trusted yet");
    default:
      return t("This address is not reachable yet");
  }
});

const blockerBody = computed(() => {
  switch (blocker.value) {
    case "certificate":
      return t("The certificate served for {host} does not include {record}, so the browser blocks apps from loading here. Reissue it covering the wildcard and restart HomeDock OS.", { host: currentTrail.value, record: wildcardRecord.value });
    case "wrong_host":
      return t("The certificate covers {domain} and its apps, but not {host}. A public certificate authority cannot issue one for {host}, so open HomeDock OS from {domain} and the windows will work.", { domain: blockerAlternative.value ?? "", host: currentTrail.value });
    case "untrusted":
      return t("A window cannot ask you to accept a self-signed certificate. Open the app in a new tab, accept it once, and it will load here. Installing the certificate as trusted on this device removes the prompt for every app.");
    case "unknown":
      return t("HomeDock OS could not determine what is blocking this app. Opening it in a new tab usually shows the reason.");
    default:
      return t("Opening apps as windows needs a wildcard DNS record. Add {record} pointing to the same address as {host}, and they will start opening here on their own.", { record: wildcardRecord.value, host: currentTrail.value });
  }
});

const goToAlternative = () => {
  if (!blockerAlternative.value) return;

  const port = window.location.port ? `:${window.location.port}` : "";
  window.location.href = `https://${blockerAlternative.value}${port}/`;
};

const openPortInNewTab = () => {
  if (serviceUrl.value) window.open(serviceUrl.value, "_blank", "noopener,noreferrer");
};

const openInNewTab = async () => {
  if (!appName.value) return;

  const handoff = await requestAppToken(appName.value, csrfToken.value);

  if (handoff) {
    window.open(buildAppSubdomainUrl(handoff), "_blank", "noopener,noreferrer");
    return;
  }

  if (serviceUrl.value) window.open(serviceUrl.value, "_blank", "noopener,noreferrer");
};

const loadAppDrive = async () => {
  const container = appName.value.replace(/[^a-zA-Z0-9._-]/g, "").substring(0, 128);

  if (!container) return;

  try {
    const { data } = await axios.get("/api/appdrive/mounts", {
      params: { container },
      headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
    });

    hasAppDrive.value = Array.isArray(data?.mounts) && data.mounts.length > 0;
  } catch {
    hasAppDrive.value = false;
  }
};

const openAppDrive = () => {
  const container = appName.value.replace(/[^a-zA-Z0-9._-]/g, "").substring(0, 128);

  if (!container) return;

  windowStore.openFileInApp("fileexplorer", {
    title: `File Explorer - ${displayName.value}`,
    data: { initialLocation: "appdrive", initialContainer: container, initialMountIndex: 0 },
  });
};

const openProperties = () => {
  if (!app.value) return;

  windowStore.openUniqueWindow("properties", app.value.id, {
    title: `${displayName.value} - ${t("Properties")}`,
    data: { appId: app.value.id },
  });
};

const openLogs = () => {
  if (!appName.value) return;

  windowStore.openUniqueWindow("logs", appName.value, {
    title: `${displayName.value} - ${t("Logs")}`,
    data: { appName: appName.value },
  });
};

onMounted(async () => {
  window.addEventListener("message", onAppMessage);

  if (!appName.value) {
    errorMessage.value = t("No application was specified for this window.");
    return;
  }

  // HDOS00103
  if (!hostSupportsAppWindows()) {
    if (isAddressLiteral()) {
      errorMessage.value = t("Per-app subdomains need HomeDock OS to be reached by name, not by IP address.");
    } else if (isMulticastTrail()) {
      errorMessage.value = t("OnScreen Apps are not available at {host}, so apps open in a new tab from here. Set your own domain in Settings to get them back.", { host: currentTrail.value });
    } else {
      errorMessage.value = t("OnScreen Apps need an address with a dot in it. Open HomeDock OS at homedock.localhost on this machine.");
    }

    return;
  }

  // HDOS00103
  if (desktopStore.certificateBlocksAppWindows) {
    errorMessage.value = desktopStore.subdomainCertificate.selfSigned ? t("The certificate is self-signed, and a window cannot ask you to accept it. Issue a trusted one in Settings.") : t("The certificate does not cover {record}. Reissue it in Settings and OnScreen Apps come back.", { record: `*.${window.location.hostname}` });
    return;
  }

  if (!serviceUrl.value) {
    errorMessage.value = t("This application has no routable port, so it cannot be embedded.");
    return;
  }

  loadAppDrive();

  if (app.value?.slug && (await probeSubdomainReachable(app.value.slug)) === false) {
    const diagnosis = await diagnoseSubdomainBlocker();
    blocker.value = diagnosis.blocker;
    blockerAlternative.value = diagnosis.alternative;
  }
});

onUnmounted(() => {
  window.removeEventListener("message", onAppMessage);

  if (frameTimer) clearTimeout(frameTimer);
  if (loaderTimer) clearTimeout(loaderTimer);
  if (floorTimer) clearTimeout(floorTimer);
});
</script>
