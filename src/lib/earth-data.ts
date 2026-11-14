import { GRIDS_B64, GRID_H, GRID_W } from "@/data/earth-grids";
import type { LayerId } from "@/lib/layers";

export interface EarthSample {
  rain: number;
  storm: number;
  ocean: number;
  lights: number;
  forest: number;
  dust: number;
  co2: number;
  /** 0 = open ocean, 1 = land */
  land: number;
  /** 0 sea salt, 1 dust, 2 smoke, 3 pollution */
  dustType: number;
}

type GridKey = keyof typeof GRIDS_B64;
const cache = new Map<GridKey, Uint8Array>();

function decode(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function grid(key: GridKey): Uint8Array {
  let g = cache.get(key);
  if (!g) {
    g = decode(GRIDS_B64[key]);
    cache.set(key, g);
  }
  return g;
}

export function wrapLng(lng: number) {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}
export function clampLat(lat: number) {
  return Math.max(-89.9, Math.min(89.9, lat));
}

/** Bilinear sample of one grid at a lat/lng, 0..1 */
export function sampleGrid(key: GridKey, lat: number, lng: number, nearest = false): number {
  const g = grid(key);
  const x = ((wrapLng(lng) + 180) / 360) * GRID_W - 0.5;
  const y = ((90 - clampLat(lat)) / 180) * GRID_H - 0.5;
  if (nearest) {
    const xi = ((Math.round(x) % GRID_W) + GRID_W) % GRID_W;
    const yi = Math.max(0, Math.min(GRID_H - 1, Math.round(y)));
    return g[yi * GRID_W + xi] / 255;
  }
  const x0 = Math.floor(x);
  const y0 = Math.max(0, Math.min(GRID_H - 1, Math.floor(y)));
  const y1 = Math.min(GRID_H - 1, y0 + 1);
  const fx = x - x0;
  const fy = Math.max(0, Math.min(1, y - y0));
  const xa = ((x0 % GRID_W) + GRID_W) % GRID_W;
  const xb = (xa + 1) % GRID_W;
  const v =
    g[y0 * GRID_W + xa] * (1 - fx) * (1 - fy) +
    g[y0 * GRID_W + xb] * fx * (1 - fy) +
    g[y1 * GRID_W + xa] * (1 - fx) * fy +
    g[y1 * GRID_W + xb] * fx * fy;
  return v / 255;
}

export function sampleEarth(lat: number, lng: number): EarthSample {
  return {
    rain: sampleGrid("rain", lat, lng),
    storm: sampleGrid("storm", lat, lng),
    ocean: sampleGrid("ocean", lat, lng),
    lights: sampleGrid("lights", lat, lng),
    forest: sampleGrid("forest", lat, lng),
    dust: sampleGrid("dust", lat, lng),
    co2: sampleGrid("co2", lat, lng),
    land: sampleGrid("land", lat, lng),
    dustType: Math.round(sampleGrid("dustType", lat, lng, true) * 3),
  };
}

/** How "present" a layer is at this spot, 0..1 (ocean warmth only counts over water). */
export function layerStrength(layer: LayerId, s: EarthSample): number {
  if (layer === "ocean") return s.land > 0.6 ? 0 : s.ocean;
  return s[layer];
}
