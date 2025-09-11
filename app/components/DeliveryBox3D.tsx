"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useState } from "react";

interface DeliveryBox3DProps {
  images: {
    front: string;
    back: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
  };
  width?: number;
  height?: number;
  depth?: number;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export default function DeliveryBox3D({
  images,
  width = 400,
  height = 250,
  depth = 300,
  autoRotate = true,
  rotationSpeed = 2,
}: DeliveryBox3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  // Load textures for each face with better quality settings
  const textureLoader = new THREE.TextureLoader();
  
  const loadTexture = (url: string) => {
    const texture = textureLoader.load(url);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = true;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  const materials = [
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.right),
      transparent: false,
      opacity: 1.0
    }),  // right
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.left),
      transparent: false,
      opacity: 1.0
    }),   // left
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.top),
      transparent: false,
      opacity: 1.0
    }),    // top
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.bottom),
      transparent: false,
      opacity: 1.0
    }), // bottom
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.front),
      transparent: false,
      opacity: 1.0
    }),  // front
    new THREE.MeshLambertMaterial({ 
      map: loadTexture(images.back),
      transparent: false,
      opacity: 1.0
    }),   // back
  ];

  // Convert pixel dimensions to Three.js units (larger scale for bigger appearance)
  const scaleX = width / 60;
  const scaleY = height / 60;
  const scaleZ = depth / 60;

  return (
    <div 
      className="w-full h-[600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        transform: 'translateZ(0)',
        willChange: 'transform'
      }}
    >
      <Canvas 
        camera={{ 
          position: [12, 8, 15], 
          fov: 45,
          near: 0.1,
          far: 1000
        }}
        dpr={window.devicePixelRatio || 1} // Fixed DPR to prevent blur on hover
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        {/* Reduced lighting to prevent whitish appearance */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#ffffff" />

        {/* Rectangular Box */}
        <mesh rotation={[0.2, 0.3, 0]}>
          <boxGeometry args={[scaleX, scaleY, scaleZ]} />
          {materials.map((mat, i) => (
            <primitive key={i} object={mat} attach={`material-${i}`} />
          ))}
        </mesh>

        {/* Enhanced Controls */}
         <OrbitControls 
           enableZoom={true} 
           autoRotate={autoRotate && !isHovered}
           autoRotateSpeed={rotationSpeed}
           enablePan={false}
           maxDistance={30}
           minDistance={8}
           enableDamping={true}
           dampingFactor={0.05}
         />
      </Canvas>
    </div>
  );
}
