<!-- src/static/js/__Components__/LoginAttempts.vue -->
<!-- Copyright © 2023-2025 Banshee, All Rights Reserved -->
<!-- https://www.banshee.pro -->

<template>
  <div>
    <AutoComplete v-model:value="searchQuery" class="w-full" :popup-class-name="`${themeClasses.scopeSelector} z-0`" :options="autocompleteOptions" @select="handleSelect">
      <template #option="item">
        <span v-if="item.options">
          <Icon v-if="item.value === ipLabel" class="inline-flex mb-1" :icon="mapMarkerIcon" color="#bbb" />
          <Icon v-else-if="item.value === userLabel" class="inline-flex mb-1" :icon="accountKeyIcon" color="#bbb" />
          <Icon v-else-if="item.value === clearLabel" class="inline-flex mb-1" :icon="deleteEmptyIcon" color="#bbb" />
          <Icon v-else-if="item.value === statusLabel" class="inline-flex mb-1" :icon="securityIcon" color="#bbb" />
          {{ item.value }}
        </span>
        <div v-else style="display: flex; justify-content: space-between">
          {{ item.label || item.value }}
        </div>
      </template>
      <InputSearch placeholder="Search records..." enter-button="Search" :class="[themeClasses.scopeSelector]" class="mb-3 w-full text-sm">
        <template #prefix>
          <Icon :icon="magnifyExpandIcon" class="mx-1 text-stone-400" />
        </template>
      </InputSearch>
    </AutoComplete>
    <table v-if="!loading" :class="[themeClasses.tableTextInner]" class="w-full text-[10px] leading-none antialiased">
      <thead>
        <tr>
          <th :class="[themeClasses.tableTextUp]" class="w-1/4 font-semibold">
            <Icon :icon="clockOutlineIcon" class="inline-block mb-0.5 mr-0.5" />
            <span>Timestamp</span>
          </th>
          <th :class="[themeClasses.tableTextUp]" class="w-1/5 font-semibold">
            <Icon :icon="securityIcon" class="inline-block mb-0.5 mr-0.5" />
            <span>Status</span>
          </th>
          <th :class="[themeClasses.tableTextUp]" class="w-1/4 font-semibold">
            <Icon :icon="mapMarkerIcon" class="inline-block mb-0.5 mr-0.5" />
            <span>IP</span>
          </th>
          <th :class="[themeClasses.tableTextUp]" class="w-1/4 font-semibold">
            <Icon :icon="accountKeyIcon" class="inline-block mb-0.5 mr-0.5" />
            <span>User</span>
          </th>
        </tr>
      </thead>

      <tbody class="contents">
        <TransitionGroup name="fade" tag="tbody" mode="out-in">
          <tr v-for="(log, index) in displayedLogs" :key="log.timestamp + '-' + index" :class="['border-b', themeClasses.tableBorder, getStatusClass(log.status), 'table-row']">
            <td>{{ log.timestamp }}</td>
            <td>{{ log.status }}</td>

            <td>
              {{ log.ip }}
              <span v-if="log.isNew && isRealIP(log.ip)">
                <Tooltip placement="bottom" trigger="click" :color="themeClasses.tooltipBackColor" :destroyTooltipOnHide="true">
                  <template #title>
                    <div class="text-[10px] max-w-48 py-1 transition-all duration-600 ease-in-out">
                      <div>
                        <Icon :icon="shieldAlertOutlineIcon" />
                        <span>The login attempt from the network address {{ log.ip }} has been detected for the first time.</span>
                      </div>

                      <hr :class="[themeClasses.tooltipSeparator]" class="mt-1 h-[1px] border-0 w-full" />

                      <div class="mt-1" v-if="!ipData[log.ip]">
                        <div class="flex items-center"><Icon :icon="loadingIcon" class="mr-1 mb-0.5 animate-spin" /> Gathering...</div>
                      </div>

                      <div class="mt-1" v-else-if="hasValidFields(log.ip)">
                        <div v-if="ipData[log.ip].city !== 'Unknown'"><Icon :icon="flagIcon" class="inline-block mr-1" /> {{ ipData[log.ip].city }}</div>
                        <div v-if="ipData[log.ip].country !== 'Unknown'"><Icon :icon="mapMarkerIcon" class="inline-block mr-1" /> {{ ipData[log.ip].country }}</div>
                        <div v-if="ipData[log.ip].org !== 'Unknown'"><Icon :icon="magnifyIcon" class="inline-block mr-1" /> {{ ipData[log.ip].org }}</div>
                        <div v-if="ipData[log.ip].timezone !== 'Unknown'"><Icon :icon="cityIcon" class="inline-block mr-1" /> {{ ipData[log.ip].timezone }}</div>
                        <div v-if="ipData[log.ip].latitude !== 'Unknown'"><Icon :icon="mapIcon" class="inline-block mr-1" /> {{ ipData[log.ip].latitude }}</div>
                        <div v-if="ipData[log.ip].longitude !== 'Unknown'"><Icon :icon="mapIcon" class="inline-block mr-1" /> {{ ipData[log.ip].longitude }}</div>
                      </div>

                      <div class="mt-1" v-else>
                        <div><Icon :icon="alertIcon" class="inline-block" /> Unable to retrieve data</div>
                      </div>

                      <hr :class="[themeClasses.tooltipSeparator]" class="mt-1 h-[1px] border-0 w-full" />

                      <div :class="[themeClasses.tooltipViewMore]" class="transition-all duration-300 ease-in-out mt-1 hover:ml-1">
                        <a :href="'https://ip.guide/' + log.ip" class="mt-2 flex items-center space-x-1" target="_blank" rel="noreferrer">
                          <Icon :icon="checkDecagramIcon" :size="12" class="inline-block" />
                          <span class="text-[10px] leading-none">View more</span>
                        </a>
                      </div>
                    </div>
                  </template>
                  <div @click="handleTooltip(log.ip)" class="absolute cursor-pointer inline-block mt-[1px]">
                    <Icon :class="[themeClasses.discoverNotifyIconBack]" class="absolute cursor-pointer inline-block" :icon="circleMediumIcon" />
                    <Icon :class="[themeClasses.discoverNotifyIconPulse]" class="absolute animate-ping inline-block" :icon="circleMediumIcon" />
                  </div>
                </Tooltip>
              </span>
            </td>

            <td class="max-w-16 w-4 break-words">{{ log.users }}</td>
          </tr>
          <tr v-if="displayedLogs.length === 0">
            <td colspan="4">Nothing to show yet</td>
          </tr>
        </TransitionGroup>
      </tbody>
    </table>
    <div v-else class="text-center mt-4">
      <Spin size="large" :loadingSpinIndicator="loadingSpinIndicator" />
    </div>
    <div v-if="!loading && showButtons" class="mt-3 flex justify-between">
      <Button size="middle" type="primary" class="cursor-pointer shadow-none" @click="loadMore">
        <span class="px-2 flex items-center space-x-1">
          <Icon :icon="transferDownIcon" class="mr-1 inline-block hover:text-lime-800" />
          <span class="text-[12px] leading-none">Load more</span>
        </span>
      </Button>
      <Button size="middle" type="dashed" class="cursor-pointer shadow-none" @click="loadAll">
        <span class="px-2 flex items-center space-x-1">
          <Icon :icon="chevronDoubleDownIcon" :size="12" class="mr-1 inline-block" />
          <span class="text-[12px] leading-none">Load everything</span>
        </span>
      </Button>
    </div>
    <div v-else-if="!loading && showClearButton" class="mt-3 flex justify-center">
      <Button size="middle" type="dashed" class="custom-dashed-clear cursor-pointer w-full shadow-none" @click="clearView">
        <span class="px-2">
          <Icon :icon="closeThickIcon" :size="12" class="mr-1 mb-0.5 inline-block" />
          <span class="text-[12px] leading-none">Clear this view</span>
        </span>
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, watch, onMounted } from "vue";

