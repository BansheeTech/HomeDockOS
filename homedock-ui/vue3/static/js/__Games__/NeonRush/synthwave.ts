// homedock-ui/vue3/static/js/__Games__/NeonRush/synthwave.ts
// Copyright © 2023-2026 Banshee, All Rights Reserved
// See LICENSE.md or https://polyformproject.org/licenses/strict/1.0.0/
// https://www.banshee.pro

type MelodyNote = [step: number, midi: number, length: number];
type BassStyle = "none" | "pulse" | "riff" | "drive";
type HatStyle = "none" | "offbeat" | "sixteenths";
type SnareStyle = "none" | "backbeat" | "build";
type ArpStyle = "none" | "eighths" | "sixteenths";
type Fill = "none" | "roll" | "toms";

interface Chord {
  bass: number;
  pad: number[];
}

interface Section {
  bars: number;
  chords: Chord[];
  kick: boolean;
  snare: SnareStyle;
  clap: boolean;
  hats: HatStyle;
  bass: BassStyle;
  arp: ArpStyle;
  melody: MelodyNote[][] | null;
  leadShift: number;
  bright: boolean;
  lift: boolean;
  padCutoff: number;
  sweep: boolean;
  fill: Fill;
  riser: number;
  crash: boolean;
}

const BPM = 120;
const STEP = 60 / BPM / 4;
const STEPS_PER_BAR = 16;
const BAR = STEP * STEPS_PER_BAR;
const LOOKAHEAD = 0.15;
const SCHEDULE_INTERVAL = 25;
const MASTER_VOLUME = 0.5;
const FADE_IN = 0.3;
const SNARE_OFFSET = 0.008;
const DUCK_DEPTH = 0.3;
const DUCK_RELEASE = 0.1;
const GLIDE_TIME = 0.045;
const ARP_WIDTH = 0.35;
const HAT_PAN = 0.2;
const TRANSPOSE = -10;

const F_MINOR: Chord = { bass: 29, pad: [48, 53, 56, 60] };
const G_FLAT: Chord = { bass: 30, pad: [49, 54, 58, 61] };
const D_FLAT: Chord = { bass: 37, pad: [49, 53, 56, 61] };
const E_FLAT: Chord = { bass: 39, pad: [51, 55, 58, 63] };
const B_FLAT_MINOR: Chord = { bass: 34, pad: [49, 53, 58, 61] };
const C_SEVENTH: Chord = { bass: 36, pad: [48, 52, 55, 58] };

const VERSE_MELODY: MelodyNote[][] = [
  [
    [0, 60, 6],
    [6, 61, 2],
    [8, 60, 8],
  ],
  [
    [0, 58, 8],
    [8, 61, 8],
  ],
  [
    [0, 60, 6],
    [6, 61, 2],
    [8, 63, 4],
    [12, 61, 4],
  ],
  [[0, 58, 16]],
  [
    [0, 56, 6],
    [6, 58, 2],
    [8, 61, 8],
  ],
  [
    [0, 63, 8],
    [8, 58, 8],
  ],
  [
    [0, 60, 6],
    [6, 56, 2],
    [8, 53, 8],
  ],
  [
    [0, 52, 8],
    [8, 55, 4],
    [12, 58, 4],
  ],
];

const CHORUS_MELODY: MelodyNote[][] = [
  [
    [0, 72, 3],
    [3, 68, 3],
    [6, 65, 2],
    [8, 67, 2],
    [10, 68, 6],
  ],
  [
    [0, 73, 6],
    [6, 72, 2],
    [8, 68, 8],
  ],
  [
    [0, 73, 3],
    [3, 70, 3],
    [6, 65, 2],
    [8, 68, 2],
    [10, 70, 6],
  ],
  [
    [0, 72, 4],
    [4, 70, 2],
    [6, 68, 2],
    [8, 67, 6],
    [14, 64, 2],
  ],
  [
    [0, 72, 3],
    [3, 68, 3],
    [6, 65, 2],
    [8, 67, 2],
    [10, 68, 6],
  ],
  [
    [0, 73, 6],
    [6, 75, 2],
    [8, 77, 8],
  ],
  [
    [0, 78, 3],
    [3, 77, 3],
    [6, 73, 2],
    [8, 70, 4],
    [12, 73, 4],
  ],
  [
    [0, 72, 6],
    [6, 73, 2],
    [8, 72, 4],
    [12, 67, 4],
  ],
];

