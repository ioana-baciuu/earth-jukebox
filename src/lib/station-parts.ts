/** The five parts of the Earth Jukebox museum station, shared by the drawing, the list and the 3D model. */
export const STATION_PARTS = [
  { id: "globe", n: 1, title: "Touch globe", text: "3D-printed raised continents and mountains. Touch sensors under the surface tell the app which place a child is touching. Internal LEDs illuminate the day side without an external ring around the globe." },
  { id: "panel", n: 2, title: "Four-button panel", text: "Sea temperature, lightning, forest height and night lights. Raised symbols and professionally checked Braille identify the buttons. A one-axis joystick rotates east and west; north stays upright." },
  { id: "headphones", n: 3, title: "Headphones", text: "Stereo headphones: places in the west sound in the left ear, east in the right. Higher notes mean north, lower notes mean south." },
  { id: "feedback", n: 4, title: "Touch sensations inside the globe", text: "Proposed feedback built beneath the globe’s touch surface: gentle warmth or coolness for sea temperature, and local vibration for thunder and coastlines, felt where the child touches. This web demo shows the concept; no physical heating, cooling or vibration hardware is connected." },
  { id: "tablet", n: 5, title: "Companion tablet", text: "Plays extracted NASA image sequences. Touching a flat map selects the same place on the globe and changes the sound. The rotating GEDI movie is a visual explanation, not a geographic touch map." },
] as const;
export type StationPartId = (typeof STATION_PARTS)[number]["id"];

/** Proposed physical specification shown beside the station drawing. */
export const STATION_SPECS: [string, string][] = [
  ["Footprint", "118 × 70 cm, fits a 150 cm wheelchair turning circle beside it"],
  ["Panel height", "65 cm front edge, sloped 18° toward the child"],
  ["Globe", "60 cm tactile relief, equator at 96 cm (chest height), 128 touch zones, north fixed upright"],
  ["Audio", "Two stereo headphone ports with volume limit"],
  ["Power", "One standard socket; runs offline from a built-in computer"],
  ["Materials", "Birch plywood, wipe-clean resin globe, rubber Braille keys"],
];
