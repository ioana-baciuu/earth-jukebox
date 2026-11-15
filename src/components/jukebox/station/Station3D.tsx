import type React from "react";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import skinDay from "@/assets/earth/skin-day.jpg.asset.json";
import bump from "@/assets/earth/earth-bump.jpg.asset.json";
import sst from "@/assets/earth/nasa-sst.jpg.asset.json";
import lightning from "@/assets/earth/nasa-lightning.jpg.asset.json";
import forestImg from "@/assets/earth/nasa-forest.jpg.asset.json";
import night from "@/assets/earth/nasa-night.jpg.asset.json";
import type { MuseumLayer } from "@/lib/museum-model";

/** What the visitor last did on the 3D station, mirrored on the tablet screen. */
export type KioskState = { layer: MuseumLayer; lng: number; lastAction: string; pressed: string | null; pressedAt: number; tilt: number };
export type KioskAction = MuseumLayer | "where" | "west" | "east";
const LAYER_NAME: Record<MuseumLayer, string> = { ocean: "SEA TEMPERATURE", storm: "LIGHTNING", forest: "FOREST HEIGHT", lights: "NIGHT LIGHTS" };
import { STATION_PARTS, type StationPartId } from "@/lib/station-parts";

/** WebGL needs plain colours; these mirror --primary and the --layer-* tokens in styles.css. */
const C = {
  pink: "#fdb0d4",
  ocean: "#47d6cf",
  storm: "#c3b5ff",
  forest: "#75e07c",
  lights: "#f9a870",
  navy: "#141a33",
  steel: "#9aa3b5",
  rubber: "#1d2030",
  cream: "#efe8dd",
};

const OVERVIEW = { cam: new THREE.Vector3(1.75, 1.55, 2.25), target: new THREE.Vector3(0, 0.7, 0) };
const ANCHORS: Record<StationPartId, { label: [number, number, number]; cam: [number, number, number]; target: [number, number, number] }> = {
  globe: { label: [0.32, 1.44, 0.04], cam: [0.6, 1.25, 1.4], target: [0, 1.04, 0.04] },
  panel: { label: [0.05, 0.76, 0.46], cam: [0.15, 1.1, 1.05], target: [0, 0.62, 0.33] },
  headphones: { label: [-0.6, 0.6, 0.1], cam: [-1.2, 1.2, 1.6], target: [-0.3, 0.8, 0.55] },
  feedback: { label: [-0.22, 1.12, 0.34], cam: [0.55, 1.25, 1.2], target: [0, 1.04, 0.04] },
  tablet: { label: [0.66, 1.06, 0.2], cam: [1.15, 1.05, 1.0], target: [0.62, 0.92, 0.14] },
};

function useCanvasTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function useWood() {
  return useCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = "#a9774f";
    ctx.fillRect(0, 0, w, h);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 140; i++) {
      const y = rnd() * h;
      ctx.strokeStyle = `rgba(${70 + rnd() * 40},${40 + rnd() * 25},${20 + rnd() * 15},${0.12 + rnd() * 0.2})`;
      ctx.lineWidth = 1 + rnd() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 70 + i) * 4);
      ctx.stroke();
    }
  });
}

