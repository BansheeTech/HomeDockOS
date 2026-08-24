// homedock-ui/vue3/static/js/__Utils__/ScreenCapture.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

const CHUNK_SIZE = 5 * 1024 * 1024;

const SCREENSHOT_FOLDER = "Photos";

const THUMBNAIL_WIDTH = 256;

export interface CaptureRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptureResult {
  blob: Blob;
  buffer: ArrayBuffer;
  thumbnail: string;
  cropped: boolean;
}

export class CaptureCancelled extends Error {}

export function isScreenCaptureSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;
}

export function screenshotFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;

  return `Screenshot ${date} at ${time}.png`;
}

function makeThumbnail(source: HTMLCanvasElement): string {
  const scale = Math.min(1, THUMBNAIL_WIDTH / source.width);

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

async function firstFrame(video: HTMLVideoElement): Promise<void> {
  await video.play();

  const withFrameCallback = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number;
  };

  if (withFrameCallback.requestVideoFrameCallback) {
    await new Promise<void>((resolve) => withFrameCallback.requestVideoFrameCallback!(() => resolve()));
    return;
  }

  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
}

export async function grabScreenshot(rect: CaptureRect | null): Promise<CaptureResult> {
  let stream: MediaStream;

  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "browser" },
      audio: false,
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions);
  } catch (err) {
    if ((err as DOMException)?.name === "NotAllowedError") throw new CaptureCancelled();
    throw err;
  }

  const track = stream.getVideoTracks()[0];
  const video = document.createElement("video");

  try {
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("capture_stream_failed"));
    });

    await firstFrame(video);

    const frameWidth = video.videoWidth;
    const frameHeight = video.videoHeight;
    if (!frameWidth || !frameHeight) throw new Error("capture_empty_frame");

    const isTab = (track.getSettings() as MediaTrackSettings & { displaySurface?: string }).displaySurface === "browser";
    const canCrop = !!rect && isTab;

    let sx = 0;
    let sy = 0;
    let sw = frameWidth;
    let sh = frameHeight;

    if (canCrop && rect) {
      const scaleX = frameWidth / window.innerWidth;
      const scaleY = frameHeight / window.innerHeight;
      sx = Math.max(0, Math.round(rect.x * scaleX));
      sy = Math.max(0, Math.round(rect.y * scaleY));
      sw = Math.min(frameWidth - sx, Math.round(rect.width * scaleX));
      sh = Math.min(frameHeight - sy, Math.round(rect.height * scaleY));
    }

    if (sw <= 0 || sh <= 0) throw new Error("capture_empty_frame");

    let outWidth = sw;
    let outHeight = sh;

    if (isTab) {
      const trueAspect = (canCrop && rect ? rect.width / rect.height : window.innerWidth / window.innerHeight) || 1;
      const frameAspect = sw / sh;

      if (Math.abs(frameAspect - trueAspect) / trueAspect > 0.01) {
        outHeight = Math.max(1, Math.round(sw / trueAspect));
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = outWidth;
    canvas.height = outHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("capture_no_canvas");
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outWidth, outHeight);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("capture_encode_failed");

    return {
      blob,
      buffer: await blob.arrayBuffer(),
      thumbnail: makeThumbnail(canvas),
      cropped: canCrop,
    };
  } finally {
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
}

export async function uploadScreenshot(blob: Blob, fileName: string, csrfToken: string): Promise<string> {
  const headers = { "X-HomeDock-CSRF-Token": csrfToken };
  const totalChunks = Math.ceil(blob.size / CHUNK_SIZE);

  const init = await axios.post(
    "/api/storage/upload/init",
    {
      filename: fileName,
      total_size: blob.size,
      total_chunks: totalChunks,
      target_path: SCREENSHOT_FOLDER,
    },
    { headers },
  );

  const uploadId = init.data?.upload_id;
  if (!init.data?.success || !uploadId) throw new Error(init.data?.error || "init_failed");

  try {
    for (let i = 0; i < totalChunks; i++) {
      const chunk = blob.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, blob.size));

      await axios.put(`/api/storage/upload/chunk?upload_id=${encodeURIComponent(uploadId)}&chunk_index=${i}`, chunk, {
        headers: { ...headers, "Content-Type": "application/octet-stream" },
      });
    }

    const finalize = await axios.post("/api/storage/upload/finalize", { upload_id: uploadId }, { headers });
    if (!finalize.data?.success) throw new Error(finalize.data?.error || "finalize_failed");

    return finalize.data.path as string;
  } catch (err) {
    try {
      await axios.delete(`/api/storage/upload/abort?upload_id=${encodeURIComponent(uploadId)}`, { headers });
    } catch {}
    throw err;
  }
}
