import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Line, OrbitControls, Sparkles, Text } from "@react-three/drei";
import { useMemo, useRef } from "react";

const ROOM_LAYOUTS = {
  bedroom: {
    position: [-1.8, 0.08, 1.15],
    size: [2.3, 0.08, 2.1],
  },
  bathroom: {
    position: [-1.8, 0.08, -1.1],
    size: [2.3, 0.08, 1.75],
  },
  kitchen: {
    position: [1.45, 0.08, -1.05],
    size: [2.8, 0.08, 1.85],
  },
  living_room: {
    position: [1.45, 0.08, 1.1],
    size: [2.8, 0.08, 2.2],
  },
  livingroom: {
    position: [1.45, 0.08, 1.1],
    size: [2.8, 0.08, 2.2],
  },
};

function getRoomLayout(room, index) {
  const id = room.id?.toLowerCase?.() ?? "";
  const label = room.label?.toLowerCase?.().replace(/\s+/g, "_") ?? "";
  return (
    ROOM_LAYOUTS[id] ??
    ROOM_LAYOUTS[label] ?? {
      position: [index % 2 === 0 ? -1.4 : 1.4, 0.08, index < 2 ? 1.05 : -1.05],
      size: [2.25, 0.08, 1.9],
    }
  );
}

function pointerHandlers(onSelect, room) {
  return {
    onClick: () => onSelect(room),
    onPointerOver: (event) => {
      event.stopPropagation();
      document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      document.body.style.cursor = "default";
    },
  };
}

function EnergyTrail({ start, end, color }) {
  const dots = [useRef(), useRef(), useRef()];
  const startPoint = useMemo(() => new THREE.Vector3(...start), [start]);
  const endPoint = useMemo(() => new THREE.Vector3(...end), [end]);

  useFrame(({ clock }) => {
    dots.forEach((dotRef, index) => {
      if (!dotRef.current) {
        return;
      }
      const progress = (clock.getElapsedTime() * 0.22 + index * 0.28) % 1;
      dotRef.current.position.lerpVectors(startPoint, endPoint, progress);
    });
  });

  return (
    <>
      <Line
        points={[start, end]}
        color={color}
        lineWidth={1}
        transparent
        opacity={0.18}
      />
      {dots.map((dotRef, index) => (
        <mesh key={index} ref={dotRef}>
          <sphereGeometry args={[0.07, 18, 18]} />
          <meshStandardMaterial color="#e0fffa" emissive={color} emissiveIntensity={1.8} />
        </mesh>
      ))}
    </>
  );
}

function BedFurniture() {
  return (
    <group position={[-0.2, 0.16, 0.2]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.15, 0.18, 1.55]} />
        <meshStandardMaterial color="#d9d4ce" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.13, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.12, 1.2]} />
        <meshStandardMaterial color="#7fc8ff" roughness={0.7} />
      </mesh>
      <mesh position={[-0.5, 0.28, -0.57]} castShadow>
        <boxGeometry args={[0.26, 0.09, 0.32]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.8} />
      </mesh>
      <mesh position={[0.5, 0.28, -0.57]} castShadow>
        <boxGeometry args={[0.26, 0.09, 0.32]} />
        <meshStandardMaterial color="#f4f7fb" roughness={0.8} />
      </mesh>
      <mesh position={[0.92, 0.18, -0.45]} castShadow>
        <boxGeometry args={[0.24, 0.26, 0.24]} />
        <meshStandardMaterial color="#b9855a" roughness={0.88} />
      </mesh>
    </group>
  );
}

function BathroomFurniture() {
  return (
    <group position={[-0.15, 0.15, -0.05]}>
      <mesh position={[-0.35, 0, 0.25]} castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.28, 0.62]} />
        <meshStandardMaterial color="#f8fbff" roughness={0.32} />
      </mesh>
      <mesh position={[0.65, 0.02, 0.28]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 24]} />
        <meshStandardMaterial color="#f5f7fb" roughness={0.35} />
      </mesh>
      <mesh position={[0.75, 0.35, -0.32]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.18, 0.24]} />
        <meshStandardMaterial color="#d7e5ef" roughness={0.45} />
      </mesh>
    </group>
  );
}

function KitchenFurniture() {
  return (
    <group position={[0, 0.12, 0]}>
      <mesh position={[-0.82, 0.18, -0.58]} castShadow receiveShadow>
        <boxGeometry args={[1.12, 0.36, 0.52]} />
        <meshStandardMaterial color="#c9d6e0" roughness={0.72} />
      </mesh>
      <mesh position={[0.7, 0.18, -0.58]} castShadow receiveShadow>
        <boxGeometry args={[1.42, 0.36, 0.52]} />
        <meshStandardMaterial color="#d8dde5" roughness={0.74} />
      </mesh>
      <mesh position={[0.06, 0.27, 0.42]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.54, 0.55]} />
        <meshStandardMaterial color="#faf7f1" roughness={0.44} />
      </mesh>
      <mesh position={[1.14, 0.5, -0.6]} castShadow>
        <boxGeometry args={[0.34, 0.76, 0.48]} />
        <meshStandardMaterial color="#f1f5f8" roughness={0.3} metalness={0.08} />
      </mesh>
    </group>
  );
}

