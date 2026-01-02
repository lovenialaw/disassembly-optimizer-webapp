import React, { useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './KnowledgeGraph.css';

const KnowledgeGraph = ({ graphData, selectedParts, optimizationResult }) => {
  const graphRef = useRef();

  // Node color function
  const getNodeColor = (node) => {
    if (optimizationResult && optimizationResult.sequence && optimizationResult.sequence.includes(node.id)) {
      return '#e74c3c'; // Red for optimized path
    }
    if (selectedParts && selectedParts.includes(node.id)) {
      return '#3498db'; // Blue for selected
    }
    return '#95a5a6'; // Gray for default
  };

  // Handle engine stop with safe ref check
  const handleEngineStop = () => {
    if (graphRef.current && typeof graphRef.current.zoomToFit === 'function') {
      setTimeout(() => {
        graphRef.current.zoomToFit(400);
      }, 100);
    }
  };

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return <div className="graph-placeholder">Loading knowledge graph...</div>;
  }

  // Transform graph data to format expected by react-force-graph
  // Add safety checks for edge cases
  const transformedData = {
    nodes: (graphData.nodes || []).map(node => ({
      id: node.id || String(node),
      name: node.label || node.id || String(node),
      ...(node.properties || {})
    })),
    links: (graphData.edges || []).map(edge => ({
      source: edge.source || edge.from,
      target: edge.target || edge.to,
      type: edge.type || 'disassembles_to'
    }))
  };

  return (
    <div className="knowledge-graph">
      <ForceGraph2D
        ref={graphRef}
        graphData={transformedData}
        nodeColor={getNodeColor}
        nodeRelSize={8}
        nodeLabel={(node) => node.name || node.id}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name || node.id;
          const fontSize = 10 / Math.sqrt(globalScale);
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = getNodeColor(node);
          ctx.fillText(label, node.x, node.y + 12);
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        linkDistance={40}
        linkWidth={1}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
        d3Force={{
          charge: -300,
          linkDistance: 40,
          linkStrength: 0.7,
          centerStrength: 0.1
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;

