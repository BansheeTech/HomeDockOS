// homedock-ui/vue3/static/js/__Utils__/WhatsNewSceneEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";

import { clamp01, easeOutBack, iconTile } from "./HomeDockLogoEngine";
import type { HomeDockLogoTheme, HomeDockSatellite, IconTile } from "./HomeDockLogoEngine";

export interface WhatsNewSceneOptions {
  theme: HomeDockLogoTheme;
  tiles: HomeDockSatellite[];
}

type WindowKind = "app" | "widgets" | "browser";

interface WindowSpec {
  kind: WindowKind;
  width: number;
  height: number;
  position: [number, number, number];
  rotation: number;
  accent: string;
  phase: number;
}

interface ScenePalette {
  body: string;
  glow: number;
  opacity: number;
  bar: string;
  line: string;
}

interface FloatingItem {
  mesh: THREE.Object3D;
  base: THREE.Vector3;
  rotation: number;
  scale: number;
  spin: number;
  phase: number;
  delay: number;
}

const PALETTES: Record<HomeDockLogoTheme, ScenePalette> = {
  default: { body: "#ffffff", glow: 0.45, opacity: 0.9, bar: "#f4f4f5", line: "#e4e4e7" },
  noir: { body: "#27272a", glow: 0, opacity: 0.92, bar: "#3f3f46", line: "#52525b" },
  aeroplus: { body: "#27272a", glow: 0, opacity: 0.85, bar: "#3f3f46", line: "#52525b" },
};

const WINDOWS: WindowSpec[] = [
  { kind: "app", width: 2, height: 1.3, position: [-1.2, 0.3, -0.9], rotation: 0.28, accent: "#6366f1", phase: 0 },
  { kind: "widgets", width: 1.6, height: 1.1, position: [1.3, 0.25, -0.45], rotation: -0.32, accent: "#ec4899", phase: 2.1 },
  { kind: "browser", width: 2.1, height: 1.35, position: [0.05, -0.25, 0.35], rotation: 0.04, accent: "#3b82f6", phase: 4.2 },
];

const TILE_SPOTS: Array<[number, number, number]> = [
  [-2.2, -0.5, 0.5],
  [2.35, -0.6, 0.7],
  [2.1, 0.8, 0.15],
  [-2.35, 0.78, -0.2],
];

const LIGHT_COLORS = ["#ff5f57", "#febc2e", "#28c840"];
const WIDGET_COLORS = ["#f59e0b", "#10b981"];
const LOCK_COLOR = "#16a34a";

const WINDOW_RADIUS = 0.09;
const WINDOW_DEPTH = 0.03;
const WINDOW_BEVEL = 0.02;
const WINDOW_FACE = WINDOW_DEPTH / 2 + WINDOW_BEVEL;
const BAR_HEIGHT = 0.16;
const LIGHT_RADIUS = 0.03;
const LIGHT_GAP = 0.09;
const CONTENT_PAD = 0.1;
const LINE_HEIGHT = 0.06;
const LAYER_GAP = 0.002;

const TILE_SCALE = 0.34;

const CAMERA_FOV = 30;
const SCENE_WIDTH = 5.8;
const MIN_FRAME = 2.5;
const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_TIME = 0.05;

const INTRO_STAGGER = 0.12;
const INTRO_DURATION = 0.9;
const INTRO_DROP = 0.5;
const INTRO_DEPTH = 1.5;
const TILE_INTRO_START = 0.35;

const TILT_X = 0.12;
const TILT_Y = 0.2;
const TILT_EASE = 3;
const PARALLAX = 0.12;
const BOB_AMPLITUDE = 0.05;
const BOB_SPEED = 1.1;
const SWAY_AMPLITUDE = 0.05;
const SWAY_SPEED = 0.5;
const TILE_SPIN = 0.35;

function panelShape(width: number, height: number, radius: number, rounded: { top: boolean; bottom: boolean } = { top: true, bottom: true }) {
  const halfW = width / 2;
  const halfH = height / 2;
  const top = rounded.top ? radius : 0;
  const bottom = rounded.bottom ? radius : 0;
  const shape = new THREE.Shape();

  shape.moveTo(-halfW + bottom, -halfH);
  shape.lineTo(halfW - bottom, -halfH);
  shape.quadraticCurveTo(halfW, -halfH, halfW, -halfH + bottom);
  shape.lineTo(halfW, halfH - top);
  shape.quadraticCurveTo(halfW, halfH, halfW - top, halfH);
  shape.lineTo(-halfW + top, halfH);
  shape.quadraticCurveTo(-halfW, halfH, -halfW, halfH - top);
  shape.lineTo(-halfW, -halfH + bottom);
  shape.quadraticCurveTo(-halfW, -halfH, -halfW + bottom, -halfH);

  return shape;
}

