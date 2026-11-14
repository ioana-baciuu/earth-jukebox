import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent } from "react";
import type { GlobeInstance } from "globe.gl";
import { Moon, Sun, Sunrise } from "lucide-react";
import bumpAsset from "@/assets/earth/earth-bump.jpg.asset.json";
import skyAsset from "@/assets/earth/night-sky.jpg.asset.json";
import type { LayerId } from "@/lib/layers";
import { DAY_PHASE_LABEL, dayPhase, nightShare } from "@/lib/museum-model";

/** WebGL needs plain colours; these mirror the --layer-* tokens in styles.css. */
const RING_RGB: Record<LayerId | "base", string> = {
  base: "253,176,212",
  rain: "103,202,255",
  storm: "195,181,255",
  ocean: "71,214,207",
  lights: "249,168,112",
  forest: "117,224,124",
  dust: "210,184,165",
  co2: "246,132,134",
};

/** Day/night blend: sunlit day skin, night side shows boosted NASA Black Marble city lights. */
const DAY_NIGHT_VERTEX = `
  varying vec3 vNormalW;
  varying vec2 vUv;
  void main() {
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const DAY_NIGHT_FRAGMENT = `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec3 sunDirection;
  uniform float glowBoost;
  varying vec3 vNormalW;
  varying vec2 vUv;
  void main() {
    float light = dot(normalize(vNormalW), normalize(sunDirection));
    vec3 day = texture2D(dayTexture, vUv).rgb;
    vec3 night = texture2D(nightTexture, vUv).rgb;
    float lum = dot(night, vec3(0.299, 0.587, 0.114));
    float cityMask = smoothstep(0.18, 0.5, lum);
    vec3 cityGlow = night * cityMask * glowBoost + vec3(1.0, 0.78, 0.5) * cityMask * 0.4;
    vec3 nightSide = day * 0.025 + cityGlow;
    vec3 daySide = day * (0.62 + 0.38 * clamp(light * 1.6, 0.0, 1.0));
    float blend = smoothstep(-0.07, 0.11, light);
    vec3 color = mix(nightSide, daySide, blend);
    float dusk = 1.0 - smoothstep(0.0, 0.16, abs(light));
    color += vec3(0.95, 0.5, 0.62) * dusk * 0.14;
    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Unit vector toward a lat/lng in globe.gl's world space (matches three-globe polar2Cartesian). */
function geoVector(lat: number, lng: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  return [Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)];
}


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
  /** When set with sunPosition, the globe blends day skin with these night city lights. */
  nightSkinUrl?: string;
}

export const EarthGlobe = forwardRef<GlobeHandle, Props>(function EarthGlobe(
  { skinUrl, layer, cursor, autoRotate, calmMotion, label, onPick, onKeyDown, onReady, lockedAxis = false, sunPosition, nightSkinUrl },
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
  const uniformsRef = useRef<{ sunDirection: { value: { set: (x: number, y: number, z: number) => void } } } | null>(null);
  const sunRef = useRef(sunPosition);
  sunRef.current = sunPosition;
  const [view, setView] = useState<{ lat: number; lng: number }>({ lat: 12, lng: 10 });
  const dayNight = Boolean(nightSkinUrl && sunPosition);

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
      if (nightSkinUrl) {
        const THREE = await import("three");
        if (disposed) return;
        const loader = new THREE.TextureLoader();
        const [dayTexture, nightTexture] = await Promise.all([
          loader.loadAsync(skinUrl),
          loader.loadAsync(nightSkinUrl),
        ]);
        if (disposed) return;
        const sun = sunRef.current ?? { lat: 0, lng: 0 };
        const material = new THREE.ShaderMaterial({
          uniforms: {
            dayTexture: { value: dayTexture },
            nightTexture: { value: nightTexture },
            sunDirection: { value: new THREE.Vector3(...geoVector(sun.lat, sun.lng)) },
            glowBoost: { value: 1.7 },
          },
          vertexShader: DAY_NIGHT_VERTEX,
          fragmentShader: DAY_NIGHT_FRAGMENT,
        });
        uniformsRef.current = material.uniforms as never;
        g.globeMaterial(material);
      } else {
        g.bumpImageUrl(bumpAsset.url).globeImageUrl(skinUrl);
      }
      let lastView = 0;
      g.onZoom(({ lat, lng }) => {
        const now = performance.now();
        if (now - lastView < 90) return;
        lastView = now;
        setView({ lat, lng });
      });
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
    if (nightSkinUrl) return;
    globeRef.current?.globeImageUrl(skinUrl);
  }, [skinUrl, ready, nightSkinUrl]);

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
    if (!sunPosition) return;
    uniformsRef.current?.sunDirection.value.set(...geoVector(sunPosition.lat, sunPosition.lng));
  }, [ready, sunPosition]);

  const phase = sunPosition ? dayPhase(view.lat, view.lng, sunPosition) : "day";
  const nightPct = sunPosition ? nightShare(view.lat, view.lng, sunPosition) : 0;
  const sunHours = sunPosition ? (((12 + (view.lng - sunPosition.lng) / 15) % 24) + 24) % 24 : 12;
  const sunTime = `${String(Math.floor(sunHours)).padStart(2, "0")}:${String(Math.floor((sunHours % 1) * 60)).padStart(2, "0")}`;

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
      {dayNight && ready && (
        <>
          <div className="daynight-badge" data-phase={phase} aria-hidden="true">
            <span className="flex items-center gap-2 text-sm font-bold">
              {phase === "night" ? <Moon className="h-4 w-4 text-primary" /> : phase === "day" ? <Sun className="h-4 w-4 text-accent" /> : <Sunrise className="h-4 w-4 text-primary" />}
              {DAY_PHASE_LABEL[phase]}
            </span>
            <span className="daynight-meter"><span style={{ width: `${nightPct}%` }} /></span>
            <span className="flex justify-between gap-3 text-xs text-muted-foreground">
              <span>{nightPct}% of this view in night</span>
              <span>Sun time {sunTime}</span>
            </span>
          </div>
          <p className="sr-only" aria-live="polite">{DAY_PHASE_LABEL[phase]}</p>
        </>
      )}
    </div>
  );
});
