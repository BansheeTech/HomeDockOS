// homedock-ui/vue3/static/js/__Router__/index.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { h } from "vue";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

function getVersion(): string {
  try {
    const dataCommonElement = document.getElementById("data-common");
    if (dataCommonElement?.textContent) {
      const data = JSON.parse(atob(dataCommonElement.textContent.trim()));
      return data.version || "";
    }
  } catch (e) {
    console.error("Failed to parse version from data-common:", e);
  }
  return "";
}

// HDOS00012
const routes: Array<RouteRecordRaw> = [
  {
    path: "/dashboard",
    name: "dashboard",
    component: () => Promise.resolve({ render: () => h("div") }),
    meta: {
      title: "Dashboard",
      requiresAuth: true,
    },
  },
  {
    path: "/",
    redirect: "/dashboard",
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/dashboard",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((_to, _from, next) => {
  next();
});

router.afterEach((to) => {
  const version = getVersion();
  const baseTitle = version ? `HomeDock OS ${version}` : "HomeDock OS";
  document.title = to.meta.title ? `${to.meta.title} • ${baseTitle}` : baseTitle;
});

export default router;
