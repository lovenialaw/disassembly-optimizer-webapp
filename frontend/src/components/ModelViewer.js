import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import './ModelViewer.css';

function Model({ productId, metadata, optimizationResult, isAnimating, currentStep }) {
  const modelUrl = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/products/${productId}/model`
    : `http://localhost:5000/api/products/${productId}/model`;
  const { scene, animations } = useGLTF(modelUrl);
  const groupRef = useRef();
  const [highlightedParts, setHighlightedParts] = useState(new Set());

  useEffect(() => {
    if (optimizationResult && isAnimating && optimizationResult.animation_steps) {
      const step = optimizationResult.animation_steps[currentStep];
      if (step) {
        // Highlight the part for current step
        setHighlightedParts(new Set([step.part_id]));
        
        // Reset highlights after animation
        const timer = setTimeout(() => {
          if (currentStep === optimizationResult.animation_steps.length - 1) {
            setHighlightedParts(new Set());
          }
        }, step.duration * 1000);
        
        return () => clearTimeout(timer);
      }
    } else if (optimizationResult && !isAnimating) {
      // Show all selected parts highlighted
      setHighlightedParts(new Set(optimizationResult.sequence || []));
    } else {
      setHighlightedParts(new Set());
    }
  }, [optimizationResult, isAnimating, currentStep]);

  useEffect(() => {
    if (!scene || !metadata) return;

    // Traverse scene and apply highlighting
    scene.traverse((child) => {
      if (child.isMesh) {
        const partName = child.name || child.userData.name;
        if (highlightedParts.has(partName)) {
          // Highlight part
          child.material = child.material.clone();
          child.material.emissive = new THREE.Color(0x00ff00);
          child.material.emissiveIntensity = 0.5;
        } else {
          // Reset to original material
          if (child.userData.originalMaterial) {
            child.material = child.userData.originalMaterial;
          }
        }
      }
    });
  }, [scene, highlightedParts, metadata]);

  return (
    <primitive 
      ref={groupRef}
      object={scene} 
      scale={1} 
      position={[0, 0, 0]} 
    />
  );
}

const ModelViewer = ({ productId, metadata, optimizationResult, isAnimating, currentStep }) => {
  if (!productId) return <div className="model-viewer-placeholder">Select a product to view 3D model</div>;

  return (
    <div className="model-viewer">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <Model 
          productId={productId}
          metadata={metadata}
          optimizationResult={optimizationResult}
          isAnimating={isAnimating}
          currentStep={currentStep}
        />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

export default ModelViewer;