/** 1 · Tactile touch globe with real NASA skin and relief bump, seated on its cradle. */
function TouchGlobe({ spin, lng, onTouch }: { spin: boolean; lng: number; onTouch?: ((lat: number, lng: number) => void) | undefined }) {
  const { map, bumpMap } = useTexture({ map: skinDay.url, bumpMap: bump.url });
  map.colorSpace = THREE.SRGBColorSpace;
  const earth = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!earth.current) return;
    // Joystick longitude faces the visitor; it eases there unless calm motion is on.
    const goal = -(lng * Math.PI) / 180 - Math.PI / 2;
    const r = earth.current.rotation;
    r.y = spin ? r.y + (goal - r.y) * (1 - Math.exp(-5 * Math.min(dt, 0.05))) : goal;
  });
  return (
    <group position={[0, 1.24, 0.04]}>
      <mesh ref={earth} castShadow
        onClick={(e) => { e.stopPropagation(); if (e.uv && onTouch) onTouch(e.uv.y * 180 - 90, e.uv.x * 360 - 180); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = ""; }}>
        <sphereGeometry args={[0.36, 96, 64]} />
        <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={6} roughness={0.75} metalness={0.02} />
      </mesh>
      {/* cradle */}
      <mesh position={[0, -0.37, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 0.06, 48]} />
        <meshStandardMaterial color={C.navy} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** 2 · Sloped front control panel, lower than the globe: four Braille keys, Where am I? and an east/west joystick. Every part is clickable. */
function PressKey({ id, state, onPress, children, position }: { id: KioskAction; state: KioskState; onPress: (a: KioskAction) => void; children: React.ReactNode; position: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const down = state.pressed === id && performance.now() - state.pressedAt < 260;
    g.current.position.y += ((down ? position[1] - 0.014 : position[1]) - g.current.position.y) * 0.35;
  });
  return (
    <group ref={g} position={position}
      onClick={(e) => { e.stopPropagation(); onPress(id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { document.body.style.cursor = ""; }}>
      {children}
    </group>
  );
}
function ControlPanel({ state, onPress }: { state: KioskState; onPress: (a: KioskAction) => void }) {
  const keys: [MuseumLayer, string][] = [["ocean", C.ocean], ["storm", C.storm], ["forest", C.forest], ["lights", C.lights]];
  const stick = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!stick.current) return;
    const live = performance.now() - state.pressedAt < 400 ? state.tilt : 0;
    stick.current.rotation.z += (-live * 0.45 - stick.current.rotation.z) * 0.25;
  });
  return (
    <group position={[0, 0.82, 0.33]} rotation={[0.45, 0, 0]}>
      <RoundedBox args={[0.86, 0.045, 0.24]} radius={0.015} smoothness={3} castShadow>
        <meshStandardMaterial color={C.navy} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      {keys.map(([id, color], i) => (
        <PressKey key={id} id={id} state={state} onPress={onPress} position={[-0.34 + i * 0.11, 0.032, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.042, 0.046, 0.03, 40]} />
            <meshStandardMaterial color={color} roughness={0.35} emissive={color} emissiveIntensity={state.layer === id ? 0.55 : 0} />
          </mesh>
          {[0, 1, 2].map((d) => (
            <mesh key={d} position={[-0.018 + d * 0.018, 0.016, 0.0]}>
              <sphereGeometry args={[0.006, 12, 8]} />
              <meshStandardMaterial color={C.cream} roughness={0.6} />
            </mesh>
          ))}
        </PressKey>
      ))}
      <PressKey id="where" state={state} onPress={onPress} position={[0.12, 0.032, 0]}>
        <RoundedBox args={[0.1, 0.03, 0.08]} radius={0.01}>
          <meshStandardMaterial color={C.pink} roughness={0.4} />
        </RoundedBox>
      </PressKey>
      {/* joystick: east/west slot only. Click the left half for west, right half for east. */}
      <group position={[0.31, 0.028, 0]}>
        <RoundedBox args={[0.16, 0.012, 0.035]} radius={0.006}>
          <meshStandardMaterial color={C.rubber} roughness={0.9} />
        </RoundedBox>
        <group ref={stick}>
          <mesh position={[0, 0.055, 0]}>
            <cylinderGeometry args={[0.01, 0.012, 0.11, 16]} />
            <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.11, 0]} castShadow>
            <sphereGeometry args={[0.026, 24, 16]} />
            <meshStandardMaterial color={C.pink} roughness={0.3} />
          </mesh>
        </group>
        {(["west", "east"] as const).map((dir) => (
          <mesh key={dir} position={[dir === "west" ? -0.045 : 0.045, 0.07, 0]}
            onClick={(e) => { e.stopPropagation(); onPress(dir); }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { document.body.style.cursor = ""; }}>
            <boxGeometry args={[0.09, 0.16, 0.08]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** 3 · Stereo headphones on a side hook, cabled to the station. */
function Headphones({ worn }: { worn: boolean }) {
  if (worn) return <WornCable />;
  const cable = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          // The rotated earcup centre is (-0.63, 0.61, 0.19), radius 0.045.
          new THREE.Vector3(-0.63, 0.568, 0.19),
          new THREE.Vector3(-0.63, 0.53, 0.19),
          new THREE.Vector3(-0.64, 0.35, 0.24),
          new THREE.Vector3(-0.58, 0.28, 0.2),
          new THREE.Vector3(-0.555, 0.4, 0.1),
        ]),
        40,
        0.006,
        8,
      ),
    [],
  );
  return (
    <group position={[0.1, 0, 0]}>
      {/* hook */}
      <mesh position={[-0.6, 0.72, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 12]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[-0.63, 0.63, 0.1]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <torusGeometry args={[0.09, 0.012, 12, 48, Math.PI]} />
          <meshStandardMaterial color={C.rubber} roughness={0.6} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.09, -0.02, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.045, 0.045, 0.035, 32]} />
              <meshStandardMaterial color={C.rubber} roughness={0.5} />
            </mesh>
            <mesh position={[s * 0.019, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.004, 32]} />
              <meshStandardMaterial color={s < 0 ? C.ocean : C.pink} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Strain relief overlaps both the earcup shell and the cable endpoint. */}
      <mesh position={[-0.63, 0.564, 0.19]}>
        <cylinderGeometry args={[0.009, 0.007, 0.026, 12]} />
        <meshStandardMaterial color={C.rubber} roughness={0.7} />
      </mesh>
      <mesh geometry={cable}>
        <meshStandardMaterial color={C.rubber} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Cable from the station jack up to the child's head when the headphones are worn. */
