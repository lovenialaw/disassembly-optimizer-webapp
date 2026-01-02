import React, { useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './KnowledgeGraph.css';

const KnowledgeGraph = ({ graphData, selectedParts, optimizationResult }) => {
  const graphRef = useRef();

  useEffect(() => {
    if (graphRef.current && graphData) {
      // Highlight nodes based on selection
      graphRef.current.nodeColor((node) => {
        if (optimizationResult && optimizationResult.sequence.includes(node.id)) {
          return '#e74c3c'; // Red for optimized path
        }
        if (selectedParts.includes(node.id)) {
          return '#3498db'; // Blue for selected
        }
        return '#95a5a6'; // Gray for default
      });
    }
  }, [graphData, selectedParts, optimizationResult]);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="graph-placeholder">Loading knowledge graph...</div>;
  }

  // Transform graph data to format expected by react-force-graph
  const transformedData = {
    nodes: graphData.nodes.map(node => ({
      id: node.id,
      name: node.label || node.id,
      ...node.properties
    })),
    links: graphData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type
    }))
  };

  return (
    <div className="knowledge-graph">
      <ForceGraph2D
        ref={graphRef}
        graphData={transformedData}
        nodeLabel={(node) => node.name || node.id}
        nodeRelSize={6}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        cooldownTicks={100}
        onEngineStop={() => graphRef.current.zoomToFit(400)}
      />
    </div>
  );
};

export default KnowledgeGraph;

