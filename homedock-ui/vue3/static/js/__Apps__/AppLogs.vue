<!-- homedock-ui/vue3/static/js/__Apps__/AppLogs.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div class="app-logs flex flex-col h-full overflow-hidden">
    <div class="flex-1 overflow-hidden p-4 flex flex-col">
      <div class="app-details flex items-center space-x-4 mb-4">
        <BaseImage draggable="false" :src="appIcon" alt="App Icon" class="app-icon w-12 h-12 min-w-12 min-h-12 rounded-xl drop-shadow-md ring-[1px] ring-gray-500/10" />
        <div class="flex flex-col justify-center">
          <p :class="[themeClasses.hubCardTextAppName]" class="app-name font-bold text-sm">{{ displayName }} logs</p>
          <p :class="[themeClasses.hubCardTextRepo]" class="app-docker-image text-xs">Real-time container logs</p>
        </div>
      </div>

      <hr :class="[themeClasses.hubSeparator]" class="border-0 h-px mb-4" />

      <textarea :class="[themeClasses.hubTextArea]" class="flex-1 rounded-lg w-full font-mono text-xs resize-none p-3" v-model="containerLogs" readonly placeholder="Loading logs..."></textarea>

      <div class="mt-3 flex items-center gap-2">
        <Switch v-model:checked="autoRefresh" size="small">
          <template #checkedChildren>
            <span class="switch-icon">
              <Icon :icon="spinIcon" class="animate-spin" />
            </span>
          </template>
          <template #unCheckedChildren>
            <span class="switch-text">Auto</span>
          </template>
        </Switch>
        <span :class="[themeClasses.hubCardTextRepo]" class="text-xs">
          {{ autoRefresh ? "Auto-refreshing every 3s" : "Auto-refresh disabled" }}
        </span>
      </div>
    </div>

    <StatusBar :icon="scriptTextIcon" message="Logs" :info="`Viewing ${displayName}`" :showHelp="true">
      <template #help>
        <div class="space-y-2.5 max-w-sm">
          <div class="flex items-center gap-2">
            <Icon :icon="scriptTextIcon" :class="['w-5 h-5', themeClasses.statusBarIcon]" />
            <h4 :class="['text-base font-semibold', themeClasses.statusBarText]">Logs</h4>
          </div>

          <div :class="['text-[10px] md:text-xs space-y-2 leading-relaxed', themeClasses.statusBarInfo]">
            <p>View real-time logs from your applications to monitor activity and troubleshoot issues. Enable auto-refresh to automatically update the logs every 3 seconds, ensuring you always see the latest output without manual intervention. Perfect for debugging and monitoring container behavior in real-time.</p>
          </div>
        </div>
      </template>
    </StatusBar>
  </div>
</template>

<script lang="ts" setup>
import axios from "axios";

import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useDesktopStore } from "../__Stores__/desktopStore";
import { Switch } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import spinIcon from "@iconify-icons/mdi/loading";

import scriptTextIcon from "@iconify-icons/mdi/script-text";
import BaseImage from "../__Components__/BaseImage.vue";
import StatusBar from "../__Components__/StatusBar.vue";

interface Props {
  appName?: string;
  data?: {
    appName?: string;
  };
}

const props = defineProps<Props>();
const { themeClasses } = useTheme();
const desktopStore = useDesktopStore();

const appName = computed(() => props.appName || props.data?.appName || "Unknown");
const displayName = computed(() => {
  const app = desktopStore.mainDockerApps.find((a) => a.name === appName.value);
  return app?.display_name || appName.value;
});

const containerLogs = ref("");
const autoRefresh = ref(false);
const refreshInterval = ref<NodeJS.Timeout | null>(null);

const csrfToken = useCsrfToken();
const fallbackIcon = "docker-icons/notfound.jpg";
const appIcon = computed(() => {
  const app = desktopStore.mainDockerApps.find((a) => a.name === appName.value);
  return app?.image_path || fallbackIcon;
});

const fetchContainerLogs = async () => {
  try {
    const response = await axios.get(`/api/view-container-logs`, {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
      params: {
        containerName: appName.value,
      },
    });

    if (response.data?.logs && response.data.logs.trim() !== "") {
      containerLogs.value = response.data.logs;
    } else {
      containerLogs.value = "No logs found for this application.";
    }
  } catch (error) {
    containerLogs.value = "Failed to fetch logs for this application.";
  }
};

watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval.value = setInterval(() => {
      fetchContainerLogs();
    }, 3000);
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  }
});

onMounted(() => {
  fetchContainerLogs();
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});
</script>

<style scoped>
textarea {
  outline: 1px solid rgba(129, 129, 129, 0.281);
  font-family: "Courier New", Courier, monospace;
}

textarea:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
}

.switch-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.8rem;
}

.switch-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 0.8rem;
  transform: translateY(2px);
}
</style>
