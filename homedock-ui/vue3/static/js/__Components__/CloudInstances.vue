<!-- homedock-ui/vue3/static/js/__Components__/CloudInstances.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <transition name="slide-down-fade">
    <div v-show="isBannerVisible" class="relative z-30 grid grid-rows-[1fr] w-full">
      <div class="overflow-hidden">
        <div class="relative text-xs w-full min-h-8 text-white text-center flex items-center justify-center rounded-3xl bg-gradient-to-r from-[#6e0000] via-[#4b0092] to-[#1575bf] animate-rainbow py-2.5">
          <span id="CloudInstancesClose" class="absolute right-4 text-white cursor-pointer" @click="closeCloudInstanceContainer">
            <Icon :icon="closeIcon" class="mr-1 text-current" width="14" height="14" />
          </span>
          <a target="_blank" href="https://www.homedock.cloud" class="block text-balance px-8">
            <Icon :icon="openIcon" class="inline-block align-middle mr-1 text-current" width="14" height="14" />
            <span>{{ $t("Check out our HomeDock OS Cloud Instances!") }}</span>
          </a>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { Icon } from "@iconify/vue";
import openIcon from "@iconify-icons/mdi/open-in-new";
import closeIcon from "@iconify-icons/mdi/close-thick";

interface Props {
  isVisible: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:isVisible", value: boolean): void;
}>();

const isBannerVisible = ref<boolean>(false);

const closeCloudInstanceContainer = (): void => {
  const todayFormatted = new Date().toISOString().split("T")[0];
  localStorage.setItem("cloudInstancePopShown", todayFormatted);
  isBannerVisible.value = false;
  emit("update:isVisible", false);
};

const checkLastShownDateAndShowCloudInstances = (): void => {
  const lastShownDate = localStorage.getItem("cloudInstancePopShown");
  const today = new Date();
  let shouldShowCloudInstanceContainer = false;

  if (!lastShownDate) {
    shouldShowCloudInstanceContainer = true;
  } else {
    const lastDate = new Date(lastShownDate);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (diffDays > 7) {
      shouldShowCloudInstanceContainer = true;
    }
  }

  if (shouldShowCloudInstanceContainer) {
    isBannerVisible.value = true;
    emit("update:isVisible", true);
  } else {
    isBannerVisible.value = false;
    emit("update:isVisible", false);
  }
};

watch(
  () => props.isVisible,
  (newValue) => {
    if (newValue) {
      checkLastShownDateAndShowCloudInstances();
    }
  },
);
</script>

<style scoped>
@keyframes rainbow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.animate-rainbow {
  animation: rainbow 8s ease infinite;
  background-size: 200% 200%;
}

.slide-down-fade-enter-active,
.slide-down-fade-leave-active {
  transition:
    grid-template-rows 0.6s ease,
    opacity 0.6s ease;
}

.slide-down-fade-enter-from,
.slide-down-fade-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.slide-down-fade-enter-to,
.slide-down-fade-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}
</style>