function WornCable() {
  const cable = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.42, 0.72, 0.28), new THREE.Vector3(-0.5, 0.6, 0.45), new THREE.Vector3(-0.45, 0.85, 0.62), new THREE.Vector3(-0.27, 1.16, 0.6),
  ]), 40, 0.006, 8), []);
  return (
    <group>
      <mesh position={[-0.6 + 0.1, 0.72, 0.1]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 12]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh geometry={cable}><meshStandardMaterial color={C.rubber} roughness={0.7} /></mesh>
    </group>
  );
}

/** A young visitor (about 115 cm) at the front of the station. With headphones selected, they wear them. */
function Child({ worn }: { worn: boolean }) {
  const skin = "#c98d6b", shirt = C.ocean, trousers = "#3a4466";
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (head.current) head.current.rotation.x = worn ? 0.25 + Math.sin(clock.elapsedTime * 1.5) * 0.03 : 0.25; });
  return (
    <group position={[-0.18, 0, 0.64]} rotation={[0, -0.3, 0]}>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.05, 0.25, 0]} castShadow>
          <capsuleGeometry args={[0.04, 0.38, 6, 12]} />
          <meshStandardMaterial color={trousers} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.66, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.24, 8, 16]} />
        <meshStandardMaterial color={shirt} roughness={0.7} />
      </mesh>
      {/* arms reaching forward to the globe and keys */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.12, 0.8, -0.16]} rotation={[-1.35, 0, s * -0.2]} castShadow>
          <capsuleGeometry args={[0.032, 0.26, 6, 12]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
      ))}
      <group ref={head} position={[0, 0.98, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.1, 32, 24]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.03, 0.02]}>
          <sphereGeometry args={[0.104, 32, 16, 0, Math.PI * 2, 0, 1.4]} />
          <meshStandardMaterial color="#2b1d18" roughness={0.9} />
        </mesh>
        {worn && (
          <group>
            <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0.01, 0]}>
              <torusGeometry args={[0.115, 0.012, 12, 48, Math.PI]} />
              <meshStandardMaterial color={C.rubber} roughness={0.6} />
            </mesh>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.115, -0.01, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.045, 0.045, 0.035, 32]} />
                  <meshStandardMaterial color={C.rubber} roughness={0.5} />
                </mesh>
                <mesh position={[s * 0.019, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.03, 0.03, 0.004, 32]} />
                  <meshStandardMaterial color={s < 0 ? C.ocean : C.pink} roughness={0.4} />
                </mesh>
              </group>
            ))}
          </group>
        )}
      </group>
    </group>
  );
}

