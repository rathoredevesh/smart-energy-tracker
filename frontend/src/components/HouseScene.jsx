import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Text, Line } from "@react-three/drei";
import { useRef, useState } from "react";

function FlowPulse({ start, end, color, burst }) {
  const pulseRefs = [useRef(), useRef(), useRef()];
  const startPoint = new THREE.Vector3(...start);
  const endPoint = new THREE.Vector3(...end);

  useFrame(({ clock }) => {
    pulseRefs.forEach((pulseRef, index) => {
      if (!pulseRef.current) {
        return;
      }
      const speed = burst ? 0.52 : 0.28;
      const travel = (clock.getElapsedTime() * speed + index * 0.24) % 1;
      pulseRef.current.position.lerpVectors(startPoint, endPoint, travel);
    });
  });

  return (
    <>
      <Line points={[start, end]} color={color} lineWidth={1.2} transparent opacity={burst ? 0.65 : 0.35} />
      {pulseRefs.map((pulseRef, index) => (
        <mesh key={index} ref={pulseRef}>
          <sphereGeometry args={[0.08, 18, 18]} />
          <meshStandardMaterial color="#7ef9ff" emissive={color} emissiveIntensity={burst ? 3 : 2} />
        </mesh>
      ))}
    </>
  );
}

function RoomMesh({ room, isSelected, onSelect, wireframeMode }) {
  const roomRef = useRef();

  useFrame(({ clock }) => {
    if (!roomRef.current) {
      return;
    }
    roomRef.current.position.y = 0.55 + Math.sin(clock.getElapsedTime() * 1.1 + room.position[0]) * 0.03;
    roomRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.25 + room.position[2]) * 0.08;
  });

  return (
    <group position={room.position}>
      <mesh
        ref={roomRef}
        onClick={() => onSelect(room)}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default";
        }}
      >
        <boxGeometry args={[1.7, 1.1, 1.45]} />
        <meshStandardMaterial
          color={room.color}
          emissive={room.color}
          emissiveIntensity={isSelected ? 1.3 : room.brightness}
          transparent
          opacity={wireframeMode ? 0.45 : 0.88}
          roughness={0.18}
          metalness={0.45}
          wireframe={wireframeMode}
        />
      </mesh>
      <Text
        position={[0, -0.95, 0]}
        fontSize={0.2}
        color={isSelected ? "#ffffff" : "#b8d6df"}
        anchorX="center"
        anchorY="middle"
      >
        {room.label}
      </Text>
    </group>
  );
}

export default function HouseScene({ rooms, selectedRoomId, onSelectRoom, wireframeMode = false }) {
  const [meterBurst, setMeterBurst] = useState(false);

  function triggerBurst() {
    setMeterBurst(true);
    window.setTimeout(() => setMeterBurst(false), 2200);
  }

  return (
    <div className="h-[540px] w-full overflow-hidden rounded-[32px] border border-white/8 bg-slate-950/35">
      <Canvas camera={{ position: [0, 3.1, 8], fov: 38 }}>
        <ambientLight intensity={0.85} />
        <pointLight position={[0, 4, 4]} intensity={18} color="#00f5c5" />
        <pointLight position={[3, 2, 3]} intensity={11} color="#38bdf8" />
        <pointLight position={[-4, 2, -3]} intensity={10} color="#facc15" />
        <Sparkles count={120} size={2.4} scale={[9, 4, 9]} color="#00f5c5" />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
          <planeGeometry args={[9, 9]} />
          <meshStandardMaterial color="#06111b" emissive="#0f172a" emissiveIntensity={0.2} />
        </mesh>

        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[4.7, 1.7, 4.2]} />
            <meshStandardMaterial color="#0b1626" transparent opacity={wireframeMode ? 0.03 : 0.16} wireframe={wireframeMode} />
          </mesh>
        </group>

        <group position={[0, 0.55, 0]}>
          <mesh
            position={[0, 0.15, -3.25]}
            onClick={triggerBurst}
            onPointerOver={(event) => {
              event.stopPropagation();
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              document.body.style.cursor = "default";
            }}
          >
            <boxGeometry args={[0.75, 1.1, 0.75]} />
            <meshStandardMaterial
              color="#0e7490"
              emissive="#00f5c5"
              emissiveIntensity={meterBurst ? 2.6 : 1.2}
              wireframe={wireframeMode}
            />
          </mesh>
          <Text position={[0, 1.15, -3.25]} fontSize={0.18} color="#dffcf6">
            Meter
          </Text>
        </group>

        {rooms.map((room) => (
          <RoomMesh
            key={room.id}
            room={room}
            isSelected={room.id === selectedRoomId}
            onSelect={onSelectRoom}
            wireframeMode={wireframeMode}
          />
        ))}

        {rooms.map((room) => (
          <FlowPulse
            key={room.id}
            start={[0, 0.55, -3.25]}
            end={room.position}
            color={room.color}
            burst={meterBurst}
          />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3.2}
          maxPolarAngle={Math.PI / 2.15}
        />
      </Canvas>
    </div>
  );
}
