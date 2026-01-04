import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import * as THREE from 'three';
import GrassField from './Grass/GrassField';
import { GrassConfig } from '../types';

interface SceneProps {
  config: GrassConfig;
}

const Scene: React.FC<SceneProps> = ({ config }) => {
  // Calculate sun position vector from Azimuth and Elevation
  const sunPosition = useMemo(() => {
    const distance = 100;
    const elevationRad = THREE.MathUtils.degToRad(config.sunElevation);
    const azimuthRad = THREE.MathUtils.degToRad(config.sunAzimuth);

    // Spherical to Cartesian conversion
    // Y is up in Three.js
    const y = distance * Math.sin(elevationRad);
    const r = distance * Math.cos(elevationRad);
    const x = r * Math.sin(azimuthRad);
    const z = r * Math.cos(azimuthRad);

    return [x, y, z] as [number, number, number];
  }, [config.sunElevation, config.sunAzimuth]);

  return (
    <Canvas
      camera={{ position: [0, 2, 8], fov: 45 }}
      shadows
      dpr={[1, 2]} // Handle high DPI screens
      gl={{ antialias: true, toneMappingExposure: 0.8 }}
      className="w-full h-full bg-surface-1"
    >
      <fog attach="fog" args={['#050505', 5, 25]} />
      
      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.1} // Don't go below ground
        enablePan={false}
        enableZoom={true}
        maxDistance={20}
        minDistance={2}
        rotateSpeed={0.5}
      />
      
      {/* Environment Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={sunPosition} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]} 
      />
      
      {/* Skybox */}
      <Sky 
        sunPosition={sunPosition} 
        turbidity={8} 
        rayleigh={6} 
        mieCoefficient={0.005} 
        mieDirectionalG={0.8}
      />

      {/* The Grass */}
      <GrassField config={config} />
      
      {/* Ground Plane (Dark soil) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[16, 32]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.9} />
      </mesh>
    </Canvas>
  );
};

export default Scene;