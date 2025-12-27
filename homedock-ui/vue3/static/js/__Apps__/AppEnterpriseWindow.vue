<!-- homedock-ui/vue3/static/js/__Apps__/AppEnterpriseWindow.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="enterprise-window flex flex-col h-full overflow-hidden" :class="[themeClasses.scopeSelector]">
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" :class="themeClasses.spinnerBorder"></div>
        <span class="text-sm opacity-70" :class="themeClasses.textMuted">Loading enterprise module...</span>
      </div>
    </div>

    <div v-else-if="error" class="flex-1 flex items-center justify-center p-6">
      <div class="flex flex-col items-center gap-4 text-center max-w-md">
        <div class="w-16 h-16 rounded-full flex items-center justify-center" :class="themeClasses.errorBg">
          <Icon :icon="shieldAlertIcon" width="32" height="32" :class="themeClasses.errorText" />
        </div>
        <h3 class="text-lg font-semibold m-0" :class="themeClasses.textPrimary">Enterprise Module Unavailable</h3>
        <p class="text-sm m-0 opacity-70" :class="themeClasses.textMuted">{{ error }}</p>
      </div>
    </div>

    <component v-else-if="moduleComponent" :is="moduleComponent" :theme-classes="themeClasses" class="flex-1 overflow-auto" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, watch, type Component } from "vue";
import { Icon } from "@iconify/vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import EnterpriseSRILoader from "../__Utils__/EnterpriseSRILoader";

import shieldAlertIcon from "@iconify-icons/mdi/shield-alert";

interface Props {
  module?: string;
  data?: {
    module?: string;
  };
}

const props = defineProps<Props>();
const { themeClasses } = useTheme();

const isLoading = ref(true);
const error = ref<string | null>(null);
const moduleComponent = shallowRef<Component | null>(null);

function loadEnterpriseModule(): void {
  const moduleName = props.module || props.data?.module;

  if (!moduleName) {
    error.value = "No enterprise module specified.";
    isLoading.value = false;
    return;
  }

  if (!EnterpriseSRILoader.isReady()) {
    setTimeout(loadEnterpriseModule, 100);
    return;
  }

  const entry = EnterpriseSRILoader.getModuleByName(moduleName);

  if (!entry) {
    error.value = `Module "${moduleName}" is not available. It may not be licensed or properly signed.`;
    isLoading.value = false;
    return;
  }

  if (!entry.component) {
    error.value = `Module "${moduleName}" does not expose a component.`;
    isLoading.value = false;
    return;
  }

  moduleComponent.value = entry.component;
  isLoading.value = false;
}

onMounted(() => {
  loadEnterpriseModule();
});

watch(
  () => props.module || props.data?.module,
  () => {
    isLoading.value = true;
    error.value = null;
    moduleComponent.value = null;
    loadEnterpriseModule();
  }
);
</script>

<style scoped>
.enterprise-window {
  min-height: 100%;
}
</style>
