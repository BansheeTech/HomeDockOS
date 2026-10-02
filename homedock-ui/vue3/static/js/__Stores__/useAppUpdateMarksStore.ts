// homedock-ui/vue3/static/js/__Stores__/useAppUpdateMarksStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import axios from "axios";

import { defineStore } from "pinia";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

interface MarkableApp {
  id: string;
  name: string;
  recently_updated?: boolean;
}

export const useAppUpdateMarksStore = defineStore("AppUpdateMarks", () => {
  const csrfToken = useCsrfToken();
  const dismissed = new Map<string, string>();

  function isUnseen(app: MarkableApp): boolean {
    return app.recently_updated === true && dismissed.get(app.name) !== app.id;
  }

  function markSeen(app: MarkableApp): boolean {
    if (!isUnseen(app)) return false;

    dismissed.set(app.name, app.id);

    axios.post("/api/app-update-seen", { name: app.name }, { headers: { "X-HomeDock-CSRF-Token": csrfToken.value } }).catch(() => {});
    return true;
  }

  return { isUnseen, markSeen };
});
