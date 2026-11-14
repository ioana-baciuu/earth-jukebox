import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { layerStrength, type EarthSample } from "@/lib/earth-data";
import { LAYER_IDS, LAYERS, type LayerId } from "@/lib/layers";
import { cn } from "@/lib/utils";
import { LayerIcon } from "./layer-icon";
import { levelWord } from "./DiscoveryDialog";

export type Mix = Record<LayerId, { on: boolean; vol: number }>;

export const PRESETS: { name: string; layers: LayerId[] }[] = [
  { name: "Whole planet", layers: [...LAYER_IDS] },
  { name: "Stormy jungle", layers: ["rain", "storm", "forest"] },
  { name: "Ocean voyage", layers: ["ocean", "rain", "dust"] },
  { name: "Night city", layers: ["lights", "co2"] },
];

export const SPEEDS = [
  { id: "slow", label: "Slow", degPerSec: 4 },
  { id: "medium", label: "Medium", degPerSec: 8 },
  { id: "fast", label: "Fast", degPerSec: 16 },
] as const;
export type SpeedId = (typeof SPEEDS)[number]["id"];

export const ROUTES = [
  { id: "spot", label: "Through my spot" },
  { id: "equator", label: "Along the equator", lat: 2 },
  { id: "north", label: "Across the north", lat: 45 },
  { id: "south", label: "Across the south", lat: -25 },
] as const;
export type RouteId = (typeof ROUTES)[number]["id"];

interface Props {
  mix: Mix;
  setMix: (m: Mix) => void;
  playing: boolean;
  onToggle: () => void;
  speed: SpeedId;
  setSpeed: (s: SpeedId) => void;
  route: RouteId;
  setRoute: (r: RouteId) => void;
  sample: EarthSample | null;
  placeName: string;
}

export function OrchestraPanel({ mix, setMix, playing, onToggle, speed, setSpeed, route, setRoute, sample, placeName }: Props) {
  return (
    <section aria-labelledby="orch-title" className="space-y-6">
      <div>
        <h2 id="orch-title" className="font-display text-3xl font-bold">
          The Earth Orchestra
        </h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Every kind of Earth data is an instrument. Switch them on, set their volume, and spin the planet to hear them play together.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="xl" variant="hero" onClick={onToggle} aria-pressed={playing}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? "Pause the planet" : "Play the planet"}
        </Button>
        <p aria-live="polite" className="text-lg">
          {playing ? (
            <>
              Now over: <strong className="text-primary">{placeName}</strong>
            </>
          ) : (
            <span className="text-muted-foreground">The globe will spin west to east.</span>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="rounded-2xl border border-border p-4">
          <legend className="px-1 text-base font-bold">Ready-made bands</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.name}
                variant="soft"
                size="lg"
                onClick={() => {
                  const next = { ...mix };
                  for (const id of LAYER_IDS) next[id] = { ...next[id], on: p.layers.includes(id) };
                  setMix(next);
                }}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4">
          <fieldset className="rounded-2xl border border-border p-4">
            <legend className="px-1 text-base font-bold">Speed</legend>
            <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Speed">
              {SPEEDS.map((s) => (
                <Button
                  key={s.id}
                  role="radio"
                  aria-checked={speed === s.id}
                  variant={speed === s.id ? "default" : "soft"}
                  size="lg"
                  onClick={() => setSpeed(s.id)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-border p-4">
        <legend className="px-1 text-base font-bold">Journey</legend>
        <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Journey">
          {ROUTES.map((r) => (
            <Button
              key={r.id}
              role="radio"
              aria-checked={route === r.id}
              variant={route === r.id ? "default" : "soft"}
              size="lg"
              onClick={() => setRoute(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </fieldset>

      <ul className="grid gap-3" aria-label="Instruments">
        {LAYER_IDS.map((id) => {
          const info = LAYERS[id];
          const m = mix[id];
          const v = sample ? layerStrength(id, sample) : 0;
          return (
            <li key={id} className={cn(`layer-${id}`, "layer-tile rounded-2xl p-4")} data-active={m.on}>
              <div className="flex items-center gap-4">
                <span className="layer-chip grid h-12 w-12 shrink-0 place-items-center rounded-full">
                  <LayerIcon id={id} className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <label htmlFor={`inst-${id}`} className="block text-lg font-bold leading-tight">
                    {info.instrument}
                  </label>
                  <p className="text-sm text-muted-foreground">
                    {info.name}
                    {sample && m.on ? ` · ${levelWord(id, sample)}` : ""}
                  </p>
                </div>
                <Switch
                  id={`inst-${id}`}
                  checked={m.on}
                  onCheckedChange={(on) => setMix({ ...mix, [id]: { ...m, on } })}
                />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span id={`vol-${id}`} className="w-20 shrink-0 text-sm font-bold text-muted-foreground">
                  Volume
                </span>
                <Slider
                  aria-labelledby={`vol-${id}`}
                  aria-label={`${info.instrument} volume`}
                  disabled={!m.on}
                  min={0}
                  max={1}
                  step={0.05}
                  value={[m.vol]}
                  onValueChange={([vol]) => setMix({ ...mix, [id]: { ...m, vol } })}
                />
                <div className="meter-track h-3 w-16 shrink-0 overflow-hidden rounded-full" aria-hidden="true">
                  <div className="meter-fill h-full transition-[width] duration-300" style={{ width: `${m.on ? v * 100 : 0}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
