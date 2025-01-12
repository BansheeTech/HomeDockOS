// homedock-ui/vue3/static/js/__Stores__/useUserInterface.ts
// Copyright © 2023-2025 Banshee, All Rights Reserved
// https://www.banshee.pro

import { defineStore } from "pinia";

export const useUserInterfaceStore = defineStore("UserInterface", {
  state: () => ({
    isMenuCollapsed: localStorage.getItem("isMenuCollapsed") === "true" || false,
    collapsedStates: JSON.parse(localStorage.getItem("collapsedStates") || "{}"),
  }),
  actions: {
    toggleMenu() {
      this.isMenuCollapsed = !this.isMenuCollapsed;
      localStorage.setItem("isMenuCollapsed", this.isMenuCollapsed.toString());
    },
    toggleCard(id: string | number) {
      this.collapsedStates[id] = !this.collapsedStates[id];
      localStorage.setItem("collapsedStates", JSON.stringify(this.collapsedStates));
    },
  },
  getters: {
    menuCollapsed: (state) => state.isMenuCollapsed,
    isCardCollapsed: (state) => (id: string | number) => state.collapsedStates[id] || false,
  },
});
