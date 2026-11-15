import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

const TEXTURE_PATH = "/textures/earth-night.jpg";
const ROTATION_SPEED = 0.02;
type Palette = { ocean: string; fallback: string; cyan: string; orbit: string; lights: string };
const atmoVert = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmoFrag = `
  varying vec3 vNormal;
  uniform vec3 rimColor;
  void main() {
    float facing = dot(vNormal, vec3(0.0, 0.0, 1.0));
    float i = pow(max(0.0, 0.72 - facing), 3.0);
    // Feather the silhouette so the atmosphere cannot become a flat outline.
    float feather = smoothstep(0.0, 0.55, abs(facing));
    gl_FragColor = vec4(rimColor, 1.0) * i * 2.2 * feather;
  }
`;
const innerFrag = `
  varying vec3 vNormal;
  uniform vec3 rimColor;
  void main() {
    float i = pow(1.0 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(rimColor, 1.0) * i * 0.35;
  }
`;

class TextureBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override componentDidCatch(error: Error) {
    console.error(`[SANSIGHT Earth] Failed to load ${TEXTURE_PATH}; showing dark blue sphere.`, error);
  }
  override render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function NightSurface({ palette }: { palette: Palette }) {
  const tex = useTexture(TEXTURE_PATH);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return <mesh>
    <sphereGeometry args={[2.003, 128, 128]} />
    <meshBasicMaterial map={tex} color={palette.lights} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
  </mesh>;
}

function DarkSurface({ palette }: { palette: Palette }) {
  return <mesh><sphereGeometry args={[2, 128, 128]} /><meshBasicMaterial color={palette.fallback} /></mesh>;
}

function ReadyFrame({ onReady }: { onReady: () => void }) {
  const drawn = useRef(false);
  useFrame(() => {
    if (!drawn.current) { drawn.current = true; onReady(); }
  });
  return null;
}

function Earth({ palette, reducedMotion, onReady }: { palette: Palette; reducedMotion: boolean; onReady: () => void }) {
  const earth = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (earth.current && !reducedMotion) earth.current.rotation.y += Math.min(d, 0.05) * ROTATION_SPEED;
  });
  return (
    <group>
      <group rotation={[0, 0, THREE.MathUtils.degToRad(23)]}>
        <group ref={earth} rotation={[0, -Math.PI * 2 / 3, 0]}>
          <mesh><sphereGeometry args={[2, 128, 128]} /><meshStandardMaterial color={palette.ocean} roughness={0.9} metalness={0} /></mesh>
          <TextureBoundary fallback={<><DarkSurface palette={palette} /><ReadyFrame onReady={onReady} /></>}>
            <Suspense fallback={<DarkSurface palette={palette} />}>
              <NightSurface palette={palette} /><ReadyFrame onReady={onReady} />
            </Suspense>
          </TextureBoundary>
        </group>
      </group>
      <mesh>
        <sphereGeometry args={[2.35, 128, 128]} />
        <shaderMaterial vertexShader={atmoVert} fragmentShader={atmoFrag} uniforms={{ rimColor: { value: new THREE.Color(palette.cyan) } }} side={THREE.BackSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.02, 128, 128]} />
        <shaderMaterial vertexShader={atmoVert} fragmentShader={innerFrag} uniforms={{ rimColor: { value: new THREE.Color(palette.cyan) } }} side={THREE.FrontSide} blending={THREE.AdditiveBlending} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[THREE.MathUtils.degToRad(65), THREE.MathUtils.degToRad(30), THREE.MathUtils.degToRad(30)]}>
          <torusGeometry args={[3.2, 0.003, 8, 256]} />
          <meshBasicMaterial color={palette.orbit} transparent opacity={0.3} />
        </mesh>
    </group>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export function FallbackGlobe() {
  return <div className="relative h-full w-full"><div className="earth-fallback absolute inset-[20%] rounded-full" /></div>;
}

export default function Globe() {
  const [ok, setOk] = useState(false);
  const [ready, setReady] = useState(false);
  const [palette, setPalette] = useState<Palette | null>(null);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setOk(hasWebGL());
    const css = getComputedStyle(document.documentElement);
    const read = (name: string) => css.getPropertyValue(`--earth-${name}`).trim();
    setPalette({ ocean: read("ocean"), fallback: read("fallback"), cyan: read("cyan"), orbit: read("orbit"), lights: read("lights") });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(motion.matches);
    const syncVisible = () => setVisible(!document.hidden);
    syncMotion(); syncVisible();
    motion.addEventListener("change", syncMotion);
    document.addEventListener("visibilitychange", syncVisible);
    return () => { motion.removeEventListener("change", syncMotion); document.removeEventListener("visibilitychange", syncVisible); };
  }, []);
  if (!ok || !palette) return <FallbackGlobe />;
  return (
    <div className="h-full w-full" data-scene-ready={ready || undefined}>
      <Canvas camera={{ position: [0, 0, 8.8], fov: 42 }} dpr={[1, 1.5]} frameloop={!visible ? "never" : reducedMotion ? "demand" : "always"} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 2, 4]} intensity={1.6} color={palette.orbit} />
        <Earth palette={palette} reducedMotion={reducedMotion} onReady={() => setReady(true)} />
      </Canvas>
    </div>
  );
}
