<!-- src/static/js/__Components__/NotificationBell.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div ref="dropdown" class="relative inline-block">
    <Badge v-if="notifications.length > 0" :count="notifications.length" size="small" :overflow-count="9" @click.stop="toggleDropdown">
      <Icon :class="[themeClasses.navBarIcon]" :icon="bellIcon" class="w-5 h-5 text-current cursor-pointer" />
    </Badge>
    <Icon v-else :class="[themeClasses.navBarIcon]" :icon="bellIcon" class="w-5 h-5 mb-1.5 text-current cursor-pointer" @click.stop="toggleDropdown" />
    <Transition name="slide-fade">
      <Teleport to="body">
        <div v-if="showDropdown" @click.stop class="fixed top-16 right-0 mx-4 sm:mx-auto sm:right-16 sm:w-[260px] shadow-md rounded-lg border z-[9999] overflow-hidden" :class="[themeClasses.notCont]">
          <div :class="[themeClasses.topBack]" class="px-4 py-4 border-b rounded-t-sm text-xs flex items-center">
            <Icon :icon="notifications.length > 0 ? bellIcon : checkIcon" class="mr-3" />
            {{ notifications.length > 0 ? "You have new notifications" : "No new notifications available" }}
          </div>
          <TransitionGroup name="list" tag="div" :class="[themeClasses.notMainContainer]" class="notifications-container">
            <div :class="['notification-item flex items-center px-1 py-2 cursor-pointer last:border-b-0', { removing: notification.removing }, themeClasses.notBack]" v-if="notifications.length > 0" v-for="(notification, index) in notifications" :key="notification.title + notification.message">
              <div :class="[themeClasses.notInnerIcon]" class="w-6 h-6 rounded-full flex items-center justify-center mx-1.5">
                <span class="icon mb-1">
                  <Icon :icon="messageBadgeIcon" class="w-4 h-4 mt-1 text-current" size="16px" />
                </span>
              </div>
              <div class="flex-1 p-1">
                <h3 :class="[themeClasses.notTextUp]" class="m-0 mb-1 text-xs font-semibold">{{ notification.title }}</h3>
                <p :class="[themeClasses.notTextDown]" class="text-xs">{{ notification.message }}</p>
                <div v-if="notification.startDate || notification.endDate" :class="[themeClasses.notTextDown]" class="flex items-center underline text-[10px] mt-1">
                  <Icon :icon="calendarIcon" class="mr-1" size="12px" />
                  <span v-if="notification.startDate">{{ formatDate(notification.startDate) }}</span>
                  <span v-if="notification.startDate && notification.endDate" class="mx-1">></span>
                  <span v-if="notification.endDate">{{ formatDate(notification.endDate) }}</span>
                </div>
              </div>
              <button v-if="notification.allowRemove" @click="removeNotification(notification)">
                <span class="rounded-full overflow-hidden flex items-center justify-center mr-2 ml-2 rounded-lg h-3 w-3">
                  <Icon :class="[themeClasses.notInnerIcon]" :icon="closeIcon" class="notificationIcon" size="8px" />
                </span>
              </button>
            </div>
            <div v-else :class="[themeClasses.notBack]" class="notification-item flex items-center px-1 py-2 border-b border-gray-300 cursor-pointer last:border-b-0">
              <div class="w-6 h-6 rounded-full flex items-center justify-center mx-1.5">
                <Icon :class="[themeClasses.notInnerIcon]" :icon="checkIcon" class="w-5 h-5 text-current rounded-full p-1" />
              </div>
              <div class="flex-1 p-1">
                <h3 :class="[themeClasses.notTextUp]" class="text-xs font-semibold">No new notifications available at this moment. Please check back later.</h3>
              </div>
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
import { userInfo } from "os";
import { useInternalMessage } from "ant-design-vue/es/message/useMessage";

interface Notification {
  title: string;
  message: string;
  permanent: boolean;
  startDate: string | null;
  endDate: string | null;
  allowRemove: boolean;
  icon?: string;
  removing?: boolean;
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

console.log(settingsData.userName);

const { themeClasses } = useTheme();
const showDropdown = ref(false);
const dropdown = ref<HTMLElement | null>(null);

const notifications = ref<Notification[]>([]);
const dismissedNotifications = ref<DismissedNotification[]>([]);

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
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
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

.notifications-container {
  max-height: calc(100vh - 150px);
  overflow-y: auto;
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
</style>
