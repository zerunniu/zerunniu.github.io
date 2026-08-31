import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Mesh, Points } from "three";

type OrbState = "idle" | "listening" | "thinking" | "speaking" | "error";

const stateColors: Record<OrbState, string> = {
  idle: "#60e9ff",
  listening: "#69efc5",
  thinking: "#a58bff",
  speaking: "#ff9f5a",
  error: "#ff6c7c",
};

function Orb({ state }: { state: OrbState }) {
  const core = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const particles = useRef<Points>(null);
  const points = useMemo(() => {
    const positions = new Float32Array(360 * 3);
    for (let i = 0; i < 360; i += 1) {
      const radius = 1.45 + Math.random() * 0.45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return positions;
  }, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (core.current) {
      const pulse =
        state === "speaking" ? 0.08 : state === "thinking" ? 0.045 : 0.025;
      const scale =
        1 + Math.sin(time * (state === "speaking" ? 7 : 2.2)) * pulse;
      core.current.scale.setScalar(scale);
      core.current.rotation.y = time * 0.16;
    }
    if (ring.current) {
      ring.current.rotation.x = time * 0.18;
      ring.current.rotation.z = -time * 0.24;
    }
    if (particles.current) particles.current.rotation.y = time * 0.04;
  });

  return (
    <group position={[0, 0.25, 0]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.12, 5]} />
        <meshPhysicalMaterial
          color={stateColors[state]}
          emissive={stateColors[state]}
          emissiveIntensity={0.6}
          roughness={0.18}
          metalness={0.2}
          transmission={0.28}
          thickness={0.7}
          wireframe={state === "thinking"}
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[1.52, 0.012, 8, 180]} />
        <meshBasicMaterial
          color={stateColors[state]}
          transparent
          opacity={0.65}
        />
      </mesh>
      <points ref={particles}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[points, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={stateColors[state]}
          size={0.018}
          transparent
          opacity={0.72}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

function Workstation({
  position,
  color,
  delay,
}: {
  position: [number, number, number];
  color: string;
  delay: number;
}) {
  return (
    <Float
      speed={1.2}
      rotationIntensity={0.08}
      floatIntensity={0.16}
      floatingRange={[-0.05, 0.08]}
    >
      <group position={position} rotation={[-0.18, delay, 0]}>
        <mesh>
          <boxGeometry args={[1.6, 0.9, 0.035]} />
          <meshPhysicalMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.16}
            transparent
            opacity={0.22}
            roughness={0.16}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[1.45, 0.72, 10, 10]} />
          <meshBasicMaterial
            color={color}
            wireframe
            transparent
            opacity={0.42}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function LabCanvas({ state }: { state: OrbState }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.35, 7], fov: 44 }}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: true }}
    >
      <ambientLight intensity={0.45} />
      <pointLight
        position={[0, 2.5, 3]}
        color="#60e9ff"
        intensity={18}
        distance={12}
      />
      <pointLight
        position={[-5, -2, 2]}
        color="#7189ff"
        intensity={10}
        distance={10}
      />
      <Orb state={state} />
      <Workstation
        position={[-3.15, 1.5, -0.55]}
        color="#60e9ff"
        delay={0.08}
      />
      <Workstation
        position={[3.15, 1.5, -0.55]}
        color="#7189ff"
        delay={-0.08}
      />
      <Workstation
        position={[-3.15, -1.25, -0.55]}
        color="#ff9f5a"
        delay={-0.06}
      />
      <Workstation
        position={[3.15, -1.25, -0.55]}
        color="#a58bff"
        delay={0.06}
      />
      <Sparkles
        count={70}
        size={1.2}
        scale={[10, 5, 3]}
        speed={0.2}
        color="#9af3ff"
        opacity={0.28}
      />
    </Canvas>
  );
}
