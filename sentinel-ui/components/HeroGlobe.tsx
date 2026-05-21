"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import * as THREE from "three";

// Dynamically import react-globe.gl to avoid SSR issues with canvas/window
const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function HeroGlobe() {
  const globeEl = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("Locating…");

  // Keep globe container fully responsive
  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      const observer = new ResizeObserver((entries) => {
        if (entries[0]) {
          setDimensions({
            width: entries[0].contentRect.width,
            height: entries[0].contentRect.height
          });
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  // Fetch real location
  useEffect(() => {
    if (!navigator.geolocation) { setLocationLabel("Location unavailable"); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos({ lat: latitude, lng: longitude });
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
        // Fallback
        setUserPos({ lat: 24.8607, lng: 67.0011 });
        setLocationLabel("Karachi, PK");
      }
    );
  }, []);

  // Configure auto-rotation and initial camera position
  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.8;
      globeEl.current.controls().enableZoom = false;
      // Position the camera slightly further back
      globeEl.current.pointOfView({ altitude: 2.2 }, 0);
      
      // Apply neon cyber theme to the globe material
      const globeMaterial = globeEl.current.globeMaterial();
      globeMaterial.color = new THREE.Color("#00122a");
      globeMaterial.emissive = new THREE.Color("#00d4ff");
      globeMaterial.emissiveIntensity = 0.15;
    }
  }, [globeEl.current, dimensions.width]);

  const threatSources = [
    { lat: 55.7558, lng: 37.6173, color: "#ffa500", name: "Moscow" },
    { lat: 39.9042, lng: 116.4074, color: "#ff3366", name: "Beijing" },
    { lat: 35.6762, lng: 139.6503, color: "#ff0066", name: "Tokyo" },
    { lat: -23.5505, lng: -46.6333, color: "#ff4400", name: "São Paulo" },
  ];

  // Arcs from attackers to user
  const arcsData = userPos ? threatSources.map(src => ({
    startLat: src.lat,
    startLng: src.lng,
    endLat: userPos.lat,
    endLng: userPos.lng,
    color: [src.color, "#00ff88"]
  })) : [];

  // Points on the globe (attackers + user)
  const pointsData = [
    ...threatSources.map(src => ({ lat: src.lat, lng: src.lng, size: 0.15, color: src.color, isUser: false })),
    ...(userPos ? [{ lat: userPos.lat, lng: userPos.lng, size: 0.25, color: "#00ff88", isUser: true }] : [])
  ];

  // Radar/Ping ring around the user
  const ringsData = userPos ? [{ lat: userPos.lat, lng: userPos.lng }] : [];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {dimensions.width > 0 && typeof window !== "undefined" && (
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          
          // Realistic dark earth map with topography
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"

          // Neon Glow Atmosphere
          atmosphereColor="#00d4ff"
          atmosphereAltitude={0.2}

          // Attackers & User points
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude="size"
          pointRadius={d => (d as any).isUser ? 0.8 : 0.4}
          pointsMerge={false}

          // User ping rings
          ringsData={ringsData}
          ringColor={() => "#00ff88"}
          ringMaxRadius={6}
          ringPropagationSpeed={2}
          ringRepeatPeriod={1500}

          // Attack arcs
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor="color"
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
        />
      )}

      {/* Location HUD overlay */}
      <div style={{
        position: "absolute", bottom: 16, right: 24,
        background: "rgba(0,18,42,0.8)", border: "1px solid rgba(0,255,136,0.4)",
        borderRadius: 6, padding: "6px 12px", backdropFilter: "blur(8px)",
        fontFamily: "monospace", fontSize: 11, color: "#00ff88",
        display: "flex", alignItems: "center", gap: 6, zIndex: 10
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", display: "inline-block", boxShadow: "0 0 8px #00ff88", animation: "pulse-dot 1.5s infinite" }} />
        {locationLabel}
      </div>
    </motion.div>
  );
}
