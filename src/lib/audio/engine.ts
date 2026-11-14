/**
 * Earth Jukebox sound engine — plain Web Audio, no samples needed.
 * One "voice" per Earth layer. Each voice is a little synth that turns a data value
 * into a natural-sounding, child-friendly soundscape (rain, thunder, waves, bells...).
 */
import type { EarthSample } from "@/lib/earth-data";
import type { LayerId } from "@/lib/layers";
import { LAYER_IDS } from "@/lib/layers";
import {
  bellNotesPerSecond,
  birdsPerSecond,
  droneDetuneCents,
  oceanMood,
  pentatonicFreq,
  rainBringsThunder,
  rainHissLevel,
  raindropsPerSecond,
  thunderCloseness,
  thunderIntervalSeconds,
} from "@/lib/sonify-map";

export type EngineEvent = { layer: LayerId; kind: "thunder" | "drop" | "bell" | "bird"; strength: number };
type Listener = (e: EngineEvent) => void;

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function makeNoise(ctx: AudioContext, seconds: number, color: "white" | "pink" | "brown") {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (color === "white") d[i] = w * 0.5;
    else if (color === "pink") {
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856;
      b4 = 0.55 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    } else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function makeImpulse(ctx: AudioContext, seconds = 2.6) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

abstract class Voice {
  out: GainNode;
  send: GainNode;
  value = 0;
  sample: EarthSample | null = null;
  protected active = false;
  protected started = false;
  constructor(protected e: AudioEngine, public id: LayerId, reverb = 0.35) {
    const ctx = e.ctx;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.send = ctx.createGain();
    this.send.gain.value = reverb;
    this.out.connect(e.bus);
    this.out.connect(this.send);
    this.send.connect(e.reverbIn);
  }
  get ctx() {
    return this.e.ctx;
  }
  setLevel(level: number, ramp = 0.6) {
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setTargetAtTime(level, t, ramp / 3);
    this.active = level > 0.001;
    if (this.active && !this.started) {
      this.started = true;
      this.startContinuous();
    }
  }
  isActive() {
    return this.active;
  }
  setSample(s: EarthSample, v: number) {
    this.sample = s;
    this.value = v;
    if (this.started) this.update();
  }
  protected startContinuous() {
    this.update();
  }
  protected update() {}
  /** Called by the scheduler; schedule events between from..to (seconds). */
  abstract schedule(from: number, to: number): void;

  protected panner(pan: number) {
    const p = this.ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    p.connect(this.out);
    return p;
  }
  protected loopNoise(color: "white" | "pink" | "brown") {
    const src = this.ctx.createBufferSource();
    src.buffer = this.e.noise[color];
    src.loop = true;
    src.start(0, Math.random() * 2);
    return src;
  }
  /** Poisson process: how many events fall in [from,to) at a rate */
  protected poisson(rate: number, from: number, to: number) {
    const times: number[] = [];
    if (rate <= 0) return times;
    let t = from + -Math.log(1 - Math.random()) / rate;
    while (t < to) {
      times.push(t);
      t += -Math.log(1 - Math.random()) / rate;
    }
    return times;
  }
}

/* ---------------- Rain: drops → shower → pouring rain ---------------- */
class RainVoice extends Voice {
  private hiss!: GainNode;
  private hissFilter!: BiquadFilterNode;
  private nextThunder = 0;
  protected startContinuous() {
    const src = this.loopNoise("pink");
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 450;
    this.hissFilter = this.ctx.createBiquadFilter();
    this.hissFilter.type = "lowpass";
    this.hissFilter.frequency.value = 5000;
    this.hiss = this.ctx.createGain();
    this.hiss.gain.value = 0;
    src.connect(hp).connect(this.hissFilter).connect(this.hiss).connect(this.out);
    super.startContinuous();
  }
  protected update() {
    const h = rainHissLevel(this.value);
    const t = this.ctx.currentTime;
    this.hiss.gain.setTargetAtTime(h * 0.55, t, 0.6);
    this.hissFilter.frequency.setTargetAtTime(2500 + h * 5000, t, 0.6);
  }
  schedule(from: number, to: number) {
    const rate = raindropsPerSecond(this.value);
    for (const t of this.poisson(rate, from, to)) this.drop(t);
    if (rainBringsThunder(this.value)) {
      if (this.nextThunder < from) this.nextThunder = from + rand(4, 10);
      if (this.nextThunder < to) {
        this.e.thunder(this.nextThunder, 0.15, this.out, 0.35);
        this.nextThunder += rand(9, 16);
      }
    }
  }
  private drop(t: number) {
    const ctx = this.ctx;
    const sparse = this.value < 0.5;
    const p = this.panner(rand(-0.9, 0.9));
    const g = ctx.createGain();
    g.connect(p);
    const o = ctx.createOscillator();
    o.type = "sine";
    if (sparse && Math.random() < 0.6) {
      // musical "plink" drop on a pentatonic note
      const f = pentatonicFreq(84, Math.floor(rand(0, 8)));
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.12, t + 0.04);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.35);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.4);
    } else {
      // realistic water drop: tiny rising "bloop"
      const f = rand(1400, 3600);
      const amp = sparse ? 0.2 : rand(0.05, 0.14);
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * rand(1.4, 1.9), t + 0.03);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(amp, t + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.08);
    }
    if (Math.random() < 0.1) this.e.emit({ layer: "rain", kind: "drop", strength: this.value });
  }
}

