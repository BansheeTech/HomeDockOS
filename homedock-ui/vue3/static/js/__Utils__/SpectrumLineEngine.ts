// homedock-ui/vue3/static/js/__Utils__/SpectrumLineEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

import { SpectrumEngine, SPECTRUM_COLUMNS, SPECTRUM_HUE_START, SPECTRUM_HUE_RANGE } from "./SpectrumEngine";

const LINE_HEIGHT = 0.55;
const LINE_WIDTH = 2;
const FILL_ALPHA = 0.18;
const GRADIENT_STOPS = 4;
const MAX_PIXEL_RATIO = 2;

export class SpectrumLineEngine extends SpectrumEngine {
  private context: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private gradient: CanvasGradient | null = null;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas is not available");
    this.context = context;
  }

  protected advance() {
    this.fitCanvas();
  }

  protected render() {
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.fade === 0 || !this.gradient) return;

    context.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);

    const area = new Path2D();
    this.trace(area);
    area.lineTo(this.width, this.height);
    area.lineTo(0, this.height);
    area.closePath();
    context.globalAlpha = this.fade * FILL_ALPHA;
    context.fillStyle = this.gradient;
    context.fill(area);

    const line = new Path2D();
    this.trace(line);
    context.globalAlpha = this.fade;
    context.strokeStyle = this.gradient;
    context.lineWidth = LINE_WIDTH;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke(line);
  }

  protected reset() {}

  protected release() {
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private trace(path: Path2D) {
    const step = this.width / (SPECTRUM_COLUMNS - 1);
    const floor = this.height - LINE_WIDTH;
    const reach = this.height * LINE_HEIGHT;
    const y = (column: number) => floor - this.spectrum[column] * reach;

    path.moveTo(0, y(0));
    for (let column = 1; column < SPECTRUM_COLUMNS - 1; column++) {
      path.quadraticCurveTo(column * step, y(column), (column + 0.5) * step, (y(column) + y(column + 1)) / 2);
    }
    path.lineTo(this.width, y(SPECTRUM_COLUMNS - 1));
  }

  private fitCanvas() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    if (width === this.width && height === this.height && ratio === this.ratio) return;

    this.width = width;
    this.height = height;
    this.ratio = ratio;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);

    this.gradient = this.context.createLinearGradient(0, 0, width, 0);
    for (let stop = 0; stop <= GRADIENT_STOPS; stop++) {
      const u = stop / GRADIENT_STOPS;
      this.gradient.addColorStop(u, `hsl(${SPECTRUM_HUE_START + u * SPECTRUM_HUE_RANGE}, 80%, 55%)`);
    }
  }
}
