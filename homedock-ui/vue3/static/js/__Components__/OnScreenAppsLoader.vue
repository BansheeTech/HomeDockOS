<!-- homedock-ui/vue3/static/js/__Components__/OnScreenAppsLoader.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden p-6">
    <!-- HDOS00107 -->
    <div class="relative flex items-center justify-center w-44 flex-1 min-h-0 max-h-64">
      <PrismPanesLoader class="absolute inset-0" :is-checking="isChecking" :is-success="isSuccess" :is-error="isError" />
      <div class="relative z-10" :class="iconClass">
        <div class="icon-float" :class="{ 'is-drifting': isChecking }">
          <div class="absolute -inset-5 rounded-full blur-2xl transition-all ease-out" :class="haloClass" />
          <div class="relative">
            <BaseImage draggable="false" :src="icon" :alt="displayName" class="block w-10 h-10 rounded-[10px] shadow-[0_12px_28px_-10px_rgba(0,0,0,0.55),0_3px_8px_-4px_rgba(0,0,0,0.4)]" />
            <div class="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/25 via-transparent to-black/15 pointer-events-none" />
            <div class="absolute inset-0 rounded-[10px] ring-1 ring-inset ring-white/20 pointer-events-none" />
            <div class="absolute inset-0 rounded-[10px] ring-[1px] ring-gray-500/10 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <p :class="[themeClasses.hubCardTextAppName]" class="mt-1 font-bold text-sm tracking-tight">{{ displayName }}</p>

    <div class="flex items-center gap-1.5 mt-3.5">
      <span v-for="(step, index) in steps" :key="index" class="h-[3px] rounded-full transition-all duration-700 ease-out" :class="segmentClass(index)" :title="step" />
    </div>

    <div class="flex items-center justify-center mt-3.5 h-[30px]">
      <Transition name="fade-slide" mode="out-in">
        <p :key="statusText" :class="[themeClasses.appStatusPill]" class="flex items-center text-xs text-center px-4 py-1.5 rounded-full backdrop-blur-xl border">
          <Icon v-if="isError" :icon="linkVariantOff" class="text-xs mr-1.5" />
          <Icon v-else-if="isSuccess" :icon="checkBoldIcon" class="text-xs mr-1.5" />
          <Icon v-else :icon="loadingIcon" class="text-xs mr-1.5 animate-spin" />
          <span>{{ statusText }}</span>
        </p>
      </Transition>
    </div>

    <Transition name="fade-slide">
      <div v-if="isError" class="flex flex-col items-center gap-2 mt-3">
        <button :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs px-3 py-1 rounded-full transition duration-300 cursor-pointer" @click="retry">
          <Icon :icon="refreshIcon" class="text-xs mr-1" />
          <span>{{ $t("Try Again") }}</span>
        </button>
        <button v-if="canOpenExternally" :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs px-3 py-1 rounded-full transition duration-300 cursor-pointer" @click="emit('openExternal')">
          <Icon :icon="newTabIcon" class="text-xs mr-1" />
          <span>{{ $t("Open in a new tab") }}</span>
        </button>
        <a target="_blank" rel="noopener noreferrer" href="https://docs.homedock.cloud/troubleshooting/app-not-available/" :class="[themeClasses.appDocsMessage]" class="flex items-center text-xs px-3 py-1 rounded-full transition duration-300">
          <Icon :icon="cursorDefaultClickIcon" class="text-xs mr-1" />
          <span>{{ $t("Why is this app not loading?") }}</span>
        </a>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import axios from "axios";
import { useI18n } from "vue-i18n";

import { Icon } from "@iconify/vue";
import loadingIcon from "@iconify-icons/mdi/loading";
import refreshIcon from "@iconify-icons/mdi/refresh";
import linkVariantOff from "@iconify-icons/mdi/link-variant-off";
import cursorDefaultClickIcon from "@iconify-icons/mdi/cursor-default-click";
import newTabIcon from "@iconify-icons/mdi/open-in-new";
import checkBoldIcon from "@iconify-icons/mdi/check-bold";

import BaseImage from "./BaseImage.vue";
import PrismPanesLoader from "./PrismPanesLoader.vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { requestAppToken, buildAppSubdomainUrl } from "../__Composables__/useAppSubdomain";

// HDOS00105

