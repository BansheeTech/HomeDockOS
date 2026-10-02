// homedock-ui/vue3/static/js/__Islands__/Hello.island.tsx
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { useState } from "react";

import { useIslandHost } from "./host";

export default function HelloIsland({ title, onCount }: { title: string; onCount?: (count: number) => void }) {
  const host = useIslandHost();
  const [count, setCount] = useState(0);

  const increment = () => {
    const next = count + 1;
    setCount(next);
    onCount?.(next);
  };

  return (
    <div data-island="hello" className="flex flex-col items-start gap-2 p-4 text-sm">
      <strong data-testid="title">{title}</strong>
      <span data-testid="host">
        {host.theme} · {host.appearance} · {host.locale}
      </span>
      <button data-testid="counter" className="px-3 py-1 rounded border" onClick={increment}>
        React {count}
      </button>
    </div>
  );
}
