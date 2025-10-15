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
    <Transition name="slide-fade">
      <Teleport to="body">
        <div v-if="showDropdown" @click.stop class="notification-dropdown shadow-lg rounded-lg border z-[9999] overflow-hidden backdrop-blur-sm" :class="[themeClasses.notCont, themeClasses.aeroExtraScope]">
          <div :class="[themeClasses.topBack]" class="px-6 py-4 rounded-t-lg text-sm font-medium flex items-center space-x-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="[themeClasses.notInnerIcon]">
              <Icon :icon="notifications.length > 0 ? bellIcon : checkIcon" class="w-4 h-4" />
            </div>
            <div>
              <h3 class="font-semibold text-sm" :class="[themeClasses.notTextUp]">Notifications</h3>
              <p class="text-xs opacity-70" :class="[themeClasses.notTextDown]">
                {{ notifications.length > 0 ? `${notifications.length} new` : "All caught up" }}
              </p>
            </div>
          </div>
          <TransitionGroup name="list" tag="div" :class="[themeClasses.notMainContainer]" class="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-thumb-opacity-20 scrollbar-track-transparent">
            <div :class="['notification-item flex items-start px-4 py-3 cursor-pointer relative group transition-all duration-200 hover:bg-white hover:bg-opacity-5 border-b border-white border-opacity-5 last:border-b-0', { removing: notification.removing }, themeClasses.notBack]" v-if="notifications.length > 0" v-for="notification in notifications" :key="notification.title + notification.message" @click="notification.onClick ? notification.onClick() : null">
              <div class="relative flex-shrink-0">
                <div :class="[themeClasses.notInnerIcon]" class="w-10 h-10 rounded-xl flex items-center justify-center">
                  <Icon
                    :icon="notification.isUpdating ? loadingIcon : notification.isUpdate ? updateIcon : messageBadgeIcon"
                    :class="{
                      'w-4 h-4 text-current': true,
                      'animate-pulse': notification.isUpdate && !notification.isUpdating,
                      'animate-spin': notification.isUpdating,
                    }"
                  />
                </div>
                <div v-if="notification.isUpdate" class="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div class="flex-1 min-w-0 overflow-hidden px-3">
                <h4 class="text-sm font-semibold leading-tight mb-0.5" :class="[themeClasses.notTextUp, { underline: notification.isUpdate }]">{{ notification.title }}</h4>
                <p class="text-xs leading-relaxed opacity-80 break-words leading-tight" :class="[themeClasses.notTextDown]">{{ notification.message }}</p>
                <div v-if="notification.startDate || notification.endDate" :class="[themeClasses.notTextDown]" class="flex items-center underline text-[10px] mt-1">
                  <Icon :icon="calendarIcon" class="mr-1" size="12px" />
                  <span v-if="notification.startDate">{{ formatDate(notification.startDate) }}</span>
                  <span v-if="notification.startDate && notification.endDate" class="mx-1">></span>
                  <span v-if="notification.endDate">{{ formatDate(notification.endDate) }}</span>
                </div>
              </div>
              <button v-if="notification.allowRemove" @click="removeNotification(notification)" class="transition-all duration-200 hover:scale-110 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :class="[themeClasses.notCloseBtn]">
                <Icon :icon="closeIcon" class="w-4 h-4" />
              </button>
            </div>
            <div v-else class="flex flex-col items-center py-10 px-5 text-center">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 opacity-60" :class="[themeClasses.notInnerIcon]">
                <Icon :icon="checkIcon" class="w-6 h-6" />
              </div>
              <p class="text-base font-semibold mb-1" :class="[themeClasses.notTextUp]">You're all caught up!</p>
              <p class="text-sm opacity-70" :class="[themeClasses.notTextDown]">No new notifications at the moment</p>
            </div>
          </TransitionGroup>
        </div>
      </Teleport>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, inject } from "vue";
import { useTheme } from "../__Themes__/ThemeSelector";

import { Badge } from "ant-design-vue";

import { Icon } from "@iconify/vue";
import bellIcon from "@iconify-icons/mdi/bell-outline";
import messageBadgeIcon from "@iconify-icons/mdi/message-badge";
import calendarIcon from "@iconify-icons/mdi/calendar";
import closeIcon from "@iconify-icons/mdi/close-thick";
import checkIcon from "@iconify-icons/mdi/check-all";
import updateIcon from "@iconify-icons/mdi/check-decagram";
import loadingIcon from "@iconify-icons/mdi/loading";

import { useUpdateStore } from "../__Stores__/useUpdateStore";