function LivingFurniture() {
  return (
    <group position={[0.1, 0.12, 0]}>
      <mesh position={[-0.7, 0.22, 0.12]} castShadow receiveShadow>
        <boxGeometry args={[1.45, 0.45, 0.72]} />
        <meshStandardMaterial color="#c7b39a" roughness={0.86} />
      </mesh>
      <mesh position={[0.38, 0.12, 0.72]} castShadow receiveShadow>
        <boxGeometry args={[0.86, 0.2, 0.48]} />
        <meshStandardMaterial color="#d9dfeb" roughness={0.54} />
      </mesh>
      <mesh position={[1.02, 0.36, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[0.28, 0.72, 1.15]} />
        <meshStandardMaterial color="#1f2937" roughness={0.42} />
      </mesh>
      <mesh position={[1.08, 0.48, -0.52]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 0.54, 0.88]} />
        <meshStandardMaterial color="#101418" emissive="#1f2937" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[-1.05, 0.5, -0.52]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 1.0, 18]} />
        <meshStandardMaterial color="#f2eadf" roughness={0.72} />
      </mesh>
    </group>
  );
}

function RoomInterior({ room, layout, isSelected, onSelect }) {
  const glowRef = useRef();
  const handlers = pointerHandlers(onSelect, room);

  useFrame(({ clock }) => {
    if (!glowRef.current) {
      return;
    }
    const pulse = 0.42 + Math.sin(clock.getElapsedTime() * 1.4 + layout.position[0]) * 0.08;
    glowRef.current.material.emissiveIntensity = isSelected ? 1.18 : Math.max(room.brightness + pulse, 0.42);
  });

  let furniture = null;
  if (room.id === "bedroom") {
    furniture = <BedFurniture />;
  } else if (room.id === "bathroom") {
    furniture = <BathroomFurniture />;
  } else if (room.id === "kitchen") {
    furniture = <KitchenFurniture />;
  } else {
    furniture = <LivingFurniture />;
  }

  return (
    <group position={layout.position}>
      <mesh receiveShadow {...handlers}>
        <boxGeometry args={layout.size} />
        <meshStandardMaterial color="#f5f6f2" roughness={0.96} />
      </mesh>

      <mesh ref={glowRef} position={[0, 0.05, 0]} receiveShadow {...handlers}>
        <boxGeometry args={[layout.size[0] * 0.94, 0.03, layout.size[2] * 0.94]} />
        <meshStandardMaterial
          color={room.color}
          emissive={room.color}
          emissiveIntensity={isSelected ? 1.18 : Math.max(room.brightness + 0.36, 0.52)}
          transparent
          opacity={0.56}
          roughness={0.45}
        />
      </mesh>

      <group position={[0, 0.02, 0]} {...handlers}>
        {furniture}
      </group>

      {isSelected ? (
        <Text
          position={[0, 1.02, 0]}
          fontSize={0.2}
          color="#1f2937"
          anchorX="center"
          anchorY="middle"
        >
          {room.label}
        </Text>
      ) : null}
    </group>
  );
}

function HouseShell() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10.5, 9]} />
        <meshStandardMaterial color="#8ecf95" roughness={0.98} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[2.65, 0.01, 2.45]}>
        <planeGeometry args={[2.55, 2.25]} />
        <meshStandardMaterial color="#d8d9dc" roughness={0.92} />
      </mesh>

      <mesh position={[0, 1.3, -3]} castShadow receiveShadow>
        <boxGeometry args={[7.2, 2.6, 0.14]} />
        <meshStandardMaterial color="#f2ece3" roughness={0.86} />
      </mesh>
      <mesh position={[-3.55, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 2.6, 6]} />
        <meshStandardMaterial color="#f2ece3" roughness={0.86} />
      </mesh>
      <mesh position={[3.55, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.14, 2.6, 6]} />
        <meshStandardMaterial color="#f2ece3" roughness={0.86} />
      </mesh>

      <mesh position={[-2.35, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[2.3, 2.6, 0.14]} />
        <meshStandardMaterial color="#f2ece3" roughness={0.86} />
      </mesh>
      <mesh position={[1.85, 1.3, 3]} castShadow receiveShadow>
        <boxGeometry args={[4.0, 2.6, 0.14]} />
        <meshStandardMaterial color="#f2ece3" roughness={0.86} />
      </mesh>

      <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.12, 2.6, 5.85]} />
        <meshStandardMaterial color="#ebe7de" roughness={0.86} />
      </mesh>
      <mesh position={[-1.8, 1.3, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 2.6, 0.12]} />
        <meshStandardMaterial color="#ebe7de" roughness={0.86} />
      </mesh>
      <mesh position={[1.85, 1.3, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[3.25, 2.6, 0.12]} />
        <meshStandardMaterial color="#ebe7de" roughness={0.86} />
      </mesh>

      <mesh position={[-0.55, 1.2, 3.04]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 2.4, 0.06]} />
        <meshStandardMaterial color="#9b6c43" roughness={0.82} />
      </mesh>

      <mesh position={[-2.35, 1.55, -3.02]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 1.1, 0.08]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.72} roughness={0.18} />
      </mesh>
      <mesh position={[2.05, 1.55, -3.02]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 1.1, 0.08]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.72} roughness={0.18} />
      </mesh>
      <mesh position={[3.57, 1.55, 1.45]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 1.15, 1.1]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.72} roughness={0.18} />
      </mesh>
      <mesh position={[-3.57, 1.55, 1.25]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 1.15, 1.05]} />
        <meshStandardMaterial color="#bfe3ff" transparent opacity={0.72} roughness={0.18} />
      </mesh>

      <mesh position={[0, 3.15, 0.15]} rotation={[0.48, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.55, 0.12, 3.3]} />
        <meshStandardMaterial color="#6e432e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.15, -0.15]} rotation={[-0.48, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.55, 0.12, 3.3]} />
        <meshStandardMaterial color="#7a4a34" roughness={0.8} />
      </mesh>

      <mesh position={[1.85, 3.45, -0.82]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 1.02, 0.48]} />
        <meshStandardMaterial color="#d4c8bf" roughness={0.78} />
      </mesh>
    </group>
  );
}