const BREAKDOWN_MELODY: MelodyNote[][] = [
  [
    [0, 72, 8],
    [8, 68, 8],
  ],
  [
    [0, 70, 12],
    [12, 67, 4],
  ],
  [[0, 68, 16]],
  [
    [0, 65, 8],
    [8, 67, 4],
    [12, 68, 4],
  ],
  [
    [0, 73, 8],
    [8, 72, 8],
  ],
  [
    [0, 70, 8],
    [8, 75, 8],
  ],
  [
    [0, 73, 12],
    [12, 70, 4],
  ],
  [[0, 67, 16]],
];

const SILENT: Omit<Section, "bars" | "chords"> = {
  kick: false,
  snare: "none",
  clap: false,
  hats: "none",
  bass: "none",
  arp: "none",
  melody: null,
  leadShift: 0,
  bright: false,
  lift: false,
  padCutoff: 1600,
  sweep: false,
  fill: "none",
  riser: 0,
  crash: false,
};

const INTRO_A: Section = {
  ...SILENT,
  bars: 4,
  chords: [F_MINOR, G_FLAT, F_MINOR, C_SEVENTH],
  arp: "sixteenths",
  sweep: true,
};

const INTRO_B: Section = {
  ...SILENT,
  bars: 4,
  chords: [F_MINOR, G_FLAT, F_MINOR, C_SEVENTH],
  kick: true,
  hats: "offbeat",
  bass: "pulse",
  arp: "sixteenths",
  fill: "roll",
  riser: 2,
};

const VERSE: Section = {
  ...SILENT,
  bars: 8,
  chords: [F_MINOR, G_FLAT, F_MINOR, G_FLAT, D_FLAT, E_FLAT, F_MINOR, C_SEVENTH],
  kick: true,
  snare: "backbeat",
  hats: "offbeat",
  bass: "riff",
  melody: VERSE_MELODY,
  leadShift: 12,
  padCutoff: 1300,
  fill: "roll",
  crash: true,
};

const PRE_CHORUS: Section = {
  ...SILENT,
  bars: 4,
  chords: [D_FLAT, E_FLAT, B_FLAT_MINOR, C_SEVENTH],
  kick: true,
  snare: "build",
  bass: "pulse",
  arp: "sixteenths",
  padCutoff: 2000,
  sweep: true,
  riser: 4,
};

const CHORUS: Section = {
  ...SILENT,
  bars: 8,
  chords: [F_MINOR, D_FLAT, B_FLAT_MINOR, C_SEVENTH, F_MINOR, D_FLAT, G_FLAT, C_SEVENTH],
  kick: true,
  snare: "backbeat",
  clap: true,
  hats: "sixteenths",
  bass: "drive",
  arp: "sixteenths",
  melody: CHORUS_MELODY,
  bright: true,
  padCutoff: 2400,
  fill: "toms",
  crash: true,
};

const BREAKDOWN: Section = {
  ...SILENT,
  bars: 8,
  chords: [D_FLAT, E_FLAT, F_MINOR, F_MINOR, D_FLAT, E_FLAT, G_FLAT, C_SEVENTH],
  arp: "eighths",
  melody: BREAKDOWN_MELODY,
  padCutoff: 1100,
  fill: "roll",
  riser: 2,
};

const CHORUS_LIFT: Section = {
  ...CHORUS,
  lift: true,
  padCutoff: 2800,
};

const INTRO: Section[] = [INTRO_A, INTRO_B];
const LOOP: Section[] = [VERSE, PRE_CHORUS, CHORUS, BREAKDOWN, CHORUS_LIFT];
const INTRO_BARS = INTRO.reduce((total, section) => total + section.bars, 0);
const LOOP_BARS = LOOP.reduce((total, section) => total + section.bars, 0);

