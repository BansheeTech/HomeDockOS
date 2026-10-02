// homedock-ui/vue3/static/js/__Games__/PacketSnake/chiptune.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

type MelodyNote = [step: number, midi: number, length: number];

interface Chord {
  bass: number;
  stab: number[];
}

const BPM = 150;
const POINTS_PER_BPM = 2;
const MAX_BPM = 240;
const TEMPO_EASE = 0.08;
const STEPS_PER_BAR = 16;
const LOOKAHEAD = 0.12;
const SCHEDULE_INTERVAL = 25;
const MASTER_VOLUME = 0.4;
const FADE_IN = 0.15;
const LEAD_VOLUME = 0.16;
const STAB_VOLUME = 0.035;
const BASS_VOLUME = 0.3;
const GATE = 0.8;
const LEAD_DUTY = 0.25;
const STAB_DUTY = 0.125;
const TRANSPOSE = -6;

const C_MAJOR: Chord = { bass: 36, stab: [60, 64, 67] };
const B_FLAT: Chord = { bass: 34, stab: [58, 62, 65] };
const G_SEVENTH: Chord = { bass: 43, stab: [59, 62, 65] };
const F_MAJOR: Chord = { bass: 41, stab: [60, 65, 69] };
const E_MINOR: Chord = { bass: 40, stab: [59, 64, 67] };
const A_MINOR: Chord = { bass: 45, stab: [60, 64, 69] };

const CHORDS: Chord[] = [C_MAJOR, C_MAJOR, B_FLAT, G_SEVENTH, C_MAJOR, C_MAJOR, B_FLAT, C_MAJOR, F_MAJOR, G_SEVENTH, E_MINOR, A_MINOR, F_MAJOR, G_SEVENTH, F_MAJOR, G_SEVENTH];

const A_CALL: MelodyNote[] = [
  [0, 72, 2],
  [2, 76, 2],
  [4, 79, 3],
  [8, 76, 2],
  [10, 79, 2],
  [12, 81, 2],
  [14, 79, 2],
];
const A_ANSWER: MelodyNote[] = [
  [0, 76, 2],
  [2, 72, 2],
  [4, 74, 4],
  [10, 72, 2],
  [12, 70, 4],
];
const A_CLIMB: MelodyNote[] = [
  [0, 74, 2],
  [2, 77, 2],
  [4, 82, 3],
  [8, 81, 2],
  [10, 77, 2],
  [12, 74, 2],
  [14, 77, 2],
];
const A_OPEN: MelodyNote[] = [
  [0, 79, 6],
  [6, 77, 2],
  [8, 74, 2],
  [10, 71, 2],
  [12, 74, 4],
];
const A_CLOSE: MelodyNote[] = [
  [0, 79, 2],
  [2, 77, 2],
  [4, 76, 2],
  [6, 74, 2],
  [8, 72, 6],
];
const B_CALL: MelodyNote[] = [
  [0, 69, 2],
  [2, 72, 2],
  [4, 77, 2],
  [6, 72, 2],
  [8, 76, 2],
  [10, 77, 4],
  [14, 72, 2],
];
const B_ANSWER: MelodyNote[] = [
  [0, 74, 2],
  [2, 71, 2],
  [4, 79, 2],
  [6, 74, 2],
  [8, 77, 2],
  [10, 76, 2],
  [12, 74, 4],
];
const B_PEAK: MelodyNote[] = [
  [0, 76, 2],
  [2, 79, 2],
  [4, 83, 3],
  [8, 79, 2],
  [10, 76, 2],
  [12, 71, 4],
];
const B_REST: MelodyNote[] = [
  [0, 72, 6],
  [6, 71, 2],
  [8, 69, 8],
];
const B_WALK: MelodyNote[] = [
  [0, 77, 2],
  [2, 76, 2],
  [4, 74, 2],
  [6, 72, 2],
  [8, 74, 4],
  [12, 76, 4],
];
const B_TURN: MelodyNote[] = [
  [0, 79, 3],
  [3, 79, 3],
  [6, 79, 2],
  [8, 74, 2],
  [10, 77, 2],
  [12, 79, 4],
];

const MELODY: MelodyNote[][] = [A_CALL, A_ANSWER, A_CLIMB, A_OPEN, A_CALL, A_ANSWER, A_CLIMB, A_CLOSE, B_CALL, B_ANSWER, B_PEAK, B_REST, B_CALL, B_ANSWER, B_WALK, B_TURN];