function ExteriorDetails() {
  return (
    <group>
      <mesh position={[-4.1, 0.68, 2.1]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.75, 0.28]} />
        <meshStandardMaterial color="#d8e6e1" roughness={0.62} />
      </mesh>
      <mesh position={[-4.1, 1.16, 2.1]} castShadow>
        <boxGeometry args={[0.34, 0.16, 0.22]} />
        <meshStandardMaterial color="#84f5d9" emissive="#38d9a9" emissiveIntensity={0.8} />
      </mesh>

      <mesh position={[-4.35, 1.0, -1.95]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 1.45, 18]} />
        <meshStandardMaterial color="#7c5a3a" roughness={0.92} />
      </mesh>
      <mesh position={[-4.35, 2.2, -1.95]} castShadow>
        <sphereGeometry args={[0.75, 22, 22]} />
        <meshStandardMaterial color="#4ca95d" roughness={0.94} />
      </mesh>
      <mesh position={[-4.9, 2.0, -1.7]} castShadow>
        <sphereGeometry args={[0.45, 18, 18]} />
        <meshStandardMaterial color="#66ba71" roughness={0.94} />
      </mesh>

      <mesh position={[-0.55, 0.05, 3.72]} receiveShadow>
        <boxGeometry args={[1.45, 0.08, 1.18]} />
        <meshStandardMaterial color="#efe8de" roughness={0.86} />
      </mesh>
    </group>
  );
}

function RealisticHouseModel({ rooms, selectedRoomId, onSelectRoom }) {
  const layouts = useMemo(
    () =>
      rooms.map((room, index) => ({
        room,
        layout: getRoomLayout(room, index),
      })),
    [rooms],
  );

  return (
    <>
      <color attach="background" args={["#d9efff"]} />
      <fog attach="fog" args={["#d9efff", 12, 24]} />
      <ambientLight intensity={1.08} />
      <hemisphereLight intensity={0.72} color="#ffffff" groundColor="#8ab280" />
      <directionalLight
        castShadow
        position={[5.5, 8.5, 4.5]}
        intensity={1.7}
        color="#fff8ef"
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-4, 2.2, 2.05]} intensity={9} color="#38d9a9" />
      <Sparkles count={35} size={3.5} scale={[11, 4, 11]} color="#bdf9ed" />

      <HouseShell />
      <ExteriorDetails />

      {layouts.map(({ room, layout }) => (
        <RoomInterior
          key={room.id}
          room={room}
          layout={layout}
          isSelected={room.id === selectedRoomId}
          onSelect={onSelectRoom}
        />
      ))}

      {layouts.map(({ room, layout }) => (
        <EnergyTrail
          key={`${room.id}-trail`}
          start={[-4.1, 0.95, 2.1]}
          end={[layout.position[0], 0.58, layout.position[2]]}
          color={room.color}
        />
      ))}

      <Text position={[-4.1, 1.8, 2.1]} fontSize={0.18} color="#1f2937">
        Smart Meter
      </Text>

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.32}
        scale={12}
        blur={2.4}
        far={8}
      />

      <OrbitControls
        enablePan={false}
        maxPolarAngle={Math.PI / 2.25}
        minPolarAngle={Math.PI / 3.4}
        minAzimuthAngle={-0.7}
        maxAzimuthAngle={0.7}
      />
    </>
  );
}

export default function RealisticHouseScene({ rooms, selectedRoomId, onSelectRoom }) {
  return (
    <div className="h-[620px] w-full overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,#cfeeff_0%,#eef7ff_58%,#edf6ee_100%)]">
      <Canvas
        shadows
        camera={{ position: [0.2, 5.2, 9], fov: 38 }}
        gl={{ antialias: true }}
      >
        <RealisticHouseModel
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelectRoom={onSelectRoom}
        />
      </Canvas>
    </div>
  );
}
