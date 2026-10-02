// homedock-ui/vue3/static/js/__Islands__/host.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { createContext, useContext } from "react";

import type { PrismAppearance } from "@prism-wm/core";

export interface IslandHost {
  theme: string;
  appearance: PrismAppearance;
  locale: string;
}

export const IslandHostContext = createContext<IslandHost | null>(null);

export function useIslandHost(): IslandHost {
  const host = useContext(IslandHostContext);

  if (!host) {
    throw new Error("useIslandHost must be called inside a component mounted by <ReactIsland>.");
  }

  return host;
}
