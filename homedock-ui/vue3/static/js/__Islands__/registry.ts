// homedock-ui/vue3/static/js/__Islands__/registry.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { ComponentProps, ComponentType } from "react";

export const islands = {
  hello: () => import("./Hello.island"),
  sheets: () => import("./Sheets.island"),
} satisfies Record<string, () => Promise<{ default: ComponentType<any> }>>;

export type IslandName = keyof typeof islands;

export type IslandProps<N extends IslandName> = ComponentProps<Awaited<ReturnType<(typeof islands)[N]>>["default"]>;
