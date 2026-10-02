// homedock-ui/vite-plugins/fortuneSheetNoEval.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { Plugin } from "vite";

const NAME = "homedock:fortune-sheet-no-eval";

const TARGET = /[\\/]@fortune-sheet[\\/]core[\\/]dist[\\/][^\\/]+\.js$/;

const REPLACEMENTS: [string, string][] = [
  ['new Function("d", "return d.unshift(".concat(arr.join(","), ")"))(d);', "d.unshift(...arr.map((row) => JSON.parse(row)));"],
  ['new Function("d", "return d.splice(".concat(index, ", 0, ").concat(arr.join(","), ")"))(d);', "d.splice(index, 0, ...arr.map((row) => JSON.parse(row)));"],
  ['new Function("d", "return d.splice(".concat(index + 1, ", 0, ").concat(arr.join(","), ")"))(d);', "d.splice(index + 1, 0, ...arr.map((row) => JSON.parse(row)));"],
];

interface PatchContext {
  warn(message: string): void;
  error(message: string): never;
}

function patch(this: PatchContext, code: string, id: string) {
  if (!TARGET.test(id)) return null;

  if (!code.includes("new Function(")) {
    this.warn(`${id} no longer uses new Function, ${NAME} can be removed.`);
    return null;
  }

  let patched = code;

  for (const [from, to] of REPLACEMENTS) {
    patched = patched.split(from).join(to);
  }

  if (patched.includes("new Function(")) {
    this.error(`${id} still contains new Function after patching; @fortune-sheet/core changed and would break under the production CSP.`);
  }

  return { code: patched, map: null };
}

export default function fortuneSheetNoEval(): Plugin {
  return {
    name: NAME,
    enforce: "pre",
    config() {
      return {
        optimizeDeps: {
          rolldownOptions: {
            plugins: [{ name: NAME, transform: patch }],
          },
        },
      };
    },
    transform: patch,
  };
}
