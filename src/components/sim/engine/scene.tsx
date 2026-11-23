"use client";

import { Clone, Environment, useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { type Mission } from "@/sim/missions";
import type { DroneState } from "@/sim/physics";

/** Scenery: CC0 models and textures in public/sim (sources in public/sim/CREDITS.md), loaded with the engine. */
const MODEL = (name: string) => `/sim/models/${name}.glb`;
const TREES = ["tree_default", "tree_oak", "tree_pineDefaultA", "tree_pineRoundA", "tree_detailed", "tree_fat"];
const ROCKS = ["rock_largeA", "rock_tallA", "stone_largeA"];
const PLANTS = ["plant_bushDetailed", "plant_bushLarge", "grass_large", "flower_yellowA", "flower_redA", "log"];
const PROPS = ["pylon", "flagRed", "flagGreen", "flagCheckers", "bannerTowerRed", "bannerTowerGreen", "tent", "fence_simple"];
for (const name of [...TREES, ...ROCKS, ...PLANTS, ...PROPS]) useGLTF.preload(MODEL(name));

/** Centre of the flying area; scenery stays outside it. */
const FIELD = { x: 0, z: -8 };

export type CameraMode = "chase" | "fpv" | "ground";
export const CAMERA_LABELS: Record<CameraMode, string> = { chase: "Bám đuôi", fpv: "FPV", ground: "Mặt đất" };
/** Where the pilot stands for the line-of-sight view: just behind the take-off pad. */
const PILOT = new THREE.Vector3(0, 1.7, 6);
const FPV_UPTILT = 0.15;

/** Small deterministic PRNG so the scenery is the same on every visit. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function Prop({ name, position, scale = 3, rotation = 0 }: { name: string; position: [number, number, number]; scale?: number; rotation?: number }) {
  const { scene } = useGLTF(MODEL(name));
  return <Clone object={scene} position={position} scale={scale} rotation={[0, rotation, 0]} />;
}

type Placement = { name: string; position: [number, number, number]; scale: number; rotation: number };

function scatter(seed: number, count: number, names: string[], minR: number, maxR: number, minScale: number, maxScale: number): Placement[] {
  const rand = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rand() * 0.4;
    const r = minR + rand() * (maxR - minR);
    return {
      name: names[Math.floor(rand() * names.length)],
      position: [FIELD.x + Math.cos(a) * r, 0, FIELD.z + Math.sin(a) * r],
      scale: minScale + rand() * (maxScale - minScale),
      rotation: rand() * Math.PI * 2,
    };
  });
}

function Scenery({ lowQuality }: { lowQuality: boolean }) {
  const trees = useMemo(() => scatter(7, 40, TREES, 26, 38, 2.6, 3.8), []);
  const rocks = useMemo(() => scatter(11, 14, ROCKS, 16, 24, 1.5, 3), []);
  const plants = useMemo(() => scatter(23, 48, PLANTS, 15, 25, 2, 3.2), []);
  return (
    <>
      {[...trees, ...rocks, ...(lowQuality ? [] : plants)].map((p, i) => <Prop key={i} {...p} />)}
      {/* Pilot area behind the take-off pad: a tent and a fence line. */}
      <Prop name="tent" position={[-6, 0, 5]} rotation={0.3} />
      {Array.from({ length: 8 }, (_, i) => <Prop key={i} name="fence_simple" position={[-12 + i * 3 + 1.5, 0, 9]} />)}
    </>
  );
}

/** Lesson-specific props; rings, gates and pads stay in code because scoring depends on them. */
function MissionProps({ mission }: { mission: Mission }) {
  if (mission.id === "cat-canh") {
    return (
      <>
        {/* Height pole beside the pad: the yellow band is the 1.5–2.5 m target. */}
        <mesh position={[1.6, 2, -0.6]}>
          <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[1.6, 2, -0.6]}>
          <cylinderGeometry args={[0.07, 0.07, 1, 12]} />
          <meshStandardMaterial color="#FFC531" emissive="#FFC531" emissiveIntensity={0.3} />
        </mesh>
        <Prop name="flagRed" position={[-1.8, 0, -0.6]} />
      </>
    );
  }
  if (mission.id === "ha-canh" && mission.pad) {
    const { x, z, radius } = mission.pad;
    const d = radius + 0.4;
    return (
      <>
        {[[d, d], [-d, d], [d, -d], [-d, -d]].map(([dx, dz]) => <Prop key={`${dx}${dz}`} name="pylon" position={[x + dx, 0, z + dz]} scale={4} />)}
      </>
    );
  }
  if (mission.id === "vong") {
    return (
      <>
        <Prop name="flagGreen" position={[1.4, 0, 0.4]} />
        <Prop name="flagCheckers" position={[-4.8, 0, -5]} />
      </>
    );
  }
  if (mission.id === "so-8") {
    return (
      <>
        {mission.posts?.map((p, i) => <Prop key={i} name={i ? "bannerTowerGreen" : "bannerTowerRed"} position={[p.x, 0, p.z]} scale={4} />)}
        {mission.gates?.map((g, i) => <Prop key={i} name="pylon" position={[g.x, 0, g.z]} scale={4} />)}
      </>
    );
  }
  return null;
}

const tile = (tex: THREE.Texture) => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(40, 40);
};

function GrassGround() {
  const map = useTexture("/sim/env/grass/color.jpg", (tex) => {
    tile(tex);
    tex.colorSpace = THREE.SRGBColorSpace;
  });
  const [normalMap, roughnessMap] = useTexture(["/sim/env/grass/normal.jpg", "/sim/env/grass/roughness.jpg"], (loaded) => loaded.forEach(tile));
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial map={map} normalMap={normalMap} roughnessMap={roughnessMap} color="#d9ecc8" />
    </mesh>
  );
}

