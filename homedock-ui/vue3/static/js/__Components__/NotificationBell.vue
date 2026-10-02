<!-- homedock-ui/vue3/static/js/__Components__/NotificationBell.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="dropdown" class="relative inline-flex items-center">
    <Badge v-if="notifications.length > 0" :count="notifications.length" size="small" :overflow-count="9">
      <Icon :class="[themeClasses.navBarIcon]" :icon="bellIcon" class="w-[18px] h-[18px] text-current transition-transform duration-200 hover:scale-110" />
    </Badge>
    <Icon v-else :class="[themeClasses.navBarIcon]" :icon="bellIcon" class="w-[18px] h-[18px] text-current transition-transform duration-200 hover:scale-110" />
    <TrayPanel :open="showDropdown" :anchor="anchorEl" :title="$t('Notifications')" :subtitle="notifications.length > 0 ? `${notifications.length} ${$t('new')}` : $t('All caught up')" :icon="bellIcon" icon-color="#ef4444" @close="closeDropdown">
      <div v-if="notifications.length > 0 || leavingCount > 0" class="pt-1">
        <TransitionGroup :css="false" @leave="onNotificationLeave">
          <div v-for="notification in notifications" :key="notification.hash || notification.title + notification.message" class="pb-1.5">
            <div :class="[themeClasses.storeInfoBar, { 'cursor-pointer': notification.onClick }]" class="group relative flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors duration-150" @click="notification.onClick ? notification.onClick() : null">
              <AppIconGraphic :icon="notification.isUpdating ? loadingIcon : notification.isUpdate ? updateIcon : messageBadgeIcon" :color="notification.isUpdate ? '#16a34a' : '#3b82f6'" :size="32" :class="notification.isUpdating && 'tile-busy'" />
              <div class="flex-1 min-w-0" :class="notification.allowRemove ? 'pr-5' : ''">
                <p :class="[themeClasses.storeModalAppName]" class="m-0 text-xs font-semibold leading-snug">{{ localText(notification.title) }}</p>
                <p :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-0.5 text-[11px] leading-relaxed break-words">{{ localText(notification.message) }}</p>
                <p v-if="notification.showDate && (notification.startDate || notification.endDate)" :class="[themeClasses.storeCardSubtitle]" class="m-0 mt-1 flex items-center gap-1 text-[10px] tabular-nums">
                  <Icon :icon="calendarIcon" class="w-3 h-3 flex-shrink-0" />
                  <span v-if="notification.startDate">{{ formatDate(notification.startDate) }}</span>
                  <span v-if="notification.startDate && notification.endDate">–</span>
                  <span v-if="notification.endDate">{{ formatDate(notification.endDate) }}</span>
                </p>
                <a v-if="notification.actionUrl" :href="notification.actionUrl" target="_blank" rel="noopener noreferrer" :class="[themeClasses.storeCardGetPill]" class="inline-flex items-center gap-1 h-6 mt-2 px-2.5 rounded-full text-[11px] font-semibold no-underline transition-colors duration-150" @click.stop>
                  {{ notification.actionText ? localText(notification.actionText) : $t("See more") }}
                  <Icon :icon="openInNewIcon" class="w-3 h-3" />
                </a>
              </div>
              <button v-if="notification.allowRemove" type="button" :class="[themeClasses.storeCardInstalledPill]" class="absolute top-2 right-2 flex items-center justify-center w-5 h-5 rounded-full border-0 cursor-pointer opacity-60 transition-opacity duration-150 group-hover:opacity-100" :aria-label="$t('Close')" @click.stop="removeNotification(notification)">
                <Icon :icon="closeIcon" class="w-3 h-3" />
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <Transition :css="false" @enter="onCaughtUpEnter">
        <div v-if="notifications.length === 0 && leavingCount === 0" class="flex flex-col items-center px-5 pt-5 pb-6 text-center" :class="{ 'is-celebrating': celebrate }">
          <AppIconGraphic color="#16a34a" :size="44" class="caught-up-tile mb-3">
            <template #glyph>
              <svg viewBox="0 0 24 24" class="w-6 h-6 text-white" fill="none" aria-hidden="true">
                <path class="caught-up-check" d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </template>
            <span class="caught-up-ring absolute inset-0 pointer-events-none"></span>
          </AppIconGraphic>
          <p :class="[themeClasses.storeModalAppName]" class="caught-up-text m-0 text-[13px] font-semibold">{{ $t("You're all caught up!") }}</p>
          <p :class="[themeClasses.storeCardSubtitle]" class="caught-up-text caught-up-text-late m-0 mt-0.5 text-xs">{{ $t("No new notifications at the moment") }}</p>
        </div>
      </Transition>
    </TrayPanel>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";

