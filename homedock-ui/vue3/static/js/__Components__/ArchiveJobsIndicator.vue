<!-- homedock-ui/vue3/static/js/__Components__/ArchiveJobsIndicator.vue -->
<!-- Copyright © 2023-2026 Banshee, All Rights Reserved -->
<!-- See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/ -->
<!-- https://www.banshee.pro -->

<template>
  <Transition name="taskbar-item">
    <div v-if="jobsStore.visibleJobs.length" ref="indicatorRef" class="archive-indicator-wrapper">
      <div class="archive-indicator" :class="[themeClasses.uploadIndicatorBg, themeClasses.uploadIndicatorIcon, themeClasses.uploadIndicatorBgHover, themeClasses.uploadIndicatorIconHover]" @click="toggle">
        <svg v-if="jobsStore.runningJobs.length" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" class="archive-ring">
          <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.3">
            <path stroke-dasharray="2 4" stroke-dashoffset="6" d="M12 21c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9">
              <animate attributeName="stroke-dashoffset" dur="0.6s" repeatCount="indefinite" values="6;0" />
            </path>
            <path d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9" />
          </g>
        </svg>
        <Icon :icon="jobsStore.runningJobs.length ? zipIcon : doneIcon" class="archive-glyph" />
      </div>

      <TrayPanel :open="isOpen" :anchor="indicatorRef" :title="$t('Archives')" :subtitle="jobsStore.runningJobs.length ? $t('{n} in progress', { n: jobsStore.runningJobs.length }) : undefined" :icon="zipIcon" icon-color="#d97706" @close="close">
        <TraySection>
          <TrayRow v-for="job in jobsStore.visibleJobs" :key="job.id" :title="job.label" :interactive="job.state === 'done' && !!job.result" :highlighted="job.state === 'running'" @click="reveal(job)">
            <template #leading>
              <span :class="[themeClasses.storeInfoBar]" class="flex items-center justify-center w-7 h-7 rounded-[7px] border flex-shrink-0">
                <Icon :icon="job.kind === 'extract' ? extractIcon : compressIcon" :class="[themeClasses.storeCardSubtitle]" class="w-4 h-4" />
              </span>
            </template>
            <template #subtitle>
              <template v-if="job.state === 'running'">
                <span :class="[themeClasses.storeInfoBarDivider]" class="relative block h-1 mt-1 rounded-full overflow-hidden">
                  <span v-if="percent(job) === null" class="archive-indeterminate absolute inset-y-0 w-1/3 rounded-full bg-blue-500"></span>
                  <span v-else class="block h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out" :style="{ width: `${percent(job)}%` }"></span>
                </span>
              </template>
              <span v-else-if="job.state === 'done'">{{ job.kind === "extract" ? $t("Extracted") : $t("Compressed") }}</span>
              <span v-else-if="job.state === 'canceled'">{{ $t("Canceled") }}</span>
              <span v-else class="text-red-500">{{ $t(archiveErrorMessage(job.error || "unknown")) }}</span>
            </template>
            <template #trailing>
              <button v-if="job.state === 'running'" type="button" :title="$t('Cancel')" :aria-label="$t('Cancel')" :class="[themeClasses.storeCardSubtitle]" class="flex items-center justify-center w-6 h-6 rounded-full border-0 bg-transparent cursor-pointer flex-shrink-0 hover:opacity-100 opacity-70" @click.stop="jobsStore.cancel(job.id)">
                <Icon :icon="closeCircleIcon" class="w-4 h-4" />
              </button>
              <span v-else-if="job.state === 'done' && job.result" :class="[themeClasses.storeCardSubtitle]" class="flex-shrink-0 text-[11px] font-semibold">{{ $t("Show") }}</span>
            </template>
          </TrayRow>
        </TraySection>
      </TrayPanel>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref } from "vue";

import { useArchiveJobsStore, type ArchiveJob } from "../__Stores__/useArchiveJobsStore";
import { useWindowStore } from "../__Stores__/windowStore";
import { useTheme } from "../__Themes__/ThemeSelector";
import { useTrayPanel } from "../__Composables__/useTrayManager";
import { archiveErrorMessage, parentFolder } from "../__Utils__/ArchiveClient";

import TrayPanel from "./TrayPanel.vue";
import TraySection from "./TraySection.vue";
import TrayRow from "./TrayRow.vue";

import { Icon } from "@iconify/vue";
import zipIcon from "@iconify-icons/mdi/zip-box";
import doneIcon from "@iconify-icons/mdi/check";
import extractIcon from "@iconify-icons/mdi/archive-arrow-up-outline";
import compressIcon from "@iconify-icons/mdi/folder-zip-outline";
import closeCircleIcon from "@iconify-icons/mdi/close-circle";

const jobsStore = useArchiveJobsStore();
const windowStore = useWindowStore();
const { themeClasses } = useTheme();
const { isOpen, toggle, close } = useTrayPanel("archive-jobs-indicator");

const indicatorRef = ref<HTMLElement | null>(null);

function percent(job: ArchiveJob): number | null {
  if (job.totalBytes <= 0) return null;
  return Math.min(100, Math.round((job.processedBytes / job.totalBytes) * 100));
}

function reveal(job: ArchiveJob) {
  if (job.state !== "done" || !job.result) return;
  windowStore.openFileInApp("fileexplorer", {
    data: {
      initialLocation: job.location.source,
      initialPath: parentFolder(job.result.path),
      initialFileName: job.result.path,
      initialContainer: job.location.container,
      initialMountIndex: job.location.mount,
      initialDiskId: job.location.disk,
    },
  });
  close();
}
</script>

<style scoped>
.archive-indicator-wrapper {
  position: relative;
  user-select: none;
}

.archive-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.15s ease;
  cursor: pointer;
  position: relative;
}

.archive-ring {
  position: absolute;
}

.archive-glyph {
  width: 12px;
  height: 12px;
}

.archive-indeterminate {
  animation: archive-indeterminate 1.2s ease-in-out infinite;
}

@keyframes archive-indeterminate {
  from {
    left: -33%;
  }
  to {
    left: 100%;
  }
}

.taskbar-item-enter-active,
.taskbar-item-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.taskbar-item-enter-from,
.taskbar-item-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(10px);
}
</style>
