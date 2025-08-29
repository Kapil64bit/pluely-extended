// React hook for hotkey integration

import { useEffect, useState } from 'react';
import { hotkeyManager, ToastNotification } from '../lib/hotkey-manager';
import { ResponseMode } from '../types/enhanced-response';

export const useHotkeys = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [status, setStatus] = useState(hotkeyManager.getStatus());

  useEffect(() => {
    // Initialize hotkey manager
    const initializeHotkeys = async () => {
      try {
        await hotkeyManager.initialize();
        setStatus(hotkeyManager.getStatus());
      } catch (error) {
        console.error('Failed to initialize hotkeys:', error);
      }
    };

    initializeHotkeys();

    // Listen for toast notifications
    const handleToast = (toast: ToastNotification) => {
      setToasts(prev => [...prev, toast]);
      
      // Auto-dismiss toasts after their duration
      setTimeout(() => {
        setToasts(current => current.filter(t => t.id !== toast.id));
      }, toast.duration);
    };

    hotkeyManager.addToastListener(handleToast);

    // Listen for custom toast events from DOM
    const handleToastEvent = (event: CustomEvent<ToastNotification>) => {
      handleToast(event.detail);
    };

    window.addEventListener('toast', handleToastEvent as EventListener);

    // Listen for Tauri hotkey events
    const handleTauriHotkey = (event: CustomEvent) => {
      const { mode } = event.detail;
      if (Object.values(ResponseMode).includes(mode)) {
        hotkeyManager.handleHotkeyActivation(mode);
        setStatus(hotkeyManager.getStatus());
      }
    };

    window.addEventListener('tauri://hotkey', handleTauriHotkey as EventListener);

    // Listen for mode switch events
    const handleModeSwitch = (event: CustomEvent) => {
      setStatus(hotkeyManager.getStatus());
    };

    window.addEventListener('mode-switched', handleModeSwitch as EventListener);

    return () => {
      hotkeyManager.removeToastListener(handleToast);
      window.removeEventListener('toast', handleToastEvent as EventListener);
      window.removeEventListener('tauri://hotkey', handleTauriHotkey as EventListener);
      window.removeEventListener('mode-switched', handleModeSwitch as EventListener);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showToast = (options: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    hotkeyManager.showToast(options);
  };

  const toggleHotkeys = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    hotkeyManager.setEnabled(newState);
    setStatus(hotkeyManager.getStatus());
    
    showToast({
      message: `Hotkeys ${newState ? 'enabled' : 'disabled'}`,
      type: newState ? 'success' : 'warning',
      duration: 2000
    });
  };

  const getHotkeyString = (mode: ResponseMode): string => {
    return hotkeyManager.getHotkeyString(mode);
  };

  const testHotkey = async (mode: ResponseMode) => {
    await hotkeyManager.testHotkey(mode);
  };

  const refreshHotkeys = async () => {
    try {
      await hotkeyManager.refresh();
      setStatus(hotkeyManager.getStatus());
      showToast({
        message: 'Hotkeys refreshed',
        type: 'success',
        duration: 2000
      });
    } catch (error) {
      showToast({
        message: 'Failed to refresh hotkeys',
        type: 'error',
        duration: 3000
      });
    }
  };

  return {
    isEnabled,
    toasts,
    status,
    dismissToast,
    showToast,
    toggleHotkeys,
    getHotkeyString,
    testHotkey,
    refreshHotkeys,
    clearAllToasts: () => setToasts([])
  };
};

// Hook for listening to specific hotkey events
export const useHotkeyListener = (callback: (mode: ResponseMode) => void) => {
  useEffect(() => {
    const handleHotkeyEvent = (event: CustomEvent) => {
      const { mode } = event.detail;
      if (Object.values(ResponseMode).includes(mode)) {
        callback(mode);
      }
    };

    window.addEventListener('tauri://hotkey', handleHotkeyEvent as EventListener);

    return () => {
      window.removeEventListener('tauri://hotkey', handleHotkeyEvent as EventListener);
    };
  }, [callback]);
};