import { useTheme } from "../__Themes__/ThemeSelector";

import { AutoComplete, Button, InputSearch, Spin, theme, Tooltip } from "ant-design-vue";

import axios from "axios";

import { Icon } from "@iconify/vue";
import mapMarkerIcon from "@iconify-icons/mdi/map-marker";
import accountKeyIcon from "@iconify-icons/mdi/account-key";
import deleteEmptyIcon from "@iconify-icons/mdi/delete-empty";
import securityIcon from "@iconify-icons/mdi/security";
import magnifyExpandIcon from "@iconify-icons/mdi/magnify-expand";
import clockOutlineIcon from "@iconify-icons/mdi/clock-outline";
import shieldAlertOutlineIcon from "@iconify-icons/mdi/shield-alert-outline";
import flagIcon from "@iconify-icons/mdi/flag";
import magnifyIcon from "@iconify-icons/mdi/magnify";
import alertIcon from "@iconify-icons/mdi/alert";
import checkDecagramIcon from "@iconify-icons/mdi/check-decagram";
import circleMediumIcon from "@iconify-icons/mdi/circle-medium";
import transferDownIcon from "@iconify-icons/mdi/transfer-down";
import chevronDoubleDownIcon from "@iconify-icons/mdi/chevron-double-down";
import closeThickIcon from "@iconify-icons/mdi/close-thick";
import loadingIcon from "@iconify-icons/mdi/loading";
import cityIcon from "@iconify-icons/mdi/city";
import mapIcon from "@iconify-icons/mdi/map";

