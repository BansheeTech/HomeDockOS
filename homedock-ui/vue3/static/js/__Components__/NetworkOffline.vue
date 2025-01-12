<!-- homedock-ui/vue3/static/js/__Components__/NetworkOffline.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <transition name="fade">
    <div v-if="!online" class="fixed bottom-0 w-full z-50 text-white text-center flex items-center justify-center bg-gradient-to-r from-purple-800 via-blue-800 to-teal-500 p-3 rounded-t-3xl">
      <Icon :icon="connectionIcon" class="text-gray-300 mr-1 min-w-3 min-h-3" width="12" height="12" />
      <p class="text-xs leading-3 m-0 px-4">Connection Lost: Unable to communicate with HomeDock OS. Please check your internet connection.</p>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

import { Icon } from "@iconify/vue";
import connectionIcon from "@iconify-icons/mdi/connection";

const online = ref(navigator.onLine);

function updateOnlineStatus() {
  online.value = navigator.onLine;
}

onMounted(() => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s, transform 1s ease-in-out;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.fade-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
