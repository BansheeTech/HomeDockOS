// homedock-ui/vue3/static/js/__Games__/NeonRush/NeonRushEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { LANE_BOUNDARY_ORIGIN, LANE_SLOTS, LANE_WIDTH, SEGMENT_LENGTH, VISIBLE_SEGMENTS, laneMask, openLanes, roadCurvature, roadHeading, roadLeft, roadRight, roadX, roadY } from "./track";
import { NEON_CYAN, NEON_PINK, NIGHT, PLAYER_RIM_COLOR, PLAYER_RIMS, PLAYER_TAILLIGHT, TOFU_GLOW, TRAFFIC_COLORS, TRAFFIC_TAILLIGHT_Y, TRAFFIC_TAILLIGHTS, createGlowTexture, createGravelTexture, createTofuSignTexture, createTofuTexture, createMountains, createPalmGeometries, createPlayerCar, createRoadTexture, createSkyTexture, createSunTexture, createTrafficVehicleGeometries } from "./models";

export type NeonRushState = "ready" | "playing" | "paused" | "over";

export interface NeonRushHud {
  speed: number;
  distance: number;
  boost: number;
  health: number;
  boosting: boolean;
  offroad: boolean;
  brakes: number;
  braking: boolean;
  drifting: boolean;
}

export interface NeonRushPickup {
  x: number;
  y: number;
  icon: string | null;
}

export interface NeonRushCallbacks {
  onHud: (hud: NeonRushHud) => void;
  onGameOver: (distance: number) => void;
  onPickup: (pickup: NeonRushPickup) => void;
  onHit?: () => void;
  onRepair?: (active: boolean) => void;
  onTofu?: () => void;
}

interface BoostDrop {
  distance: number;
  lane: number;
  active: boolean;
  collected: number;
  mesh: THREE.Group;
  box: THREE.Mesh;
  fadeMaterial?: THREE.MeshBasicMaterial;
}

interface TrailSample {
  time: number;
  lights: [number, number, number][];
}

interface TrafficCar {
  distance: number;
  lane: number;
  x: number;
  speed: number;
  active: boolean;
  hit: boolean;
  model: number;
}

const BASE_SPEED = 42;
const MAX_SPEED = 100;
const SPEED_RAMP = 0.45;
const ACCELERATION = 1.8;
const RECOVERY_ACCELERATION = 1.3;
const INVULNERABLE_DURATION = 1.5;
const REPAINT_DURATION = 0.6;
const GHOST_BLINK_RATE = 75;
const GHOST_EDGE_ANGLE = 20;
const PAINT_REAR = 2.4;
const PAINT_NOSE = -2.4;
const PAINT_ALL = -10;
const PAINT_NONE = 10;
const BOOST_MULTIPLIER = 1.33;
const BOOST_DRAIN = 0.32;
const BOOST_START = 0.5;
const BOOST_ENGAGE = 4;
const BOOST_FADE_RELEASE = 1.2;
const BOOST_FADE_EMPTY = 10;
const DROP_REFILL = 0.35;
const DROP_COUNT = 4;
const DROP_SIZE = 2;
const ROUNDED_SEGMENTS = 3;
const ROUNDED_RATIO = 0.14;
const DROP_HEIGHT = 1.9;
const DROP_GAP_MIN = 220;
const DROP_GAP_MAX = 420;
const DROP_PICKUP_DEPTH = 2.6;
const DROP_PICKUP_WIDTH = 1.9;
const DROP_COLLECT_DURATION = 0.1;
const DROP_FALLBACK_ICON = "/images/docker-icons/homedock-os.jpg";
const STEER_SPEED = 17;
const STEER_SPEED_FAST = 21;
const STEER_ENGAGE = 10;
const STEER_RELEASE = 16;
const DRIFT_FACTOR = 0.011;
const DRIFT_LIMIT = 0.6;
const BRAKE_TARGET = 0.55;
const BRAKE_MIN_SPEED = 20;
const BRAKE_DECELERATION = 2.6;
const BRAKE_WEAR = 0.14;
const BRAKE_REPAIR = 0.35;
const BRAKE_EMPTY = 0.02;
const SKID_MIN_SPEED = 30;
const SKID_STEER_THRESHOLD = 0.3;
const SKID_ENGAGE = 6;
const SKID_RELEASE = 3;
const SKID_STEER = 1.8;
const SKID_SLIDE = 0.3;
const SKID_ANGLE = 0.45;
const SKID_CAMERA_ROLL = 0.05;
const BRAKE_HEAT_RISE = 0.5;
const BRAKE_HEAT_COOL = 0.45;
const BRAKE_HOT_COLOR = new THREE.Color(0xff3d0a);
const BRAKE_GLOW_COLOR = new THREE.Color(0xff2a00);
const RIM_COLOR = new THREE.Color(PLAYER_RIM_COLOR);
const NO_GLOW = new THREE.Color(0x000000);
const SPEED_FOV_BOOST = 20;
const MINIMAP_AHEAD = 600;
const MINIMAP_BEHIND = 90;
const MINIMAP_STEP = 12;
const MINIMAP_LATERAL_EXAGGERATION = 2.4;
const OFFROAD_MARGIN = 2.6;
const ROAD_EDGE_INSET = 0.9;
const GROUND_Y = -9;
const SHOULDER_WIDTH = 8.5;
const SHOULDER_EDGE_WIDTH = 0.35;
const ROAD_LINE_WIDTH = 0.3;
const POST_OFFSET = 0.6;
const PALM_OFFSET = 4;
const GRAVEL_TILE = 30;
const GRAVEL_ROW_VERTICES = 4;
const SHOULDER_BANDS = [
  { inner: -ROAD_LINE_WIDTH, outer: 0, drop: false, lift: 0.02, innerColor: NEON_PINK, outerColor: NEON_PINK },
  { inner: SHOULDER_WIDTH, outer: SHOULDER_WIDTH + SHOULDER_EDGE_WIDTH, drop: false, lift: 0, innerColor: NEON_CYAN, outerColor: NEON_CYAN },
  { inner: SHOULDER_WIDTH + SHOULDER_EDGE_WIDTH, outer: SHOULDER_WIDTH + SHOULDER_EDGE_WIDTH, drop: true, lift: 0, innerColor: 0x2d1259, outerColor: NIGHT },
];
const SHOULDER_ROW_VERTICES = SHOULDER_BANDS.length * 2 * 2;
const MAX_TRAFFIC = 18;
const TRAFFIC_MODEL_COUNT = 3;
const SAME_LANE_GAP = 28;
const WALL_GAP = 42;
const WALL_SPEED_SPLIT = 12;
const TRAFFIC_FOLLOW_GAP = 12;
const TRAFFIC_MIN_SPEED = 8;
const MERGE_LOOKAHEAD = 60;
const MERGE_RATE = 1.6;
const CRUISE_WOBBLE = 5 / 3.6;
const POST_SPACING = 36;
const POST_COUNT = Math.ceil((VISIBLE_SEGMENTS * SEGMENT_LENGTH) / POST_SPACING) + 1;
const TEXTURE_PERIOD = 16;
const HUD_INTERVAL = 0.1;
const MAX_PIXEL_RATIO = 2;
const HORIZONTAL_FOV = 88;
const CAR_LENGTH = 4;
const CAR_WIDTH = 1.9;
const TRAFFIC_MODEL_LENGTHS = [4, 4, 6];
const TRAFFIC_MODEL_WIDTHS = [CAR_WIDTH, 1.8, 2.15];
const TRAIL_SEGMENTS = 10;
const TRAIL_VERTICES = (TRAIL_SEGMENTS + 1) * 3;
const TRAIL_COUNT = (MAX_TRAFFIC + 1) * 2;
const TRAIL_HALF_WIDTH = 0.16;
const TRAIL_FADE = 1.6;
const TRAIL_FOG_NEAR = 90;
const TRAIL_FOG_FAR = 520;
const PLAYER_TRAIL_TIME = 0.16;
const PLAYER_TRAIL_IDLE_TIME = 0.09;
const TRAFFIC_TRAIL_TIME = 0.3;
const TRAIL_IDLE = 0.35;
const TRAIL_BOOST_HOLD = 3.5;
const TRAIL_GLOW_RISE = 4;
const TRAIL_GLOW_FALL = 1;
const PLAYER_TRAIL_COLOR = new THREE.Color(0xff2a3d);
const TRAFFIC_TRAIL_COLOR = new THREE.Color(0xff3355);
const PLAYER_TAILLIGHTS = [new THREE.Vector3(-PLAYER_TAILLIGHT.x, PLAYER_TAILLIGHT.y, PLAYER_TAILLIGHT.z), new THREE.Vector3(PLAYER_TAILLIGHT.x, PLAYER_TAILLIGHT.y, PLAYER_TAILLIGHT.z)];
const MAX_HEALTH = 100;
const COLLISION_DAMAGE = 25;
const OFFROAD_DAMAGE_RATE = 4;
const REPAIR_ZONE_START = 500;
const REPAIR_ZONE_INTERVAL = 650;
const REPAIR_ZONE_MIN_LENGTH = 80;
const REPAIR_ZONE_MAX_LENGTH = 120;
const REPAIR_ZONE_HEAL = 15;
const REPAIR_ZONE_COUNT = 2;
const REPAIR_STRIPES_PER_ZONE = 16;
const REPAIR_STRIPE_DEPTH = 1.2;
const REPAIR_STRIPE_WIDTH = LANE_WIDTH - 0.4;
const MAX_PALMS_PER_CLUSTER = 70;
const PALM_CLUSTER_INTERVAL = 400;
const PALM_CLUSTER_START_MAX = 105;
const PALM_MAX_TREE_SPACING = 4.2;
const PALM_CLUSTER_MAX_SPAN = (MAX_PALMS_PER_CLUSTER - 1) * PALM_MAX_TREE_SPACING;
const PALM_RENDER_CLUSTER_COUNT = Math.ceil((VISIBLE_SEGMENTS * SEGMENT_LENGTH + PALM_CLUSTER_MAX_SPAN + PALM_CLUSTER_START_MAX) / PALM_CLUSTER_INTERVAL) + 1;
const PALM_INSTANCE_CAPACITY = PALM_RENDER_CLUSTER_COUNT * MAX_PALMS_PER_CLUSTER;
const TOFU_GAP_MIN = 2000;
const TOFU_GAP_MAX = 3000;
const TOFU_WIDTH = 2.4;
const TOFU_TALL = 1.4;
const TOFU_DEPTH = 1.6;
const TOFU_HEIGHT = 1.9;
const TOFU_PICKUP_DEPTH = 2.8;
const TOFU_PICKUP_WIDTH = 2.2;
const TOFU_COLLECT_DURATION = 0.35;
const TOFU_ZONE_CLEARANCE = 40;
const TOFU_SIGN_LEAD = 200;
const TOFU_SIGN_OFFSET = 3;
const TOFU_SIGN_HEIGHT = 5;

