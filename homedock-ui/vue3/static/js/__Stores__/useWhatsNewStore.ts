// homedock-ui/vue3/static/js/__Stores__/useWhatsNewStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

import axios from "axios";

import { getAppById } from "../__Config__/WindowDefaultDetails";
import { useWindowStore } from "./windowStore";

export const useWhatsNewStore = defineStore("whatsNewStore", {
  state: () => ({
    loaded: false,
    seenId: "",
  }),

  actions: {
    open() {
      const app = getAppById("whatsnew");

      const viewportWidth = window.innerWidth;
      const usableHeight = document.querySelector(".desktop-content")?.clientHeight || window.innerHeight;

      const width = Math.min(app?.defaultWidth || 720, viewportWidth - 32);
      const height = Math.min(app?.defaultHeight || 760, usableHeight - 32);

      useWindowStore().openWindow("whatsnew", {
        width,
        height,
        x: Math.round(Math.max(16, (viewportWidth - width) / 2)),
        y: Math.round(Math.max(16, (usableHeight - height) / 2)),
      });
    },

    isUnseen(releaseId: string) {
      return this.loaded && !!releaseId && this.seenId !== releaseId;
    },

    async load(csrfToken: string) {
      if (this.loaded) return;

      try {
        const response = await axios.get("/api/whats-new/seen", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken },
        });

        this.seenId = response.data?.id || "";
        this.loaded = true;
      } catch (error) {
        console.error("Error reading What's New state:", error);
      }
    },

    async markSeen(csrfToken: string, releaseId: string) {
      if (!releaseId || this.seenId === releaseId) return;

      this.seenId = releaseId;

      try {
        await axios.post(
          "/api/whats-new/seen",
          { id: releaseId },
          {
            headers: {
              "X-HomeDock-CSRF-Token": csrfToken,
              "Content-Type": "application/json",
            },
          },
        );
      } catch (error) {
        console.error("Error saving What's New state:", error);
      }
    },
  },
});
