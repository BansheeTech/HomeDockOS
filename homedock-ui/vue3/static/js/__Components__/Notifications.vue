<!-- src/static/js/__Components__/Notifications.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template></template>

<script lang="ts">
import { defineComponent, h } from "vue";

import { AxiosError } from "axios";

import { notification } from "ant-design-vue";

import AnimatedIcon from "../__Components__/AnimatedIcon.vue";
import robot from "@iconify-icons/mdi/robot";
import robotOff from "@iconify-icons/mdi/robot-off";

export const props = {
  errorMessage: String,
  documentationLink: String,
};

function generateErrorDescription(errorMessage: string, documentationLink: string) {
  return h("div", [
    h("p", errorMessage),
    h("p", { class: "flex items-center mt-2" }, [
      h(AnimatedIcon, {
        icons: [robot, robotOff],
        interval: 1000,
        iconSize: 12,
        containerClass: "mr-0.5 text-blue-600",
      }),
      h(
        "a",
        {
          class: "text-blue-600 !underline hover:!underline",
          href: documentationLink,
          target: "_blank",
        },
        "Click to View Documentation"
      ),
    ]),
  ]);
}

export function notifyError(error: AxiosError, themeClass?: string) {
  const responseData = error.response?.data || {};

  // Definir tipos explícitos para las propiedades esperadas
  interface ErrorResponseData {
    error_code?: string;
    error_message?: string;
    error?: string;
    documentation_url?: string;
  }

  const { error_code, error_message, error: simpleError, documentation_url } = responseData as ErrorResponseData;

  if (error_code && error_message) {
    notification.error({
      message: `Error HDOS-${error_code}:`,
      description: generateErrorDescription(error_message, documentation_url || "https://docs.homedock.cloud"),
      placement: "bottomRight",
      class: themeClass || "",
      duration: 500,
    });
    return;
  }

  if (simpleError) {
    notification.warning({
      message: "Uh-oh...",
      description: generateErrorDescription(simpleError, documentation_url || "https://docs.homedock.cloud"),
      placement: "bottomRight",
      class: themeClass || "",
      duration: 5,
    });
    return;
  }

  const fallbackMessage = error.message || "An unexpected error occurred.";
  notification.error({
    message: "Error HDOS-699",
    description: fallbackMessage,
    placement: "bottomRight",
    class: themeClass || "",
    duration: 5,
  });
}

export function notifySuccess(message: string, description?: string, themeClass?: string, duration = 5) {
  notification.success({
    message,
    description,
    placement: "bottomRight",
    class: themeClass || "",
    duration,
  });
}

export function notifyWarning(message: string, description?: string, themeClass?: string, duration = 5) {
  notification.warning({
    message,
    description,
    placement: "bottomRight",
    class: themeClass || "",
    duration,
  });
}

export default defineComponent({
  name: "Notifications",
});
</script>

<style>
.ant-notification-notice {
  font-size: 10px !important;
}

.ant-notification-notice-message {
  font-size: 14px !important;
}

.ant-notification-notice-description {
  font-size: 10px !important;
}

.dark-mode-theme.ant-notification-notice {
  background-color: #141414 !important;
  border: 1px solid #292929 !important;
}

.aero-mode-theme.ant-notification-notice {
  background-color: #00000036 !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid #2929297e !important;
}

.dark-mode-theme .ant-notification-notice-message {
  color: rgb(252, 252, 252) !important;
}

.aero-mode-theme .ant-notification-notice-message {
  color: rgb(252, 252, 252) !important;
}

.dark-mode-theme .ant-notification-notice-description {
  color: rgb(206, 206, 206) !important;
}

.aero-mode-theme .ant-notification-notice-description {
  color: rgb(206, 206, 206) !important;
}

.dark-mode-theme .ant-notification-notice-close {
  color: white !important;
}

.aero-mode-theme .ant-notification-notice-close {
  color: white !important;
}
</style>
