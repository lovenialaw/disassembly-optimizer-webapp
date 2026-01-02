import React, { useState, useEffect } from 'react';
import './App.css';
import ProductSelector from './components/ProductSelector';
import ModelViewer from './components/ModelViewer';
import KnowledgeGraph from './components/KnowledgeGraph';
import ParameterPanel from './components/ParameterPanel';
import PartSelector from './components/PartSelector';
import ResultsPanel from './components/ResultsPanel';
import AnimationControls from './components/AnimationControls';
import { getProducts, getProductMetadata, getProductGraph, optimizeDisassembly } from './services/api';

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

  const handleOptimize = async () => {
    if (!selectedProduct || selectedParts.length === 0) {
      alert('Please select a product and at least one part to disassemble');
      return;
    }

    try {
      const result = await optimizeDisassembly(selectedProduct, {
        target_parts: selectedParts,
        parameters: parameters
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

