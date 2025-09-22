'use client';

import React, { useState, useEffect, useRef } from 'react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
}

interface TourProps {
  isActive: boolean;
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Quantly!',
    content: 'This tour will show you how to create and run backtests to test your trading strategies.',
    target: '.strategy-panel',
    position: 'right'
  },
  {
    id: 'strategies',
    title: 'Trading Strategies',
    content: 'Here you can see your trading strategies. Each strategy has parameters you can configure like RSI thresholds, moving average periods, and trade percentages.',
    target: '.strategy-list',
    position: 'right'
  },
  {
    id: 'add-strategy',
    title: 'Add New Strategy',
    content: 'Click this button to add new trading strategies. You can choose from RSI, MACD, Moving Averages, and more.',
    target: '.add-strategy-button',
    position: 'top'
  },
  {
    id: 'run-backtest',
    title: 'Run Backtest',
    content: 'Once you\'ve configured your strategies, click this button to run the backtest and see how your strategies would have performed.',
    target: '.run-backtest-button',
    position: 'top'
  },
  {
    id: 'charts',
    title: 'Price Charts',
    content: 'This area shows the stock price chart and technical indicators. You can scroll through time and zoom the Y-axis.',
    target: '.charts-container',
    position: 'left'
  },
  {
    id: 'time-range',
    title: 'Time Range Selector',
    content: 'Use these buttons to quickly select different time ranges for your analysis: 5 days, 30 days, 100 days, or 1 year.',
    target: '.time-range-selector',
    position: 'bottom'
  },
  {
    id: 'statistics',
    title: 'Backtest Results',
    content: 'After running a backtest, you\'ll see the results here including your starting value, final value, and total return.',
    target: '.statistics-panel',
    position: 'left'
  }
];

const Tour: React.FC<TourProps> = ({ isActive, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
      setIsVisible(true);
      calculateTooltipPosition();
    } else {
      setIsVisible(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (isVisible && currentStep < tourSteps.length) {
      calculateTooltipPosition();
    }
  }, [currentStep, isVisible]);

  const calculateTooltipPosition = () => {
    if (currentStep >= tourSteps.length) return;

    const step = tourSteps[currentStep];
    const targetElement = document.querySelector(step.target);
    
    if (!targetElement) {
      // If element not found, position in center
      setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    let x = 0;
    let y = 0;

    switch (step.position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 80;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 80;
        break;
      case 'left':
        x = rect.left - 160;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right + 160;
        y = rect.top + rect.height / 2;
        break;
    }

    setTooltipPosition({ x, y });
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    setIsVisible(false);
    onComplete();
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  // Create spotlight effect for the target element
  const targetElement = document.querySelector(currentTourStep.target);
  let highlightStyle = {};
  
  if (targetElement) {
    const rect = targetElement.getBoundingClientRect();
    // Add padding around the spotlight
    const padding = 8;
    const left = Math.max(0, rect.left - padding);
    const top = Math.max(0, rect.top - padding);
    const right = Math.min(window.innerWidth, rect.right + padding);
    const bottom = Math.min(window.innerHeight, rect.bottom + padding);
    
    highlightStyle = {
      clipPath: `polygon(
        0% 0%, 
        0% 100%, 
        ${left}px 100%, 
        ${left}px ${top}px, 
        ${right}px ${top}px, 
        ${right}px ${bottom}px, 
        ${left}px ${bottom}px, 
        ${left}px 100%, 
        100% 100%, 
        100% 0%
      )`
    };
  }

  return (
    <>
      {/* Dark overlay with spotlight effect */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          ...highlightStyle
        }}
        onClick={skipTour}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 max-w-sm rounded-lg shadow-lg"
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#2A2A2A',
          border: '1px solid #444',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Arrow pointer */}
        <div
          className="absolute w-3 h-3 rotate-45"
          style={{
            backgroundColor: '#2A2A2A',
            ...(() => {
              switch (currentTourStep.position) {
                case 'top':
                  return { 
                    bottom: '-6px', 
                    left: '50%', 
                    transform: 'translateX(-50%) rotate(45deg)', 
                    borderTop: 'none', 
                    borderLeft: 'none',
                    borderBottom: '1px solid #444',
                    borderRight: '1px solid #444'
                  };
                case 'bottom':
                  return { 
                    top: '-6px', 
                    left: '50%', 
                    transform: 'translateX(-50%) rotate(45deg)', 
                    borderBottom: 'none', 
                    borderRight: 'none',
                    borderTop: '1px solid #444',
                    borderLeft: '1px solid #444'
                  };
                case 'left':
                  return { 
                    right: '-6px', 
                    top: '50%', 
                    transform: 'translateY(-50%) rotate(45deg)', 
                    borderTop: 'none', 
                    borderRight: 'none',
                    borderBottom: '1px solid #444',
                    borderLeft: '1px solid #444'
                  };
                case 'right':
                  return { 
                    left: '-6px', 
                    top: '50%', 
                    transform: 'translateY(-50%) rotate(45deg)', 
                    borderBottom: 'none', 
                    borderLeft: 'none',
                    borderTop: '1px solid #444',
                    borderRight: '1px solid #444'
                  };
              }
            })()
          }}
        />

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#F9FAFB' }}>
            {currentTourStep.title}
          </h3>
          <p className="text-sm mb-4" style={{ color: '#9ca3af' }}>
            {currentTourStep.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#6b7280' }}>
                {currentStep + 1} of {tourSteps.length}
              </span>
              <div className="flex gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: index === currentStep ? '#10b981' : '#374151'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={skipTour}
                className="px-3 py-1 text-xs rounded transition-colors hover:bg-gray-600/50"
                style={{ color: '#9ca3af' }}
              >
                Skip
              </button>
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-3 py-1 text-xs rounded transition-colors hover:bg-gray-600/50"
                  style={{ color: '#F9FAFB', backgroundColor: '#374151' }}
                >
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-3 py-1 text-xs rounded transition-colors hover:bg-green-700"
                style={{ color: 'white', backgroundColor: '#10b981' }}
              >
                {isLastStep ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tour;