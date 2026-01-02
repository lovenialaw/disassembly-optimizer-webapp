import React, { useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './KnowledgeGraph.css';

const KnowledgeGraph = ({ graphData, selectedParts, optimizationResult }) => {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Neo4j-style node color function
  const getNodeColor = (node) => {
    if (optimizationResult && optimizationResult.sequence && optimizationResult.sequence.includes(node.id)) {
      return '#FF6B6B'; // Neo4j red for optimized path
    }
    if (selectedParts && selectedParts.includes(node.id)) {
      return '#4ECDC4'; // Neo4j teal for selected
    }
    if (hoveredNode && hoveredNode.id === node.id) {
      return '#95E1D3'; // Light teal for hover
    }
    return '#68A7AD'; // Neo4j blue-gray for default
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
    <div className="knowledge-graph neo4j-style">
      <ForceGraph2D
        ref={graphRef}
        graphData={transformedData}
        nodeColor={getNodeColor}
        nodeRelSize={0}
        nodeLabel={(node) => `${node.name || node.id}`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name || node.id;
          const fontSize = Math.max(10, 12 / Math.sqrt(globalScale));
          const nodeRadius = 24;
          const isSelected = selectedParts && selectedParts.includes(node.id);
          const isInPath = optimizationResult && optimizationResult.sequence && optimizationResult.sequence.includes(node.id);
          const isHovered = hoveredNode && hoveredNode.id === node.id;
          
          // Draw outer glow for selected/hovered nodes
          if (isSelected || isInPath || isHovered) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius + 3, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node) + '40'; // 40 = 25% opacity
            ctx.fill();
          }
          
          // Draw main circle with Neo4j style
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          
          // Gradient fill for Neo4j look
          const gradient = ctx.createRadialGradient(
            node.x - nodeRadius * 0.3, 
            node.y - nodeRadius * 0.3, 
            0,
            node.x, 
            node.y, 
            nodeRadius
          );
          const baseColor = getNodeColor(node);
          gradient.addColorStop(0, baseColor + 'FF');
          gradient.addColorStop(1, baseColor + 'CC');
          ctx.fillStyle = gradient;
          ctx.fill();
          
          // Border
          ctx.strokeStyle = isSelected || isInPath ? '#FFFFFF' : '#2C3E50';
          ctx.lineWidth = isSelected || isInPath ? 3 / globalScale : 2 / globalScale;
          ctx.stroke();
          
          // Draw text inside circle
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Handle long labels - truncate if needed
          let displayLabel = label;
          const maxLength = Math.floor(nodeRadius * 2 / (fontSize * 0.6));
          if (label.length > maxLength) {
            displayLabel = label.substring(0, maxLength - 3) + '...';
          }
          
          ctx.fillText(displayLabel, node.x, node.y);
        }}
        onNodeHover={(node) => {
          setHoveredNode(node || null);
        }}
        onNodeDrag={(node) => {
          // Fix node position while dragging
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node) => {
          // Release node after dragging (can be moved freely)
          node.fx = null;
          node.fy = null;
        }}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#68A7AD'}
        linkColor={() => '#68A7AD80'} // Semi-transparent
        linkCurvature={0.15}
        linkDistance={70}
        linkWidth={(link) => {
          // Highlight links in optimized path
          if (optimizationResult && optimizationResult.sequence) {
            const seq = optimizationResult.sequence;
            const sourceIdx = seq.indexOf(link.source.id || link.source);
            const targetIdx = seq.indexOf(link.target.id || link.target);
            if (sourceIdx >= 0 && targetIdx >= 0 && targetIdx === sourceIdx + 1) {
              return 3; // Thicker for path links
            }
          }
          return 1.5;
        }}
        linkDirectionalParticles={0}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
        d3Force={{
          charge: -500,
          linkDistance: 70,
          linkStrength: 0.7,
          centerStrength: 0.15,
          collision: { radius: 28 }
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;

