"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { type MutableRefObject, useMemo, useRef } from "react";
import * as THREE from "three";
import { type Mission } from "@/sim/missions";
import type { DroneState } from "@/sim/physics";


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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#cfe7c4" />
      </mesh>
      {!lowQuality ? <gridHelper args={[80, 40, "#9cc59a", "#b6d8ad"]} position={[0, 0.01, 0]} /> : null}
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
      {mission.posts?.map((p) => (
        <mesh key={`${p.x}${p.z}`} position={[p.x, 2.5, p.z]}>
          <cylinderGeometry args={[0.25, 0.25, 5, 16]} />
          <meshStandardMaterial color="#0F2742" />
        </mesh>
      ))}
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
      {/* Trees around the field, for a sense of speed and height */}
      {useMemo(
        () =>
          Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const r = 30 + (i % 3) * 3;
            return (
              <group key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
                <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[0.15, 0.2, 1.6, 8]} /><meshStandardMaterial color="#8a6a4a" /></mesh>
                <mesh position={[0, 2.2, 0]}><coneGeometry args={[1, 2.4, 10]} /><meshStandardMaterial color="#3f8f5a" /></mesh>
              </group>
            );
          }),
        [],
      )}
    </>
  );
}

/**
 * Runs the frame loop: `tick(delta)` advances physics/mission outside React state,
 * then the drone mesh and chase camera follow the state.
 */
export function SimScene({ drone, mission, nextGate, tick, lowQuality, rotorSpeed }: {
  drone: MutableRefObject<DroneState>;
  mission: Mission;
  nextGate: number;
  tick(delta: number): void;
  lowQuality: boolean;
  rotorSpeed: MutableRefObject<number>;
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
    // Chase camera behind and above the drone, following its heading.
    const back = 4;
    target.set(s.position.x + Math.sin(s.attitude.yaw) * back, Math.max(1.2, s.position.y + 1.6), s.position.z + Math.cos(s.attitude.yaw) * back);
    camera.position.lerp(target, Math.min(1, delta * 4));
    camera.lookAt(s.position.x, s.position.y + 0.3, s.position.z);
  });

  return (
    <>
      <color attach="background" args={["#EAF4FF"]} />
      <hemisphereLight args={["#ffffff", "#8fb98a", 1.2]} />
      <directionalLight position={[10, 20, 8]} intensity={1.1} />
      <fog attach="fog" args={["#EAF4FF", 30, 70]} />
      <Field mission={mission} nextGate={nextGate} lowQuality={lowQuality} />
      <group ref={body}><DroneModel rotorSpeed={rotorSpeed} /></group>
    </>
  );
}
