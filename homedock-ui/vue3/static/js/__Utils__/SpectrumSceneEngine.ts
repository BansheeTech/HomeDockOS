// homedock-ui/vue3/static/js/__Utils__/SpectrumSceneEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";

import { SpectrumEngine, SPECTRUM_COLUMNS, SPECTRUM_HUE_START, SPECTRUM_HUE_RANGE } from "./SpectrumEngine";

const COLUMNS = SPECTRUM_COLUMNS;
const ROWS = 48;
const TERRAIN_WIDTH = 64;
const ROW_PITCH = 0.8;
const TERRAIN_HEIGHT = 13;
const ROW_INTERVAL = 0.045;

const FIT_MARGIN = 1.02;
const PEAK_NDC = -0.22;
const MAX_STRETCH = 8;
const PORTRAIT_ASPECT = 1.6;
const PORTRAIT_TILT = 0.4;
const MAX_PORTRAIT_TILT = 0.45;

const CAMERA_FOV = 34;
const CAMERA_ELEVATION = 0.5;
const CAMERA_TARGET_DEPTH = 0.3;
const CAMERA_TARGET_HEIGHT = 0.2;
const BASE_NDC = -0.96;

const MAX_PIXEL_RATIO = 2;

const VERTEX_SHADER = `
attribute vec2 aGrid;
attribute float aLevel;
attribute vec3 aTint;

uniform float uPhase;
uniform float uRowPitch;
uniform float uHeight;
uniform float uDepth;

varying vec3 vTint;
varying vec3 vPosition;
varying float vRow;
varying float vLevel;
varying float vDepth;

void main() {
  float row = aGrid.y;
  float z = row < 0.5 ? 0.0 : -(row - 1.0 + uPhase) * uRowPitch;
  vec3 p = vec3(aGrid.x, aLevel * uHeight, z);

  vTint = aTint;
  vPosition = p;
  vRow = row;
  vLevel = aLevel;
  vDepth = -z / uDepth;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uFade;

varying vec3 vTint;
varying vec3 vPosition;
varying float vRow;
varying float vLevel;
varying float vDepth;

void main() {
  vec3 normal = normalize(cross(dFdx(vPosition), dFdy(vPosition)));
  if (normal.y < 0.0) normal = -normal;
  float light = 0.45 + 0.55 * clamp(dot(normal, normalize(vec3(0.35, 1.0, 0.5))), 0.0, 1.0);

  float width = fwidth(vRow);
  float distance = abs(fract(vRow + 0.5) - 0.5);
  float ridge = 1.0 - smoothstep(width * 0.5, width * 1.5, distance);

  vec3 body = vTint * (0.75 + 0.35 * light) * (0.85 + 0.3 * vLevel);
  vec3 crest = min(vTint * (1.15 + 0.6 * vLevel), vec3(1.0));
  vec3 color = mix(body, crest, ridge);

  float fog = 1.0 - smoothstep(0.1, 1.0, vDepth);
  float alpha = mix(0.18 + 0.6 * vLevel, 0.95, ridge) * fog * uFade;

  gl_FragColor = vec4(color, alpha);
}
`;

export class SpectrumSceneEngine extends SpectrumEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.5, 400);
  private geometry = new THREE.BufferGeometry();
  private material: THREE.ShaderMaterial;
  private levels = new Float32Array(COLUMNS * ROWS);
  private levelAttribute: THREE.BufferAttribute;
  private phase = 0;
  private width = 0;
  private height = 0;
  private target = new THREE.Vector3();
  private anchor = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

    const grid = new Float32Array(COLUMNS * ROWS * 2);
    const tints = new Float32Array(COLUMNS * ROWS * 3);
    const tint = new THREE.Color();
    const rgb = { r: 0, g: 0, b: 0 };

    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const index = row * COLUMNS + column;
        const u = column / (COLUMNS - 1);
        grid[index * 2] = (u - 0.5) * TERRAIN_WIDTH;
        grid[index * 2 + 1] = row;

        tint.setHSL((SPECTRUM_HUE_START + u * SPECTRUM_HUE_RANGE) / 360, 0.8, 0.55, THREE.SRGBColorSpace);
        tint.getRGB(rgb, THREE.SRGBColorSpace);
        tints.set([rgb.r, rgb.g, rgb.b], index * 3);
      }
    }

    const indices: number[] = [];
    for (let row = ROWS - 2; row >= 0; row--) {
      for (let column = 0; column < COLUMNS - 1; column++) {
        const near = row * COLUMNS + column;
        const far = near + COLUMNS;
        indices.push(far, near, far + 1, far + 1, near, near + 1);
      }
    }

    this.levelAttribute = new THREE.BufferAttribute(this.levels, 1);
    this.levelAttribute.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(indices);
    this.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COLUMNS * ROWS * 3), 3));
    this.geometry.setAttribute("aGrid", new THREE.BufferAttribute(grid, 2));
    this.geometry.setAttribute("aTint", new THREE.BufferAttribute(tints, 3));
    this.geometry.setAttribute("aLevel", this.levelAttribute);

    this.material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        uPhase: { value: 0 },
        uRowPitch: { value: ROW_PITCH },
        uHeight: { value: TERRAIN_HEIGHT },
        uDepth: { value: ROWS * ROW_PITCH },
        uFade: { value: 0 },
      },
    });

    const mesh = new THREE.Mesh(this.geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
  }

  protected advance(dt: number) {
    this.phase += dt / ROW_INTERVAL;
    while (this.phase >= 1) {
      this.phase -= 1;
      this.levels.copyWithin(COLUMNS, 0, (ROWS - 1) * COLUMNS);
    }

    this.levels.set(this.spectrum);
    this.levelAttribute.needsUpdate = true;

    this.material.uniforms.uPhase.value = this.phase;
    this.material.uniforms.uFade.value = this.fade;

    this.fitCanvas();
  }

  protected render() {
    this.renderer.render(this.scene, this.camera);
  }

  protected reset() {
    this.levels.fill(0);
  }

  protected release() {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }

  private fitCanvas() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === this.width && height === this.height) return;

    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height, false);

    const aspect = width / Math.max(1, height);
    this.camera.aspect = aspect;
    this.camera.clearViewOffset();

    const halfWidth = (TERRAIN_WIDTH * FIT_MARGIN) / 2;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const depthOffset = ROWS * ROW_PITCH * CAMERA_TARGET_DEPTH;

    this.target.set(0, TERRAIN_HEIGHT * CAMERA_TARGET_HEIGHT, -depthOffset);
    const elevation = CAMERA_ELEVATION + THREE.MathUtils.clamp((PORTRAIT_ASPECT - aspect) * PORTRAIT_TILT, 0, MAX_PORTRAIT_TILT);
    const distance = halfWidth / (tanHalf * aspect) + depthOffset * Math.cos(elevation);

    this.camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance).add(this.target);
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
    const base = this.anchor.set(0, 0, 0).project(this.camera).y;
    this.camera.setViewOffset(width, height, 0, ((BASE_NDC - base) / 2) * height, width, height);

    this.material.uniforms.uHeight.value = this.peakHeight();
  }

  private peakHeight() {
    const reaches = (height: number) => this.anchor.set(0, height, 0).project(this.camera).y >= PEAK_NDC;
    if (reaches(TERRAIN_HEIGHT)) return TERRAIN_HEIGHT;

    let low = TERRAIN_HEIGHT;
    let high = TERRAIN_HEIGHT * MAX_STRETCH;
    for (let step = 0; step < 20; step++) {
      const middle = (low + high) / 2;
      if (reaches(middle)) high = middle;
      else low = middle;
    }
    return high;
  }
}
