// homedock-ui/vue3/static/js/__Stores__/useFileExplorerStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";
import { useCsrfToken } from "../__Composables__/useCsrfToken";

export type FileExplorerLocation = "storage" | "dropzone" | "appdrive" | "favorites" | "recents" | "systemapps" | "utilities";

export interface FavoriteItem {
  location: "storage" | "dropzone" | "appdrive";
  path: string;
  name: string;
  is_directory: boolean;
  added_at: number;
  container?: string;
  mount_index?: number;
}

export interface RecentItem {
  location: "storage" | "dropzone" | "appdrive";
  path: string;
  name: string;
  is_directory: boolean;
  accessed_at: number;
  container?: string;
  mount_index?: number;
}

export const useFileExplorerStore = defineStore("FileExplorerStore", () => {
  const csrfToken = useCsrfToken();

  // State
  const favorites = ref<FavoriteItem[]>([]);
  const recents = ref<RecentItem[]>([]);
  const currentLocation = ref<FileExplorerLocation>("storage");
  const currentPath = ref("");
  const isLoadingFavorites = ref(false);
  const isLoadingRecents = ref(false);
  const lastFavoritesUpdate = ref(0);
  const lastRecentsUpdate = ref(0);

  // AppDrive
  const selectedContainer = ref<string | null>(null);
  const selectedMountIndex = ref(0);

  // Getters
  const favoritesCount = computed(() => favorites.value.length);
  const recentsCount = computed(() => recents.value.length);
  const hasFavorites = computed(() => favorites.value.length > 0);
  const hasRecents = computed(() => recents.value.length > 0);

  // Actions
  async function fetchFavorites() {
    isLoadingFavorites.value = true;
    try {
      const response = await axios.get("/api/fileexplorer/favorites", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      favorites.value = response.data.favorites || [];
      lastFavoritesUpdate.value = Date.now();
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    } finally {
      isLoadingFavorites.value = false;
    }
  }

  async function addToFavorites(item: Omit<FavoriteItem, "added_at">) {
    try {
      await axios.post("/api/fileexplorer/favorites/add", item, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error("Failed to add favorite:", error);
      return false;
    }
  }

  async function removeFromFavorites(item: Pick<FavoriteItem, "location" | "path" | "name">) {
    try {
      await axios.post("/api/fileexplorer/favorites/remove", item, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error("Failed to remove favorite:", error);
      return false;
    }
  }

  function isFavorite(location: string, path: string, name: string): boolean {
    return favorites.value.some((f) => f.location === location && f.path === path && f.name === name);
  }

  async function fetchRecents() {
    isLoadingRecents.value = true;
    try {
      const response = await axios.get("/api/fileexplorer/recents", {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      recents.value = response.data.recents || [];
      lastRecentsUpdate.value = Date.now();
    } catch (error) {
      console.error("Failed to fetch recents:", error);
    } finally {
      isLoadingRecents.value = false;
    }
  }

  async function addToRecents(item: Omit<RecentItem, "accessed_at">) {
    try {
      await axios.post("/api/fileexplorer/recents/add", item, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      fetchRecents();
      return true;
    } catch (error) {
      console.error("Failed to add recent:", error);
      return false;
    }
  }

  async function removeFromRecents(item: Pick<RecentItem, "location" | "path" | "name">) {
    try {
      await axios.post("/api/fileexplorer/recents/remove", item, {
        headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
      });
      await fetchRecents();
      return true;
    } catch (error) {
      console.error("Failed to remove recent:", error);
      return false;
    }
  }

  async function clearRecents() {
    try {
      await axios.post(
        "/api/fileexplorer/recents/clear",
        {},
        {
          headers: { "X-HomeDock-CSRF-Token": csrfToken.value },
        }
      );
      recents.value = [];
      lastRecentsUpdate.value = Date.now();
      return true;
    } catch (error) {
      console.error("Failed to clear recents:", error);
      return false;
    }
  }

  function setLocation(location: FileExplorerLocation) {
    currentLocation.value = location;
    currentPath.value = "";
    if (location !== "appdrive") {
      selectedContainer.value = null;
      selectedMountIndex.value = 0;
    }
  }

  function setPath(path: string) {
    currentPath.value = path;
  }

  function setAppDriveContainer(container: string | null, mountIndex: number = 0) {
    selectedContainer.value = container;
    selectedMountIndex.value = mountIndex;
  }

  async function initialize() {
    await Promise.all([fetchFavorites(), fetchRecents()]);
  }

  return {
    // State
    favorites,
    recents,
    currentLocation,
    currentPath,
    isLoadingFavorites,
    isLoadingRecents,
    lastFavoritesUpdate,
    lastRecentsUpdate,
    selectedContainer,
    selectedMountIndex,

    // Getters
    favoritesCount,
    recentsCount,
    hasFavorites,
    hasRecents,

    // Actions
    fetchFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    fetchRecents,
    addToRecents,
    removeFromRecents,
    clearRecents,
    setLocation,
    setPath,
    setAppDriveContainer,
    initialize,
  };
});