/* ---------------- Storm: lightning → thunder ---------------- */
class StormVoice extends Voice {
  private next = 0;
  private bed!: GainNode;
  protected startContinuous() {
    const src = this.loopNoise("pink");
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1800;
    this.bed = this.ctx.createGain();
    this.bed.gain.value = 0;
    src.connect(lp).connect(this.bed).connect(this.out);
    super.startContinuous();
  }
  protected update() {
    this.bed.gain.setTargetAtTime(this.value * 0.12, this.ctx.currentTime, 0.8);
  }
  schedule(from: number, to: number) {
    const iv = thunderIntervalSeconds(this.value);
    if (!isFinite(iv)) return;
    if (this.next < from) this.next = from + rand(0.3, 1.5);
    while (this.next < to) {
      const c = Math.min(1, thunderCloseness(this.value) * rand(0.7, 1.15));
      this.e.thunder(this.next, c, this.out, 1);
      this.next += iv * rand(0.6, 1.4);
    }
  }
}

/* ---------------- Ocean: waves + warm/cold chord + whale ---------------- */
class OceanVoice extends Voice {
  private waveGain!: GainNode;
  private waveFilter!: BiquadFilterNode;
  private pad: OscillatorNode[] = [];
  private padGain!: GainNode;
  private nextWave = 0;
  private nextWhale = 0;
  protected startContinuous() {
    const ctx = this.ctx;
    const src = this.loopNoise("brown");
    this.waveFilter = ctx.createBiquadFilter();
    this.waveFilter.type = "lowpass";
    this.waveFilter.frequency.value = 400;
    this.waveGain = ctx.createGain();
    this.waveGain.gain.value = 0.05;
    src.connect(this.waveFilter).connect(this.waveGain).connect(this.out);
    const spray = this.loopNoise("white");
    const sprayHp = ctx.createBiquadFilter();
    sprayHp.type = "highpass";
    sprayHp.frequency.value = 3000;
    const sprayG = ctx.createGain();
    sprayG.gain.value = 0.04;
    spray.connect(sprayHp).connect(sprayG).connect(this.waveGain);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;
    lp.connect(this.padGain).connect(this.out);
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = i === 0 ? "triangle" : "sine";
      o.detune.value = rand(-6, 6);
      o.connect(lp);
      o.start();
      this.pad.push(o);
    }
    super.startContinuous();
  }
  private presence() {
    return this.sample ? 1 - Math.min(1, this.sample.land * 1.2) : 1;
  }
  protected update() {
    const t = this.ctx.currentTime;
    const mood = oceanMood(this.value);
    const chords: Record<string, number[]> = {
      cold: [45, 48, 52], // A minor, low
      mild: [50, 55, 57], // D sus, middle
      warm: [60, 64, 67], // C major, bright
    };
    chords[mood].forEach((m, i) => {
      this.pad[i].frequency.setTargetAtTime(440 * Math.pow(2, (m - 69) / 12), t, 0.8);
    });
    this.padGain.gain.setTargetAtTime(0.05 + 0.06 * this.presence(), t, 1);
  }
  schedule(from: number, to: number) {
    const pres = this.presence();
    if (this.nextWave < from) this.nextWave = from + 0.1;
    while (this.nextWave < to) {
      const t = this.nextWave;
      const P = rand(5.5, 8.5);
      const peak = (0.25 + 0.55 * pres) * rand(0.7, 1);
      this.waveGain.gain.setTargetAtTime(peak, t, P * 0.18);
      this.waveGain.gain.setTargetAtTime(0.04 + 0.05 * pres, t + P * 0.45, P * 0.2);
      this.waveFilter.frequency.setTargetAtTime(500 + 900 * pres, t, P * 0.18);
      this.waveFilter.frequency.setTargetAtTime(260, t + P * 0.45, P * 0.2);
      this.nextWave += P;
    }
    if (pres > 0.4 && this.value < 0.38) {
      if (this.nextWhale < from) this.nextWhale = from + rand(3, 7);
      if (this.nextWhale < to) {
        this.whale(this.nextWhale);
        this.nextWhale += rand(9, 15);
      }
    }
  }
  private whale(t: number) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = "sine";
    const base = rand(220, 320);
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.7, t + 0.9);
    o.frequency.linearRampToValueAtTime(base * 0.8, t + 2.4);
    const vib = ctx.createOscillator();
    vib.frequency.value = 5;
    const vg = ctx.createGain();
    vg.gain.value = 6;
    vib.connect(vg).connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.5);
    g.gain.linearRampToValueAtTime(0.08, t + 1.6);
    g.gain.linearRampToValueAtTime(0, t + 2.6);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    o.connect(lp).connect(g).connect(this.panner(rand(-0.6, 0.6)));
    o.start(t);
    vib.start(t);
    o.stop(t + 2.7);
    vib.stop(t + 2.7);
  }
}