interface Log {
  timestamp: string;
  status: string;
  ip: string;
  users: string;
  isNew?: boolean;
}

interface IPData {
  [key: string]: {
    city?: string;
    country?: string;
    org?: string;
    timezone?: string;
    latitude?: string;
    longitude?: string;
  };
}

// Datos reactivos
const searchQuery = ref("");
const dataCache = ref<Log[]>([]);
const displayedLogs = ref<Log[]>([]);
const currentIndex = ref(10);
const seenIPs = new Set<string>();
const autocompleteOptions = ref<{ value: string; label?: string; options?: { value: string; label?: string }[] }[]>([]);
const clearLabel = "Reset";
const statusLabel = "Filter by Status";
const ipLabel = "Related IPs";
const userLabel = "Related Usernames";
const previousDisplayCount = ref(10);
const allLoaded = ref(false);
const loading = ref(true);
const loadingSpinIndicator = null;
const ipData = reactive<IPData>({});

const csrfToken = ref<string>(document.querySelector('meta[name="homedock_csrf_token"]')?.getAttribute("content") || "");

const { themeClasses } = useTheme();

// Computed properties
const filteredData = computed(() => {
  const lowerSearchQuery = searchQuery.value.toLowerCase();
  return lowerSearchQuery ? dataCache.value.filter((record) => Object.values(record).some((val) => String(val).toLowerCase().includes(lowerSearchQuery))) : dataCache.value;
});

const hasValidFields = (ip: string): boolean => {
  const data = ipData[ip];
  if (!data) return false;

  return data.city !== "Unknown" || data.country !== "Unknown" || data.org !== "Unknown" || data.timezone !== "Unknown" || data.latitude !== "Unknown" || data.longitude !== "Unknown";
};

const showButtons = computed(() => searchQuery.value === "" && dataCache.value.length > displayedLogs.value.length);
const showClearButton = computed(() => searchQuery.value !== "");