const BASS_LINE = [0, null, 12, null, 0, null, 12, null, 0, null, 12, null, 7, null, 12, null];
const STAB_STEPS = [2, 6, 10, 14];

function frequency(midi: number) {
  return 440 * Math.pow(2, (midi + TRANSPOSE - 69) / 12);
}

export class ChiptuneMusic {
  private context = new AudioContext();
  private master: GainNode;
  private leadWave: PeriodicWave;
  private stabWave: PeriodicWave;
  private noise: AudioBuffer;
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  private bpm = BPM;
  private targetBpm = BPM;

  constructor() {
    const context = this.context;

    this.master = context.createGain();
    this.master.gain.value = 0;
    const tone = context.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 8000;
    this.master.connect(tone).connect(context.destination);

    this.leadWave = this.pulseWave(LEAD_DUTY);
    this.stabWave = this.pulseWave(STAB_DUTY);

    this.noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  play() {
    const now = this.context.currentTime;
    this.context.resume().catch(() => {});
    this.master.gain.setTargetAtTime(MASTER_VOLUME, now, FADE_IN);
    if (this.timer) return;
    this.nextTime = Math.max(this.nextTime, now + 0.05);
    this.timer = window.setInterval(this.schedule, SCHEDULE_INTERVAL);
    this.schedule();
  }

  pause() {
    window.clearInterval(this.timer);
    this.timer = 0;
    this.context.suspend().catch(() => {});
  }

  dispose() {
    this.pause();
    this.context.close().catch(() => {});
  }

  setScore(score: number) {
    this.targetBpm = Math.min(BPM + Math.floor(score / POINTS_PER_BPM), MAX_BPM);
  }

  private schedule = () => {
    while (this.nextTime < this.context.currentTime + LOOKAHEAD) {
      this.bpm += (this.targetBpm - this.bpm) * TEMPO_EASE;
      const step = 60 / this.bpm / 4;
      this.playStep(this.step, this.nextTime, step);
      this.step++;
      this.nextTime += step;
    }
  };

  private playStep(index: number, time: number, step: number) {
    const bar = Math.floor(index / STEPS_PER_BAR) % CHORDS.length;
    const beat = index % STEPS_PER_BAR;
    const chord = CHORDS[bar];

    const bassOffset = BASS_LINE[beat];
    if (bassOffset !== null) this.note(time, "triangle", chord.bass + bassOffset, step * 1.6, BASS_VOLUME);

    if (STAB_STEPS.includes(beat)) {
      for (const midi of chord.stab) this.note(time, this.stabWave, midi, step * 0.7, STAB_VOLUME);
    }

    if (beat === 0 || beat === 8) this.kick(time);
    if (beat === 4 || beat === 12) this.snare(time);
    if (beat % 2 === 0) this.hat(time, beat % 4 === 2 ? 0.06 : 0.03);

    for (const [start, midi, length] of MELODY[bar]) {
      if (start === beat) this.note(time, this.leadWave, midi, length * step * GATE, LEAD_VOLUME);
    }
  }

  private pulseWave(duty: number) {
    const harmonics = 64;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let k = 1; k < harmonics; k++) {
      real[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI);
      imag[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI);
    }
    return this.context.createPeriodicWave(real, imag);
  }

  private note(time: number, wave: OscillatorType | PeriodicWave, midi: number, length: number, volume: number) {
    const oscillator = this.context.createOscillator();
    if (wave instanceof PeriodicWave) oscillator.setPeriodicWave(wave);
    else oscillator.type = wave;
    oscillator.frequency.value = frequency(midi);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.003);
    gain.gain.setValueAtTime(volume, time + length - 0.012);
    gain.gain.linearRampToValueAtTime(0, time + length);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + length + 0.01);
  }

  private kick(time: number) {
    const oscillator = this.context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(180, time);
    oscillator.frequency.exponentialRampToValueAtTime(45, time + 0.07);
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(time);
    oscillator.stop(time + 0.13);
  }

  private snare(time: number) {
    this.burst(time, 1200, 0.18, 0.09);
  }

  private hat(time: number, volume: number) {
    this.burst(time, 7000, volume, 0.025);
  }

  private burst(time: number, cutoff: number, volume: number, length: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = cutoff;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(time, Math.random() * 0.5, length + 0.02);
  }
}
