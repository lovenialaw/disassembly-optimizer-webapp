import React, { useEffect } from 'react';
import './AnimationControls.css';

const AnimationControls = ({
  animationSteps,
  isAnimating,
  currentStep,
  onPlay,
  onPause,
  onStop,
  onStepChange
}) => {
  useEffect(() => {
    if (isAnimating && animationSteps.length > 0) {
      const step = animationSteps[currentStep];
      if (step) {
        const timer = setTimeout(() => {
          if (currentStep < animationSteps.length - 1) {
            onStepChange(currentStep + 1);
          } else {
            onPause();
          }
        }, (step.duration || 1) * 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [isAnimating, currentStep, animationSteps, onStepChange, onPause]);

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < animationSteps.length - 1) {
      onStepChange(currentStep + 1);
    }
  };

  return (
    <div className="animation-controls">
      <div className="controls-buttons">
        <button onClick={onPlay} disabled={isAnimating}>
          ▶ Play
        </button>
        <button onClick={onPause} disabled={!isAnimating}>
          ⏸ Pause
        </button>
        <button onClick={onStop}>
          ⏹ Stop
        </button>
        <button onClick={handlePrevious} disabled={currentStep === 0}>
          ⏮ Previous
        </button>
        <button onClick={handleNext} disabled={currentStep >= animationSteps.length - 1}>
          ⏭ Next
        </button>
      </div>
      <div className="step-indicator">
        Step {currentStep + 1} of {animationSteps.length}
        {animationSteps[currentStep] && (
          <span className="step-info">
            - {animationSteps[currentStep].part_id}
          </span>
        )}
      </div>
    </div>
  );
};

export default AnimationControls;

