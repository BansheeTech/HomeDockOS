// homedock-ui/vue3/static/js/__Utils__/HomeDockLogoEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

import { homedockIcon } from "../__Config__/HomeDockIcon";

export type HomeDockLogoState = "idle" | "checking" | "awaiting" | "error" | "success" | "limited";

export type HomeDockLogoSide = "front" | "back";

export type HomeDockLogoTheme = "default" | "noir" | "aeroplus";

export interface HomeDockSatellite {
  icon: { body: string; width?: number; height?: number };
  color: string;
}

export interface HomeDockLogoOptions {
  theme: HomeDockLogoTheme;
  frame: number;
  intro: boolean;
  satellites: HomeDockSatellite[];
}

interface TilePalette {
  tile: string;
  shade: number;
  opacity: number;
  glyph: string;
}

export interface IconTile {
  mesh: THREE.Group;
  tile: THREE.ExtrudeGeometry;
  glyph: THREE.BufferGeometry;
  material: THREE.MeshPhysicalMaterial;
}

interface SecretBit {
  x: number;
  y: number;
  value: string;
  age: number;
}

interface Satellite extends IconTile {
  radius: number;
  docked: boolean;
}

const PALETTES: Record<HomeDockLogoTheme, TilePalette> = {
  default: { tile: "#ffffff", shade: 0.92, opacity: 1, glyph: "#18181b" },
  noir: { tile: "#27272a", shade: 0.55, opacity: 1, glyph: "#ffffff" },
  aeroplus: { tile: "#27272a", shade: 0.55, opacity: 1, glyph: "#ffffff" },
};

const SUCCESS_COLOR = new THREE.Color("#16a34a");
const LIMITED_COLOR = new THREE.Color("rgb(255, 30, 30)");
const ERROR_COLOR = new THREE.Color("rgb(185, 28, 28)");

const AWAITING_HUE_FROM = 0.52;
const AWAITING_HUE_TO = 0.92;
const AWAITING_HUE_SPEED = 0.9;
const AWAITING_SATURATION = 0.78;
const AWAITING_LIGHTNESS = 0.6;
const AWAITING_EASE = 3;
const ROCK_AMPLITUDE = 0.42;
const ROCK_SPEED = 1.7;
const BREATH_SCALE = 0.045;
const BREATH_SPEED = 2.4;
const MATRIX_TEXTURE = 256;
const MATRIX_COLUMNS = 14;
const MATRIX_INTERVAL = 3.2;
const MATRIX_DURATION = 1.5;
const MATRIX_TRAIL = 0.45;
const MATRIX_FLIP_CHANCE = 0.12;
const MATRIX_FRAME_TIME = 1 / 30;
const MATRIX_INSET = 0.04;

const TILE_SIZE = 1;
const TILE_RADIUS = 0.225;
const TILE_DEPTH = 0.16;
const TILE_BEVEL = 0.045;
const GLYPH_RATIO = 0.58;
const GLYPH_DEPTH = 0.035;
const GLYPH_LIFT = 0.004;
const GLYPH_GLOW = 0.6;
const TILE_GLOW = 0.45;
const SATELLITE_SHADE = 0.8;

const CAMERA_FOV = 30;
const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_TIME = 0.05;

const TILT_X = 0.35;
const TILT_Y = 0.45;
const TILT_EASE = 4;
const BOB_AMPLITUDE = 0.04;
const BOB_SPEED = 1.4;
const SWAY_AMPLITUDE = 0.04;
const SWAY_SPEED = 0.7;
const SPIN_SPEED = 4;
const SPIN_SETTLE = 4;
const SUCCESS_SETTLE = 5;
const COLOR_EASE = 4;
const ERROR_DURATION = 0.9;
const ERROR_SHAKE = 0.18;
const ERROR_SHAKE_SPEED = 38;
const POP_SCALE = 0.12;
const POP_DECAY = 3;
const FULL_TURN = Math.PI * 2;
const JIGGLE_KICK = 3.2;
const JIGGLE_MAX_SPEED = 6;
const JIGGLE_STIFFNESS = 260;
const JIGGLE_DAMPING = 9;
const JIGGLE_NOD = 0.45;
const JIGGLE_POP = 0.05;
const FLIP_STIFFNESS = 90;
const FLIP_DAMPING = 11;
const SECRET_LABEL = "SECRET";
const SECRET_TEXTURE = 256;
const SECRET_PADDING = 0.12;
const SECRET_LABEL_BAND = 0.16;
const SECRET_BIT_SIZE = 0.075;
const SECRET_BIT_GAP = 0.085;
const SECRET_BIT_ATTEMPTS = 40;
const SECRET_BIT_POP = 0.22;
const SECRET_MAX_BITS = 64;

