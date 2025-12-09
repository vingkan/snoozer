import { useState, useRef, Suspense, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { officeLayout, type Seat } from "@/lib/officeSeating";
import * as THREE from "three";

// Error Boundary for React Three Fiber
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("3D Scene Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center h-full text-white">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">3D View Error</p>
              <p className="text-sm text-gray-400">
                Unable to load 3D visualization. Please refresh the page.
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

interface Seat3DProps {
  seat: Seat;
  onSeatClick: (seat: Seat) => void;
  selectedSeatId: number | null;
}

function Seat3D({ seat, onSeatClick, selectedSeatId }: Seat3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isSelected = selectedSeatId === seat.id;
  const seatSize = 0.4;
  const seatHeight = 0.3;
  
  // Convert 2D coordinates to 3D (scale down and center)
  // Original layout is ~800x850, we'll scale to ~8x8.5 units
  const scale = 0.01;
  const x = (seat.x - officeLayout.width / 2) * scale;
  const z = (seat.y - officeLayout.height / 2) * scale;
  const y = seatHeight / 2; // Seats sit on the floor
  
  // Color coding: green for floater seats, gray for occupied
  const color = seat.isFloater ? "#22c55e" : "#6b7280";
  const selectedColor = "#3b82f6";
  
  // Animate selected seats and hover effect
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        meshRef.current.position.y = y + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      } else if (hovered) {
        meshRef.current.position.y = y + 0.1;
      } else {
        meshRef.current.position.y = y;
        meshRef.current.rotation.y = 0;
      }
    }
  });
  
  return (
    <group position={[x, y, z]}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSeatClick(seat);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[seatSize, seatHeight, seatSize]} />
        <meshStandardMaterial
          color={isSelected ? selectedColor : hovered ? "#9ca3af" : color}
          metalness={0.3}
          roughness={0.7}
          emissive={isSelected ? selectedColor : hovered ? "#ffffff" : "#000000"}
          emissiveIntensity={isSelected ? 0.3 : hovered ? 0.1 : 0}
        />
      </mesh>
      
      {/* Seat number label */}
      <Text
        position={[0, seatHeight + 0.1, 0]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {seat.id}
      </Text>
    </group>
  );
}

interface Area3DProps {
  area: typeof officeLayout.areas[0];
}

