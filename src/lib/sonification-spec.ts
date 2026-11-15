// Research-inspired sonification helpers (Erie spec, DIXTRAL probe, Umwelt sync, A Universe of Sound evaluation).
// Our own implementation of the ideas — these libraries are not bundled.
import type { LayerId } from "@/lib/layers";

export type CoreLayerId = "ocean" | "storm" | "forest" | "lights";
export type ErieScale = "linear" | "quadratic" | "logarithmic";

export interface ErieSpec {
  id: CoreLayerId;
  field: string;
  unit: string;
  inputRange: [number, number]; // normalized data
  outputRange: [number, number]; // Hz, seconds between booms, songs/s, chimes/s
  scale: ErieScale;
  legend: { low: string; mid: string; high: string; speechRule: string };
}

export const ERIE_SPECS: Record<CoreLayerId, ErieSpec> = {
  ocean: {
    id: "ocean",
    field: "sea_surface_temp",
    unit: "Hz",
    inputRange: [0, 1],
    outputRange: [220, 660], // A3 (polar) to E5 (equatorial)
    scale: "linear",
    legend: {
      low: "Freezing polar sea",
      mid: "Temperate waters",
      high: "Warm tropical ocean",
      speechRule: "Low, solemn chords to bright, warm chords means polar ice to equator.",
    },
  },
  storm: {
    id: "storm",
    field: "lightning_flash_density",
    unit: "seconds between booms",
    inputRange: [0, 1],
    outputRange: [14, 2.5], // inverted: more lightning = shorter pauses
    scale: "linear",
    legend: {
      low: "Far-away rumble",
      mid: "Storm nearby",
      high: "Thunder overhead",
      speechRule: "Long pauses to rapid booms means calm skies to dangerous electric storms.",
    },
  },
  forest: {
    id: "forest",
    field: "canopy_height",
    unit: "bird songs per second",
    inputRange: [0, 1],
    outputRange: [0.15, 2.55],
    scale: "linear",
    legend: {
      low: "Sparse grassland",
      mid: "Woodland canopy",
      high: "Dense rainforest",
      speechRule: "Few birds to vibrant forest chatter means bare ground to towering jungle canopy.",
    },
  },
  lights: {
    id: "lights",
    field: "night_radiance",
    unit: "chimes per second",
    inputRange: [0, 1],
    outputRange: [0.35, 7.35],
    scale: "linear",
    legend: {
      low: "Quiet countryside",
      mid: "Suburban town",
      high: "Bustling metropolis",
      speechRule: "Sparse single chimes to rapid bell arpeggios means dark rural land to bright cities.",
    },
  },
};

/** App layer ids → Erie spec. */
const ERIE_FOR_LAYER: Partial<Record<LayerId | string, CoreLayerId>> = {
  ocean: "ocean", waves: "ocean", sea: "ocean",
  storm: "storm", thunder: "storm", lightning: "storm",
  forest: "forest", birds: "forest", birdsong: "forest", trees: "forest",
  lights: "lights", city: "lights", cities: "lights", bells: "lights",
};

export const erieFor = (layer: string): ErieSpec | null => {
  const id = ERIE_FOR_LAYER[layer];
  return id ? ERIE_SPECS[id] : null;
};

/** Evaluates an Erie spec for a normalized input value. */
export function evaluateErie(spec: ErieSpec, value: number): number {
  const [inMin, inMax] = spec.inputRange;
  const [outMin, outMax] = spec.outputRange;
  const span = inMax - inMin;
  const clamped = Math.max(inMin, Math.min(inMax, Number.isFinite(value) ? value : inMin));
  const norm = span === 0 ? 0 : (clamped - inMin) / span;
  const shaped =
    spec.scale === "quadratic" ? norm * norm : spec.scale === "logarithmic" ? Math.log1p(9 * norm) / Math.log(10) : norm;
  return outMin + (outMax - outMin) * shaped;
}

// ============================================================================
// 2. DIXTRAL: instant auditory probe for blind navigation
// ============================================================================
export interface DixtralProbeResult {
  lat: number;
  lng: number;
  value: number;
  audioFrequencyHz: number;
  spokenOutput: string;
}

export function dixtralProbe(lat: number, lng: number, layer: CoreLayerId, value: number): DixtralProbeResult {
  const spec = ERIE_SPECS[layer];
  const audioVal = evaluateErie(spec, value);
  // Beacon pitch follows ocean warmth, otherwise latitude (higher = further north).
  const audioFrequencyHz = layer === "ocean" ? audioVal : 440 * Math.pow(2, lat / 90);
  const level = value < 0.33 ? spec.legend.low : value < 0.66 ? spec.legend.mid : spec.legend.high;
  const spokenOutput = `${spec.field.replace(/_/g, " ")}: ${level} at ${Math.abs(lat).toFixed(1)}° ${
    lat >= 0 ? "North" : "South"
  }, ${Math.abs(lng).toFixed(1)}° ${lng >= 0 ? "East" : "West"}.`;
  return { lat, lng, value, audioFrequencyHz, spokenOutput };
}

// ============================================================================
// 3. UMWELT: one snapshot keeps reticle, audio and caption in sync
// ============================================================================
export interface UmweltState {
  target: { lat: number; lng: number; name: string };
  layer: CoreLayerId;
  frameIndex?: number;
  frameDate?: string;
  dataValue: number;
  visualReticlePx: { x: number; y: number };
  audioSynthParams: { frequency: number; rate: number };
  ariaLiveCaption: string;
}

export function createUmweltSnapshot(
  lat: number,
  lng: number,
  name: string,
  layer: CoreLayerId,
  value: number,
  frame?: number,
  date?: string,
  canvasWidth = 1000,
  canvasHeight = 500,
): UmweltState {
  const probe = dixtralProbe(lat, lng, layer, value);
  const framePart = frame !== undefined ? `: Frame ${frame}${date ? ` (${date})` : ""}` : "";
  return {
    target: { lat, lng, name },
    layer,
    frameIndex: frame,
    frameDate: date,
    dataValue: value,
    visualReticlePx: { x: ((lng + 180) / 360) * canvasWidth, y: ((90 - lat) / 180) * canvasHeight },
    audioSynthParams: { frequency: probe.audioFrequencyHz, rate: value },
    ariaLiveCaption: `${name}${framePart}. ${probe.spokenOutput}`,
  };
}

// ============================================================================
// 4. "A Universe of Sound" evaluation form validator
// ============================================================================
export interface EvaluationResponse {
  enjoymentRating: 1 | 2 | 3 | 4 | 5;
  comprehension: "yes" | "partially" | "no";
  scientificTrust: "high" | "moderate" | "low";
  visitorProfile: "blind" | "low-vision" | "sighted";
}

export function validateEvaluation(r: EvaluationResponse): boolean {
  return (
    Number.isInteger(r.enjoymentRating) &&
    r.enjoymentRating >= 1 &&
    r.enjoymentRating <= 5 &&
    ["yes", "partially", "no"].includes(r.comprehension) &&
    ["high", "moderate", "low"].includes(r.scientificTrust) &&
    ["blind", "low-vision", "sighted"].includes(r.visitorProfile)
  );
}

export const VISITOR_LABEL: Record<EvaluationResponse["visitorProfile"], string> = {
  blind: "Blind",
  "low-vision": "Low vision",
  sighted: "Sighted",
};
