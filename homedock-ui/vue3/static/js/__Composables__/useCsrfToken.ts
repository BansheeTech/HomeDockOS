// homedock-ui/vue3/static/js/__Composables__/useCsrfToken.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { inject, computed } from "vue";

export function useCsrfToken() {
  const csrfTokenReactive = inject<{ value: string }>("csrf-token");
  return computed(() => csrfTokenReactive?.value || "");
}
