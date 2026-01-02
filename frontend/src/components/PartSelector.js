import React from 'react';
import './PartSelector.css';

const PartSelector = ({ parts, selectedParts, onSelectParts }) => {
  const handleSelectPart = (partId) => {
    // Single selection - replace array with single item
    onSelectParts([partId]);
  };

  if (!parts || parts.length === 0) {
    return (
      <div className="part-selector">
        <label>Select Part to Disassemble</label>
        <div className="parts-list">
          <p>No parts available</p>
        </div>
      </div>
    );
  }

  // Get selected part (first item in array)
  const selectedPart = selectedParts && selectedParts.length > 0 ? selectedParts[0] : null;

  return (
    <div className="part-selector">
      <label>Select Part to Disassemble</label>
      <div className="parts-list">
        {parts.map((part, index) => {
          // Handle different metadata formats
          const partId = part.id || part.name || part.component || `part-${index}`;
          const partName = part.name || part.component || part.id || `Part ${index + 1}`;
          
          return (
            <div key={partId} className="part-item">
              <input
                type="radio"
                name="selected-part"
                id={`part-${partId}`}
                checked={selectedPart === partId}
                onChange={() => handleSelectPart(partId)}
              />
              <label htmlFor={`part-${partId}`}>
                {partName}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PartSelector;

