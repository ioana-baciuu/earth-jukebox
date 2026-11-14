import { describe, expect, it } from "vitest";
import {
  bellNotesPerSecond,
  oceanMood,
  rainBringsThunder,
  rainHissLevel,
  raindropsPerSecond,
  thunderIntervalSeconds,
} from "@/lib/sonify-map";
import { sampleEarth } from "@/lib/earth-data";

describe("humidity becomes rain", () => {
  it("a dry place makes no drops", () => {
    expect(raindropsPerSecond(0.02)).toBe(0);
  });
  it("wet places have far more drops than slightly damp places", () => {
    expect(raindropsPerSecond(0.95)).toBeGreaterThan(raindropsPerSecond(0.2) * 10);
  });
  it("only really wet air adds the steady pouring-rain hiss", () => {
    expect(rainHissLevel(0.3)).toBe(0);
    expect(rainHissLevel(0.95)).toBeGreaterThan(0.8);
  });
  it("very wet air brings far-away thunder", () => {
    expect(rainBringsThunder(0.9)).toBe(true);
    expect(rainBringsThunder(0.5)).toBe(false);
  });
});

describe("lightning becomes thunder", () => {
  it("no lightning means no thunder", () => {
    expect(thunderIntervalSeconds(0)).toBe(Infinity);
  });
  it("more lightning means thunder more often", () => {
    expect(thunderIntervalSeconds(1)).toBeLessThan(thunderIntervalSeconds(0.3));
  });
});

describe("other layers", () => {
  it("cold sea is minor, warm sea is major", () => {
    expect(oceanMood(0.1)).toBe("cold");
    expect(oceanMood(0.9)).toBe("warm");
  });
  it("dark countryside has no bells", () => {
    expect(bellNotesPerSecond(0)).toBe(0);
  });
});

describe("NASA data grids", () => {
  it("the Amazon is wetter than the Sahara", () => {
    expect(sampleEarth(-3, -60).rain).toBeGreaterThan(sampleEarth(23, 10).rain + 0.5);
  });
  it("the Congo has more lightning than Europe", () => {
    expect(sampleEarth(0, 22).storm).toBeGreaterThan(sampleEarth(50, 8).storm);
  });
  it("Tokyo is brighter at night than the Sahara", () => {
    expect(sampleEarth(35.7, 139.7).lights).toBeGreaterThan(0.6);
    expect(sampleEarth(23, 10).lights).toBeLessThan(0.1);
  });
});

import { coastCrossing, latitudeToFreq, longitudeToPan } from "@/lib/sonify-map";
describe("sonic navigation", () => {
  it("north pole is one octave above the equator, south pole one below", () => {
    expect(latitudeToFreq(0)).toBeCloseTo(440);
    expect(latitudeToFreq(90)).toBeCloseTo(880);
    expect(latitudeToFreq(-90)).toBeCloseTo(220);
  });
  it("west pans left, east pans right", () => {
    expect(longitudeToPan(-180)).toBe(-1);
    expect(longitudeToPan(0)).toBe(0);
    expect(longitudeToPan(180)).toBe(1);
  });
  it("detects stepping onto land and back into the sea", () => {
    expect(coastCrossing(0, 1)).toBe("to-land");
    expect(coastCrossing(1, 0)).toBe("to-water");
    expect(coastCrossing(1, 0.9)).toBeNull();
  });
});
