import oceanAtlas from "@/assets/nasa-sequences/ocean-atlas.jpg.asset.json";
import stormAtlas from "@/assets/nasa-sequences/storm-atlas.jpg.asset.json";
import forestAtlas from "@/assets/nasa-sequences/forest-atlas.jpg.asset.json";
import lightsAtlas from "@/assets/nasa-sequences/lights-atlas.jpg.asset.json";
import ocean from "@/assets/nasa-sequences/ocean-manifest.json";
import storm from "@/assets/nasa-sequences/storm-manifest.json";
import forest from "@/assets/nasa-sequences/forest-manifest.json";
import lights from "@/assets/nasa-sequences/lights-manifest.json";
import type { MuseumLayer } from "./museum-model";
export const SEQUENCES = {
  ocean: { ...ocean, atlas: oceanAtlas.url }, storm: { ...storm, atlas: stormAtlas.url },
  forest: { ...forest, atlas: forestAtlas.url }, lights: { ...lights, atlas: lightsAtlas.url },
};
const cache = new Map<string, Uint8Array>();
export function frameValue(layer: MuseumLayer, frame: number, lat: number, lng: number) {
  const seq = SEQUENCES[layer];
  if (!seq.georeferenced) return undefined;
  const encoded = seq.grids[Math.max(0, Math.min(seq.frameCount - 1, frame))];
  if (!encoded) return undefined;
  let data = cache.get(encoded);
  if (!data) { data = Uint8Array.from(atob(encoded), c => c.charCodeAt(0)); cache.set(encoded, data); }
  const x = Math.min(143, Math.max(0, Math.floor((lng + 180) / 360 * 144)));
  const y = Math.min(71, Math.max(0, Math.floor((90 - lat) / 180 * 72)));
  return (data[y * 144 + x] ?? 0) / 255;
}