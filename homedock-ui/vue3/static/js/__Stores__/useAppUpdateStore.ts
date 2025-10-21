// homedock-ui/vue3/static/js/__Stores__/useAppUpdateStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

type UpdateProcessor = (appName: string) => Promise<void>;

interface AppUpdateInfo {
  name: string;
  display_name: string;
  image_path?: string;
}

export const useAppUpdateStore = defineStore("AppUpdateStore", {
  state: () => ({
    currentlyUpdating: null as AppUpdateInfo | null,
    queue: [] as AppUpdateInfo[],
    isCheckingUpdates: false,
    processor: null as UpdateProcessor | null,
    isProcessing: false,
  }),
  actions: {
    setProcessor(processor: UpdateProcessor) {
      this.processor = processor;
    },
    startUpdating(appInfo: AppUpdateInfo) {
      if (this.currentlyUpdating) {
        if (!this.queue.some((a) => a.name === appInfo.name)) {
          this.queue.push(appInfo);
        }
      } else {
        this.currentlyUpdating = appInfo;
      }
    },
    async finishUpdating() {
      this.currentlyUpdating = null;

      if (this.queue.length > 0) {
        this.currentlyUpdating = this.queue.shift() || null;
        if (this.currentlyUpdating && this.processor) {
          await this.processor(this.currentlyUpdating.name);
        }
      } else {
        this.isProcessing = false;
      }
    },
    addToQueue(appInfo: AppUpdateInfo) {
      if ((this.currentlyUpdating && this.currentlyUpdating.name === appInfo.name) || this.queue.some((a) => a.name === appInfo.name)) {
        return;
      }

      if (!this.currentlyUpdating && !this.isProcessing) {
        this.currentlyUpdating = appInfo;
        this.isProcessing = true;
        if (this.processor) {
          this.processor(appInfo.name);
        }
      } else {
        this.queue.push(appInfo);
      }
    },
    removeFromQueue(appName: string) {
      const index = this.queue.findIndex((a) => a.name === appName);
      if (index > -1) {
        this.queue.splice(index, 1);
      }
    },
    clearQueue() {
      this.queue = [];
      this.currentlyUpdating = null;
      this.isProcessing = false;
    },
    setCheckingUpdates(checking: boolean) {
      this.isCheckingUpdates = checking;
    },
    isUpdating(appName: string): boolean {
      return (this.currentlyUpdating !== null && this.currentlyUpdating.name === appName) || this.queue.some((a) => a.name === appName);
    },
  },
});