/* ---------------- City lights: music-box bells ---------------- */
class LightsVoice extends Voice {
  schedule(from: number, to: number) {
    const rate = bellNotesPerSecond(this.value);
    for (const t of this.poisson(rate, from, to)) {
      const step = Math.floor(rand(0, 6 + this.value * 6));
      this.e.bell(t, pentatonicFreq(72, step), 0.12 + 0.08 * this.value, rand(-0.8, 0.8), this.out);
      if (this.value > 0.6 && Math.random() < 0.3)
        this.e.bell(t + 0.12, pentatonicFreq(72, step + 2), 0.08, rand(-0.8, 0.8), this.out);
      if (Math.random() < 0.15) this.e.emit({ layer: "lights", kind: "bell", strength: this.value });
    }
  }
}

/* ---------------- Forest: rustling leaves + birds ---------------- */
class ForestVoice extends Voice {
  private rustle!: GainNode;
  private nextCuckoo = 0;
  protected startContinuous() {
    const src = this.loopNoise("pink");
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 0.6;
    this.rustle = this.ctx.createGain();
    this.rustle.gain.value = 0;
    src.connect(bp).connect(this.rustle).connect(this.out);
    super.startContinuous();
  }
  protected update() {
    this.rustle.gain.setTargetAtTime(0.03 + this.value * 0.12, this.ctx.currentTime, 1);
  }
  schedule(from: number, to: number) {
    for (const t of this.poisson(birdsPerSecond(this.value), from, to)) {
      this.tweet(t);
      if (Math.random() < 0.15) this.e.emit({ layer: "forest", kind: "bird", strength: this.value });
    }
    // rustle swells like wind in leaves
    this.rustle.gain.setTargetAtTime((0.03 + this.value * 0.12) * rand(0.5, 1.4), from, 0.8);
    if (this.value > 0.6) {
      if (this.nextCuckoo < from) this.nextCuckoo = from + rand(4, 9);
      if (this.nextCuckoo < to) {
        this.cuckoo(this.nextCuckoo);
        this.nextCuckoo += rand(8, 14);
      }
    }
  }
  private tweet(t: number) {
    const ctx = this.ctx;
    const p = this.panner(rand(-0.9, 0.9));
    const n = Math.floor(rand(2, 6));
    const base = rand(2400, 4200);
    const style = Math.random();
    for (let i = 0; i < n; i++) {
      const s = t + i * rand(0.08, 0.14);
      const o = ctx.createOscillator();
      o.type = "sine";
      const g = ctx.createGain();
      if (style < 0.5) {
        o.frequency.setValueAtTime(base, s);
        o.frequency.exponentialRampToValueAtTime(base * 1.45, s + 0.05);
        o.frequency.exponentialRampToValueAtTime(base * 0.9, s + 0.08);
      } else {
        o.frequency.setValueAtTime(base * 1.4, s);
        o.frequency.exponentialRampToValueAtTime(base * 0.85, s + 0.07);
      }
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.07, s + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, s + 0.09);
      o.connect(g).connect(p);
      o.start(s);
      o.stop(s + 0.1);
    }
  }
  private cuckoo(t: number) {
    const ctx = this.ctx;
    const p = this.panner(rand(-0.5, 0.5));
    [659, 523].forEach((f, i) => {
      const s = t + i * 0.42;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.1, s + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.36);
      o.connect(g).connect(p);
      o.start(s);
      o.stop(s + 0.4);
    });
  }
}

