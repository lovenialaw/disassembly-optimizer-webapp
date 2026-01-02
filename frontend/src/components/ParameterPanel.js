import React from 'react';
import './ParameterPanel.css';

const ParameterPanel = ({ parameters, onUpdateParameters }) => {
  const handleChange = (key, value) => {
    onUpdateParameters({
      ...parameters,
      [key]: parseFloat(value) || 0
    });
  };

  const handleSelectChange = (key, value) => {
    onUpdateParameters({
      ...parameters,
      [key]: value
    });
  };

  return (
    <div className="parameter-panel">
      <label>Optimization Parameters</label>
      <div className="parameter-inputs">
        <div className="parameter-input">
          <label>Algorithm</label>
          <select
            value={parameters.algorithm || 'dijkstra'}
            onChange={(e) => handleSelectChange('algorithm', e.target.value)}
          >
            <option value="dijkstra">Dijkstra</option>
            <option value="genetic">Genetic Algorithm</option>
          </select>
        </div>
        {parameters.algorithm === 'genetic' && (
          <>
            <div className="parameter-input">
              <label>Retain Rate</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={parameters.retain || 0.5}
                onChange={(e) => handleChange('retain', e.target.value)}
              />
            </div>
            <div className="parameter-input">
              <label>Mutation Rate</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={parameters.mutation_rate || 0.2}
                onChange={(e) => handleChange('mutation_rate', e.target.value)}
              />
            </div>
            <div className="parameter-input">
              <label>Generations</label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={parameters.generations || 30}
                onChange={(e) => handleChange('generations', parseInt(e.target.value))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParameterPanel;

