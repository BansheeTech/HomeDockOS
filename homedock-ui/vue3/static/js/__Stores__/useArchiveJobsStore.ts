// homedock-ui/vue3/static/js/__Stores__/useArchiveJobsStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { message } from "ant-design-vue";

import { t } from "../__Languages__";
import { archiveErrorCode, archiveErrorMessage, cancelArchiveJob, fetchArchiveJob, type ArchiveJobKind, type ArchiveJobResult, type ArchiveJobState, type ArchiveLocation } from "../__Utils__/ArchiveClient";

export interface ArchiveJob {
  id: string;
  kind: ArchiveJobKind;
  label: string;
  location: ArchiveLocation;
  folder: string;
  archivePath: string | null;
  items: string[];
  state: ArchiveJobState;
  processedBytes: number;
  totalBytes: number;
  processedFiles: number;
  totalFiles: number;
  current: string | null;
  result: ArchiveJobResult | null;
  error: string | null;
  notify: boolean;
  finishedAt: number | null;
}

export interface StartArchiveJobOptions {
  kind: ArchiveJobKind;
  label: string;
  location: ArchiveLocation;
  folder: string;
  archivePath?: string;
  items?: string[];
  notify?: boolean;
  csrfToken: string;
  request: () => Promise<string | { _canceled: true }>;
  onError?: (code: string) => void;
}

export interface FilesChangedDetail {
  location: ArchiveLocation;
  folder: string;
}

const POLL_INTERVAL_MS = 600;
const MAX_POLL_FAILURES = 8;
const FINISHED_VISIBLE_MS = 6000;

const tokens = new Map<string, string>();
const errorHandlers = new Map<string, (code: string) => void>();

export function announceFilesChanged(detail: FilesChangedDetail) {
  window.dispatchEvent(new CustomEvent<FilesChangedDetail>("homedock:files-changed", { detail }));
}

export const useArchiveJobsStore = defineStore("ArchiveJobsStore", {
  state: () => ({
    jobs: [] as ArchiveJob[],
    now: Date.now(),
  }),

  getters: {
    runningJobs: (state) => state.jobs.filter((job) => job.state === "running"),
    visibleJobs: (state) => state.jobs.filter((job) => job.state === "running" || (job.finishedAt !== null && state.now - job.finishedAt < FINISHED_VISIBLE_MS)),
    jobById: (state) => (id: string) => state.jobs.find((job) => job.id === id) || null,
    runningForArchive: (state) => (location: ArchiveLocation, archivePath: string) => state.jobs.find((job) => job.state === "running" && job.archivePath === archivePath && job.location.source === location.source && (job.location.container || "") === (location.container || "") && (job.location.disk || "") === (location.disk || "")) || null,
  },

  actions: {
    async start(options: StartArchiveJobOptions): Promise<ArchiveJob | null> {
      let id: string | { _canceled: true };
      try {
        id = await options.request();
      } catch (error) {
        const code = archiveErrorCode(error);
        if (options.notify !== false) message.error(t(archiveErrorMessage(code)));
        options.onError?.(code);
        throw error;
      }
      if (typeof id !== "string") return null;

      tokens.set(id, options.csrfToken);
      if (options.onError) errorHandlers.set(id, options.onError);
      this.jobs.push({
        id,
        kind: options.kind,
        label: options.label,
        location: options.location,
        folder: options.folder,
        archivePath: options.archivePath ?? null,
        items: options.items ?? (options.archivePath ? [options.archivePath] : []),
        state: "running",
        processedBytes: 0,
        totalBytes: 0,
        processedFiles: 0,
        totalFiles: 0,
        current: null,
        result: null,
        error: null,
        notify: options.notify !== false,
        finishedAt: null,
      });
      this.poll(id, 0);
      return this.jobById(id);
    },

    poll(id: string, failures: number) {
      setTimeout(async () => {
        const job = this.jobById(id);
        if (!job || job.state !== "running") return;
        try {
          const status = await fetchArchiveJob(id, tokens.get(id) || "");
          job.processedBytes = status.processed_bytes;
          job.totalBytes = status.total_bytes;
          job.processedFiles = status.processed_files;
          job.totalFiles = status.total_files;
          job.current = status.current;
          if (status.state === "running") {
            this.poll(id, 0);
            return;
          }
          this.finish(job, status.state, status.result, status.error);
        } catch {
          if (failures + 1 >= MAX_POLL_FAILURES) {
            this.finish(job, "error", null, "unknown");
            return;
          }
          this.poll(id, failures + 1);
        }
      }, POLL_INTERVAL_MS);
    },

    finish(job: ArchiveJob, state: ArchiveJobState, result: ArchiveJobResult | null, error: string | null) {
      job.state = state;
      job.result = result;
      job.error = error;
      job.finishedAt = Date.now();
      tokens.delete(job.id);
      const onError = errorHandlers.get(job.id);
      errorHandlers.delete(job.id);
      this.tick();

      if (state === "done") announceFilesChanged({ location: job.location, folder: job.folder });
      if (state === "error") onError?.(error || "unknown");
      if (!job.notify) return;

      if (state === "done" && result) {
        message.success(job.kind === "extract" ? t("Extracted “{name}”", { name: result.name }) : t("Created “{name}”", { name: result.name }));
        if (result.skipped > 0) message.warning(t("{n} unsafe items were skipped", { n: result.skipped }));
      } else if (state === "error") {
        message.error(t(archiveErrorMessage(error || "unknown")));
      }
    },

    tick() {
      this.now = Date.now();
      if (this.jobs.some((job) => job.finishedAt !== null && this.now - job.finishedAt < FINISHED_VISIBLE_MS)) {
        setTimeout(() => this.tick(), 1000);
      }
      this.jobs = this.jobs.filter((job) => job.state === "running" || this.now - (job.finishedAt ?? 0) < 10 * 60 * 1000);
    },

    async cancel(id: string) {
      const job = this.jobById(id);
      if (!job || job.state !== "running") return;
      try {
        await cancelArchiveJob(id, tokens.get(id) || "");
      } catch {}
    },
  },
});
