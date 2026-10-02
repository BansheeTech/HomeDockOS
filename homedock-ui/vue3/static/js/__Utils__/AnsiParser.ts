// homedock-ui/vue3/static/js/__Utils__/AnsiParser.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export type AnsiColor = { index: number } | { rgb: string } | null;

export interface AnsiSegment {
  text: string;
  fg: AnsiColor;
  bg: AnsiColor;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
}

const ESCAPE_RE = /\x1b\[([0-9;:]*)m|\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b[@-Z\\-_]|[\x00-\x08\x0b-\x1f\x7f]/g;

const CUBE_STEPS = [0, 95, 135, 175, 215, 255];

function color256(n: number): AnsiColor {
  if (n < 16) return { index: n };

  if (n < 232) {
    const value = n - 16;
    const r = CUBE_STEPS[Math.floor(value / 36)];
    const g = CUBE_STEPS[Math.floor((value % 36) / 6)];
    const b = CUBE_STEPS[value % 6];
    return { rgb: `rgb(${r}, ${g}, ${b})` };
  }

  const gray = 8 + (n - 232) * 10;
  return { rgb: `rgb(${gray}, ${gray}, ${gray})` };
}

function extendedColor(codes: number[], start: number): { color: AnsiColor; consumed: number } {
  const mode = codes[start + 1];

  if (mode === 5 && codes.length > start + 2) {
    return { color: color256(codes[start + 2] & 255), consumed: 2 };
  }

  if (mode === 2 && codes.length > start + 4) {
    const [r, g, b] = codes.slice(start + 2, start + 5).map((value) => Math.max(0, Math.min(255, value)));
    return { color: { rgb: `rgb(${r}, ${g}, ${b})` }, consumed: 4 };
  }

  return { color: null, consumed: 0 };
}

export function stripAnsi(text: string): string {
  return text.replace(ESCAPE_RE, "");
}

export function parseAnsi(text: string): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  const state = { fg: null as AnsiColor, bg: null as AnsiColor, bold: false, dim: false, italic: false, underline: false };

  let lastIndex = 0;

  const push = (chunk: string) => {
    if (!chunk) return;

    const previous = segments[segments.length - 1];
    if (previous && previous.fg === state.fg && previous.bg === state.bg && previous.bold === state.bold && previous.dim === state.dim && previous.italic === state.italic && previous.underline === state.underline) {
      previous.text += chunk;
      return;
    }

    segments.push({ text: chunk, ...state });
  };

  for (const match of text.matchAll(ESCAPE_RE)) {
    push(text.slice(lastIndex, match.index));
    lastIndex = (match.index ?? 0) + match[0].length;

    if (match[1] === undefined) continue;

    const codes = match[1] === "" ? [0] : match[1].split(/[;:]/).map((code) => Number(code) || 0);

    for (let i = 0; i < codes.length; i++) {
      const code = codes[i];

      if (code === 0) Object.assign(state, { fg: null, bg: null, bold: false, dim: false, italic: false, underline: false });
      else if (code === 1) state.bold = true;
      else if (code === 2) state.dim = true;
      else if (code === 3) state.italic = true;
      else if (code === 4) state.underline = true;
      else if (code === 22) state.bold = state.dim = false;
      else if (code === 23) state.italic = false;
      else if (code === 24) state.underline = false;
      else if (code >= 30 && code <= 37) state.fg = { index: code - 30 };
      else if (code >= 90 && code <= 97) state.fg = { index: code - 90 + 8 };
      else if (code === 39) state.fg = null;
      else if (code >= 40 && code <= 47) state.bg = { index: code - 40 };
      else if (code >= 100 && code <= 107) state.bg = { index: code - 100 + 8 };
      else if (code === 49) state.bg = null;
      else if (code === 38 || code === 48) {
        const { color, consumed } = extendedColor(codes, i);
        if (code === 38) state.fg = color;
        else state.bg = color;
        i += consumed;
      }
    }
  }

  push(text.slice(lastIndex));

  return segments;
}