/* ---------------- Dust & smoke: wind, sand hiss, fire crackle ---------------- */
class DustVoice extends Voice {
  private wind!: GainNode;
  private windBp!: BiquadFilterNode;
  private whistle!: BiquadFilterNode;
  private whistleG!: GainNode;
  private sand!: GainNode;
  protected startContinuous() {
    const ctx = this.ctx;
    const src = this.loopNoise("pink");
    this.windBp = ctx.createBiquadFilter();
    this.windBp.type = "bandpass";
    this.windBp.frequency.value = 500;
    this.windBp.Q.value = 1.2;
    this.wind = ctx.createGain();
    this.wind.gain.value = 0;
    src.connect(this.windBp).connect(this.wind).connect(this.out);
    this.whistle = ctx.createBiquadFilter();
    this.whistle.type = "bandpass";
    this.whistle.frequency.value = 900;
    this.whistle.Q.value = 18;
    this.whistleG = ctx.createGain();
    this.whistleG.gain.value = 0;
    src.connect(this.whistle).connect(this.whistleG).connect(this.out);
    const w = this.loopNoise("white");
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    this.sand = ctx.createGain();
    this.sand.gain.value = 0;
    w.connect(hp).connect(this.sand).connect(this.out);
    super.startContinuous();
  }
  protected update() {
    const t = this.ctx.currentTime;
    const v = this.value;
    const type = this.sample?.dustType ?? 0;
    this.wind.gain.setTargetAtTime(0.12 + 0.9 * v, t, 0.8);
    this.whistleG.gain.setTargetAtTime(v > 0.3 ? 0.4 * v : 0, t, 1);
    this.sand.gain.setTargetAtTime(type === 1 ? 0.05 * v : 0.006 * v, t, 1);
  }
  schedule(from: number, to: number) {
    const v = this.value;
    // gusts: random walk of the wind's colour
    const f = rand(280, 600 + 900 * v);
    this.windBp.frequency.setTargetAtTime(f, from, 0.9);
    this.whistle.frequency.setTargetAtTime(rand(700, 1300 + 600 * v), from, 1.2);
    const type = this.sample?.dustType ?? 0;
    if (type === 2 && v > 0.1) {
      for (const t of this.poisson(4 + 26 * v, from, to)) this.crackle(t);
    }
  }
  private crackle(t: number) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.e.noise.white;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = rand(1500, 4500);
    bp.Q.value = 2;
    const g = ctx.createGain();
    const a = rand(0.08, 0.3);
    g.gain.setValueAtTime(a, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + rand(0.006, 0.025));
    src.connect(bp).connect(g).connect(this.panner(rand(-0.7, 0.7)));
    src.start(t, rand(0, 1.5), 0.03);
  }
}

