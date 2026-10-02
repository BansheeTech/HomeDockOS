// homedock-ui/vue3/static/js/__Games__/PacketSnake/PacketSnakeEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

export type PacketSnakeState = "ready" | "playing" | "paused" | "over";

export interface PacketSnakeCallbacks {
  onScore: (score: number) => void;
  onEat?: (score: number) => void;
  onGameOver: (score: number) => void;
  onSudo?: (seconds: number) => void;
  onGrow?: (size: number) => void;
}

interface Cell {
  x: number;
  y: number;
}

interface BonusPacket extends Cell {
  born: number;
  material: THREE.MeshBasicMaterial;
}

interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  born: number;
}

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;

export type PacketSnakeDirection = keyof typeof DIRECTIONS;

const BOARD_START = 18;
const BOARD_MAX = 30;
const BOARD_GROW_EVERY = 10;
const BOARD_GROW_DURATION = 0.9;
const BOARD_GROW_SHAKE = 0.35;
const BOARD_CANVAS = 64;
const WALL_THICKNESS = 0.22;
const WALL_HEIGHT = 0.35;
const STRIP_OPACITY = 0.7;
const NIGHT = 0x0b0620;
const FLOOR = 0x120a2e;
const NEON_CYAN = 0x36e0ff;
const NEON_PINK = 0xff2bd6;
const GRID_LINE = 0x5b2a86;
const HORIZON_LINE = 0x2a1450;
const HEAD_COLOR = 0xe0fbff;
const HEAD_GLOW = 0x1a6f80;
const CRASH_COLOR = 0xff315c;
const CRASH_GLOW = 0x5a0010;
const STEP_START = 0.17;
const STEP_MIN = 0.07;
const STEP_DECAY = 0.0015;
const ATTRACT_STEP = 0.11;
const START_LENGTH = 4;
const MAX_QUEUED_TURNS = 2;
const SEGMENT_SIZE = 0.82;
const SEGMENT_HEIGHT = 0.5;
const HEAD_SCALE = 1.08;
const TAIL_SHRINK = 0.3;
const HEAD_TURN_RATE = 18;
const EAT_PULSE_DECAY = 5;
const PACKET_SIZE = 0.62;
const ROUNDED_SEGMENTS = 3;
const ROUNDED_RATIO = 0.14;
const PACKET_HEIGHT = 0.55;
const PACKET_SPIN = 1.6;
const PACKET_FALLBACK_ICON = "/images/docker-icons/homedock-os.jpg";
const RIPPLE_DURATION = 0.45;
const RIPPLE_GROWTH = 2.2;
const SHAKE_DECAY = 2.5;
const CAMERA_TILT = THREE.MathUtils.degToRad(58);
const CAMERA_FOV = 45;
const BOARD_MARGIN = 1.6;
const BOARD_FIT = 1.15;
const ZOOM_START_SCORE = 0;
const ZOOM_END_SCORE = 30;
const ZOOM_EXTRA = 1.25;
const ZOOM_EASE = 1.5;
const FOLLOW_EASE = 4;
const SUDO_CHANCE = 0.05;
const SUDO_TOKEN_LIFETIME = 8;
const SUDO_TOKEN_BLINK = 2;
const SUDO_DURATION = 8;
const SUDO_WARNING = 1.5;
const SUDO_HEAD_SCALE = 1.25;
const SUDO_GROW_RATE = 10;
const SUDO_COLOR = 0x39ff6a;
const SUDO_EYES = 0xff2a2a;
const SUDO_SPAWN_INTERVAL = 0.45;
const SUDO_MAX_PACKETS = 8;
const PACKET_POP_DURATION = 0.2;
const HEAD_HEIGHT = SEGMENT_HEIGHT * 1.15;
const MATRIX_SIZE = 128;
const MATRIX_COLUMNS = 8;
const MATRIX_BACKGROUND = "#0a3d18";
const MATRIX_TRAIL = "rgba(10, 61, 24, 0.35)";
const MATRIX_HEAD = "#c8ffd4";
const MATRIX_GLYPHS = "0123456789ABCDEF#$<>/";
const MATRIX_REFRESH = 0.05;
const AURA_SIZE = 3.2;
const SPARK_COUNT = 40;
const SPARK_SIZE = 0.09;
const SPARK_LIFE = 0.6;
const SPARK_INTERVAL = 0.03;
const SPARK_COLORS = [0x39ff6a, 0x9dffb4, 0x1fd65a, 0xe0ffe8];
const TERMINAL_SIZE = 256;
const TERMINAL_LINES = ["$ sudo -s", "[sudo] ****", "# whoami", "root"];
const TERMINAL_TYPE_RATE = 14;
const TERMINAL_HOLD = 1.2;
const TERMINAL_REFRESH = 0.06;
const MAX_PIXEL_RATIO = 2;

function glowTexture() {
  const element = document.createElement("canvas");
  element.width = element.height = 128;
  const context = element.getContext("2d")!;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.45, "rgba(255, 255, 255, 0.4)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(element);
}

function drawMatrix(context: CanvasRenderingContext2D, drops: number[]) {
  const column = MATRIX_SIZE / drops.length;
  context.fillStyle = MATRIX_TRAIL;
  context.fillRect(0, 0, MATRIX_SIZE, MATRIX_SIZE);
  context.font = `bold ${column}px ui-monospace, Menlo, monospace`;
  context.textBaseline = "top";
  context.fillStyle = MATRIX_HEAD;
  drops.forEach((row, index) => {
    context.fillText(MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)], index * column + 2, row * column);
    drops[index] = row * column > MATRIX_SIZE && Math.random() > 0.8 ? 0 : row + 1;
  });
}

