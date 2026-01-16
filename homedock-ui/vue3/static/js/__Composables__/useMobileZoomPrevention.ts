// homedock-ui/vue3/static/js/__Composables__/useMobileZoomPrevention.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted } from "vue";

export function useMobileZoomPrevention() {
  function preventGesture(e: Event) {
    e.preventDefault();
  }

  onMounted(() => {
    document.addEventListener("gesturestart", preventGesture, { passive: false });
    document.addEventListener("gesturechange", preventGesture, { passive: false });
  });

  onUnmounted(() => {
    document.removeEventListener("gesturestart", preventGesture);
    document.removeEventListener("gesturechange", preventGesture);
  });
}
