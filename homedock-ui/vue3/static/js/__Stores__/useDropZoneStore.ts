// homedock-ui/vue3/static/js/__Stores__/useDropZoneStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

export interface DropZoneFile {
  name: string;
  size: number;
  modified: string;
}

export const useDropZoneStore = defineStore("DropZoneStore", {
  state: () => ({
    files: [] as DropZoneFile[],
    totalSize: 0,
    lastUpdate: 0,
  }),
  getters: {
    fileCount(): number {
      return this.files.length;
    },
  },
  actions: {
    setFiles(files: DropZoneFile[]) {
      this.files = files;
      this.totalSize = files.reduce((sum, file) => sum + file.size, 0);
      this.lastUpdate = Date.now();
    },
    addFile(file: DropZoneFile) {
      const existingIndex = this.files.findIndex((f) => f.name === file.name);
      if (existingIndex >= 0) {
        this.files[existingIndex] = file;
      } else {
        this.files.push(file);
      }
      this.totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
      this.lastUpdate = Date.now();
    },
    removeFile(fileName: string) {
      this.files = this.files.filter((f) => f.name !== fileName);
      this.totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
      this.lastUpdate = Date.now();
    },
    clear() {
      this.files = [];
      this.totalSize = 0;
      this.lastUpdate = Date.now();
    },
  },
});