/* ---------------- CO2: breathing drone that thickens and wobbles ---------------- */
class Co2Voice extends Voice {
  private oscs: OscillatorNode[] = [];
  private oscG: GainNode[] = [];
  private lp!: BiquadFilterNode;
  constructor(e: AudioEngine, id: LayerId) {
    super(e, id, 0.5);
  }
  protected startContinuous() {
    const ctx = this.ctx;
    this.lp = ctx.createBiquadFilter();
    this.lp.type = "lowpass";
    this.lp.frequency.value = 400;
    const breath = ctx.createGain();
    breath.gain.value = 0.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.3;
    lfo.connect(lfoG).connect(breath.gain);
    lfo.start();
    this.lp.connect(breath).connect(this.out);
    const notes = [36, 43, 48, 36, 43];
    notes.forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sine" : "sawtooth";
      o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(this.lp);
      o.start();
      this.oscs.push(o);
      this.oscG.push(g);
    });
    super.startContinuous();
  }
  protected update() {
    const t = this.ctx.currentTime;
    const v = this.value;
    const cents = droneDetuneCents(v);
    const voices = 2 + Math.round(v * 3);
    this.oscs.forEach((o, i) => {
      o.detune.setTargetAtTime(i === 0 ? 0 : (i % 2 ? 1 : -1) * cents * (0.5 + i * 0.25), t, 1.2);
      this.oscG[i].gain.setTargetAtTime(i < voices ? (i < 2 ? 0.22 : 0.07) : 0, t, 1.2);
    });
    this.lp.frequency.setTargetAtTime(280 + 1400 * v, t, 1.2);
  }
  schedule() {}
}

const VOICE_CLASSES: Record<LayerId, new (e: AudioEngine, id: LayerId) => Voice> = {
  rain: RainVoice,
  storm: StormVoice,
  ocean: OceanVoice,
  lights: LightsVoice,
  forest: ForestVoice,
  dust: DustVoice,
  co2: Co2Voice,
};

export class AudioEngine {
  ctx: AudioContext;
  bus: GainNode;
  master: GainNode;
  reverbIn: GainNode;
  analyser: AnalyserNode;
  noise: Record<"white" | "pink" | "brown", AudioBuffer>;
  voices = new Map<LayerId, Voice>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private scheduledTo = 0;
  private listeners = new Set<Listener>();
  private volume = 0.85;
  private ducked = false;