function repairZoneLength(index: number) {
  const seed = Math.sin((index + 1) * 78.233) * 43758.5453;
  const random = seed - Math.floor(seed);
  return REPAIR_ZONE_MIN_LENGTH + random * (REPAIR_ZONE_MAX_LENGTH - REPAIR_ZONE_MIN_LENGTH);
}

function clearOfRepairZones(distance: number) {
  const index = Math.floor((distance - REPAIR_ZONE_START + TOFU_ZONE_CLEARANCE) / REPAIR_ZONE_INTERVAL);
  if (index < 0) return distance;
  const start = REPAIR_ZONE_START + index * REPAIR_ZONE_INTERVAL;
  const end = start + repairZoneLength(index);
  return distance > start - TOFU_ZONE_CLEARANCE && distance < end + TOFU_ZONE_CLEARANCE ? end + TOFU_ZONE_CLEARANCE : distance;
}

function roadEdge(side: number, distance: number, offset = 0) {
  return side < 0 ? roadLeft(distance) - offset : roadRight(distance) + offset;
}

function randomLane(distance: number) {
  const lanes = openLanes(distance);
  return lanes[Math.floor(Math.random() * lanes.length)];
}

function nextLane(lane: number, distance: number) {
  const lanes = openLanes(distance);
  return lanes[(lanes.indexOf(lane) + 1) % lanes.length];
}

function repairZoneLane(index: number) {
  const start = REPAIR_ZONE_START + index * REPAIR_ZONE_INTERVAL;
  const end = start + repairZoneLength(index);
  const lanes = openLanes(start).filter((slot) => openLanes(end).includes(slot));
  return LANE_SLOTS[lanes[index % lanes.length]];
}

function inwardLane(slot: number) {
  const middle = (LANE_SLOTS.length - 1) / 2;
  return slot > middle ? slot - 1 : slot < middle ? slot + 1 : slot;
}

function tofuGap() {
  return TOFU_GAP_MIN + Math.random() * (TOFU_GAP_MAX - TOFU_GAP_MIN);
}

function proceduralRandom(index: number, salt: number) {
  const seed = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return seed - Math.floor(seed);
}

function palmClusterCount(index: number) {
  const roll = proceduralRandom(index, 0);
  if (roll < 0.02) return 60 + Math.floor(proceduralRandom(index, 1) * 11);
  if (roll < 0.2) return 10 + Math.floor(proceduralRandom(index, 1) * 3);
  if (roll < 0.48) return 7 + Math.floor(proceduralRandom(index, 1) * 2);
  return 3 + Math.floor(proceduralRandom(index, 1) * 2);
}

function palmClusterStart(index: number) {
  return index * PALM_CLUSTER_INTERVAL + 35 + proceduralRandom(index, 2) * (PALM_CLUSTER_START_MAX - 35);
}

function palmClusterSpacing(index: number, count: number) {
  const variation = proceduralRandom(index, 3);
  if (count >= 60) return 3.6 + variation * (PALM_MAX_TREE_SPACING - 3.6);
  if (count >= 10) return 8 + variation * 4;
  if (count >= 7) return 10 + variation * 4;
  return 13 + variation * 5;
}

