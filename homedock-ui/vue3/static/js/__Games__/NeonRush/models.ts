// homedock-ui/vue3/static/js/__Games__/NeonRush/models.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export const NEON_PINK = 0xff2bd6;
export const NEON_CYAN = 0x36e0ff;
export const NIGHT = 0x0b0620;
export const PLAYER_RIM_COLOR = 0x9ca3af;
export const PLAYER_RIMS = "rims";

export const TRAFFIC_COLORS = [0x8b5cf6, 0xf97316, 0xfacc15, 0x14b8a6, 0xef4444, 0xe5e7eb];

function canvas(width: number, height: number) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  return { element, context: element.getContext("2d")! };
}

export function createRoadTexture(maxAnisotropy: number) {
  const { element, context } = canvas(256, 256);

  context.fillStyle = "#15102a";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 900; i++) {
    const shade = 18 + Math.random() * 14;
    context.fillStyle = `rgb(${shade}, ${shade - 4}, ${shade + 14})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
  }

  context.fillStyle = "#36e0ff";
  context.fillRect(0, 0, 6, 128);
  context.fillRect(250, 0, 6, 128);

  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const TOFU_GLOW = 0x9dffd8;

export function createTofuTexture() {
  const { element, context } = canvas(256, 256);
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#fffdf6");
  gradient.addColorStop(1, "#ece6d2");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 260; i++) {
    context.fillStyle = `rgba(190, 180, 150, ${0.15 + Math.random() * 0.2})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#2a2340";
  context.font = "bold 96px system-ui, sans-serif";
  context.fillText("豆腐", 128, 112);
  context.font = "bold 34px system-ui, sans-serif";
  context.fillText("TOFU", 128, 196);

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTofuSignTexture() {
  const { element, context } = canvas(512, 256);
  context.fillStyle = "#0b0620";
  context.fillRect(0, 0, 512, 256);

  context.shadowColor = "#9dffd8";
  context.shadowBlur = 18;
  context.strokeStyle = "#9dffd8";
  context.lineWidth = 10;
  context.strokeRect(12, 12, 488, 232);

  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "#ff2bd6";
  context.fillStyle = "#ff7ae6";
  context.font = "bold 120px system-ui, sans-serif";
  context.fillText("豆腐", 256, 108);
  context.shadowColor = "#9dffd8";
  context.fillStyle = "#9dffd8";
  context.font = "bold 46px system-ui, sans-serif";
  context.fillText("TOFU", 256, 200);

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGravelTexture(maxAnisotropy: number) {
  const { element, context } = canvas(256, 256);

  context.fillStyle = "#1c0d3d";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1400; i++) {
    const size = 1 + Math.floor(Math.random() * 3);
    const shade = 40 + Math.random() * 50;
    context.fillStyle = `rgb(${shade}, ${shade * 0.55}, ${shade * 1.4})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, size, size);
  }

  for (let i = 0; i < 90; i++) {
    context.fillStyle = Math.random() < 0.5 ? "#ff2bd6" : "#36e0ff";
    context.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const texture = new THREE.CanvasTexture(element);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = maxAnisotropy;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createSunTexture() {
  const { element, context } = canvas(512, 512);
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#ffe45c");
  gradient.addColorStop(0.55, "#ff7a3d");
  gradient.addColorStop(1, "#ff2bd6");

  context.fillStyle = gradient;
  context.beginPath();
  context.arc(256, 256, 250, 0, Math.PI * 2);
  context.fill();

  context.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 7; i++) {
    const y = 300 + i * 30;
    context.fillRect(0, y, 512, 4 + i * 2.2);
  }

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGlowTexture() {
  const { element, context } = canvas(128, 128);
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.45)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(element);
}

export function createSkyTexture() {
  const { element, context } = canvas(8, 256);
  const gradient = context.createLinearGradient(0, 0, 0, 256);
  gradient.addColorStop(0, "#05020f");
  gradient.addColorStop(0.55, "#1b0b3a");
  gradient.addColorStop(1, "#3b0f4f");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 8, 256);

  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMountains() {
  const group = new THREE.Group();
  const points: THREE.Vector2[] = [new THREE.Vector2(-1400, -20)];
  let x = -1400;

  while (x < 1400) {
    x += 40 + Math.random() * 90;
    points.push(new THREE.Vector2(x, 25 + Math.random() * 110));
  }
  points.push(new THREE.Vector2(1400, -20));

  const shape = new THREE.Shape(points);
  const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0x12072a, fog: false }));
  const outline = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.slice(1, -1).map((point) => new THREE.Vector3(point.x, point.y, 0.5))), new THREE.LineBasicMaterial({ color: NEON_PINK, fog: false }));

  group.add(fill, outline);
  return group;
}

export function createPalmGeometries() {
  const trunkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.08, 1.8, 0), new THREE.Vector3(-0.06, 3.8, 0), new THREE.Vector3(0.12, 5.7, 0), new THREE.Vector3(0, 7.3, 0)]);
  const trunkSegments: THREE.BufferGeometry[] = [];
  const trunkSegmentCount = 9;
  const up = new THREE.Vector3(0, 1, 0);

  for (let index = 0; index < trunkSegmentCount; index++) {
    const start = trunkCurve.getPointAt(index / trunkSegmentCount);
    const end = trunkCurve.getPointAt((index + 1) / trunkSegmentCount);
    const direction = end.clone().sub(start);
    const height = direction.length() + 0.035;
    const center = start.clone().add(end).multiplyScalar(0.5);
    const taper = index / trunkSegmentCount;
    const segment = new THREE.CylinderGeometry(0.2 - taper * 0.065, 0.23 - taper * 0.07, height, 6, 1);
    const rotation = new THREE.Quaternion().setFromUnitVectors(up, direction.normalize());
    segment.applyMatrix4(new THREE.Matrix4().compose(center, rotation, new THREE.Vector3(1, 1, 1)));
    trunkSegments.push(segment);
  }

  const trunk = mergeGeometries(trunkSegments);
  for (const segment of trunkSegments) segment.dispose();
  if (!trunk) throw new Error("Could not create palm trunk geometry");

  const positions: number[] = [];
  const indices: number[] = [];
  const crown = new THREE.Vector3(0, 7.2, 0);
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    const first = positions.length / 3;
    for (const point of [a, b, c]) positions.push(point.x, point.y, point.z);
    indices.push(first, first + 1, first + 2);
  };

  const leafWidths = [0.06, 0.34, 0.62, 0.72, 0.66, 0.5, 0.27, 0.015];
  const leafHeights = [0, 0.14, 0.22, 0.18, -0.04, -0.42, -1.08, -1.85];

  for (let index = 0; index < 10; index++) {
    const angle = (index / 10) * Math.PI * 2;
    const direction = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-direction.z, 0, direction.x);
    const centers = leafWidths.map((_, pointIndex) =>
      crown
        .clone()
        .addScaledVector(direction, (pointIndex / (leafWidths.length - 1)) * 4.35)
        .addScaledVector(up, leafHeights[pointIndex]),
    );

    for (let pointIndex = 0; pointIndex < centers.length - 1; pointIndex++) {
      const start = centers[pointIndex];
      const end = centers[pointIndex + 1];
      const startWidth = leafWidths[pointIndex];
      const endWidth = leafWidths[pointIndex + 1];
      const startRidge = start.clone().addScaledVector(up, 0.12);
      const endRidge = end.clone().addScaledVector(up, 0.12);
      const startLeft = start.clone().addScaledVector(side, startWidth);
      const startRight = start.clone().addScaledVector(side, -startWidth);
      const endLeft = end.clone().addScaledVector(side, endWidth);
      const endRight = end.clone().addScaledVector(side, -endWidth);

      addTriangle(startRidge, startLeft, endLeft);
      addTriangle(startRidge, endLeft, endRidge);
      addTriangle(startRidge, endRidge, endRight);
      addTriangle(startRidge, endRight, startRight);
    }
  }

  const branches = new THREE.BufferGeometry();
  branches.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  branches.setIndex(indices);
  branches.computeVertexNormals();
  return { trunk, branches };
}

function box(width: number, height: number, depth: number, x: number, y: number, z: number) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  geometry.translate(x, y, z);
  return geometry;
}

export function createCarBodyGeometry() {
  const geometry = mergeGeometries([box(2, 0.55, 4.2, 0, 0.55, 0), box(1.6, 0.5, 2, 0, 1.05, 0.25), box(1.9, 0.12, 0.5, 0, 1.0, 1.9)]);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTaillightGeometry() {
  return mergeGeometries([box(0.55, 0.16, 0.06, -0.62, 0.66, 2.11), box(0.55, 0.16, 0.06, 0.62, 0.66, 2.11)]);
}

export const TRAFFIC_TAILLIGHT_Y = 0.72;
export const TRAFFIC_TAILLIGHTS = [
  { x: 0.62, z: 2.14 },
  { x: 0.58, z: 2.14 },
  { x: 0.76, z: 3.12 },
];
export const PLAYER_TAILLIGHT = { x: 0.58, y: 0.66, z: 2.11 };

export function createTrafficVehicleGeometries() {
  const sportBody = mergeGeometries([
    profile(
      [
        [-2.1, 0.3],
        [-2.16, 0.52],
        [-1.7, 0.64],
        [1.7, 0.58],
        [2.1, 0.34],
      ],
      1.82,
    ),
    profile(
      [
        [-1.15, 0.6],
        [-0.72, 1.05],
        [0.45, 1.08],
        [1.28, 0.6],
      ],
      1.48,
    ),
    profile(
      [
        [1.5, 0.84],
        [1.5, 0.94],
        [1.95, 0.94],
        [1.95, 0.84],
      ],
      1.7,
    ),
  ]);
  sportBody.computeVertexNormals();

  const vanBody = mergeGeometries([box(2.12, 0.78, 6.1, 0, 0.78, 0), box(2.02, 1.3, 4.45, 0, 1.78, 0.15), box(1.98, 0.88, 1.55, 0, 1.55, -2.3)]);
  vanBody.computeVertexNormals();

  const createWheels = (halfWidth: number, frontZ: number, rearZ: number) =>
    wheels(0.34, 0.24, [
      [-halfWidth, frontZ],
      [halfWidth, frontZ],
      [-halfWidth, rearZ],
      [halfWidth, rearZ],
    ]);
  const createTaillights = ({ x, z }: { x: number; z: number }) => mergeGeometries([box(0.42, 0.18, 0.06, -x, TRAFFIC_TAILLIGHT_Y, z), box(0.42, 0.18, 0.06, x, TRAFFIC_TAILLIGHT_Y, z)]);

  return [
    {
      body: createCarBodyGeometry(),
      wheels: createWheels(0.82, -1.35, 1.35),
      taillights: createTaillights(TRAFFIC_TAILLIGHTS[0]),
    },
    {
      body: sportBody,
      wheels: createWheels(0.78, -1.4, 1.38),
      taillights: createTaillights(TRAFFIC_TAILLIGHTS[1]),
    },
    {
      body: vanBody,
      wheels: createWheels(0.91, -2.15, 2.18),
      taillights: createTaillights(TRAFFIC_TAILLIGHTS[2]),
    },
  ];
}

function profile(points: [number, number][], width: number) {
  const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(width / 2, 0, 0);
  return geometry;
}

function wheels(radius: number, width: number, positions: [number, number][]) {
  return mergeGeometries(
    positions.map(([x, z]) => {
      const wheel = new THREE.CylinderGeometry(radius, radius, width, 16);
      wheel.rotateZ(Math.PI / 2);
      wheel.translate(x, radius, z);
      return wheel;
    }),
  );
}

const PANDA_WHITE_DIFFUSE = 0x6c6c6c;
const PANDA_WHITE_GLOW = 0xa9a9ab;
const PANDA_BLACK = 0x121216;
const WHEEL_POSITIONS: [number, number][] = [
  [-0.78, -1.28],
  [0.78, -1.28],
  [-0.78, 1.22],
  [0.78, 1.22],
];

export function createPlayerCar() {
  const group = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: PANDA_WHITE_DIFFUSE, emissive: PANDA_WHITE_GLOW });
  const black = new THREE.MeshLambertMaterial({ color: PANDA_BLACK });

  const lowerBody = profile(
    [
      [-2.12, 0.3],
      [-2.16, 0.5],
      [2.1, 0.5],
      [2.1, 0.3],
    ],
    1.66,
  );
  const upperBody = profile(
    [
      [-2.1, 0.49],
      [-2.12, 0.66],
      [-1.95, 0.72],
      [-0.8, 0.83],
      [1.9, 0.84],
      [2.06, 0.78],
      [2.06, 0.49],
    ],
    1.64,
  );
  const greenhouse = profile(
    [
      [-0.8, 0.82],
      [-0.2, 1.22],
      [1.0, 1.23],
      [1.98, 0.8],
    ],
    1.48,
  );
  const roof = profile(
    [
      [-0.12, 1.2],
      [-0.08, 1.28],
      [0.96, 1.29],
      [1.06, 1.2],
    ],
    1.52,
  );
  const popUps = mergeGeometries([box(0.46, 0.2, 0.34, -0.5, 0.9, -1.72), box(0.46, 0.2, 0.34, 0.5, 0.9, -1.72)]);
  const mirrors = mergeGeometries([box(0.16, 0.12, 0.1, -0.86, 0.94, -0.55), box(0.16, 0.12, 0.1, 0.86, 0.94, -0.55)]);
  const rearPanel = box(1.6, 0.2, 0.04, 0, 0.66, 2.08);
  const spoiler = box(1.36, 0.05, 0.2, 0, 1.2, 1.2);

  group.add(new THREE.Mesh(lowerBody, black), new THREE.Mesh(upperBody, white), new THREE.Mesh(greenhouse, black), new THREE.Mesh(roof, white), new THREE.Mesh(popUps, white), new THREE.Mesh(mergeGeometries([mirrors, rearPanel, spoiler]), black));

  const { x, y, z } = PLAYER_TAILLIGHT;
  const taillights = mergeGeometries([box(0.4, 0.14, 0.04, -x, y, z), box(0.4, 0.14, 0.04, x, y, z)]);
  const headlights = mergeGeometries([box(0.36, 0.12, 0.04, -0.5, 0.9, -1.9), box(0.36, 0.12, 0.04, 0.5, 0.9, -1.9)]);
  group.add(new THREE.Mesh(taillights, new THREE.MeshBasicMaterial({ color: 0xff2a3d })), new THREE.Mesh(headlights, new THREE.MeshBasicMaterial({ color: 0xfff4c2 })));

  group.add(new THREE.Mesh(wheels(0.31, 0.24, WHEEL_POSITIONS), new THREE.MeshLambertMaterial({ color: 0x0b0b0d })));
  const rims = new THREE.Mesh(wheels(0.2, 0.26, WHEEL_POSITIONS).translate(0, 0.11, 0), new THREE.MeshLambertMaterial({ color: PLAYER_RIM_COLOR }));
  rims.name = PLAYER_RIMS;
  group.add(rims);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.8), new THREE.MeshBasicMaterial({ map: createGlowTexture(), color: NEON_CYAN, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.04;
  group.add(glow);

  return group;
}
