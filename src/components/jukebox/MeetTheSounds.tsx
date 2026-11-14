import { useEffect, useState } from "react";
import { Square, Volume1, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEngine, peekEngine } from "@/lib/audio/engine";
import { useA11y } from "@/lib/a11y";
import type { EarthSample } from "@/lib/earth-data";
import { LAYERS, type LayerId } from "@/lib/layers";
import { cn } from "@/lib/utils";
import { LayerIcon } from "./layer-icon";

/** The four core NASA datasets kids learn first. */
export const CORE_SOUNDS: {
  id: LayerId;
  dataset: string;
  low: { label: string; say: string };
  high: { label: string; say: string };
}[] = [
  {
    id: "forest",
    dataset: "NASA GEDI forest height · illustrative sound mapping",
    low: { label: "Low tree cover", say: "Few trees. A little rustle and occasional birdsong." },
    high: { label: "Tall forest", say: "Tall forest. More birds sing. These birds are our sound metaphor, not satellite recordings." },
  },
  {
    id: "storm",
    dataset: "Lightning seen from the Space Station (2017–2023)",
    low: { label: "Far-away rumble", say: "Few lightning flashes. A soft rumble far away." },
    high: { label: "Thunder overhead", say: "Many lightning flashes. Loud thunder, right above you, like Central Africa." },
  },
  {
    id: "ocean",
    dataset: "NASA sea surface temperature & currents",
    low: { label: "Freezing polar sea", say: "Cold ocean. Low, deep notes, like the Arctic ice." },
    high: { label: "Warm tropical sea", say: "Warm ocean. Bright, happy chords, like a tropical beach." },
  },
  {
    id: "lights",
    dataset: "NASA Black Marble night lights",
    low: { label: "Quiet countryside", say: "Few lights at night. One lonely bell, like a small village." },
    high: { label: "Big busy city", say: "Lots of lights at night. Many bells ringing, like Tokyo." },
  },
];

function sampleFor(id: LayerId, v: number): EarthSample {
  const base: EarthSample = { rain: 0, storm: 0, ocean: 0, lights: 0, forest: 0, dust: 0, co2: 0, land: id === "ocean" ? 0 : 1, dustType: 1 };
  return { ...base, [id]: v };
}

export function MeetTheSounds() {
  const { speak, announce } = useA11y();
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => () => peekEngine()?.stopAll(0.3), []);

  const play = async (id: LayerId, high: boolean) => {
    const key = `${id}-${high ? "high" : "low"}`;
    if (now === key) return stop();
    const e = await getEngine();
    e.setSample(sampleFor(id, high ? 0.95 : 0.2));
    e.setMix({ [id]: 1 });
    setNow(key);
    const c = CORE_SOUNDS.find((x) => x.id === id);
    if (!c) return;
    const text = high ? c.high.say : c.low.say;
    speak(text);
    announce(text);
  };

  const stop = () => {
    peekEngine()?.stopAll(0.4);
    setNow(null);
  };

  return (
    <section aria-labelledby="meet-title" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h2 id="meet-title" className="font-display text-4xl font-bold">
        Meet the sounds
      </h2>
      <p className="mt-2 max-w-2xl text-lg text-muted-foreground">
        Four NASA datasets, four sounds. Press "a little" and "a lot" to learn the rule: more of something means more sound.
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {CORE_SOUNDS.map((c) => (
          <li key={c.id} className={cn(`layer-${c.id}`, "surface border-2 border-layer p-5")}>
            <div className="flex items-center gap-4">
              <span className="layer-chip grid h-14 w-14 shrink-0 place-items-center rounded-2xl">
                <LayerIcon id={c.id} className="h-7 w-7" />
              </span>
              <div>
                <h3 className="text-2xl font-bold">{LAYERS[c.id].name}</h3>
                <p className="text-sm text-muted-foreground">{c.dataset}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {([false, true] as const).map((high) => {
                const key = `${c.id}-${high ? "high" : "low"}`;
                const lvl = high ? c.high : c.low;
                return (
                  <Button
                    key={key}
                    size="xl"
                    variant={now === key ? "layer" : "soft"}
                    aria-pressed={now === key}
                    onClick={() => play(c.id, high)}
                    className="h-auto min-h-16 flex-col items-start whitespace-normal py-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-sm uppercase tracking-wide opacity-80">
                      {high ? <Volume2 aria-hidden="true" /> : <Volume1 aria-hidden="true" />}
                      {high ? "A lot" : "A little"}
                    </span>
                    <span className="text-lg font-bold">{lvl.label}</span>
                  </Button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {now && (
        <Button size="xl" variant="soft" className="mt-4" onClick={stop}>
          <Square aria-hidden="true" /> Stop sound
        </Button>
      )}
    </section>
  );
}
