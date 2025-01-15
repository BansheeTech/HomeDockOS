<!-- homedock-ui/vue3/static/js/__Components__/PortRouter.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootElement" class="relative min-h-4">
    <Transition name="fade-slide">
      <div v-if="!isEditing" :class="[themeClasses.appRepo, displayClass]" class="absolute flex items-center text-xs cursor-pointer" @dblclick="startEditing" key="view-mode">
        <Icon :class="iconClass" :icon="currentIcon" class="mr-1" width="14" height="14" />
        <Transition mode="out-in" name="fade-in">
          <span class="will-change-transform" :key="portsDisplay">{{ portsDisplay }}</span>
        </Transition>
      </div>
      <div v-else class="absolute flex items-center space-x-1" key="edit-mode"><Input :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="portsValue" @input="handleValidatedInput" type="text" class="form-control-sm w-32 text-xs h-4 py-0 px-2 rounded-[4px] will-change-transform" /> <Icon :class="themeClasses.portSaveScope" :icon="saveIcon" class="cursor-pointer" @click="saveData" /></div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { Input } from "ant-design-vue";
import axios from "axios";

import { Icon } from "@iconify/vue";
import saveIcon from "@iconify-icons/mdi/content-save";
import multiplePortsIcon from "@iconify-icons/mdi/alert-rhombus";
import singlePortIcon from "@iconify-icons/mdi/check-bold";
import hostmodeIcon from "@iconify-icons/mdi/network-strength-4-cog";
import disabledIcon from "@iconify-icons/mdi/cloud-question";

import { notifyWarning, notifySuccess } from "../__Components__/Notifications.vue";

const props = defineProps({
  containerId: String,
  initialPorts: String,
  csrfToken: String,
});

const emit = defineEmits(["update"]);

const { themeClasses } = useTheme();

const rootElement = ref(null);

const isEditing = ref(false);
const portsValue = ref(props.initialPorts);
const originalPorts = ref(props.initialPorts);
const isLoading = ref(false);

const portsArray = computed(() => props.initialPorts.split(":"));
const isHostMode = computed(() => props.initialPorts === "hostmode");
const isDisabled = computed(() => props.initialPorts === "disabled");
const hasMultiplePorts = computed(() => portsArray.value.length > 1);

const portsDisplay = computed(() => (isHostMode.value ? "hostmode" : props.initialPorts));

const currentIcon = computed(() => {
  if (isDisabled.value) return disabledIcon;
  if (isHostMode.value) return hostmodeIcon;
  if (hasMultiplePorts.value) return multiplePortsIcon;
  return singlePortIcon;
});

const iconClass = computed(() => {
  if (isHostMode.value) return "text-yellow-500";
  if (isDisabled.value) return "text-indigo-500";
  if (hasMultiplePorts.value) return "text-red-500";
  return "text-green-500";
});

const displayClass = computed(() => {
  if (isDisabled.value) return "!text-indigo-500";
  if (isHostMode.value) return "!text-yellow-500";
  if (hasMultiplePorts.value) return "!text-red-500";
  return "!text-green-500";
});

function startEditing() {
  if (isLoading.value) return;
  isEditing.value = true;
}

function closeEditing() {
  isEditing.value = false;
  portsValue.value = originalPorts.value;
}

function saveData() {
  if (portsValue.value.trim() === originalPorts.value.trim()) {
    closeEditing();
    return;
  }

  isLoading.value = true;

  axios
    .post("/api/port_route", {
      container_id: props.containerId,
      ports_list: portsValue.value,
      homedock_csrf_token: props.csrfToken,
    })
    .then((response) => {
      const data = response.data;
      if (data.status === "success") {
        originalPorts.value = portsValue.value;
        emit("update", portsValue.value);
        notifySuccess("Success", "Ports updated successfully!", themeClasses.value.scopeSelector);
      }
    })
    .catch((error) => {
      const responseData = error.response?.data || {};
      const errorMessage = responseData.error_message || "An unknown error occurred.";
      notifyWarning(errorMessage, themeClasses.value.scopeSelector);
    })
    .finally(() => {
      isLoading.value = false;
      closeEditing();
    });
}

function handleValidatedInput(event) {
  let value = event.target.value;
  portsValue.value = value.replace(/[^0-9a-zA-Z:/]/g, "");
  event.target.value = portsValue.value;
}

function handleClickOutside(event) {
  if (rootElement.value && !rootElement.value.contains(event.target)) {
    closeEditing();
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
/* Double Click Transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: scaleX(2);
}

/* Updated Value Transition */
.fade-in-enter-active,
.fade-in-leave-active {
  transition: all 0.3s ease;
}
.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
  transform: scale(2, 0.5);
}

::v-deep(.white-mode-theme input) {
  background-color: rgb(255, 255, 255) !important;
  color: rgb(31, 31, 31) !important;
}

::v-deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.aero-mode-theme input) {
  background-color: rgba(0, 0, 0, 0) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

::v-deep(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.aero-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

::v-deep(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.aero-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.white-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
}

::v-deep(.dark-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.aero-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.ant-input.white-mode-theme) {
  color: rgb(136, 136, 136) !important;
}

::v-deep(.ant-input.dark-mode-theme) {
  color: rgb(197, 197, 197) !important;
}

::v-deep(.ant-input.aero-mode-theme) {
  color: rgb(197, 197, 197) !important;
}
</style>
