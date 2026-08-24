<!-- homedock-ui/vue3/static/js/__Components__/AppDialog.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <PrismDialog :store="prismStore" :visible="visible" :title="$t(title)" :icon="displayIcon" :width="clampedWidth" :mask-closable="maskClosable" :ok-text="$t(okText)" :cancel-text="$t(cancelText)" :dismiss-text="dismissText ? $t(dismissText) : ''" :ok-cancel="okCancel" :footer="footer" :ok-disabled="okDisabled" :ok-danger="isDangerous" :loading="loading" :reverse-buttons="reverseButtons" :close-on-ok="closeOnOk" :classes="dialogClasses" @update:visible="emit('update:visible', $event)" @ok="emit('ok')" @cancel="emit('cancel')" @dismiss="emit('dismiss')">
    <div class="dialog-body flex-1 px-6 py-5 overflow-auto min-h-[60px]">
      <slot>
        <p class="text-sm leading-relaxed m-0" :class="[themeClasses.notTextDown]">{{ content ? $t(content) : "" }}</p>
      </slot>
    </div>
  </PrismDialog>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { PrismDialog } from "@prism-wm/vue";

import infoIcon from "@iconify-icons/mdi/information-outline";
import successIcon from "@iconify-icons/mdi/check-circle-outline";
import warningIcon from "@iconify-icons/mdi/alert-outline";
import errorIcon from "@iconify-icons/mdi/alert-circle-outline";
import helpIcon from "@iconify-icons/mdi/help-circle-outline";

import { useTheme } from "../__Themes__/ThemeSelector";
import { useResponsive } from "../__Composables__/useResponsive";
import { getPrismStore } from "../__Stores__/windowStore";

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
  footer?: boolean;
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
  footer: true,
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
const { windowWidth } = useResponsive();
const prismStore = getPrismStore();

const clampedWidth = computed(() => Math.min(props.width, Math.max(280, windowWidth.value - 32)));

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

const isDangerous = computed(() => {
  const label = props.okText.toLowerCase();
  return props.type === "error" || (props.type === "confirm" && label.includes("delete")) || (props.type === "warning" && label.includes("anyway")) || label.includes("uninstall") || label.includes("remove");
});

const BUTTON_BASE = "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border min-w-[80px] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

const dialogClasses = computed(() => ({
  dialogFooter: `border-t ${themeClasses.value.windowTitleBarBorder}`,
  dialogButton: `${BUTTON_BASE} ${themeClasses.value.appPropsActionButtonBg} ${themeClasses.value.appPropsActionButtonBorder} ${themeClasses.value.appPropsActionButtonText} ${themeClasses.value.appPropsActionButtonBgHover} ${themeClasses.value.appPropsActionButtonBorderHover}`,
  dialogButtonPrimary: `${BUTTON_BASE} ${themeClasses.value.appPropsActionButtonPrimaryBg} ${themeClasses.value.appPropsActionButtonPrimaryBorder} ${themeClasses.value.appPropsActionButtonPrimaryText} ${themeClasses.value.appPropsActionButtonPrimaryBgHover} ${themeClasses.value.appPropsActionButtonPrimaryBorderHover}`,
  dialogButtonDanger: `${BUTTON_BASE} ${themeClasses.value.appPropsActionButtonDangerBg} ${themeClasses.value.appPropsActionButtonDangerBorder} ${themeClasses.value.appPropsActionButtonDangerText} ${themeClasses.value.appPropsActionButtonDangerBgHover} ${themeClasses.value.appPropsActionButtonDangerBorderHover}`,
}));
</script>
