// homedock-ui/vue3/static/js/__Stores__/useUploadingStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
}

export type UploadLocation = "storage" | "dropzone" | "appdrive";

interface LocationState {
  currentlyUploading: UploadFile[];
  queue: UploadFile[];
  uploadProgress: Record<string, number>;
}

export const useUploadingStore = defineStore("UploadingStore", {
  state: () => ({
    locations: {
      storage: {
        currentlyUploading: [] as UploadFile[],
        queue: [] as UploadFile[],
        uploadProgress: {} as Record<string, number>,
      },
      dropzone: {
        currentlyUploading: [] as UploadFile[],
        queue: [] as UploadFile[],
        uploadProgress: {} as Record<string, number>,
      },
      appdrive: {
        currentlyUploading: [] as UploadFile[],
        queue: [] as UploadFile[],
        uploadProgress: {} as Record<string, number>,
      },
    } as Record<UploadLocation, LocationState>,
  }),
  getters: {
    isUploadingAt:
      (state) =>
      (location: UploadLocation): boolean => {
        const loc = state.locations[location];
        return loc.currentlyUploading.length > 0 || loc.queue.length > 0;
      },
    totalUploadingAt:
      (state) =>
      (location: UploadLocation): number => {
        const loc = state.locations[location];
        return loc.currentlyUploading.length + loc.queue.length;
      },
    currentlyUploadingAt:
      (state) =>
      (location: UploadLocation): UploadFile[] => {
        return state.locations[location].currentlyUploading;
      },
    queueAt:
      (state) =>
      (location: UploadLocation): UploadFile[] => {
        return state.locations[location].queue;
      },
    uploadProgressAt:
      (state) =>
      (location: UploadLocation): Record<string, number> => {
        return state.locations[location].uploadProgress;
      },
    // Global getters for any location uploading
    isAnyUploading(): boolean {
      return this.isUploadingAt("storage") || this.isUploadingAt("dropzone") || this.isUploadingAt("appdrive");
    },
  },
  actions: {
    addToQueue(location: UploadLocation, file: UploadFile) {
      const loc = this.locations[location];
      if (!loc.queue.find((f) => f.uid === file.uid)) {
        loc.queue.push(file);
        loc.uploadProgress[file.uid] = 0;
      }
    },
    startUpload(location: UploadLocation, file: UploadFile) {
      const loc = this.locations[location];
      if (!loc.currentlyUploading.find((f) => f.uid === file.uid)) {
        loc.currentlyUploading.push(file);
      }
      loc.queue = loc.queue.filter((f) => f.uid !== file.uid);
      if (!loc.uploadProgress[file.uid]) {
        loc.uploadProgress[file.uid] = 0;
      }
    },
    updateProgress(location: UploadLocation, fileUid: string, percent: number) {
      this.locations[location].uploadProgress[fileUid] = percent;
    },
    completeUpload(location: UploadLocation, fileUid: string) {
      const loc = this.locations[location];
      loc.currentlyUploading = loc.currentlyUploading.filter((f) => f.uid !== fileUid);
      delete loc.uploadProgress[fileUid];
    },
    cancelUpload(location: UploadLocation, fileUid: string) {
      const loc = this.locations[location];
      loc.currentlyUploading = loc.currentlyUploading.filter((f) => f.uid !== fileUid);
      loc.queue = loc.queue.filter((f) => f.uid !== fileUid);
      delete loc.uploadProgress[fileUid];
    },
    clearCompleted(location: UploadLocation) {
      const loc = this.locations[location];
      Object.keys(loc.uploadProgress).forEach((uid) => {
        if (loc.uploadProgress[uid] === 100) {
          delete loc.uploadProgress[uid];
        }
      });
    },
  },
});
