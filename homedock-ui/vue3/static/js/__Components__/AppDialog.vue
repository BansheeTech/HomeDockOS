<!-- homedock-ui/vue3/static/js/__Components__/AppDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div v-if="visible" class="dialog-overlay fixed inset-0 z-[10000] flex items-center justify-center" @click="handleOverlayClick">
        <Transition name="dialog">
          <div v-if="visible" class="dialog-window rounded-xl flex flex-col overflow-hidden shadow-2xl" :class="[themeClasses.windowBg, themeClasses.windowBorderFocused, themeClasses.windowShadow]" :style="dialogStyle" @click.stop>
            <div class="dialog-header flex items-center gap-3 px-4 py-3 border-b" :class="[themeClasses.windowTitleBarBg, themeClasses.windowTitleBarBorder]">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <Icon v-if="icon" :icon="icon" class="flex-shrink-0" :class="[iconColorClass, themeClasses.windowTitleTextFocused]" width="20" height="20" />
                <span class="text-sm font-semibold truncate" :class="themeClasses.windowTitleTextFocused">{{ title }}</span>
              </div>

              <button class="dialog-close-btn flex items-center justify-center w-8 h-8 rounded-md transition-all duration-150" :class="[themeClasses.windowButtonText, themeClasses.windowCloseButtonBgHover, themeClasses.windowCloseButtonTextHover]" @click="handleCancel" title="Close">
                <Icon :icon="closeIcon" width="14" height="14" />
              </button>
            </div>

            <div class="dialog-body flex-1 px-6 py-5 overflow-auto">
              <slot>
                <p class="text-sm leading-relaxed m-0" :class="[themeClasses.notTextDown]">{{ content }}</p>
              </slot>
            </div>

            <div class="dialog-footer flex items-center justify-end gap-3 px-6 py-4 border-t" :class="[themeClasses.windowTitleBarBorder]">
              <button v-if="okCancel" class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleCancel">
                {{ cancelText }}
              </button>

              <button class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="okButtonClasses" @click="handleOk" :disabled="loading">
                <Icon v-if="loading" :icon="loadingIcon" width="16" height="16" class="animate-spin" />
                <span v-else>{{ okText }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed } from "vue";

import { Icon } from "@iconify/vue";
import closeIcon from "@iconify-icons/mdi/close";
import infoIcon from "@iconify-icons/mdi/information-outline";
import successIcon from "@iconify-icons/mdi/check-circle-outline";
import warningIcon from "@iconify-icons/mdi/alert-outline";
import errorIcon from "@iconify-icons/mdi/alert-circle-outline";
import helpIcon from "@iconify-icons/mdi/help-circle-outline";
import loadingIcon from "@iconify-icons/mdi/loading";

import { useTheme } from "../__Themes__/ThemeSelector";

export type DialogType = "info" | "success" | "warning" | "error" | "confirm";

interface Props {
  visible?: boolean;
  type?: DialogType;
  title?: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  okCancel?: boolean;
  width?: number;
  maskClosable?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: "info",
  title: "Dialog",
  content: "",
  okText: "OK",
  cancelText: "Cancel",
  okCancel: true,
  width: 420,
  maskClosable: true,
  loading: false,
});

const emit = defineEmits<{
  ok: [];
  cancel: [];
  "update:visible": [value: boolean];
}>();

const { themeClasses } = useTheme();

const dialogStyle = computed(() => ({
  width: `${props.width}px`,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100vh - 32px)",
}));

const icon = computed(() => {
  switch (props.type) {
    case "success":
      return successIcon;
    case "warning":
      return warningIcon;
    case "error":
      return errorIcon;
    case "confirm":
      return helpIcon;
    case "info":
    default:
      return infoIcon;
  }
});

const iconColorClass = computed(() => {
  switch (props.type) {
    case "success":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "error":
      return "text-red-500";
    case "confirm":
      return "text-blue-500";
    case "info":
    default:
      return "text-blue-500";
  }
});

const okButtonClasses = computed(() => {
  if (props.type === "error" || (props.type === "confirm" && props.okText.toLowerCase().includes("delete")) || props.okText.toLowerCase().includes("uninstall") || props.okText.toLowerCase().includes("remove")) {
    return [themeClasses.value.appPropsActionButtonDangerBg, themeClasses.value.appPropsActionButtonDangerBorder, themeClasses.value.appPropsActionButtonDangerText, themeClasses.value.appPropsActionButtonDangerBgHover, themeClasses.value.appPropsActionButtonDangerBorderHover];
  } else {
    return [themeClasses.value.appPropsActionButtonPrimaryBg, themeClasses.value.appPropsActionButtonPrimaryBorder, themeClasses.value.appPropsActionButtonPrimaryText, themeClasses.value.appPropsActionButtonPrimaryBgHover, themeClasses.value.appPropsActionButtonPrimaryBorderHover];
  }
});

function handleOk() {
  if (props.loading) return;
  emit("ok");
  emit("update:visible", false);
}

function handleCancel() {
  emit("cancel");
  emit("update:visible", false);
}

function handleOverlayClick() {
  if (props.maskClosable) {
    handleCancel();
  }
}
</script>

<style scoped>
.dialog-overlay {
  background: rgba(0, 0, 0, 0.35);
}

.dialog-window {
  position: relative;
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
}

.dialog-close-btn {
  border: none;
  background: transparent;
  cursor: pointer;
}

.dialog-body {
  min-height: 60px;
}

.dialog-btn {
  cursor: pointer;
  min-width: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.dialog-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Backdrop Transition */
.dialog-backdrop-enter-active,
.dialog-backdrop-leave-active {
  transition: opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-backdrop-enter-from,
.dialog-backdrop-leave-to {
  opacity: 0;
}

/* Dialog Transition  */
.dialog-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: center center;
}

.dialog-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: center center;
}

.dialog-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(20px);
}

.dialog-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .dialog-window {
    max-width: calc(100vw - 16px) !important;
    max-height: calc(100vh - 16px) !important;
  }

  .dialog-header {
    padding: 0.75rem 1rem !important;
  }

  .dialog-body {
    padding: 1rem 1.25rem !important;
  }

  .dialog-footer {
    padding: 0.75rem 1rem !important;
  }
}
</style>
