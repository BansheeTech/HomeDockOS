// homedock-ui/vue3/static/js/__Services__/NotificationsPolling.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { onMounted, onUnmounted, ref, inject } from "vue";
import axios from "axios";

export interface Notification {
  title: string;
  message: string;
  permanent: boolean;
  startDate: string | null;
  endDate: string | null;
  showDate?: boolean;
  allowRemove: boolean;
  icon?: string;
  hash?: string;
  actionUrl?: string;
  actionText?: string;

  removing?: boolean;
  isUpdate?: boolean;
  isUpdating?: boolean;
  onClick?: () => void;
}

export function useNotificationsPolling(propCSRF: string, initialIntervalMs = 60000, maxIntervalMs = 300000) {
  const notifications = ref<Notification[]>([]);
  let currentIntervalMs = initialIntervalMs;
  let previousHashSum = "";
  let unchangedCount = 0;
  let interval: ReturnType<typeof setInterval>;

  const csrfTokenReactive = inject<{ value: string }>("csrf-token");

  async function fetchNotifications() {
    try {
      const response = await axios.get("/api/notifications/list", {
        headers: {
          "X-HomeDock-CSRF-Token": csrfTokenReactive?.value || propCSRF,
        },
      });

      if (response.data && response.data.notifications) {
        const newNotifications: Notification[] = response.data.notifications;

        const currentHashSum = JSON.stringify(newNotifications.map((n) => n.hash || n.title));

        if (currentHashSum !== previousHashSum) {
          currentIntervalMs = initialIntervalMs;
          unchangedCount = 0;

          notifications.value = newNotifications.map((n) => ({
            title: n.title || "",
            message: n.message || "",
            permanent: n.permanent || false,
            startDate: n.startDate || null,
            endDate: n.endDate || null,
            showDate: n.showDate || false,
            allowRemove: n.allowRemove !== false,
            icon: n.icon,
            hash: n.hash,
            actionUrl: n.actionUrl?.startsWith("https://") ? n.actionUrl : undefined,
            actionText: n.actionText,
          }));
        } else {
          unchangedCount++;
          currentIntervalMs = Math.min(initialIntervalMs * (unchangedCount + 1), maxIntervalMs);
        }

        previousHashSum = currentHashSum;

        clearInterval(interval);
        interval = setInterval(fetchNotifications, currentIntervalMs);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }

  onMounted(() => {
    fetchNotifications();
    interval = setInterval(fetchNotifications, currentIntervalMs);

    onUnmounted(() => {
      clearInterval(interval);
    });
  });

  return {
    notifications,
    refetch: fetchNotifications,
  };
}
