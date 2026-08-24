// homedock-ui/vue3/static/js/__Stores__/useQuickViewStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

export const useQuickViewStore = defineStore("quickView", {
  state: () => ({
    isOpen: false,
  }),

  actions: {
    open() {
      this.isOpen = true;
    },

    close() {
      this.isOpen = false;
    },

    toggle() {
      this.isOpen = !this.isOpen;
    },
  },
});
