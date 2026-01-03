import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './ModelViewer.css';

function Model({ productId, metadata, optimizationResult, isAnimating, currentStep }) {
  const modelUrl = process.env.REACT_APP_API_URL 
    ? `${process.env.REACT_APP_API_URL}/products/${productId}/model`
    : `http://localhost:5000/api/products/${productId}/model`;
  
  const [error, setError] = useState(null);
  
  // useGLTF with error handling
  let scene = null;
  try {
    const gltfResult = useGLTF(modelUrl);
    scene = gltfResult.scene;
  } catch (err) {
    console.error('Error loading GLTF model:', err);
    setError(err.message || 'Failed to load 3D model');
  }
  
  const groupRef = useRef();
  const controlsRef = useRef();
  const { camera } = useThree();
  const [highlightedParts, setHighlightedParts] = useState(new Set());
  const materialsRef = useRef(new Map());
  const highlightedMeshRef = useRef(null);
  const originalCameraPosition = useRef(new THREE.Vector3(5, 5, 5));
  const isZoomingRef = useRef(false);

  useEffect(() => {
    if (scene) {
      setError(null);
      console.log('Model loaded successfully:', productId);
    }
  }, [scene, productId]);

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
            
            // Store reference to highlighted mesh for camera zoom (only when animating)
            if (isAnimating) {
              highlightedMeshRef.current = child;
            }
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

  // Function to zoom camera to a specific mesh
  const zoomToMesh = useCallback((mesh) => {
    if (!mesh || !camera || !controlsRef.current) return;
    
    isZoomingRef.current = true;
    
    // Calculate bounding box of the mesh
    const box = new THREE.Box3().setFromObject(mesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate distance to fit the mesh in view
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2.5; // Zoom factor
    
    // Calculate camera position (offset from center)
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    const targetPosition = center.clone().add(direction.multiplyScalar(distance));
    
    // Store original camera position if not already stored
    if (!isAnimating || currentStep === 0) {
      originalCameraPosition.current = camera.position.clone();
    }
    
    // Animate camera to target position
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    const duration = 800; // Animation duration in ms
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-in-out)
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Interpolate camera position
      camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Update controls target
      if (controlsRef.current) {
        controlsRef.current.target.lerp(center, eased);
        controlsRef.current.update();
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isZoomingRef.current = false;
      }
    };
    
    animate();
  }, [isAnimating, currentStep]);

  // Function to reset camera to original position
  const resetCamera = useCallback(() => {
    if (!camera || !controlsRef.current) return;
    
    const startPosition = camera.position.clone();
    const startTarget = controlsRef.current.target.clone();
    const startTime = Date.now();
    const duration = 800;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      camera.position.lerpVectors(startPosition, originalCameraPosition.current, eased);
      controlsRef.current.target.lerp(startTarget, new THREE.Vector3(0, 0, 0), eased);
      controlsRef.current.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }, [camera]);

  // Zoom to highlighted component when animating or step changes
  useEffect(() => {
    if (isAnimating && highlightedMeshRef.current) {
      // Small delay to ensure highlighting is applied first
      const timer = setTimeout(() => {
        zoomToMesh(highlightedMeshRef.current);
      }, 200);
      
      return () => clearTimeout(timer);
    } else if (!isAnimating && currentStep === 0) {
      // Reset camera when animation stops
      resetCamera();
    }
  }, [isAnimating, currentStep, zoomToMesh, resetCamera]);

  if (error || !scene) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={error ? "red" : "gray"} />
        </mesh>
        {error && (
          <mesh position={[0, -1.5, 0]}>
            <planeGeometry args={[4, 1]} />
            <meshBasicMaterial color="black" transparent opacity={0.7} />
          </mesh>
        )}
      </group>
    );
  }

  return (
    <>
      <primitive 
        ref={groupRef}
        object={scene} 
        scale={1} 
        position={[0, 0, 0]} 
      />
      <OrbitControls 
        ref={controlsRef}
        enableDamping 
        dampingFactor={0.05}
        enabled={!isZoomingRef.current} // Disable manual controls while zooming
      />
    </>
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
        <gridHelper args={[10, 10]} />
      </Canvas>
    </div>
  );
};

export default ModelViewer;