function createMouth() {
  const y = HEAD_HEIGHT + 0.004;
  const back = 0.33;
  const front = 0.43;
  const width = 0.2;
  const teethCount = 4;
  const step = (width * 2) / teethCount;
  const toothDepth = 0.05;

  const mouth = new THREE.BufferGeometry();
  mouth.setAttribute("position", new THREE.Float32BufferAttribute([back, y, -width, front, y, -width, front, y, width, back, y, -width, front, y, width, back, y, width], 3));

  const teeth: number[] = [];
  const toothY = y + 0.002;
  for (let i = 0; i < teethCount; i++) {
    const z = -width + i * step;
    teeth.push(back, toothY, z, back, toothY, z + step, back + toothDepth, toothY, z + step / 2);
  }
  for (let i = 0; i < teethCount - 1; i++) {
    const z = -width + step / 2 + i * step;
    teeth.push(front, toothY, z, front, toothY, z + step, front - toothDepth, toothY, z + step / 2);
  }
  const teethGeometry = new THREE.BufferGeometry();
  teethGeometry.setAttribute("position", new THREE.Float32BufferAttribute(teeth, 3));

  const group = new THREE.Group();
  group.add(new THREE.Mesh(mouth, new THREE.MeshBasicMaterial({ color: NIGHT, side: THREE.DoubleSide })), new THREE.Mesh(teethGeometry, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })));
  return group;
}

function drawTerminal(context: CanvasRenderingContext2D, time: number) {
  const size = TERMINAL_SIZE;
  context.fillStyle = "#050d07";
  context.fillRect(0, 0, size, size);
  context.fillStyle = "#0f2a16";
  context.fillRect(0, 0, size, 40);
  ["#ff5f57", "#febc2e", "#28c840"].forEach((color, index) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(26 + index * 24, 20, 7, 0, Math.PI * 2);
    context.fill();
  });

  const characters = TERMINAL_LINES.reduce((total, line) => total + line.length, 0);
  const cycle = characters / TERMINAL_TYPE_RATE + TERMINAL_HOLD;
  let remaining = Math.floor((time % cycle) * TERMINAL_TYPE_RATE);
  let cursorX = 20;
  let cursorY = 56;
  context.font = "bold 28px ui-monospace, Menlo, monospace";
  context.textBaseline = "top";
  context.fillStyle = "#39ff6a";
  TERMINAL_LINES.forEach((line, index) => {
    if (remaining < 0) return;
    const visible = line.slice(0, remaining);
    const y = 56 + index * 42;
    context.fillText(visible, 20, y);
    cursorX = 20 + context.measureText(visible).width + 2;
    cursorY = y;
    remaining -= line.length;
  });
  if (Math.sin(time * 9) > 0) context.fillRect(cursorX, cursorY, 16, 28);

  context.fillStyle = "rgba(0, 0, 0, 0.28)";
  for (let y = 0; y < size; y += 4) context.fillRect(0, y, size, 2);
  context.strokeStyle = "#39ff6a";
  context.lineWidth = 10;
  context.strokeRect(5, 5, size - 10, size - 10);
}

function easeOutBack(t: number) {
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
}