interface Notification {
  title: string;
  message: string;
  permanent: boolean;
  startDate: string | null;
  endDate: string | null;
  allowRemove: boolean;
  icon?: string;
  removing?: boolean;
  isUpdate?: boolean;
  isUpdating?: boolean;
  onClick?: () => void;
}

interface DismissedNotification {
  title: string;
  message: string;
  date: Date;
}

const settingsData = inject<{
  userName: string;
}>("data-settings");

if (!settingsData) {
  throw new Error("Settings data is missing!");
}

const { themeClasses } = useTheme();
const showDropdown = ref(false);
const dropdown = ref<HTMLElement | null>(null);

const notifications = ref<Notification[]>([]);
const dismissedNotifications = ref<DismissedNotification[]>([]);
const updateStore = useUpdateStore();

const csrfToken = document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "";

if (settingsData.userName === "user") {
  notifications.value.push({
    title: "Default User Detected",
    message: "You're using the default user! Please change it in settings.",
    permanent: true,
    startDate: null,
    endDate: null,
    allowRemove: false,
  });
}

if (!settingsData.userName) {
  notifications.value.push({
    title: "No Username Set",
    message: "Please set a username in your account settings.",
    permanent: true,
    startDate: null,
    endDate: null,
    allowRemove: false,
  });
}

notifications.value.push({
  title: "Change the default password!",
  message: "It's dangerous to go alone! If you're using the default password make sure you change it as soon as possible!",
  permanent: true,
  startDate: null,
  endDate: null,
  allowRemove: true,
});

const loadNotifications = (): void => {
  const storedDismissed = JSON.parse(localStorage.getItem("dismissedNotifications") || "[]") as DismissedNotification[];
  dismissedNotifications.value = storedDismissed;

  const now = new Date();

  notifications.value = notifications.value.filter((n) => {
    const dismissed = dismissedNotifications.value.find((d) => d.title === n.title && d.message === n.message);
    if (dismissed) {
      return false;
    }
    if (n.permanent) {
      return true;
    }
    const startDate = n.startDate ? new Date(n.startDate) : null;
    const endDate = n.endDate ? new Date(n.endDate) : null;
    return (!startDate || now >= startDate) && (!endDate || now <= endDate);
  });
};

const saveDismissedNotifications = (): void => {
  localStorage.setItem("dismissedNotifications", JSON.stringify(dismissedNotifications.value));
};

const toggleDropdown = (): void => {
  showDropdown.value = !showDropdown.value;
};

const removeNotification = (notification: Notification): void => {
  notification.removing = true;
  setTimeout(() => {
    notifications.value = notifications.value.filter((n) => n !== notification);
    dismissedNotifications.value.push({ title: notification.title, message: notification.message, date: new Date() });
    saveDismissedNotifications();
  }, 300);
};

const handleClickOutside = (event: MouseEvent): void => {
  if (dropdown.value && !dropdown.value.contains(event.target as Node)) {
    showDropdown.value = false;
  }
};

const formatDate = (date: string | null): string => {
  if (!date) return "";
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  return new Date(date).toLocaleDateString(undefined, options);
};

onMounted(() => {
  loadNotifications();
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

onMounted(async () => {
  await updateStore.checkForUpdate(csrfToken);

  if (updateStore.updateAvailable) {
    notifications.value.push({
      title: `New version available!`,
      message: `New HomeDock OS ${updateStore.latestVersion} just dropped! Click here to update now.`,
      permanent: true,
      allowRemove: false,
      startDate: null,
      endDate: null,
      isUpdate: true,
      onClick: async function () {
        this.isUpdating = true;
        this.title = "Updating HomeDock OS...";
        this.message = "The system may become unresponsive for a few minutes. Please wait...";

        try {
          await updateStore.triggerUpdate(csrfToken);
        } catch (error) {
          this.title = "Update Failed";
          this.message = "Something went wrong while updating HomeDock OS. Please contact our support team.";
        }
      },
    });
  }
});

defineExpose({
  toggleDropdown,
});
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.slide-fade-enter-to,
.slide-fade-leave-from {
  transform: translateY(0);
  opacity: 1;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter,
.list-leave-to {
  opacity: 0;
  height: 0;
}

.notification-item {
  overflow: hidden;
  transition: height 0.3s ease, opacity 0.3s ease;
}

.notification-item.removing {
  height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
  transition: height 0.3s ease, opacity 0.3s ease, padding 0.3s ease, margin 0.3s ease;
}

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

.notification-dropdown {
  position: fixed;
  bottom: 4rem;
  right: 1rem;
  left: auto;
  width: 280px;
}
</style>
