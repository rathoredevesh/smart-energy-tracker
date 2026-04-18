import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Sparkles, Text } from "@react-three/drei";
import { useRef } from "react";

function Bars({ dataset, period }) {
  const groupRef = useRef();

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = clock.getElapsedTime() * 0.22;
  });

  const maxValue = Math.max(...dataset.map((item) => item[period]), 1);

  return (
    <group ref={groupRef}>
      {dataset.map((item, index) => {
        const height = 0.6 + (item[period] / maxValue) * 3.2;
        const x = (index - dataset.length / 2) * 1.15 + 0.6;
        const color = index % 2 === 0 ? "#00f5c5" : "#38bdf8";
        return (
          <group key={item.appliance} position={[x, 0, 0]}>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[0.62, height, 0.62]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.05} />
            </mesh>
            <Text position={[0, -0.45, 0]} fontSize={0.14} maxWidth={0.9} anchorX="center" color="#d8f5ff">
              {item.appliance.replace(" ", "\n")}
            </Text>
            <Text position={[0, height + 0.28, 0]} fontSize={0.13} anchorX="center" color="#ffffff">
              {item[period].toFixed(1)}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

export default function AnalyticsScene({ dataset, period }) {
  return (
    <div className="h-[440px] w-full overflow-hidden rounded-[32px] border border-white/8 bg-slate-950/35">
      <Canvas camera={{ position: [0, 3.5, 9], fov: 42 }}>
        <ambientLight intensity={0.95} />
        <pointLight position={[0, 4.8, 4]} intensity={18} color="#00f5c5" />
        <pointLight position={[4, 1.8, 2]} intensity={12} color="#38bdf8" />
        <Sparkles count={90} size={2.8} scale={[10, 5, 10]} color="#90fdf0" />
        <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.32}>
          <Bars dataset={dataset} period={period} />
        </Float>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <circleGeometry args={[6, 64]} />
          <meshStandardMaterial color="#051018" emissive="#0f766e" emissiveIntensity={0.24} />
        </mesh>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.45} />
      </Canvas>
    </div>
  );
}

