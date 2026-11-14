import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from "react";
import type { GlobeInstance } from "globe.gl";
import bumpAsset from "@/assets/earth/earth-bump.jpg.asset.json";
import skyAsset from "@/assets/earth/night-sky.jpg.asset.json";
import type { LayerId } from "@/lib/layers";

/** WebGL needs plain colours; these mirror the --layer-* tokens in styles.css. */
const RING_RGB: Record<LayerId | "base", string> = {
  base: "255,221,87",
  rain: "125,196,255",
  storm: "196,170,255",
  ocean: "90,220,215",
  lights: "255,196,92",
  forest: "120,226,140",
  dust: "255,160,200",
  co2: "255,150,110",
};

export interface GlobeHandle {
  flyTo: (lat: number, lng: number, altitude?: number, ms?: number) => void;
  follow: (lat: number, lng: number, ms: number) => void;
  focus: () => void;
}

interface Props {
  skinUrl: string;
  layer: LayerId | "base";
  cursor: { lat: number; lng: number } | null;
  autoRotate: boolean;
  calmMotion: boolean;
  label: string;
  onPick: (lat: number, lng: number) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onReady?: () => void;
}

export const EarthGlobe = forwardRef<GlobeHandle, Props>(function EarthGlobe(
  { skinUrl, layer, cursor, autoRotate, calmMotion, label, onPick, onKeyDown, onReady },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const [ready, setReady] = useState(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, altitude = 1.9, ms = 1400) => {
      const g = globeRef.current;
      if (!g) return;
      g.controls().autoRotate = false;
      g.pointOfView({ lat, lng, altitude }, calmMotion ? 0 : ms);
    },
    follow: (lat, lng, ms) => {
      const g = globeRef.current;
      if (!g) return;
      g.controls().autoRotate = false;
      g.pointOfView({ lat, lng, altitude: 2.1 }, ms);
    },
    focus: () => wrapRef.current?.focus(),
  }));

  // Create the globe once, in the browser only.
  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    (async () => {
      const { default: Globe } = await import("globe.gl");
      if (disposed || !mountRef.current) return;
      const el = mountRef.current;
      const g = new Globe(el, { animateIn: true, rendererConfig: { antialias: true, alpha: true } })
        .backgroundColor("rgba(0,0,0,0)")
        .backgroundImageUrl(skyAsset.url)
        .bumpImageUrl(bumpAsset.url)
        .globeImageUrl(skinUrl)
        .showAtmosphere(true)
        .atmosphereColor("#9fd3ff")
        .atmosphereAltitude(0.2)
        .onGlobeClick(({ lat, lng }) => pickRef.current(lat, lng))
        .ringColor(() => (t: number) => `rgba(${RING_RGB.base},${1 - t})`)
        .ringMaxRadius(7)
        .ringPropagationSpeed(4)
        .ringRepeatPeriod(900)
        .htmlElement(() => {
          const pin = document.createElement("div");
          pin.className = "globe-pin";
          pin.setAttribute("aria-hidden", "true");
          pin.innerHTML = '<span class="globe-pin-dot"></span>';
          return pin;
        })
        .htmlAltitude(0.01);
      g.pointOfView({ lat: 12, lng: 10, altitude: 2.3 });
      const controls = g.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.45;
      controls.enableDamping = true;
      controls.minDistance = 140;
      controls.maxDistance = 600;
      const size = () => {
        const r = el.getBoundingClientRect();
        g.width(r.width).height(r.height);
      };
      size();
      ro = new ResizeObserver(size);
      ro.observe(el);
      globeRef.current = g;
      setReady(true);
      readyRef.current?.();
    })();
    return () => {
      disposed = true;
      ro?.disconnect();
      const g = globeRef.current;
      globeRef.current = null;
      try {
        g?._destructor();
      } catch {
        /* ignore */
      }
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    globeRef.current?.globeImageUrl(skinUrl);
  }, [skinUrl, ready]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.controls().autoRotate = autoRotate && !calmMotion;
  }, [autoRotate, calmMotion, ready]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const rgb = RING_RGB[layer];
    g.ringColor(() => (t: number) => `rgba(${rgb},${1 - t})`);
    const data = cursor ? [{ lat: cursor.lat, lng: cursor.lng }] : [];
    g.ringsData(calmMotion ? [] : data);
    g.htmlElementsData(data);
  }, [cursor, layer, calmMotion, ready]);

  return (
    <div
      ref={wrapRef}
      tabIndex={0}
      role="application"
      aria-roledescription="interactive globe"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="relative h-full w-full cursor-crosshair rounded-3xl"
    >
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
});
