// homedock-ui/vue3/static/js/__Stores__/useFileViewerPrefsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { ref, watch } from "vue";

const STORAGE_KEY = "unifiedFileViewerStatus";

export const useFileViewerPrefsStore = defineStore("FileViewerPrefsStore", () => {
  const sortBy = ref<string>("name");
  const sortDirection = ref<"asc" | "desc">("asc");
  const viewMode = ref<"grid" | "list">("grid");

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved);
        sortBy.value = prefs.sortBy || "name";
        sortDirection.value = prefs.sortDirection || "asc";
        viewMode.value = prefs.viewMode || "grid";
      }
    } catch (error) {
      console.warn("[FileViewerPrefs] Failed to load from localStorage:", error);
    }
  }

  function save() {
    try {
      const prefs = {
        sortBy: sortBy.value,
        sortDirection: sortDirection.value,
        viewMode: viewMode.value,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn("[FileViewerPrefs] Failed to save to localStorage:", error);
    }
  }

  watch([sortBy, sortDirection, viewMode], () => {
    save();
  });

  return {
    sortBy,
    sortDirection,
    viewMode,
    load,
    save,
  };
});
