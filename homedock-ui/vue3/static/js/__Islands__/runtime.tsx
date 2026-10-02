// homedock-ui/vue3/static/js/__Islands__/runtime.tsx
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";

import { IslandHostContext, type IslandHost } from "./host";

export interface MountedIsland {
  render(props: object, host: IslandHost): void;
  unmount(): void;
}

export function mountIsland(element: HTMLElement, Component: ComponentType<any>, onError: (error: unknown) => void): MountedIsland {
  const root = createRoot(element, { onUncaughtError: onError });

  return {
    render(props, host) {
      root.render(
        <IslandHostContext value={host}>
          <Component {...props} />
        </IslandHostContext>,
      );
    },
    unmount() {
      root.unmount();
    },
  };
}
