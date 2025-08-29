// Mode indicator component to show current response mode

import React, { useState, useEffect } from 'react';
import { ResponseMode } from '../types/enhanced-response';
import { modeManager, ModeChangeEvent } from '../lib/mode-manager';

interface ModeIndicatorProps {
  className?: string;
  showHotkeys?: boolean;
  compact?: boolean;
}

export const ModeIndicator: React.FC<ModeIndicatorProps> = ({ 
  className = '', 
  showHotkeys = true,
  compact = false 
}) => {
  const [currentMode, setCurrentMode] = useState<ResponseMode>(ResponseMode.THEORETICAL);
  const [isTemporary, setIsTemporary] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Initialize current mode
    setCurrentMode(modeManager.getCurrentMode());
    setIsTemporary(modeManager.isTemporaryMode());
    setTimeRemaining(modeManager.getTemporaryModeTimeRemaining());

    // Listen for mode changes
    const handleModeChange = (event: ModeChangeEvent) => {
      setCurrentMode(event.newMode);
      setIsTemporary(modeManager.isTemporaryMode());
      setTimeRemaining(modeManager.getTemporaryModeTimeRemaining());
    };

    modeManager.addEventListener(handleModeChange);

    // Update timer for temporary modes
    const timer = setInterval(() => {
      if (modeManager.isTemporaryMode()) {
        const remaining = modeManager.getTemporaryModeTimeRemaining();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          setCurrentMode(modeManager.getCurrentMode());
          setIsTemporary(false);
        }
      }
    }, 1000);

    return () => {
      modeManager.removeEventListener(handleModeChange);
      clearInterval(timer);
    };
  }, []);

  const getModeConfig = (mode: ResponseMode) => {
    const configs = {
      [ResponseMode.MCQ]: {
        name: 'MCQ',
        color: 'bg-blue-500',
        icon: '📝',
        hotkey: 'Ctrl+Alt+1',
        description: 'Multiple Choice Questions'
      },
      [ResponseMode.CODING]: {
        name: 'Coding',
        color: 'bg-green-500',
        icon: '💻',
        hotkey: 'Ctrl+Alt+2',
        description: 'Code Solutions'
      },
      [ResponseMode.VERBAL_INTERVIEW]: {
        name: 'Interview',
        color: 'bg-purple-500',
        icon: '🎤',
        hotkey: 'Ctrl+Alt+3',
        description: 'Verbal Interview Responses'
      },
      [ResponseMode.THEORETICAL]: {
        name: 'Theory',
        color: 'bg-gray-500',
        icon: '📚',
        hotkey: 'Ctrl+Alt+4',
        description: 'Theoretical Explanations'
      }
    };
    return configs[mode];
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const config = getModeConfig(currentMode);

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className={`w-3 h-3 rounded-full ${config.color}`} />
        <span className="text-sm font-medium">{config.name}</span>
        {isTemporary && timeRemaining > 0 && (
          <span className="text-xs text-gray-500">
            ({formatTimeRemaining(timeRemaining)})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full ${config.color} flex items-center justify-center`}>
            <span className="text-xs">{config.icon}</span>
          </div>
          <div>
            <div className="font-semibold text-gray-800">
              {config.name} Mode
              {isTemporary && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Temporary
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{config.description}</div>
            {showHotkeys && (
              <div className="text-xs text-gray-500 mt-1">
                Hotkey: {config.hotkey}
              </div>
            )}
          </div>
        </div>
        
        {isTemporary && timeRemaining > 0 && (
          <div className="text-right">
            <div className="text-sm font-medium text-gray-700">
              {formatTimeRemaining(timeRemaining)}
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>
        )}
      </div>
      
      {isTemporary && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-500 h-1 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.max(0, (timeRemaining / 300000) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using mode state in components
export const useCurrentMode = () => {
  const [currentMode, setCurrentMode] = useState<ResponseMode>(ResponseMode.THEORETICAL);
  const [isTemporary, setIsTemporary] = useState(false);

  useEffect(() => {
    setCurrentMode(modeManager.getCurrentMode());
    setIsTemporary(modeManager.isTemporaryMode());

    const handleModeChange = (event: ModeChangeEvent) => {
      setCurrentMode(event.newMode);
      setIsTemporary(modeManager.isTemporaryMode());
    };

    modeManager.addEventListener(handleModeChange);

    return () => {
      modeManager.removeEventListener(handleModeChange);
    };
  }, []);

  return {
    currentMode,
    isTemporary,
    setMode: (mode: ResponseMode, temporary = false) => {
      if (temporary) {
        modeManager.setTemporaryMode(mode, 'manual');
      } else {
        modeManager.setMode(mode, 'manual');
      }
    },
    resetToDefault: () => modeManager.resetToDefault(),
    clearTemporary: () => modeManager.clearTemporaryMode()
  };
};