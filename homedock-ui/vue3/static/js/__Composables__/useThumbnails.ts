// homedock-ui/vue3/static/js/__Composables__/useThumbnails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { shallowReactive } from "vue";

import { useCsrfToken } from "./useCsrfToken";

export interface ThumbnailRequest {
  key: string;
  url: string;
  params: Record<string, string | number>;
}

export const THUMBNAIL_EXTENSIONS = new Set(["jpg", "jpeg", "jpe", "jfif", "png", "gif", "webp", "bmp", "ico", "tif", "tiff", "psd", "avif", "tga", "dds", "icns", "jp2", "j2k", "qoi", "dng", "cr2", "nef", "nrw", "arw", "srf", "sr2", "rw2", "pef", "srw", "raf"]);

export const BROWSER_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "ico"]);

export const EXTENDED_IMAGE_EXTENSIONS = new Set([...THUMBNAIL_EXTENSIONS].filter((extension) => !BROWSER_IMAGE_EXTENSIONS.has(extension)));

const MAX_CACHED = 400;
const MAX_CONCURRENT = 4;
const VISIBILITY_MARGIN = "200px";

const thumbnails = shallowReactive(new Map<string, string | null>());
const pending = new Set<string>();
const queue: (() => Promise<void>)[] = [];
let active = 0;

function remember(key: string, url: string | null) {
  thumbnails.set(key, url);

  while (thumbnails.size > MAX_CACHED) {
    const [oldestKey, oldestUrl] = thumbnails.entries().next().value as [string, string | null];
    thumbnails.delete(oldestKey);
    if (oldestUrl) URL.revokeObjectURL(oldestUrl);
  }
}

function drain() {
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const task = queue.shift()!;
    active += 1;
    task().finally(() => {
      active -= 1;
      drain();
    });
  }
}

let observer: IntersectionObserver | null = null;
const visibilityHandlers = new WeakMap<Element, () => void>();

function sharedObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer!.unobserve(entry.target);
          visibilityHandlers.get(entry.target)?.();
          visibilityHandlers.delete(entry.target);
        }
      },
      { rootMargin: VISIBILITY_MARGIN },
    );
  }
  return observer;
}

export function thumbnailExtension(name: string) {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function useThumbnails() {
  const csrfToken = useCsrfToken();

  function thumbnailUrl(key: string) {
    return thumbnails.get(key);
  }

  function loadThumbnail(request: ThumbnailRequest) {
    if (thumbnails.has(request.key) || pending.has(request.key)) return;
    pending.add(request.key);

    queue.push(async () => {
      try {
        const response = await axios.get<Blob>(request.url, {
          params: request.params,
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
          responseType: "blob",
          validateStatus: (status) => status === 200 || status === 204,
        });
        remember(request.key, response.status === 200 && response.data.size > 0 ? URL.createObjectURL(response.data) : null);
      } catch {
        remember(request.key, null);
      } finally {
        pending.delete(request.key);
      }
    });

    drain();
  }

  function whenVisible(element: Element, callback: () => void) {
    visibilityHandlers.set(element, callback);
    sharedObserver().observe(element);

    return () => {
      visibilityHandlers.delete(element);
      observer?.unobserve(element);
    };
  }

  return { thumbnailUrl, loadThumbnail, whenVisible };
}