/** 4 · Concept overlay for actuators beneath the globe's touch surface. */
function GlobeFeedback({ visible }: { visible: boolean }) {
  return (
    <group position={[0, 1.24, 0.04]} visible={visible}>
      {[C.ocean, C.pink, C.storm].map((color, index) => (
        <mesh key={color} rotation={[0, -0.8 + index * 0.7, 0]}>
          <sphereGeometry args={[0.363, 32, 20, 0.15, 0.55, 1.1, 0.65]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** 5 · Companion tablet on an arm. Its screen redraws to show the dataset, place and the control just pressed. */
function Tablet({ state }: { state: KioskState }) {
  const imgs = useTexture({ ocean: sst.url, storm: lightning.url, forest: forestImg.url, lights: night.url });
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024; canvas.height = 512;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, tex };
  }, []);
  useEffect(() => {
    const ctx = canvas.getContext("2d");
    const img = imgs[state.layer].image as CanvasImageSource | undefined;
    if (!ctx) return;
    const colour = C[state.layer];
    ctx.fillStyle = C.navy; ctx.fillRect(0, 0, 1024, 512);
    if (img) ctx.drawImage(img, 0, 96, 1024, 340);
    // reticle at the joystick longitude
    const x = ((state.lng + 180) / 360) * 1024;
    ctx.strokeStyle = C.cream; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, 266, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, 96); ctx.lineTo(x, 436); ctx.stroke();
    ctx.fillStyle = colour; ctx.fillRect(0, 0, 1024, 96);
    ctx.fillStyle = C.navy; ctx.font = "bold 52px Fredoka, sans-serif";
    ctx.fillText(LAYER_NAME[state.layer], 28, 66);
    ctx.font = "bold 34px 'Atkinson Hyperlegible', sans-serif"; ctx.textAlign = "right";
    ctx.fillText(`${Math.abs(Math.round(state.lng))}° ${state.lng < 0 ? "W" : "E"}`, 996, 62);
    ctx.textAlign = "left";
    ctx.fillStyle = C.navy; ctx.fillRect(0, 436, 1024, 76);
    ctx.fillStyle = C.cream; ctx.font = "bold 38px 'Atkinson Hyperlegible', sans-serif";
    ctx.fillText(`PRESSED: ${state.lastAction}`, 28, 488);
    tex.needsUpdate = true;
  }, [state, imgs, canvas, tex]);
  return (
    <group>
      <mesh position={[0.62, 0.95, 0.12]}>
        <cylinderGeometry args={[0.012, 0.016, 0.26, 16]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0.62, 1.12, 0.14]} rotation={[-0.25, -0.35, 0]}>
        <RoundedBox args={[0.28, 0.165, 0.014]} radius={0.01} smoothness={3} castShadow>
          <meshStandardMaterial color={C.rubber} roughness={0.4} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0075]}>
          <planeGeometry args={[0.26, 0.13]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Pedestal() {
  const wood = useWood();
  const plate = useCanvasTexture((ctx, w, h) => {
    ctx.fillStyle = C.navy;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = C.pink;
    ctx.font = "bold 64px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EARTH JUKEBOX", w / 2, 92);
    ctx.fillStyle = C.cream;
    ctx.font = "28px 'Atkinson Hyperlegible', sans-serif";
    ctx.fillText("CYSA SPHERE · LISTEN TO THE PLANET", w / 2, 140);
  }, 640, 170);
  return (
    <group>
      <RoundedBox args={[0.9, 0.52, 0.56]} radius={0.03} smoothness={4} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.96, 0.06, 0.62]} radius={0.02} smoothness={3} position={[0, 0.79, 0]} castShadow>
        <meshStandardMaterial color={C.cream} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.82, 0.04, 0.48]} />
        <meshStandardMaterial color={C.rubber} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0.282]}>
        <planeGeometry args={[0.7, 0.185]} />
        <meshStandardMaterial map={plate} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Highlighter({ groups, selected }: { groups: RefObject<Partial<Record<StationPartId, THREE.Group | null>>>; selected: StationPartId | null }) {
  const pink = useMemo(() => new THREE.Color(C.pink), []);
  const mats = useRef<THREE.MeshStandardMaterial[]>([]);
  useEffect(() => {
    for (const m of mats.current) m.emissiveIntensity = 0;
    mats.current = [];
    const g = selected ? groups.current?.[selected] : null;
    g?.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      if (m instanceof THREE.MeshStandardMaterial && m.toneMapped) {
        m.emissive = pink;
        mats.current.push(m);
      }
    });
  }, [selected, groups, pink]);
  useFrame(({ clock }) => {
    const v = 0.18 + Math.sin(clock.elapsedTime * 3) * 0.1;
    for (const m of mats.current) m.emissiveIntensity = v;
  });
  return null;
}

