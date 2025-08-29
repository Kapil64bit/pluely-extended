// Hook for managing enhanced response state and integration
import { useState, useCallback } from 'react';
import { ResponseMode, EnhancedResponse } from '@/types/enhanced-response';

export interface EnhancedResponseState {
  responses: Record<string, EnhancedResponse>;
  classifications: Record<string, any>;
  currentMode: ResponseMode;
  isEnhancedMode: boolean;
}

export const useEnhancedResponses = () => {
  const [state, setState] = useState<EnhancedResponseState>({
    responses: {},
    classifications: {},
    currentMode: ResponseMode.THEORETICAL,
    isEnhancedMode: true
  });

  const addEnhancedResponse = useCallback((messageId: string, response: EnhancedResponse) => {
    setState(prev => ({
      ...prev,
      responses: {
        ...prev.responses,
        [messageId]: response
      }
    }));
  }, []);

  const addClassificationResult = useCallback((messageId: string, classification: any) => {
    setState(prev => ({
      ...prev,
      classifications: {
        ...prev.classifications,
        [messageId]: classification
      }
    }));
  }, []);

  const setCurrentMode = useCallback((mode: ResponseMode) => {
    setState(prev => ({
      ...prev,
      currentMode: mode
    }));
  }, []);

  const toggleEnhancedMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isEnhancedMode: !prev.isEnhancedMode
    }));
  }, []);

  const clearResponses = useCallback(() => {
    setState(prev => ({
      ...prev,
      responses: {},
      classifications: {}
    }));
  }, []);

  const getEnhancedResponse = useCallback((messageId: string): EnhancedResponse | null => {
    return state.responses[messageId] || null;
  }, [state.responses]);

  const getClassificationResult = useCallback((messageId: string): any | null => {
    return state.classifications[messageId] || null;
  }, [state.classifications]);

  return {
    ...state,
    addEnhancedResponse,
    addClassificationResult,
    setCurrentMode,
    toggleEnhancedMode,
    clearResponses,
    getEnhancedResponse,
    getClassificationResult
  };
};