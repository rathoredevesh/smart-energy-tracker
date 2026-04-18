import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles } from "@react-three/drei";
import { useRef } from "react";

function EcoTree({ scaleFactor }) {
  const treeRef = useRef();

  useFrame(({ clock }) => {
    if (!treeRef.current) {
      return;
    }
    treeRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.32) * 0.12;
    treeRef.current.scale.y = scaleFactor + Math.sin(clock.getElapsedTime() * 1.2) * 0.03;
  });

  return (
    <group ref={treeRef} position={[-2.3, -0.1, 0]}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 1.6, 18]} />
        <meshStandardMaterial color="#4b2e1f" />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.92, 28, 28]} />
        <meshStandardMaterial color="#34d399" emissive="#00f5c5" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.55, 1.7, 0.15]}>
        <sphereGeometry args={[0.55, 22, 22]} />
        <meshStandardMaterial color="#16a34a" emissive="#22c55e" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0.55, 1.72, -0.12]}>
        <sphereGeometry args={[0.58, 22, 22]} />
        <meshStandardMaterial color="#22c55e" emissive="#34d399" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function Globe({ usageRatio }) {
  const globeRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2;
      ringRef.current.rotation.z = clock.getElapsedTime() * 0.42;
    }
  });

  return (
    <group position={[1.9, 1.2, 0]}>
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.25, 48, 48]} />
        <meshStandardMaterial color="#0b4d6b" emissive="#38bdf8" emissiveIntensity={0.55} metalness={0.2} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[1.8, 0.03, 20, 120]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#7dd3fc" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[0.95, 0.25 + usageRatio * 0.5, 0.62]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[-0.52, -0.35, 1.02]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <meshStandardMaterial color="#00f5c5" emissive="#00f5c5" emissiveIntensity={1.6} />
      </mesh>
    </group>
  );
}

export default function EcoScene({ ecoScore, usageRatio }) {
  const treeScale = Math.max(0.72, Math.min(1.24, ecoScore / 82));

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-[32px] border border-white/8 bg-slate-950/35">
      <Canvas camera={{ position: [0, 2.8, 8], fov: 44 }}>
        <ambientLight intensity={0.95} />
        <pointLight position={[-2, 3.5, 3]} intensity={16} color="#00f5c5" />
        <pointLight position={[3.2, 2.6, 2.4]} intensity={14} color="#38bdf8" />
        <Sparkles count={90} size={2.5} scale={[10, 5, 10]} color="#b5fff8" />
        <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.22}>
          <EcoTree scaleFactor={treeScale} />
          <Globe usageRatio={usageRatio} />
        </Float>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
          <circleGeometry args={[6.2, 64]} />
          <meshStandardMaterial color="#06111b" emissive="#134e4a" emissiveIntensity={0.3} />
        </mesh>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.25} />
      </Canvas>
    </div>
  );
}

