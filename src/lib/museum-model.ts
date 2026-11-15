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
/** Sun elevation cosine at a place: 1 = Sun overhead, -1 = midnight. */
export function sunCosine(lat: number, lng: number, sun: { lat: number; lng: number }) {
  const r = Math.PI / 180;
  return Math.sin(lat*r)*Math.sin(sun.lat*r)+Math.cos(lat*r)*Math.cos(sun.lat*r)*Math.cos((lng-sun.lng)*r);
}
export type DayPhase = "day" | "twilight" | "night";
export const DAY_PHASE_LABEL: Record<DayPhase, string> = {
  day: "Day Side — Sunlight",
  twilight: "Twilight — Sunrise / Sunset Line",
  night: "Night Side — City Lights Active",
};
/** What the visitor faces: day, the sunrise/sunset band, or the night side with city lights. */
export function dayPhase(lat: number, lng: number, sun: { lat: number; lng: number }): DayPhase {
  const c = sunCosine(lat, lng, sun);
  return c > 0.1 ? "day" : c < -0.1 ? "night" : "twilight";
}
/** Share (0-100) of the visible half of the globe that is in night. */
export function nightShare(lat: number, lng: number, sun: { lat: number; lng: number }) {
  return Math.round(((1 - sunCosine(lat, lng, sun)) / 2) * 100);
}
/** Spoken line that matches what is really at the touched spot (land vs sea, none vs a lot). */
export function childLine(layer: MuseumLayer, word: string, amount: number, onLand: boolean) {
  const none = amount < 0.12;
  switch (layer) {
    case "ocean":
      return onLand ? "This is land, so there is no sea here. Move to the water to hear the waves."
        : `Sea temperature here: ${word}. Listen to the ${amount > 0.62 ? "warm, gentle" : amount < 0.38 ? "cold, deep" : "rolling"} waves.`;
    case "storm":
      return none ? `Almost no lightning here, the sky is quiet${onLand ? "" : " over the sea"}.`
        : `Lightning here: ${word}. Listen for the thunder${amount > 0.62 ? ", it is close and loud" : " far away"}.`;
    case "forest":
      return !onLand ? "This is open sea, so there are no trees here. Move to land to hear the forest."
        : none ? "Very few trees grow here, so the birds are quiet."
        : `Forest here: ${word}. Listen to the birds in the trees.`;
    case "lights":
      return none ? (onLand ? "Very few city lights here, the night is dark and quiet." : "This is the sea at night, no city lights here.")
        : `City lights here: ${word}. Listen to the bells of the night.`;
  }
}
export function museumSnapshot(layer: MuseumLayer, lat: number, lng: number, value?: number) {
  const sample = sampleEarth(lat, lng);
  if (value !== undefined) sample[layer] = Math.max(0, Math.min(1, value));
  const amount = layer === "ocean" && sample.land > 0.6 ? 0 : sample[layer];
  const name = describePlace(lat, lng, sample.land > 0.5);
  const word = layer === "ocean" && sample.land > 0.6 ? "No sea here" : LAYERS[layer].levels[levelIndex(amount)];
  return { lat, lng, sample, amount, name, word, pitch: latitudeToFreq(lat), pan: longitudeToPan(lng),
    thermal: layer !== "ocean" || sample.land > 0.6 ? "Neutral" : amount < 0.38 ? "Cool" : amount > 0.62 ? "Warm" : "Mild",
    caption: `You touched ${name}. ${childLine(layer, word, amount, sample.land > 0.5)}` };
}