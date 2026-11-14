/**
 * Pure rules that turn a data value (0..1) into sound settings.
 * Kept free of Web Audio so they can be unit-tested.
 */

/** Index 0..4 into a layer's five level words. */
export function levelIndex(v: number): 0 | 1 | 2 | 3 | 4 {
  if (v < 0.08) return 0;
  if (v < 0.3) return 1;
  if (v < 0.55) return 2;
  if (v < 0.8) return 3;
  return 4;
}

/** Humidity → raindrops per second. Dry places get none; very wet places pour. */
export function raindropsPerSecond(humidity: number): number {
  if (humidity < 0.08) return 0;
  return 0.6 + 42 * humidity * humidity;
}

/** Humidity → loudness of the steady rain "hiss" (only when it is really raining). */
export function rainHissLevel(humidity: number): number {
  if (humidity < 0.45) return 0;
  return Math.min(1, (humidity - 0.45) / 0.55);
}

/** Very wet air also brings far-away thunder. */
export function rainBringsThunder(humidity: number): boolean {
  return humidity >= 0.8;
}

/** Lightning amount → seconds between thunder claps. Infinity = no thunder. */
export function thunderIntervalSeconds(lightning: number): number {
  if (lightning < 0.05) return Infinity;
  return 14 - 11.5 * Math.min(1, lightning);
}

/** Lightning amount → how close the storm sounds (0 far and muffled, 1 overhead crack). */
export function thunderCloseness(lightning: number): number {
  return Math.max(0, Math.min(1, (lightning - 0.05) / 0.85));
}

export type OceanMood = "cold" | "mild" | "warm";
/** Sea temperature → chord mood: cold = minor, warm = major. */
export function oceanMood(warmth: number): OceanMood {
  if (warmth < 0.38) return "cold";
  if (warmth > 0.62) return "warm";
  return "mild";
}

/** City brightness → music-box notes per second. */
export function bellNotesPerSecond(brightness: number): number {
  if (brightness < 0.04) return 0;
  return 0.35 + 7 * brightness;
}

/** Forest height → bird songs per second. */
export function birdsPerSecond(forest: number): number {
  if (forest < 0.06) return 0;
  return 0.15 + 2.4 * forest;
}

/** CO2 → how many cents the drone voices drift apart (more = more wobble). */
export function droneDetuneCents(co2: number): number {
  return 3 + 30 * Math.max(0, Math.min(1, co2));
}

/** Major / minor pentatonic scale degrees in semitones. */
export const PENTATONIC_MAJOR = [0, 2, 4, 7, 9];
export const PENTATONIC_MINOR = [0, 3, 5, 7, 10];

export function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

/** Pick a note from a pentatonic scale: step 0 = root, keeps every input musical. */
export function pentatonicFreq(rootMidi: number, step: number, minor = false) {
  const scale = minor ? PENTATONIC_MINOR : PENTATONIC_MAJOR;
  const oct = Math.floor(step / scale.length);
  const deg = ((step % scale.length) + scale.length) % scale.length;
  return midiToFreq(rootMidi + oct * 12 + scale[deg]);
}