export class WhatsNewSceneEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 40);
  private root = new THREE.Group();
  private palette: ScenePalette;
  private geometries: THREE.BufferGeometry[] = [];
  private flatMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private bodyMaterial: THREE.MeshPhysicalMaterial;
  private glyphMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.6, roughness: 0.4, side: THREE.DoubleSide });
  private tiles: IconTile[] = [];
  private items: FloatingItem[] = [];
  private pointer = new THREE.Vector2();
  private tilt = new THREE.Vector2();
  private elapsed = 0;
  private frame = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement, options: WhatsNewSceneOptions) {
    this.palette = PALETTES[options.theme];
    this.bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: this.palette.body,
      emissive: this.palette.body,
      emissiveIntensity: this.palette.glow,
      roughness: 0.35,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      transparent: this.palette.opacity < 1,
      opacity: this.palette.opacity,
    });

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.3));

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 4);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    rim.position.set(-3, -1, -2);
    this.scene.add(rim);

    WINDOWS.forEach((spec, index) => this.addWindow(spec, index * INTRO_STAGGER));
    options.tiles.forEach((tile, index) => this.addTile(tile, index));

    this.scene.add(this.root);
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  resize(width: number, height: number) {
    const aspect = width / Math.max(1, height);
    const frame = Math.max(MIN_FRAME, SCENE_WIDTH / aspect);

    this.renderer.setSize(width, height, false);
    this.camera.aspect = aspect;
    this.camera.position.set(0, 0, frame / (2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2))));
    this.camera.updateProjectionMatrix();
    this.render();
  }

  start() {
    if (this.frame) return;

    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(MAX_FRAME_TIME, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.update(dt);
      this.render();
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  dispose() {
    this.stop();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.flatMaterials.forEach((material) => material.dispose());
    this.bodyMaterial.dispose();
    this.glyphMaterial.dispose();
    this.tiles.forEach((tile) => {
      tile.tile.dispose();
      tile.glyph.dispose();
      tile.material.dispose();
    });
    this.renderer.dispose();
  }

  private flat(color: string) {
    let material = this.flatMaterials.get(color);
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color });
      this.flatMaterials.set(color, material);
    }
    return material;
  }

  private track<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geometries.push(geometry);
    return geometry;
  }

  private block(parent: THREE.Group, x: number, y: number, width: number, height: number, radius: number, color: string, layer = 2) {
    const mesh = new THREE.Mesh(this.track(new THREE.ShapeGeometry(panelShape(width, height, Math.min(radius, width / 2, height / 2)), 6)), this.flat(color));
    mesh.position.set(x, y, WINDOW_FACE + LAYER_GAP * layer);
    parent.add(mesh);
  }

  private dot(parent: THREE.Group, x: number, y: number, radius: number, color: string) {
    const mesh = new THREE.Mesh(this.track(new THREE.CircleGeometry(radius, 20)), this.flat(color));
    mesh.position.set(x, y, WINDOW_FACE + LAYER_GAP * 3);
    parent.add(mesh);
  }

  private lines(parent: THREE.Group, left: number, top: number, width: number, ratios: number[], layer = 2) {
    ratios.forEach((ratio, index) => {
      const lineWidth = width * ratio;
      this.block(parent, left + lineWidth / 2, top - LINE_HEIGHT / 2 - index * LINE_HEIGHT * 2, lineWidth, LINE_HEIGHT, LINE_HEIGHT / 2, this.palette.line, layer);
    });
  }

  private addWindow(spec: WindowSpec, delay: number) {
    const { width, height, accent } = spec;
    const group = new THREE.Group();

    const body = this.track(
      new THREE.ExtrudeGeometry(panelShape(width - WINDOW_BEVEL * 2, height - WINDOW_BEVEL * 2, WINDOW_RADIUS - WINDOW_BEVEL), {
        depth: WINDOW_DEPTH,
        bevelEnabled: true,
        bevelThickness: WINDOW_BEVEL,
        bevelSize: WINDOW_BEVEL,
        bevelSegments: 3,
        curveSegments: 10,
      }),
    );
    body.translate(0, 0, -WINDOW_DEPTH / 2);
    group.add(new THREE.Mesh(body, this.bodyMaterial));

    const barY = height / 2 - BAR_HEIGHT / 2;
    const bar = new THREE.Mesh(this.track(new THREE.ShapeGeometry(panelShape(width, BAR_HEIGHT, WINDOW_RADIUS, { top: true, bottom: false }), 8)), this.flat(this.palette.bar));
    bar.position.set(0, barY, WINDOW_FACE + LAYER_GAP);
    group.add(bar);

    LIGHT_COLORS.forEach((color, index) => this.dot(group, -width / 2 + CONTENT_PAD + LIGHT_RADIUS + index * LIGHT_GAP, barY, LIGHT_RADIUS, color));

    const left = -width / 2 + CONTENT_PAD;
    const top = height / 2 - BAR_HEIGHT - CONTENT_PAD;
    const contentWidth = width - CONTENT_PAD * 2;
    const contentHeight = height - BAR_HEIGHT - CONTENT_PAD * 2;

    if (spec.kind === "app") {
      const sidebar = contentWidth * 0.28;
      this.block(group, left + sidebar / 2, top - contentHeight / 2, sidebar, contentHeight, 0.05, this.palette.bar);

      const mainLeft = left + sidebar + CONTENT_PAD;
      const mainWidth = contentWidth - sidebar - CONTENT_PAD;
      const hero = contentHeight * 0.48;
      this.block(group, mainLeft + mainWidth / 2, top - hero / 2, mainWidth, hero, 0.05, accent);
      this.lines(group, mainLeft, top - hero - CONTENT_PAD, mainWidth, [1, 0.8, 0.55]);
    }

    if (spec.kind === "widgets") {
      const gap = CONTENT_PAD * 0.8;
      const cellWidth = (contentWidth - gap) / 2;
      const cellHeight = (contentHeight - gap) / 2;
      const colors = [accent, WIDGET_COLORS[0], this.palette.line, WIDGET_COLORS[1]];

      colors.forEach((color, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        this.block(group, left + cellWidth / 2 + column * (cellWidth + gap), top - cellHeight / 2 - row * (cellHeight + gap), cellWidth, cellHeight, 0.07, color);
      });
    }

    if (spec.kind === "browser") {
      const address = LINE_HEIGHT * 2;
      this.block(group, 0, top - address / 2, contentWidth, address, address / 2, this.palette.bar);
      this.dot(group, left + address / 2, top - address / 2, address * 0.22, LOCK_COLOR);
      this.lines(group, left + address, top - address / 2 + LINE_HEIGHT / 2, contentWidth * 0.5, [1], 3);

      const heroTop = top - address - CONTENT_PAD;
      const hero = contentHeight * 0.45;
      this.block(group, 0, heroTop - hero / 2, contentWidth, hero, 0.05, accent);
      this.lines(group, left, heroTop - hero - CONTENT_PAD, contentWidth, [0.9, 0.6]);
    }

    group.scale.setScalar(0);
    this.root.add(group);
    this.items.push({ mesh: group, base: new THREE.Vector3(...spec.position), rotation: spec.rotation, scale: 1, spin: SWAY_AMPLITUDE, phase: spec.phase, delay });
  }

  private addTile(satellite: HomeDockSatellite, index: number) {
    const tile = iconTile(satellite, this.glyphMaterial);
    const spot = TILE_SPOTS[index % TILE_SPOTS.length];

    tile.mesh.scale.setScalar(0);
    this.root.add(tile.mesh);
    this.tiles.push(tile);
    this.items.push({ mesh: tile.mesh, base: new THREE.Vector3(...spot), rotation: spot[0] > 0 ? -0.3 : 0.3, scale: TILE_SCALE, spin: TILE_SPIN, phase: index * 1.7 + 0.8, delay: TILE_INTRO_START + index * INTRO_STAGGER });
  }

  private update(dt: number) {
    this.elapsed += dt;

    const tiltEase = Math.min(1, TILT_EASE * dt);
    this.tilt.x += (-this.pointer.y * TILT_X - this.tilt.x) * tiltEase;
    this.tilt.y += (this.pointer.x * TILT_Y - this.tilt.y) * tiltEase;
    this.root.rotation.set(this.tilt.x, this.tilt.y, 0);

    this.items.forEach((item) => {
      const appear = easeOutBack(clamp01((this.elapsed - item.delay) / INTRO_DURATION));
      const rest = 1 - appear;
      const time = this.elapsed + item.phase;
      const parallax = (item.base.z + 1) * PARALLAX;

      item.mesh.position.set(item.base.x + this.pointer.x * parallax, item.base.y - this.pointer.y * parallax * 0.5 - rest * INTRO_DROP + Math.sin(time * BOB_SPEED) * BOB_AMPLITUDE, item.base.z - rest * INTRO_DEPTH);
      item.mesh.rotation.set(Math.sin(time * SWAY_SPEED * 1.2) * SWAY_AMPLITUDE * 0.6, item.rotation + Math.sin(time * SWAY_SPEED) * item.spin, Math.sin(time * SWAY_SPEED * 0.8) * SWAY_AMPLITUDE * 0.4);
      item.mesh.scale.setScalar(Math.max(0.0001, appear * item.scale));
    });
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
