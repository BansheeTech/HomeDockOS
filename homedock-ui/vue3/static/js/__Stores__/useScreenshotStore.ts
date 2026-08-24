// homedock-ui/vue3/static/js/__Stores__/useScreenshotStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { CaptureCancelled, grabScreenshot, screenshotFileName, uploadScreenshot, type CaptureRect } from "../__Utils__/ScreenCapture";

export interface ScreenshotPreview {
  thumbnail: string;
  buffer: ArrayBuffer;
  fileName: string;
  path: string | null;
  error: string | null;
}

export const useScreenshotStore = defineStore("screenshot", {
  state: () => ({
    isCapturing: false,
    flash: null as CaptureRect | null,
    preview: null as ScreenshotPreview | null,
  }),

  actions: {
    async capture(rect: CaptureRect | null, csrfToken: string) {
      if (this.isCapturing) return;
      this.isCapturing = true;

      try {
        const shot = await grabScreenshot(rect);

        this.flash = shot.cropped && rect ? rect : { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };

        this.discardPreview();
        const fileName = screenshotFileName(new Date());
        this.preview = { thumbnail: shot.thumbnail, buffer: shot.buffer, fileName, path: null, error: null };

        try {
          const path = await uploadScreenshot(shot.blob, fileName, csrfToken);
          if (this.preview) this.preview.path = path;
        } catch {
          if (this.preview) this.preview.error = "Could not save the screenshot";
        }
      } catch (err) {
        if (err instanceof CaptureCancelled) return;
        this.discardPreview();
        this.preview = { thumbnail: "", buffer: new ArrayBuffer(0), fileName: "", path: null, error: "Screen capture failed" };
      } finally {
        this.isCapturing = false;
      }
    },

    clearFlash() {
      this.flash = null;
    },

    discardPreview() {
      this.preview = null;
    },
  },
});
