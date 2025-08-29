// Toast notification component for mode switching feedback

import React, { useState, useEffect } from 'react';
import { ToastNotification } from '../lib/hotkey-manager';

interface ToastProps {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-dismiss timer
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
    }, toast.duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
  };

  const getToastStyles = () => {
    const baseStyles = "px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform";
    const visibilityStyles = isVisible 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    let colorStyles = "";
    switch (toast.type) {
      case 'success':
        colorStyles = "bg-green-500 text-white border-l-4 border-green-600";
        break;
      case 'info':
        colorStyles = "bg-blue-500 text-white border-l-4 border-blue-600";
        break;
      case 'warning':
        colorStyles = "bg-yellow-500 text-black border-l-4 border-yellow-600";
        break;
      case 'error':
        colorStyles = "bg-red-500 text-white border-l-4 border-red-600";
        break;
      default:
        colorStyles = "bg-gray-500 text-white border-l-4 border-gray-600";
    }
    
    return `${baseStyles} ${colorStyles} ${visibilityStyles}`;
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'info':
        return 'ℹ';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return '';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center justify-between space-x-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold">{getIcon()}</span>
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-lg hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          style={{ 
            zIndex: 1000 + index,
            marginTop: index > 0 ? '8px' : '0'
          }}
        >
          <Toast toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToasts = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newToast: ToastNotification = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return {
    toasts,
    addToast,
    dismissToast,
    clearAllToasts
  };
};