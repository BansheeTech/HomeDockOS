<!-- homedock-ui/vue3/static/js/__Components__/PortRouter.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="rootElement" class="port-router-container">
    <Transition name="fade-slide" mode="out-in">
      <!-- View -->
      <div v-if="!isEditing" class="port-content" key="view-mode">
        <div class="port-display" :class="[themeClasses.appPropsInfoValue, displayClass]">
          <Icon :class="iconClass" :icon="currentIcon" width="16" height="16" />
          <Transition mode="out-in" name="fade-in">
            <span :key="portsDisplay" class="port-text">{{ portsDisplay }}</span>
          </Transition>
          <button @click="startEditing" class="edit-button" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover]" :title="'Edit ports'">
            <Icon :icon="editIcon" width="14" height="14" />
          </button>
        </div>
      </div>

      <!-- Edit -->
      <div v-else class="port-content" key="edit-mode">
        <div class="port-edit">
          <Input ref="inputElement" :class="[themeClasses.scopeSelector, themeClasses.loginFormInput]" :value="portsValue" @input="handleValidatedInput" @keyup="handleKeyUp" type="text" placeholder="e.g., 8080 or 8080:80:443" class="port-input" />
          <div class="port-actions">
            <button @click="saveData" class="action-button save" :class="[themeClasses.appPropsActionButtonPrimaryBg, themeClasses.appPropsActionButtonPrimaryBorder, themeClasses.appPropsActionButtonPrimaryText, themeClasses.appPropsActionButtonPrimaryBgHover]" :disabled="isLoading" title="Save (Enter)">
              <Icon :icon="isLoading ? loadingIcon : saveIcon" width="16" height="16" :class="{ 'animate-spin': isLoading }" />
            </button>
            <button @click="closeEditing" class="action-button cancel" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover]" :disabled="isLoading" title="Cancel (Esc)">
              <Icon :icon="closeIcon" width="16" height="16" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import axios from "axios";

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import { Input } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import saveIcon from "@iconify-icons/mdi/content-save";
import multiplePortsIcon from "@iconify-icons/mdi/alert-rhombus";
import singlePortIcon from "@iconify-icons/mdi/check-bold";
import hostmodeIcon from "@iconify-icons/mdi/network-strength-4-cog";
import disabledIcon from "@iconify-icons/mdi/cloud-question";
import editIcon from "@iconify-icons/mdi/pencil-outline";
import closeIcon from "@iconify-icons/mdi/close";
import loadingIcon from "@iconify-icons/mdi/loading";

import { notifyWarning, notifySuccess } from "../__Components__/Notifications.vue";

const props = defineProps({
  containerId: String,
  initialPorts: String,
});

const emit = defineEmits(["update"]);

const { themeClasses } = useTheme();
const csrfToken = useCsrfToken();

const rootElement = ref(null);
const inputElement = ref(null);

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

async function startEditing() {
  if (isLoading.value) return;
  isEditing.value = true;
  await nextTick();
  inputElement.value?.focus();
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
      homedock_csrf_token: csrfToken.value,
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

function handleKeyUp(event) {
  if (event.key === "Enter") {
    saveData();
  } else if (event.key === "Escape") {
    closeEditing();
  }
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
.port-router-container {
  width: 100%;
  min-height: 2rem;
  position: relative;
}

.port-content {
  width: 100%;
  min-height: 2rem;
  display: flex;
  align-items: center;
}

/* View */
.port-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.port-text {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.edit-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.7;
  flex-shrink: 0;
}

.edit-button:hover {
  opacity: 1;
  transform: scale(1.05);
}

/* Edit */
.port-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2rem;
}

.port-input {
  flex: 1;
  min-width: 0;
  height: 2rem;
  padding: 0.375rem 0.625rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.port-actions {
  display: flex;
  gap: 0.375rem;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transitions */
.fade-slide-enter-active {
  transition: all 0.2s ease-out;
}

.fade-slide-leave-active {
  transition: all 0.15s ease-in;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.fade-in-enter-active,
.fade-in-leave-active {
  transition: all 0.15s ease;
}

.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

/* Input Theme Overrides */
:deep(.ant-input) {
  border: 1px solid;
}

:deep(.white-mode-theme input) {
  background-color: rgb(255, 255, 255) !important;
  color: rgb(31, 31, 31) !important;
}

:deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

:deep(.aero-mode-theme input) {
  background-color: rgba(0, 0, 0, 0.3) !important;
  color: rgb(255, 255, 255) !important;
  backdrop-filter: blur(12px);
}

:deep(.white-mode-theme input::placeholder) {
  color: rgb(160, 160, 160) !important;
}

:deep(.dark-mode-theme input::placeholder) {
  color: rgb(120, 120, 120) !important;
}

:deep(.aero-mode-theme input::placeholder) {
  color: rgba(255, 255, 255, 0.5) !important;
}
</style>