const BASS_PHRASE = 4;
const BASS_TRIPLETS = [0, 0, 0, null, 0, 0, 0, null, 0, 0, 0, null, 0, 0, 0, null];
const BASS_STRAIGHT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const BASS_PATTERNS: Record<BassStyle, (number | null)[][]> = {
  none: [],
  pulse: [[0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null]],
  riff: [BASS_TRIPLETS, BASS_STRAIGHT],
  drive: [BASS_TRIPLETS, BASS_STRAIGHT],
};

const ARP_PATTERN = [0, 2, 1, 3, 0, 2, 1, 3, 0, 2, 1, 3, 2, 1, 3, 2];
const BUILD_SPACING = [8, 4, 2, 1];
const SNARE_ROLL = [8, 10, 12, 13, 14, 15];
const TOM_FILL: [step: number, midi: number, pan: number][] = [
  [8, 50, 0.5],
  [10, 47, 0.2],
  [12, 43, -0.2],
  [14, 40, -0.5],
];

function frequency(midi: number) {
  return 440 * Math.pow(2, (midi + TRANSPOSE - 69) / 12);
}

function locate(sections: Section[], position: number): [Section, number] {
  for (const section of sections) {
    if (position < section.bars) return [section, position];
    position -= section.bars;
  }
  return [sections[0], 0];
}

export class SynthwaveMusic {
  private context = new AudioContext();
  private master: GainNode;
  private mix: GainNode;
  private ducked: GainNode;
  private chorus: GainNode;
  private delay: GainNode;
  private hallInput: DelayNode;
  private gated: ConvolverNode;
  private bassBus: GainNode;
  private arpBus: GainNode;
  private leadFilter: BiquadFilterNode;
  private leadGate: GainNode;
  private leadLayer: GainNode;
  private leadVibrato: GainNode;
  private leadOscillators: [OscillatorNode, number][] = [];
  private noise: AudioBuffer;
  private timer = 0;
  private step = 0;
  private nextTime = 0;
  private lastLeadEnd = -Infinity;

