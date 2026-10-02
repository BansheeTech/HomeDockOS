// homedock-ui/vue3/static/js/__Games__/NeonRush/engineSound.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

const GEAR_TOPS = [14, 26, 40, 56, 76, 104, 200];
const IDLE_FREQUENCY = 38;
const REDLINE_FREQUENCY = 350;
const ENGINE_VOLUME = 0.05;
const TURBO_VOLUME = 0.05;
const REPAIR_VOLUME = 0.06;
const REPAIR_FREQUENCY = 800;
const REPAIR_SWEEP_DEPTH = 450;
const REPAIR_SWEEP_RATE = 8;
const SKID_VOLUME = 0.07;
const TOFU_VOLUME = 0.12;
const TOFU_CHIME = [
  [1318.5, 0],
  [1046.5, 0.16],
];
const TOFU_PARTIALS = [
  [1, 1],
  [2.76, 0.3],
];
const SKID_FREQUENCY = 1700;
const SMOOTHING = 0.06;

function distortionCurve(amount: number) {
  const samples = 128;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

function noiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function engineRpm(speed: number) {
  let floor = 0;
  for (const top of GEAR_TOPS) {
    if (speed <= top) return 0.28 + 0.72 * Math.max(0, (speed - floor) / (top - floor));
    floor = top;
  }
  return 1;
}

export class EngineSound {
  private context: AudioContext;
  private master: GainNode;
  private engineGain: GainNode;
  private turboGain: GainNode;
  private primary: OscillatorNode;
  private secondary: OscillatorNode;
  private filter: BiquadFilterNode;
  private turboFilter: BiquadFilterNode;
  private turbo: AudioBufferSourceNode;
  private skid: AudioBufferSourceNode;
  private skidFilter: BiquadFilterNode;
  private skidGain: GainNode;
  private repairOscillator: OscillatorNode | null = null;
  private repairLfo: OscillatorNode | null = null;
  private repairLfoGain: GainNode | null = null;
  private repairGain: GainNode | null = null;

  constructor() {
    this.context = new AudioContext();
    const context = this.context;

    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);

    this.engineGain = context.createGain();
    this.engineGain.gain.value = ENGINE_VOLUME;

    this.filter = context.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.Q.value = 4;

    const shaper = context.createWaveShaper();
    shaper.curve = distortionCurve(18);
    shaper.oversample = "2x";

    this.primary = context.createOscillator();
    this.primary.type = "sawtooth";
    this.secondary = context.createOscillator();
    this.secondary.type = "square";
    const secondaryGain = context.createGain();
    secondaryGain.gain.value = 0.45;

    this.primary.connect(shaper);
    this.secondary.connect(secondaryGain).connect(shaper);
    shaper.connect(this.filter).connect(this.engineGain).connect(this.master);

    this.turbo = context.createBufferSource();
    this.turbo.buffer = noiseBuffer(context);
    this.turbo.loop = true;
    this.turboFilter = context.createBiquadFilter();
    this.turboFilter.type = "bandpass";
    this.turboFilter.frequency.value = 2400;
    this.turboFilter.Q.value = 1.2;
    this.turboGain = context.createGain();
    this.turboGain.gain.value = 0;
    this.turbo.connect(this.turboFilter).connect(this.turboGain).connect(this.master);

    this.skid = context.createBufferSource();
    this.skid.buffer = this.turbo.buffer;
    this.skid.loop = true;
    this.skidFilter = context.createBiquadFilter();
    this.skidFilter.type = "bandpass";
    this.skidFilter.frequency.value = SKID_FREQUENCY;
    this.skidFilter.Q.value = 9;
    this.skidGain = context.createGain();
    this.skidGain.gain.value = 0;
    this.skid.connect(this.skidFilter).connect(this.skidGain).connect(this.master);

    this.primary.start();
    this.secondary.start();
    this.turbo.start();
    this.skid.start(0, 0.7);
    this.update(0, false, false, false);
  }

  update(speed: number, boosting: boolean, offroad: boolean, drifting: boolean) {
    const now = this.context.currentTime;
    const rpm = engineRpm(speed);
    const frequency = IDLE_FREQUENCY + rpm * (REDLINE_FREQUENCY - IDLE_FREQUENCY);
    const rumble = offroad ? 0.92 + Math.random() * 0.16 : 1;

    this.primary.frequency.setTargetAtTime(frequency * rumble, now, SMOOTHING);
    this.secondary.frequency.setTargetAtTime(frequency * 0.5, now, SMOOTHING);
    this.filter.frequency.setTargetAtTime(420 + rpm * 1800 + (boosting ? 900 : 0), now, SMOOTHING);
    this.engineGain.gain.setTargetAtTime(ENGINE_VOLUME * (0.65 + rpm * 0.35), now, SMOOTHING);
    this.turboGain.gain.setTargetAtTime(boosting ? TURBO_VOLUME : 0, now, 0.12);
    this.turboFilter.frequency.setTargetAtTime(boosting ? 2400 + rpm * 1600 : 1800, now, 0.12);
    this.skidGain.gain.setTargetAtTime(drifting ? SKID_VOLUME : 0, now, drifting ? 0.03 : 0.1);
    this.skidFilter.frequency.setTargetAtTime(SKID_FREQUENCY * (0.9 + Math.random() * 0.2), now, 0.05);
  }

  pickup() {
    const now = this.context.currentTime;
    [660, 880, 1320].forEach((frequency, index) => {
      const start = now + index * 0.06;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
  }

  tofu() {
    const now = this.context.currentTime;
    for (const [frequency, delay] of TOFU_CHIME) {
      const start = now + delay;
      for (const [ratio, level] of TOFU_PARTIALS) {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency * ratio;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(TOFU_VOLUME * level, start + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.1);
        oscillator.connect(gain).connect(this.master);
        oscillator.start(start);
        oscillator.stop(start + 1.15);
      }
    }
  }

  collision() {
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(92, now);
    oscillator.frequency.exponentialRampToValueAtTime(38, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + 0.25);

    const noise = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const noiseGain = this.context.createGain();
    noise.buffer = this.turbo.buffer;
    noise.playbackRate.value = 0.65;
    filter.type = "lowpass";
    filter.frequency.value = 360;
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.1, now + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    noise.connect(filter).connect(noiseGain).connect(this.master);
    noise.start(now, Math.random() * 1.5, 0.11);
  }

  repair(active: boolean) {
    const now = this.context.currentTime;
    if (active) {
      if (this.repairOscillator) return;

      const oscillator = this.context.createOscillator();
      const lfo = this.context.createOscillator();
      const lfoGain = this.context.createGain();
      const gain = this.context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = REPAIR_FREQUENCY;
      lfo.type = "sine";
      lfo.frequency.value = REPAIR_SWEEP_RATE;
      lfoGain.gain.value = REPAIR_SWEEP_DEPTH;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setTargetAtTime(REPAIR_VOLUME, now, 0.035);
      lfo.connect(lfoGain).connect(oscillator.frequency);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      lfo.start(now);
      this.repairOscillator = oscillator;
      this.repairLfo = lfo;
      this.repairLfoGain = lfoGain;
      this.repairGain = gain;
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      };
      return;
    }

    if (!this.repairOscillator || !this.repairLfo || !this.repairGain) return;
    this.repairGain.gain.cancelScheduledValues(now);
    this.repairGain.gain.setTargetAtTime(0.0001, now, 0.03);
    this.repairOscillator.stop(now + 0.16);
    this.repairLfo.stop(now + 0.16);
    this.repairOscillator = null;
    this.repairLfo = null;
    this.repairLfoGain = null;
    this.repairGain = null;
  }

  setRunning(running: boolean) {
    const now = this.context.currentTime;
    if (running) {
      this.context.resume().catch(() => {});
      this.master.gain.setTargetAtTime(1, now, 0.15);
    } else {
      this.master.gain.setTargetAtTime(0, now, 0.08);
    }
  }

  dispose() {
    this.context.close().catch(() => {});
  }
}
