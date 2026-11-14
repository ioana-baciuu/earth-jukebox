import { wrapLng } from "@/lib/earth-data";

export interface Place {
  name: string;
  lat: number;
  lng: number;
  /** One friendly sentence for kids */
  blurb: string;
  featured?: boolean;
}

export const PLACES: Place[] = [
  { name: "Amazon Rainforest", lat: -3, lng: -60, blurb: "The biggest rainforest on Earth, full of rain and birds.", featured: true },
  { name: "Congo Rainforest", lat: 0, lng: 22, blurb: "Africa's great jungle, one of the stormiest places anywhere.", featured: true },
  { name: "Sahara Desert", lat: 23, lng: 10, blurb: "A giant sea of sand where the wind carries dust across the ocean.", featured: true },
  { name: "Lake Maracaibo", lat: 9.6, lng: -71.6, blurb: "The lightning capital of the world, in Venezuela.", featured: true },
  { name: "Tokyo", lat: 35.7, lng: 139.7, blurb: "One of the biggest, brightest cities on the planet.", featured: true },
  { name: "Pacific Ocean", lat: 0, lng: -150, blurb: "The largest ocean, warm and wide near the equator.", featured: true },
  { name: "Arctic Ocean", lat: 82, lng: 10, blurb: "Icy cold water at the top of the world.", featured: true },
  { name: "Bucharest", lat: 44.4, lng: 26.1, blurb: "The capital of Romania, where Earth Jukebox was made.", featured: true },
  { name: "Gulf Stream", lat: 37, lng: -68, blurb: "A warm river inside the Atlantic Ocean.", featured: true },
  { name: "India", lat: 21, lng: 79, blurb: "Bright cities, monsoon rain and busy skies.", featured: true },
  { name: "Antarctica", lat: -80, lng: 0, blurb: "The frozen continent at the bottom of the world." },
  { name: "Great Barrier Reef", lat: -18, lng: 147, blurb: "Warm water and the largest coral reef on Earth." },
  { name: "Australian Outback", lat: -25, lng: 133, blurb: "Red, dry land in the middle of Australia." },
  { name: "Himalaya mountains", lat: 28, lng: 86, blurb: "The tallest mountains on Earth." },
  { name: "Siberia", lat: 62, lng: 100, blurb: "Huge cold forests in northern Asia." },
  { name: "Borneo", lat: 1, lng: 114, blurb: "An island of tall rainforests and thunderstorms." },
  { name: "New York", lat: 40.7, lng: -74, blurb: "A huge city that glows all night." },
  { name: "London", lat: 51.5, lng: -0.1, blurb: "A big city by the River Thames." },
  { name: "Paris", lat: 48.85, lng: 2.35, blurb: "The city of lights." },
  { name: "Cairo and the Nile", lat: 30, lng: 31.2, blurb: "A bright ribbon of lights along a desert river." },
  { name: "Beijing", lat: 39.9, lng: 116.4, blurb: "A busy capital city in China." },
  { name: "Mumbai", lat: 19, lng: 72.8, blurb: "A big city on India's coast." },
  { name: "Lagos", lat: 6.5, lng: 3.4, blurb: "A big, busy city in West Africa." },
  { name: "Mexico City", lat: 19.4, lng: -99.1, blurb: "A huge city high in the mountains." },
  { name: "Los Angeles", lat: 34, lng: -118.2, blurb: "A sunny city on the Pacific coast." },
  { name: "Rio de Janeiro", lat: -22.9, lng: -43.2, blurb: "A city between mountains and sea." },
  { name: "Andes mountains", lat: -15, lng: -70, blurb: "The longest mountain chain on land." },
  { name: "Greenland", lat: 72, lng: -40, blurb: "A giant island covered in ice." },
  { name: "Iceland", lat: 65, lng: -18, blurb: "An island of ice and volcanoes." },
  { name: "Gobi Desert", lat: 43, lng: 105, blurb: "A cold, windy desert in Asia." },
  { name: "Hawaii", lat: 20, lng: -157, blurb: "Volcanic islands in the warm Pacific." },
  { name: "Kuroshio Current", lat: 33, lng: 142, blurb: "A fast, warm current next to Japan." },
  { name: "Agulhas Current", lat: -36, lng: 25, blurb: "Swirling warm water south of Africa." },
  { name: "Indian Ocean", lat: -20, lng: 80, blurb: "A warm ocean between Africa and Australia." },
  { name: "Southern Ocean", lat: -58, lng: 20, blurb: "Wild, cold, windy water around Antarctica." },
  { name: "Atlantic Ocean", lat: 10, lng: -35, blurb: "The ocean between the Americas and Africa." },
  { name: "North Atlantic", lat: 50, lng: -30, blurb: "Stormy grey sea between America and Europe." },
  { name: "North Pacific", lat: 40, lng: -165, blurb: "Big waves and storms between Asia and America." },
  { name: "South Pacific", lat: -35, lng: -120, blurb: "A huge, lonely blue ocean." },
];

export const FEATURED_PLACES = PLACES.filter((p) => p.featured);

function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A friendly name for any spot on Earth. */
export function describePlace(lat: number, lng: number, isLand: boolean): string {
  lng = wrapLng(lng);
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of PLACES) {
    const d = distanceKm(lat, lng, p.lat, p.lng);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  if (best && bestD < 350) return best.name;
  if (best && bestD < 1300) return `${isLand ? "Near" : "Sea near"} ${best.name}`;
  if (lat > 66) return isLand ? "The far north" : "Arctic Ocean";
  if (lat < -60) return isLand ? "Antarctica" : "Southern Ocean";
  if (!isLand) {
    if (lng > -70 && lng < 20) return lat > 0 ? "North Atlantic Ocean" : "South Atlantic Ocean";
    if (lng >= 20 && lng < 120 && lat < 25) return "Indian Ocean";
    return lat > 0 ? "North Pacific Ocean" : "South Pacific Ocean";
  }
  if (lng < -30) return lat > 12 ? "North America" : "South America";
  if (lng < 60 && lat > 36) return "Europe";
  if (lng < 55) return "Africa";
  if (lat < -10 && lng > 110) return "Australia";
  return "Asia";
}

export function formatCoords(lat: number, lng: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(0)}° ${ns}, ${Math.abs(wrapLng(lng)).toFixed(0)}° ${ew}`;
}
