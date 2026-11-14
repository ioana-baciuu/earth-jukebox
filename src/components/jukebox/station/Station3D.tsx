import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import skinDay from "@/assets/earth/skin-day.jpg.asset.json";
import bump from "@/assets/earth/earth-bump.jpg.asset.json";
import sst from "@/assets/earth/nasa-sst.jpg.asset.json";
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

const OVERVIEW = { cam: new THREE.Vector3(1.75, 1.55, 2.25), target: new THREE.Vector3(0, 0.85, 0) };
const ANCHORS: Record<StationPartId, { label: [number, number, number]; cam: [number, number, number]; target: [number, number, number] }> = {
  globe: { label: [0.28, 1.5, -0.12], cam: [0.8, 1.45, 1.25], target: [0, 1.15, -0.12] },
  panel: { label: [-0.2, 1.02, 0.25], cam: [0.2, 1.55, 1.15], target: [0, 0.9, 0.17] },
  headphones: { label: [-0.7, 0.8, 0.1], cam: [-1.5, 1.0, 0.9], target: [-0.62, 0.62, 0.1] },
  feedback: { label: [-0.18, 1.2, 0.16], cam: [0.65, 1.4, 1.1], target: [0, 1.18, -0.12] },
  tablet: { label: [0.6, 1.33, -0.02], cam: [1.4, 1.35, 0.95], target: [0.56, 1.12, -0.04] },
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

/** 1 · Tactile touch globe with real NASA skin, relief bump and LED sun ring. */
function TouchGlobe({ spin }: { spin: boolean }) {
  const { map, bumpMap } = useTexture({ map: skinDay.url, bumpMap: bump.url });
  map.colorSpace = THREE.SRGBColorSpace;
  const earth = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (spin && earth.current) earth.current.rotation.y += Math.min(dt, 0.05) * 0.18;
  });
  return (
    <group position={[0, 1.18, -0.12]}>
      <mesh ref={earth} castShadow>
        <sphereGeometry args={[0.3, 96, 64]} />
        <meshStandardMaterial map={map} bumpMap={bumpMap} bumpScale={6} roughness={0.75} metalness={0.02} />
      </mesh>
      {/* Rear-mounted north-up support leaves the touch surface unobstructed. */}
      <mesh position={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.006, 0.006, 0.7, 12]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.34, -0.175]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.35, 12]} />
        <meshStandardMaterial color={C.steel} metalness={0.85} roughness={0.25} />
      </mesh>
      {/* LED sun ring */}
      <mesh rotation={[Math.PI / 2 - 0.25, 0, 0.2]}>
        <torusGeometry args={[0.37, 0.006, 8, 120]} />
        <meshStandardMaterial color={C.pink} emissive={C.pink} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* cradle */}
      <mesh position={[0, -0.31, 0]}>
        <cylinderGeometry args={[0.11, 0.16, 0.08, 48]} />
        <meshStandardMaterial color={C.navy} metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** 2 · Sloped control panel: four Braille dataset buttons, Where am I? key and one-axis joystick. */
function ControlPanel() {
  const keys = [C.ocean, C.storm, C.forest, C.lights];
  return (
    <group position={[0, 0.9, 0.17]} rotation={[0.32, 0, 0]}>
      <RoundedBox args={[1.0, 0.05, 0.3]} radius={0.015} smoothness={3} castShadow>
        <meshStandardMaterial color={C.navy} roughness={0.55} metalness={0.15} />
      </RoundedBox>
      {keys.map((color, i) => (
        <group key={color} position={[-0.39 + i * 0.13, 0.035, -0.02]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.048, 0.052, 0.03, 40]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          {/* raised Braille-style dots */}
          {[0, 1, 2].map((d) => (
            <mesh key={d} position={[-0.02 + d * 0.02, -0.01, 0.085]}>
              <sphereGeometry args={[0.006, 12, 8]} />
              <meshStandardMaterial color={C.cream} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
      <RoundedBox args={[0.12, 0.03, 0.09]} radius={0.01} position={[0.17, 0.035, -0.02]}>
        <meshStandardMaterial color={C.pink} roughness={0.4} />
      </RoundedBox>
      {/* joystick: east/west slot only */}
      <group position={[0.37, 0.03, -0.02]}>
        <RoundedBox args={[0.16, 0.012, 0.035]} radius={0.006}>
          <meshStandardMaterial color={C.rubber} roughness={0.9} />
        </RoundedBox>
        <mesh position={[0, 0.06, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.01, 0.012, 0.11, 16]} />
          <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0.026, 0.115, 0]} castShadow>
          <sphereGeometry args={[0.026, 24, 16]} />
          <meshStandardMaterial color={C.pink} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** 3 · Stereo headphones on a side hook, cabled to the station. */
function Headphones() {
  const cable = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.62, 0.52, 0.19),
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
    <group>
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
      <mesh geometry={cable}>
        <meshStandardMaterial color={C.rubber} roughness={0.7} />
      </mesh>
    </group>
  );
}

/** 4 · Concept overlay for actuators beneath the globe's touch surface. */
function GlobeFeedback({ visible }: { visible: boolean }) {
  return (
    <group position={[0, 1.18, -0.12]} visible={visible}>
      {[C.ocean, C.pink, C.storm].map((color, index) => (
        <mesh key={color} rotation={[0, -0.8 + index * 0.7, 0]}>
          <sphereGeometry args={[0.303, 32, 20, 0.15, 0.55, 1.1, 0.65]} />
          <meshBasicMaterial color={color} transparent opacity={0.45} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** 5 · Companion tablet on an arm, showing a real NASA sea-temperature frame. */
function Tablet() {
  const screen = useTexture(sst.url);
  screen.colorSpace = THREE.SRGBColorSpace;
  return (
    <group>
      <mesh position={[0.56, 0.98, -0.1]}>
        <cylinderGeometry args={[0.012, 0.016, 0.3, 16]} />
        <meshStandardMaterial color={C.steel} metalness={0.8} roughness={0.3} />
      </mesh>
      <group position={[0.56, 1.14, -0.06]} rotation={[-0.3, -0.5, 0]}>
        <RoundedBox args={[0.34, 0.22, 0.016]} radius={0.012} smoothness={3} castShadow>
          <meshStandardMaterial color={C.rubber} roughness={0.4} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0085]}>
          <planeGeometry args={[0.31, 0.155]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
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
      <RoundedBox args={[1.1, 0.76, 0.62]} radius={0.03} smoothness={4} position={[0, 0.42, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[1.18, 0.06, 0.7]} radius={0.02} smoothness={3} position={[0, 0.83, 0]} castShadow>
        <meshStandardMaterial color={C.cream} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[1.0, 0.04, 0.54]} />
        <meshStandardMaterial color={C.rubber} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, 0.312]}>
        <planeGeometry args={[0.8, 0.21]} />
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
}: {
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
      <group ref={reg("globe")}>
        <Suspense fallback={null}>
          <TouchGlobe spin={spin} />
        </Suspense>
      </group>
      <Pedestal />
      <group ref={reg("panel")}><ControlPanel /></group>
      <group ref={reg("headphones")}><Headphones /></group>
      <group ref={reg("feedback")}><GlobeFeedback visible={selected === "feedback"} /></group>
      <group ref={reg("tablet")}>
        <Suspense fallback={null}>
          <Tablet />
          <ReadyFlag onReady={onReady} />
        </Suspense>
      </group>
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