function Area3D({ area }: Area3DProps) {
  const scale = 0.01;
  const x = (area.x + area.width / 2 - officeLayout.width / 2) * scale;
  const z = (area.y + area.height / 2 - officeLayout.height / 2) * scale;
  const width = area.width * scale;
  const height = area.height * scale;
  const areaHeight = 0.6; // Height of the elevated area
  const wallThickness = 0.05;
  
  // Only elevate IP Conference Room and Mini Lounge Area
  const shouldElevate = area.id === "ip-conference" || area.id === "mini-lounge";
  
  if (shouldElevate) {
    // Elevated structure for conference rooms
    return (
      <group position={[x, areaHeight / 2, z]}>
        {/* Top surface - solid */}
        <mesh
          position={[0, areaHeight / 2, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          castShadow
        >
          <planeGeometry args={[width, height]} />
          <meshStandardMaterial
            color={area.color}
            opacity={1.0}
            transparent={false}
            roughness={0.7}
            metalness={0.1}
          />
        </mesh>
        
        {/* Side walls - translucent */}
        {/* North wall */}
        <mesh
          position={[0, 0, -height / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, areaHeight, wallThickness]} />
          <meshStandardMaterial
            color={area.color}
            opacity={0.4}
            transparent
            roughness={0.8}
          />
        </mesh>
        
        {/* South wall */}
        <mesh
          position={[0, 0, height / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[width, areaHeight, wallThickness]} />
          <meshStandardMaterial
            color={area.color}
            opacity={0.4}
            transparent
            roughness={0.8}
          />
        </mesh>
        
        {/* East wall */}
        <mesh
          position={[width / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[height, areaHeight, wallThickness]} />
          <meshStandardMaterial
            color={area.color}
            opacity={0.4}
            transparent
            roughness={0.8}
          />
        </mesh>
        
        {/* West wall */}
        <mesh
          position={[-width / 2, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[height, areaHeight, wallThickness]} />
          <meshStandardMaterial
            color={area.color}
            opacity={0.4}
            transparent
            roughness={0.8}
          />
        </mesh>
        
        {/* Area label */}
        <Text
          position={[0, areaHeight / 2 + 0.1, 0]}
          fontSize={0.3}
          color="#374151"
          anchorX="center"
          anchorY="middle"
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {area.name}
        </Text>
      </group>
    );
  }
  
  // Flat marker for Area-2 and Hallway
  return (
    <group position={[x, 0.01, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          color={area.color}
          opacity={0.3}
          transparent
          roughness={0.8}
        />
      </mesh>
      
      {/* Area label */}
      <Text
        position={[0, 0.1, 0]}
        fontSize={0.3}
        color="#374151"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {area.name}
      </Text>
    </group>
  );
}

function Floor() {
  const scale = 0.01;
  const width = officeLayout.width * scale;
  const height = officeLayout.height * scale;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[width * 1.2, height * 1.2]} />
      <meshStandardMaterial color="#f3f4f6" roughness={0.8} />
    </mesh>
  );
}

function StadiumWalls() {
  const scale = 0.01;
  const seatHeight = 0.3;
  const baseHeight = seatHeight * 0.8; // Base tier height
  const wallThickness = 0.15;
  
  // Calculate perimeter dimensions
  const layoutWidth = officeLayout.width * scale;
  const layoutHeight = officeLayout.height * scale;
  const basePadding = 0.4; // Base padding outside the seating area
  
  // Wall positions (centered around origin)
  const baseHalfWidth = layoutWidth / 2 + basePadding;
  const baseHalfHeight = layoutHeight / 2 + basePadding;
  
  // Bowl-style tier configuration: 5 tiers creating a pronounced bowl effect
  // Each tier gets progressively taller and further out
  const numTiers = 5;
  const tiers: Array<{
    height: number;
    offset: number;
    cumulativeHeight: number;
    color: string;
  }> = [];
  
  let cumulativeHeight = 0;
  for (let i = 0; i < numTiers; i++) {
    // Height progression: each tier is 1.6-1.8x taller than previous
    const heightMultiplier = i === 0 ? 1 : 1.7;
    const tierHeight = i === 0 ? baseHeight : tiers[i - 1].height * heightMultiplier;
    
    // Offset progression: each tier moves wider apart for better top-down visibility
    const offsetIncrement = 0.35;
    const offset = i * offsetIncrement;
    
    cumulativeHeight += tierHeight;
    
    // Color progression: darker as we go up
    const colorIntensity = Math.min(255 - i * 25, 100);
    const color = `rgb(${colorIntensity}, ${colorIntensity}, ${colorIntensity})`;
    
    tiers.push({
      height: tierHeight,
      offset: offset,
      cumulativeHeight: cumulativeHeight,
      color: color,
    });
  }
  
  // Create wall segments for each side
  const createWallSegment = (
    position: [number, number, number],
    width: number,
    height: number,
    rotation: number,
    color: string,
    key: string
  ) => (
    <mesh
      key={key}
      position={position}
      rotation={[0, rotation, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[width, height, wallThickness]} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        metalness={0.15}
      />
    </mesh>
  );
  
  const walls: JSX.Element[] = [];
  
  // Create walls for each tier - bowl style
  tiers.forEach((tier, tierIndex) => {
    const offset = tier.offset;
    const yPosition = tier.cumulativeHeight - tier.height / 2; // Position at cumulative height
    
    // Calculate width for this tier (gets wider as we go out)
    const tierHalfWidth = baseHalfWidth + offset;
    const tierHalfHeight = baseHalfHeight + offset;
    
    // North wall (top)
    walls.push(
      createWallSegment(
        [0, yPosition, -tierHalfHeight],
        tierHalfWidth * 2,
        tier.height,
        0,
        tier.color,
        `wall-north-${tierIndex}`
      )
    );
    
    // South wall (bottom)
    walls.push(
      createWallSegment(
        [0, yPosition, tierHalfHeight],
        tierHalfWidth * 2,
        tier.height,
        0,
        tier.color,
        `wall-south-${tierIndex}`
      )
    );
    
    // East wall (right)
    walls.push(
      createWallSegment(
        [tierHalfWidth, yPosition, 0],
        tierHalfHeight * 2,
        tier.height,
        Math.PI / 2,
        tier.color,
        `wall-east-${tierIndex}`
      )
    );
    
    // West wall (left)
    walls.push(
      createWallSegment(
        [-tierHalfWidth, yPosition, 0],
        tierHalfHeight * 2,
        tier.height,
        Math.PI / 2,
        tier.color,
        `wall-west-${tierIndex}`
      )
    );
    
    // Corner pieces for each tier - larger and more pronounced
    const cornerSize = wallThickness * 2;
    const cornerPositions: Array<[number, number, number]> = [
      [tierHalfWidth, yPosition, -tierHalfHeight], // Top-right
      [-tierHalfWidth, yPosition, -tierHalfHeight], // Top-left
      [tierHalfWidth, yPosition, tierHalfHeight], // Bottom-right
      [-tierHalfWidth, yPosition, tierHalfHeight], // Bottom-left
    ];
    
    cornerPositions.forEach((pos, cornerIndex) => {
      walls.push(
        <mesh
          key={`corner-${tierIndex}-${cornerIndex}`}
          position={pos}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[cornerSize, tier.height, cornerSize]} />
          <meshStandardMaterial
            color={tier.color}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      );
    });
  });
  
  return <group>{walls}</group>;
}

function Scene({
  selectedSeatId,
  onSeatClick,
}: {
  selectedSeatId: number | null;
  onSeatClick: (seat: Seat) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
      
      {/* Floor */}
      <Floor />
      
      {/* Stadium Walls */}
      <StadiumWalls />
      
      {/* Areas */}
      {officeLayout.areas
        .filter((area) => area.id !== "area-2" && area.id !== "hallway")
        .map((area) => (
          <Area3D key={area.id} area={area} />
        ))}
      
      {/* Seats */}
      {officeLayout.seats.map((seat) => (
        <Seat3D
          key={seat.id}
          seat={seat}
          onSeatClick={onSeatClick}
          selectedSeatId={selectedSeatId}
        />
      ))}
      
      {/* OrbitControls for camera interaction */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={20}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}

export function OfficeMap() {
  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showPopover, setShowPopover] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering Canvas (helps with React 19 compatibility)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSeatClick = (seat: Seat) => {
    setSelectedSeatId(seat.id);
    setSelectedSeat(seat);
    setShowPopover(true);
  };

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden relative">
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Controls</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>🖱️ Left click + drag: Rotate</li>
          <li>🖱️ Right click + drag: Pan</li>
          <li>🖱️ Scroll: Zoom</li>
          <li>🖱️ Click seat: View details</li>
        </ul>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Legend</h3>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-xs">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-xs">Floater</span>
        </div>
      </div>

      {/* 3D Canvas */}
      {mounted && (
        <ErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <p className="text-lg font-semibold mb-2">3D View Unavailable</p>
                <p className="text-sm text-gray-400 mb-4">
                  The 3D visualization requires a compatible browser.
                </p>
                <p className="text-xs text-gray-500">
                  Error: React Three Fiber compatibility issue with React 19
                </p>
              </div>
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 8, 8], fov: 50 }}
            shadows
            gl={{ 
              antialias: true, 
              alpha: false,
              powerPreference: "high-performance"
            }}
            dpr={[1, 2]}
            frameloop="always"
          >
            <Suspense fallback={null}>
              <Scene selectedSeatId={selectedSeatId} onSeatClick={handleSeatClick} />
            </Suspense>
          </Canvas>
        </ErrorBoundary>
      )}

      {/* Popover for seat details */}
      {showPopover && selectedSeat && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg p-4 shadow-xl border border-gray-200 min-w-[200px]">
          <button
            onClick={() => setShowPopover(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="space-y-2 pr-6">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-sm">Seat {selectedSeat.id}</p>
              {selectedSeat.score !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">{selectedSeat.score}</span>
                  <span className="text-xs font-semibold text-gray-600">{selectedSeat.scoreName}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{selectedSeat.employee}</p>
            {selectedSeat.scoreDescription && (
              <p className="text-xs text-gray-500 italic">{selectedSeat.scoreDescription}</p>
            )}
            {selectedSeat.isFloater && (
              <p className="text-xs text-green-600 font-medium">Floater Seat</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
