import React from 'react';
import './ResultsPanel.css';

const ResultsPanel = ({ result }) => {
  if (!result) return null;

  return (
    <div className="results-panel">
      <h3>Optimization Results</h3>
      <div className="results-content">
        <div className="results-metrics">
          <h4>Metrics</h4>
          <div className="metric-item">
            <span className="metric-label">Total Time:</span>
            <span className="metric-value">{result.metrics?.total_time?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Total Cost:</span>
            <span className="metric-value">{result.metrics?.total_cost?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Average Difficulty:</span>
            <span className="metric-value">{result.metrics?.average_difficulty?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Efficiency Score:</span>
            <span className="metric-value">{result.metrics?.efficiency_score?.toFixed(4) || 'N/A'}</span>
          </div>
        </div>
        
        <div className="results-sequence">
          <h4>Disassembly Sequence</h4>
          <ol className="sequence-list">
            {result.sequence?.map((partId, index) => (
              <li key={index}>{partId}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;

