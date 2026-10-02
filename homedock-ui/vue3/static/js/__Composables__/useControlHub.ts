// homedock-ui/vue3/static/js/__Composables__/useControlHub.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { ref, watch, onMounted, onUnmounted, type Ref } from "vue";
import type { IconifyIcon } from "@iconify/vue";

import tagIcon from "@iconify-icons/mdi/tag-outline";
import pulseIcon from "@iconify-icons/mdi/pulse";
import cpuIcon from "@iconify-icons/mdi/cpu-64-bit";
import memoryIcon from "@iconify-icons/mdi/memory";
import downloadIcon from "@iconify-icons/mdi/download";
import uploadIcon from "@iconify-icons/mdi/upload";
import clockIcon from "@iconify-icons/mdi/clock-outline";
import layersIcon from "@iconify-icons/mdi/layers-outline";
import packageIcon from "@iconify-icons/mdi/package-variant-closed";
import identifierIcon from "@iconify-icons/mdi/identifier";
import portsIcon from "@iconify-icons/mdi/lan-connect";
import roleIcon from "@iconify-icons/mdi/sitemap-outline";
import updateIcon from "@iconify-icons/mdi/arrow-up-circle";
import diskIcon from "@iconify-icons/mdi/harddisk";
import networkIcon from "@iconify-icons/mdi/network-outline";
import temperatureIcon from "@iconify-icons/mdi/thermometer";
import appsIcon from "@iconify-icons/mdi/apps";
import backgroundIcon from "@iconify-icons/mdi/cog-outline";
import loadIcon from "@iconify-icons/mdi/gauge";
import readIcon from "@iconify-icons/mdi/tray-arrow-up";
import writeIcon from "@iconify-icons/mdi/tray-arrow-down";
import activityIcon from "@iconify-icons/mdi/chart-line";

export interface NetworkRate {
  rx: number;
  tx: number;
}

const RATE_DECAY_MS = 25000;

export const METRIC_COLORS = {
  cpu: "#1a86d0",
  memory: "#a855c7",
  disk: "#22a06b",
  network: "#6366f1",
  temperature: "#ef7a2a",
  load: "#d4a017",
  diskWrite: "#7dcfa6",
};

export const LABEL_ICONS: Record<string, IconifyIcon> = {
  Name: tagIcon,
  Container: tagIcon,
  Status: pulseIcon,
  CPU: cpuIcon,
  Memory: memoryIcon,
  Download: downloadIcon,
  Received: downloadIcon,
  Upload: uploadIcon,
  Sent: uploadIcon,
  "Up time": clockIcon,
  Group: layersIcon,
  Image: packageIcon,
  "Container ID": identifierIcon,
  Ports: portsIcon,
  Role: roleIcon,
  Update: updateIcon,
  Disk: diskIcon,
  Network: networkIcon,
  Temperature: temperatureIcon,
  Apps: appsIcon,
  "Background processes": backgroundIcon,
  Load: loadIcon,
  Read: readIcon,
  Write: writeIcon,
  Activity: activityIcon,
};

export function labelIcon(label: string): IconifyIcon | null {
  return LABEL_ICONS[label] || null;
}

export function statusDotClass(status: string, themeClasses: Record<string, string>): string {
  const map: Record<string, string> = {
    running: themeClasses.statusBadgeRunning,
    exited: themeClasses.statusBadgeExited,
    paused: themeClasses.statusBadgePaused,
    created: themeClasses.statusBadgeCreated,
    restarting: themeClasses.statusBadgeRestarting,
  };
  return map[status] || themeClasses.statusBadgeCreated;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes < 1) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${sizes[i]}`;
}

export function formatRate(bytesPerSecond: number): string {
  if (!bytesPerSecond || bytesPerSecond < 1024) return "0 KB/s";
  return `${formatBytes(bytesPerSecond, 1)}/s`;
}

export function formatPercent(value: number): string {
  const numeric = Number(value) || 0;
  return `${numeric < 10 ? Math.round(numeric * 10) / 10 : Math.round(numeric)}%`;
}

export function parseDockerDate(value?: string): number {
  if (!value) return 0;
  const trimmed = value.replace(/(\.\d{3})\d+/, "$1");
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatUptime(startedAt?: string): string {
  const started = parseDockerDate(startedAt);
  if (!started) return "—";

  const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function heatStyle(value: number, max = 100): Record<string, string> {
  const ratio = Math.max(0, Math.min(1, (Number(value) || 0) / max));
  if (ratio < 0.01) return {};
  const alpha = 0.06 + ratio * 0.34;
  return { backgroundColor: `rgba(234, 138, 34, ${alpha.toFixed(3)})` };
}

export function useNetworkRates(appsRef: Ref<any[]>) {
  const rates = ref<Record<string, NetworkRate>>({});
  const samples: Record<string, { rx: number; tx: number; t: number }> = {};

  watch(
    appsRef,
    (apps) => {
      const now = Date.now();
      const next: Record<string, NetworkRate> = {};

      for (const app of apps) {
        const rx = app.networkRxBytes || 0;
        const tx = app.networkTxBytes || 0;
        const previous = samples[app.name];

        if (!previous) {
          samples[app.name] = { rx, tx, t: now };
          next[app.name] = { rx: 0, tx: 0 };
          continue;
        }

        if (rx === previous.rx && tx === previous.tx) {
          next[app.name] = now - previous.t > RATE_DECAY_MS ? { rx: 0, tx: 0 } : rates.value[app.name] || { rx: 0, tx: 0 };
          continue;
        }

        const elapsed = (now - previous.t) / 1000;
        next[app.name] = elapsed > 0.5 ? { rx: Math.max(0, (rx - previous.rx) / elapsed), tx: Math.max(0, (tx - previous.tx) / elapsed) } : rates.value[app.name] || { rx: 0, tx: 0 };
        samples[app.name] = { rx, tx, t: now };
      }

      for (const name of Object.keys(samples)) {
        if (!(name in next)) delete samples[name];
      }

      rates.value = next;
    },
    { deep: true, immediate: true },
  );

  return rates;
}

export interface ContainerSeries {
  cpu: number[];
  memory: number[];
}

export function useContainerHistory(appsRef: Ref<any[]>, capacity = 45, intervalMs = 2000) {
  const history = ref<Record<string, ContainerSeries>>({});
  let timer: ReturnType<typeof setInterval> | null = null;

  function push() {
    const next: Record<string, ContainerSeries> = {};

    for (const app of appsRef.value) {
      const previous = history.value[app.name];
      const cpu = [...(previous?.cpu || []), Number(app.usagePercent) || 0];
      const memory = [...(previous?.memory || []), Number(app.memoryUsagePercent) || 0];
      if (cpu.length > capacity) cpu.splice(0, cpu.length - capacity);
      if (memory.length > capacity) memory.splice(0, memory.length - capacity);
      next[app.name] = { cpu, memory };
    }

    history.value = next;
  }

  onMounted(() => {
    push();
    timer = setInterval(push, intervalMs);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return history;
}

export function useMetricHistory(sample: () => Record<string, number>, capacity = 60, intervalMs = 1000) {
  const history = ref<Record<string, number[]>>({});
  let timer: ReturnType<typeof setInterval> | null = null;

  function push() {
    const values = sample();
    const next = { ...history.value };

    for (const [key, value] of Object.entries(values)) {
      const series = next[key] ? [...next[key], value] : [value];
      if (series.length > capacity) series.splice(0, series.length - capacity);
      next[key] = series;
    }

    history.value = next;
  }

  onMounted(() => {
    push();
    timer = setInterval(push, intervalMs);
  });

  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  return history;
}
