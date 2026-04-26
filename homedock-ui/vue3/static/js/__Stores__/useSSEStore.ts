// homedock-ui/vue3/static/js/__Stores__/useSSEStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";
import { defineStore } from "pinia";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

import type { Ref } from "vue";

const registry: Record<string, Ref<string>> = {};

export function registerSSERef(sseKey: string, target: Ref<string>) {
  registry[sseKey] = target;
}

export const useSSEStore = defineStore("SSEStore", () => {
  const csrfToken = useCsrfToken();

  let abortController: AbortController | null = null;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let reconnectDelay = 0;

  function applyData(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      if (registry[key]) {
        registry[key].value = String(value);
      }
    }
  }

  function startPolling() {
    if (abortController) return;
    abortController = new AbortController();

    const connect = () => {
      const signal = abortController!.signal;
      let lastIndex = 0;
      let buffer = "";

      axios
        .get("/stream/stats", {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          signal,
          responseType: "text",
          onDownloadProgress: (progressEvent) => {
            const responseText = (progressEvent.event?.target as XMLHttpRequest)?.responseText;
            if (!responseText) return;

            const newData = responseText.substring(lastIndex);
            lastIndex = responseText.length;

            const combined = buffer + newData;
            const parts = combined.split("\n\n");
            buffer = parts.pop()!;

            for (const part of parts) {
              if (!part.trim()) continue;
              let event = "message";
              let data = "";
              for (const line of part.split("\n")) {
                if (line.startsWith("event: ")) event = line.slice(7);
                else if (line.startsWith("data: ")) data = line.slice(6);
              }
              if (data && (event === "snapshot" || event === "patch")) {
                try {
                  applyData(JSON.parse(data));
                } catch {
                  /* nope */
                }
              }
            }
          },
        })
        .then(() => {
          reconnectDelay = 0;
          if (!signal.aborted) connect();
        })
        .catch(() => {
          if (signal.aborted) return;
          reconnectDelay = Math.min((reconnectDelay || 1500) * 2, 60000);
          const jitter = reconnectDelay * (0.5 + Math.random() * 0.5);
          reconnectTimeout = setTimeout(connect, jitter);
        });
    };

    connect();
  }

  function stopPolling() {
    if (reconnectTimeout !== null) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  return {
    startPolling,
    stopPolling,
  };
});
