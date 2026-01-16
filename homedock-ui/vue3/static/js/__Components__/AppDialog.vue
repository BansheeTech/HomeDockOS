<!-- homedock-ui/vue3/static/js/__Components__/AppDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Teleport to="body">
    <Transition name="dialog-backdrop">
      <div v-if="visible" class="dialog-overlay fixed inset-0 z-[10000] flex items-center justify-center" @click="handleOverlayClick">
        <Transition name="dialog">
          <div ref="dialogRef" v-if="visible" class="dialog-window rounded-xl flex flex-col overflow-hidden shadow-2xl" :class="[themeClasses.windowBg, themeClasses.windowBorderFocused, themeClasses.windowShadow, { 'is-dragging': isDragging }]" :style="dialogStyle" @click.stop>
            <div class="dialog-header flex items-center gap-3 px-4 py-3 border-b" :class="[themeClasses.windowTitleBarBg, themeClasses.windowTitleBarBorder, { 'cursor-grab': canDrag && !isDragging, 'cursor-grabbing': isDragging }]" @mousedown="handleDragStart">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <Icon v-if="displayIcon" :icon="displayIcon" class="flex-shrink-0" :class="[iconColorClass, themeClasses.windowTitleTextFocused]" width="20" height="20" />
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
              <template v-if="!reverseButtons">
                <button v-if="okCancel" class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleCancel">
                  {{ cancelText }}
                </button>

                <button v-if="dismissText" class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleDismiss">
                  {{ dismissText }}
                </button>

                <button class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="okButtonClasses" @click="handleOk" :disabled="loading || okDisabled">
                  <Icon v-if="loading" :icon="loadingIcon" width="16" height="16" class="animate-spin" />
                  <span v-else>{{ okText }}</span>
                </button>
              </template>

              <template v-else>
                <button class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="okButtonClasses" @click="handleOk" :disabled="loading || okDisabled">
                  <Icon v-if="loading" :icon="loadingIcon" width="16" height="16" class="animate-spin" />
                  <span v-else>{{ okText }}</span>
                </button>

                <button v-if="dismissText" class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleDismiss">
                  {{ dismissText }}
                </button>

                <button v-if="okCancel" class="dialog-btn px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border" :class="[themeClasses.appPropsActionButtonBg, themeClasses.appPropsActionButtonBorder, themeClasses.appPropsActionButtonText, themeClasses.appPropsActionButtonBgHover, themeClasses.appPropsActionButtonBorderHover]" @click="handleCancel">
                  {{ cancelText }}
                </button>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onUnmounted } from "vue";

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
  dismissText?: string;
  okCancel?: boolean;
  width?: number;
  maskClosable?: boolean;
  loading?: boolean;
  icon?: any;
  reverseButtons?: boolean;
  closeOnOk?: boolean;
  draggable?: boolean;
  okDisabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: "info",
  title: "Dialog",
  content: "",
  okText: "OK",
  cancelText: "Cancel",
  dismissText: "",
  okCancel: true,
  width: 420,
  maskClosable: true,
  loading: false,
  reverseButtons: false,
  closeOnOk: true,
  draggable: true,
  okDisabled: false,
});

const emit = defineEmits<{
  ok: [];
  cancel: [];
  dismiss: [];
  "update:visible": [value: boolean];
}>();

const { themeClasses } = useTheme();

const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const dragStart = ref({ x: 0, y: 0 });
const dialogRef = ref<HTMLElement | null>(null);

const canDrag = computed(() => props.draggable && window.innerWidth > 768);

const BOUNDARY_MARGIN = 16;

const dialogStyle = computed(() => ({
  width: `${props.width}px`,
  maxWidth: "calc(100vw - 32px)",
  maxHeight: "calc(100vh - 32px)",
  transform: `translate(${dragOffset.value.x}px, ${dragOffset.value.y}px)`,
}));

watch(
  () => props.visible,
  (newVisible) => {
    if (!newVisible) {
      dragOffset.value = { x: 0, y: 0 };
    }
  }
);

function handleDragStart(e: MouseEvent | TouchEvent) {
  if (!canDrag.value) return;

  isDragging.value = true;

  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  dragStart.value = {
    x: clientX - dragOffset.value.x,
    y: clientY - dragOffset.value.y,
  };

  document.addEventListener("mousemove", handleDragMove);
  document.addEventListener("mouseup", handleDragEnd);
  document.addEventListener("touchmove", handleDragMove, { passive: false });
  document.addEventListener("touchend", handleDragEnd);
}

function handleDragMove(e: MouseEvent | TouchEvent) {
  if (!isDragging.value || !dialogRef.value) return;

  e.preventDefault();

  const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
  const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

  let newX = clientX - dragStart.value.x;
  let newY = clientY - dragStart.value.y;

  const dialogRect = dialogRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const centerX = (viewportWidth - dialogRect.width) / 2;
  const centerY = (viewportHeight - dialogRect.height) / 2;

  const minX = BOUNDARY_MARGIN - centerX;
  const maxX = viewportWidth - dialogRect.width - BOUNDARY_MARGIN - centerX;
  const minY = BOUNDARY_MARGIN - centerY;
  const maxY = viewportHeight - dialogRect.height - BOUNDARY_MARGIN - centerY;

  newX = Math.max(minX, Math.min(maxX, newX));
  newY = Math.max(minY, Math.min(maxY, newY));

  dragOffset.value = { x: newX, y: newY };
}

function handleDragEnd() {
  isDragging.value = false;

  document.removeEventListener("mousemove", handleDragMove);
  document.removeEventListener("mouseup", handleDragEnd);
  document.removeEventListener("touchmove", handleDragMove);
  document.removeEventListener("touchend", handleDragEnd);
}

onUnmounted(() => {
  handleDragEnd();
});

const defaultIcon = computed(() => {
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

const displayIcon = computed(() => props.icon || defaultIcon.value);

const iconColorClass = computed(() => {
  switch (props.type) {
    case "success":
      return "text-green-500";
    case "warning":
      return "";
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
  const okTextLower = props.okText.toLowerCase();
  const isDangerous = props.type === "error" || (props.type === "confirm" && okTextLower.includes("delete")) || (props.type === "warning" && okTextLower.includes("anyway")) || okTextLower.includes("uninstall") || okTextLower.includes("remove");

  if (isDangerous) {
    return [themeClasses.value.appPropsActionButtonDangerBg, themeClasses.value.appPropsActionButtonDangerBorder, themeClasses.value.appPropsActionButtonDangerText, themeClasses.value.appPropsActionButtonDangerBgHover, themeClasses.value.appPropsActionButtonDangerBorderHover];
  } else {
    return [themeClasses.value.appPropsActionButtonPrimaryBg, themeClasses.value.appPropsActionButtonPrimaryBorder, themeClasses.value.appPropsActionButtonPrimaryText, themeClasses.value.appPropsActionButtonPrimaryBgHover, themeClasses.value.appPropsActionButtonPrimaryBorderHover];
  }
});

function handleOk() {
  if (props.loading) return;
  emit("ok");
  if (props.closeOnOk) {
    emit("update:visible", false);
  }
}

function handleCancel() {
  emit("cancel");
  emit("update:visible", false);
}

function handleDismiss() {
  emit("dismiss");
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
  transition: box-shadow 0.2s ease;
}

.dialog-window.is-dragging {
  user-select: none;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  user-select: none;
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
