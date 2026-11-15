# Earth Jukebox

**Listen to the planet.** Earth Jukebox is a sound globe for museums and schools. Visitors spin a real 3D Earth, tap anywhere, and hear NASA Earth data as ocean waves, thunder, birdsong and city bells. It is designed for blind and low-vision children, and it works fully by ear and keyboard.

- **Live demo:** https://earth-orchestra-globe.lovable.app/
- **Museum demonstration:** https://earth-orchestra-globe.lovable.app/museum
- **Built for:** NASA Space Apps 2026, Bucharest
- **Team:** CYSA Sphere, a team of four women working in STEM

> NASA does not endorse this project. Data and images come from the NASA Scientific Visualization Studio and Earth Information Center, Blue Marble and Black Marble.

---

## Contents

1. [What it does](#what-it-does)
2. [The one rule](#the-one-rule)
3. [Pages](#pages)
4. [Sound layers and data sources](#sound-layers-and-data-sources)
5. [How data becomes sound](#how-data-becomes-sound)
6. [Controls and accessibility](#controls-and-accessibility)
7. [The museum station (prototype)](#the-museum-station-prototype)
8. [Tech stack and project structure](#tech-stack-and-project-structure)
9. [Getting started](#getting-started)
10. [Testing](#testing)
11. [Fetching NASA frames](#fetching-nasa-frames)
12. [Honest notes and limitations](#honest-notes-and-limitations)
13. [Credits](#credits)

---

## What it does

- Shows a real 3D Earth with calculated day/night shading and city lights on the night side. Tap or click any place to hear what NASA data says about it.
- Turns each data layer into a sound children can learn quickly: more of something means more sound.
- Speaks the name of the region and a short, situation-aware sentence (for example, it never says "listen to the waves" on dry land).
- Lets visitors compare two places in short listening lessons, for example the Amazon and the Sahara.
- Plays the whole planet at once in **Orchestra** mode while the Earth spins.
- Lets anyone upload their own map or satellite picture and hear it played from west to east.
- Includes a working museum station demonstrator with a 3D model, a companion NASA tablet, four dataset buttons and an east/west joystick.

## The one rule

> **More of something means more sound.**

Every layer follows this rule. Melodies always use a five-note (pentatonic) scale, so every place on Earth sounds pleasant when played together.

---

## Pages

| Route | Name | Purpose |
|---|---|---|
| `/` | **Explore / Orchestra** | The main sound globe. Pick a layer, tap the globe, or switch to Orchestra mode. Also has "Meet the sounds", "Compare two places", "Places to visit" and a visitor feedback form. |
| `/museum` | **Museum** | Working prototype of the physical museum station: kiosk simulator, companion NASA tablet, rotatable 3D station with five numbered parts, a station sketch and a step-by-step visit. |
| `/your-map` | **Your map** | Upload a PNG, JPG or WebP map. A playhead sweeps west to east and each slice becomes notes. NASA sample pictures are included. |
| `/about` | **How it works** | Method, sound key, notes for museums and schools, honest limitations and sources. |

### Modes on the home page

- **Explore:** choose one layer, tap the globe, then listen. "Surprise me" flies to a random featured place. "Travel with keys" moves focus to the globe so you can steer with the keyboard.
- **Orchestra:** all four layers play together while the globe spins along a route (for example the equator or a spot you picked). You can set the speed and mix each layer on or off with its own volume.

---

## Sound layers and data sources

The site offers four layers, matching the four buttons on the museum station.

| Layer | You hear | NASA source |
|---|---|---|
| **Sea temperature** | Ocean waves. Warm water sings a bright chord, cold water sings low. On land it says there is no sea here. | ECCO2 sea surface temperature and currents, 2005–2007 ([SVS 3912](https://svs.gsfc.nasa.gov/3912/)) |
| **Lightning** | Thunder drums. More lightning means closer and more frequent booms. | ISS Lightning Imaging Sensor, 2017–2023 ([SVS 5011](https://svs.gsfc.nasa.gov/5011/)) |
| **Forest height** | Birdsong and rustling leaves. Thick forest means many birds. | Globe values use Blue Marble vegetation greenness (an illustrative proxy). The companion film is the GEDI forest structure visualization ([SVS 4950](https://svs.gsfc.nasa.gov/4950/)). |
| **Night lights** | Music-box bells. Dark countryside is quiet, big cities sparkle. | Black Marble night lights, annual composites 2012–2023 ([SVS 5276](https://svs.gsfc.nasa.gov/5276/)) |

Each layer has five level words from "a little" to "a lot", for example *freezing polar sea* to *warm tropical sea* or *quiet countryside* to *big busy city*. In the museum, the sound grows louder or softer as the NASA film moves from frame to frame.

---

## How data becomes sound

1. **Read the picture.** Each NASA image is split into a grid of squares 2.5° wide, covering the whole globe.
2. **Measure it.** In every square the app measures brightness, colour and how much of the picture is lit up.
3. **Play it.** Normalized values (0 to 1) drive the instruments. These sounds are designed metaphors, not recordings from satellites.

### Design patterns

The code follows ideas from four sonification and accessibility projects. They are **not bundled**, and the project does not claim compliance with their protocols.

| Idea | What it means here |
|---|---|
| **Erie** | One declarative rule per layer maps a data value to a sound parameter (pitch, seconds between booms, songs per second, chimes per second). |
| **Umwelt** | The map marker, the sound and the spoken caption all come from one shared snapshot, so they never drift apart. |
| **DIXTRAL** | An instant auditory probe (the **P** key) reads out the value at the current place. |
| **A Universe of Sound** | The visitor feedback questions. Answers stay on the visitor's device. |

### Example Erie mappings

| Layer | Field | Input | Output |
|---|---|---|---|
| Ocean | sea surface temperature | 0 to 1 | 220 Hz (polar) to 660 Hz (tropical) |
| Storm | lightning flash density | 0 to 1 | 14 s to 2.5 s between booms (inverted) |
| Forest | canopy proxy | 0 to 1 | 0.15 to 2.55 bird songs per second |
| Lights | night radiance | 0 to 1 | 0.35 to 7.35 chimes per second |

### Navigation cues

- **Pitch beacon:** higher note means further north, lower means further south (440 Hz at the equator, one octave up at the North Pole).
- **Stereo pan:** west plays in the left ear, east in the right. Use headphones.
- **Layer ping:** a short note whose height shows how much of the chosen layer is here.
- **Coastline cue:** a "land ahead" or "splash" sound, plus vibration on supported devices, when you cross a coast.

---

## Controls and accessibility

### Keyboard (Explore page)

| Key | Action |
|---|---|
| Arrow keys or number pad (8, 2, 4, 6) | Travel across the globe. |
| Shift + arrows | Smaller steps (1° instead of 5°). |
| `Enter` or `Space` | Listen at the current place. |
| `C` | "Where am I?" Plays a beacon note and speaks the place and coordinates. |
| `P` | Instant probe of the current value (DIXTRAL idea). |
| `1` to `4` | Choose a sound layer. |
| `O` | Open Orchestra. |
| `S` | Stop all sound. |

On the focused museum globe, Left/Right rotates east or west and Enter/Space speaks the selected place.

### Accessibility features

- Works fully by ear and keyboard, with a screen reader or the built-in voice (read aloud).
- Large buttons and text, and a high-contrast mode.
- **Calm motion** setting, which also makes lightning flashes soft and slow.
- Skip link to the globe, ARIA live announcements for place and level, and descriptive labels on the globe.
- Volume control in Settings. Browsers only play sound after a first tap or click.
- Kiosk tip: open the page full screen and turn on **Read aloud** in Settings.

> User comprehension and accessibility have **not yet been tested with blind children**. Treat this as a research prototype.

---

## The museum station (prototype)

The `/museum` page presents a proposed physical station called **Earth Jukebox Station (ES-1)**. The web page is a working software demonstrator. The hardware below is a proposal and is not connected to any real device.

| Part | Description |
|---|---|
| 1. Touch globe | 60 cm tactile relief globe with 128 touch zones, resting on a cradle at child height. North stays upright. Internal LEDs light the day side. |
| 2. Four-button panel | Sea temperature, lightning, forest height, night lights, with raised symbols and Braille. A pink **Where am I?** key and a one-axis east/west joystick that keeps the latitude and shows day and night. |
| 3. Headphones | Stereo headphones on a hook. West is the left ear, east the right. Two ports with a volume limit. In the 3D model, choosing part 3 shows the child putting them on. |
| 4. Touch sensations | Proposed warmth or coolness for sea temperature, and vibration for thunder and coastlines, felt directly on the globe at the touch point. There is no separate pad. |
| 5. Companion tablet | Plays 48 extracted NASA frames per film. Touching the flat map selects the same place on the globe. |

**Specification (proposed):** footprint 118 × 70 cm, fits a 150 cm wheelchair turning circle beside it. Panel height 65 cm, sloped 18° toward the child. One standard power socket, runs offline from a built-in computer. Birch plywood, wipe-clean resin globe, rubber Braille keys. These are preliminary concept estimates, not manufacturing drawings.

Physical sensors, LED illumination, raised symbols, Braille and thermal feedback need accessibility evaluation and child-safe testing before deployment. Warm/cool labels are a qualitative simulation, never hardware setpoints or safety instructions.

**A visit, step by step:** put on the headphones, choose a dataset, touch the globe, spin the Earth with the joystick, press **Where am I?**, then listen as the NASA film plays.

---

## Tech stack and project structure

- **TanStack Start** with **React 19** and **TanStack Router** (file-based routes, `createFileRoute`), **TypeScript** and **Vite**
- **Tailwind CSS v4** and shadcn/ui-style components
- **globe.gl** / **Three.js** for the Earth globe (custom day/night shader), loaded only in the browser
- **React Three Fiber** and **Drei** for the 3D museum station, lazily loaded
- A custom **Web Audio** engine for the instruments (one voice per layer)
- **lucide-react** icons
- **Python**, **Pillow** and **FFmpeg** for offline NASA frame extraction
- **Vitest** for tests
- Built and hosted with **Lovable**

### Layout

```text
src/
├── routes/
│   ├── index.tsx             # Explore + Orchestra (home page)
│   ├── museum.tsx            # Museum station prototype
│   ├── your-map.tsx          # Upload and play your own map
│   └── about.tsx             # How it works
├── components/
│   ├── ui/                   # Buttons and other base components
│   └── jukebox/
│       ├── EarthGlobe.tsx        # 3D globe (flyTo, follow, focus, day/night)
│       ├── DiscoveryDialog.tsx   # Pop-up for a chosen place
│       ├── OrchestraPanel.tsx    # Mixer, speed and route controls
│       ├── MeetTheSounds.tsx     # "A little / a lot" teaching cards
│       ├── ContrastStories.tsx   # "Compare two places" lessons
│       ├── EvaluationForm.tsx    # Visitor feedback questions
│       ├── MuseumSimulator.tsx   # Kiosk simulator: buttons, joystick, globe
│       ├── NasaTablet.tsx        # 48-frame NASA film player and map probe
│       ├── SettingsPanel.tsx     # Read aloud, contrast, text size, volume
│       └── station/              # 3D station model and part selection
├── lib/
│   ├── audio/engine.ts       # Web Audio engine (getEngine, peekEngine)
│   ├── a11y.tsx              # Settings, announce, speak, buzz
│   ├── earth-data.ts         # sampleEarth, layerStrength, clampLat, wrapLng
│   ├── layers.ts             # LAYER_IDS, LAYERS (names, instruments, skins)
│   ├── places.ts             # FEATURED_PLACES, describePlace, formatCoords
│   ├── sonify-map.ts         # Value to sound, latitude to pitch, longitude to pan, coast cues
│   ├── sonification-spec.ts  # Erie specs, DIXTRAL probe, Umwelt snapshot, evaluation validator
│   ├── museum-model.ts       # Joystick navigation, day/night, child-friendly captions
│   ├── nasa-sequences.ts     # Frame atlases and geographic frame sampling
│   └── station-parts.ts      # The five station parts
├── data/earth-grids.ts       # Generated 2.5° NASA grids (do not hand-edit)
├── assets/
│   ├── earth/                # Globe skins and NASA maps
│   └── nasa-sequences/       # 48-frame atlases and source manifests
└── test/                     # Vitest tests
scripts/
└── fetch_nasa_frames.py      # NASA frame extraction
```

### Key modules

| Module | Role |
|---|---|
| `earth-data.ts` | Samples the 2.5° grids. `layerStrength(layer, sample)` returns the 0 to 1 strength for a place. |
| `sonify-map.ts` | `latitudeToFreq`, `longitudeToPan`, `pentatonicFreq`, `coastCrossing` and the per-layer sound rules. |
| `sonification-spec.ts` | `ERIE_SPECS`, `dixtralProbe`, `createUmweltSnapshot`, `validateEvaluation`. |
| `museum-model.ts` | East/west joystick movement, sun position, day/night test and the spoken museum caption. |
| `a11y.tsx` | `useA11y()` gives `settings`, `announce` (screen reader), `speak` (built-in voice) and `buzz` (vibration). |
| `engine.ts` | `getEngine()` creates the audio engine on first use. `peekEngine()` returns it only if it already exists. |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 20+ with npm)
- A modern browser with WebGL and Web Audio support
- Headphones for the best experience

### Run locally

```bash
git clone <your-repo-url>
cd <project-folder>

bun install        # or: npm install
bun run dev        # or: npm run dev
```

Open the local URL shown in the terminal. Browsers only allow sound after a user gesture, so click or tap once before expecting audio. No database, account or private API key is needed.

### Build

```bash
bun run build      # or: npm run build
bun run preview    # preview the production build
```

---

## Testing

The rules are covered by Vitest tests in `src/test/`.

```bash
bun run test
# or a single file
bunx vitest run src/test/sonification-research.test.ts
```

The suite checks that:

- Sea temperature maps monotonically from cold (220 Hz) to warm (660 Hz).
- Lightning intervals are inverted: more storm means faster booms.
- Every layer has complete spoken rules and legend text.
- The marker position, audio frequency and screen-reader caption stay in sync (Umwelt).
- The auditory probe returns the right spoken text and frequency (DIXTRAL).
- Evaluation form answers are validated (A Universe of Sound).
- Only the four museum datasets are offered, the joystick moves east/west only and keeps latitude, and day/night is calculated correctly.
- Captions adapt to the place (no "waves" on land, no "trees" at sea).
- Pages load and route correctly.

---

## Fetching NASA frames

The companion tablet uses 48 frames extracted from each official NASA film. **The app already includes the extracted frames, so you do not need to run this to use the website.**

**Requirements:** Python 3, Pillow, `ffmpeg` / `ffprobe` on your PATH, internet access and an authenticated `lovable-assets` CLI (available in the Lovable environment).

```bash
python3 -m pip install Pillow
python3 scripts/fetch_nasa_frames.py
```

For each of the four datasets (`ocean`, `storm`, `forest`, `lights`) the script:

1. Downloads the official NASA movie into a temporary folder outside the repository.
2. Reads the duration with `ffprobe`.
3. Extracts 48 evenly spaced frames at 768 × 384.
4. Packs them into an 8 × 6 image atlas and derives 144 × 72 colour-proxy grids.
5. Uploads the atlas and writes the asset pointer and a source manifest into `src/assets/nasa-sequences/`.

Manifests keep the source and credit URLs, duration, frame count and whether the film can be probed by latitude/longitude. The rotating GEDI forest film cannot, so map probing is off for forest. Rerunning replaces the existing sequence files. This script does not regenerate the static globe grids in `src/data/earth-grids.ts`.

---

## Honest notes and limitations

- Globe values come from **historical 2.5° image-derived grids**, not live measurements. They are normalized proxies, not temperatures in °C or heights in metres.
- The tablet shows 48 extracted frames per film. Flat-map probing follows frame colours. The rotating GEDI film is a visual explanation, not a time series or a geographic touch map.
- The Sun position is calculated from the current UTC clock. This does not make the night-light imagery live.
- **Birdsong represents tree cover**, not birds or biodiversity. **City bells represent observed light brightness**, not population.
- The vegetation layer is a Blue Marble proxy. It is **not** GEDI canopy height in metres.
- Lightning detection from the ISS does not cover the globe uniformly.
- Repeated extracted night-light frames can show the same annual image.
- The teaching comparisons, level words, image descriptions and sound choices are CYSA Sphere's interpretations. They are not NASA quotations or validated scientific statements.
- Physical hardware (sensors, LEDs, raised symbols, Braille, thermal feedback) is **proposed**, not built or tested.
- Images load from online asset links. A museum offline installation needs local packaging and testing.
- Not yet tested with blind or low-vision children.

---

## Credits

- **Concept and build:** CYSA Sphere, Bucharest. Built for NASA Space Apps 2026.
- **Data and imagery:** NASA Scientific Visualization Studio, Earth Information Center, Blue Marble and Black Marble.
  - [SVS 3912](https://svs.gsfc.nasa.gov/3912/) ECCO2 sea surface temperature and currents
  - [SVS 5011](https://svs.gsfc.nasa.gov/5011/) ISS Lightning Imaging Sensor
  - [SVS 4950](https://svs.gsfc.nasa.gov/4950/) GEDI forest structure
  - [SVS 5276](https://svs.gsfc.nasa.gov/5276/) Black Marble night lights
  - [Blue Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble)
- **Ideas followed:** Erie, Umwelt, DIXTRAL, A Universe of Sound.
- **Tools:** Three.js, globe.gl, React Three Fiber, Web Audio API, TanStack Start, FFmpeg, Lovable.

NASA does not endorse this project or any non-U.S. Government entity.
