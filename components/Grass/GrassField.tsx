import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GrassConfig } from '../../types';
import { vertexShader, fragmentShader } from './shaders';
import { randomRange } from '../../utils/math';

interface GrassFieldProps {
  config: GrassConfig;
}

const GrassField: React.FC<GrassFieldProps> = ({ config }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create geometries and attributes once
  const { geometry, offsets, scales, rotations } = useMemo(() => {
    // Base geometry for a single blade
    // Width, Height, WidthSegments, HeightSegments
    // HeightSegments needed for smooth bending
    const geo = new THREE.PlaneGeometry(config.bladeWidth, config.bladeHeight, 1, 4);
    
    // Shift geometry so origin is at bottom center (0,0,0) instead of center of plane
    geo.translate(0, config.bladeHeight / 2, 0);

    const offsets = new Float32Array(config.bladeCount * 3);
    const scales = new Float32Array(config.bladeCount);
    const rotations = new Float32Array(config.bladeCount);

    const groundSize = 30; // 30x30 units area

    for (let i = 0; i < config.bladeCount; i++) {
      // Random Position
      offsets[i * 3] = randomRange(-groundSize / 2, groundSize / 2);
      offsets[i * 3 + 1] = 0; // On ground
      offsets[i * 3 + 2] = randomRange(-groundSize / 2, groundSize / 2);

      // Random Height Scale (0.7 to 1.3 variance)
      scales[i] = randomRange(0.6, 1.4);

      // Random Y-Rotation
      rotations[i] = randomRange(0, Math.PI * 2);
    }

    return { geometry: geo, offsets, scales, rotations };
  }, [config.bladeCount, config.bladeWidth, config.bladeHeight]);

  // Generate a procedural texture for the blade
  // This simulates loading a "map" by creating one on the fly
  const bladeTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Clear background (Transparent)
      ctx.clearRect(0, 0, 512, 512);

      // Draw Blade Shape (Alpha Mask)
      ctx.beginPath();
      // Start bottom left-ish
      ctx.moveTo(150, 512); 
      // Curve to top center
      ctx.bezierCurveTo(150, 300, 256, 100, 256, 0);
      // Curve down to bottom right-ish
      ctx.bezierCurveTo(256, 100, 362, 300, 362, 512);
      ctx.closePath();
      
      // Fill with base white/grey for diffuse modulation
      // Use a gradient to simulate veins/ribs
      const gradient = ctx.createLinearGradient(0, 0, 512, 0);
      gradient.addColorStop(0, '#aaaaaa');
      gradient.addColorStop(0.4, '#ffffff'); // Mid rib
      gradient.addColorStop(0.6, '#ffffff'); // Mid rib
      gradient.addColorStop(1, '#aaaaaa');
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Add thin vein details
      ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
         ctx.beginPath();
         const x = 150 + Math.random() * 212;
         ctx.moveTo(x, 512);
         ctx.quadraticCurveTo(256, 100, 256, 0);
         ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    // Anisotropy helps with oblique viewing angles
    tex.anisotropy = 16; 
    return tex;
  }, []);

  // Update uniforms
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // Update material uniforms when config changes
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uWindSpeed.value = config.windSpeed;
      materialRef.current.uniforms.uWindStrength.value = config.windStrength;
      materialRef.current.uniforms.uBaseColor.value = new THREE.Color(config.baseColor);
      materialRef.current.uniforms.uTipColor.value = new THREE.Color(config.tipColor);
    }
  }, [config]);

  // Uniforms object
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWindSpeed: { value: config.windSpeed },
    uWindStrength: { value: config.windStrength },
    uBaseColor: { value: new THREE.Color(config.baseColor) },
    uTipColor: { value: new THREE.Color(config.tipColor) },
    uMap: { value: bladeTexture }
  }), [bladeTexture, config.windSpeed, config.windStrength, config.baseColor, config.tipColor]); 

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, config.bladeCount]}
      frustumCulled={false} // Prevent culling when blades sway out of bounds
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={false} 
        alphaTest={0.5} // Standard alpha test
      />
      {/* Inject Instanced Attributes */}
      <instancedBufferAttribute
        attach="geometry-attributes-aOffset"
        args={[offsets, 3]}
      />
      <instancedBufferAttribute
        attach="geometry-attributes-aScale"
        args={[scales, 1]}
      />
      <instancedBufferAttribute
        attach="geometry-attributes-aRotation"
        args={[rotations, 1]}
      />
    </instancedMesh>
  );
};

export default GrassField;