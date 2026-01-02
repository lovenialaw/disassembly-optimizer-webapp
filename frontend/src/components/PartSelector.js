import React from 'react';
import './PartSelector.css';

const PartSelector = ({ parts, selectedParts, onSelectParts }) => {
  const handleTogglePart = (partId) => {
    if (selectedParts.includes(partId)) {
      onSelectParts(selectedParts.filter(id => id !== partId));
    } else {
      onSelectParts([...selectedParts, partId]);
    }
  };

  if (!parts || parts.length === 0) {
    return (
      <div className="part-selector">
        <label>Select Parts to Disassemble</label>
        <div className="parts-list">
          <p>No parts available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="part-selector">
      <label>Select Parts to Disassemble</label>
      <div className="parts-list">
        {parts.map((part, index) => {
          // Handle different metadata formats
          const partId = part.id || part.name || part.component || `part-${index}`;
          const partName = part.name || part.component || part.id || `Part ${index + 1}`;
          
          return (
            <div key={partId} className="part-item">
              <input
                type="checkbox"
                id={`part-${partId}`}
                checked={selectedParts.includes(partId)}
                onChange={() => handleTogglePart(partId)}
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

