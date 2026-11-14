# Earth Jukebox — CYSA Sphere

A NASA Space Apps museum and school exhibit prototype designed for blind and low-vision children. CYSA Sphere is a team of four women working in STEM.

Earth Jukebox translates NASA Earth imagery into waves, thunder, birds and bells. A child selects a place on a globe or companion map and hears its location and an illustrative sound representation.

**Live website:** https://earth-orchestra-globe.lovable.app  
**Museum demonstration:** https://earth-orchestra-globe.lovable.app/museum

## What is implemented

- Interactive Earth globe with NASA-derived textures and location selection.
- Four museum datasets: sea temperature, lightning, forest height and night lights.
- Companion tablet with 48 extracted frames per NASA film, playback, frame stepping, speed and map probing where geographically valid.
- Shared geographic selection between museum globe and tablet.
- East/west-only museum joystick controls that preserve latitude and keep north upright.
- Calculated day/night shading with city lights on the night side.
- Spoken place descriptions, latitude pitch beacons, stereo longitude cues and coastline sounds.
- Four-instrument orchestra, sound demonstrations and comparison lessons.
- Keyboard controls, screen-reader announcements, read-aloud, large text, high contrast and calm-motion settings.
- A rotatable five-part 3D station concept, including feedback integrated into the globe rather than a separate pad.
- Image-upload sonification on the Your map page.

**This is a software demonstrator, not a manufactured or accessibility-certified product.** Physical touch sensors, thermal actuators, local vibration, LEDs and tactile relief are proposed hardware. They are not controlled by this website.

## Run locally