export class NeonRushEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1400);
  private clock = new THREE.Clock();
  private frame = 0;
  private disposables: { dispose: () => void }[] = [];

  private roadGeometry = new THREE.BufferGeometry();
  private roadPositions = new Float32Array((VISIBLE_SEGMENTS + 1) * 2 * 3);
  private roadUvs = new Float32Array((VISIBLE_SEGMENTS + 1) * 2 * 2);
  private shoulderGeometry = new THREE.BufferGeometry();
  private shoulderPositions = new Float32Array((VISIBLE_SEGMENTS + 1) * SHOULDER_ROW_VERTICES * 3);
  private gravelGeometry = new THREE.BufferGeometry();
  private gravelPositions = new Float32Array((VISIBLE_SEGMENTS + 1) * GRAVEL_ROW_VERTICES * 3);
  private gravelUvs = new Float32Array((VISIBLE_SEGMENTS + 1) * GRAVEL_ROW_VERTICES * 2);
  private player = createPlayerCar();
  private rimMaterial = (this.player.getObjectByName(PLAYER_RIMS) as THREE.Mesh<THREE.BufferGeometry, THREE.MeshLambertMaterial>).material;
  private brakeHeat = 0;
  private trafficBodies: THREE.InstancedMesh[];
  private trafficWheels: THREE.InstancedMesh[];
  private trafficLights: THREE.InstancedMesh[];
  private posts: THREE.InstancedMesh;
  private repairStripes: THREE.InstancedMesh;
  private palmTrunks: THREE.InstancedMesh;
  private palmBranches: THREE.InstancedMesh;
  private grid: THREE.GridHelper;
  private sky = new THREE.Group();
  private dummy = new THREE.Object3D();
  private center = new THREE.Vector3();
  private hiddenTrafficMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  private trailGeometry = new THREE.BufferGeometry();
  private trailPositions = new Float32Array(TRAIL_COUNT * TRAIL_VERTICES * 3);
  private trailColors = new Float32Array(TRAIL_COUNT * TRAIL_VERTICES * 3);
  private trailPoints = Array.from({ length: TRAIL_SEGMENTS + 1 }, () => new THREE.Vector3());
  private trailLight = new THREE.Vector3();
  private trailHistory: TrailSample[] = [];
  private trailClock = 0;
  private trailRecorded = -1;
  private trailGlow = 0;
  private trailHold = 0;

  private state: NeonRushState = "ready";
  private distance = 0;
  private speed = 24;
  private health = MAX_HEALTH;
  private elapsed = 0;
  private boost = 1;
  private playerX = 0;
  private steerVisual = 0;
  private steerRate = 0;
  private shake = 0;
  private portraitTilt = 0;
  private baseFov = 60;
  private minimap: CanvasRenderingContext2D | null = null;
  private minimapFrame = 0;
  private hudTimer = 0;
  private traffic: TrafficCar[] = [];
  private trafficAhead: TrafficCar[] = [];
  private boosting = false;
  private boostBlend = 0;
  private offroad = false;
  private repairing = false;
  private brakes = 1;
  private braking = false;
  private skidBlend = 0;
  private skidSide = 0;
  private recovering = false;
  private invulnerable = 0;
  private ghost = new THREE.Group();
  private ghostMaterial: THREE.LineBasicMaterial;
  private paintPlane = new THREE.Plane();
  private ghostPlane = new THREE.Plane();
  private planeNormal = new THREE.Vector3();
  private planePoint = new THREE.Vector3();

  private textureLoader = new THREE.TextureLoader();
  private dropGeometry = new RoundedBoxGeometry(DROP_SIZE, DROP_SIZE, DROP_SIZE, ROUNDED_SEGMENTS, DROP_SIZE * ROUNDED_RATIO);
  private dropMaterials: THREE.MeshBasicMaterial[] = [];
  private drops: BoostDrop[] = [];
  private nextDrop = 0;
  private dropTime = 0;

  private tofu: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  private tofuGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private tofuSign = new THREE.Group();
  private tofuDistance = 0;
  private tofuLane = 1;
  private tofuActive = false;
  private tofuCollected = 0;
  private nextTofu = 0;

  private keys = new Set<string>();
  private pointerSteer = 0;
  private pointerBoost = false;
  private pointerBrake = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private callbacks: NeonRushCallbacks,
  ) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: pixelRatio < 2, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const skyTexture = createSkyTexture();
    this.scene.background = skyTexture;
    this.scene.fog = new THREE.Fog(NIGHT, 90, 520);
    this.scene.add(new THREE.HemisphereLight(0xb794f4, 0x1a0b2e, 1.6));
    const sun = new THREE.DirectionalLight(0xffb3e6, 1.2);
    sun.position.set(0, 40, -60);
    this.scene.add(sun);

    const roadTexture = createRoadTexture(this.renderer.capabilities.getMaxAnisotropy());
    this.roadGeometry.setAttribute("position", new THREE.BufferAttribute(this.roadPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.roadGeometry.setAttribute("uv", new THREE.BufferAttribute(this.roadUvs, 2).setUsage(THREE.DynamicDrawUsage));
    const indices: number[] = [];
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    this.roadGeometry.setIndex(indices);
    const road = new THREE.Mesh(this.roadGeometry, new THREE.MeshBasicMaterial({ map: roadTexture }));
    road.frustumCulled = false;
    this.scene.add(road);

    const shoulderColors: number[] = [];
    const shoulderIndices: number[] = [];
    const shoulderColor = new THREE.Color();
    for (let i = 0; i <= VISIBLE_SEGMENTS; i++) {
      for (let side = 0; side < 2; side++) {
        for (const band of SHOULDER_BANDS) {
          for (const hex of [band.innerColor, band.outerColor]) {
            shoulderColor.setHex(hex);
            shoulderColors.push(shoulderColor.r, shoulderColor.g, shoulderColor.b);
          }
        }
      }
      if (i === VISIBLE_SEGMENTS) continue;
      for (let pair = 0; pair < SHOULDER_ROW_VERTICES; pair += 2) {
        const a = i * SHOULDER_ROW_VERTICES + pair;
        const b = a + SHOULDER_ROW_VERTICES;
        shoulderIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    this.shoulderGeometry.setAttribute("position", new THREE.BufferAttribute(this.shoulderPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.shoulderGeometry.setAttribute("color", new THREE.Float32BufferAttribute(shoulderColors, 3));
    this.shoulderGeometry.setIndex(shoulderIndices);
    const shoulders = new THREE.Mesh(this.shoulderGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    shoulders.frustumCulled = false;
    this.scene.add(shoulders);

    const gravelIndices: number[] = [];
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      for (const pair of [0, 2]) {
        const a = i * GRAVEL_ROW_VERTICES + pair;
        const b = a + GRAVEL_ROW_VERTICES;
        gravelIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const gravelTexture = createGravelTexture(this.renderer.capabilities.getMaxAnisotropy());
    this.gravelGeometry.setAttribute("position", new THREE.BufferAttribute(this.gravelPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.gravelGeometry.setAttribute("uv", new THREE.BufferAttribute(this.gravelUvs, 2).setUsage(THREE.DynamicDrawUsage));
    this.gravelGeometry.setIndex(gravelIndices);
    const gravel = new THREE.Mesh(this.gravelGeometry, new THREE.MeshBasicMaterial({ map: gravelTexture, side: THREE.DoubleSide }));
    gravel.frustumCulled = false;
    this.scene.add(gravel);

    this.grid = new THREE.GridHelper(3000, 120, NEON_PINK, 0x6b21a8);
    (this.grid.material as THREE.Material).transparent = true;
    (this.grid.material as THREE.Material).opacity = 0.5;
    this.grid.position.y = GROUND_Y;
    this.scene.add(this.grid);

    const sunMesh = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ map: createSunTexture(), transparent: true, fog: false, depthWrite: false }));
    sunMesh.position.set(0, 120, -1150);
    const mountains = createMountains();
    mountains.position.set(0, -10, -1000);
    this.sky.add(sunMesh, mountains);
    this.scene.add(this.sky);

    const trafficModels = createTrafficVehicleGeometries();
    this.trafficBodies = trafficModels.map((model) => new THREE.InstancedMesh(model.body, new THREE.MeshLambertMaterial(), MAX_TRAFFIC));
    this.trafficWheels = trafficModels.map((model) => new THREE.InstancedMesh(model.wheels, new THREE.MeshLambertMaterial({ color: 0x171721 }), MAX_TRAFFIC));
    this.trafficLights = trafficModels.map((model) => new THREE.InstancedMesh(model.taillights, new THREE.MeshBasicMaterial({ color: 0xff3355 }), MAX_TRAFFIC));
    const color = new THREE.Color();
    for (let model = 0; model < TRAFFIC_MODEL_COUNT; model++) {
      for (let i = 0; i < MAX_TRAFFIC; i++) this.trafficBodies[model].setColorAt(i, color.setHex(TRAFFIC_COLORS[(i + model * 2) % TRAFFIC_COLORS.length]));
      this.trafficBodies[model].frustumCulled = false;
      this.trafficWheels[model].frustumCulled = false;
      this.trafficLights[model].frustumCulled = false;
    }
    this.scene.add(...this.trafficBodies, ...this.trafficWheels, ...this.trafficLights);

    const trailIndices: number[] = [];
    for (let trail = 0; trail < TRAIL_COUNT; trail++) {
      for (let k = 0; k < TRAIL_SEGMENTS; k++) {
        for (let j = 0; j < 2; j++) {
          const a = trail * TRAIL_VERTICES + k * 3 + j;
          const b = a + 3;
          trailIndices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    this.trailGeometry.setAttribute("position", new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setAttribute("color", new THREE.BufferAttribute(this.trailColors, 3).setUsage(THREE.DynamicDrawUsage));
    this.trailGeometry.setIndex(trailIndices);
    const trails = new THREE.Mesh(this.trailGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    trails.frustumCulled = false;
    this.scene.add(trails);

    this.posts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.25, 1.6, 0.25), new THREE.MeshBasicMaterial({ color: NEON_PINK }), POST_COUNT * 2);
    this.posts.frustumCulled = false;
    this.scene.add(this.posts);

    this.repairStripes = new THREE.InstancedMesh(new THREE.BoxGeometry(REPAIR_STRIPE_WIDTH, 0.06, REPAIR_STRIPE_DEPTH), new THREE.MeshBasicMaterial({ color: 0x69ff91, transparent: true, opacity: 0.82, depthWrite: false }), REPAIR_ZONE_COUNT * REPAIR_STRIPES_PER_ZONE);
    this.repairStripes.frustumCulled = false;
    this.scene.add(this.repairStripes);

    const palmGeometries = createPalmGeometries();
    this.palmTrunks = new THREE.InstancedMesh(palmGeometries.trunk, new THREE.MeshBasicMaterial({ color: NEON_PINK }), PALM_INSTANCE_CAPACITY);
    this.palmBranches = new THREE.InstancedMesh(palmGeometries.branches, new THREE.MeshBasicMaterial({ color: NEON_CYAN, side: THREE.DoubleSide }), PALM_INSTANCE_CAPACITY);
    this.palmTrunks.frustumCulled = false;
    this.palmBranches.frustumCulled = false;
    this.scene.add(this.palmTrunks, this.palmBranches);

    this.scene.add(this.player);
    this.renderer.localClippingEnabled = true;
    this.ghostMaterial = new THREE.LineBasicMaterial({ color: NEON_CYAN, clippingPlanes: [this.ghostPlane] });
    this.player.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material as THREE.Material;
      if (material.blending === THREE.AdditiveBlending) return;
      material.clippingPlanes = [this.paintPlane];
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, GHOST_EDGE_ANGLE), this.ghostMaterial);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      edges.scale.copy(mesh.scale);
      this.ghost.add(edges);
    });
    this.ghost.visible = false;
    this.player.add(this.ghost);

    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(DROP_SIZE, DROP_SIZE, DROP_SIZE));
    const edgeMaterial = new THREE.LineBasicMaterial({ color: NEON_CYAN });
    for (let i = 0; i < DROP_COUNT; i++) {
      const box = new THREE.Mesh(this.dropGeometry);
      box.add(new THREE.LineSegments(edges, edgeMaterial));
      const mesh = new THREE.Group();
      mesh.add(box);
      mesh.visible = false;
      this.scene.add(mesh);
      this.drops.push({ distance: 0, lane: 0, active: false, collected: 0, mesh, box });
    }
    this.setDropIcons([]);

    const tofuGeometry = new RoundedBoxGeometry(TOFU_WIDTH, TOFU_TALL, TOFU_DEPTH, ROUNDED_SEGMENTS, TOFU_TALL * ROUNDED_RATIO);
    this.tofu = new THREE.Mesh(tofuGeometry, new THREE.MeshBasicMaterial({ map: createTofuTexture(), transparent: true }));
    this.tofu.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(TOFU_WIDTH, TOFU_TALL, TOFU_DEPTH)), new THREE.LineBasicMaterial({ color: TOFU_GLOW })));
    this.tofu.visible = false;
    this.tofuGlow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.MeshBasicMaterial({ map: createGlowTexture(), color: TOFU_GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.tofuGlow.rotation.x = -Math.PI / 2;
    this.tofuGlow.visible = false;

    const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.3, TOFU_SIGN_HEIGHT, 0.3), new THREE.MeshBasicMaterial({ color: NEON_PINK }));
    signPost.position.y = TOFU_SIGN_HEIGHT / 2;
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: createTofuSignTexture(), side: THREE.DoubleSide }));
    signBoard.position.y = TOFU_SIGN_HEIGHT + 1.2;
    this.tofuSign.add(signPost, signBoard);
    this.tofuSign.visible = false;
    this.scene.add(this.tofu, this.tofuGlow, this.tofuSign);

    this.disposables.push(skyTexture, roadTexture, this.roadGeometry, this.shoulderGeometry, this.gravelGeometry, this.trailGeometry, this.dropGeometry, edges);
    this.resetTraffic();
    this.resetDrops();
    this.resetTofu();
    this.updateWorld();
  }

  setDropIcons(urls: string[]) {
    for (const material of this.dropMaterials) {
      material.map?.dispose();
      material.dispose();
    }

    this.dropMaterials = (urls.length ? urls : [DROP_FALLBACK_ICON]).map((url) => {
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const apply = (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
      };
      this.textureLoader.load(url, apply, undefined, () => {
        if (url !== DROP_FALLBACK_ICON) this.textureLoader.load(DROP_FALLBACK_ICON, apply);
      });
      return material;
    });

    for (const drop of this.drops) this.assignRandomDropMaterial(drop);
  }

  private randomDropMaterial() {
    return this.dropMaterials[Math.floor(Math.random() * this.dropMaterials.length)];
  }

  private assignRandomDropMaterial(drop: BoostDrop) {
    if (drop.fadeMaterial) {
      drop.fadeMaterial.map = null;
      drop.fadeMaterial.dispose();
      drop.fadeMaterial = undefined;
    }
    drop.box.material = this.randomDropMaterial();
  }

  private resetDrops() {
    for (const drop of this.drops) {
      drop.active = false;
      drop.collected = 0;
      drop.mesh.visible = false;
      drop.mesh.scale.setScalar(1);
      if (drop.fadeMaterial) this.assignRandomDropMaterial(drop);
    }
    this.nextDrop = this.distance + 150;
  }

  private resetTofu() {
    this.tofuActive = false;
    this.tofuCollected = 0;
    this.nextTofu = clearOfRepairZones(this.distance + tofuGap());
  }

  private advanceTofu(dt: number, collect: boolean) {
    if (this.tofuActive) {
      if (this.tofuCollected > 0) {
        this.tofuCollected += dt;
        if (this.tofuCollected >= TOFU_COLLECT_DURATION) this.tofuActive = false;
      } else if (this.tofuDistance < this.distance - 10) {
        this.tofuActive = false;
      } else if (collect && Math.abs(this.tofuDistance - this.distance) < TOFU_PICKUP_DEPTH && Math.abs(LANE_SLOTS[this.tofuLane] - this.playerX) < TOFU_PICKUP_WIDTH) {
        this.tofuCollected = 0.0001;
        this.health = MAX_HEALTH;
        this.brakes = 1;
        this.emitHud();
        this.callbacks.onTofu?.();
      }
      return;
    }

    if (this.nextTofu > this.distance + VISIBLE_SEGMENTS * SEGMENT_LENGTH * 0.8) return;
    let lane = randomLane(this.nextTofu);
    if (this.traffic.some((car) => car.active && car.lane === lane && Math.abs(car.distance - this.nextTofu) < 18)) lane = nextLane(lane, this.nextTofu);
    this.tofuDistance = this.nextTofu;
    this.tofuLane = lane;
    this.tofuActive = true;
    this.tofuCollected = 0;
    this.nextTofu = clearOfRepairZones(this.nextTofu + tofuGap());
  }

  private advanceDrops(dt: number, collect: boolean) {
    const horizon = VISIBLE_SEGMENTS * SEGMENT_LENGTH;

    for (const drop of this.drops) {
      if (!drop.active) continue;

      if (drop.collected > 0) {
        drop.collected += dt;
        if (drop.collected >= DROP_COLLECT_DURATION) drop.active = false;
        continue;
      }

      if (drop.distance < this.distance - 10) {
        drop.active = false;
        continue;
      }

      if (collect && Math.abs(drop.distance - this.distance) < DROP_PICKUP_DEPTH && Math.abs(LANE_SLOTS[drop.lane] - this.playerX) < DROP_PICKUP_WIDTH) {
        drop.collected = 0.0001;
        this.boost = Math.min(1, this.boost + DROP_REFILL);
        const material = drop.box.material as THREE.MeshBasicMaterial;
        drop.fadeMaterial = material.clone();
        drop.fadeMaterial.transparent = true;
        drop.fadeMaterial.depthWrite = false;
        drop.box.material = drop.fadeMaterial;
        const projected = drop.mesh.position.clone().project(this.camera);
        const textureImage = material.map?.image as { src?: string } | undefined;
        this.callbacks.onPickup({
          x: ((projected.x + 1) / 2) * this.canvas.clientWidth,
          y: ((1 - projected.y) / 2) * this.canvas.clientHeight,
          icon: textureImage?.src ?? null,
        });
      }
    }

    while (this.nextDrop < this.distance + horizon * 0.8) {
      const drop = this.drops.find((candidate) => !candidate.active);
      if (!drop) break;

      let lane = randomLane(this.nextDrop);
      if (this.traffic.some((car) => car.active && car.lane === lane && Math.abs(car.distance - this.nextDrop) < 18)) lane = nextLane(lane, this.nextDrop);

      drop.distance = this.nextDrop;
      drop.lane = lane;
      drop.active = true;
      drop.collected = 0;
      this.assignRandomDropMaterial(drop);
      this.nextDrop += DROP_GAP_MIN + Math.random() * (DROP_GAP_MAX - DROP_GAP_MIN);
    }
  }

  getState() {
    return this.state;
  }

  start() {
    this.setRepairing(false);
    this.distance = 0;
    this.speed = 18;
    this.health = MAX_HEALTH;
    this.elapsed = 0;
    this.boost = BOOST_START;
    this.boostBlend = 0;
    this.brakes = 1;
    this.braking = false;
    this.skidBlend = 0;
    this.skidSide = 0;
    this.recovering = false;
    this.invulnerable = 0;
    this.playerX = 0;
    this.steerRate = 0;
    this.trailHistory.length = 0;
    this.trailGlow = 0;
    this.trailHold = 0;
    this.shake = 0;
    this.resetTraffic();
    this.resetDrops();
    this.resetTofu();
    this.state = "playing";
    this.clock.getDelta();
    this.emitHud();
  }

  pause() {
    if (this.state !== "playing") return;
    this.setRepairing(false);
    this.state = "paused";
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.clock.getDelta();
  }

  setKey(code: string, pressed: boolean) {
    if (pressed) this.keys.add(code);
    else this.keys.delete(code);
  }

  clearInput() {
    this.keys.clear();
    this.pointerSteer = 0;
    this.pointerBoost = false;
    this.pointerBrake = false;
  }

  setPointerSteer(value: number) {
    this.pointerSteer = Math.max(-1, Math.min(1, value));
  }

  setPointerBoost(active: boolean) {
    this.pointerBoost = active;
  }

  setPointerBrake(active: boolean) {
    this.pointerBrake = active;
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.aspect = aspect;
    this.portraitTilt = aspect < 1 ? Math.min(1, 1 - aspect) : 0;
    const verticalFov = (2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(HORIZONTAL_FOV) / 2) / aspect) * 180) / Math.PI;
    this.baseFov = Math.max(48, Math.min(84, verticalFov));
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
  }

  run() {
    if (this.frame) return;
    this.clock.getDelta();
    const loop = () => {
      this.frame = requestAnimationFrame(loop);
      this.tick(Math.min(this.clock.getDelta(), 0.05));
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  dispose() {
    this.stop();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) {
        (material as THREE.MeshBasicMaterial).map?.dispose();
        material.dispose();
      }
    });
    for (const item of this.disposables) item.dispose();
    for (const material of this.dropMaterials) {
      material.map?.dispose();
      material.dispose();
    }
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private readInput() {
    let steer = this.pointerSteer;
    if (this.keys.has("ArrowLeft") || this.keys.has("KeyA")) steer -= 1;
    if (this.keys.has("ArrowRight") || this.keys.has("KeyD")) steer += 1;
    let boosting = this.pointerBoost || this.keys.has("Space") || this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") || this.keys.has("ArrowUp") || this.keys.has("KeyW");
    let braking = this.pointerBrake || this.keys.has("ArrowDown") || this.keys.has("KeyS");

    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad) continue;
      const axis = pad.axes[0] ?? 0;
      if (Math.abs(axis) > 0.15) steer += axis;
      if (pad.buttons[14]?.pressed) steer -= 1;
      if (pad.buttons[15]?.pressed) steer += 1;
      if (pad.buttons[0]?.pressed || pad.buttons[7]?.pressed) boosting = true;
      if (pad.buttons[1]?.pressed || pad.buttons[6]?.pressed) braking = true;
    }

    return { steer: Math.max(-1, Math.min(1, steer)), boosting, braking };
  }

  private tick(dt: number) {
    this.dropTime += dt;
    if (this.state !== "paused") this.heatBrakes(dt);
    if (this.state === "playing") this.simulate(dt);
    else if (this.state === "ready") this.attract(dt);
    else if (this.state === "over") this.shake = Math.max(0, this.shake - dt * 1.5);

    this.updateWorld();
    this.renderer.render(this.scene, this.camera);
  }

  private heatBrakes(dt: number) {
    const heat = this.braking ? Math.min(1, this.brakeHeat + dt * BRAKE_HEAT_RISE) : Math.max(0, this.brakeHeat - dt * BRAKE_HEAT_COOL);
    if (heat === this.brakeHeat) return;
    this.brakeHeat = heat;
    this.rimMaterial.color.lerpColors(RIM_COLOR, BRAKE_HOT_COLOR, heat);
    this.rimMaterial.emissive.lerpColors(NO_GLOW, BRAKE_GLOW_COLOR, heat * heat);
  }

  private attract(dt: number) {
    this.speed = 24;
    this.trailClock += dt;
    this.distance += this.speed * dt;
    this.playerX += (Math.sin(this.distance * 0.004) * 2.2 - this.playerX) * dt * 1.5;
    this.advanceTraffic(dt, false);
    this.advanceDrops(dt, false);
    this.advanceTofu(dt, false);
  }

  private simulate(dt: number) {
    this.elapsed += dt;
    this.trailClock += dt;
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    const previousDistance = this.distance;
    const { steer, boosting, braking } = this.readInput();

    let target = Math.min(MAX_SPEED, BASE_SPEED + this.elapsed * SPEED_RAMP);
    this.braking = braking && this.brakes > BRAKE_EMPTY;
    if (this.braking) this.brakes = Math.max(0, this.brakes - BRAKE_WEAR * dt);
    this.boosting = boosting && !this.braking && this.boost > 0.02;
    if (this.boosting) {
      this.boostBlend = Math.min(1, this.boostBlend + dt * BOOST_ENGAGE);
      this.boost = Math.max(0, this.boost - BOOST_DRAIN * dt);
    } else {
      const fade = this.boost > 0.02 ? BOOST_FADE_RELEASE : BOOST_FADE_EMPTY;
      this.boostBlend = Math.max(0, this.boostBlend - dt / fade);
    }
    this.trailHold = this.boosting ? TRAIL_BOOST_HOLD : Math.max(0, this.trailHold - dt);
    this.trailGlow = this.trailHold > 0 ? Math.min(1, this.trailGlow + dt * TRAIL_GLOW_RISE) : Math.max(0, this.trailGlow - dt * TRAIL_GLOW_FALL);
    target *= 1 + (BOOST_MULTIPLIER - 1) * this.boostBlend;
    if (this.braking) target = Math.max(BRAKE_MIN_SPEED, target * BRAKE_TARGET);
    else if (!this.boosting && this.boostBlend === 0 && BASE_SPEED + this.elapsed * SPEED_RAMP >= MAX_SPEED) {
      target += CRUISE_WOBBLE * (0.6 * Math.sin(this.elapsed * 0.45) + 0.4 * Math.sin(this.elapsed * 1.3 + 1.7));
    }

    const offroad = !this.onRoad();
    this.offroad = offroad;
    if (offroad) {
      this.damage(OFFROAD_DAMAGE_RATE * dt, false);
      if (this.state !== "playing") return;
      target *= 0.55;
      this.shake = Math.min(0.35, this.shake + dt * 2);
    } else {
      this.shake = Math.max(0, this.shake - dt * 2);
    }

    if (this.braking) this.recovering = true;
    else if (this.speed >= target - 0.5) this.recovering = false;
    const acceleration = this.recovering && !this.boosting ? RECOVERY_ACCELERATION : ACCELERATION;
    const response = target > this.speed ? acceleration : this.braking ? BRAKE_DECELERATION : 2.2;
    this.speed += (target - this.speed) * Math.min(1, dt * response);

    const skidding = this.braking && this.speed > SKID_MIN_SPEED && Math.abs(steer) > SKID_STEER_THRESHOLD;
    if (skidding) {
      this.skidSide = Math.sign(steer);
      this.skidBlend = Math.min(1, this.skidBlend + dt * SKID_ENGAGE);
    } else {
      this.skidBlend = Math.max(0, this.skidBlend - dt * SKID_RELEASE);
    }

    const pace = Math.min(1, Math.max(0, (this.speed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)));
    const authority = (STEER_SPEED + (STEER_SPEED_FAST - STEER_SPEED) * pace) * (1 + (SKID_STEER - 1) * this.skidBlend) * Math.min(1, this.speed / 30);
    const targetRate = steer * authority;
    const engaging = targetRate * this.steerRate >= 0 && Math.abs(targetRate) > Math.abs(this.steerRate);
    this.steerRate += (targetRate - this.steerRate) * Math.min(1, dt * (engaging ? STEER_ENGAGE : STEER_RELEASE));
    const drift = roadCurvature(this.distance) * this.speed * this.speed * DRIFT_FACTOR * (1 + SKID_SLIDE * this.skidBlend);
    const driftLimit = authority * DRIFT_LIMIT;
    this.playerX += this.steerRate * dt;
    this.playerX -= Math.max(-driftLimit, Math.min(driftLimit, drift)) * dt;
    this.playerX = Math.max(roadLeft(this.distance) - OFFROAD_MARGIN, Math.min(roadRight(this.distance) + OFFROAD_MARGIN, this.playerX));
    this.steerVisual += (steer - this.steerVisual) * Math.min(1, dt * 8);
    this.distance += this.speed * dt;
    this.advanceRepair(previousDistance);

    this.advanceTraffic(dt, true);
    if (this.state === "playing") this.advanceDrops(dt, true);
    if (this.state === "playing") this.advanceTofu(dt, true);

    this.hudTimer += dt;
    if (this.hudTimer >= HUD_INTERVAL) {
      this.hudTimer = 0;
      this.emitHud();
    }
  }

  private emitHud() {
    this.callbacks.onHud({ speed: this.speed, distance: this.distance, boost: this.boost, health: this.health, boosting: this.state === "playing" && this.boosting, offroad: this.state === "playing" && this.offroad, brakes: this.brakes, braking: this.state === "playing" && this.braking, drifting: this.state === "playing" && this.skidBlend > 0.5 });
  }

  private resetTraffic() {
    this.traffic = [];
    for (let i = 0; i < MAX_TRAFFIC; i++) this.traffic.push({ distance: 0, lane: 0, x: 0, speed: 0, active: false, hit: false, model: 0 });
    for (let i = 0; i < 6; i++) this.spawn(this.traffic[i], this.distance + 90 + i * 55);
  }

  private spawn(car: TrafficCar, minimum: number) {
    let distance = minimum + Math.random() * 60;
    let lane = randomLane(distance);

    search: for (let attempt = 0; attempt < 6; attempt++) {
      const lanes = openLanes(distance);
      const first = Math.floor(Math.random() * lanes.length);
      for (let offset = 0; offset < lanes.length; offset++) {
        const candidate = lanes[(first + offset) % lanes.length];
        if (this.laneFree(car, candidate, distance)) {
          lane = candidate;
          break search;
        }
      }
      distance += WALL_GAP;
    }

    car.distance = distance;
    car.lane = lane;
    car.x = LANE_SLOTS[lane];
    car.speed = 16 + Math.random() * 10;
    car.active = true;
    car.hit = false;
    const modelRoll = Math.random();
    car.model = modelRoll < 0.45 ? 0 : modelRoll < 0.75 ? 1 : 2;
  }

  private laneFree(car: TrafficCar, lane: number, distance: number) {
    let lanes = 1 << lane;
    for (const other of this.traffic) {
      if (!other.active || other === car) continue;
      const gap = Math.abs(other.distance - distance);
      if (other.lane === lane && gap < SAME_LANE_GAP) return false;
      if (gap < WALL_GAP) lanes |= 1 << other.lane;
    }
    const open = laneMask(distance);
    return (lanes & open) !== open;
  }

  private separateTraffic() {
    const ahead = this.trafficAhead;
    ahead.length = 0;
    for (const car of this.traffic) if (car.active && car.distance > this.distance) ahead.push(car);
    ahead.sort((a, b) => a.distance - b.distance);

    for (let i = 0; i < ahead.length; i++) {
      const car = ahead[i];
      for (let j = i + 1; j < ahead.length; j++) {
        const next = ahead[j];
        if (next.lane !== car.lane) continue;
        if (next.distance - car.distance < TRAFFIC_FOLLOW_GAP) car.speed = Math.min(car.speed, next.speed);
        break;
      }
    }

    for (let i = 0; i < ahead.length; i++) {
      let lanes = 1 << ahead[i].lane;
      const open = laneMask(ahead[i].distance);
      for (let j = i + 1; j < ahead.length && ahead[j].distance - ahead[i].distance < WALL_GAP; j++) {
        lanes |= 1 << ahead[j].lane;
        if ((lanes & open) !== open) continue;
        this.breakWall(ahead, i, j);
        break;
      }
    }
  }

  private breakWall(ahead: TrafficCar[], rear: number, front: number) {
    let slowest = Infinity;
    let fastest = 0;
    for (let k = rear + 1; k < front; k++) {
      slowest = Math.min(slowest, ahead[k].speed);
      fastest = Math.max(fastest, ahead[k].speed);
    }
    ahead[rear].speed = Math.max(TRAFFIC_MIN_SPEED, Math.min(ahead[rear].speed, slowest - WALL_SPEED_SPLIT));
    ahead[front].speed = Math.max(ahead[front].speed, fastest + WALL_SPEED_SPLIT);
  }

  private advanceTraffic(dt: number, collide: boolean) {
    const wanted = Math.min(MAX_TRAFFIC, 6 + Math.floor(this.distance / 700));
    const horizon = VISIBLE_SEGMENTS * SEGMENT_LENGTH;
    let active = 0;

    for (const car of this.traffic) {
      if (!car.active) continue;
      car.distance += car.speed * dt;
      if (car.distance < this.distance - 15 || car.distance > this.distance + horizon + 200) {
        car.active = false;
        continue;
      }
      active += 1;
      while (!openLanes(car.distance + MERGE_LOOKAHEAD).includes(car.lane) && inwardLane(car.lane) !== car.lane) car.lane = inwardLane(car.lane);
      car.x += (LANE_SLOTS[car.lane] - car.x) * Math.min(1, dt * MERGE_RATE);

      const collisionLength = (CAR_LENGTH + TRAFFIC_MODEL_LENGTHS[car.model]) / 2;
      const collisionWidth = (CAR_WIDTH + TRAFFIC_MODEL_WIDTHS[car.model]) / 2;
      const overlapping = Math.abs(car.distance - this.distance) < collisionLength && Math.abs(car.x - this.playerX) < collisionWidth;
      if (!overlapping) car.hit = false;
      if (collide && overlapping && !car.hit) {
        car.hit = true;
        if (this.invulnerable > 0) continue;
        this.callbacks.onHit?.();
        this.damage(COLLISION_DAMAGE);
        this.speed *= 0.55;
        this.recovering = true;
        this.shake = Math.max(this.shake, 0.75);
        if (this.state !== "playing") return;
        this.invulnerable = INVULNERABLE_DURATION + REPAINT_DURATION;
      }
    }

    this.separateTraffic();

    for (const car of this.traffic) {
      if (active >= wanted) break;
      if (car.active) continue;
      this.spawn(car, this.distance + horizon * 0.55);
      active += 1;
    }
  }

  private damage(amount: number, notifyHud = true) {
    if (this.state !== "playing") return;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.finishGame();
      return;
    }
    if (notifyHud) this.emitHud();
  }

  private finishGame() {
    this.setRepairing(false);
    this.state = "over";
    this.shake = 1;
    this.speed = 0;
    this.trailHistory.length = 0;
    this.braking = false;
    this.skidBlend = 0;
    this.invulnerable = 0;
    this.emitHud();
    this.callbacks.onGameOver(this.distance);
  }

  private onRoad() {
    return this.playerX >= roadLeft(this.distance) + ROAD_EDGE_INSET && this.playerX <= roadRight(this.distance) - ROAD_EDGE_INSET;
  }

  private advanceRepair(previousDistance: number) {
    let repairing = false;
    if (this.onRoad() && (this.health < MAX_HEALTH || this.brakes < 1)) {
      const firstZone = Math.max(0, Math.floor((previousDistance - REPAIR_ZONE_START) / REPAIR_ZONE_INTERVAL));
      for (let index = firstZone; ; index++) {
        const start = REPAIR_ZONE_START + index * REPAIR_ZONE_INTERVAL;
        if (start >= this.distance) break;
        const length = repairZoneLength(index);
        const end = start + length;
        const coveredDistance = Math.max(0, Math.min(this.distance, end) - Math.max(previousDistance, start));
        const lane = repairZoneLane(index);
        const inRepairLane = Math.abs(lane - this.playerX) <= LANE_WIDTH / 2 - CAR_WIDTH / 2;
        if (coveredDistance <= 0 || !inRepairLane) continue;

        const previousHealth = this.health;
        const previousBrakes = this.brakes;
        this.health = Math.min(MAX_HEALTH, this.health + (coveredDistance / length) * REPAIR_ZONE_HEAL);
        this.brakes = Math.min(1, this.brakes + (coveredDistance / length) * BRAKE_REPAIR);
        if (this.health > previousHealth || this.brakes > previousBrakes) repairing = true;
      }
    }
    this.setRepairing(repairing);
  }

  private setRepairing(active: boolean) {
    if (this.repairing === active) return;
    this.repairing = active;
    this.callbacks.onRepair?.(active);
  }

  private updateGhost() {
    const remaining = this.invulnerable;
    const repaint = remaining > 0 && remaining <= REPAINT_DURATION ? 1 - remaining / REPAINT_DURATION : 0;
    const cut = remaining <= 0 ? PAINT_ALL : remaining > REPAINT_DURATION ? PAINT_NONE : THREE.MathUtils.lerp(PAINT_REAR, PAINT_NOSE, repaint);
    this.ghost.visible = remaining > 0 && Math.sin(this.dropTime * GHOST_BLINK_RATE) > 0;

    this.player.updateMatrixWorld();
    this.planeNormal.set(0, 0, 1).applyQuaternion(this.player.quaternion);
    this.planePoint.set(0, 0, cut);
    this.player.localToWorld(this.planePoint);
    this.paintPlane.setFromNormalAndCoplanarPoint(this.planeNormal, this.planePoint);
    this.ghostPlane.copy(this.paintPlane).negate();
  }

  private updateTrails() {
    if (this.trailRecorded !== this.trailClock) {
      this.trailRecorded = this.trailClock;
      this.recordPlayerTrail();
    }

    const history = this.trailHistory;
    const trailTime = PLAYER_TRAIL_IDLE_TIME + (PLAYER_TRAIL_TIME - PLAYER_TRAIL_IDLE_TIME) * this.trailGlow;
    const trailIntensity = TRAIL_IDLE + (1 - TRAIL_IDLE) * this.trailGlow;
    PLAYER_TAILLIGHTS.forEach((_, light) => {
      for (let k = 0; k <= TRAIL_SEGMENTS; k++) {
        const time = this.trailClock - (trailTime * k) / TRAIL_SEGMENTS;
        let index = history.length - 1;
        while (index > 0 && history[index].time > time) index -= 1;
        const from = history[index]?.lights[light];
        const to = history[index + 1]?.lights[light] ?? from;
        const point = this.trailPoints[k];
        if (!from) {
          point.set(0, -100, 0);
          continue;
        }
        const span = history[index + 1] ? history[index + 1].time - history[index].time : 0;
        const mix = span > 0 ? Math.min(1, Math.max(0, (time - history[index].time) / span)) : 0;
        this.project(from[0] + (to[0] - from[0]) * mix, from[1] + (to[1] - from[1]) * mix, point).y += from[2] + (to[2] - from[2]) * mix;
      }
      this.writeTrail(MAX_TRAFFIC * 2 + light, PLAYER_TRAIL_COLOR, history.length > 1 ? trailIntensity : 0);
    });

    this.traffic.forEach((car, index) => {
      const light = TRAFFIC_TAILLIGHTS[car.model];
      for (let side = 0; side < 2; side++) {
        const lateral = car.x + (side ? light.x : -light.x);
        for (let k = 0; k <= TRAIL_SEGMENTS; k++) {
          const point = this.trailPoints[k];
          if (!car.active) point.set(0, -100, 0);
          else this.project(car.distance - light.z - (car.speed * TRAFFIC_TRAIL_TIME * k) / TRAIL_SEGMENTS, lateral, point).y += TRAFFIC_TAILLIGHT_Y;
        }
        this.writeTrail(index * 2 + side, TRAFFIC_TRAIL_COLOR, car.active ? TRAIL_IDLE : 0);
      }
    });

    this.trailGeometry.attributes.position.needsUpdate = true;
    this.trailGeometry.attributes.color.needsUpdate = true;
  }

  private recordPlayerTrail() {
    const lights = PLAYER_TAILLIGHTS.map((local): [number, number, number] => {
      const world = this.player.localToWorld(this.trailLight.copy(local));
      const along = this.distance - world.z;
      return [along, world.x - (roadX(along) - roadX(this.distance)), world.y - (roadY(along) - roadY(this.distance))];
    });
    this.trailHistory.push({ time: this.trailClock, lights });
    while (this.trailHistory.length > 2 && this.trailHistory[1].time < this.trailClock - PLAYER_TRAIL_TIME) this.trailHistory.shift();
  }

  private writeTrail(trail: number, color: THREE.Color, intensity: number) {
    const base = trail * TRAIL_VERTICES;
    for (let k = 0; k <= TRAIL_SEGMENTS; k++) {
      const point = this.trailPoints[k];
      const fog = Math.min(1, Math.max(0, (TRAIL_FOG_FAR + point.z) / (TRAIL_FOG_FAR - TRAIL_FOG_NEAR)));
      const fade = intensity * fog * Math.pow(1 - k / TRAIL_SEGMENTS, TRAIL_FADE);
      for (let j = 0; j < 3; j++) {
        const offset = (base + k * 3 + j) * 3;
        this.trailPositions[offset] = point.x + (j - 1) * TRAIL_HALF_WIDTH;
        this.trailPositions[offset + 1] = point.y;
        this.trailPositions[offset + 2] = point.z;
        const glow = j === 1 ? fade : 0;
        this.trailColors[offset] = color.r * glow;
        this.trailColors[offset + 1] = color.g * glow;
        this.trailColors[offset + 2] = color.b * glow;
      }
    }
  }

  private project(distance: number, lateral: number, target: THREE.Vector3) {
    return target.set(roadX(distance) - roadX(this.distance) + lateral, roadY(distance) - roadY(this.distance), -(distance - this.distance));
  }

  private updateWorld() {
    const baseDistance = this.distance - 12;
    const vOffset = (baseDistance / TEXTURE_PERIOD) % 1;
    const center = this.center;

    for (let i = 0; i <= VISIBLE_SEGMENTS; i++) {
      const distance = baseDistance + i * SEGMENT_LENGTH;
      const slope = (roadX(distance + 1) - roadX(distance - 1)) / 2;
      const length = Math.sqrt(1 + slope * slope);
      const ux = 1 / length;
      const uz = slope / length;
      const left = roadLeft(distance);
      const right = roadRight(distance);
      this.project(distance, 0, center);

      const p = i * 6;
      this.roadPositions[p] = center.x + ux * left;
      this.roadPositions[p + 1] = center.y;
      this.roadPositions[p + 2] = center.z + uz * left;
      this.roadPositions[p + 3] = center.x + ux * right;
      this.roadPositions[p + 4] = center.y;
      this.roadPositions[p + 5] = center.z + uz * right;

      const v = vOffset + (i * SEGMENT_LENGTH) / TEXTURE_PERIOD;
      const u = i * 4;
      this.roadUvs[u] = (left - LANE_BOUNDARY_ORIGIN) / LANE_WIDTH;
      this.roadUvs[u + 1] = v;
      this.roadUvs[u + 2] = (right - LANE_BOUNDARY_ORIGIN) / LANE_WIDTH;
      this.roadUvs[u + 3] = v;
    }
    this.roadGeometry.attributes.position.needsUpdate = true;
    this.roadGeometry.attributes.uv.needsUpdate = true;

    const gravelOffset = (baseDistance / GRAVEL_TILE) % 1;
    const gravelAcross = SHOULDER_WIDTH / GRAVEL_TILE;
    for (let i = 0; i <= VISIBLE_SEGMENTS; i++) {
      const distance = baseDistance + i * SEGMENT_LENGTH;
      const slope = (roadX(distance + 1) - roadX(distance - 1)) / 2;
      const length = Math.sqrt(1 + slope * slope);
      const ux = 1 / length;
      const uz = slope / length;
      this.project(distance, 0, center);
      const ground = Math.min(center.y, GROUND_Y);

      let g = i * GRAVEL_ROW_VERTICES * 3;
      let t = i * GRAVEL_ROW_VERTICES * 2;
      const v = gravelOffset + (i * SEGMENT_LENGTH) / GRAVEL_TILE;
      for (const side of [-1, 1]) {
        for (const [offset, u] of [
          [0, 0],
          [SHOULDER_WIDTH, gravelAcross],
        ]) {
          const lateral = roadEdge(side, distance, offset);
          this.gravelPositions[g++] = center.x + ux * lateral;
          this.gravelPositions[g++] = center.y;
          this.gravelPositions[g++] = center.z + uz * lateral;
          this.gravelUvs[t++] = u;
          this.gravelUvs[t++] = v;
        }
      }

      let p = i * SHOULDER_ROW_VERTICES * 3;
      for (const side of [-1, 1]) {
        for (const band of SHOULDER_BANDS) {
          for (const [offset, y] of [
            [band.inner, center.y + band.lift],
            [band.outer, band.drop ? ground : center.y + band.lift],
          ]) {
            const lateral = roadEdge(side, distance, offset);
            this.shoulderPositions[p++] = center.x + ux * lateral;
            this.shoulderPositions[p++] = y;
            this.shoulderPositions[p++] = center.z + uz * lateral;
          }
        }
      }
    }
    this.shoulderGeometry.attributes.position.needsUpdate = true;
    this.gravelGeometry.attributes.position.needsUpdate = true;
    this.gravelGeometry.attributes.uv.needsUpdate = true;

    const firstPost = Math.ceil(baseDistance / POST_SPACING) * POST_SPACING;
    for (let i = 0; i < POST_COUNT; i++) {
      const distance = firstPost + i * POST_SPACING;
      for (const side of [-1, 1]) {
        this.project(distance, roadEdge(side, distance, POST_OFFSET), this.dummy.position);
        this.dummy.position.y += 0.8;
        this.dummy.rotation.set(0, 0, 0);
        this.dummy.scale.setScalar(1);
        this.dummy.updateMatrix();
        this.posts.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), this.dummy.matrix);
      }
    }
    this.posts.instanceMatrix.needsUpdate = true;

    let firstRepairIndex = Math.max(0, Math.floor((this.distance - REPAIR_ZONE_START - REPAIR_ZONE_MAX_LENGTH) / REPAIR_ZONE_INTERVAL));
    while (REPAIR_ZONE_START + firstRepairIndex * REPAIR_ZONE_INTERVAL + repairZoneLength(firstRepairIndex) < this.distance - 12) firstRepairIndex += 1;
    for (let zoneOffset = 0; zoneOffset < REPAIR_ZONE_COUNT; zoneOffset++) {
      const zoneIndex = firstRepairIndex + zoneOffset;
      const zoneStart = REPAIR_ZONE_START + zoneIndex * REPAIR_ZONE_INTERVAL;
      const zoneLength = repairZoneLength(zoneIndex);
      const lane = repairZoneLane(zoneIndex);
      const visible = zoneStart <= this.distance + VISIBLE_SEGMENTS * SEGMENT_LENGTH && zoneStart + zoneLength >= this.distance - 12;
      for (let stripe = 0; stripe < REPAIR_STRIPES_PER_ZONE; stripe++) {
        const instance = zoneOffset * REPAIR_STRIPES_PER_ZONE + stripe;
        if (visible) {
          const distance = zoneStart + 2 + (stripe / (REPAIR_STRIPES_PER_ZONE - 1)) * (zoneLength - 4);
          this.project(distance, lane, this.dummy.position);
          this.dummy.position.y += 0.045;
          this.dummy.rotation.set(0, -roadHeading(distance), 0);
          this.dummy.scale.setScalar(1);
        } else {
          this.dummy.position.set(0, -100, 0);
          this.dummy.scale.setScalar(0);
        }
        this.dummy.updateMatrix();
        this.repairStripes.setMatrixAt(instance, this.dummy.matrix);
      }
    }
    this.repairStripes.instanceMatrix.needsUpdate = true;

    let firstPalmCluster = Math.max(0, Math.floor((this.distance - PALM_CLUSTER_MAX_SPAN - PALM_CLUSTER_START_MAX) / PALM_CLUSTER_INTERVAL));
    while (palmClusterStart(firstPalmCluster) + (palmClusterCount(firstPalmCluster) - 1) * palmClusterSpacing(firstPalmCluster, palmClusterCount(firstPalmCluster)) < this.distance - 12) firstPalmCluster += 1;
    let palmInstance = 0;
    for (let clusterOffset = 0; clusterOffset < PALM_RENDER_CLUSTER_COUNT; clusterOffset++) {
      const clusterIndex = firstPalmCluster + clusterOffset;
      const clusterStart = palmClusterStart(clusterIndex);
      if (clusterStart > this.distance + VISIBLE_SEGMENTS * SEGMENT_LENGTH) break;
      const count = palmClusterCount(clusterIndex);
      const spacing = palmClusterSpacing(clusterIndex, count);
      for (let tree = 0; tree < count; tree++) {
        const distance = clusterStart + tree * spacing;
        if (distance < this.distance - 12 || distance > this.distance + VISIBLE_SEGMENTS * SEGMENT_LENGTH) continue;

        const side = tree % 2 === 0 ? -1 : 1;
        const lateralOffset = PALM_OFFSET + proceduralRandom(clusterIndex * MAX_PALMS_PER_CLUSTER + tree, 4) * 3.5;
        const treeScale = 0.72 + proceduralRandom(clusterIndex * MAX_PALMS_PER_CLUSTER + tree, 5) * 0.5;
        this.project(distance, roadEdge(side, distance, lateralOffset), this.dummy.position);
        this.dummy.rotation.set(0, proceduralRandom(clusterIndex * MAX_PALMS_PER_CLUSTER + tree, 6) * Math.PI * 2, 0);
        this.dummy.scale.setScalar(treeScale);
        this.dummy.updateMatrix();
        this.palmTrunks.setMatrixAt(palmInstance, this.dummy.matrix);
        this.palmBranches.setMatrixAt(palmInstance, this.dummy.matrix);
        palmInstance += 1;
      }
    }
    this.palmTrunks.count = palmInstance;
    this.palmBranches.count = palmInstance;
    this.palmTrunks.instanceMatrix.needsUpdate = true;
    this.palmBranches.instanceMatrix.needsUpdate = true;

    this.traffic.forEach((car, index) => {
      if (car.active) {
        this.project(car.distance, car.x, this.dummy.position);
        this.dummy.rotation.set(0, -roadHeading(car.distance), 0);
        this.dummy.scale.setScalar(1);
      } else {
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.setScalar(0);
      }
      this.dummy.updateMatrix();
      const matrix = this.dummy.matrix;
      for (let model = 0; model < TRAFFIC_MODEL_COUNT; model++) {
        const instanceMatrix = car.active && car.model === model ? matrix : this.hiddenTrafficMatrix;
        this.trafficBodies[model].setMatrixAt(index, instanceMatrix);
        this.trafficWheels[model].setMatrixAt(index, instanceMatrix);
        this.trafficLights[model].setMatrixAt(index, instanceMatrix);
      }
    });
    for (let model = 0; model < TRAFFIC_MODEL_COUNT; model++) {
      this.trafficBodies[model].instanceMatrix.needsUpdate = true;
      this.trafficWheels[model].instanceMatrix.needsUpdate = true;
      this.trafficLights[model].instanceMatrix.needsUpdate = true;
    }

    for (const drop of this.drops) {
      drop.mesh.visible = drop.active;
      if (!drop.active) continue;
      this.project(drop.distance, LANE_SLOTS[drop.lane], drop.mesh.position);
      drop.mesh.position.y += DROP_HEIGHT + Math.sin(this.dropTime * 3 + drop.distance) * 0.18;
      drop.box.rotation.set(0.35, this.dropTime * 1.8 + drop.distance, 0.2);
      const collectProgress = drop.collected > 0 ? Math.min(1, drop.collected / DROP_COLLECT_DURATION) : 0;
      const easedProgress = collectProgress * collectProgress * (3 - 2 * collectProgress);
      drop.mesh.scale.setScalar(1 - easedProgress);
      if (drop.fadeMaterial) drop.fadeMaterial.opacity = 1 - easedProgress;
    }

    this.tofu.visible = this.tofuGlow.visible = this.tofuActive;
    if (this.tofuActive) {
      const collectProgress = this.tofuCollected > 0 ? Math.min(1, this.tofuCollected / TOFU_COLLECT_DURATION) : 0;
      this.project(this.tofuDistance, LANE_SLOTS[this.tofuLane], this.tofu.position);
      this.tofuGlow.position.copy(this.tofu.position);
      this.tofuGlow.position.y += 0.06;
      this.tofuGlow.material.opacity = (0.55 + Math.sin(this.dropTime * 5) * 0.2) * (1 - collectProgress);
      this.tofu.position.y += TOFU_HEIGHT + Math.sin(this.dropTime * 2.4) * 0.2;
      this.tofu.rotation.set(0, this.dropTime * 1.2, 0);
      this.tofu.scale.setScalar(1 + collectProgress * 0.8);
      this.tofu.material.opacity = 1 - collectProgress;
    }

    const signDistance = this.tofuDistance - TOFU_SIGN_LEAD;
    this.tofuSign.visible = this.tofuActive && signDistance > this.distance - 12;
    if (this.tofuSign.visible) {
      this.project(signDistance, roadEdge(LANE_SLOTS[this.tofuLane] > 0 ? 1 : -1, signDistance, TOFU_SIGN_OFFSET), this.tofuSign.position);
      this.tofuSign.rotation.set(0, -roadHeading(signDistance), 0);
    }

    const heading = roadHeading(this.distance);
    this.player.position.set(this.playerX, 0, 0);
    this.player.rotation.set(0, -heading - this.steerVisual * 0.18 - this.skidSide * this.skidBlend * SKID_ANGLE, -this.steerVisual * 0.06);
    this.updateGhost();
    this.updateTrails();

    const cell = 3000 / 120;
    this.grid.position.x = -(roadX(this.distance) % cell);
    this.grid.position.z = this.distance % cell;

    const lookAhead = 34;
    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake * 0.6 : 0;
    const shakeY = this.shake ? (Math.random() - 0.5) * this.shake * 0.4 : 0;
    const aheadX = roadX(this.distance + lookAhead) - roadX(this.distance);
    const aheadY = roadY(this.distance + lookAhead) - roadY(this.distance);
    this.camera.position.set(this.playerX * 0.6 + shakeX, 4.4 + this.portraitTilt * 3 + shakeY, 10.5 + this.portraitTilt * 2);
    this.camera.lookAt(aheadX * 0.9 + this.playerX * 0.3, 0.6 + aheadY * 0.45 - this.portraitTilt * 9, -lookAhead);
    if (this.skidBlend) this.camera.rotateZ(-this.skidSide * this.skidBlend * SKID_CAMERA_ROLL);

    this.sky.position.x = this.camera.position.x + aheadX * 0.2;

    const speedRatio = Math.max(0, Math.min(1, (this.speed - BASE_SPEED) / (MAX_SPEED * BOOST_MULTIPLIER - BASE_SPEED)));
    const fov = this.baseFov + speedRatio * SPEED_FOV_BOOST;
    if (Math.abs(fov - this.camera.fov) > 0.05) {
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    }

    this.minimapFrame = (this.minimapFrame + 1) % 2;
    if (this.minimap && this.minimapFrame === 0) this.drawMinimap(this.minimap);
  }

  private drawMinimap(context: CanvasRenderingContext2D) {
    const { width, height } = context.canvas;
    const behind = MINIMAP_BEHIND;
    const scale = height / (MINIMAP_AHEAD + behind);
    const lateralScale = scale * MINIMAP_LATERAL_EXAGGERATION;
    const originX = width / 2;
    const originY = height - behind * scale;
    const baseX = roadX(this.distance);
    const toScreen = (distance: number, lateral: number): [number, number] => [originX + (roadX(distance) - baseX + lateral) * lateralScale, originY - (distance - this.distance) * scale];

    context.clearRect(0, 0, width, height);

    context.save();
    context.lineJoin = "round";
    context.beginPath();
    const first = this.distance - behind;
    const last = this.distance + MINIMAP_AHEAD;
    for (let distance = first; distance <= last; distance += MINIMAP_STEP) {
      const [x, y] = toScreen(distance, roadLeft(distance));
      if (distance === first) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    for (let distance = first + Math.floor((last - first) / MINIMAP_STEP) * MINIMAP_STEP; distance >= first; distance -= MINIMAP_STEP) {
      const [x, y] = toScreen(distance, roadRight(distance));
      context.lineTo(x, y);
    }
    context.closePath();
    context.strokeStyle = "rgba(255, 43, 214, 0.35)";
    context.lineWidth = 4;
    context.stroke();
    context.fillStyle = "#ff2bd6";
    context.shadowColor = "#ff2bd6";
    context.shadowBlur = 6;
    context.fill();
    context.restore();

    context.fillStyle = "#36e0ff";
    const dropDot = Math.max(3, DROP_SIZE * lateralScale * 1.4);
    for (const drop of this.drops) {
      if (!drop.active || drop.collected > 0 || drop.distance > this.distance + MINIMAP_AHEAD) continue;
      const [x, y] = toScreen(drop.distance, LANE_SLOTS[drop.lane]);
      context.save();
      context.translate(x, y);
      context.rotate(Math.PI / 4);
      context.fillRect(-dropDot / 2, -dropDot / 2, dropDot, dropDot);
      context.restore();
    }

    if (this.tofuActive && this.tofuCollected === 0 && this.tofuDistance <= this.distance + MINIMAP_AHEAD) {
      const [x, y] = toScreen(this.tofuDistance, LANE_SLOTS[this.tofuLane]);
      const size = Math.max(5, TOFU_WIDTH * lateralScale * 1.6);
      context.save();
      context.fillStyle = "#fffdf6";
      context.shadowColor = "#9dffd8";
      context.shadowBlur = 8;
      context.fillRect(x - size / 2, y - size / 2, size, size);
      context.restore();
    }

    context.fillStyle = "#facc15";
    const dot = Math.max(3, CAR_WIDTH * lateralScale * 1.2);
    for (const car of this.traffic) {
      if (!car.active || car.distance < this.distance - behind || car.distance > this.distance + MINIMAP_AHEAD) continue;
      const [x, y] = toScreen(car.distance, car.x);
      context.fillRect(x - dot / 2, y - dot / 2, dot, dot);
    }

    const [px, py] = toScreen(this.distance, this.playerX);
    const size = Math.max(5, width * 0.06);
    context.fillStyle = "#36e0ff";
    context.shadowColor = "#36e0ff";
    context.shadowBlur = 8;
    context.beginPath();
    context.moveTo(px, py - size);
    context.lineTo(px + size * 0.7, py + size * 0.6);
    context.lineTo(px - size * 0.7, py + size * 0.6);
    context.closePath();
    context.fill();
    context.shadowBlur = 0;
  }

  setMinimap(canvas: HTMLCanvasElement | null) {
    this.minimap = canvas ? canvas.getContext("2d") : null;
  }
}
