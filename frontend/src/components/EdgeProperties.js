import React, { useState, useEffect } from 'react';
import './ComponentProperties.css';

const EdgeProperties = ({ productId, edges, onPropertiesChange }) => {
  const [edgeProperties, setEdgeProperties] = useState({});

  useEffect(() => {
    // Initialize properties for all edges
    const initialProps = {};
    edges.forEach(edge => {
      const edgeKey = `${edge.from}->${edge.to}`;
      initialProps[edgeKey] = {
        safety_risk: 'Medium',
        fastener: 'Screws',
        tool: 'Hand',
        fastener_count: 2
      };
    });
    setEdgeProperties(initialProps);
    // Notify parent of initial values
    onPropertiesChange(initialProps);
  }, [edges]);

  const handleChange = (edgeKey, key, value) => {
    const newProps = {
      ...edgeProperties,
      [edgeKey]: {
        ...edgeProperties[edgeKey],
        [key]: value
      }
    };
    setEdgeProperties(newProps);
    onPropertiesChange(newProps);
  };

  if (productId !== 'kettle' || !edges || edges.length === 0) {
    return null;
  }

  return (
    <div className="component-properties">
      <label>Edge Properties for Disassembly Connections</label>
      <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem' }}>
        Enter properties for each connection (u → v) in the valid disassembly paths
      </p>
      <div className="edges-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {edges.map((edge, index) => {
          const edgeKey = `${edge.from}->${edge.to}`;
          const props = edgeProperties[edgeKey] || {
            safety_risk: 'Medium',
            fastener: 'Screws',
            tool: 'Hand',
            fastener_count: 2
          };

          return (
            <div key={edgeKey} style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#2c3e50' }}>
                {edge.from} → {edge.to}
              </div>
              <div className="properties-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <div className="property-input">
                  <label>Safety Risk</label>
                  <select
                    value={props.safety_risk}
                    onChange={(e) => handleChange(edgeKey, 'safety_risk', e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                
                <div className="property-input">
                  <label>Fastener Type</label>
                  <select
                    value={props.fastener}
                    onChange={(e) => handleChange(edgeKey, 'fastener', e.target.value)}
                  >
                    <option value="Snap fit">Snap fit</option>
                    <option value="Spring">Spring</option>
                    <option value="Screws">Screws</option>
                    <option value="Wires">Wires</option>
                  </select>
                </div>
                
                <div className="property-input">
                  <label>Tool</label>
                  <select
                    value={props.tool}
                    onChange={(e) => handleChange(edgeKey, 'tool', e.target.value)}
                  >
                    <option value="Hand">Hand</option>
                    <option value="Pull">Pull</option>
                    <option value="Philips screwdriver">Philips screwdriver</option>
                    <option value="Wire cutter">Wire cutter</option>
                  </select>
                </div>
                
                <div className="property-input">
                  <label>Number of Fasteners</label>
                  <input
                    type="number"
                    min="0"
                    value={props.fastener_count}
                    onChange={(e) => handleChange(edgeKey, 'fastener_count', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EdgeProperties;