Install [Bun](https://bun.sh/) and use a modern browser with WebGL and Web Audio support.

```sh
bun install
bun run dev
```

Open the address printed by Vite. The Lovable sandbox uses `http://localhost:8080`; a local installation may use a different port. The current demonstrator does not require a database, account or private API key.

```sh
bun run test          # Run the Vitest test suite
bun run lint          # Check lint rules
bun run build         # Production build on a local machine
bun run preview       # Preview the local production build
```

The repository uses TanStack Start, React 19, TypeScript, Vite, Tailwind CSS v4, globe.gl, Three.js, React Three Fiber and Drei. Globe rendering is browser-only; the station scene is lazily client-loaded.

## Present the museum demonstration

1. Open `/museum` and connect stereo headphones. Start at a comfortable low volume.
2. Choose one of the four dataset buttons.
3. Select a place on the globe or a georeferenced tablet map. Press **Where am I?** to hear the location and sound.
4. Use **Rotate east** and **Rotate west** to travel along the same latitude; show the changing day/night view.
5. Play the NASA sequence, step between frames or adjust playback speed. Some extracted frames may repeat an annual composite.
6. Enable **Orchestra** to combine the four sound layers, then use **Stop** or **Reset**.
7. Scroll to the 3D station and select its numbered parts. Part four highlights the proposed sensations at the globe surface.

### Keyboard and accessibility

- Use Tab to reach labelled controls; Enter or Space activates standard buttons.
- On the focused museum globe, Left/Right rotates longitude and Enter/Space speaks the selected place.
- On the Explore globe, arrow keys or number-pad 8/2/4/6 navigate; Shift uses finer movement. C plays the coordinate beacon and speaks coordinates; Enter/Space opens the selected place.
- Settings provides read-aloud, high contrast, large text, calm motion and volume controls.
- Speech voices and optional browser vibration depend on the device. Browser sound requires a user interaction.

Screen-reader, touch, gamepad and child-comprehension testing on real devices remains necessary; keyboard support alone is not proof of accessibility.

## NASA sources and scientific limits

| Museum dataset | Animation source | Interpretation and limits |
| --- | --- | --- |
| Sea temperature | [NASA SVS 3912 — ECCO2](https://svs.gsfc.nasa.gov/3912/) | Historical temperature/current visualization, 2005–2007; colours drive normalized proxies, not calibrated °C. |
| Lightning | [NASA SVS 5011 — ISS LIS](https://svs.gsfc.nasa.gov/5011/) | 2017–2023 visualization; detection coverage is not uniformly global. Thunder is a designed sound metaphor. |
| Forest height | [NASA SVS 4950 — GEDI](https://svs.gsfc.nasa.gov/4950/) | Rotating forest-structure film, not a growth time series or a flat geographic probe map. Existing globe forest values use Blue Marble greenness, not canopy height in metres. |
| Night lights | [NASA SVS 5276 — Black Marble](https://svs.gsfc.nasa.gov/5276/) | Annual composites, 2012–2023; brightness is not population and city-light imagery is not live. |

Earth textures and the vegetation proxy also use [NASA Blue Marble](https://visibleearth.nasa.gov/collection/1484/blue-marble). Read `/about` for the website’s method, authorship notes and source links.

The current UTC clock determines the simulated Sun position; it does not make historical NASA images real-time measurements. Sounds are synthesized with Web Audio, not recorded satellite audio. Warm/cool labels are qualitative simulation, never hardware setpoints or safety instructions.

CYSA Sphere’s teaching comparisons, sound choices and image descriptions are interpretations, not NASA quotations. Erie, Umwelt and DIXTRAL informed research discussions; these libraries and their evaluation protocols are not implemented in this prototype.

## Reproduce the 48-frame NASA sequences

The app already references extracted atlases and manifests; **extraction is not required to run the website**.

`scripts/fetch_nasa_frames.py` requires Python 3, Pillow, `ffmpeg`, `ffprobe`, internet access and an available authenticated `lovable-assets` CLI. Asset publication requires the Lovable environment or separately configured access; the script is not a standalone local-only exporter.

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install Pillow
ffmpeg -version
ffprobe -version
python3 scripts/fetch_nasa_frames.py
```

The script processes all four sources concurrently:

1. Downloads official NASA movies into temporary folders outside the repository.
2. Reads each movie’s duration and extracts 48 evenly sampled JPEG frames at 768 × 384.
3. Packs frames into an 8 × 6 atlas.
4. Derives normalized colour-proxy grids of 144 × 72 cells.
5. Uploads each atlas through `lovable-assets` and writes asset pointers and source manifests into `src/assets/nasa-sequences/`.

Manifests retain source/credit URLs, duration, frame count, grid dimensions, interpretation notes and the geographic-probing flag. Only flat global sequences can be sampled by latitude/longitude; forest frame probing is disabled. Temporary source movies and frames are not committed. Rerunning replaces the existing sequence files and may incur asset-upload usage.

This script regenerates sequence atlases and their grids, **not** the separate static globe grids in `src/data/earth-grids.ts`. Those generated static grids must not be hand-edited.

## Project structure

```text
src/routes/                       Explore, Museum, Your map, How it works
src/components/jukebox/           Globe, NASA tablet, audio controls and museum simulator
src/components/jukebox/station/   3D station and part-selection interface
src/lib/audio/engine.ts           Live Web Audio synthesis
src/lib/sonify-map.ts             Pure, tested value-to-sound rules
src/lib/museum-model.ts           Geographic navigation and museum simulation
src/lib/station-parts.ts          Shared five-part exhibit descriptions
src/lib/nasa-sequences.ts         Atlas references and geographic frame sampling
src/lib/a11y.tsx                  Accessibility settings, speech and announcements
src/data/earth-grids.ts           Generated static image-derived Earth grids
src/assets/nasa-sequences/        Extracted sequence pointers and source manifests
src/test/                        Unit and routing tests
scripts/fetch_nasa_frames.py      Offline NASA extraction pipeline
```

The five proposed station parts are the touch globe, four-button panel, headphones, integrated globe-surface sensations and companion tablet. The globe rests on a cradle without an external vertical bar or surrounding ring. Dimensions shown on the site are preliminary concept estimates, not manufacturing drawings.

## Validation and deployment limits

- Unit tests cover sound mappings, geographic navigation, day/night calculations and routing. Run them after changing those rules.
- Check `/museum` on desktop and mobile for model visibility, connected cable geometry, frame playback and geographic selection.
- Test sound and volume with actual headphones, and speech with the target browser’s voices.
- Evaluate the experience with blind and low-vision children, educators and accessibility specialists before museum deployment.
- Globe heating, cooling and vibration require specialist child-safe engineering, independent safety validation and touch-point testing. There is no separate sensation pad in the concept.
- Imagery is hosted through asset URLs. Offline extraction does not mean the website currently works without a network; a museum offline installation needs local asset packaging and a tested offline deployment.
- NASA imagery attribution does not grant a licence to unrelated dependencies or third-party assets. Check each source’s usage terms before commercial distribution.

NASA does not endorse any non-U.S. Government entity. Earth Jukebox is an independent CYSA Sphere prototype built with Lovable.