import { ref, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";
import { useCsrfToken } from "../__Composables__/useCsrfToken";
import { useUpdateStore } from "../__Stores__/useUpdateStore";
import { useNotificationsPolling, type Notification } from "../__Services__/NotificationsPolling";
import { hostSupportsAppWindows, isMulticastTrail } from "../__Composables__/useAppSubdomain";

import { Badge } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import bellIcon from "@iconify-icons/mdi/bell-outline";
import messageBadgeIcon from "@iconify-icons/mdi/message-badge";
import calendarIcon from "@iconify-icons/mdi/calendar";
import closeIcon from "@iconify-icons/mdi/close-thick";
import updateIcon from "@iconify-icons/mdi/check-decagram";
import loadingIcon from "@iconify-icons/mdi/loading";
import openInNewIcon from "@iconify-icons/mdi/open-in-new";

import { collapseLeave, expandEnter } from "../__Utils__/collapseLeave";

import AppIconGraphic from "./AppIconGraphic.vue";
import TrayPanel from "./TrayPanel.vue";

const { themeClasses } = useTheme();
const { t, te } = useI18n();
const csrfToken = useCsrfToken();

function localText(text: string) {
  return text && te(text) ? t(text) : text;
}

const { isOpen: showDropdown, toggle: toggleDropdown, close: closeDropdown } = useTrayPanel("notification-bell");
const dropdown = ref<HTMLElement | null>(null);
const anchorEl = computed(() => dropdown.value?.parentElement ?? dropdown.value);

const { notifications } = useNotificationsPolling(csrfToken.value, 60000, 300000);
const updateStore = useUpdateStore();

const saveDismissedNotification = async (hash: string): Promise<void> => {
  try {
    await axios.post(
      "/api/notifications/dismiss",
      { hash },
      {
        headers: {
          "X-HomeDock-CSRF-Token": csrfToken.value,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error saving dismissed notification:", error);
  }
};

const leavingCount = ref(0);
const celebrate = ref(false);

const removeNotification = async (notification: Notification): Promise<void> => {
  notifications.value = notifications.value.filter((n) => n !== notification);
  if (notifications.value.length === 0) celebrate.value = true;
  if (notification.hash) await saveDismissedNotification(notification.hash);
};

function onNotificationLeave(el: Element, done: () => void) {
  leavingCount.value++;
  collapseLeave(el, done, () => leavingCount.value--);
}

function onCaughtUpEnter(el: Element, done: () => void) {
  if (celebrate.value) expandEnter(el, done);
  else done();
}

watch(showDropdown, (open) => {
  if (!open) celebrate.value = false;
});

const formatDate = (date: string | null): string => {
  if (!date) return "";
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  return new Date(date).toLocaleDateString(undefined, options);
};

onMounted(async () => {
  // HDOS00103
  if (!hostSupportsAppWindows()) {
    notifications.value.push({
      title: t("OnScreen Apps are not available at {host}", { host: window.location.hostname }),
      message: isMulticastTrail() ? t("Apps open in a new tab: OnScreen Apps need a domain with a browser-trusted HTTPS certificate, and a .local name cannot have one. Set yours in Settings and HomeDock OS issues the certificate for you.") : t("Apps open in a new tab: OnScreen Apps need a domain with a browser-trusted HTTPS certificate, and an IP address cannot have one. Set yours in Settings and HomeDock OS issues the certificate for you."),
      permanent: true,
      allowRemove: true,
      startDate: null,
      endDate: null,
      isLocal: true,
      hash: "homedock-os-hostname-hint",
      actionUrl: "https://docs.homedock.cloud/homedock-os/desktop/#on-screen-apps",
      actionText: t("Learn more"),
    });
  }

  await updateStore.checkForUpdate(csrfToken.value);

  if (updateStore.updateAvailable) {
    const updateNotification: Notification = {
      title: t("New version available!"),
      message: t("New update available! HomeDock OS v{version} is ready to install. Click here to update now.", { version: updateStore.latestVersion }),
      permanent: true,
      allowRemove: false,
      startDate: null,
      endDate: null,
      isUpdate: true,
      onClick: async function () {
        this.isUpdating = true;
        this.title = t("Updating HomeDock OS...");
        this.message = t("Installing HomeDock OS update... Please wait until your HomeDock OS instance is back online...");

        try {
          await updateStore.triggerUpdate(csrfToken.value);
        } catch (error) {
          this.isUpdating = false;
          this.title = t("Update Failed");
          this.message = t("Something went wrong while updating HomeDock OS. Please reload and restart HomeDock OS.");
        }
      },
    };

    updateNotification.hash = "homedock-os-update-notification";
    notifications.value.push(updateNotification);
  }
});

defineExpose({
  toggleDropdown: () => toggleDropdown(),
});
</script>

<style scoped>
@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 1;
  }
  90% {
    opacity: 0.2;
  }
}

:deep(.ant-scroll-number) {
  animation: blink 4s infinite;
}

.tile-busy :deep(.app-icon-glyph) {
  animation: spin 1s linear infinite;
}

.caught-up-ring {
  border-radius: inherit;
  border: 2px solid #22c55e;
  opacity: 0;
}

.caught-up-check {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.is-celebrating .caught-up-tile {
  animation: caught-up-pop 520ms cubic-bezier(0.34, 1.56, 0.64, 1) 120ms both;
}

.is-celebrating .caught-up-check {
  stroke-dashoffset: 1;
  animation: caught-up-draw 340ms cubic-bezier(0.65, 0, 0.35, 1) 380ms forwards;
}

.is-celebrating .caught-up-ring {
  animation: caught-up-ring 600ms ease-out 420ms both;
}

.is-celebrating .caught-up-text {
  animation: caught-up-rise 380ms cubic-bezier(0.32, 0.72, 0, 1) 300ms both;
}

.is-celebrating .caught-up-text-late {
  animation-delay: 370ms;
}

@keyframes caught-up-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes caught-up-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes caught-up-ring {
  from {
    opacity: 0.55;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(1.7);
  }
}

@keyframes caught-up-rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
