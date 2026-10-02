// homedock-ui/vue3/static/js/__Games__/NeonRush/track.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export const LANE_WIDTH = 4.4;
export const LANE_SLOTS = [-2 * LANE_WIDTH, -LANE_WIDTH, 0, LANE_WIDTH, 2 * LANE_WIDTH];
export const LANE_BOUNDARY_ORIGIN = LANE_SLOTS[0] - LANE_WIDTH / 2;
export const SEGMENT_LENGTH = 4;
export const VISIBLE_SEGMENTS = 150;

const CURVE_WARMUP = 300;
const BASE_EDGE = LANE_WIDTH * 1.5;
const BASE_SLOTS = [1, 2, 3];
const LANE_TAPER = 180;
const LANE_OPENINGS = [
  { slot: 4, at: 6000 },
  { slot: 0, at: 12000 },
];

const CLOSURE_START = LANE_OPENINGS[0].at + LANE_TAPER + 400;
const CLOSURE_INTERVAL = 1500;
const CLOSURE_CHANCE = 0.55;
const CLOSURE_JITTER = 200;
const CLOSURE_MIN_LENGTH = 500;
const CLOSURE_MAX_LENGTH = 900;

function smoothstep(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
}

function hash(index: number, salt: number) {
  const seed = Math.sin((index + 1) * 91.7 + salt * 263.3) * 43758.5453;
  return seed - Math.floor(seed);
}

function builtOpening(slot: number, distance: number) {
  if (BASE_SLOTS.includes(slot)) return 1;
  const opening = LANE_OPENINGS.find((candidate) => candidate.slot === slot);
  return opening ? smoothstep((distance - opening.at) / LANE_TAPER) : 0;
}

function laneClosure(slot: number, distance: number) {
  const block = Math.floor((distance - CLOSURE_START) / CLOSURE_INTERVAL);
  if (block < 0 || hash(block, 0) >= CLOSURE_CHANCE) return 0;

  const start = CLOSURE_START + block * CLOSURE_INTERVAL + hash(block, 1) * CLOSURE_JITTER;
  const end = start + CLOSURE_MIN_LENGTH + hash(block, 2) * (CLOSURE_MAX_LENGTH - CLOSURE_MIN_LENGTH);
  const candidates = [LANE_SLOTS.length - 1, 0].filter((candidate) => builtOpening(candidate, start - LANE_TAPER) >= 1);
  if (!candidates.length) return 0;
  const closed = candidates[Math.floor(hash(block, 3) * candidates.length)];
  if (closed !== slot) return 0;

  return Math.min(smoothstep((distance - start) / LANE_TAPER), smoothstep((end - distance) / LANE_TAPER));
}

export function laneOpening(slot: number, distance: number) {
  return builtOpening(slot, distance) * (1 - laneClosure(slot, distance));
}

export function openLanes(distance: number) {
  return LANE_SLOTS.map((_, slot) => slot).filter((slot) => laneOpening(slot, distance) >= 1);
}

export function laneMask(distance: number) {
  return openLanes(distance).reduce((mask, slot) => mask | (1 << slot), 0);
}

export function roadLeft(distance: number) {
  return -BASE_EDGE - LANE_WIDTH * laneOpening(0, distance);
}

export function roadRight(distance: number) {
  return BASE_EDGE + LANE_WIDTH * laneOpening(LANE_SLOTS.length - 1, distance);
}

function curveStrength(distance: number) {
  return Math.min(1, Math.max(0, (distance - CURVE_WARMUP) / 900));
}

export function roadX(distance: number) {
  const strength = curveStrength(distance);
  return strength * (55 * Math.sin(distance * 0.0028) + 26 * Math.sin(distance * 0.0071 + 1.3) + 9 * Math.sin(distance * 0.017 + 0.4));
}

export function roadY(distance: number) {
  const strength = curveStrength(distance);
  return strength * (5.5 * Math.sin(distance * 0.0036 + 2.1) + 2.2 * Math.sin(distance * 0.0097));
}

export function roadHeading(distance: number) {
  return Math.atan2(roadX(distance + 1) - roadX(distance - 1), 2);
}

export function roadCurvature(distance: number) {
  return roadX(distance + 6) - 2 * roadX(distance) + roadX(distance - 6);
}
