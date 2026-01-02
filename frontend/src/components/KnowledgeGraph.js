import React, { useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './KnowledgeGraph.css';

const KnowledgeGraph = ({ graphData, selectedParts, optimizationResult }) => {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Clean color scheme
  const getNodeColor = (node) => {
    if (optimizationResult && optimizationResult.sequence && optimizationResult.sequence.includes(node.id)) {
      return '#E74C3C'; // Red for optimized path
    }
    if (selectedParts && selectedParts.includes(node.id)) {
      return '#3498DB'; // Blue for selected
    }
    if (hoveredNode && hoveredNode.id === node.id) {
      return '#5DADE2'; // Light blue for hover
    }
    return '#95A5A6'; // Gray for default
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
        nodeLabel={(node) => `${node.name || node.id}`}
        nodeCanvasObject={(node, ctx, globalScale) => {
          // Safety check: ensure node has valid coordinates
          if (typeof node.x !== 'number' || typeof node.y !== 'number' || 
              !isFinite(node.x) || !isFinite(node.y)) {
            return; // Skip rendering if coordinates are invalid
          }
          
          const label = node.name || node.id;
          const fontSize = Math.max(11, 13 / Math.sqrt(globalScale));
          const nodeRadius = 22;
          const isSelected = selectedParts && selectedParts.includes(node.id);
          const isInPath = optimizationResult && optimizationResult.sequence && optimizationResult.sequence.includes(node.id);
          const isHovered = hoveredNode && hoveredNode.id === node.id;
          
          // Draw main circle - simple solid color
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
          ctx.fillStyle = getNodeColor(node);
          ctx.fill();
          
          // Border - thicker for selected/path nodes
          ctx.strokeStyle = isSelected || isInPath ? '#FFFFFF' : '#34495E';
          ctx.lineWidth = isSelected || isInPath ? 3 / globalScale : 2 / globalScale;
          ctx.stroke();
          
          // Draw text inside circle
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Handle long labels - truncate if needed
          let displayLabel = label;
          const maxLength = Math.floor(nodeRadius * 2 / (fontSize * 0.55));
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
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={() => '#7F8C8D'}
        linkColor={() => '#BDC3C7'}
        linkCurvature={0.1}
        linkDistance={65}
        linkWidth={(link) => {
          // Highlight links in optimized path
          if (optimizationResult && optimizationResult.sequence) {
            const seq = optimizationResult.sequence;
            const sourceIdx = seq.indexOf(link.source.id || link.source);
            const targetIdx = seq.indexOf(link.target.id || link.target);
            if (sourceIdx >= 0 && targetIdx >= 0 && targetIdx === sourceIdx + 1) {
              return 2.5; // Thicker for path links
            }
          }
          return 1.5;
        }}
        cooldownTicks={100}
        onEngineStop={handleEngineStop}
        d3Force={{
          charge: -450,
          linkDistance: 65,
          linkStrength: 0.75,
          centerStrength: 0.2,
          collision: { radius: 26 }
        }}
      />
    </div>
  );
};

export default KnowledgeGraph;

