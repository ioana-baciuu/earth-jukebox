import skinRain from "@/assets/earth/skin-rain.jpg.asset.json";
import skinStorm from "@/assets/earth/skin-storm.jpg.asset.json";
import skinOcean from "@/assets/earth/skin-ocean.jpg.asset.json";
import skinLights from "@/assets/earth/skin-lights.jpg.asset.json";
import skinForest from "@/assets/earth/skin-forest.jpg.asset.json";
import skinDust from "@/assets/earth/skin-dust.jpg.asset.json";
import skinCo2 from "@/assets/earth/skin-co2.jpg.asset.json";
import nasaRain from "@/assets/earth/nasa-rain.jpg.asset.json";
import nasaLightning from "@/assets/earth/nasa-lightning.jpg.asset.json";
import nasaSst from "@/assets/earth/nasa-sst.jpg.asset.json";
import nasaCurrents from "@/assets/earth/nasa-currents.jpg.asset.json";
import nasaNight from "@/assets/earth/nasa-night.jpg.asset.json";
import nasaForest from "@/assets/earth/nasa-forest.jpg.asset.json";
import nasaAerosol from "@/assets/earth/nasa-aerosol.jpg.asset.json";
import nasaCo2 from "@/assets/earth/nasa-co2.jpg.asset.json";

export type LayerId = "rain" | "storm" | "ocean" | "lights" | "forest" | "dust" | "co2";

export const LAYER_IDS: LayerId[] = ["ocean", "storm", "forest", "lights"];

export interface LayerInfo {
  id: LayerId;
  /** Short, kid-friendly name */
  name: string;
  /** Instrument name used in the Orchestra */
  instrument: string;
  /** What you hear, in one sentence for children */
  sound: string;
  /** What the data is */
  about: string;
  /** Five words from "none" to "a lot" */
  levels: [string, string, string, string, string];
  skin: string;
  image: string;
  imageAlt: string;
  credit: string;
  creditUrl: string;
  shortcut: string;
}

export const LAYERS: Record<LayerId, LayerInfo> = {
  rain: {
    id: "rain",
    name: "Rain & clouds",
    instrument: "Raindrops",
    sound:
      "Single drops where the air is dry. Where it is very wet, the drops grow into pouring rain with far-away thunder.",
    about:
      "How much water floats in the air. Rivers of water vapour in the sky carry rain from warm seas to land.",
    levels: ["dry as a desert", "a few drops", "a gentle shower", "steady rain", "pouring rain"],
    skin: skinRain.url,
    image: nasaRain.url,
    imageAlt:
      "NASA model of an atmospheric river: a long blue band of water vapour stretching across the Pacific Ocean toward the west coast of North America.",
    credit: "NASA SVS · A 3D View of an Atmospheric River",
    creditUrl: "https://svs.gsfc.nasa.gov/4960",
    shortcut: "1",
  },
  storm: {
    id: "storm",
    name: "Lightning & thunder",
    instrument: "Thunder drums",
    sound:
      "Thunder rumbles. The more lightning a place has, the closer and more often the thunder booms.",
    about:
      "Flashes of lightning counted from the International Space Station between 2017 and 2023.",
    levels: ["calm skies", "a far-away rumble", "a storm nearby", "a big storm", "lightning everywhere"],
    skin: skinStorm.url,
    image: nasaLightning.url,
    imageAlt:
      "NASA view from space of Africa at night with small yellow flashes where the space station saw lightning.",
    credit: "NASA SVS · Lightning Events Detected from the ISS",
    creditUrl: "https://svs.gsfc.nasa.gov/5011",
    shortcut: "2",
  },
  ocean: {
    id: "ocean",
    name: "Sea temperature",
    instrument: "Ocean waves",
    sound:
      "Waves wash in and out. Warm water sings a bright happy chord. Cold water sings low, and a whale may call.",
    about:
      "The temperature of the sea surface and the currents that carry warm water around the planet.",
    levels: ["icy cold", "chilly", "cool", "warm", "bath-warm"],
    skin: skinOcean.url,
    image: nasaCurrents.url,
    imageAlt:
      "NASA Perpetual Ocean globe: swirling white lines of ocean currents over a deep blue Pacific, with Asia and Australia visible.",
    credit: "NASA SVS · Global Sea Surface Currents and Temperature · Perpetual Ocean 2",
    creditUrl: "https://svs.gsfc.nasa.gov/3912",
    shortcut: "1",
  },
  lights: {
    id: "lights",
    name: "Night lights",
    instrument: "Music box",
    sound:
      "Twinkling music-box bells. Dark countryside is quiet; big bright cities sparkle with many notes.",
    about:
      "The lights people switch on at night, seen from space by NASA's Black Marble satellites.",
    levels: ["dark night", "a few lamps", "a small town", "a busy city", "a giant glowing city"],
    skin: skinLights.url,
    image: nasaNight.url,
    imageAlt:
      "NASA flat map of Earth at night showing glowing city lights, with zoomed boxes over Europe, India and Ukraine.",
    credit: "NASA SVS · Change in Night Lights 2012–2023 (EIC)",
    creditUrl: "https://svs.gsfc.nasa.gov/5313",
    shortcut: "4",
  },
  forest: {
    id: "forest",
    name: "Forest height",
    instrument: "Birdsong",
    sound:
      "Leaves rustle and birds sing. Tall thick forests are full of birds and a cuckoo calls.",
    about:
      "How tall and thick the trees are, measured with lasers from space by NASA's GEDI instrument.",
    levels: ["no trees", "a few bushes", "a small wood", "a thick forest", "a giant rainforest"],
    skin: skinForest.url,
    image: nasaForest.url,
    imageAlt:
      "NASA GEDI globe of Africa and Europe where taller forests rise up in bright green bumps.",
    credit: "NASA SVS · GEDI Forest Height",
    creditUrl: "https://svs.gsfc.nasa.gov/4950",
    shortcut: "3",
  },
  dust: {
    id: "dust",
    name: "Wind, dust & smoke",
    instrument: "Wind flute",
    sound:
      "The wind whooshes. Desert dust hisses like sand, smoke from fires crackles, and sea spray swooshes.",
    about:
      "Tiny bits floating in the air: desert dust, smoke from fires, sea salt and pollution.",
    levels: ["still, clean air", "a soft breeze", "a dusty wind", "a strong wind", "a big dust storm"],
    skin: skinDust.url,
    image: nasaAerosol.url,
    imageAlt:
      "NASA GEOS globe of the Americas with pink desert dust crossing the Atlantic, orange smoke over South America and blue swirls of sea salt.",
    credit: "NASA SVS · GEOS Aerosols",
    creditUrl: "https://svs.gsfc.nasa.gov/5572",
    shortcut: "6",
  },
  co2: {
    id: "co2",
    name: "Air we breathe (CO₂)",
    instrument: "Deep drone",
    sound:
      "A slow breathing hum. As carbon dioxide rises, the hum grows thicker and wobbles out of tune.",
    about:
      "Carbon dioxide gas from cars, factories and fires, spreading through the air with the wind.",
    levels: ["fresh air", "a little CO₂", "some CO₂", "a lot of CO₂", "very heavy CO₂"],
    skin: skinCo2.url,
    image: nasaCo2.url,
    imageAlt:
      "NASA DYAMOND globe of Asia and Australia at night with orange clouds of carbon dioxide rising over China and India.",
    credit: "NASA SVS · DYAMOND Global Carbon Dioxide",
    creditUrl: "https://svs.gsfc.nasa.gov/5196",
    shortcut: "7",
  },
};

export const OCEAN_TEMPERATURE_IMAGE = nasaSst.url;