function shortestAngle(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export class PacketSnakeEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 200);
  private frame = 0;
  private lastTime = 0;
  private disposables: { dispose: () => void }[] = [];

  private body: THREE.InstancedMesh;
  private head: THREE.Group;
  private headMaterial = new THREE.MeshLambertMaterial({ color: HEAD_COLOR, emissive: HEAD_GLOW });
  private eyeMaterial = new THREE.MeshBasicMaterial({ color: NIGHT });
  private headBox: THREE.Mesh;
  private sudoBox: THREE.Mesh;
  private sudoFace: THREE.Group;
  private matrix = document.createElement("canvas").getContext("2d")!;
  private matrixTexture: THREE.CanvasTexture;
  private matrixDrops = Array.from({ length: MATRIX_COLUMNS }, () => Math.floor(Math.random() * MATRIX_COLUMNS));
  private matrixDrawn = -Infinity;
  private aura: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private sparkMesh: THREE.InstancedMesh;
  private sparks: Spark[] = [];
  private nextSpark = 0;
  private sparkTimer = 0;
  private hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  private clipPlanes = [new THREE.Plane(new THREE.Vector3(1, 0, 0)), new THREE.Plane(new THREE.Vector3(-1, 0, 0)), new THREE.Plane(new THREE.Vector3(0, 0, 1)), new THREE.Plane(new THREE.Vector3(0, 0, -1))];
  private wallMaterial = new THREE.MeshBasicMaterial({ color: NEON_PINK });
  private walls: THREE.Mesh[] = [];
  private stripMaterial = new THREE.MeshBasicMaterial({ color: NEON_CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  private growStrips: THREE.Mesh[] = [];
  private white = new THREE.Color(0xffffff);
  private packet: THREE.Mesh;
  private token: THREE.Mesh;
  private tokenGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private bonusMeshes: THREE.Mesh[] = [];
  private iconSegments: THREE.Mesh[] = [];
  private segmentMaterials: THREE.MeshBasicMaterial[] = [];
  private terminal = document.createElement("canvas").getContext("2d")!;
  private terminalTexture: THREE.CanvasTexture;
  private terminalDrawn = -Infinity;
  private packetGlow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private ripple: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
  private packetMaterials: THREE.MeshBasicMaterial[] = [];
  private textureLoader = new THREE.TextureLoader();
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private tailColor = new THREE.Color(NEON_PINK);
  private cameraTarget = new THREE.Vector3();
  private cameraFocus = new THREE.Vector3();
  private cameraZoom = 1;

  private state: PacketSnakeState = "ready";
  private snake: Cell[] = [];
  private previous: Cell[] = [];
  private direction: Cell = DIRECTIONS.right;
  private turns: Cell[] = [];
  private food: Cell = { x: 0, y: 0 };
  private score = 0;
  private accumulator = 0;
  private time = 0;
  private headYaw = 0;
  private eatPulse = 0;
  private rippleTime = RIPPLE_DURATION;
  private shake = 0;
  private distanceFactor = 2;
  private size = BOARD_START;
  private originX = 0.5 - BOARD_START / 2;
  private originZ = 0.5 - BOARD_START / 2;
  private growths = 0;
  private growTime = BOARD_GROW_DURATION;
  private growFlash = false;
  private growColumn = 0;
  private growRow = 0;
  private bounds: Bounds = this.boardBounds();
  private boundsFrom: Bounds = this.boardBounds();
  private sudoToken: Cell | null = null;
  private sudoTokenTime = 0;
  private sudoTime = 0;
  private sudoSeconds = 0;
  private sudoSpawnTimer = 0;
  private headGrow = 1;
  private bonus: BonusPacket[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    private callbacks: PacketSnakeCallbacks,
  ) {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: pixelRatio < 2, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.background = new THREE.Color(NIGHT);
    this.scene.fog = new THREE.Fog(NIGHT, 40, 90);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x442266, 1.5));
    const light = new THREE.DirectionalLight(0xffffff, 1.1);
    light.position.set(-4, 12, 8);
    this.scene.add(light);

    const horizon = new THREE.GridHelper(160, 80, HORIZON_LINE, HORIZON_LINE);
    horizon.position.y = -0.05;
    this.scene.add(horizon);

    this.renderer.localClippingEnabled = true;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_CANVAS, BOARD_CANVAS), new THREE.MeshBasicMaterial({ color: FLOOR, clippingPlanes: this.clipPlanes }));
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(BOARD_CANVAS, BOARD_CANVAS, GRID_LINE, GRID_LINE);
    (grid.material as THREE.Material).clippingPlanes = this.clipPlanes;
    grid.position.y = 0.01;
    this.scene.add(grid);

    const horizontalWall = new THREE.BoxGeometry(1, WALL_HEIGHT, WALL_THICKNESS);
    const verticalWall = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, 1);
    this.walls = [horizontalWall, horizontalWall, verticalWall, verticalWall].map((geometry) => {
      const wall = new THREE.Mesh(geometry, this.wallMaterial);
      wall.position.y = WALL_HEIGHT / 2;
      this.scene.add(wall);
      return wall;
    });

    const stripGeometry = new THREE.PlaneGeometry(1, 1);
    this.growStrips = [0, 1].map(() => {
      const strip = new THREE.Mesh(stripGeometry, this.stripMaterial);
      strip.rotation.x = -Math.PI / 2;
      strip.position.y = 0.015;
      strip.visible = false;
      this.scene.add(strip);
      return strip;
    });

    this.body = new THREE.InstancedMesh(new THREE.BoxGeometry(SEGMENT_SIZE, SEGMENT_HEIGHT, SEGMENT_SIZE), new THREE.MeshLambertMaterial({ color: 0xffffff }), BOARD_MAX * BOARD_MAX);
    this.body.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.body.frustumCulled = false;
    this.scene.add(this.body);

    const glow = glowTexture();

    this.head = new THREE.Group();
    const headGeometry = new THREE.BoxGeometry(SEGMENT_SIZE * HEAD_SCALE, HEAD_HEIGHT, SEGMENT_SIZE * HEAD_SCALE);
    this.headBox = new THREE.Mesh(headGeometry, this.headMaterial);
    this.headBox.position.y = HEAD_HEIGHT / 2;

    this.matrix.canvas.width = this.matrix.canvas.height = MATRIX_SIZE;
    this.matrix.fillStyle = MATRIX_BACKGROUND;
    this.matrix.fillRect(0, 0, MATRIX_SIZE, MATRIX_SIZE);
    this.matrixTexture = new THREE.CanvasTexture(this.matrix.canvas);
    this.matrixTexture.colorSpace = THREE.SRGBColorSpace;
    this.matrixTexture.magFilter = THREE.NearestFilter;
    this.sudoBox = new THREE.Mesh(headGeometry, new THREE.MeshBasicMaterial({ map: this.matrixTexture }));
    this.sudoBox.position.y = HEAD_HEIGHT / 2;
    this.sudoBox.add(new THREE.LineSegments(new THREE.EdgesGeometry(headGeometry), new THREE.LineBasicMaterial({ color: SUDO_COLOR })));
    this.sudoBox.visible = false;

    const eyeGeometry = new THREE.BoxGeometry(0.14, 0.05, 0.12);
    const browGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.28);
    const browMaterial = new THREE.MeshBasicMaterial({ color: NIGHT });
    const eyeGlowMaterial = new THREE.MeshBasicMaterial({ map: glow, color: SUDO_EYES, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    const eyeGlowGeometry = new THREE.PlaneGeometry(0.5, 0.5);
    this.sudoFace = new THREE.Group();
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeometry, this.eyeMaterial);
      eye.position.set(0.22, HEAD_HEIGHT, side * 0.2);
      this.head.add(eye);

      const brow = new THREE.Mesh(browGeometry, browMaterial);
      brow.position.set(0.06, HEAD_HEIGHT + 0.04, side * 0.2);
      brow.rotation.y = -side * 0.45;
      const eyeGlow = new THREE.Mesh(eyeGlowGeometry, eyeGlowMaterial);
      eyeGlow.rotation.x = -Math.PI / 2;
      eyeGlow.position.set(0.22, HEAD_HEIGHT + 0.03, side * 0.2);
      this.sudoFace.add(brow, eyeGlow);
    }
    this.sudoFace.add(createMouth());
    this.sudoFace.visible = false;
    this.head.add(this.headBox, this.sudoBox, this.sudoFace);
    this.scene.add(this.head);

    this.aura = new THREE.Mesh(new THREE.PlaneGeometry(AURA_SIZE, AURA_SIZE), new THREE.MeshBasicMaterial({ map: glow, color: SUDO_COLOR, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.aura.rotation.x = -Math.PI / 2;
    this.aura.position.y = 0.025;
    this.aura.visible = false;
    this.scene.add(this.aura);

    this.sparkMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(SPARK_SIZE, SPARK_SIZE, SPARK_SIZE), new THREE.MeshBasicMaterial({ color: 0xffffff }), SPARK_COUNT);
    this.sparkMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.sparkMesh.frustumCulled = false;
    for (let i = 0; i < SPARK_COUNT; i++) {
      this.sparkMesh.setMatrixAt(i, this.hiddenMatrix);
      this.sparkMesh.setColorAt(i, this.color.setHex(SPARK_COLORS[i % SPARK_COLORS.length]));
      this.sparks.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, born: -Infinity });
    }
    this.scene.add(this.sparkMesh);
    this.packet = new THREE.Mesh(new RoundedBoxGeometry(PACKET_SIZE, PACKET_SIZE, PACKET_SIZE, ROUNDED_SEGMENTS, PACKET_SIZE * ROUNDED_RATIO));
    const packetEdges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PACKET_SIZE, PACKET_SIZE, PACKET_SIZE)), new THREE.LineBasicMaterial({ color: NEON_CYAN }));
    this.packet.add(packetEdges);
    this.scene.add(this.packet);

    this.packetGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), new THREE.MeshBasicMaterial({ map: glow, color: NEON_CYAN, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.packetGlow.rotation.x = -Math.PI / 2;
    this.packetGlow.position.y = 0.02;
    this.scene.add(this.packetGlow);

    this.ripple = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.52, 40), new THREE.MeshBasicMaterial({ color: NEON_CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.ripple.rotation.x = -Math.PI / 2;
    this.ripple.position.y = 0.03;
    this.scene.add(this.ripple);

    for (let i = 0; i < SUDO_MAX_PACKETS; i++) {
      const bonus = new THREE.Mesh(this.packet.geometry);
      bonus.add(new THREE.LineSegments(packetEdges.geometry, packetEdges.material));
      bonus.visible = false;
      this.bonusMeshes.push(bonus);
      this.scene.add(bonus);
    }

    this.terminal.canvas.width = this.terminal.canvas.height = TERMINAL_SIZE;
    drawTerminal(this.terminal, 0);
    this.terminalTexture = new THREE.CanvasTexture(this.terminal.canvas);
    this.terminalTexture.colorSpace = THREE.SRGBColorSpace;
    this.token = new THREE.Mesh(this.packet.geometry, new THREE.MeshBasicMaterial({ map: this.terminalTexture }));
    this.token.add(new THREE.LineSegments(packetEdges.geometry, new THREE.LineBasicMaterial({ color: SUDO_COLOR })));
    this.token.visible = false;
    this.scene.add(this.token);

    this.tokenGlow = new THREE.Mesh(this.packetGlow.geometry, new THREE.MeshBasicMaterial({ map: glow, color: SUDO_COLOR, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.tokenGlow.rotation.x = -Math.PI / 2;
    this.tokenGlow.position.y = 0.02;
    this.tokenGlow.visible = false;
    this.scene.add(this.tokenGlow);

    this.disposables.push(glow, this.terminalTexture, this.matrixTexture);
    this.setPacketIcons([]);
    this.reset();
    this.render();
  }

  setPacketIcons(urls: string[]) {
    for (const material of this.packetMaterials) {
      material.map?.dispose();
      material.dispose();
    }

    this.packetMaterials = (urls.length ? urls : [PACKET_FALLBACK_ICON]).map((url) => {
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const apply = (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.needsUpdate = true;
      };
      this.textureLoader.load(url, apply, undefined, () => {
        if (url !== PACKET_FALLBACK_ICON) this.textureLoader.load(PACKET_FALLBACK_ICON, apply);
      });
      return material;
    });

    this.packet.material = this.randomPacketMaterial();
    for (const bonus of this.bonus) bonus.material = this.randomPacketMaterial();
    this.segmentMaterials = [];
  }

  getState() {
    return this.state;
  }

  start() {
    this.reset();
    this.state = "playing";
    this.lastTime = 0;
    this.callbacks.onScore(0);
  }

  pause() {
    if (this.state === "playing") this.state = "paused";
  }

  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastTime = 0;
  }

  turn(name: PacketSnakeDirection) {
    if (this.state !== "playing" || this.turns.length >= MAX_QUEUED_TURNS) return false;
    const direction = DIRECTIONS[name];
    const last = this.turns.length ? this.turns[this.turns.length - 1] : this.direction;
    if (direction === last || (direction.x === -last.x && direction.y === -last.y)) return false;
    this.turns.push(direction);
    return true;
  }

  resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    const aspect = width / height;
    this.camera.aspect = aspect;
    const verticalHalf = THREE.MathUtils.degToRad(CAMERA_FOV) / 2;
    const horizontalHalf = Math.atan(Math.tan(verticalHalf) * aspect);
    this.distanceFactor = 1 / Math.sin(Math.min(verticalHalf, horizontalHalf));
    this.camera.updateProjectionMatrix();
    this.render();
  }

  run() {
    if (this.frame) return;
    this.lastTime = 0;
    const loop = (now: number) => {
      this.frame = requestAnimationFrame(loop);
      const dt = this.lastTime ? Math.min((now - this.lastTime) / 1000, 0.05) : 0;
      this.lastTime = now;
      this.tick(dt);
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
        if (this.packetMaterials.includes(material as THREE.MeshBasicMaterial)) continue;
        material.dispose();
      }
    });
    for (const material of this.packetMaterials) {
      material.map?.dispose();
      material.dispose();
    }
    for (const item of this.disposables) item.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }

  private stepDuration() {
    return this.state === "ready" ? ATTRACT_STEP : Math.max(STEP_MIN, STEP_START - this.score * STEP_DECAY);
  }

  private tick(dt: number) {
    this.time += dt;
    if (this.state === "playing") this.updateSudo(dt);

    if (this.state === "playing" || this.state === "ready") {
      this.accumulator += dt;
      while (this.accumulator >= this.stepDuration()) {
        this.accumulator -= this.stepDuration();
        this.advance();
        if (this.state !== "playing" && this.state !== "ready") break;
      }
    }

    this.shake = Math.max(0, this.shake - dt * SHAKE_DECAY);
    this.eatPulse = Math.max(0, this.eatPulse - dt * EAT_PULSE_DECAY);
    this.rippleTime += dt;
    this.render(dt);
  }

  private reset() {
    this.size = BOARD_START;
    this.originX = this.originZ = 0.5 - BOARD_START / 2;
    this.growths = 0;
    this.growFlash = false;
    this.animateBoard();
    const middle = Math.floor(this.size / 2);
    this.snake = [];
    for (let i = 0; i < START_LENGTH; i++) this.snake.push({ x: middle - i, y: middle });
    this.previous = this.snake.map((cell) => ({ ...cell }));
    this.direction = DIRECTIONS.right;
    this.turns = [];
    this.score = 0;
    this.accumulator = 0;
    this.headYaw = 0;
    this.eatPulse = 0;
    this.headGrow = 1;
    this.sudoToken = null;
    this.sudoTime = 0;
    this.sudoSeconds = 0;
    this.bonus = [];
    this.headMaterial.color.setHex(HEAD_COLOR);
    this.headMaterial.emissive.setHex(HEAD_GLOW);
    this.spawnFood();
    this.paintBody();
  }

  private advance() {
    if (this.state === "ready") this.direction = this.autopilot();
    else if (this.turns.length) this.direction = this.turns.shift()!;

    const head = this.snake[0];
    const sudo = this.sudoTime > 0;
    const next = { x: head.x + this.direction.x, y: head.y + this.direction.y };
    if (sudo) {
      next.x = (next.x + this.size) % this.size;
      next.y = (next.y + this.size) % this.size;
    }
    const eatingFood = next.x === this.food.x && next.y === this.food.y;
    const bonusIndex = this.bonus.findIndex((packet) => packet.x === next.x && packet.y === next.y);
    const eating = eatingFood || bonusIndex >= 0;
    if (!sudo && this.blocked(next, eating)) {
      this.crash();
      return;
    }

    const previous = this.snake.map((cell) => ({ ...cell }));
    this.snake.unshift(next);
    if (eating) previous.push({ ...previous[previous.length - 1] });
    else this.snake.pop();
    this.previous = previous;

    if (bonusIndex >= 0) this.eatBonus(bonusIndex);
    if (eatingFood) this.eat();
    const arrived = this.snake[0];
    if (this.sudoToken && this.sudoToken.x === arrived.x && this.sudoToken.y === arrived.y) this.startSudo();
  }

  private blocked(cell: Cell, growing: boolean) {
    if (cell.x < 0 || cell.y < 0 || cell.x >= this.size || cell.y >= this.size) return true;
    const checked = growing ? this.snake.length : this.snake.length - 1;
    for (let i = 0; i < checked; i++) {
      if (this.snake[i].x === cell.x && this.snake[i].y === cell.y) return true;
    }
    return false;
  }

  private freeNeighbours(cell: Cell) {
    let free = 0;
    for (const direction of Object.values(DIRECTIONS)) {
      if (!this.blocked({ x: cell.x + direction.x, y: cell.y + direction.y }, false)) free++;
    }
    return free;
  }

  private autopilot() {
    const head = this.snake[0];
    let best: Cell = this.direction;
    let bestCost = Infinity;
    for (const direction of Object.values(DIRECTIONS)) {
      if (direction.x === -this.direction.x && direction.y === -this.direction.y) continue;
      const next = { x: head.x + direction.x, y: head.y + direction.y };
      const eating = next.x === this.food.x && next.y === this.food.y;
      if (this.blocked(next, eating)) continue;
      let cost = Math.abs(next.x - this.food.x) + Math.abs(next.y - this.food.y);
      if (this.freeNeighbours(next) <= 1) cost += this.size;
      if (direction !== this.direction) cost += 0.5;
      if (cost < bestCost) {
        bestCost = cost;
        best = direction;
      }
    }
    return best;
  }

  private burst(cell: Cell) {
    this.ripple.position.x = cell.x + this.originX;
    this.ripple.position.z = cell.y + this.originZ;
    this.rippleTime = 0;
    this.eatPulse = 1;
  }

  private addPoint() {
    this.score++;
    this.callbacks.onScore(this.score);
    this.callbacks.onEat?.(this.score);
    if (this.score % BOARD_GROW_EVERY === 0) this.growBoard();
  }

  private growBoard() {
    if (this.size >= BOARD_MAX) return;
    const leading = this.growths % 2 === 1;
    this.growths++;
    if (leading) {
      const shift = (cell: Cell) => {
        cell.x++;
        cell.y++;
      };
      this.snake.forEach(shift);
      this.previous.forEach(shift);
      this.bonus.forEach(shift);
      shift(this.food);
      if (this.sudoToken) shift(this.sudoToken);
      this.originX--;
      this.originZ--;
    }
    this.size++;
    this.growColumn = this.growRow = leading ? 0 : this.size - 1;
    this.growFlash = true;
    this.shake = Math.max(this.shake, BOARD_GROW_SHAKE);
    this.animateBoard();
    this.callbacks.onGrow?.(this.size);
  }

  private boardBounds(): Bounds {
    return { minX: this.originX - 0.5, maxX: this.originX + this.size - 0.5, minZ: this.originZ - 0.5, maxZ: this.originZ + this.size - 0.5 };
  }

  private animateBoard() {
    this.boundsFrom = { ...this.bounds };
    this.growTime = 0;
  }

  private updateBoard(dt: number) {
    this.growTime = Math.min(BOARD_GROW_DURATION, this.growTime + dt);
    const progress = this.growTime / BOARD_GROW_DURATION;
    const eased = easeOutBack(progress);
    const target = this.boardBounds();
    const from = this.boundsFrom;
    const bounds = this.bounds;
    bounds.minX = THREE.MathUtils.lerp(from.minX, target.minX, eased);
    bounds.maxX = THREE.MathUtils.lerp(from.maxX, target.maxX, eased);
    bounds.minZ = THREE.MathUtils.lerp(from.minZ, target.minZ, eased);
    bounds.maxZ = THREE.MathUtils.lerp(from.maxZ, target.maxZ, eased);

    this.clipPlanes[0].constant = -bounds.minX;
    this.clipPlanes[1].constant = bounds.maxX;
    this.clipPlanes[2].constant = -bounds.minZ;
    this.clipPlanes[3].constant = bounds.maxZ;

    const width = bounds.maxX - bounds.minX;
    const depth = bounds.maxZ - bounds.minZ;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const [north, south, west, east] = this.walls;
    north.position.set(centerX, WALL_HEIGHT / 2, bounds.minZ - WALL_THICKNESS / 2);
    south.position.set(centerX, WALL_HEIGHT / 2, bounds.maxZ + WALL_THICKNESS / 2);
    north.scale.x = south.scale.x = width + WALL_THICKNESS * 2;
    west.position.set(bounds.minX - WALL_THICKNESS / 2, WALL_HEIGHT / 2, centerZ);
    east.position.set(bounds.maxX + WALL_THICKNESS / 2, WALL_HEIGHT / 2, centerZ);
    west.scale.z = east.scale.z = depth;

    const flash = this.growFlash ? 1 - progress : 0;
    this.wallMaterial.color.setHex(NEON_PINK).lerp(this.white, flash);
    this.stripMaterial.opacity = flash * STRIP_OPACITY;
    const [column, row] = this.growStrips;
    column.visible = row.visible = flash > 0;
    column.position.set(this.growColumn + this.originX, 0.015, centerZ);
    column.scale.set(1, depth, 1);
    row.position.set(centerX, 0.015, this.growRow + this.originZ);
    row.scale.set(width, 1, 1);
  }

  private eat() {
    this.burst(this.food);

    if (this.state === "playing") {
      this.addPoint();
    } else if (this.snake.length > BOARD_START * 2) {
      this.reset();
      return;
    }

    this.spawnFood();
    this.paintBody();
    if (this.state === "playing" && !this.sudoToken && this.sudoTime <= 0 && Math.random() < SUDO_CHANCE) this.spawnSudoToken();
  }

  private eatBonus(index: number) {
    const [packet] = this.bonus.splice(index, 1);
    this.burst(packet);
    this.addPoint();
    this.paintBody();
  }

  private spawnSudoToken() {
    const cell = this.freeCell();
    if (!cell) return;
    this.sudoToken = cell;
    this.sudoTokenTime = SUDO_TOKEN_LIFETIME;
  }

  private startSudo() {
    this.burst(this.sudoToken!);
    this.sudoToken = null;
    this.sudoTime = SUDO_DURATION;
    this.sudoSpawnTimer = 0;
    this.segmentMaterials = [];
    this.sudoSeconds = SUDO_DURATION;
    this.callbacks.onSudo?.(SUDO_DURATION);
  }

  private updateSudo(dt: number) {
    if (this.sudoToken) {
      this.sudoTokenTime -= dt;
      if (this.sudoTokenTime <= 0) this.sudoToken = null;
    }
    if (this.sudoTime <= 0) return;

    this.sudoTime = Math.max(0, this.sudoTime - dt);
    if (this.sudoTime <= 0) {
      this.bonus = [];
      this.sudoSeconds = 0;
      this.callbacks.onSudo?.(0);
      return;
    }

    const seconds = Math.ceil(this.sudoTime);
    if (seconds !== this.sudoSeconds) {
      this.sudoSeconds = seconds;
      this.callbacks.onSudo?.(seconds);
    }

    this.sudoSpawnTimer -= dt;
    if (this.sudoSpawnTimer > 0 || this.bonus.length >= SUDO_MAX_PACKETS) return;
    this.sudoSpawnTimer = SUDO_SPAWN_INTERVAL;
    const cell = this.freeCell();
    if (cell) this.bonus.push({ ...cell, born: this.time, material: this.randomPacketMaterial() });
  }

  private crash() {
    this.previous = this.snake.map((cell) => ({ ...cell }));
    this.accumulator = 0;

    if (this.state === "ready") {
      this.reset();
      return;
    }

    this.state = "over";
    this.shake = 1;
    this.headMaterial.color.setHex(CRASH_COLOR);
    this.headMaterial.emissive.setHex(CRASH_GLOW);
    this.callbacks.onGameOver(this.score);
  }

  private freeCell(): Cell | null {
    const occupied = new Set([...this.snake, this.food, ...this.bonus, ...(this.sudoToken ? [this.sudoToken] : [])].map((cell) => cell.y * this.size + cell.x));
    const free: number[] = [];
    for (let index = 0; index < this.size * this.size; index++) if (!occupied.has(index)) free.push(index);
    if (!free.length) return null;
    const index = free[Math.floor(Math.random() * free.length)];
    return { x: index % this.size, y: Math.floor(index / this.size) };
  }

  private spawnFood() {
    const cell = this.freeCell();
    if (!cell) {
      this.crash();
      return;
    }
    this.food = cell;
    this.packet.material = this.randomPacketMaterial();
  }

  private updateSparks(dt: number, emitting: boolean) {
    if (emitting && dt) {
      this.sparkTimer -= dt;
      while (this.sparkTimer <= 0) {
        this.sparkTimer += SPARK_INTERVAL;
        const spark = this.sparks[this.nextSpark];
        this.nextSpark = (this.nextSpark + 1) % SPARK_COUNT;
        spark.x = this.head.position.x + (Math.random() - 0.5) * 0.7;
        spark.y = 0.2 + Math.random() * 0.4;
        spark.z = this.head.position.z + (Math.random() - 0.5) * 0.7;
        spark.vx = (Math.random() - 0.5) * 0.8;
        spark.vy = 0.6 + Math.random() * 0.8;
        spark.vz = (Math.random() - 0.5) * 0.8;
        spark.born = this.time;
      }
    } else {
      this.sparkTimer = 0;
    }

    for (let i = 0; i < SPARK_COUNT; i++) {
      const spark = this.sparks[i];
      const age = this.time - spark.born;
      if (age >= SPARK_LIFE) {
        this.sparkMesh.setMatrixAt(i, this.hiddenMatrix);
        continue;
      }
      this.dummy.position.set(spark.x + spark.vx * age, spark.y + spark.vy * age, spark.z + spark.vz * age);
      this.dummy.rotation.set(age * 6, age * 4, 0);
      this.dummy.scale.setScalar(1 - age / SPARK_LIFE);
      this.dummy.updateMatrix();
      this.sparkMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.dummy.rotation.set(0, 0, 0);
    this.sparkMesh.instanceMatrix.needsUpdate = true;
  }

  private iconSegment(index: number) {
    let mesh = this.iconSegments[index];
    if (!mesh) {
      mesh = new THREE.Mesh(this.body.geometry);
      this.iconSegments[index] = mesh;
      this.scene.add(mesh);
    }
    mesh.material = this.segmentMaterials[index] ??= this.randomPacketMaterial();
    return mesh;
  }

  private randomPacketMaterial() {
    return this.packetMaterials[Math.floor(Math.random() * this.packetMaterials.length)];
  }

  private paintBody() {
    const segments = this.snake.length - 1;
    for (let i = 0; i < segments; i++) {
      const t = segments > 1 ? i / (segments - 1) : 0;
      this.color.setHex(NEON_CYAN).lerp(this.tailColor, t);
      this.body.setColorAt(i, this.color);
    }
    if (this.body.instanceColor) this.body.instanceColor.needsUpdate = true;
  }

  private render(dt = 0) {
    const alpha = Math.min(1, this.accumulator / this.stepDuration());
    this.updateBoard(dt);
    const ox = this.originX;
    const oz = this.originZ;
    const blend = (from: Cell, to: Cell) => (Math.abs(to.x - from.x) + Math.abs(to.y - from.y) > 1 ? 1 : alpha);

    const headFrom = this.previous[0] ?? this.snake[0];
    const headTo = this.snake[0];
    const headBlend = blend(headFrom, headTo);
    this.head.position.set(THREE.MathUtils.lerp(headFrom.x, headTo.x, headBlend) + ox, 0, THREE.MathUtils.lerp(headFrom.y, headTo.y, headBlend) + oz);
    const targetYaw = Math.atan2(-this.direction.y, this.direction.x);
    this.headYaw += shortestAngle(this.headYaw, targetYaw) * Math.min(1, dt * HEAD_TURN_RATE || 1);
    this.head.rotation.y = this.headYaw;

    const sudo = this.sudoTime > 0 && this.state !== "over";
    const root = sudo && (this.sudoTime > SUDO_WARNING || Math.sin(this.time * 24) > 0);
    this.headGrow += ((sudo ? SUDO_HEAD_SCALE : 1) - this.headGrow) * Math.min(1, dt * SUDO_GROW_RATE || 1);
    this.head.scale.setScalar(this.headGrow * (1 + this.eatPulse * 0.22));
    this.headBox.visible = !root;
    this.sudoBox.visible = this.sudoFace.visible = root;
    this.eyeMaterial.color.setHex(root ? SUDO_EYES : NIGHT);
    if (root && this.time - this.matrixDrawn >= MATRIX_REFRESH) {
      this.matrixDrawn = this.time;
      drawMatrix(this.matrix, this.matrixDrops);
      this.matrixTexture.needsUpdate = true;
    }

    this.aura.visible = sudo;
    if (sudo) {
      const pulse = Math.sin(this.time * 6);
      this.aura.position.x = this.head.position.x;
      this.aura.position.z = this.head.position.z;
      this.aura.material.opacity = 0.35 + pulse * 0.15;
      this.aura.scale.setScalar(this.headGrow * (1 + pulse * 0.08));
    }
    this.updateSparks(dt, sudo);

    const segments = this.snake.length - 1;
    for (let i = 0; i < segments; i++) {
      const from = this.previous[i + 1] ?? this.snake[i + 1];
      const to = this.snake[i + 1];
      const segmentBlend = blend(from, to);
      const t = segments > 1 ? i / (segments - 1) : 0;
      const scale = 1 - t * TAIL_SHRINK;
      this.dummy.position.set(THREE.MathUtils.lerp(from.x, to.x, segmentBlend) + ox, (SEGMENT_HEIGHT * scale) / 2, THREE.MathUtils.lerp(from.y, to.y, segmentBlend) + oz);
      this.dummy.scale.set(scale, scale, scale);
      if (root) {
        const icon = this.iconSegment(i);
        icon.position.copy(this.dummy.position);
        icon.scale.copy(this.dummy.scale);
        icon.visible = true;
      } else {
        this.dummy.updateMatrix();
        this.body.setMatrixAt(i, this.dummy.matrix);
      }
    }
    for (let i = root ? segments : 0; i < this.iconSegments.length; i++) this.iconSegments[i].visible = false;
    this.body.count = root ? 0 : segments;
    this.body.instanceMatrix.needsUpdate = true;

    const foodX = this.food.x + ox;
    const foodZ = this.food.y + oz;
    this.packet.position.set(foodX, PACKET_HEIGHT + Math.sin(this.time * 3) * 0.08, foodZ);
    this.packet.rotation.set(0.35, this.time * PACKET_SPIN, 0.2);
    this.packetGlow.position.x = foodX;
    this.packetGlow.position.z = foodZ;
    this.packetGlow.material.opacity = 0.4 + Math.sin(this.time * 4) * 0.12;

    for (let i = 0; i < SUDO_MAX_PACKETS; i++) {
      const mesh = this.bonusMeshes[i];
      const packet = this.bonus[i];
      mesh.visible = !!packet;
      if (!packet) continue;
      mesh.material = packet.material;
      mesh.position.set(packet.x + ox, PACKET_HEIGHT + Math.sin(this.time * 3 + i) * 0.08, packet.y + oz);
      mesh.rotation.set(0.35, this.time * PACKET_SPIN + i, 0.2);
      mesh.scale.setScalar(Math.min(1, (this.time - packet.born) / PACKET_POP_DURATION));
    }

    const token = this.sudoToken;
    const tokenVisible = !!token && (this.sudoTokenTime > SUDO_TOKEN_BLINK || Math.sin(this.time * 16) > 0);
    this.token.visible = this.tokenGlow.visible = tokenVisible;
    if (token) {
      if (this.time - this.terminalDrawn >= TERMINAL_REFRESH) {
        this.terminalDrawn = this.time;
        drawTerminal(this.terminal, this.time);
        this.terminalTexture.needsUpdate = true;
      }
      this.token.position.set(token.x + ox, PACKET_HEIGHT + Math.sin(this.time * 5) * 0.12, token.y + oz);
      this.token.rotation.set(0.35, -this.time * PACKET_SPIN * 1.5, 0.2);
      this.tokenGlow.position.x = token.x + ox;
      this.tokenGlow.position.z = token.y + oz;
      this.tokenGlow.material.opacity = 0.5 + Math.sin(this.time * 8) * 0.2;
    }

    const ripple = Math.min(1, this.rippleTime / RIPPLE_DURATION);
    this.ripple.visible = ripple < 1;
    this.ripple.scale.setScalar(1 + ripple * RIPPLE_GROWTH);
    this.ripple.material.opacity = 1 - ripple;

    const shakeX = this.shake ? (Math.random() - 0.5) * this.shake * 0.5 : 0;
    const shakeZ = this.shake ? (Math.random() - 0.5) * this.shake * 0.5 : 0;
    const zoomProgress = THREE.MathUtils.clamp((this.score - ZOOM_START_SCORE) / (ZOOM_END_SCORE - ZOOM_START_SCORE), 0, 1);
    const targetZoom = 1 + ZOOM_EXTRA * zoomProgress;
    const zoomEase = dt ? Math.min(1, dt * ZOOM_EASE) : 1;
    const followEase = dt ? Math.min(1, dt * FOLLOW_EASE) : 1;
    this.cameraZoom += (targetZoom - this.cameraZoom) * zoomEase;
    const bounds = this.bounds;
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerZ = (bounds.minZ + bounds.maxZ) / 2;
    const follow = 1 - 1 / this.cameraZoom;
    this.cameraFocus.set(centerX + (this.head.position.x - centerX) * follow, 0, centerZ + (this.head.position.z - centerZ) * follow);
    this.cameraTarget.lerp(this.cameraFocus, followEase);

    const radius = (Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2 + BOARD_MARGIN) * BOARD_FIT;
    const distance = (radius * this.distanceFactor) / this.cameraZoom;
    this.camera.position.set(this.cameraTarget.x + shakeX, Math.sin(CAMERA_TILT) * distance, this.cameraTarget.z + Math.cos(CAMERA_TILT) * distance + shakeZ);
    this.camera.lookAt(this.cameraTarget);

    this.renderer.render(this.scene, this.camera);
  }
}
