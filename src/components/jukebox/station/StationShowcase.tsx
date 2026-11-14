import { lazy, Suspense, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Hand, Headphones, Keyboard, Monitor, RotateCcw, Vibrate, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y } from "@/lib/a11y";
import { STATION_PARTS, type StationPartId } from "@/lib/station-parts";

const Station3D = lazy(() => import("./Station3D"));
const ICONS: Record<StationPartId, LucideIcon> = { globe: Hand, panel: Keyboard, headphones: Headphones, pad: Vibrate, tablet: Monitor };

const SPECS = [
  ["Footprint", "118 × 70 cm, fits a 150 cm wheelchair turning circle beside it"],
  ["Panel height", "90 cm front edge, sloped 18° toward the child"],
  ["Globe", "60 cm tactile relief, 128 touch zones, north fixed upright"],
  ["Audio", "Two stereo headphone ports with volume limit"],
  ["Power", "One standard socket; runs offline from a built-in computer"],
  ["Materials", "Birch plywood, wipe-clean resin globe, rubber Braille keys"],
];

export function StationShowcase() {
  const { settings, announce } = useA11y();
  const [selected, setSelected] = useState<StationPartId | null>(null);
  const [ready, setReady] = useState(false);
  const part = STATION_PARTS.find((p) => p.id === selected);
  const select = (id: StationPartId | null) => {
    setSelected(id);
    const p = STATION_PARTS.find((x) => x.id === id);
    announce(p ? `${p.n}. ${p.title}. ${p.text}` : "Whole station view.");
  };
  return (
    <section aria-labelledby="station3d-title" className="mt-14">
      <p className="text-xs font-bold uppercase text-primary">Product prototype · ES-1</p>
      <h2 id="station3d-title" className="mt-1 font-display text-4xl font-bold">The Earth Jukebox Station in 3D</h2>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
        Turn the model by dragging. Choose a part to zoom in. This is the station a museum or school would buy: five parts, one sturdy wooden pedestal.
      </p>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div
          className="station-stage"
          data-scene-ready={ready ? "true" : undefined}
          role="img"
          aria-label="3D model of the Earth Jukebox Station: a wooden pedestal with a raised touch globe on top, a sloped panel with four Braille buttons and an east–west joystick, headphones on a side hook, a warm-to-cool palm pad at the front and a tablet on an arm to the right."
        >
          <ClientOnly fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
            <Suspense fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
              <Station3D selected={selected} onSelect={select} spin={!settings.calmMotion} onReady={() => setReady(true)} />
            </Suspense>
          </ClientOnly>
          {part && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border-2 border-primary bg-background/90 p-3 backdrop-blur" aria-hidden="true">
              <p className="font-display text-lg font-bold">{part.n}. {part.title}</p>
              <p className="text-sm text-muted-foreground">{part.text}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div role="group" aria-label="Station parts" className="grid gap-2">
            {STATION_PARTS.map((p) => {
              const Icon = ICONS[p.id];
              return (
                <Button
                  key={p.id}
                  variant="soft"
                  aria-pressed={selected === p.id}
                  onClick={() => select(selected === p.id ? null : p.id)}
                  className="h-auto justify-start gap-3 whitespace-normal px-4 py-3 text-left aria-pressed:ring-2 aria-pressed:ring-primary"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display font-bold text-primary-foreground">{p.n}</span>
                  <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="font-bold">{p.title}</span>
                </Button>
              );
            })}
            <Button variant="ghost" onClick={() => select(null)} className="justify-start"><RotateCcw aria-hidden="true" /> Whole station</Button>
          </div>
          <dl className="surface grid gap-2 p-4 text-sm">
            {SPECS.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[7rem_1fr] gap-2">
                <dt className="font-bold">{k}</dt>
                <dd className="text-muted-foreground">{v}</dd>
              </div>
            ))}
            <p className="mt-1 text-xs text-muted-foreground">Proposed specification for the hackathon prototype; final sizes follow accessibility testing with partner museums.</p>
          </dl>
        </div>
      </div>
    </section>
  );
}
