// homedock-ui/vue3/static/js/__Utils__/AppIconArtwork.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export interface ArtworkPlacement {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_APP_COLOR = "#475569";
export const ICON_CORNER_RATIO = 0.225;
export const OPAQUE_FORMATS = /\.(jpe?g)(\?|$)/i;

const SAMPLE = 64;
const EDGE_INSET = 1;
const ARTWORK_COVERAGE = 0.68;
const BACKDROP_BLUR_RATIO = 0.3;
const BACKDROP_OVERSCAN = 0.3;

export function measureArtwork(image: HTMLImageElement): ArtworkPlacement | null {
  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE;
  canvas.height = SAMPLE;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context || !image.naturalWidth || !image.naturalHeight) return null;

  const fit = Math.min(SAMPLE / image.naturalWidth, SAMPLE / image.naturalHeight);
  const fittedWidth = image.naturalWidth * fit;
  const fittedHeight = image.naturalHeight * fit;
  const width = SAMPLE - fittedWidth < 1 ? SAMPLE : fittedWidth;
  const height = SAMPLE - fittedHeight < 1 ? SAMPLE : fittedHeight;
  context.drawImage(image, (SAMPLE - width) / 2, (SAMPLE - height) / 2, width, height);
  const { data } = context.getImageData(0, 0, SAMPLE, SAMPLE);

  const alpha = (x: number, y: number) => data[(y * SAMPLE + x) * 4 + 3];

  let transparentEdge = false;
  let minX = SAMPLE;
  let minY = SAMPLE;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < SAMPLE; y++) {
    for (let x = 0; x < SAMPLE; x++) {
      const value = alpha(x, y);
      const onEdge = x === EDGE_INSET || y === EDGE_INSET || x === SAMPLE - 1 - EDGE_INSET || y === SAMPLE - 1 - EDGE_INSET;
      if (onEdge && value < 250) transparentEdge = true;
      if (value > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (!transparentEdge || maxX < 0) return null;

  const extent = Math.max(maxX - minX + 1, maxY - minY + 1) / SAMPLE;
  const scale = ARTWORK_COVERAGE / extent;
  const centerX = (minX + maxX + 1) / 2 / SAMPLE;
  const centerY = (minY + maxY + 1) / 2 / SAMPLE;

  return { x: (0.5 - centerX) * scale * 100, y: (0.5 - centerY) * scale * 100, scale };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load ${src}`));
    image.src = src;
  });
}

function drawFitted(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number, mode: "cover" | "contain") {
  const ratio = mode === "cover" ? Math.max(width / image.naturalWidth, height / image.naturalHeight) : Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
}

function drawBlurredBackdrop(context: CanvasRenderingContext2D, image: HTMLImageElement, size: number) {
  const offset = -size * BACKDROP_OVERSCAN;
  const extent = size * (1 + BACKDROP_OVERSCAN * 2);
  const blur = size * BACKDROP_BLUR_RATIO;

  if (typeof (context as { filter?: unknown }).filter === "string") {
    context.filter = `blur(${blur}px) saturate(1.6)`;
    drawFitted(context, image, offset, offset, extent, extent, "cover");
    context.filter = "none";
    return;
  }

  const tiny = document.createElement("canvas");
  tiny.width = 6;
  tiny.height = 6;
  const tinyContext = tiny.getContext("2d");
  if (!tinyContext) return;
  drawFitted(tinyContext, image, 0, 0, 6, 6, "cover");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(tiny, offset, offset, extent, extent);
}

export async function rasterizeAppIcon(src: string, size = 256): Promise<string | null> {
  let image: HTMLImageElement;
  try {
    image = await loadImage(src);
  } catch {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const unit = size / 56;
  const placement = OPAQUE_FORMATS.test(src) ? null : measureArtwork(image);

  context.beginPath();
  context.roundRect(0, 0, size, size, size * ICON_CORNER_RATIO);
  context.clip();

  if (!placement) {
    drawFitted(context, image, 0, 0, size, size, "cover");
  } else {
    context.fillStyle = DEFAULT_APP_COLOR;
    context.fillRect(0, 0, size, size);

    context.save();
    context.globalAlpha = 0.9;
    drawBlurredBackdrop(context, image, size);
    context.restore();

    const sheen = context.createLinearGradient(0, 0, 0, size);
    sheen.addColorStop(0, "rgba(255, 255, 255, 0.22)");
    sheen.addColorStop(0.45, "rgba(255, 255, 255, 0)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0.28)");
    context.fillStyle = sheen;
    context.fillRect(0, 0, size, size);

    context.save();
    context.translate(size / 2 + (placement.x / 100) * size, size / 2 + (placement.y / 100) * size);
    context.scale(placement.scale, placement.scale);
    context.shadowColor = "rgba(0, 0, 0, 0.3)";
    context.shadowBlur = 2 * unit;
    context.shadowOffsetY = unit;
    drawFitted(context, image, -size / 2, -size / 2, size, size, "contain");
    context.restore();
  }

  context.lineWidth = 2 * unit;
  context.strokeStyle = "rgba(0, 0, 0, 0.1)";
  context.beginPath();
  context.roundRect(0, 0, size, size, size * ICON_CORNER_RATIO);
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.25)";
  context.lineWidth = unit;
  context.beginPath();
  context.moveTo(size * ICON_CORNER_RATIO, unit / 2);
  context.lineTo(size - size * ICON_CORNER_RATIO, unit / 2);
  context.stroke();

  try {
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
