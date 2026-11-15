import { lazy, Suspense, useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Hand, Headphones, Keyboard, Monitor, RotateCcw, Vibrate, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useA11y } from "@/lib/a11y";
import { STATION_PARTS, type StationPartId } from "@/lib/station-parts";

import { joystickMove, type MuseumLayer } from "@/lib/museum-model";
import { LAYERS } from "@/lib/layers";
import { museumSnapshot } from "@/lib/museum-model";
import { getEngine } from "@/lib/audio/engine";
import { coastCrossing } from "@/lib/sonify-map";
import type { KioskAction, KioskState } from "./Station3D";
const Station3D = lazy(() => import("./Station3D"));
const ACTION_LABEL: Record<KioskAction, string> = { ocean: "Sea Temperature key", storm: "Lightning key", forest: "Forest Height key", lights: "Night Lights key", where: "Where am I?", west: "Joystick west", east: "Joystick east" };
const ICONS: Record<StationPartId, LucideIcon> = { globe: Hand, panel: Keyboard, headphones: Headphones, feedback: Vibrate, tablet: Monitor };


export function StationShowcase() {
  const { settings, announce, speak, buzz } = useA11y();
  const lastLand = useRef<number | null>(null);
  const [touched, setTouched] = useState<string | null>(null);
  const [said, setSaid] = useState<{ text: string; at: number } | null>(null);
  const say = (text: string) => setSaid({ text, at: Date.now() });
  const [selected, setSelected] = useState<StationPartId | null>(null);
  const [ready, setReady] = useState(false);
  const hotspotElements = useRef<Partial<Record<StationPartId, HTMLButtonElement | null>>>({});
  const part = STATION_PARTS.find((p) => p.id === selected);
  const [kiosk, setKiosk] = useState<KioskState>({ layer: "ocean", lat: 10, lng: -40, lastAction: "nothing yet", pressed: null, pressedAt: 0, tilt: 0 });
  const press = (a: KioskAction) => {
    {
      const k = kiosk;
      const layer: MuseumLayer = a === "ocean" || a === "storm" || a === "forest" || a === "lights" ? a : k.layer;
      const lng = a === "west" || a === "east" ? joystickMove({ lat: k.lat, lng: k.lng }, a === "west" ? -1 : 1).lng : k.lng;
      const label = ACTION_LABEL[a].toUpperCase();
      const snap = museumSnapshot(layer, k.lat, lng);
      const msg = a === "where" ? `You are at ${snap.name}. ${LAYERS[layer].name} is selected. ${snap.caption.split('. ').slice(1).join('. ')}` : `${ACTION_LABEL[a]}. ${a === "west" || a === "east" ? snap.name : LAYERS[layer].name}.`;
      speak(msg); announce(msg); say(msg);
      setKiosk({ layer, lat: k.lat, lng, lastAction: label, pressed: a, pressedAt: performance.now(), tilt: a === "west" ? -1 : a === "east" ? 1 : 0 });
    }
  };
  const touch = async (lat: number, lng: number) => {
    const snap = museumSnapshot(kiosk.layer, lat, lng);
    setTouched(snap.caption);
    setKiosk((k) => ({ ...k, lat, lng, lastAction: "TOUCHED GLOBE", pressed: null, pressedAt: performance.now(), tilt: 0 }));
    speak(snap.caption); announce(snap.caption); say(snap.caption);
    const e = await getEngine();
    const crossing = lastLand.current === null ? null : coastCrossing(lastLand.current, snap.sample.land);
    lastLand.current = snap.sample.land;
    e.setVolume(settings.volume); e.setSample(snap.sample);
    e.setMix({ [kiosk.layer]: 0.15 + 0.85 * snap.amount });
    e.marimba(snap.pitch, 0.12, snap.pan);
    if (crossing) { e.coast(crossing === "to-land", snap.pan); buzz(crossing === "to-land" ? [40, 30, 80] : [100]); }
  };
  const select = (id: StationPartId | null) => {
    setSelected(id);
    const p = STATION_PARTS.find((x) => x.id === id);
    const msg = p ? `${p.n}. ${p.title}. ${p.text}` : "Whole station view.";
    announce(msg); say(msg);
  };
  return (
    <section aria-labelledby="station3d-title" className="mt-14">
      <p className="text-xs font-bold uppercase text-primary">Product prototype · ES-1</p>
      <h2 id="station3d-title" className="mt-1 font-display text-4xl font-bold">The Earth Jukebox Station in 3D</h2>
      <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
        Turn the model by dragging. Choose a part to zoom in. This is the station a museum or school would buy: five parts, one sturdy wooden pedestal.
      </p>
      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[2.2fr_1fr]">
        <div
          className="station-stage"
          data-scene-ready={ready ? "true" : undefined}
          role="img"
          aria-label="3D model of the Earth Jukebox Station: a wooden pedestal with a raised touch globe seated on a cradle, a sloped panel with four Braille buttons and an east–west joystick, cabled headphones on a side hook, thermal and vibration feedback integrated into the globe’s surface, and a tablet on an arm to the right."
        >
          <ClientOnly fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
            <Suspense fallback={<p className="grid h-full place-items-center text-muted-foreground">Loading 3D station…</p>}>
              <Station3D onTouch={touch} kiosk={kiosk} onPress={press} selected={selected} hotspotElements={hotspotElements} spin={!settings.calmMotion} onReady={() => setReady(true)} />
            </Suspense>
          </ClientOnly>
          {said && (
            <div key={said.at} className="pointer-events-none absolute left-1/2 top-4 z-10 w-[min(92%,36rem)] -translate-x-1/2 animate-in fade-in slide-in-from-top-2" aria-hidden="true">
              <div className="relative rounded-2xl border-2 border-primary bg-card/95 px-4 py-3 text-base shadow-lg">
                <span className="font-bold text-primary">System: </span>
                <span className="text-card-foreground">"{said.text}"</span>
                <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary bg-card" />
              </div>
            </div>
          )}
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
            <p className="mt-1 text-sm text-muted-foreground">Tap the globe to hear that place. Click the keys, the pink Where am I? key or either side of the joystick on the model, or use these buttons. The tablet shows what was pressed.</p>
            {touched && <p className="mt-2 rounded-md bg-primary/15 p-2 text-sm font-bold">{touched}</p>}
            <p className="mt-2 font-bold">Pressed: {kiosk.lastAction.toLowerCase()} · {LAYERS[kiosk.layer].name} · {Math.abs(Math.round(kiosk.lng))}° {kiosk.lng < 0 ? "W" : "E"}</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {(["ocean", "storm", "forest", "lights"] as const).map((id) => (
                <Button key={id} size="sm" variant="soft" aria-pressed={kiosk.layer === id} onClick={() => press(id)} className={`layer-${id} aria-pressed:ring-2 aria-pressed:ring-[var(--layer)] whitespace-normal h-auto py-2 text-xs`}>{LAYERS[id].name}</Button>
              ))}
              <Button size="sm" variant="soft" onClick={() => press("west")}>← West</Button>
              <Button size="sm" variant="layer" className="col-span-2 h-auto flex-col gap-0 py-2" aria-label="Where am I?" onClick={() => press("where")}><span aria-hidden="true" className="text-lg leading-none">⠦</span><span>Where am I?</span></Button>
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