const fetchData = async () => {
  loading.value = true;
  try {
    const response = await axios.get("/api/system-logs/serve_logins", {
      headers: {
        "X-HomeDock-CSRF-Token": csrfToken.value,
      },
    });

    const contentType = response.headers["content-type"];
    if (response.status !== 200 || !contentType || !contentType.includes("application/json")) {
      throw new Error("Failed to fetch data");
    }

    const data = response.data;
    if (!data || data.length === 0) {
      dataCache.value = [{ timestamp: "Nothing to show yet", status: "", ip: "", users: "" }];
    } else {
      markNewIPs(data);
      dataCache.value = data.reverse();
      updateDisplayedLogs();
      updateAutocompleteOptions();
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    dataCache.value = [{ timestamp: "Nothing to show yet", status: "", ip: "", users: "" }];
  } finally {
    loading.value = false;
  }
};

const markNewIPs = (data: Log[]) => {
  data.forEach((log) => {
    if (isRealIP(log.ip) && !seenIPs.has(log.ip)) {
      seenIPs.add(log.ip);
      log.isNew = true;
    } else {
      log.isNew = false;
    }
  });
};

const fetchIPData = async (ip: string) => {
  const cachedDataString = localStorage.getItem("cachedIPs");
  const cachedIPs = cachedDataString ? JSON.parse(cachedDataString) : {};
  const cachedData = cachedIPs[ip];
  if (cachedData) {
    const { data, timestamp } = cachedData;
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 1week
    const isDataValid = new Date().getTime() - new Date(timestamp).getTime() < oneWeek;
    if (isDataValid) {
      ipData[ip] = data;
      return;
    }
  }

  try {
    const response = await axios.get(`https://ip.guide/${ip}`);
    if (response.status !== 200) throw new Error("Failed to fetch IP data");

    const responseData = response.data;
    if (!responseData) {
      throw new Error("Incomplete data from IP guide");
    }

    const data = {
      city: responseData.location?.city || "Unknown",
      country: responseData.location?.country || "Unknown",
      timezone: responseData.location?.timezone || "Unknown",
      latitude: responseData.location?.latitude || "Unknown",
      longitude: responseData.location?.longitude || "Unknown",
      org: responseData.network.autonomous_system?.organization || "Unknown",
    };

    ipData[ip] = data;
    cachedIPs[ip] = { data, timestamp: new Date().toISOString() };
    localStorage.setItem("cachedIPs", JSON.stringify(cachedIPs));
  } catch (error) {
    console.error("Error fetching IP data:", error);
    ipData[ip] = { city: "Unknown", country: "Unknown", org: "Unknown", timezone: "Unknown", latitude: "Unknown", longitude: "Unknown" };
  }
};

const handleSelect = (value: any) => {
  const selectedValue = typeof value === "string" ? value : "";
  if (selectedValue === clearLabel) {
    clearView();
  } else if (selectedValue === statusLabel) {
    searchQuery.value = selectedValue;
  }
};

const handleTooltip = (ip: string) => {
  if (!ipData[ip]) fetchIPData(ip);
};

const updateDisplayedLogs = () => {
  displayedLogs.value = allLoaded.value ? filteredData.value : filteredData.value.slice(0, currentIndex.value);
};

const loadMore = () => {
  currentIndex.value += 10;
  previousDisplayCount.value = currentIndex.value;
  updateDisplayedLogs();
};

const loadAll = () => {
  allLoaded.value = true;
  previousDisplayCount.value = dataCache.value.length;
  updateDisplayedLogs();
};

const onSearch = () => {
  allLoaded.value = true;
  currentIndex.value = dataCache.value.length;
  updateDisplayedLogs();
};

const clearView = () => {
  searchQuery.value = "";
  allLoaded.value = false;
  currentIndex.value = 10;
  updateDisplayedLogs();
};

const isRealIP = (ip: string): boolean => {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};

const getStatusClass = (status: string): string => {
  switch (status) {
    case "Failed":
      return "text-yellow-600";
    case "Limited":
      return "text-red-700";
    case "Warning":
      return "!text-white !bg-red-500 cursor-help";
    default:
      return "";
  }
};

const generateAutocompleteOptions = (data: Log[]) => {
  const ips = Array.from(new Set(data.map((log) => log.ip))).filter(isRealIP);
  const users = Array.from(new Set(data.map((log) => log.users)));
  const statuses = Array.from(new Set(data.map((log) => log.status)));
  return [
    {
      value: clearLabel,
      label: clearLabel,
      options: [{ value: "", label: "Clear this view" }],
    },
    {
      value: statusLabel,
      options: statuses.map((status) => ({ value: status })),
    },
    {
      value: ipLabel,
      options: ips.map((ip) => ({ value: ip })),
    },
    {
      value: userLabel,
      options: users.map((user) => ({ value: user })),
    },
  ];
};

const updateAutocompleteOptions = () => {
  const lowerSearchQuery = searchQuery.value.toLowerCase();
  const filteredData = lowerSearchQuery ? dataCache.value.filter((record) => Object.values(record).some((val) => String(val).toLowerCase().includes(lowerSearchQuery))) : dataCache.value;

  autocompleteOptions.value = generateAutocompleteOptions(filteredData);
};

// Observadores
watch(searchQuery, () => {
  if (searchQuery.value === "") {
    allLoaded.value = false;
    currentIndex.value = previousDisplayCount.value;
  } else {
    onSearch();
  }
  updateDisplayedLogs();
  updateAutocompleteOptions();
});

// Ciclo de vida
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  transform: scaleY(0); /* Comienza colapsada */
}