const INTRO_DURATION = 1.2;
const INTRO_DEPTH = 4;
const INTRO_DEPTH_OVERSHOOT = 1;
const SATELLITE_INTRO_START = 0.55;
const SATELLITE_INTRO_STAGGER = 0.08;
const SATELLITE_INTRO_DURATION = 0.5;

const ORBIT_SIZE = 0.3;
const ORBIT_RADIUS = 1.35;
const ORBIT_TILT = 0.35;
const ORBIT_SPEED = 0.35;
const DOCK_STAGGER = 0.09;
const DOCK_DURATION = 0.55;
const DOCK_SPIN = 3;
const DOCK_POP = 0.45;
const DOCK_FINISH = 0.5;

export function easeOutBack(t: number, overshoot = 1.70158) {
  return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

function easeInCubic(t: number) {
  return t * t * t;
}

export function clamp01(t: number) {
  return Math.max(0, Math.min(1, t));
}

function randomBit() {
  return Math.random() < 0.5 ? "0" : "1";
}

function roundedSquare(size: number, radius: number) {
  const half = size / 2;
  const shape = new THREE.Shape();

  shape.moveTo(-half + radius, -half);
  shape.lineTo(half - radius, -half);
  shape.quadraticCurveTo(half, -half, half, -half + radius);
  shape.lineTo(half, half - radius);
  shape.quadraticCurveTo(half, half, half - radius, half);
  shape.lineTo(-half + radius, half);
  shape.quadraticCurveTo(-half, half, -half, half - radius);
  shape.lineTo(-half, -half + radius);
  shape.quadraticCurveTo(-half, -half, -half + radius, -half);

  return shape;
}

function applyShade(geometry: THREE.BufferGeometry, shade: number) {
  const positions = geometry.getAttribute("position");
  const colors = new Float32Array(positions.count * 3);

  for (let i = 0; i < positions.count; i++) {
    colors.fill(THREE.MathUtils.lerp(shade, 1, positions.getY(i) / TILE_SIZE + 0.5), i * 3, i * 3 + 3);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function tileGeometry(shade: number) {
  const geometry = new THREE.ExtrudeGeometry(roundedSquare(TILE_SIZE - TILE_BEVEL * 2, TILE_RADIUS - TILE_BEVEL), {
    depth: TILE_DEPTH,
    bevelEnabled: true,
    bevelThickness: TILE_BEVEL,
    bevelSize: TILE_BEVEL,
    bevelSegments: 5,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -TILE_DEPTH / 2);
  applyShade(geometry, shade);

  return geometry;
}

function glyphGeometry(icon: HomeDockSatellite["icon"]) {
  const width = icon.width ?? 24;
  const height = icon.height ?? 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${icon.body.replace(/currentColor/g, "#ffffff")}</svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((path) => path.toShapes());
  const scale = (TILE_SIZE * GLYPH_RATIO) / Math.max(width, height);

  const geometry = new THREE.ExtrudeGeometry(shapes, { depth: GLYPH_DEPTH / scale, bevelEnabled: false, curveSegments: 6 });
  geometry.scale(scale, -scale, scale);
  geometry.center();

  return geometry;
}

function tileMaterial(color: THREE.Color, opacity: number) {
  return new THREE.MeshPhysicalMaterial({
    color: color.clone(),
    emissive: color.clone(),
    emissiveIntensity: TILE_GLOW,
    vertexColors: true,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.2,
    transparent: opacity < 1,
    opacity,
  });
}

export function iconTile(satellite: HomeDockSatellite, glyphMaterial: THREE.Material): IconTile {
  const tile = tileGeometry(SATELLITE_SHADE);
  const glyph = glyphGeometry(satellite.icon);
  const material = tileMaterial(new THREE.Color(satellite.color), 1);
  const mesh = new THREE.Group();

  const glyphMesh = new THREE.Mesh(glyph, glyphMaterial);
  glyphMesh.position.z = TILE_DEPTH / 2 + TILE_BEVEL + GLYPH_DEPTH / 2 + GLYPH_LIFT;

  mesh.add(new THREE.Mesh(tile, material), glyphMesh);

  return { mesh, tile, glyph, material };
}

export class HomeDockLogoEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 40);
  private root = new THREE.Group();
  private logo = new THREE.Group();
  private tile: THREE.ExtrudeGeometry;
  private glyph: THREE.BufferGeometry;
  private glyphMesh: THREE.Mesh;
  private secretCanvas = document.createElement("canvas");
  private secretContext: CanvasRenderingContext2D;
  private secretTexture: THREE.CanvasTexture;
  private secretMaterial: THREE.MeshBasicMaterial;
  private secretMesh: THREE.Mesh;
  private secretBits: SecretBit[] = [];
  private secretDirty = true;
  private tileMaterial: THREE.MeshPhysicalMaterial;
  private glyphMaterial: THREE.MeshStandardMaterial;
  private satelliteGlyphMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: GLYPH_GLOW, roughness: 0.4, side: THREE.DoubleSide });
  private satellites: Satellite[] = [];
  private baseTileColor: THREE.Color;
  private tileColor: THREE.Color;
  private awaitingColor = new THREE.Color();
  private awaitBlend = 0;
  private matrixCanvas = document.createElement("canvas");
  private matrixContext: CanvasRenderingContext2D;
  private matrixTexture: THREE.CanvasTexture;
  private matrixGeometry = new THREE.PlaneGeometry(TILE_SIZE - MATRIX_INSET * 2, TILE_SIZE - MATRIX_INSET * 2);
  private matrixMaterial: THREE.MeshBasicMaterial;
  private matrixColor: string;
  private matrixBits: string[][] = [];
  private matrixOffsets: number[] = [];
  private matrixClock = 0;
  private matrixFrame = 0;
  private state: HomeDockLogoState = "idle";
  private pointer = new THREE.Vector2();
  private tilt = new THREE.Vector2();
  private spin = 0;
  private spinTarget: number | null = null;
  private errorTime = 0;
  private pop = 0;
  private popStrength = POP_SCALE;
  private jiggle = 0;
  private jiggleVelocity = 0;
  private jiggleDirection = 1;
  private side: HomeDockLogoSide = "front";
  private flip = 0;
  private flipVelocity = 0;
  private orbitAngle = 0;
  private introTime: number;
  private dockTime: number | null = null;
  private dockResolve: (() => void) | null = null;
  private dockTurned = false;
  private elapsed = 0;
  private frame = 0;
  private lastTime = 0;
  private worldPosition = new THREE.Vector3();
  private orbitTilt = new THREE.Euler(ORBIT_TILT, 0, 0);

  constructor(canvas: HTMLCanvasElement, options: HomeDockLogoOptions) {
    const palette = PALETTES[options.theme];
    const glyphColor = new THREE.Color(palette.glyph);

    this.introTime = options.intro ? 0 : Infinity;
    this.baseTileColor = new THREE.Color(palette.tile);
    this.tileColor = this.baseTileColor.clone();
    this.tileMaterial = tileMaterial(this.tileColor, palette.opacity);
    this.glyphMaterial = new THREE.MeshStandardMaterial({ color: glyphColor, emissive: glyphColor, emissiveIntensity: GLYPH_GLOW, roughness: 0.4, side: THREE.DoubleSide });

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

    this.camera.position.set(0, 0, options.frame / (2 * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2))));

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.3));

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(2, 3, 4);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0xe2e8f0, 0.6);
    rim.position.set(-3, -1, -2);
    this.scene.add(rim);

    this.tile = tileGeometry(palette.shade);
    this.glyph = glyphGeometry(homedockIcon);

    this.glyphMesh = new THREE.Mesh(this.glyph, this.glyphMaterial);
    this.glyphMesh.position.z = TILE_DEPTH / 2 + TILE_BEVEL + GLYPH_DEPTH / 2 + GLYPH_LIFT;

    this.matrixCanvas.width = MATRIX_TEXTURE;
    this.matrixCanvas.height = MATRIX_TEXTURE;
    this.matrixContext = this.matrixCanvas.getContext("2d")!;
    this.matrixTexture = new THREE.CanvasTexture(this.matrixCanvas);
    this.matrixTexture.colorSpace = THREE.SRGBColorSpace;
    this.matrixMaterial = new THREE.MeshBasicMaterial({ map: this.matrixTexture, transparent: true, depthWrite: false, visible: false });
    this.matrixColor = palette.glyph;
    this.matrixBits = Array.from({ length: MATRIX_COLUMNS }, () => Array.from({ length: MATRIX_COLUMNS }, randomBit));
    this.matrixOffsets = Array.from({ length: MATRIX_COLUMNS }, () => 0);

    const matrixMesh = new THREE.Mesh(this.matrixGeometry, this.matrixMaterial);
    matrixMesh.position.z = TILE_DEPTH / 2 + TILE_BEVEL + GLYPH_LIFT / 2;

    this.secretCanvas.width = SECRET_TEXTURE;
    this.secretCanvas.height = SECRET_TEXTURE;
    this.secretContext = this.secretCanvas.getContext("2d")!;
    this.secretTexture = new THREE.CanvasTexture(this.secretCanvas);
    this.secretTexture.colorSpace = THREE.SRGBColorSpace;
    this.secretMaterial = new THREE.MeshBasicMaterial({ map: this.secretTexture, transparent: true, depthWrite: false });
    this.secretMesh = new THREE.Mesh(this.matrixGeometry, this.secretMaterial);
    this.secretMesh.rotation.y = Math.PI;
    this.secretMesh.position.z = -matrixMesh.position.z;
    this.secretMesh.visible = false;

    this.logo.add(new THREE.Mesh(this.tile, this.tileMaterial), matrixMesh, this.glyphMesh, this.secretMesh);
    this.root.add(this.logo);
    this.scene.add(this.root);

    options.satellites.forEach((satellite) => this.addSatellite(satellite));
  }

  setState(state: HomeDockLogoState) {
    if (state === this.state) return;
    this.state = state;
    this.side = "front";

    if (state === "error") this.errorTime = ERROR_DURATION;
    if (state === "success") this.turnOnce(POP_SCALE);
  }

  nudge(side: HomeDockLogoSide) {
    if (this.state !== "idle" && this.state !== "error") return;

    this.side = side;
    this.jiggleDirection = -this.jiggleDirection;
    const kick = JIGGLE_KICK * this.jiggleDirection * (side === "back" ? -1 : 1);
    this.jiggleVelocity = THREE.MathUtils.clamp(this.jiggleVelocity + kick, -JIGGLE_MAX_SPEED, JIGGLE_MAX_SPEED);

    if (this.pop === 0) {
      this.pop = 1;
      this.popStrength = JIGGLE_POP;
    }
  }

  setSecretLength(length: number) {
    const target = Math.max(0, Math.min(SECRET_MAX_BITS, Math.floor(length)));
    if (target === this.secretBits.length) return;
    while (this.secretBits.length > target) this.secretBits.pop();
    while (this.secretBits.length < target) this.secretBits.push(this.placeSecretBit());
    this.secretDirty = true;
  }

  setPointer(x: number, y: number) {
    this.pointer.set(x, y);
  }

  resize(width: number, height: number) {
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
    this.render();
  }

  dock(hold = 0): Promise<void> {
    if (this.satellites.length === 0 || this.dockTime !== null) return Promise.resolve();

    const introEnd = Math.max(INTRO_DURATION, SATELLITE_INTRO_START + (this.satellites.length - 1) * SATELLITE_INTRO_STAGGER + SATELLITE_INTRO_DURATION);
    this.dockTime = -(Math.max(0, introEnd - this.introTime) + hold);
    return new Promise((resolve) => {
      this.dockResolve = resolve;
    });
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
    this.dockResolve?.();
    this.tile.dispose();
    this.glyph.dispose();
    this.secretTexture.dispose();
    this.secretMaterial.dispose();
    this.tileMaterial.dispose();
    this.matrixTexture.dispose();
    this.matrixGeometry.dispose();
    this.matrixMaterial.dispose();
    this.glyphMaterial.dispose();
    this.satelliteGlyphMaterial.dispose();
    this.satellites.forEach((satellite) => {
      satellite.tile.dispose();
      satellite.glyph.dispose();
      satellite.material.dispose();
    });
    this.renderer.dispose();
  }

  private addSatellite(satellite: HomeDockSatellite) {
    const created = iconTile(satellite, this.satelliteGlyphMaterial);
    created.mesh.scale.setScalar(0);
    this.root.add(created.mesh);

    this.satellites.push({ ...created, radius: ORBIT_RADIUS, docked: false });
  }

  private turnOnce(strength: number) {
    this.spinTarget = Math.ceil(this.spin / FULL_TURN) * FULL_TURN + FULL_TURN;
    this.pop = 1;
    this.popStrength = strength;
  }

  private stateColor() {
    if (this.state === "success") return SUCCESS_COLOR;
    if (this.state === "limited") return LIMITED_COLOR;
    if (this.state === "error") return ERROR_COLOR;
    if (this.state === "awaiting") {
      const sweep = (Math.sin(this.elapsed * AWAITING_HUE_SPEED) + 1) / 2;
      return this.awaitingColor.setHSL(THREE.MathUtils.lerp(AWAITING_HUE_FROM, AWAITING_HUE_TO, sweep), AWAITING_SATURATION, AWAITING_LIGHTNESS);
    }
    return this.baseTileColor;
  }

  private updateMatrix(dt: number) {
    const active = this.awaitBlend > 0.01;
    this.matrixMaterial.visible = active;
    this.matrixMaterial.opacity = this.awaitBlend;

    if (!active) {
      this.matrixClock = 0;
      return;
    }

    const previousPass = Math.floor(this.matrixClock / MATRIX_INTERVAL);
    this.matrixClock += dt;
    const pass = Math.floor(this.matrixClock / MATRIX_INTERVAL);
    if (pass !== previousPass || this.matrixClock === dt) this.matrixOffsets = this.matrixOffsets.map(() => Math.random() * 0.35);

    this.matrixFrame += dt;
    if (this.matrixFrame < MATRIX_FRAME_TIME) return;
    this.matrixFrame = 0;

    const context = this.matrixContext;
    const size = MATRIX_TEXTURE;
    const progress = (this.matrixClock % MATRIX_INTERVAL) / MATRIX_DURATION;

    context.clearRect(0, 0, size, size);

    if (progress <= 1) {
      const cell = size / MATRIX_COLUMNS;
      const radius = ((TILE_RADIUS - MATRIX_INSET) / (TILE_SIZE - MATRIX_INSET * 2)) * size;
      const trail = MATRIX_TRAIL * MATRIX_COLUMNS;

      context.save();
      context.beginPath();
      context.roundRect(0, 0, size, size, radius);
      context.clip();
      context.font = `bold ${Math.round(cell * 0.82)}px ui-monospace, Menlo, Consolas, monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = this.matrixColor;

      for (let column = 0; column < MATRIX_COLUMNS; column++) {
        const head = (progress * (1 + MATRIX_TRAIL + 0.35) - this.matrixOffsets[column]) * MATRIX_COLUMNS;
        for (let row = 0; row < MATRIX_COLUMNS; row++) {
          const behind = head - row;
          if (behind < 0 || behind > trail) continue;
          if (Math.random() < MATRIX_FLIP_CHANCE) this.matrixBits[column][row] = randomBit();
          context.globalAlpha = behind < 1 ? 1 : 0.7 * (1 - behind / trail);
          context.fillText(this.matrixBits[column][row], (column + 0.5) * cell, (row + 0.5) * cell);
        }
      }

      context.restore();
    }

    this.matrixTexture.needsUpdate = true;
  }

  private updateIntro() {
    const t = clamp01(this.introTime / INTRO_DURATION);
    const eased = easeOutBack(t);

    this.logo.position.z = -(1 - easeOutBack(t, INTRO_DEPTH_OVERSHOOT)) * INTRO_DEPTH;
    this.logo.rotation.y += (1 - eased) * Math.PI;
    return Math.max(0, eased);
  }

  private placeSecretBit(): SecretBit {
    const span = 1 - SECRET_PADDING * 2;
    let x = 0.5;
    let y = 0.5;
    for (let attempt = 0; attempt < SECRET_BIT_ATTEMPTS; attempt++) {
      x = SECRET_PADDING + Math.random() * span;
      y = SECRET_PADDING + Math.random() * span;
      const clearOfLabel = Math.abs(y - 0.5) > SECRET_LABEL_BAND / 2 + SECRET_BIT_SIZE / 2;
      const clearOfBits = this.secretBits.every((bit) => Math.hypot(bit.x - x, bit.y - y) > SECRET_BIT_GAP);
      if (clearOfLabel && clearOfBits) break;
    }
    return { x, y, value: randomBit(), age: 0 };
  }

  private updateSecret(dt: number) {
    this.secretMesh.visible = Math.cos(this.flip) < 0;

    let animating = false;
    for (const bit of this.secretBits) {
      if (bit.age >= SECRET_BIT_POP) continue;
      bit.age = Math.min(SECRET_BIT_POP, bit.age + dt);
      animating = true;
    }

    if (!this.secretMesh.visible || (!animating && !this.secretDirty)) return;
    this.secretDirty = false;
    this.drawSecret();
  }

  private drawSecret() {
    const context = this.secretContext;
    const size = SECRET_TEXTURE;
    const radius = ((TILE_RADIUS - MATRIX_INSET) / (TILE_SIZE - MATRIX_INSET * 2)) * size;

    context.clearRect(0, 0, size, size);
    context.save();
    context.beginPath();
    context.roundRect(0, 0, size, size, radius);
    context.clip();
    context.fillStyle = this.matrixColor;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.font = `800 ${Math.round(size * 0.13)}px ui-sans-serif, -apple-system, "Segoe UI", system-ui, sans-serif`;
    context.fillText(SECRET_LABEL, size / 2, size / 2);

    context.font = `bold ${Math.round(size * SECRET_BIT_SIZE)}px ui-monospace, Menlo, Consolas, monospace`;
    for (const bit of this.secretBits) {
      const progress = bit.age / SECRET_BIT_POP;
      context.save();
      context.globalAlpha = 0.7 * progress;
      context.translate(bit.x * size, bit.y * size);
      context.scale(Math.max(0, easeOutBack(progress)), Math.max(0, easeOutBack(progress)));
      context.fillText(bit.value, 0, 0);
      context.restore();
    }

    context.restore();
    this.secretTexture.needsUpdate = true;
  }

  private updateSatellites(dt: number) {
    const count = this.satellites.length;
    if (count === 0) return;

    const docking = this.dockTime !== null && this.dockTime >= 0;
    this.orbitAngle += ORBIT_SPEED * dt * (docking ? DOCK_SPIN : 1);

    this.satellites.forEach((satellite, index) => {
      if (satellite.docked) return;

      const appear = clamp01((this.introTime - SATELLITE_INTRO_START - index * SATELLITE_INTRO_STAGGER) / SATELLITE_INTRO_DURATION);
      let scale = ORBIT_SIZE * easeOutBack(appear);

      if (docking) {
        const progress = clamp01((this.dockTime! - index * DOCK_STAGGER) / DOCK_DURATION);
        const eased = easeInCubic(progress);
        satellite.radius = ORBIT_RADIUS * (1 - eased);
        scale *= 1 - eased;

        if (progress >= 1) {
          satellite.docked = true;
          satellite.mesh.visible = false;
          this.pop = 1;
          this.popStrength = POP_SCALE * DOCK_POP;
          return;
        }
      }

      const angle = this.orbitAngle + (index / count) * FULL_TURN;
      this.worldPosition.set(Math.cos(angle) * satellite.radius, 0, Math.sin(angle) * satellite.radius).applyEuler(this.orbitTilt);

      satellite.mesh.position.copy(this.worldPosition);
      satellite.mesh.scale.setScalar(Math.max(0, scale));
      satellite.mesh.rotation.set(0, Math.sin(this.elapsed + index) * 0.25, Math.sin(this.elapsed * 0.8 + index) * 0.1);
    });

    if (docking && this.satellites.every((satellite) => satellite.docked)) {
      if (!this.dockTurned) {
        this.dockTurned = true;
        this.turnOnce(POP_SCALE);
      }
      if (this.dockTime! > count * DOCK_STAGGER + DOCK_DURATION + DOCK_FINISH && this.dockResolve) {
        this.dockResolve();
        this.dockResolve = null;
      }
    }
  }

  private update(dt: number) {
    this.elapsed += dt;
    this.introTime += dt;
    if (this.dockTime !== null) this.dockTime += dt;
    this.errorTime = Math.max(0, this.errorTime - dt);
    this.pop = Math.max(0, this.pop - POP_DECAY * dt);

    if (this.state === "checking") {
      this.spin += SPIN_SPEED * dt;
    } else if (this.spinTarget !== null) {
      this.spin += (this.spinTarget - this.spin) * Math.min(1, SUCCESS_SETTLE * dt);
      if (this.state !== "success" && Math.abs(this.spinTarget - this.spin) < 0.001) this.spinTarget = null;
    } else {
      this.spin += (Math.round(this.spin / FULL_TURN) * FULL_TURN - this.spin) * Math.min(1, SPIN_SETTLE * dt);
    }

    const tiltEase = Math.min(1, TILT_EASE * dt);
    this.tilt.x += (-this.pointer.y * TILT_X - this.tilt.x) * tiltEase;
    this.tilt.y += (this.pointer.x * TILT_Y - this.tilt.y) * tiltEase;
    this.root.rotation.set(this.tilt.x, this.tilt.y, 0);

    const errorIntensity = this.errorTime / ERROR_DURATION;
    const shake = Math.sin(this.elapsed * ERROR_SHAKE_SPEED) * ERROR_SHAKE * errorIntensity;
    const calm = this.state === "idle" ? 1 : 0.3;

    this.awaitBlend += ((this.state === "awaiting" ? 1 : 0) - this.awaitBlend) * Math.min(1, AWAITING_EASE * dt);
    const rock = Math.sin(this.elapsed * ROCK_SPEED) * ROCK_AMPLITUDE * this.awaitBlend;
    const breath = Math.sin(this.elapsed * BREATH_SPEED) * BREATH_SCALE * this.awaitBlend;

    this.jiggleVelocity += (-JIGGLE_STIFFNESS * this.jiggle - JIGGLE_DAMPING * this.jiggleVelocity) * dt;
    this.jiggle += this.jiggleVelocity * dt;

    const flipTarget = this.side === "back" ? Math.PI : 0;
    this.flipVelocity += (FLIP_STIFFNESS * (flipTarget - this.flip) - FLIP_DAMPING * this.flipVelocity) * dt;
    this.flip += this.flipVelocity * dt;
    this.glyphMesh.visible = Math.cos(this.flip) > 0;
    this.updateSecret(dt);

    this.logo.rotation.set(this.jiggle * JIGGLE_NOD, this.spin + this.flip + rock, Math.sin(this.elapsed * SWAY_SPEED) * SWAY_AMPLITUDE * calm + shake + this.jiggle);
    this.logo.position.y = Math.sin(this.elapsed * BOB_SPEED) * BOB_AMPLITUDE * calm;

    const introScale = this.updateIntro();
    this.logo.scale.setScalar(introScale * (1 + Math.sin(this.pop * Math.PI) * this.popStrength + breath));

    this.updateSatellites(dt);

    this.tileColor.lerp(this.stateColor(), Math.min(1, COLOR_EASE * dt));
    this.tileMaterial.color.copy(this.tileColor);
    this.tileMaterial.emissive.copy(this.tileColor);

    this.updateMatrix(dt);
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }
}
