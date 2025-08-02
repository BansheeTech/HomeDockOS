<!-- homedock-ui/vue3/static/js/__Components__/StatusFooter.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="logo-fade-slide" appear>
    <div class="fixed bottom-14 left-0 right-0 flex justify-center text-xs z-50">
      <Transition name="fade-bounce">
        <div v-if="showIcons" class="flex items-center space-x-2 animate-bounce">
          <div class="relative">
            <div v-if="isSuccess" class="absolute inset-1 animate-ping">
              <div class="w-full h-full bg-green-400 rounded-2xl opacity-75"></div>
            </div>
            <div class="relative p-2 bg-white rounded-xl shadow-lg flex items-center justify-center">
              <BaseImage draggable="false" class="w-9 h-9" src="/images/logo_trans.svg" />
            </div>
          </div>

          <Transition name="icon-slide-up" appear>
            <div v-if="appSlug && appIconLoaded" class="relative">
              <div v-if="isSuccess" class="absolute inset-1 animate-ping">
                <div class="w-full h-full bg-green-400 rounded-2xl opacity-75"></div>
              </div>
              <BaseImage draggable="false" class="relative w-[3.25rem] h-[3.25rem] rounded-xl object-cover shadow-lg" :src="`docker-icons/${appSlug}.jpg`" :alt="`${appSlug} icon`" @error="appIconLoaded = false" />
            </div>
          </Transition>
        </div>
      </Transition>
    </div>
  </Transition>

  <div :class="[themeClasses.statusBarAppScope]" class="fixed bottom-0 left-0 right-0 backdrop-blur-md h-8 flex items-center justify-between px-4 text-xs border-t z-50">
    <div class="flex items-center space-x-2">
      <div class="min-h-1.5 min-w-1.5 rounded-full" :class="statusIndicatorColor"></div>
      <span class="font-semibold">{{ statusMessage }}</span>
    </div>
    <div class="flex items-center space-x-2">
      <div v-if="port" class="flex items-center space-x-1">
        <Icon :icon="serverNetworkIcon" class="text-xs min-h-3 min-w-3" />
        <span class="font-semibold">Port: {{ port }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import serverNetworkIcon from "@iconify-icons/mdi/server-network";

import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

const appIconLoaded = ref(false);
const showIcons = ref(false);

const props = defineProps({
  isSuccess: {
    type: Boolean,
    default: false,
  },
  isError: {
    type: Boolean,
    default: false,
  },
  isHttps: {
    type: Boolean,
    default: false,
  },
  statusMessage: {
    type: String,
    default: "Initializing...",
  },
  port: {
    type: String,
    default: "",
  },
  appSlug: {
    type: String,
    default: "",
  },
});

watch(
  () => props.appSlug,
  () => {
    appIconLoaded.value = false;
  }
);

onMounted(() => {
  setTimeout(() => {
    showIcons.value = !props.isError;
  }, 50);

  if (props.appSlug) {
    const img = new Image();
    img.onload = () => {
      appIconLoaded.value = true;
    };
    img.onerror = () => {
      appIconLoaded.value = false;
    };
    img.src = `/images/docker-icons/${props.appSlug}.jpg`;
  }
});

watch(
  () => props.isError,
  (newError) => {
    showIcons.value = !newError;
  }
);

const statusIndicatorColor = computed(() => {
  if (props.isSuccess) return "bg-green-600";
  if (props.isError) return "bg-red-600";
  return "bg-blue-600 animate-pulse";
});
</script>

<style scoped>
/* Logo Fade Enter Animation */
.logo-fade-slide-enter-active {
  transition: all 1s cubic-bezier(0.25, 1, 0.5, 1);
}
.logo-fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.logo-fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Logo Failed Load Dissappear Animation */
.fade-bounce-enter-active,
.fade-bounce-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.fade-bounce-enter-from,
.fade-bounce-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
.fade-bounce-enter-to,
.fade-bounce-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* Icon Slide Up Animation */
.icon-slide-up-enter-active {
  transition: all 0.5s ease-out;
}
.icon-slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.icon-slide-up-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Success Burst Animation */
.success-burst-enter-active {
  transition: opacity 0.3s ease;
}
.success-burst-leave-active {
  transition: opacity 0.5s ease;
}
.success-burst-enter-from,
.success-burst-leave-to {
  opacity: 0;
}
.success-burst-enter-to,
.success-burst-leave-from {
  opacity: 1;
}
</style>
