// homedock-ui/vue3/static/js/__Composables__/statusBarContext.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import type { ComputedRef, InjectionKey } from "vue";

import type { WindowState } from "../__Stores__/windowStore";

export const STATUS_BAR_WINDOW: InjectionKey<ComputedRef<WindowState | null>> = Symbol("status-bar-window");
