import React, { useState, useEffect } from 'react';
import './ComponentProperties.css';

const ComponentProperties = ({ productId, selectedPart, onPropertiesChange }) => {
  const [properties, setProperties] = useState({
    safety_risk: 'Medium',
    tool: '',
    fastener: '',
    fastener_count: 2
  });

  useEffect(() => {
    // Reset properties when part changes
    setProperties({
      safety_risk: 'Medium',
      tool: '',
      fastener: '',
      fastener_count: 2
    });
  }, [selectedPart]);

  const handleChange = (key, value) => {
    const newProperties = {
      ...properties,
      [key]: value
    };
    setProperties(newProperties);
    onPropertiesChange(selectedPart, newProperties);
  };

  // Kettle properties
  if (productId === 'kettle') {
    return (
      <div className="component-properties">
        <label>Component Properties for: <strong>{selectedPart}</strong></label>
        <div className="properties-inputs">
          <div className="property-input">
            <label>Safety Risk</label>
            <select
              value={properties.safety_risk}
              onChange={(e) => handleChange('safety_risk', e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div className="property-input">
            <label>Fastener Type</label>
            <select
              value={properties.fastener}
              onChange={(e) => handleChange('fastener', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Snap fit">Snap fit</option>
              <option value="Spring">Spring</option>
              <option value="Screws">Screws</option>
              <option value="Wires">Wires</option>
            </select>
          </div>
          
          <div className="property-input">
            <label>Tool</label>
            <select
              value={properties.tool}
              onChange={(e) => handleChange('tool', e.target.value)}
            >
              <option value="">Select...</option>
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
              value={properties.fastener_count}
              onChange={(e) => handleChange('fastener_count', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>
    );
  }

  // Gearbox properties
  if (productId === 'gearbox') {
    return (
      <div className="component-properties">
        <label>Component Properties for: <strong>{selectedPart}</strong></label>
        <div className="properties-inputs">
          <div className="property-input">
            <label>Safety Risk</label>
            <select
              value={properties.safety_risk}
              onChange={(e) => handleChange('safety_risk', e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div className="property-input">
            <label>Tool</label>
            <input
              type="text"
              value={properties.tool}
              onChange={(e) => handleChange('tool', e.target.value)}
              placeholder="e.g., Pull, Screwdriver, etc."
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ComponentProperties;

