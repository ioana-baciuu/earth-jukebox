import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { layerStrength, sampleEarth } from "@/lib/earth-data";
import type { LayerId } from "@/lib/layers";

/** Colours mirror the --layer-* and --primary tokens in src/styles.css. */
const LAYER_RGB: Record<LayerId | "base", [number, number, number]> = {
  ocean: [0.45, 0.85, 0.88],
  storm: [0.75, 0.66, 1.0],
  forest: [0.55, 0.9, 0.5],
  lights: [1.0, 0.78, 0.5],
  base: [1.0, 0.7, 0.85],
  rain: [0.6, 0.75, 1.0],
  dust: [0.95, 0.75, 0.55],
  co2: [0.85, 0.85, 0.85],
} as Record<LayerId | "base", [number, number, number]>;

function toXYZ(lat: number, lng: number, r: number) {
  const phi = (lat * Math.PI) / 180;
  const th = (lng * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(phi) * Math.cos(th), r * Math.sin(phi), -r * Math.cos(phi) * Math.sin(th));
}
function toLatLng(p: THREE.Vector3) {
  const v = p.clone().normalize();
  return { lat: (Math.asin(v.y) * 180) / Math.PI, lng: (Math.atan2(-v.z, v.x) * 180) / Math.PI };
}

const VERT = /* glsl */ `
  uniform float uTime; uniform vec3 uPointer; uniform float uPointerOn; uniform float uPixel;
  attribute float aSize; attribute float aStrength; attribute float aSeed;
  varying float vStrength; varying float vGlow; varying float vSeed; varying float vFacing;
  void main(){
    vec3 p = position;
    float d = distance(p, uPointer);
    float push = uPointerOn * smoothstep(0.35, 0.0, d);
    p += normalize(p) * (push * 0.12 + sin(uTime * 1.3 + aSeed * 6.28) * 0.006);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 n = normalize(normalMatrix * normalize(position));
    vFacing = clamp(dot(n, vec3(0.0,0.0,1.0)) * 0.8 + 0.4, 0.0, 1.0);
    vStrength = aStrength; vGlow = push; vSeed = aSeed;
    gl_PointSize = aSize * uPixel * (1.0 + push * 1.6) * (3.2 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const FRAG = /* glsl */ `
  uniform vec3 uColor; uniform float uTime;
  varying float vStrength; varying float vGlow; varying float vSeed; varying float vFacing;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    // small triangle sprite, like a prism shard
    float tri = max(abs(c.x) * 1.73 + c.y, -c.y * 2.0);
    if (tri > 0.5) discard;
    float edge = smoothstep(0.5, 0.3, tri);
    vec3 pink = vec3(1.0, 0.7, 0.85); vec3 amber = vec3(1.0, 0.82, 0.45); vec3 cyan = vec3(0.5, 0.9, 1.0);
    float h = fract(vSeed + uTime * 0.05);
    vec3 iri = mix(mix(pink, amber, smoothstep(0.0, 0.5, h)), cyan, smoothstep(0.5, 1.0, h));
    vec3 col = mix(iri * 0.55, uColor, vStrength);
    col += vGlow * vec3(1.0);
    float a = edge * vFacing * (0.25 + vStrength * 0.75 + vGlow);
    gl_FragColor = vec4(col, a);
  }`;

function Cloud({ layer, cursor, onPick, calmMotion }: Props) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ p: new THREE.Vector3(9, 9, 9), on: 0, target: 0 });

  const geom = useMemo(() => {
    const N = 22000;
    const pos: number[] = [], size: number[] = [], str: number[] = [], seed: number[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const lat = (Math.asin(y) * 180) / Math.PI;
      const lng = ((((i * golden * 180) / Math.PI) % 360) + 540) % 360 - 180;
      const s = sampleEarth(lat, lng);
      const strength = layer === "base" ? s.land : layerStrength(layer, s);
      // thin out the open sea so continents read clearly
      const keep = s.land > 0.5 ? 1 : 0.35 + strength * 0.65;
      if (((i * 9301 + 49297) % 233280) / 233280 > keep) continue;
      const v = toXYZ(lat, lng, s.land > 0.5 ? 1.0 : 0.985);
      pos.push(v.x, v.y, v.z);
      size.push(s.land > 0.5 ? 1.5 : 1.0);
      str.push(strength);
      seed.push(((i * 0.618) % 1 + 1) % 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aStrength", new THREE.Float32BufferAttribute(str, 1));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    return g;
  }, [layer]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector3(9, 9, 9) },
      uPointerOn: { value: 0 },
      uPixel: { value: 6 },
      uColor: { value: new THREE.Color(...LAYER_RGB[layer]) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  uniforms.uColor.value.setRGB(...LAYER_RGB[layer]);

  const cursorPos = useMemo(() => (cursor ? toXYZ(cursor.lat, cursor.lng, 1.02) : null), [cursor]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    uniforms.uTime.value += dt;
    uniforms.uPixel.value = state.gl.getPixelRatio() * 4;
    const pt = pointer.current;
    pt.on += (pt.target - pt.on) * (1 - Math.exp(-8 * dt));
    uniforms.uPointerOn.value = pt.on;
    uniforms.uPointer.value.copy(pt.p);
    if (group.current && !cursor && !calmMotion) group.current.rotation.y += dt * 0.08;
  });

  const local = (e: ThreeEvent<PointerEvent | MouseEvent>) => group.current!.worldToLocal(e.point.clone());

  return (
    <group ref={group}>
      <points geometry={geom}>
        <shaderMaterial
          ref={mat}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* invisible pick sphere */}
      <mesh
        onPointerMove={(e) => {
          pointer.current.p.copy(local(e));
          pointer.current.target = 1;
        }}
        onPointerOut={() => (pointer.current.target = 0)}
        onClick={(e) => {
          e.stopPropagation();
          const { lat, lng } = toLatLng(local(e));
          onPick(lat, lng);
        }}
      >
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {cursorPos && (
        <mesh position={cursorPos}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}

interface Props {
  layer: LayerId | "base";
  cursor: { lat: number; lng: number } | null;
  calmMotion: boolean;
  onPick: (lat: number, lng: number) => void;
}

export default function ParticleEarth(props: Props & { label: string }) {
  return (
    <div className="absolute inset-0" role="img" aria-label={props.label} data-scene-ready>
      <Canvas camera={{ position: [0, 0.4, 3.1], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Cloud {...props} />
        <OrbitControls enablePan={false} enableZoom minDistance={1.8} maxDistance={5} rotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