  constructor() {
    const Ctx: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx({ latencyHint: "interactive" });
    const ctx = this.ctx;
    this.noise = {
      white: makeNoise(ctx, 3, "white"),
      pink: makeNoise(ctx, 4, "pink"),
      brown: makeNoise(ctx, 4, "brown"),
    };
    this.bus = ctx.createGain();
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 4;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    this.reverbIn = ctx.createGain();
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    this.reverbIn.connect(conv).connect(wet).connect(this.master);
    this.bus.connect(this.master);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.master.connect(comp).connect(this.analyser).connect(ctx.destination);
    for (const id of LAYER_IDS) this.voices.set(id, new VOICE_CLASSES[id](this, id));
  }

  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
    if (!this.timer) {
      this.scheduledTo = this.ctx.currentTime + 0.05;
      this.timer = setInterval(() => this.tick(), 60);
    }
  }

  private tick() {
    const now = this.ctx.currentTime;
    const horizon = now + 0.25;
    if (this.scheduledTo < now) this.scheduledTo = now;
    if (horizon <= this.scheduledTo) return;
    for (const v of this.voices.values()) if (v.isActive()) v.schedule(this.scheduledTo, horizon);
    this.scheduledTo = horizon;
  }

  on(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit(e: EngineEvent) {
    setTimeout(() => this.listeners.forEach((l) => l(e)), 0);
  }

  /** Feed the latest data sample to every voice. */
  setSample(s: EarthSample) {
    for (const [id, v] of this.voices) {
      const val = id === "ocean" ? s.ocean : s[id];
      v.setSample(s, val);
    }
  }

  /** Set how loud each instrument is (0 = off). */
  setMix(mix: Partial<Record<LayerId, number>>, ramp = 0.8) {
    for (const id of LAYER_IDS) this.voices.get(id)!.setLevel(mix[id] ?? 0, ramp);
  }

  stopAll(ramp = 0.8) {
    this.setMix({}, ramp);
  }

  isPlaying() {
    for (const v of this.voices.values()) if (v.isActive()) return true;
    return false;
  }

  setVolume(v: number) {
    this.volume = v;
    this.master.gain.setTargetAtTime(this.ducked ? v * 0.35 : v, this.ctx.currentTime, 0.2);
  }
  /** Lower the music while the narrator speaks. */
  duck(on: boolean) {
    this.ducked = on;
    this.setVolume(this.volume);
  }

  /** Thunder clap: closeness 0 = far muffled rumble, 1 = sharp crack overhead. */
  thunder(t: number, closeness: number, dest: AudioNode, level: number) {
    const ctx = this.ctx;
    const c = Math.max(0, Math.min(1, closeness));
    const delay = (1 - c) * 1.2;
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.6, 0.6);
    pan.connect(dest);
    if (c > 0.45) {
      const crack = ctx.createBufferSource();
      crack.buffer = this.noise.white;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1200;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5 * c * level, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      crack.connect(hp).connect(g).connect(pan);
      crack.start(t, rand(0, 2), 0.3);
    }
    const dur = 3 + 3.5 * (1 - c) + rand(0, 1.5);
    const r = ctx.createBufferSource();
    r.buffer = this.noise.brown;
    r.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    const s = t + delay;
    lp.frequency.setValueAtTime(250 + 1400 * c, s);
    lp.frequency.exponentialRampToValueAtTime(90, s + dur);
    const g = ctx.createGain();
    const peak = (0.35 + 0.65 * c) * level;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(peak, s + 0.08 + (1 - c) * 0.4);
    // rolling rumbles
    let tt = s + 0.4;
    while (tt < s + dur - 0.5) {
      g.gain.linearRampToValueAtTime(peak * rand(0.35, 0.9), tt);
      tt += rand(0.3, 0.8);
    }
    g.gain.linearRampToValueAtTime(0, s + dur);
    r.connect(lp).connect(g).connect(pan);
    r.start(s, rand(0, 3));
    r.stop(s + dur + 0.1);
    const ms = Math.max(0, (t - ctx.currentTime) * 1000);
    setTimeout(() => this.listeners.forEach((l) => l({ layer: "storm", kind: "thunder", strength: c })), ms);
  }

  /** Music-box bell. */
  bell(t: number, f: number, gain: number, pan: number, dest: AudioNode) {
    const ctx = this.ctx;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(dest);
    [
      [1, 1, 1.4],
      [2.76, 0.35, 0.5],
      [5.4, 0.12, 0.25],
    ].forEach(([mult, amp, dec]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * mult;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * amp, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dec);
      o.connect(g).connect(p);
      o.start(t);
      o.stop(t + dec + 0.05);
    });
  }

  /** Soft marimba note straight to the master (used for map scanning & keyboard radar). */
  marimba(f: number, gain = 0.25, pan = 0, when = 0) {
    const ctx = this.ctx;
    const t = when || ctx.currentTime + 0.01;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(this.bus);
    const s = ctx.createGain();
    s.gain.value = 0.3;
    p.connect(s).connect(this.reverbIn);
    [
      [1, 1, 0.7],
      [4, 0.18, 0.12],
    ].forEach(([m, a, d]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * m;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * a, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0005, t + d);
      o.connect(g).connect(p);
      o.start(t);
      o.stop(t + d + 0.05);
    });
  }
}

let engine: AudioEngine | null = null;
/** Create (on first user gesture) and resume the shared engine. */
export async function getEngine(): Promise<AudioEngine> {
  if (!engine) engine = new AudioEngine();
  await engine.resume();
  return engine;
}
export function peekEngine() {
  return engine;
}
