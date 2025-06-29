<!-- homedock-ui/vue3/static/js/__Components__/StatusFooter.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="logo-fade-slide" appear>
    <div class="fixed bottom-14 left-0 right-0 flex justify-center text-xs z-50">
      <Transition name="fade-bounce" appear>
        <div v-if="!isError" class="p-2 bg-white rounded-xl shadow-lg flex items-center justify-center animate-bounce">
          <BaseImage draggable="false" class="w-9 h-9" src="/images/logo_trans.svg" />
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
import { computed } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Icon } from "@iconify/vue";
import serverNetworkIcon from "@iconify-icons/mdi/server-network";

import BaseImage from "../__Components__/BaseImage.vue";

const { themeClasses } = useTheme();

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
});

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
</style>
