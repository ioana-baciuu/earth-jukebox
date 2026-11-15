import { lazy, Suspense, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Hand, Headphones, Keyboard, Monitor, RotateCcw, Vibrate, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y } from "@/lib/a11y";
import { STATION_PARTS, type StationPartId } from "@/lib/station-parts";

import { joystickMove, type MuseumLayer } from "@/lib/museum-model";
import { LAYERS } from "@/lib/layers";
import { describePlace } from "@/lib/places";
import { sampleEarth } from "@/lib/earth-data";
import type { KioskAction, KioskState } from "./Station3D";
const Station3D = lazy(() => import("./Station3D"));
const ACTION_LABEL: Record<KioskAction, string> = { ocean: "Sea Temperature key", storm: "Lightning key", forest: "Forest Height key", lights: "Night Lights key", where: "Where am I?", west: "Joystick west", east: "Joystick east" };
const ICONS: Record<StationPartId, LucideIcon> = { globe: Hand, panel: Keyboard, headphones: Headphones, feedback: Vibrate, tablet: Monitor };


export function StationShowcase() {
  const { settings, announce } = useA11y();
  const [selected, setSelected] = useState<StationPartId | null>(null);
  const [ready, setReady] = useState(false);
  const hotspotElements = useRef<Partial<Record<StationPartId, HTMLButtonElement | null>>>({});
  const part = STATION_PARTS.find((p) => p.id === selected);
  const [kiosk, setKiosk] = useState<KioskState>({ layer: "ocean", lng: -40, lastAction: "nothing yet", pressed: null, pressedAt: 0, tilt: 0 });
  const press = (a: KioskAction) => {
    {
      const k = kiosk;
      const layer: MuseumLayer = a === "ocean" || a === "storm" || a === "forest" || a === "lights" ? a : k.layer;
      const lng = a === "west" || a === "east" ? joystickMove({ lat: 0, lng: k.lng }, a === "west" ? -1 : 1).lng : k.lng;
      const label = ACTION_LABEL[a].toUpperCase();
      const place = describePlace(10, lng, sampleEarth(10, lng).land > 0.5);
      announce(a === "where" ? `${place}, ${LAYERS[layer].name}.` : `${ACTION_LABEL[a]}. ${a === "west" || a === "east" ? place : LAYERS[layer].name}.`);
      setKiosk({ layer, lng, lastAction: label, pressed: a, pressedAt: performance.now(), tilt: a === "west" ? -1 : a === "east" ? 1 : 0 });
    }
  };
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
          aria-label="3D model of the Earth Jukebox Station: a wooden pedestal with a raised touch globe seated on a cradle, a sloped panel with four Braille buttons and an east–west joystick, cabled headphones on a side hook, thermal and vibration feedback integrated into the globe’s surface, and a tablet on an arm to the right."
        >
          <ClientOnly fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
            <Suspense fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
              <Station3D kiosk={kiosk} onPress={press} selected={selected} hotspotElements={hotspotElements} spin={!settings.calmMotion} onReady={() => setReady(true)} />
            </Suspense>
          </ClientOnly>
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {STATION_PARTS.map((p) => (
              <Button
                key={p.id}
                ref={(element) => { hotspotElements.current[p.id] = element; }}
                variant="ghost"
                size="icon"
                tabIndex={-1}
                aria-label={p.title}
                aria-pressed={selected === p.id}
                className="station-hotspot pointer-events-auto absolute left-0 top-0"
                onClick={() => select(selected === p.id ? null : p.id)}
              >{p.n}</Button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="surface p-4" aria-live="polite">
            <p className="text-xs font-bold uppercase text-primary">Try the controls</p>
            <p className="mt-1 text-sm text-muted-foreground">Click the keys, the pink Where am I? key or either side of the joystick on the model, or use these buttons. The tablet shows what was pressed.</p>
            <p className="mt-2 font-bold">Pressed: {kiosk.lastAction.toLowerCase()} · {LAYERS[kiosk.layer].name} · {Math.abs(Math.round(kiosk.lng))}° {kiosk.lng < 0 ? "W" : "E"}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(["ocean", "storm", "forest", "lights"] as const).map((id) => (
                <Button key={id} size="sm" variant="soft" aria-pressed={kiosk.layer === id} onClick={() => press(id)} className={`layer-${id} aria-pressed:ring-2 aria-pressed:ring-[var(--layer)] whitespace-normal h-auto py-2 text-xs`}>{LAYERS[id].name}</Button>
              ))}
              <Button size="sm" variant="soft" onClick={() => press("west")}>← West</Button>
              <Button size="sm" variant="layer" className="col-span-2" onClick={() => press("where")}>Where am I?</Button>
              <Button size="sm" variant="soft" onClick={() => press("east")}>East →</Button>
            </div>
          </div>
          {part && (
            <div className="border-l-2 border-primary pl-4" aria-live="polite">
              <p className="font-display text-lg font-bold">{part.n}. {part.title}</p>
              <p className="text-sm text-muted-foreground">{part.text}</p>
            </div>
          )}
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
        </div>
      </div>
    </section>
  );
}