  constructor() {
    const context = this.context;

    this.master = context.createGain();
    this.master.gain.value = 0;
    this.master.connect(context.destination);

    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    limiter.connect(this.master);

    const saturation = context.createWaveShaper();
    saturation.curve = this.saturationCurve(1.4);
    saturation.oversample = "2x";
    saturation.connect(limiter);

    const glue = context.createDynamicsCompressor();
    glue.threshold.value = -16;
    glue.ratio.value = 3;
    glue.attack.value = 0.01;
    glue.release.value = 0.2;
    glue.connect(saturation);

    this.mix = context.createGain();
    this.mix.connect(glue);

    this.ducked = context.createGain();
    this.ducked.connect(this.mix);

    this.chorus = context.createGain();
    this.chorus.connect(this.ducked);
    const merger = context.createChannelMerger(2);
    const chorusWet = context.createGain();
    chorusWet.gain.value = 0.8;
    merger.connect(chorusWet).connect(this.ducked);
    for (const side of [0, 1]) {
      const line = context.createDelay(0.05);
      line.delayTime.value = 0.011 + side * 0.005;
      const lfo = context.createOscillator();
      lfo.frequency.value = 0.35 + side * 0.2;
      const depth = context.createGain();
      depth.gain.value = 0.004;
      lfo.connect(depth).connect(line.delayTime);
      lfo.start();
      this.chorus.connect(line);
      line.connect(merger, 0, side);
    }

    // Ping-pong dotted-eighth delay: echoes alternate left/right.
    this.delay = context.createGain();
    const delayHighpass = context.createBiquadFilter();
    delayHighpass.type = "highpass";
    delayHighpass.frequency.value = 400;
    const delayLeft = context.createDelay(2);
    delayLeft.delayTime.value = STEP * 3;
    const delayRight = context.createDelay(2);
    delayRight.delayTime.value = STEP * 3;
    const damping = context.createBiquadFilter();
    damping.type = "lowpass";
    damping.frequency.value = 2600;
    const toRight = context.createGain();
    toRight.gain.value = 0.6;
    const toLeft = context.createGain();
    toLeft.gain.value = 0.6;
    this.delay.connect(delayHighpass).connect(delayLeft);
    delayLeft.connect(toRight).connect(delayRight);
    delayRight.connect(damping).connect(toLeft).connect(delayLeft);
    const echoes = context.createChannelMerger(2);
    delayLeft.connect(echoes, 0, 0);
    delayRight.connect(echoes, 0, 1);
    const delayReturn = context.createGain();
    delayReturn.gain.value = 0.55;
    echoes.connect(delayReturn).connect(this.mix);

    const preDelay = context.createDelay(0.1);
    preDelay.delayTime.value = 0.04;
    const hall = context.createConvolver();
    hall.buffer = this.hallImpulse(3.5);
    const hallReturn = context.createGain();
    hallReturn.gain.value = 0.6;
    preDelay.connect(hall).connect(hallReturn).connect(this.mix);
    this.hallInput = preDelay;

    this.gated = context.createConvolver();
    this.gated.buffer = this.gatedImpulse(0.3);
    const gatedReturn = context.createGain();
    gatedReturn.gain.value = 0.9;
    this.gated.connect(gatedReturn).connect(this.mix);

    this.bassBus = context.createGain();
    const bassDrive = context.createWaveShaper();
    bassDrive.curve = this.saturationCurve(2.2);
    bassDrive.oversample = "2x";
    const bassTone = context.createBiquadFilter();
    bassTone.type = "lowpass";
    bassTone.frequency.value = 2600;
    const bassOut = context.createGain();
    bassOut.gain.value = 0.23;
    this.bassBus.connect(bassDrive).connect(bassTone).connect(bassOut).connect(this.ducked);

    // Monophonic lead: persistent oscillators, gate envelope and real portamento.
    const leadBus = context.createGain();
    const leadDrive = context.createWaveShaper();
    leadDrive.curve = this.saturationCurve(2);
    leadDrive.oversample = "4x";
    const leadTone = context.createBiquadFilter();
    leadTone.type = "lowpass";
    leadTone.frequency.value = 5200;
    const leadOut = context.createGain();
    leadOut.gain.value = 0.075;
    leadBus.connect(leadDrive).connect(leadTone).connect(leadOut).connect(this.mix);
    const leadDelay = context.createGain();
    leadDelay.gain.value = 0.4;
    leadOut.connect(leadDelay).connect(this.delay);
    const leadHall = context.createGain();
    leadHall.gain.value = 0.4;
    leadOut.connect(leadHall).connect(this.hallInput);

    this.leadFilter = context.createBiquadFilter();
    this.leadFilter.type = "lowpass";
    this.leadFilter.Q.value = 2;
    this.leadFilter.frequency.value = 1800;
    this.leadGate = context.createGain();
    this.leadGate.gain.value = 0;
    this.leadFilter.connect(this.leadGate).connect(leadBus);
    this.leadLayer = context.createGain();
    this.leadLayer.gain.value = 0;
    this.leadLayer.connect(this.leadFilter);

    const vibratoLfo = context.createOscillator();
    vibratoLfo.frequency.value = 5.5;
    this.leadVibrato = context.createGain();
    this.leadVibrato.gain.value = 0;
    vibratoLfo.connect(this.leadVibrato);
    vibratoLfo.start();

    const leadVoices: [OscillatorType, number, number, AudioNode][] = [
      ["square", 1, -7, this.leadFilter],
      ["sawtooth", 1, 7, this.leadFilter],
      ["sawtooth", 2, 0, this.leadLayer],
    ];
    for (const [type, ratio, detune, output] of leadVoices) {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency(60) * ratio;
      oscillator.detune.value = detune;
      this.leadVibrato.connect(oscillator.detune);
      oscillator.connect(output);
      oscillator.start();
      this.leadOscillators.push([oscillator, ratio]);
    }

    this.arpBus = context.createGain();
    const arpHighpass = context.createBiquadFilter();
    arpHighpass.type = "highpass";
    arpHighpass.frequency.value = 350;
    this.arpBus.connect(arpHighpass).connect(this.ducked);
    const arpDelay = context.createGain();
    arpDelay.gain.value = 0.4;
    arpHighpass.connect(arpDelay).connect(this.delay);

    this.noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
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

  private schedule = () => {
    while (this.nextTime < this.context.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.step++;
      this.nextTime += STEP;
    }
  };

  private bar(index: number): [Section, number] {
    if (index < INTRO_BARS) return locate(INTRO, index);
    return locate(LOOP, (index - INTRO_BARS) % LOOP_BARS);
  }

  private playStep(step: number, time: number) {
    const index = Math.floor(step / STEPS_PER_BAR);
    const beat = step % STEPS_PER_BAR;
    const [section, barInSection] = this.bar(index);
    const chords = section.chords;
    const chord = chords[barInSection % chords.length];
    const lastBar = barInSection === section.bars - 1;
    const progress = (barInSection * STEPS_PER_BAR + beat) / (section.bars * STEPS_PER_BAR);
    const opening = section.sweep ? progress : 1;
    const rolling = section.fill === "roll" && lastBar && beat >= SNARE_ROLL[0];
    const tomming = section.fill === "toms" && lastBar && beat >= TOM_FILL[0][0];
    const filling = rolling || tomming;

    if (beat === 0) {
      // Hold the pad across repeated chords instead of re-attacking every bar.
      if (barInSection === 0 || chords[(barInSection - 1) % chords.length] !== chord) {
        let run = 1;
        while (barInSection + run < section.bars && chords[(barInSection + run) % chords.length] === chord) run++;
        this.pad(time, chord.pad, run * BAR, section.padCutoff * (0.35 + 0.65 * opening));
      }
      if (barInSection === 0 && section.crash) this.crash(time);
      if (section.riser > 0 && barInSection === section.bars - section.riser) this.riser(time, section.riser * BAR);
    }

    const bassPatterns = BASS_PATTERNS[section.bass];
    const bassOffset = bassPatterns[Math.floor(barInSection / BASS_PHRASE) % bassPatterns.length]?.[beat];
    if (bassOffset !== undefined && bassOffset !== null) {
      this.bass(time, chord.bass + bassOffset, beat % 4 === 0 ? 1 : 0.75, section.bass === "drive");
    }

    const arpOn = section.arp === "sixteenths" || (section.arp === "eighths" && beat % 2 === 0);
    if (arpOn) {
      const slot = section.arp === "eighths" ? beat / 2 : beat;
      const cutoff = (section.bright ? 3200 : 2200) * (0.25 + 0.75 * opening);
      this.arp(time, chord.pad[ARP_PATTERN[beat]] + 12, cutoff, slot % 2 === 0 ? -ARP_WIDTH : ARP_WIDTH);
    }

    if (section.kick && beat % 4 === 0) this.kick(time);

    if (!filling) {
      if (section.snare === "backbeat" && (beat === 4 || beat === 12)) {
        this.snare(time + SNARE_OFFSET, 0.3);
        if (section.clap) this.clap(time + SNARE_OFFSET, 0.22);
      }
      if (section.snare === "build") {
        const spacing = BUILD_SPACING[Math.min(barInSection, BUILD_SPACING.length - 1)];
        const offset = spacing === 8 ? 4 : 0;
        if ((beat - offset) % spacing === 0) this.snare(time + SNARE_OFFSET, 0.08 + 0.22 * progress);
      }
      if (section.hats === "sixteenths") this.hat(time, beat % 4 === 2 ? 0.06 : 0.025, beat === 14);
      else if (section.hats === "offbeat" && beat % 4 === 2) this.hat(time, 0.05, false);
    }

    if (rolling && SNARE_ROLL.includes(beat)) {
      this.snare(time + SNARE_OFFSET, 0.12 + ((beat - SNARE_ROLL[0]) / 7) * 0.2);
    }
    if (tomming) {
      for (const [tomStep, midi, pan] of TOM_FILL) if (tomStep === beat) this.tom(time, midi, pan);
    }

    if (section.melody) {
      for (const [start, midi, length] of section.melody[barInSection % section.melody.length]) {
        if (start === beat) this.lead(time, midi + section.leadShift, length * STEP, section.bright, section.lift);
      }
    }
  }

  private saturationCurve(amount: number) {
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
    }
    return curve;
  }

