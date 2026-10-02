// homedock-ui/vue3/static/js/__Utils__/SpectrumEngine.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

export const SPECTRUM_COLUMNS = 128;
export const SPECTRUM_HUE_START = 200;
export const SPECTRUM_HUE_RANGE = 60;

const LEVEL_CURVE = 1.6;
const EDGE_TAPER = 12;

const MIN_FREQUENCY = 30;
const MAX_FREQUENCY = 16000;

const FADE_SPEED = 3;
const SILENCE_DECAY = 0.85;
const MAX_FRAME_TIME = 0.05;

const BASS_COLUMNS = 24;
const BASS_MEMORY = 1.2;
const PULSE_GAIN = 2.5;
const PULSE_RELEASE = 4;

function smoothstep(value: number, edge0: number, edge1: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export abstract class SpectrumEngine {
  onPulse: ((pulse: number) => void) | null = null;

  protected canvas: HTMLCanvasElement;
  protected spectrum = new Float32Array(SPECTRUM_COLUMNS);
  protected fade = 0;

  private analyser: AnalyserNode | null = null;
  private frequencies = new Uint8Array(0);
  private bins = new Float32Array(SPECTRUM_COLUMNS);
  private binStarts = new Uint16Array(SPECTRUM_COLUMNS);
  private binEnds = new Uint16Array(SPECTRUM_COLUMNS);
  private raw = new Float32Array(SPECTRUM_COLUMNS);
  private taper = Float32Array.from({ length: SPECTRUM_COLUMNS }, (_, column) => smoothstep(Math.min(column, SPECTRUM_COLUMNS - 1 - column), 0, EDGE_TAPER));
  private playing = false;
  private bassFloor = 0;
  private pulse = 0;
  private frame = 0;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  owns(canvas: HTMLCanvasElement) {
    return this.canvas === canvas;
  }

  play(analyser: AnalyserNode) {
    if (this.analyser !== analyser) {
      this.analyser = analyser;
      this.frequencies = new Uint8Array(analyser.frequencyBinCount);

      const binWidth = analyser.context.sampleRate / 2 / analyser.frequencyBinCount;
      const binAt = (column: number) => Math.min(analyser.frequencyBinCount - 1, (MIN_FREQUENCY * Math.pow(MAX_FREQUENCY / MIN_FREQUENCY, column / (SPECTRUM_COLUMNS - 1))) / binWidth);
      for (let column = 0; column < SPECTRUM_COLUMNS; column++) {
        this.bins[column] = binAt(column);
        this.binStarts[column] = Math.ceil(binAt(column - 0.5));
        this.binEnds[column] = Math.floor(binAt(column + 0.5));
      }
    }
    this.playing = true;
    this.start();
  }

  pause() {
    this.playing = false;
  }

  dispose() {
    this.stop();
    this.onPulse?.(0);
    this.onPulse = null;
    this.analyser = null;
    this.release();
  }

  protected abstract advance(dt: number): void;
  protected abstract render(): void;
  protected abstract reset(): void;
  protected abstract release(): void;

  private start() {
    if (this.frame) return;

    this.lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(MAX_FRAME_TIME, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.frame = requestAnimationFrame(loop);
      this.update(dt);
      this.render();
      if (!this.playing && this.fade === 0) {
        this.spectrum.fill(0);
        this.bassFloor = 0;
        this.pulse = 0;
        this.onPulse?.(0);
        this.reset();
        this.stop();
      }
    };
    this.frame = requestAnimationFrame(loop);
  }

  private stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private update(dt: number) {
    this.fade = this.playing ? Math.min(1, this.fade + FADE_SPEED * dt) : Math.max(0, this.fade - FADE_SPEED * dt);
    this.readSpectrum();
    this.updatePulse(dt);
    this.advance(dt);
  }

  private readSpectrum() {
    if (!this.playing || !this.analyser) {
      for (let column = 0; column < SPECTRUM_COLUMNS; column++) this.spectrum[column] *= SILENCE_DECAY;
      return;
    }

    this.analyser.getByteFrequencyData(this.frequencies);
    for (let column = 0; column < SPECTRUM_COLUMNS; column++) {
      const start = this.binStarts[column];
      const end = this.binEnds[column];
      let value = 0;

      if (end > start) {
        for (let bin = start; bin <= end; bin++) value += this.frequencies[bin];
        value /= end - start + 1;
      } else {
        const bin = this.bins[column];
        const low = Math.floor(bin);
        const high = Math.min(low + 1, this.frequencies.length - 1);
        value = this.frequencies[low] + (this.frequencies[high] - this.frequencies[low]) * (bin - low);
      }

      this.raw[column] = Math.pow(value / 255, LEVEL_CURVE);
    }

    for (let column = 0; column < SPECTRUM_COLUMNS; column++) {
      const left = this.raw[Math.max(0, column - 1)];
      const right = this.raw[Math.min(SPECTRUM_COLUMNS - 1, column + 1)];
      this.spectrum[column] = (left + this.raw[column] * 2 + right) * 0.25 * this.taper[column];
    }
  }

  private updatePulse(dt: number) {
    let bass = 0;
    if (this.playing) {
      for (let column = 0; column < BASS_COLUMNS; column++) bass += this.raw[column];
      bass /= BASS_COLUMNS;
    }

    this.bassFloor += (bass - this.bassFloor) * Math.min(1, dt / BASS_MEMORY);
    const kick = Math.max(0, bass - this.bassFloor) / Math.max(0.05, 1 - this.bassFloor);
    this.pulse = Math.max(Math.min(1, kick * PULSE_GAIN), this.pulse - PULSE_RELEASE * dt);
    this.onPulse?.(this.pulse * this.fade);
  }
}
