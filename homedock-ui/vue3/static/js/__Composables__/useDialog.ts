// homedock-ui/vue3/static/js/__Composables__/useDialog.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createVNode, render, getCurrentInstance, type AppContext } from "vue";
import AppDialog from "../__Components__/AppDialog.vue";
import type { DialogType } from "../__Components__/AppDialog.vue";

let globalAppContext: AppContext | null = null;

export interface DialogOptions {
  type?: DialogType;
  title?: string;
  content: string;
  okText?: string;
  cancelText?: string;
  okCancel?: boolean;
  width?: number;
  maskClosable?: boolean;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface DialogInstance {
  destroy: () => void;
}

function showDialog(options: DialogOptions, appContext?: AppContext): DialogInstance {
  const container = document.createElement("div");
  document.body.appendChild(container);

  let isDestroyed = false;
  let isVisible = false;

  const destroy = () => {
    if (isDestroyed) return;
    isDestroyed = true;

    isVisible = false;
    updateVNode();

    setTimeout(() => {
      render(null, container);
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 300);
  };

  const handleOk = async () => {
    if (options.onOk) {
      const result = options.onOk();
      if (result instanceof Promise) {
        try {
          await result;
          destroy();
        } catch (error) {
          console.error("Dialog onOk error:", error);
        }
      } else {
        destroy();
      }
    } else {
      destroy();
    }
  };

  const handleCancel = () => {
    if (options.onCancel) {
      options.onCancel();
    }
    destroy();
  };

  const updateVNode = () => {
    const vnode = createVNode(AppDialog, {
      visible: isVisible,
      type: options.type || "info",
      title: options.title || "Dialog",
      content: options.content,
      okText: options.okText || "OK",
      cancelText: options.cancelText || "Cancel",
      okCancel: options.okCancel !== undefined ? options.okCancel : true,
      width: options.width || 420,
      maskClosable: options.maskClosable !== undefined ? options.maskClosable : true,
      onOk: handleOk,
      onCancel: handleCancel,
      "onUpdate:visible": (visible: boolean) => {
        if (!visible) {
          destroy();
        }
      },
    });

    const contextToUse = appContext || globalAppContext;
    if (contextToUse) {
      vnode.appContext = contextToUse;
    }

    render(vnode, container);
  };

  updateVNode();

  setTimeout(() => {
    isVisible = true;
    updateVNode();
  }, 10);

  return {
    destroy,
  };
}

export function useDialog() {
  const instance = getCurrentInstance();
  const appContext = instance?.appContext;

  if (appContext && !globalAppContext) {
    globalAppContext = appContext;
  }

  return {
    info: (options: Omit<DialogOptions, "type">) => {
      return showDialog({ ...options, type: "info" }, appContext);
    },

    success: (options: Omit<DialogOptions, "type">) => {
      return showDialog({ ...options, type: "success" }, appContext);
    },

    warning: (options: Omit<DialogOptions, "type">) => {
      return showDialog({ ...options, type: "warning" }, appContext);
    },

    error: (options: Omit<DialogOptions, "type">) => {
      return showDialog({ ...options, type: "error" }, appContext);
    },

    confirm: (options: Omit<DialogOptions, "type">) => {
      return showDialog({ ...options, type: "confirm", okCancel: true }, appContext);
    },
  };
}

export const dialog = {
  info: (options: Omit<DialogOptions, "type">) => showDialog({ ...options, type: "info" }, globalAppContext || undefined),
  success: (options: Omit<DialogOptions, "type">) => showDialog({ ...options, type: "success" }, globalAppContext || undefined),
  warning: (options: Omit<DialogOptions, "type">) => showDialog({ ...options, type: "warning" }, globalAppContext || undefined),
  error: (options: Omit<DialogOptions, "type">) => showDialog({ ...options, type: "error" }, globalAppContext || undefined),
  confirm: (options: Omit<DialogOptions, "type">) => showDialog({ ...options, type: "confirm", okCancel: true }, globalAppContext || undefined),
};