interface Props {
  port: number;
  subpath?: string;
  slug: string;
  displayName: string;
  icon: string;
  canOpenExternally?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{ ready: [url: string]; openExternal: []; failed: [value: boolean] }>();

const { t } = useI18n();
const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const MAX_RETRIES = 10;
const RETRY_DELAY = 2500;

// HDOS00107
const OPENING_BEAT = 250;
const CONNECTED_BEAT = 250;

const isChecking = ref(true);
const isError = ref(false);
const retryCount = ref(0);
const animatedStep = ref(0);

let timer: ReturnType<typeof setTimeout> | null = null;
let stepTimers: ReturnType<typeof setTimeout>[] = [];
let cancelled = false;

const clearStepTimers = () => {
  stepTimers.forEach(clearTimeout);
  stepTimers = [];
};

const pause = (ms: number) => new Promise<void>((resolve) => (timer = setTimeout(resolve, ms)));

const steps = computed(() => [t("Connecting"), t("Verifying"), t("Launching")]);

const isSuccess = computed(() => !isChecking.value && !isError.value);

const currentStep = computed(() => {
  if (isError.value) return -1;
  if (!isChecking.value) return animatedStep.value;

  return retryCount.value > 0 ? 1 : 0;
});

const statusText = computed(() => {
  if (isError.value) return t("App not available on port {port}", { port: props.port });
  if (retryCount.value > 0) return t("Retrying {n}/{total}", { n: retryCount.value, total: MAX_RETRIES });
  if (!isChecking.value) return t("Connection established");

  return steps.value[Math.min(currentStep.value, steps.value.length - 1)];
});

const iconClass = computed(() => {
  if (isError.value) return "icon-implode scale-0 opacity-0";
  if (isSuccess.value) return "icon-pop scale-[2]";

  return "icon-pop scale-100";
});

const haloClass = computed(() => {
  if (isError.value) return "bg-red-400/45 opacity-100 scale-110 duration-200";
  if (isSuccess.value) return "bg-emerald-400/40 opacity-100 scale-125 duration-1000";

  return "bg-indigo-400/25 opacity-80 scale-100 duration-1000";
});

const segmentClass = (index: number) => {
  if (isError.value) return index === 0 ? [themeClasses.value.appStepDotError, "w-7 opacity-90"] : [themeClasses.value.appStepDot, "w-7 opacity-40"];
  if (isSuccess.value) return [themeClasses.value.appStepDotDone, index <= currentStep.value ? "w-7 opacity-100" : "w-7 opacity-40"];
  if (index < currentStep.value) return [themeClasses.value.appStepDotDone, "w-7 opacity-100"];
  if (index === currentStep.value) return [themeClasses.value.appStepDotActive, "w-10 animate-pulse"];

  return [themeClasses.value.appStepDot, "w-7 opacity-40"];
};

// HDOS00107
const giveUp = () => {
  isError.value = true;
  isChecking.value = false;

  emit("failed", true);
};

const check = async () => {
  if (cancelled) return;

  try {
    const { data } = await axios.post("/api/check-port", { port: props.port, subpath: props.subpath ?? "" }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } });

    if (!data?.available) throw new Error("unavailable");
  } catch {
    if (cancelled) return;

    retryCount.value++;

    if (retryCount.value >= MAX_RETRIES) {
      giveUp();
      return;
    }

    timer = setTimeout(check, RETRY_DELAY);
    return;
  }

  const handoff = await requestAppToken(props.slug, csrfToken.value);

  if (cancelled) return;

  if (!handoff) {
    giveUp();
    return;
  }

  await pause(CONNECTED_BEAT);

  if (cancelled) return;

  isChecking.value = false;

  // HDOS00120
  emit("ready", buildAppSubdomainUrl(handoff, props.subpath ?? ""));

  animatedStep.value = 1;
  stepTimers.push(setTimeout(() => (animatedStep.value = 2), 300));
  stepTimers.push(setTimeout(() => (animatedStep.value = 3), 600));
};

const retry = () => {
  clearStepTimers();

  isError.value = false;
  isChecking.value = true;
  retryCount.value = 0;
  animatedStep.value = 0;

  emit("failed", false);

  check();
};

onMounted(() => {
  timer = setTimeout(check, OPENING_BEAT);
});

onUnmounted(() => {
  cancelled = true;

  clearStepTimers();

  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
/* HDOS00107 */
@property --drift {
  syntax: "<length>";
  inherits: false;
  initial-value: 0px;
}

.icon-pop {
  transition:
    transform 700ms cubic-bezier(0.34, 1.32, 0.5, 1),
    opacity 400ms ease-out;
}

.icon-implode {
  transition:
    transform 420ms cubic-bezier(0.5, 0, 0.75, 0) 220ms,
    opacity 300ms ease-in 260ms;
}

.icon-float {
  --drift: 0px;
  animation: icon-drift 4.6s ease-in-out infinite;
  transition: --drift 700ms ease-out;
  will-change: transform;
}

.icon-float.is-drifting {
  --drift: 3px;
}

@keyframes icon-drift {
  0%,
  100% {
    transform: translateY(calc(var(--drift) * -1));
  }
  50% {
    transform: translateY(var(--drift));
  }
}

.fade-slide-enter-active {
  transition:
    opacity 300ms ease-out,
    transform 300ms ease-out;
}

.fade-slide-leave-active {
  transition:
    opacity 180ms ease-in,
    transform 180ms ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
