// homedock-ui/vue3/static/js/__Utils__/fitFileName.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const ELLIPSIS = "…";
const MAX_EXTENSION_LENGTH = 8;
const MIN_TAIL_STEM = 2;
const TAIL_SHARE = 0.45;
const MAX_CACHED = 2000;

let canvasContext: CanvasRenderingContext2D | null = null;
const fitCache = new Map<string, string>();

function measureContext(font: string) {
  canvasContext ??= document.createElement("canvas").getContext("2d");
  if (canvasContext) canvasContext.font = font;
  return canvasContext;
}

function lineBreaks(text: string, width: number, context: CanvasRenderingContext2D) {
  const breaks: number[] = [];
  const tokens = /\s+|[^\s-]+-?|-/g;
  let lineStart = 0;
  let line = "";
  let match: RegExpExecArray | null;

  while ((match = tokens.exec(text))) {
    const token = match[0];
    const tokenStart = match.index;

    if (context.measureText(line + token).width <= width) {
      line += token;
      continue;
    }

    if (/^\s+$/.test(token)) {
      breaks.push(tokenStart + token.length);
      lineStart = tokenStart + token.length;
      line = "";
      continue;
    }

    if (line) {
      breaks.push(tokenStart);
      lineStart = tokenStart;
      line = "";
    }

    for (let index = 0; index < token.length; index++) {
      const char = token[index];
      if (line && context.measureText(line + char).width > width) {
        breaks.push(tokenStart + index);
        lineStart = tokenStart + index;
        line = "";
      }
      line += char;
    }
  }

  return { breaks, lastLineStart: lineStart };
}

function tailLength(text: string, width: number, context: CanvasRenderingContext2D) {
  const dot = text.lastIndexOf(".");
  const extension = dot > 0 && text.length - dot <= MAX_EXTENSION_LENGTH ? text.length - dot : 0;
  let length = Math.min(text.length, extension + MIN_TAIL_STEM);

  while (length < text.length && context.measureText(text.slice(text.length - length - 1)).width <= width * TAIL_SHARE) {
    length += 1;
  }

  return length;
}

function fitLastLine(rest: string, tail: string, width: number, context: CanvasRenderingContext2D) {
  let best = "";
  let low = 0;
  let high = rest.length;

  while (low <= high) {
    const keep = Math.floor((low + high) / 2);
    const candidate = rest.slice(0, keep).trimEnd() + ELLIPSIS + tail;
    if (context.measureText(candidate).width <= width) {
      best = candidate;
      low = keep + 1;
    } else {
      high = keep - 1;
    }
  }

  return best || ELLIPSIS + tail;
}

export function fitFileName(element: HTMLElement, text: string, lines: number) {
  if (!text) return text;

  const style = getComputedStyle(element);
  const width = element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  if (width <= 0) return text;

  const cacheKey = `${style.font}|${width}|${lines}|${text}`;
  const cached = fitCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const context = measureContext(style.font);
  let result = text;

  if (context) {
    const { breaks } = lineBreaks(text, width, context);

    if (breaks.length >= lines) {
      const headEnd = lines > 1 ? breaks[lines - 2] : 0;
      const tail = text.slice(text.length - tailLength(text, width, context));
      const rest = text.slice(headEnd, Math.max(headEnd, text.length - tail.length));
      result = text.slice(0, headEnd) + fitLastLine(rest, tail, width, context);
    }
  }

  if (fitCache.size >= MAX_CACHED) fitCache.clear();
  fitCache.set(cacheKey, result);
  return result;
}
