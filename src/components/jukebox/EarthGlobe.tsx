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
  lockedAxis?: boolean;
  sunPosition?: { lat: number; lng: number } | undefined;
}

export const EarthGlobe = forwardRef<GlobeHandle, Props>(function EarthGlobe(
  { skinUrl, layer, cursor, autoRotate, calmMotion, label, onPick, onKeyDown, onReady, lockedAxis = false, sunPosition },
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
      g.pointOfView({ lat: lockedAxis ? 12 : lat, lng, altitude }, calmMotion ? 0 : ms);
    },
    follow: (lat, lng, ms) => {
      const g = globeRef.current;
      if (!g) return;
      g.controls().autoRotate = false;
      g.pointOfView({ lat: lockedAxis ? 12 : lat, lng, altitude: 2.1 }, ms);
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
    if (lockedAxis) {
      const polar = (90 - 12) * Math.PI / 180;
      g.controls().minPolarAngle = polar;
      g.controls().maxPolarAngle = polar;
      g.controls().enablePan = false;
    }
  }, [autoRotate, calmMotion, ready, lockedAxis]);

  useEffect(() => {
    const g = globeRef.current;
    if (!g || !sunPosition) return;
    // Hemisphere cap centered opposite the Sun: real-time solar geometry, not NASA live imagery.
    g.polygonCapColor("rgba(0,0,0,0.62)").polygonSideColor("rgba(0,0,0,0)")
      .polygonStrokeColor("rgba(255,221,87,0.5)").polygonAltitude(0.004);
    const phi = sunPosition.lat * Math.PI / 180, lambda = sunPosition.lng * Math.PI / 180;
    const s = [Math.cos(phi)*Math.cos(lambda), Math.cos(phi)*Math.sin(lambda), Math.sin(phi)];
    const u = [-Math.sin(lambda), Math.cos(lambda), 0];
    const v = [-Math.sin(phi)*Math.cos(lambda), -Math.sin(phi)*Math.sin(lambda), Math.cos(phi)];
    const coordinates: number[][] = [];
    for (let i=0;i<=120;i++) {
      const t=i/120*2*Math.PI;
      const x=(u[0]??0)*Math.cos(t)+(v[0]??0)*Math.sin(t)-0.002*(s[0]??0);
      const y=(u[1]??0)*Math.cos(t)+(v[1]??0)*Math.sin(t)-0.002*(s[1]??0);
      const z=(u[2]??0)*Math.cos(t)+(v[2]??0)*Math.sin(t)-0.002*(s[2]??0);
      coordinates.push([Math.atan2(y,x)*180/Math.PI,Math.atan2(z,Math.hypot(x,y))*180/Math.PI]);
    }
    g.polygonsData([{ type:"Feature", geometry:{type:"Polygon",coordinates:[coordinates]},properties:{} }]);
  }, [ready, sunPosition]);

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
