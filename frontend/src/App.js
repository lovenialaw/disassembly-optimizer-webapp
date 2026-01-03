import React, { useState, useEffect } from 'react';
import './App.css';
import ProductSelector from './components/ProductSelector';
import ModelViewer from './components/ModelViewer';
import KnowledgeGraph from './components/KnowledgeGraph';
import ParameterPanel from './components/ParameterPanel';
import PartSelector from './components/PartSelector';
import ComponentProperties from './components/ComponentProperties';
import EdgeProperties from './components/EdgeProperties';
import ResultsPanel from './components/ResultsPanel';
import AnimationControls from './components/AnimationControls';
import { getProducts, getProductMetadata, getProductGraph, optimizeDisassembly, getValidPaths } from './services/api';

function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productMetadata, setProductMetadata] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [parameters, setParameters] = useState({
    algorithm: 'dijkstra',
    retain: 0.5,
    mutation_rate: 0.2,
    generations: 30
  });
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationStep, setCurrentAnimationStep] = useState(0);
  const [componentProperties, setComponentProperties] = useState({});
  const [edgeProperties, setEdgeProperties] = useState({});
  const [validPathEdges, setValidPathEdges] = useState([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      loadProductData(selectedProduct);
    }
  }, [selectedProduct]);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
      if (data && data.length > 0) {
        setSelectedProduct(data[0].id);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Set empty state instead of crashing
      setProducts([]);
    }
  };

  const loadProductData = async (productId) => {
    try {
      const [metadata, graph] = await Promise.all([
        getProductMetadata(productId),
        getProductGraph(productId)
      ]);
      setProductMetadata(metadata);
      setGraphData(graph);
      setSelectedParts([]);
      setOptimizationResult(null);
    } catch (error) {
      console.error('Error loading product data:', error);
      // Set empty state instead of crashing
      setProductMetadata(null);
      setGraphData(null);
    }
  };

  const handleComponentPropertiesChange = (partId, properties) => {
    setComponentProperties(prev => ({
      ...prev,
      [partId]: properties
    }));
  };

  const handleEdgePropertiesChange = (properties) => {
    setEdgeProperties(properties);
  };

  const loadValidPaths = async (productId, targetPart) => {
    if (productId === 'kettle' && targetPart) {
      try {
        const data = await getValidPaths(productId, targetPart);
        setValidPathEdges(data.edges || []);
      } catch (error) {
        console.error('Error loading valid paths:', error);
        setValidPathEdges([]);
      }
    } else {
      setValidPathEdges([]);
    }
  };

  useEffect(() => {
    if (selectedProduct === 'kettle' && selectedParts.length > 0) {
      loadValidPaths(selectedProduct, selectedParts[0]);
    } else {
      setValidPathEdges([]);
    }
  }, [selectedProduct, selectedParts]);

  const handleOptimize = async () => {
    if (!selectedProduct || selectedParts.length === 0) {
      alert('Please select a product and a part to disassemble');
      return;
    }

    try {
      // For kettle, use edge properties; for gearbox, use component properties
      const properties = selectedProduct === 'kettle' ? edgeProperties : componentProperties;
      
      const result = await optimizeDisassembly(selectedProduct, {
        target_parts: selectedParts,
        parameters: parameters,
        component_properties: properties
      });
      setOptimizationResult(result);
      setCurrentAnimationStep(0);
    } catch (error) {
      console.error('Error optimizing disassembly:', error);
      alert('Error optimizing disassembly path');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Disassembly Optimization System</h1>
      </header>
      
      <div className="app-container">
        <div className="app-sidebar">
          <ProductSelector
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
          />
          
          {productMetadata && (
            <>
              <PartSelector
                parts={productMetadata.components || []}
                selectedParts={selectedParts}
                onSelectParts={setSelectedParts}
              />
              
              {selectedParts.length > 0 && (
                <>
                  {selectedProduct === 'kettle' ? (
                    <EdgeProperties
                      productId={selectedProduct}
                      edges={validPathEdges}
                      onPropertiesChange={handleEdgePropertiesChange}
                    />
                  ) : (
                    <ComponentProperties
                      productId={selectedProduct}
                      selectedPart={selectedParts[0]}
                      onPropertiesChange={handleComponentPropertiesChange}
                    />
                  )}
                  
                  <ParameterPanel
                    parameters={parameters}
                    onUpdateParameters={setParameters}
                  />
                  
                  <button 
                    className="optimize-button"
                    onClick={handleOptimize}
                  >
                    Optimize Disassembly
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div className="app-main">
          <div className="viewer-section">
            <div className="viewer-panel">
              <h2>3D Model Viewer</h2>
              {selectedProduct && (
                <ModelViewer
                  productId={selectedProduct}
                  metadata={productMetadata}
                  optimizationResult={optimizationResult}
                  isAnimating={isAnimating}
                  currentStep={currentAnimationStep}
                />
              )}
            </div>
            
            <div className="graph-panel">
              <h2>Knowledge Graph</h2>
              {graphData && (
                <KnowledgeGraph
                  graphData={graphData}
                  selectedParts={selectedParts}
                  optimizationResult={optimizationResult}
                />
              )}
            </div>
          </div>

          {optimizationResult && (
            <div className="results-section">
              <ResultsPanel result={optimizationResult} />
              <AnimationControls
                animationSteps={optimizationResult.animation_steps || []}
                isAnimating={isAnimating}
                currentStep={currentAnimationStep}
                onPlay={() => setIsAnimating(true)}
                onPause={() => setIsAnimating(false)}
                onStop={() => {
                  setIsAnimating(false);
                  setCurrentAnimationStep(0);
                }}
                onStepChange={setCurrentAnimationStep}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

