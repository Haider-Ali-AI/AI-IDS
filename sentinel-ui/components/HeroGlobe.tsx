"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

function RotatingGlobe() {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.3;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5;
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.2) * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.3;
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.15) * 0.15;
    }
  });

  return (
    <group>
      {/* Core globe */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.4, 3]} />
        <meshBasicMaterial
          color={0x00d4ff}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Solid inner globe */}
      <mesh>
        <icosahedronGeometry args={[1.38, 2]} />
        <meshBasicMaterial
          color={0x001833}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Outer orbit ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.015, 8, 100]} />
        <meshBasicMaterial color={0x00ff88} transparent opacity={0.6} />
      </mesh>

      {/* Second orbit ring */}
      <mesh ref={ring2Ref} rotation={[Math.PI / 3, 0.5, 0]}>
        <torusGeometry args={[2.4, 0.008, 8, 100]} />
        <meshBasicMaterial color={0x00d4ff} transparent opacity={0.4} />
      </mesh>

      {/* Pulsing glow sphere */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial
          color={0x00d4ff}
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function StarField() {
  const count = 800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
  }

  const ref = useRef<THREE.Points>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <Points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.05}
        color={0x00d4ff}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </Points>
  );
}

export default function HeroGlobe() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <RotatingGlobe />
          <StarField />
        </Suspense>
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.5}
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
        />
      </Canvas>
    </motion.div>
  );
}