function PlainGround() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} />
      <meshStandardMaterial color="#a9d18e" />
    </mesh>
  );
}


/** The drone: a body, four arms and spinning rotor discs, built from primitives (no third-party model). */
function DroneModel({ rotorSpeed }: { rotorSpeed: MutableRefObject<number> }) {
  const rotors = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    rotors.current?.children.forEach((r, i) => (r.rotation.y += (i % 2 ? 1 : -1) * rotorSpeed.current * delta));
  });
  const arms = [
    [0.22, 0.22],
    [-0.22, 0.22],
    [0.22, -0.22],
    [-0.22, -0.22],
  ] as const;
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[0.18, 0.07, 0.24]} />
        <meshStandardMaterial color="#0F2742" />
      </mesh>
      <mesh position={[0, 0.02, -0.13]}>
        <boxGeometry args={[0.06, 0.03, 0.02]} />
        <meshStandardMaterial color="#13B8A6" emissive="#13B8A6" emissiveIntensity={0.6} />
      </mesh>
      {arms.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x / 2, 0, z / 2]} rotation={[0, Math.atan2(x, z), 0]}>
          <boxGeometry args={[0.03, 0.02, 0.32]} />
          <meshStandardMaterial color="#4A6078" />
        </mesh>
      ))}
      <group ref={rotors}>
        {arms.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.04, z]}>
            <cylinderGeometry args={[0.11, 0.11, 0.01, 20]} />
            <meshStandardMaterial color={z < 0 ? "#0B6FE0" : "#FFC531"} transparent opacity={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Field({ mission, nextGate, lowQuality }: { mission: Mission; nextGate: number; lowQuality: boolean }) {
  return (
    <>
      {lowQuality ? <PlainGround /> : <Suspense fallback={<PlainGround />}><GrassGround /></Suspense>}
      {/* Take-off pad */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {mission.pad ? (
        <mesh position={[mission.pad.x, 0.03, mission.pad.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0, mission.pad.radius, 40]} />
          <meshStandardMaterial color="#FFC531" />
        </mesh>
      ) : null}
      {mission.gates?.map((g, i) => {
        const prev = mission.gates![i - 1] ?? { x: 0, y: 2, z: 0 };
        const facing = Math.atan2(g.x - prev.x, g.z - prev.z);
        const isNext = i === nextGate;
        const done = i < nextGate;
        return (
          <mesh key={i} position={[g.x, g.y, g.z]} rotation={[0, facing, 0]}>
            <torusGeometry args={[g.radius, 0.08, 10, 40]} />
            <meshStandardMaterial color={done ? "#13B8A6" : isNext ? "#FFC531" : "#0B6FE0"} emissive={isNext ? "#FFC531" : "#000000"} emissiveIntensity={isNext ? 0.4 : 0} transparent opacity={done ? 0.35 : 1} />
          </mesh>
        );
      })}
      <Suspense fallback={null}>
        <MissionProps mission={mission} />
        <Scenery lowQuality={lowQuality} />
      </Suspense>
    </>
  );
}

/**
 * Runs the frame loop: `tick(delta)` advances physics/mission outside React state,
 * then the drone mesh and chase camera follow the state.
 */
export function SimScene({ drone, mission, nextGate, tick, lowQuality, rotorSpeed, camera: view }: {
  drone: MutableRefObject<DroneState>;
  mission: Mission;
  nextGate: number;
  tick(delta: number): void;
  lowQuality: boolean;
  rotorSpeed: MutableRefObject<number>;
  camera: CameraMode;
}) {
  const body = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const euler = useMemo(() => new THREE.Euler(0, 0, 0, "YXZ"), []);

  useFrame((_, delta) => {
    tick(delta);
    const s = drone.current;
    if (body.current) {
      body.current.position.set(s.position.x, s.position.y + 0.05, s.position.z);
      euler.set(-s.attitude.pitch, s.attitude.yaw, -s.attitude.roll);
      body.current.rotation.copy(euler);
    }
    if (body.current) body.current.visible = view !== "fpv";
    if (view === "fpv") {
      // Camera on the drone, tilted up a little like a real FPV camera.
      camera.position.set(s.position.x, s.position.y + 0.12, s.position.z);
      camera.rotation.copy(euler);
      camera.rotateX(FPV_UPTILT);
    } else if (view === "ground") {
      // Line of sight: the pilot stands behind the pad and turns to watch the drone.
      camera.position.copy(PILOT);
      camera.lookAt(s.position.x, s.position.y, s.position.z);
    } else {
      // Chase camera behind and above the drone, following its heading.
      const back = 4;
      target.set(s.position.x + Math.sin(s.attitude.yaw) * back, Math.max(1.2, s.position.y + 1.6), s.position.z + Math.cos(s.attitude.yaw) * back);
      camera.position.lerp(target, Math.min(1, delta * 4));
      camera.lookAt(s.position.x, s.position.y + 0.3, s.position.z);
    }
  });

  return (
    <>
      <color attach="background" args={["#EAF4FF"]} />
      <hemisphereLight args={["#ffffff", "#8fb98a", 0.8]} />
      {/* The sky photo lights the scene; the backdrop stays a flat colour to match the low-poly style. */}
      <Suspense fallback={null}>
        <Environment files="/sim/env/sky_noon_grass_1k.hdr" environmentIntensity={0.6} />
      </Suspense>
      <directionalLight position={[10, 20, 8]} intensity={1.1} />
      <fog attach="fog" args={["#EAF4FF", 35, 80]} />
      <Field mission={mission} nextGate={nextGate} lowQuality={lowQuality} />
      <group ref={body}><DroneModel rotorSpeed={rotorSpeed} /></group>
    </>
  );
}
