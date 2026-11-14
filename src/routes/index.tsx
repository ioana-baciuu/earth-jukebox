import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, Compass, Ear, Headphones, MapPin, Music4, Shuffle, Square } from "lucide-react";
import skinDay from "@/assets/earth/skin-day.jpg.asset.json";
import museumImg from "@/assets/museum-listening.jpg";
import { Button } from "@/components/ui/button";
import { DiscoveryDialog, levelWord, type Spot } from "@/components/jukebox/DiscoveryDialog";
import { EarthGlobe, type GlobeHandle } from "@/components/jukebox/EarthGlobe";
import { LayerIcon } from "@/components/jukebox/layer-icon";
import { OrchestraPanel, ROUTES, SPEEDS, type Mix, type RouteId, type SpeedId } from "@/components/jukebox/OrchestraPanel";
import { getEngine, peekEngine } from "@/lib/audio/engine";
import { useA11y } from "@/lib/a11y";
import { clampLat, layerStrength, sampleEarth, wrapLng } from "@/lib/earth-data";
import { LAYER_IDS, LAYERS, type LayerId } from "@/lib/layers";
import { describePlace, FEATURED_PLACES, type Place } from "@/lib/places";
import { pentatonicFreq } from "@/lib/sonify-map";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Earth Jukebox — Listen to the planet" },
      {
        name: "description",
        content:
          "Tap a real 3D Earth and hear NASA data as rain, thunder, waves, birdsong and city bells. Built for blind and low-vision children.",
      },
      { property: "og:title", content: "Earth Jukebox — Listen to the planet" },
      {
        property: "og:description",
        content: "A sound globe for museums and schools that turns NASA Earth data into music kids can explore by ear.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Mode = "explore" | "orchestra";

function makeSpot(lat: number, lng: number, name?: string): Spot {
  const sample = sampleEarth(lat, lng);
  return { lat, lng, sample, name: name ?? describePlace(lat, lng, sample.land > 0.5) };
}

const DEFAULT_MIX = Object.fromEntries(LAYER_IDS.map((id) => [id, { on: true, vol: 0.7 }])) as Mix;

function Index() {
  const { settings, announce, speak } = useA11y();
  const globe = useRef<GlobeHandle>(null);
  const [mode, setMode] = useState<Mode>("explore");
  const [layer, setLayer] = useState<LayerId>("rain");
  const [cursor, setCursor] = useState<{ lat: number; lng: number } | null>(null);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [open, setOpen] = useState(false);

  // Orchestra state
  const [mix, setMix] = useState<Mix>(DEFAULT_MIX);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedId>("medium");
  const [route, setRoute] = useState<RouteId>("equator");
  const [orchSpot, setOrchSpot] = useState<Spot | null>(null);

  const cursorSpot = useMemo(() => (cursor ? makeSpot(cursor.lat, cursor.lng) : null), [cursor]);

  const listen = useCallback(
    (lat: number, lng: number, name?: string) => {
      const s = makeSpot(lat, lng, name);
      setCursor({ lat, lng });
      setSpot(s);
      setOpen(true);
    },
    [],
  );

  const pickOnGlobe = useCallback(
    (lat: number, lng: number) => {
      if (mode === "orchestra") {
        setCursor({ lat, lng });
        setRoute("spot");
        announce(`Journey set through ${describePlace(lat, lng, sampleEarth(lat, lng).land > 0.5)}.`);
        return;
      }
      listen(lat, lng);
    },
    [mode, listen, announce],
  );

  const visit = (p: Place) => {
    setMode("explore");
    globe.current?.flyTo(p.lat, p.lng);
    listen(p.lat, p.lng, p.name);
  };

  const surprise = () => visit(FEATURED_PLACES[Math.floor(Math.random() * FEATURED_PLACES.length)] ?? FEATURED_PLACES[0]!);

  const chooseLayer = (id: LayerId) => {
    setLayer(id);
    announce(`${LAYERS[id].name}. ${LAYERS[id].instrument}.`);
  };

  const stopAll = () => {
    setPlaying(false);
    setOpen(false);
    peekEngine()?.stopAll(0.4);
    window.speechSynthesis?.cancel();
  };

  // Keyboard travel on the globe
  const announceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onGlobeKey = async (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 1 : 5;
    const base = cursor ?? { lat: 10, lng: 10 };
    let { lat, lng } = base;
    if (e.key === "ArrowUp") lat += step;
    else if (e.key === "ArrowDown") lat -= step;
    else if (e.key === "ArrowLeft") lng -= step * 2;
    else if (e.key === "ArrowRight") lng += step * 2;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (mode === "explore") listen(base.lat, base.lng);
      return;
    } else return;
    e.preventDefault();
    lat = clampLat(lat);
    lng = wrapLng(lng);
    setCursor({ lat, lng });
    globe.current?.flyTo(lat, lng, 2, 500);
    // radar ping: higher note = more of this layer here
    const s = sampleEarth(lat, lng);
    const v = layerStrength(layer, s);
    const eng = await getEngine();
    eng.marimba(pentatonicFreq(60, Math.round(v * 12)), 0.3, Math.max(-1, Math.min(1, lng / 180)));
    if (announceTimer.current) clearTimeout(announceTimer.current);
    announceTimer.current = setTimeout(() => {
      announce(`${describePlace(lat, lng, s.land > 0.5)}. ${LAYERS[layer].name}: ${levelWord(layer, s)}.`);
    }, 450);
  };

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [role=slider], [role=dialog]") || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = Number(e.key) - 1;
      if (idx >= 0 && idx < LAYER_IDS.length) {
        setMode("explore");
        chooseLayer(LAYER_IDS[idx]!);
      } else if (e.key.toLowerCase() === "s") {
        stopAll();
        announce("Sound stopped.");
      } else if (e.key.toLowerCase() === "o") {
        setMode("orchestra");
        announce("Orchestra open.");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Orchestra: apply the mixer
  useEffect(() => {
    if (!playing) return;
    const e = peekEngine();
    if (!e) return;
    const m: Partial<Record<LayerId, number>> = {};
    for (const id of LAYER_IDS) m[id] = mix[id].on ? mix[id].vol : 0;
    e.setMix(m, 0.5);
  }, [mix, playing]);

  // Orchestra: spin the planet and feed the instruments
  const pos = useRef({ lat: 2, lng: -30 });
  useEffect(() => {
    if (!playing) return;
    const r = ROUTES.find((x) => x.id === route)!;
    pos.current.lat = "lat" in r ? r.lat : (cursor?.lat ?? 2);
    if (route === "spot" && cursor) pos.current.lng = cursor.lng;
    const deg = SPEEDS.find((s) => s.id === speed)!.degPerSec;
    const dt = 0.15;
    let n = 0;
    let lastName = "";
    const id = setInterval(() => {
      const e = peekEngine();
      if (!e) return;
      pos.current.lng = wrapLng(pos.current.lng + deg * dt);
      const { lat, lng } = pos.current;
      const s = makeSpot(lat, lng);
      e.setSample(s.sample);
      globe.current?.follow(lat, lng, settings.calmMotion ? 0 : 160);
      if (n++ % 4 === 0) {
        setOrchSpot(s);
        if (s.name !== lastName) lastName = s.name;
      }
    }, dt * 1000);
    return () => clearInterval(id);
  }, [playing, route, speed, cursor, settings.calmMotion]);

  const toggleOrchestra = async () => {
    if (playing) {
      setPlaying(false);
      peekEngine()?.stopAll(0.6);
      return;
    }
    const e = await getEngine();
    const r = ROUTES.find((x) => x.id === route)!;
    const lat = "lat" in r ? r.lat : (cursor?.lat ?? 2);
    const s = makeSpot(lat, pos.current.lng);
    e.setSample(s.sample);
    setOrchSpot(s);
    setPlaying(true);
    speak("The Earth orchestra is playing. Listen as the planet spins.");
  };

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    stopAll();
    setMode(m);
  };

  const skin = mode === "orchestra" ? skinDay.url : LAYERS[layer].skin;
  const ringLayer = mode === "orchestra" ? "base" : layer;
  const globeLabel = `Earth globe showing ${mode === "orchestra" ? "the whole planet" : LAYERS[layer].name}. Use arrow keys to travel and Enter to listen.${
    cursorSpot ? ` Now at ${cursorSpot.name}.` : ""
  }`;

  return (
    <div className={cn(`layer-${mode === "orchestra" ? "rain" : layer}`)}>
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:pt-10">
        {/* Globe */}
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-24">
            <div className="globe-stage relative mx-auto aspect-square w-full max-w-[44rem]">
              <EarthGlobe
                ref={globe}
                skinUrl={skin}
                layer={ringLayer}
                cursor={mode === "orchestra" ? (playing ? null : cursor) : cursor}
                autoRotate={!cursor && !playing}
                calmMotion={settings.calmMotion}
                label={globeLabel}
                onPick={pickOnGlobe}
                onKeyDown={onGlobeKey}
              />
              <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-base font-bold text-muted-foreground">
                <span className="rounded-full bg-background/80 px-4 py-2">
                  {mode === "orchestra" ? "Tap the globe to choose where the journey goes" : "Tap anywhere on Earth to listen"}
                </span>
              </p>
            </div>
            <div className="surface mt-4 flex flex-wrap items-center gap-3 p-4">
              <MapPin className="h-6 w-6 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">
                  {mode === "orchestra" && playing && orchSpot ? orchSpot.name : cursorSpot ? cursorSpot.name : "No place chosen yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mode === "explore" && cursorSpot
                    ? `${LAYERS[layer].name}: ${levelWord(layer, cursorSpot.sample)}`
                    : "Keyboard: focus the globe, use the arrows, press Enter"}
                </p>
              </div>
              {mode === "explore" && cursor && (
                <Button size="lg" variant="layer" onClick={() => listen(cursor.lat, cursor.lng)}>
                  <Ear aria-hidden="true" /> Listen here
                </Button>
              )}
              <Button size="lg" variant="soft" onClick={() => { stopAll(); announce("Sound stopped."); }}>
                <Square aria-hidden="true" /> Stop
              </Button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:order-1">
          <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm font-bold text-muted-foreground">
            <Headphones className="h-4 w-4 text-primary" aria-hidden="true" /> NASA Earth data, made to be heard
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] sm:text-6xl xl:text-7xl">
            Listen to <span className="text-gradient-sun">the planet.</span>
          </h1>
          <p className="mt-4 max-w-xl text-xl text-muted-foreground">
            Spin a real Earth, tap anywhere, and hear rain fall, thunder roll, oceans breathe and cities twinkle.
          </p>

          <div role="tablist" aria-label="Mode" className="mt-8 inline-flex rounded-full border-2 border-border bg-card p-1.5">
            {(
              [
                ["explore", "Explore", Compass],
                ["orchestra", "Orchestra", Music4],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                aria-controls={`panel-${id}`}
                id={`tab-${id}`}
                onClick={() => switchMode(id)}
                className={cn(
                  "inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-lg font-bold transition-colors",
                  mode === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          {mode === "explore" ? (
            <div id="panel-explore" role="tabpanel" aria-labelledby="tab-explore" className="mt-8 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  <span className="mr-2 inline-grid h-9 w-9 place-items-center rounded-full bg-primary text-base text-primary-foreground">
                    1
                  </span>
                  Pick what to hear
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {LAYER_IDS.map((id) => {
                    const info = LAYERS[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={layer === id}
                        aria-keyshortcuts={info.shortcut}
                        onClick={() => chooseLayer(id)}
                        className={cn(`layer-${id}`, "layer-tile flex items-center gap-4 rounded-2xl p-4 text-left")}
                      >
                        <span className="layer-chip grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                          <LayerIcon id={id} className="h-7 w-7" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold leading-tight">{info.name}</span>
                          <span className="block text-sm text-muted-foreground">Sounds like {info.instrument.toLowerCase()}</span>
                        </span>
                        <kbd aria-hidden="true" className="hidden rounded-lg border border-border px-2 py-0.5 text-sm font-bold text-muted-foreground sm:block">
                          {info.shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="surface p-5">
                <h2 className="font-display text-2xl font-bold">
                  <span className="mr-2 inline-grid h-9 w-9 place-items-center rounded-full bg-primary text-base text-primary-foreground">
                    2
                  </span>
                  Tap the globe
                </h2>
                <p className="mt-2 text-lg text-muted-foreground">{LAYERS[layer].sound}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button size="xl" variant="hero" onClick={surprise}>
                    <Shuffle aria-hidden="true" /> Surprise me
                  </Button>
                  <Button size="xl" variant="soft" onClick={() => globe.current?.focus()}>
                    <Compass aria-hidden="true" /> Travel with keys
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div id="panel-orchestra" role="tabpanel" aria-labelledby="tab-orchestra" className="mt-8">
              <OrchestraPanel
                mix={mix}
                setMix={setMix}
                playing={playing}
                onToggle={toggleOrchestra}
                speed={speed}
                setSpeed={setSpeed}
                route={route}
                setRoute={setRoute}
                sample={orchSpot?.sample ?? null}
                placeName={orchSpot?.name ?? ""}
              />
            </div>
          )}
        </div>
      </section>

      {/* Places */}
      <section aria-labelledby="places-title" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 id="places-title" className="font-display text-4xl font-bold">
          Places to visit
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          One tap flies you there and plays the {LAYERS[layer].name.toLowerCase()} sound.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURED_PLACES.map((p) => {
            const s = sampleEarth(p.lat, p.lng);
            return (
              <li key={p.name}>
                <button
                  type="button"
                  onClick={() => visit(p)}
                  className="layer-tile flex h-full w-full flex-col items-start gap-2 rounded-2xl p-5 text-left"
                >
                  <span className="text-xl font-bold leading-tight">{p.name}</span>
                  <span className="text-base text-muted-foreground">{p.blurb}</span>
                  <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-bold text-layer">
                    <LayerIcon id={layer} className="h-4 w-4" />
                    {levelWord(layer, s)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* For museums & schools */}
      <section aria-labelledby="edu-title" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="surface grid overflow-hidden lg:grid-cols-2">
          <img
            src={museumImg}
            alt="A smiling child wearing headphones explores a raised globe with his hands while a teacher watches."
            className="h-full min-h-64 w-full object-cover"
            loading="lazy"
            width={1280}
            height={896}
          />
          <div className="flex flex-col justify-center gap-5 p-8 sm:p-10">
            <h2 id="edu-title" className="font-display text-4xl font-bold">
              Made for museums and classrooms
            </h2>
            <ul className="space-y-3 text-lg">
              <li>Works fully by ear and keyboard, with a screen reader or with the built-in voice.</li>
              <li>Big buttons, big text and a high-contrast mode for low-vision visitors.</li>
              <li>Every sound follows one clear rule kids can learn: more of something means more sound.</li>
              <li>Real NASA images and data from the Earth Information Center.</li>
            </ul>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="xl" variant="hero">
                <Link to="/about">
                  How it works <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="xl" variant="soft">
                <Link to="/your-map">Play your own map</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <DiscoveryDialog
        open={open}
        onOpenChange={setOpen}
        layer={layer}
        onLayerChange={setLayer}
        spot={spot}
      />
    </div>
  );
}