  private hallImpulse(seconds: number) {
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
    return buffer;
  }

  private gatedImpulse(seconds: number) {
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (0.9 - 0.35 * (i / length));
    }
    return buffer;
  }

  private voice(time: number, output: AudioNode, sends: [AudioNode, number][] = [], pan = 0) {
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    if (pan !== 0) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = pan;
      gain.connect(panner).connect(output);
    } else {
      gain.connect(output);
    }
    for (const [target, amount] of sends) {
      const send = this.context.createGain();
      send.gain.value = amount;
      gain.connect(send).connect(target);
    }
    return gain;
  }

  private oscillator(type: OscillatorType, midi: number, detune: number, output: AudioNode, time: number, stop: number) {
    const oscillator = this.context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency(midi);
    oscillator.detune.value = detune;
    oscillator.connect(output);
    oscillator.start(time);
    oscillator.stop(stop);
    return oscillator;
  }

  private duck(time: number) {
    this.ducked.gain.setValueAtTime(DUCK_DEPTH, time);
    this.ducked.gain.setTargetAtTime(1, time + 0.01, DUCK_RELEASE);
  }

  private pad(time: number, notes: number[], length: number, cutoff: number) {
    const attack = 0.15;
    const release = 0.7;
    const stop = time + length + release + 0.02;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(cutoff * 0.6, time);
    filter.frequency.linearRampToValueAtTime(cutoff, time + length * 0.5);
    filter.frequency.linearRampToValueAtTime(cutoff * 0.7, time + length);
    const gain = this.voice(time, this.chorus, [[this.hallInput, 0.35]]);
    gain.gain.exponentialRampToValueAtTime(0.022, time + attack);
    gain.gain.setValueAtTime(0.022, time + length);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length + release);
    filter.connect(gain);
    for (const note of notes) {
      this.oscillator("sawtooth", note, -12, filter, time, stop);
      this.oscillator("sawtooth", note, 12, filter, time, stop);
      this.oscillator("triangle", note + 12, 0, filter, time, stop);
    }
  }

  private bass(time: number, midi: number, accent: number, driven: boolean) {
    const length = STEP * 0.9;
    const level = 0.36 * accent;
    const cutoff = driven ? 620 : 440;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 4;
    filter.frequency.setValueAtTime(cutoff * (2 + accent * 2), time);
    filter.frequency.exponentialRampToValueAtTime(cutoff, time + 0.07);
    const gain = this.voice(time, this.bassBus);
    gain.gain.exponentialRampToValueAtTime(level, time + 0.002);
    gain.gain.setValueAtTime(level, time + length * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    filter.connect(gain);
    for (const detune of [-10, 0, 10]) this.oscillator("sawtooth", midi, detune, filter, time, time + length + 0.02);

    const subLevel = 0.3 * accent;
    const sub = this.voice(time, this.ducked);
    sub.gain.exponentialRampToValueAtTime(subLevel, time + 0.003);
    sub.gain.setValueAtTime(subLevel, time + length * 0.5);
    sub.gain.exponentialRampToValueAtTime(0.0001, time + length);
    this.oscillator("sine", midi > 41 ? midi - 12 : midi, 0, sub, time, time + length + 0.02);
  }

  private arp(time: number, midi: number, cutoff: number, pan: number) {
    const length = STEP * 0.8;
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 7;
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.3, time + 0.1);
    const gain = this.voice(time, this.arpBus, [], pan);
    gain.gain.exponentialRampToValueAtTime(0.035, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    filter.connect(gain);
    this.oscillator("square", midi, 0, filter, time, time + length + 0.02);
    this.oscillator("sawtooth", midi, 7, filter, time, time + length + 0.02);
  }

  private lead(time: number, midi: number, length: number, bright: boolean, lift: boolean) {
    const legato = Math.abs(time - this.lastLeadEnd) < 0.01;
    const level = bright ? 0.2 : 0.13;
    const peak = bright ? 3200 : 1800;

    for (const [oscillator, ratio] of this.leadOscillators) {
      const target = frequency(midi) * ratio;
      if (legato) oscillator.frequency.setTargetAtTime(target, time, GLIDE_TIME / 3);
      else oscillator.frequency.setValueAtTime(target, time);
    }

    const gate = this.leadGate.gain;
    if (legato) {
      gate.setTargetAtTime(level, time, 0.02);
    } else {
      gate.setTargetAtTime(level, time, 0.004);
      this.leadFilter.frequency.setValueAtTime(peak * 1.4, time);
      this.leadFilter.frequency.setTargetAtTime(peak, time + 0.005, 0.18);
    }
    gate.setTargetAtTime(0, time + length, bright ? 0.05 : 0.09);

    this.leadLayer.gain.setValueAtTime(lift ? 0.55 : 0, time);

    const vibrato = this.leadVibrato.gain;
    vibrato.setValueAtTime(0, time);
    if (length > 0.5) {
      vibrato.setValueAtTime(0, time + 0.22);
      vibrato.linearRampToValueAtTime(bright ? 14 : 9, time + 0.5);
    }

    this.lastLeadEnd = time + length;
  }

  private kick(time: number) {
    this.duck(time);
    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(46, time + 0.08);
    const gain = this.voice(time, this.mix);
    gain.gain.exponentialRampToValueAtTime(1, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.38);
    oscillator.connect(gain);
    oscillator.start(time);
    oscillator.stop(time + 0.4);

    const click = this.context.createBufferSource();
    click.buffer = this.noise;
    const clickFilter = this.context.createBiquadFilter();
    clickFilter.type = "highpass";
    clickFilter.frequency.value = 3000;
    const clickGain = this.voice(time, this.mix);
    clickGain.gain.exponentialRampToValueAtTime(0.12, time + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
    click.connect(clickFilter).connect(clickGain);
    click.start(time, Math.random(), 0.02);
  }

  private snare(time: number, level: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 0.6;
    const noiseGain = this.voice(time, this.mix, [[this.gated, 0.9]]);
    noiseGain.gain.exponentialRampToValueAtTime(level, time + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
    noise.connect(filter).connect(noiseGain);
    noise.start(time, Math.random(), 0.2);

    const body = this.context.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(220, time);
    body.frequency.exponentialRampToValueAtTime(160, time + 0.08);
    const bodyGain = this.voice(time, this.mix, [[this.gated, 0.5]]);
    bodyGain.gain.exponentialRampToValueAtTime(level * 0.9, time + 0.002);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    body.connect(bodyGain);
    body.start(time);
    body.stop(time + 0.14);
  }

  private clap(time: number, level: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1300;
    filter.Q.value = 1.5;
    const gain = this.voice(time, this.mix, [[this.gated, 1]]);
    for (let hit = 0; hit < 3; hit++) {
      const start = time + hit * 0.011;
      gain.gain.setValueAtTime(level, start);
      gain.gain.exponentialRampToValueAtTime(level * 0.1, start + 0.009);
    }
    gain.gain.setValueAtTime(level * 0.8, time + 0.033);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    noise.connect(filter).connect(gain);
    noise.start(time, Math.random(), 0.25);
  }

  private tom(time: number, midi: number, pan: number) {
    const oscillator = this.context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency(midi) * 1.6, time);
    oscillator.frequency.exponentialRampToValueAtTime(frequency(midi), time + 0.12);
    const gain = this.voice(time, this.mix, [[this.gated, 0.7]], pan);
    gain.gain.exponentialRampToValueAtTime(0.45, time + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.3);
    oscillator.connect(gain);
    oscillator.start(time);
    oscillator.stop(time + 0.32);
  }

  private hat(time: number, volume: number, open: boolean) {
    const length = open ? 0.28 : 0.035;
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 8000;
    const gain = this.voice(time, this.mix, [], HAT_PAN);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
    noise.connect(filter).connect(gain);
    noise.start(time, Math.random(), length + 0.02);
  }

  private riser(time: number, length: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    noise.loop = true;
    const filter = this.context.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 2.5;
    filter.frequency.setValueAtTime(300, time);
    filter.frequency.exponentialRampToValueAtTime(7000, time + length);
    const gain = this.voice(time, this.mix, [[this.hallInput, 0.4]]);
    gain.gain.exponentialRampToValueAtTime(0.1, time + length);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + length + 0.05);
    noise.connect(filter).connect(gain);
    noise.start(time);
    noise.stop(time + length + 0.07);
  }

  private crash(time: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const filter = this.context.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5000;
    const gain = this.voice(time, this.mix, [[this.hallInput, 0.3]]);
    gain.gain.exponentialRampToValueAtTime(0.09, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    noise.connect(filter).connect(gain);
    noise.start(time, 0, 1.7);
  }
}
