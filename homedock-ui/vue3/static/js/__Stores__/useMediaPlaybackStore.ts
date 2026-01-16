// homedock-ui/vue3/static/js/__Stores__/useMediaPlaybackStore.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { defineStore } from "pinia";

export interface MediaPlayerInfo {
  windowId: string;
  fileName: string;
  isPlaying: boolean;
  isVideo: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
}

export const useMediaPlaybackStore = defineStore("MediaPlaybackStore", {
  state: () => ({
    players: new Map<string, MediaPlayerInfo>(),
  }),
  getters: {
    activePlayers(): MediaPlayerInfo[] {
      return Array.from(this.players.values());
    },
    playingPlayers(): MediaPlayerInfo[] {
      return Array.from(this.players.values()).filter((p) => p.isPlaying);
    },
    hasActivePlayers(): boolean {
      return this.players.size > 0;
    },
    hasPlayingMedia(): boolean {
      return Array.from(this.players.values()).some((p) => p.isPlaying);
    },
    primaryPlayer(): MediaPlayerInfo | null {
      const playing = Array.from(this.players.values()).find((p) => p.isPlaying);
      if (playing) return playing;
      const players = Array.from(this.players.values());
      return players.length > 0 ? players[players.length - 1] : null;
    },
  },
  actions: {
    registerPlayer(windowId: string, info: Omit<MediaPlayerInfo, "windowId">) {
      this.players.set(windowId, { windowId, ...info });
    },
    unregisterPlayer(windowId: string) {
      this.players.delete(windowId);
    },
    updatePlayer(windowId: string, updates: Partial<Omit<MediaPlayerInfo, "windowId">>) {
      const player = this.players.get(windowId);
      if (player) {
        this.players.set(windowId, { ...player, ...updates });
      }
    },
    setPlaying(windowId: string, isPlaying: boolean) {
      const player = this.players.get(windowId);
      if (player) {
        this.players.set(windowId, { ...player, isPlaying });
      }
    },
    setVolume(windowId: string, volume: number) {
      const player = this.players.get(windowId);
      if (player) {
        this.players.set(windowId, { ...player, volume });
      }
    },
    setMuted(windowId: string, isMuted: boolean) {
      const player = this.players.get(windowId);
      if (player) {
        this.players.set(windowId, { ...player, isMuted });
      }
    },
    getPlayer(windowId: string): MediaPlayerInfo | undefined {
      return this.players.get(windowId);
    },
  },
});
