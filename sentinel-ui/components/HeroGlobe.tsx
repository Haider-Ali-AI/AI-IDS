"use client";

import { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial, Html } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

/* ── Geolocation → 3-D position ───────────────────────────────────── */
function latLngToVec3(lat: number, lng: number, r = 1.42): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Pulsing location beacon ───────────────────────────────────────── */
function LocationBeacon({ position }: { position: THREE.Vector3 }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const s = 1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.8;
    if (ringRef.current) { ringRef.current.scale.setScalar(s); (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 1 - (s - 1) / 0.8; }
    const s2 = 1 + (Math.sin(t * 2 + Math.PI) * 0.5 + 0.5) * 0.8;
    if (ring2Ref.current) { ring2Ref.current.scale.setScalar(s2); (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = 1 - (s2 - 1) / 0.8; }
  });

  return (
    <group position={position}>
      {/* Core dot */}
      <mesh>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshBasicMaterial color={0xff3366} />
      </mesh>
      {/* Pulse ring 1 */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.055, 32]} />
        <meshBasicMaterial color={0xff3366} transparent opacity={1} side={THREE.DoubleSide} />
      </mesh>
      {/* Pulse ring 2 (offset phase) */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.055, 32]} />
        <meshBasicMaterial color={0xff6699} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* Label */}
      <Html distanceFactor={6} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(255,51,102,0.15)",
          border: "1px solid rgba(255,51,102,0.6)",
          borderRadius: 4,
          padding: "2px 7px",
          color: "#ff3366",
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 700,
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
        }}>
          ◉ YOUR LOCATION
        </div>
      </Html>
    </group>
  );
}

/* ── Attack arc between two points on the globe ───────────────────── */
function AttackArc({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line | null>(null);
  const progress = useRef(0);

  const points = useMemo(() => {
    const mid = from.clone().add(to).multiplyScalar(0.5).normalize().multiplyScalar(2.1);
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    return curve.getPoints(60);
  }, [from, to]);

  useEffect(() => {
    if (!groupRef.current) return;
    const geom = new THREE.BufferGeometry().setFromPoints([from]);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 });
    const line = new THREE.Line(geom, mat);
    lineRef.current = line;
    groupRef.current.add(line);
    return () => { groupRef.current?.remove(line); line.geometry.dispose(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    progress.current = Math.min(1, progress.current + delta * 0.4);
    if (lineRef.current) {
      const cnt = Math.max(2, Math.floor(progress.current * points.length));
      lineRef.current.geometry.setFromPoints(points.slice(0, cnt));
    }
  });

  return <group ref={groupRef} />;
}

/* ── Main globe mesh ───────────────────────────────────────────────── */
function RotatingGlobe({ userPos }: { userPos: THREE.Vector3 | null }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  // Attack arc origin points (random threat sources)
  const threatSources = useMemo(() => [
    latLngToVec3(55.7558, 37.6173),  // Moscow
    latLngToVec3(39.9042, 116.4074), // Beijing
    latLngToVec3(35.6762, 139.6503), // Tokyo
    latLngToVec3(-23.5505, -46.6333),// São Paulo
  ], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) { meshRef.current.rotation.y = t * 0.15; }
    if (ring1.current) { ring1.current.rotation.z = t * 0.4; ring1.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.05; }
    if (ring2.current) { ring2.current.rotation.z = -t * 0.25; ring2.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.15) * 0.1; }
    if (ring3.current) { ring3.current.rotation.z = t * 0.15; ring3.current.rotation.x = Math.PI / 4; }
  });

  return (
    <group>
      {/* Wireframe globe */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.42, 4]} />
        <meshBasicMaterial color={0x00d4ff} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Solid inner */}
      <mesh>
        <icosahedronGeometry args={[1.40, 3]} />
        <meshBasicMaterial color={0x00122a} transparent opacity={0.9} />
      </mesh>

      {/* Equatorial ring */}
      <mesh ref={ring1} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.0, 0.012, 8, 120]} />
        <meshBasicMaterial color={0x00ff88} transparent opacity={0.55} />
      </mesh>

      {/* Orbital ring 2 */}
      <mesh ref={ring2} rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[2.4, 0.007, 8, 120]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.4} />
      </mesh>

      {/* Polar ring */}
      <mesh ref={ring3} rotation={[0, Math.PI / 6, 0]}>
        <torusGeometry args={[2.2, 0.005, 8, 120]} />
        <meshBasicMaterial color={0xa855f7} transparent opacity={0.3} />
      </mesh>

      {/* Glow shell */}
      <mesh>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.025} side={THREE.BackSide} />
      </mesh>

      {/* User location beacon */}
      {userPos && <LocationBeacon position={userPos} />}

      {/* Attack arcs targeting user location */}
      {userPos && threatSources.map((src, i) => (
        <AttackArc key={i} from={src} to={userPos} color={[0xff3366, 0xffa500, 0xff0066, 0xff4400][i % 4]} />
      ))}

      {/* Threat source dots */}
      {threatSources.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color={0xffa500} />
        </mesh>
      ))}
    </group>
  );
}

/* ── Starfield background ──────────────────────────────────────────── */
function StarField() {
  const count = 1200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.008;
  });

  return (
    <Points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <PointMaterial size={0.04} color={0x00d4ff} transparent opacity={0.5} sizeAttenuation />
    </Points>
  );
}

/* ── Main export ───────────────────────────────────────────────────── */
export default function HeroGlobe() {
  const [userPos, setUserPos] = useState<THREE.Vector3 | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("Locating…");

  useEffect(() => {
    if (!navigator.geolocation) { setLocationLabel("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos(latLngToVec3(latitude, longitude));
        // Reverse geocode
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.county || "Unknown";
          const country = data.address?.country_code?.toUpperCase() || "";
          setLocationLabel(`${city}, ${country}`);
        } catch {
          setLocationLabel(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
        }
      },
      () => {
        // Fallback: Karachi (since user is in Pakistan based on timezone)
        setUserPos(latLngToVec3(24.8607, 67.0011));
        setLocationLabel("Karachi, PK");
      }
    );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: "easeOut" }}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} style={{ background: "transparent" }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color={0x00d4ff} />
        <Suspense fallback={null}>
          <RotatingGlobe userPos={userPos} />
          <StarField />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate={false} rotateSpeed={0.5} />
      </Canvas>

      {/* Location HUD overlay */}
      <div style={{
        position: "absolute", bottom: 16, right: 24,
        background: "rgba(0,18,42,0.8)", border: "1px solid rgba(255,51,102,0.4)",
        borderRadius: 6, padding: "6px 12px", backdropFilter: "blur(8px)",
        fontFamily: "monospace", fontSize: 11, color: "#ff3366",
        display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff3366", display: "inline-block", boxShadow: "0 0 8px #ff3366", animation: "pulse-dot 1.5s infinite" }} />
        {locationLabel}
      </div>
    </motion.div>
  );
}
