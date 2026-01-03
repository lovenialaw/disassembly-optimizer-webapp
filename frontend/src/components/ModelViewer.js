import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './ModelViewer.css';

function Model({ productId, metadata, optimizationResult, isAnimating, currentStep }) {
  const modelUrl = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/products/${productId}/model`
    : `http://localhost:5000/api/products/${productId}/model`;
  const { scene } = useGLTF(modelUrl);
  const groupRef = useRef();
  const [highlightedParts, setHighlightedParts] = useState(new Set());
  const materialsRef = useRef(new Map());

  // Store original materials on first load
  useEffect(() => {
    if (!scene) return;
    
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const key = child.uuid;
        if (!materialsRef.current.has(key)) {
          // Store original material
          materialsRef.current.set(key, {
            original: child.material.clone(),
            mesh: child
          });
        }
      }
    });
  }, [scene]);

  // Update highlighted parts based on animation state
  useEffect(() => {
    if (!optimizationResult) {
      setHighlightedParts(new Set());
      return;
    }

    if (isAnimating && optimizationResult.animation_steps && optimizationResult.animation_steps.length > 0) {
      const step = optimizationResult.animation_steps[currentStep];
      if (step && step.part_id) {
        // Highlight the current part being disassembled
        setHighlightedParts(new Set([step.part_id]));
      } else {
        setHighlightedParts(new Set());
      }
    } else if (!isAnimating && optimizationResult.sequence) {
      // When not animating, show all parts in sequence
      setHighlightedParts(new Set(optimizationResult.sequence));
    } else {
      setHighlightedParts(new Set());
    }
  }, [optimizationResult, isAnimating, currentStep]);

  // Apply highlighting to meshes
  useEffect(() => {
    if (!scene || !metadata) return;

    // Create a mapping from component names to possible mesh names
    const componentNameMap = new Map();
    if (metadata && metadata.components) {
      metadata.components.forEach(comp => {
        const compId = comp.id || comp.name || comp.component;
        const compName = comp.name || comp.component || comp.id;
        // Add variations of the name for matching
        componentNameMap.set(compId.toLowerCase(), compName);
        componentNameMap.set(compName.toLowerCase(), compName);
        if (comp.component) {
          componentNameMap.set(comp.component.toLowerCase(), comp.component);
        }
      });
    }

    // Traverse scene and apply highlighting
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const meshName = (child.name || '').toLowerCase().trim();
        
        // Check if this mesh should be highlighted
        let shouldHighlight = false;
        
        if (highlightedParts.size > 0) {
          // Try to match mesh name with highlighted parts
          for (const highlightedPart of highlightedParts) {
            const highlightedLower = String(highlightedPart).toLowerCase();
            
            // Direct name match
            if (meshName === highlightedLower || meshName.includes(highlightedLower) || highlightedLower.includes(meshName)) {
              shouldHighlight = true;
              break;
            }
            
            // Match via component mapping
            if (componentNameMap.has(highlightedLower)) {
              const mappedName = componentNameMap.get(highlightedLower).toLowerCase();
              if (meshName === mappedName || meshName.includes(mappedName) || mappedName.includes(meshName)) {
                shouldHighlight = true;
                break;
              }
            }
          }
        }

        const key = child.uuid;
        let stored = materialsRef.current.get(key);
        
        // If we don't have stored material, store it now
        if (!stored) {
          const originalMaterial = child.material.clone();
          materialsRef.current.set(key, {
            original: originalMaterial,
            mesh: child
          });
          stored = materialsRef.current.get(key);
        }
        
        if (shouldHighlight) {
          // Highlight part with bright green emissive
          if (!child.userData.isHighlighted) {
            child.userData.isHighlighted = true;
            const highlightMaterial = stored.original.clone();
            highlightMaterial.emissive = new THREE.Color(0x00ff00);
            highlightMaterial.emissiveIntensity = 0.8;
            // Make it brighter
            highlightMaterial.color.multiplyScalar(1.3);
            child.material = highlightMaterial;
          }
        } else {
          // Reset to original material
          if (child.userData.isHighlighted && stored) {
            child.userData.isHighlighted = false;
            child.material = stored.original.clone();
          }
        }
      }
    });
  }, [scene, highlightedParts, metadata, optimizationResult, currentStep]);

  // Debug logging
  useEffect(() => {
    if (highlightedParts.size > 0) {
      console.log('Highlighting parts:', Array.from(highlightedParts));
      console.log('Current step:', currentStep);
      console.log('Is animating:', isAnimating);
    }
  }, [highlightedParts, currentStep, isAnimating]);

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

