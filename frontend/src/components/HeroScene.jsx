import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef } from "react";

function EnergyMeter({ dayMode }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const coreRef = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.24;
      groupRef.current.position.y = Math.sin(time * 1.4) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = time * 0.85;
      ringRef.current.rotation.z = time * 0.45;
    }
    if (coreRef.current) {
      const scale = 1 + Math.sin(time * 2.4) * 0.06;
      coreRef.current.scale.setScalar(scale);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.35} floatIntensity={0.5}>
      <group ref={groupRef}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.68, 0.68, 3.3, 48, 1, true]} />
          <meshStandardMaterial
            color={dayMode ? "#164e63" : "#143042"}
            emissive={dayMode ? "#38bdf8" : "#0bb8a7"}
            emissiveIntensity={0.45}
            transparent
            opacity={0.36}
            roughness={0.15}
            metalness={0.55}
          />
        </mesh>
        <mesh ref={coreRef} position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 2.45, 32]} />
          <meshStandardMaterial
            color={dayMode ? "#7dd3fc" : "#00f5c5"}
            emissive={dayMode ? "#7dd3fc" : "#00f5c5"}
            emissiveIntensity={1.8}
          />
        </mesh>
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.05, 32, 140]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.6} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.94, 0.04, 24, 100]} />
          <meshStandardMaterial color="#d9ff5a" emissive="#d9ff5a" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </Float>
  );
}

function Skyline({ dayMode }) {
  const groupRef = useRef();
  const buildings = [
    [-4.2, -1.55, -1.6, 0.55, 1.8],
    [-3.4, -1.4, -0.6, 0.52, 2.3],
    [-2.4, -1.3, -1.9, 0.62, 2.8],
    [-1.4, -1.45, -0.7, 0.48, 1.95],
    [1.6, -1.4, -0.8, 0.58, 2.1],
    [2.4, -1.35, -1.8, 0.55, 2.7],
    [3.4, -1.5, -0.9, 0.66, 2.4],
    [4.2, -1.45, -1.7, 0.54, 1.9],
  ];

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(clock.getElapsedTime() * 0.18) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {buildings.map(([x, y, z, width, height], index) => (
        <mesh key={index} position={[x, y + height / 2, z]}>
          <boxGeometry args={[width, height, width]} />
          <meshStandardMaterial
            color={dayMode ? "#163248" : "#091321"}
            emissive={index % 2 === 0 ? "#0ea5e9" : "#00f5c5"}
            emissiveIntensity={dayMode ? 0.2 : 0.35}
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function GroundHalo({ dayMode }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
      <circleGeometry args={[6.5, 64]} />
      <meshStandardMaterial
        color={dayMode ? "#0c1b2c" : "#051018"}
        emissive={dayMode ? "#0e7490" : "#0f766e"}
        emissiveIntensity={0.28}
      />
    </mesh>
  );
}

function SkyOrb({ dayMode }) {
  return (
    <mesh position={[3.8, 2.4, -3]}>
      <sphereGeometry args={[0.5, 24, 24]} />
      <meshStandardMaterial
        color={dayMode ? "#fde68a" : "#e0f2fe"}
        emissive={dayMode ? "#facc15" : "#bae6fd"}
        emissiveIntensity={dayMode ? 1.35 : 0.85}
      />
    </mesh>
  );
}

export default function HeroScene({ dayMode = false }) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-[32px] border border-white/8 bg-slate-950/30">
      <Canvas camera={{ position: [0, 1.5, 8], fov: 40 }}>
        <color attach="background" args={[dayMode ? "#0c1728" : "#020617"]} />
        <fog attach="fog" args={[dayMode ? "#0c1728" : "#020617", 8, 15]} />
        <ambientLight intensity={dayMode ? 1.05 : 0.85} />
        <pointLight position={[0, 3.6, 2]} intensity={25} color={dayMode ? "#7dd3fc" : "#00f5c5"} />
        <pointLight position={[-4, 2.2, 3]} intensity={14} color="#38bdf8" />
        <pointLight position={[4, -1, 2]} intensity={10} color="#d9ff5a" />
        <Sparkles count={160} size={2.8} scale={[10, 4, 10]} color={dayMode ? "#dffcff" : "#7ef9ff"} />
        <SkyOrb dayMode={dayMode} />
        <EnergyMeter dayMode={dayMode} />
        <Skyline dayMode={dayMode} />
        <GroundHalo dayMode={dayMode} />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.55} />
      </Canvas>
    </div>
  );
}
