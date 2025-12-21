// homedock-ui/vue3/static/js/__Stores__/useAppDriveUploadingStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
}

export interface UploadProgress {
  percent: number;
}

export const useAppDriveUploadingStore = defineStore("AppDriveUploadingStore", {
  state: () => ({
    currentlyUploading: [] as UploadFile[],
    queue: [] as UploadFile[],
    uploadProgress: {} as Record<string, number>,
  }),
  getters: {
    isUploading(): boolean {
      return this.currentlyUploading.length > 0 || this.queue.length > 0;
    },
    totalUploading(): number {
      return this.currentlyUploading.length + this.queue.length;
    },
  },
  actions: {
    addToQueue(file: UploadFile) {
      if (!this.queue.find((f) => f.uid === file.uid)) {
        this.queue.push(file);
        this.uploadProgress[file.uid] = 0;
      }
    },
    startUpload(file: UploadFile) {
      if (!this.currentlyUploading.find((f) => f.uid === file.uid)) {
        this.currentlyUploading.push(file);
      }
      this.queue = this.queue.filter((f) => f.uid !== file.uid);
      if (!this.uploadProgress[file.uid]) {
        this.uploadProgress[file.uid] = 0;
      }
    },
    updateProgress(fileUid: string, percent: number) {
      this.uploadProgress[fileUid] = percent;
    },
    completeUpload(fileUid: string) {
      this.currentlyUploading = this.currentlyUploading.filter((f) => f.uid !== fileUid);
      delete this.uploadProgress[fileUid];
    },
    cancelUpload(fileUid: string) {
      this.currentlyUploading = this.currentlyUploading.filter((f) => f.uid !== fileUid);
      this.queue = this.queue.filter((f) => f.uid !== fileUid);
      delete this.uploadProgress[fileUid];
    },
    clearCompleted() {
      Object.keys(this.uploadProgress).forEach((uid) => {
        if (this.uploadProgress[uid] === 100) {
          delete this.uploadProgress[uid];
        }
      });
    },
  },
});
