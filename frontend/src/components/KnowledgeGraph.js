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
        nodeRelSize={0}
        nodeLabel={(node) => node.name || node.id}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name || node.id;
          const fontSize = 9 / Math.sqrt(globalScale);
          const nodeRadius = 20;
          
          // Draw circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();
          ctx.strokeStyle = '#2c3e50';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();
          
          // Draw text inside circle
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Handle long labels - truncate if needed
          let displayLabel = label;
          if (label.length > 15) {
            displayLabel = label.substring(0, 12) + '...';
          }
          
          ctx.fillText(displayLabel, node.x, node.y);
        }}
        onNodeDrag={(node) => {
          // Allow nodes to be dragged
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node) => {
          // Release node after dragging
          node.fx = null;
          node.fy = null;
        }}
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        linkDistance={60}
        linkWidth={1.5}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
        d3Force={{
          charge: -400,
          linkDistance: 60,
          linkStrength: 0.8,
          centerStrength: 0.2,
          collision: { radius: 25 }
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;

