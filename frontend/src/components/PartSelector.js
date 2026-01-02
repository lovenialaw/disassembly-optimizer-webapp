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

  return (
    <div className="part-selector">
      <label>Select Parts to Disassemble</label>
      <div className="parts-list">
        {parts.map((part) => (
          <div key={part.id || part.name} className="part-item">
            <input
              type="checkbox"
              id={`part-${part.id || part.name}`}
              checked={selectedParts.includes(part.id || part.name)}
              onChange={() => handleTogglePart(part.id || part.name)}
            />
            <label htmlFor={`part-${part.id || part.name}`}>
              {part.name || part.id}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PartSelector;

