// homedock-ui/vue3/static/js/__Games__/PacketSnake/snakeSound.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const EAT_BASE_FREQUENCY = 520;
const EAT_PITCH_STEPS = 24;
const EAT_VOLUME = 0.1;
const TURN_VOLUME = 0.025;
const CRASH_VOLUME = 0.18;
const SUDO_VOLUME = 0.06;
const GROW_VOLUME = 0.05;

export class SnakeSound {
  private context = new AudioContext();
  private master: GainNode;

  constructor() {
    this.master = this.context.createGain();
    this.master.connect(this.context.destination);
  }

  resume() {
    this.context.resume().catch(() => {});
  }

  eat(score: number) {
    const now = this.context.currentTime;
    const base = EAT_BASE_FREQUENCY * Math.pow(2, Math.min(score, EAT_PITCH_STEPS) / EAT_PITCH_STEPS);
    [1, 1.5].forEach((ratio, index) => this.blip("triangle", base * ratio, now + index * 0.05, 0.12, EAT_VOLUME));
  }

  turn() {
    this.blip("square", 180, this.context.currentTime, 0.03, TURN_VOLUME);
  }

  sudo() {
    const now = this.context.currentTime;
    [392, 523, 659, 784, 1047].forEach((frequency, index) => this.blip("square", frequency, now + index * 0.06, 0.14, SUDO_VOLUME));
  }

  sudoEnd() {
    const now = this.context.currentTime;
    [659, 440].forEach((frequency, index) => this.blip("square", frequency, now + index * 0.09, 0.16, SUDO_VOLUME));
  }

  grow() {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(140, now);
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.35);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(GROW_VOLUME, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.47);
    [1319, 1760].forEach((frequency, index) => this.blip("triangle", frequency, now + 0.3 + index * 0.07, 0.15, EAT_VOLUME));
  }

  crash() {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(220, now);
    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.45);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(CRASH_VOLUME, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.52);
  }

  dispose() {
    this.context.close().catch(() => {});
  }

  private blip(type: OscillatorType, frequency: number, start: number, length: number, volume: number) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
  }
}