.fade-enter-to,
.fade-leave-from {
  transform: scaleY(1);
}

/* AntD Vue Overrides */
:global(.dark-mode-theme.ant-select-dropdown) {
  background-color: rgb(39, 39, 42) !important;
}

:global(.aero-mode-theme.ant-select-dropdown) {
  background-color: rgba(0, 0, 0, 0) !important;
  backdrop-filter: blur(100px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(100px) saturate(100%) !important;
}

:global(.dark-mode-theme .ant-select-item) {
  color: rgb(128, 128, 128) !important;
}

:global(.aero-mode-theme .ant-select-item) {
  color: rgba(255, 255, 255, 0.501) !important;
}

:global(.dark-mode-theme .ant-select-item-group) {
  color: rgb(255, 255, 255) !important;
}

:global(.aero-mode-theme .ant-select-item-group) {
  color: rgb(255, 255, 255) !important;
}

::v-deep(.dark-mode-theme input) {
  background-color: rgb(39, 39, 42) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.aero-mode-theme input) {
  background-color: rgba(0, 0, 0, 0) !important;
  color: rgb(255, 255, 255) !important;
}

::v-deep(.white-mode-theme input::placeholder) {
  color: rgb(210, 210, 210) !important;
}

::v-deep(.dark-mode-theme input::placeholder) {
  color: rgb(100, 100, 100) !important;
}

::v-deep(.aero-mode-theme input::placeholder) {
  color: rgb(177, 177, 177) !important;
}

::v-deep(.white-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
  -webkit-text-fill-color: #000000 !important;
}

::v-deep(.dark-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.aero-mode-theme input:autofill) {
  background-color: transparent !important;
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
  -webkit-text-fill-color: #fff !important;
}

::v-deep(.white-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(255, 255, 255) inset !important;
}

::v-deep(.dark-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.aero-mode-theme input:autofill:hover) {
  box-shadow: 0 0 0 1000px rgb(39, 39, 42) inset !important;
}

::v-deep(.dark-mode-theme .ant-input-affix-wrapper) {
  background-color: rgb(39, 39, 42) !important;
  border: 1px solid rgb(61, 61, 61) !important;
}

::v-deep(.aero-mode-theme .ant-input-affix-wrapper) {
  background-color: rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(62, 62, 62, 0.489) !important;
}

::v-deep(.dark-mode-theme .ant-input-affix-wrapper:hover) {
  border: 1px solid rgb(24, 119, 255) !important;
}

::v-deep(.aero-mode-theme .ant-input-affix-wrapper:hover) {
  border: 1px solid rgb(24, 119, 255) !important;
}
</style>
