import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Music4, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { getEngine, peekEngine } from "@/lib/audio/engine";
import { useA11y } from "@/lib/a11y";
import { layerStrength, type EarthSample } from "@/lib/earth-data";
import { LAYER_IDS, LAYERS, type LayerId } from "@/lib/layers";
import { formatCoords } from "@/lib/places";
import { levelIndex } from "@/lib/sonify-map";
import { cn } from "@/lib/utils";
import { LayerIcon } from "./layer-icon";
import { SoundBars } from "./SoundBars";

export interface Spot {
  name: string;
  lat: number;
  lng: number;
  sample: EarthSample;
}

/** Overlay layers in NASA Worldview that match each Earth Jukebox layer. */
const WORLDVIEW_LAYERS: Partial<Record<LayerId, string>> = {
  rain: "IMERG_Precipitation_Rate",
  ocean: "GHRSST_L4_MUR_Sea_Surface_Temperature",
  lights: "VIIRS_Black_Marble",
};

/** Deep link to today's satellite view of this spot in NASA Worldview. */
export function worldviewUrl(lat: number, lng: number, layer: LayerId) {
  const d = 8;
  const box = [lng - d * 1.6, lat - d, lng + d * 1.6, lat + d].map((n) => n.toFixed(2)).join(",");
  const layers = ["MODIS_Terra_CorrectedReflectance_TrueColor", WORLDVIEW_LAYERS[layer], "Coastlines_15m"]
    .filter(Boolean)
    .join(",");
  return `https://worldview.earthdata.nasa.gov/?v=${box}&l=${layers}`;
}

export function levelWord(layer: LayerId, s: EarthSample) {
  if (layer === "ocean" && s.land > 0.6) return "no sea here — try the blue ocean";
  return LAYERS[layer].levels[levelIndex(layerStrength(layer, s))];
}

export function DiscoveryDialog({
  open,
  onOpenChange,
  layer,
  onLayerChange,
  spot,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  layer: LayerId;
  onLayerChange: (l: LayerId) => void;
  spot: Spot | null;
}) {
  const { settings, speak, stopSpeaking, buzz, announce } = useA11y();
  const [everything, setEverything] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [flash, setFlash] = useState(0);
  const info = LAYERS[layer];
  const value = spot ? layerStrength(layer, spot.sample) : 0;
  const word = spot ? levelWord(layer, spot.sample) : "";
  const calmRef = useRef(settings.calmMotion);
  calmRef.current = settings.calmMotion;

  // Start / change the sound
  useEffect(() => {
    if (!open || !spot) return;
    let cancelled = false;
    getEngine().then((e) => {
      if (cancelled) return;
      e.setSample(spot.sample);
      if (everything) {
        const mix: Partial<Record<LayerId, number>> = {};
        for (const id of LAYER_IDS) mix[id] = id === layer ? 1 : 0.65;
        e.setMix(mix);
      } else e.setMix({ [layer]: 1 });
      setPlaying(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, spot, layer, everything]);

  // Narrate
  useEffect(() => {
    if (!open || !spot) return;
    const text = `${spot.name}. ${info.name}: ${word}. ${info.sound}`;
    speak(text);
    announce(`${spot.name}. ${info.name}: ${word}.`);
  }, [open, spot, layer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Thunder → flash + vibration
  useEffect(() => {
    if (!open) return;
    const e = peekEngine();
    if (!e) return;
    const off = e.on((ev) => {
      if (ev.kind !== "thunder") return;
      if (ev.strength > 0.3) buzz([60, 40, Math.round(120 + ev.strength * 200)]);
      if (!calmRef.current) setFlash((f) => f + 1);
    });
    return () => {
      off();
    };
  }, [open, playing, buzz]);

  useEffect(() => {
    if (!open) {
      peekEngine()?.stopAll(0.6);
      stopSpeaking();
      setPlaying(false);
      setEverything(false);
    }
  }, [open, stopSpeaking]);

  const pct = Math.round(value * 100);
  const coords = useMemo(() => (spot ? formatCoords(spot.lat, spot.lng) : ""), [spot]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          `layer-${layer}`,
          "max-h-[92vh] w-[min(96vw,56rem)] max-w-none overflow-y-auto rounded-3xl border-2 border-layer bg-card p-0 shadow-[var(--shadow-glow)]",
        )}
      >
        <div className="relative overflow-hidden rounded-t-3xl">
          <img
            src={info.image}
            alt={info.imageAlt}
            className="aspect-[16/8] w-full object-cover"
            width={1024}
            height={512}
          />
          {flash > 0 && (
            <div
              key={flash}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 animate-flash bg-foreground"
            />
          )}
          <span className="layer-chip absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold">
            <LayerIcon id={layer} className="h-5 w-5" />
            {info.name}
          </span>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <DialogTitle className="font-display text-3xl font-bold sm:text-4xl">{spot?.name}</DialogTitle>
              <p className="mt-1 text-base text-muted-foreground">{coords}</p>
            </div>
            <SoundBars playing={playing} calm={settings.calmMotion} />
          </div>

          <div className="rounded-2xl border-2 border-layer/40 p-5">
            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Here there is</p>
            <p className="font-display text-3xl font-bold text-layer sm:text-4xl">{word}</p>
            <div
              className="meter-track mt-4 h-5 w-full overflow-hidden rounded-full"
              role="meter"
              aria-label={`${info.name} amount`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${word}, ${pct} out of 100`}
            >
              <div className="meter-fill h-full rounded-full" style={{ width: `${Math.max(3, pct)}%` }} />
            </div>
          </div>

          <DialogDescription asChild>
            <div className="grid gap-4 text-lg sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/60 p-5">
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <Volume2 className="h-6 w-6 text-layer" aria-hidden="true" /> What you hear
                </h3>
                <p className="mt-2 text-foreground">{info.sound}</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 p-5">
                <h3 className="text-xl font-bold">What is this?</h3>
                <p className="mt-2 text-foreground">{info.about}</p>
              </div>
            </div>
          </DialogDescription>

          <fieldset>
            <legend className="mb-3 text-base font-bold">Listen to another layer here</legend>
            <div className="flex flex-wrap gap-2">
              {LAYER_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === layer}
                  onClick={() => onLayerChange(id)}
                  className={cn(
                    `layer-${id}`,
                    "layer-tile inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-base font-bold",
                  )}
                >
                  <LayerIcon id={id} className="h-5 w-5 text-layer" />
                  {LAYERS[id].name}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Button
              size="xl"
              variant={everything ? "layer" : "hero"}
              aria-pressed={everything}
              onClick={() => setEverything((v) => !v)}
            >
              <Music4 aria-hidden="true" />
              {everything ? "Playing everything here" : "Hear everything here"}
            </Button>
            <Button size="xl" variant="soft" onClick={() => spot && speak(`${spot.name}. ${info.name}: ${word}. ${info.sound}`, { force: true })}>
              <Volume2 aria-hidden="true" /> Read aloud
            </Button>
            <Button size="xl" variant="soft" onClick={() => onOpenChange(false)}>
              <Square aria-hidden="true" /> Stop and close
            </Button>
          </div>

          {spot && (
            <a
              href={worldviewUrl(spot.lat, spot.lng, layer)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 rounded-2xl border-2 border-border p-4 text-lg font-bold hover:border-primary"
            >
              <span>
                See today's satellite picture of this place in NASA Worldview
                <span className="block text-sm font-normal text-muted-foreground">For grown-ups and sighted helpers</span>
              </span>
              <ExternalLink className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}

          <p className="text-sm text-muted-foreground">
            Image:{" "}
            <a href={info.creditUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold underline">
              {info.credit} <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
