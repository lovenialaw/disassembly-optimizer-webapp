import React, { useState, useEffect } from 'react';
import './ComponentPropertiesPanel.css';

const ComponentPropertiesPanel = ({ 
  productId, 
  targetPart, 
  pathsData, 
  onPropertiesChange 
}) => {
  const [properties, setProperties] = useState({});

  useEffect(() => {
    if (!pathsData) return;
    
    // Initialize properties based on product type
    const initialProperties = {};
    
    if (productId === 'kettle') {
      // For kettle: properties for each edge
      if (pathsData.edges) {
        pathsData.edges.forEach(edge => {
          const edgeKey = `${edge.from}->${edge.to}`;
          initialProperties[edgeKey] = {
            safety_risk: 'Medium',
            fastener: 'Screws',
            tool: 'Hand',
            fastener_count: 2
          };
        });
      }
    } else {
      // For gearbox: safety risk and tool for each component
      if (pathsData.components) {
        pathsData.components.forEach(comp => {
          initialProperties[comp] = {
            safety_risk: 'Medium',
            disassembly_tool: 'Hand'
          };
        });
      }
    }
    
    setProperties(initialProperties);
    onPropertiesChange(initialProperties);
  }, [pathsData, productId, onPropertiesChange]);

  const handlePropertyChange = (key, field, value) => {
    const newProperties = {
      ...properties,
      [key]: {
        ...properties[key],
        [field]: value
      }
    };
    setProperties(newProperties);
    onPropertiesChange(newProperties);
  };

  if (!pathsData || !targetPart) {
    return null;
  }

  return (
    <div className="component-properties-panel">
      <h3>Component Properties</h3>
      <p className="properties-info">
        Configure properties for components involved in disassembly paths to <strong>{targetPart}</strong>
      </p>
      <p className="paths-count">
        Found {pathsData.paths?.length || 0} valid disassembly path(s)
      </p>
      
      <div className="properties-content">
        {productId === 'kettle' ? (
          // Kettle: Edge-based properties
          <div className="edge-properties">
            <h4>Disassembly Steps (Edges)</h4>
            {pathsData.edges && pathsData.edges.map((edge, index) => {
              const edgeKey = `${edge.from}->${edge.to}`;
              const edgeProps = properties[edgeKey] || {};
              
              return (
                <div key={index} className="property-group">
                  <div className="property-header">
                    <strong>{edge.from}</strong> → <strong>{edge.to}</strong>
                  </div>
                  <div className="property-inputs">
                    <div className="property-input">
                      <label>Safety Risk</label>
                      <select
                        value={edgeProps.safety_risk || 'Medium'}
                        onChange={(e) => handlePropertyChange(edgeKey, 'safety_risk', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="property-input">
                      <label>Fastener Type</label>
                      <select
                        value={edgeProps.fastener || 'Screws'}
                        onChange={(e) => handlePropertyChange(edgeKey, 'fastener', e.target.value)}
                      >
                        <option value="Snap fit">Snap fit</option>
                        <option value="Spring">Spring</option>
                        <option value="Screws">Screws</option>
                        <option value="Wires">Wires</option>
                      </select>
                    </div>
                    <div className="property-input">
                      <label>Tool Used</label>
                      <select
                        value={edgeProps.tool || 'Hand'}
                        onChange={(e) => handlePropertyChange(edgeKey, 'tool', e.target.value)}
                      >
                        <option value="Hand">Hand</option>
                        <option value="Pull">Pull</option>
                        <option value="Philips screwdriver">Philips screwdriver</option>
                        <option value="Wire cutter">Wire cutter</option>
                      </select>
                    </div>
                    <div className="property-input">
                      <label>Fastener Count</label>
                      <input
                        type="number"
                        min="1"
                        value={edgeProps.fastener_count || 2}
                        onChange={(e) => handlePropertyChange(edgeKey, 'fastener_count', parseInt(e.target.value) || 2)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Gearbox: Component-based properties
          <div className="component-properties">
            <h4>Component Properties</h4>
            {pathsData.components && pathsData.components.map((comp, index) => {
              const compProps = properties[comp] || {};
              
              return (
                <div key={index} className="property-group">
                  <div className="property-header">
                    <strong>{comp}</strong>
                  </div>
                  <div className="property-inputs">
                    <div className="property-input">
                      <label>Safety Risk</label>
                      <select
                        value={compProps.safety_risk || 'Medium'}
                        onChange={(e) => handlePropertyChange(comp, 'safety_risk', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div className="property-input">
                      <label>Disassembly Tool</label>
                      <select
                        value={compProps.disassembly_tool || 'Hand'}
                        onChange={(e) => handlePropertyChange(comp, 'disassembly_tool', e.target.value)}
                      >
                        <option value="Hand">Hand</option>
                        <option value="Pull">Pull</option>
                        <option value="Screwdriver">Screwdriver</option>
                        <option value="Wrench">Wrench</option>
                        <option value="Pliers">Pliers</option>
                        <option value="Snap ring pliers">Snap ring pliers</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPropertiesPanel;

