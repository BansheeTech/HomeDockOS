// homedock-ui/vue3/static/js/__Config__/GamesDefaultDetails.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineAsyncComponent } from "vue";
import WindowLoading from "../__Components__/WindowLoading.vue";
import type { SystemApp } from "./WindowTypes";

const GameNeonRush = defineAsyncComponent({
  loader: () => import("../__Apps__/GameNeonRush.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});

const GamePacketSnake = defineAsyncComponent({
  loader: () => import("../__Apps__/GamePacketSnake.vue"),
  loadingComponent: WindowLoading,
  delay: 200,
});

import carSportsIcon from "@iconify-icons/mdi/car-sports";
import snakeIcon from "@iconify-icons/mdi/snake";

export const GAMES_APPS: SystemApp[] = [
  {
    id: "neonrush",
    name: "Neon Rush",
    description: "Endless neon highway racer",
    icon: carSportsIcon,
    color: "#c026d3",
    component: GameNeonRush,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "games",
    showInStartMenu: false,
    showInFinderApp: false,
    showInMyHomeApp: true,
  },
  {
    id: "packetsnake",
    name: "Packet Snake",
    description: "Neon snake that feeds on your apps",
    icon: snakeIcon,
    color: "#65a30d",
    component: GamePacketSnake,
    defaultWidth: 1024,
    defaultHeight: 768,
    minWidth: 400,
    minHeight: 700,
    resizable: true,
    maximizable: true,
    minimizable: true,
    closeable: true,
    category: "games",
    showInStartMenu: false,
    showInFinderApp: false,
    showInMyHomeApp: true,
  },
];
