import { wrapLng, sampleEarth } from "@/lib/earth-data";
import { latitudeToFreq, longitudeToPan, levelIndex } from "@/lib/sonify-map";
import { LAYERS, type LayerId } from "@/lib/layers";
import { describePlace } from "@/lib/places";

export const MUSEUM_LAYERS = ["ocean", "storm", "forest", "lights"] as const;
export type MuseumLayer = typeof MUSEUM_LAYERS[number];
export function isMuseumLayer(id: LayerId): id is MuseumLayer { return MUSEUM_LAYERS.some(l => l === id); }
export function joystickMove(position: { lat: number; lng: number }, direction: number) {
  return { lat: position.lat, lng: wrapLng(position.lng + direction * 10) };
}
export function mapCoordinates(x: number, y: number) {
  return { lat: 90 - Math.max(0, Math.min(1, y)) * 180, lng: Math.max(0, Math.min(1, x)) * 360 - 180 };
}
export function reticlePosition(lat: number, lng: number) { return { x: (lng + 180) / 360, y: (90 - lat) / 180 }; }
export function solarPosition(date: Date) {
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const day = (date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000;
  return { lng: wrapLng(180 - hours * 15), lat: 23.44 * Math.sin(2 * Math.PI * (day - 80) / 365.25) };
}
export function isDaylight(lat: number, lng: number, sun: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  return Math.sin(lat*r)*Math.sin(sun.lat*r)+Math.cos(lat*r)*Math.cos(sun.lat*r)*Math.cos((lng-sun.lng)*r) > 0;
}
export function museumSnapshot(layer: MuseumLayer, lat: number, lng: number, value?: number) {
  const sample = sampleEarth(lat, lng);
  if (value !== undefined) sample[layer] = Math.max(0, Math.min(1, value));
  const amount = layer === "ocean" && sample.land > 0.6 ? 0 : sample[layer];
  const name = describePlace(lat, lng, sample.land > 0.5);
  const word = layer === "ocean" && sample.land > 0.6 ? "No sea here" : LAYERS[layer].levels[levelIndex(amount)];
  return { lat, lng, sample, amount, name, word, pitch: latitudeToFreq(lat), pan: longitudeToPan(lng),
    thermal: layer !== "ocean" || sample.land > 0.6 ? "Neutral" : amount < 0.38 ? "Cool" : amount > 0.62 ? "Warm" : "Mild",
    caption: `${name}. ${LAYERS[layer].name}: ${word}. Illustrative NASA image-based value.` };
}