function CameraRig({ selected }: { selected: StationPartId | null }) {
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const camera = useThree((s) => s.camera);
  const moving = useRef(true);
  const goal = useMemo(() => {
    const a = selected ? ANCHORS[selected] : null;
    return a ? { cam: new THREE.Vector3(...a.cam), target: new THREE.Vector3(...a.target) } : OVERVIEW;
  }, [selected]);
  useEffect(() => {
    moving.current = true;
  }, [goal]);
  useFrame((_, dt) => {
    if (!moving.current || !controls) return;
    const k = 1 - Math.exp(-4 * Math.min(dt, 0.05));
    camera.position.lerp(goal.cam, k);
    controls.target.lerp(goal.target, k);
    controls.update();
    if (camera.position.distanceTo(goal.cam) < 0.01) moving.current = false;
  });
  return null;
}

function ReadyFlag({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

/** Project labels into the page's existing React root instead of creating nested roots. */
function HotspotPositions({ elements }: { elements: RefObject<Partial<Record<StationPartId, HTMLButtonElement | null>>> }) {
  const point = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, size }) => {
    for (const part of STATION_PARTS) {
      const element = elements.current[part.id];
      if (!element) continue;
      point.set(...ANCHORS[part.id].label).project(camera);
      element.style.transform = `translate(-50%, -50%) translate(${(point.x + 1) * size.width / 2}px, ${(1 - point.y) * size.height / 2}px)`;
      element.style.visibility = point.z > -1 && point.z < 1 ? "visible" : "hidden";
    }
  });
  return null;
}

export default function Station3D({
  selected,
  hotspotElements,
  spin,
  onReady,
  kiosk,
  onPress,
  onTouch,
}: {
  onTouch?: (lat: number, lng: number) => void;
  kiosk: KioskState;
  onPress: (a: KioskAction) => void;
  selected: StationPartId | null;
  hotspotElements: RefObject<Partial<Record<StationPartId, HTMLButtonElement | null>>>;
  spin: boolean;
  onReady: () => void;
}) {
  const groups = useRef<Partial<Record<StationPartId, THREE.Group | null>>>({});
  const reg = (id: StationPartId) => (g: THREE.Group | null) => {
    groups.current[id] = g;
  };
  return (
    <Canvas camera={{ position: OVERVIEW.cam.toArray(), fov: 38, near: 0.05, far: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight position={[2.5, 4, 3]} intensity={1.6} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} color={C.ocean} />
      <Environment resolution={256}>
        <Lightformer intensity={2} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={1.2} color={C.pink} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1, 1]} />
        <Lightformer intensity={1} color={C.ocean} position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[20, 1, 1]} />
      </Environment>
      {/* Station lowered 20 cm so a child reaches the globe; the child stays at floor level. */}
      <group position={[0, -0.2, 0]}>
      <group ref={reg("globe")}>
        <Suspense fallback={null}>
          <TouchGlobe spin={spin} lng={kiosk.lng} onTouch={onTouch} />
        </Suspense>
      </group>
      <Pedestal />
      <group ref={reg("panel")}><ControlPanel state={kiosk} onPress={onPress} /></group>
      <group ref={reg("headphones")}><Headphones worn={selected === "headphones"} /></group>
      <group ref={reg("feedback")}><GlobeFeedback visible={selected === "feedback"} /></group>
      <group ref={reg("tablet")}>
        <Suspense fallback={null}>
          <Tablet state={kiosk} />
          <ReadyFlag onReady={onReady} />
        </Suspense>
      </group>
      </group>
      <Child worn={selected === "headphones"} />
      <ContactShadows position={[0, 0, 0]} opacity={0.55} scale={4} blur={2.4} far={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <circleGeometry args={[2.2, 64]} />
        <meshStandardMaterial color={C.navy} roughness={0.95} />
      </mesh>
      <HotspotPositions elements={hotspotElements} />
      <Highlighter groups={groups} selected={selected} />
      <OrbitControls makeDefault enablePan={false} minDistance={0.8} maxDistance={4.5} minPolarAngle={0.3} maxPolarAngle={1.5} target={OVERVIEW.target.toArray()} />
      <CameraRig selected={selected} />
    </Canvas>
  );
}
