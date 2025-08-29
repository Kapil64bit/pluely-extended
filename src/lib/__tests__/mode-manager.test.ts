// Tests for Mode Manager with state persistence and event handling

import { describe, it, expect, beforeEach, afterEach, jest } from './test-utils';
import { ResponseMode } from '../../types/enhanced-response';
import { ModeManager, ModeChangeEvent, ModeSource } from '../mode-manager';

// Mock localStorage
const mockLocalStorage = {
  store: new Map<string, string>(),
  getItem: jest.fn((key: string) => mockLocalStorage.store.get(key) || null),
  setItem: jest.fn((key: string, value: string) => mockLocalStorage.store.set(key, value)),
  removeItem: jest.fn((key: string) => mockLocalStorage.store.delete(key)),
  clear: jest.fn(() => mockLocalStorage.store.clear())
};

// Mock global localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock setTimeout and clearTimeout
const mockSetTimeout = jest.fn();
const mockClearTimeout = jest.fn();
global.setTimeout = mockSetTimeout;
global.clearTimeout = mockClearTimeout;

describe('ModeManager', () => {
  let modeManager: ModeManager;
  let eventListener: jest.MockedFunction<(event: ModeChangeEvent) => void>;

  beforeEach(() => {
    // Clear localStorage mock
    mockLocalStorage.store.clear();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    
    // Clear timer mocks
    mockSetTimeout.mockClear();
    mockClearTimeout.mockClear();

    // Create fresh mode manager instance
    modeManager = new ModeManager({
      defaultMode: ResponseMode.THEORETICAL,
      persistState: true,
      temporaryModeTimeout: 5000,
      enableEvents: true
    });

    // Create mock event listener
    eventListener = jest.fn();
  });

  afterEach(() => {
    modeManager.dispose();
  });

  describe('Basic Mode Management', () => {
    it('should initialize with default mode', () => {
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
    });

    it('should set and get current mode', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.CODING);
    });

    it('should track mode source', () => {
      modeManager.setMode(ResponseMode.MCQ, 'hotkey');
      const state = modeManager.getModeState();
      expect(state.source).toBe('hotkey');
      expect(state.currentMode).toBe(ResponseMode.MCQ);
    });

    it('should return available modes', () => {
      const availableModes = modeManager.getAvailableModes();
      expect(availableModes).toContain(ResponseMode.CODING);
      expect(availableModes).toContain(ResponseMode.MCQ);
      expect(availableModes).toContain(ResponseMode.VERBAL_INTERVIEW);
      expect(availableModes).toContain(ResponseMode.THEORETICAL);
    });
  });

  describe('State Persistence', () => {
    it('should persist mode state to localStorage', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'mode_manager_state',
        expect.stringContaining('"currentMode":"coding"')
      );
    });

    it('should load persisted state on initialization', () => {
      // Set up persisted state
      const persistedState = {
        currentMode: ResponseMode.MCQ,
        source: 'manual',
        timestamp: Date.now(),
        sessionId: 'test_session',
        isTemporary: false
      };
      
      mockLocalStorage.store.set('mode_manager_state', JSON.stringify(persistedState));

      // Create new manager instance
      const newManager = new ModeManager();
      expect(newManager.getCurrentMode()).toBe(ResponseMode.MCQ);
      
      newManager.dispose();
    });

    it('should not persist temporary modes', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey');
      
      // Should not call setItem for temporary modes
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle invalid persisted state gracefully', () => {
      // Set invalid state
      mockLocalStorage.store.set('mode_manager_state', 'invalid json');

      const newManager = new ModeManager();
      expect(newManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mode_manager_state');
      
      newManager.dispose();
    });

    it('should not restore temporary modes from persistence', () => {
      const temporaryState = {
        currentMode: ResponseMode.CODING,
        source: 'hotkey',
        timestamp: Date.now(),
        sessionId: 'test_session',
        isTemporary: true,
        expiresAt: Date.now() + 5000
      };
      
      mockLocalStorage.store.set('mode_manager_state', JSON.stringify(temporaryState));

      const newManager = new ModeManager();
      expect(newManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
      
      newManager.dispose();
    });
  });

  describe('Temporary Modes', () => {
    it('should set temporary mode with expiration', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey', 1000);
      
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.CODING);
      expect(modeManager.isTemporaryMode()).toBe(true);
      expect(modeManager.getTemporaryModeTimeRemaining()).toBeGreaterThan(0);
    });

    it('should clear temporary mode manually', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey');
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.CODING);
      
      modeManager.clearTemporaryMode();
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
      expect(modeManager.isTemporaryMode()).toBe(false);
    });

    it('should set up timer for temporary mode expiration', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey', 5000);
      
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should clear existing timer when setting new temporary mode', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey', 5000);
      const firstTimerId = mockSetTimeout.mock.calls[0];
      
      modeManager.setTemporaryMode(ResponseMode.MCQ, 'hotkey', 3000);
      
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockSetTimeout).toHaveBeenCalledTimes(2);
    });

    it('should return correct time remaining for temporary mode', () => {
      const timeout = 5000;
      const startTime = Date.now();
      
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey', timeout);
      
      const timeRemaining = modeManager.getTemporaryModeTimeRemaining();
      expect(timeRemaining).toBeLessThanOrEqual(timeout);
      expect(timeRemaining).toBeGreaterThan(timeout - 100); // Allow for small timing differences
    });
  });

  describe('Event System', () => {
    it('should emit mode change events', () => {
      modeManager.addEventListener(eventListener);
      
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      expect(eventListener).toHaveBeenCalledWith({
        previousMode: ResponseMode.THEORETICAL,
        newMode: ResponseMode.CODING,
        source: 'manual',
        timestamp: expect.any(Number),
        sessionId: expect.any(String)
      });
    });

    it('should not emit event when mode does not change', () => {
      modeManager.addEventListener(eventListener);
      
      modeManager.setMode(ResponseMode.THEORETICAL, 'manual'); // Same as current
      
      expect(eventListener).not.toHaveBeenCalled();
    });

    it('should support multiple event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      modeManager.addEventListener(listener1);
      modeManager.addEventListener(listener2);
      
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      modeManager.addEventListener(eventListener);
      modeManager.removeEventListener(eventListener);
      
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      expect(eventListener).not.toHaveBeenCalled();
    });

    it('should clear all event listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      modeManager.addEventListener(listener1);
      modeManager.addEventListener(listener2);
      modeManager.clearEventListeners();
      
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = jest.fn();
      
      modeManager.addEventListener(errorListener);
      modeManager.addEventListener(goodListener);
      
      // Should not throw and should still call good listener
      expect(() => {
        modeManager.setMode(ResponseMode.CODING, 'manual');
      }).not.toThrow();
      
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    it('should use custom configuration', () => {
      const customManager = new ModeManager({
        defaultMode: ResponseMode.CODING,
        persistState: false,
        temporaryModeTimeout: 10000,
        enableEvents: false
      });
      
      expect(customManager.getCurrentMode()).toBe(ResponseMode.CODING);
      expect(customManager.getConfig().persistState).toBe(false);
      expect(customManager.getConfig().temporaryModeTimeout).toBe(10000);
      
      customManager.dispose();
    });

    it('should update configuration', () => {
      modeManager.updateConfig({
        defaultMode: ResponseMode.MCQ,
        temporaryModeTimeout: 8000
      });
      
      const config = modeManager.getConfig();
      expect(config.defaultMode).toBe(ResponseMode.MCQ);
      expect(config.temporaryModeTimeout).toBe(8000);
      expect(config.persistState).toBe(true); // Should keep existing values
    });

    it('should clear persisted state when persistence is disabled', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      modeManager.updateConfig({ persistState: false });
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mode_manager_state');
    });
  });

  describe('Utility Methods', () => {
    it('should reset to default mode', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.CODING);
      
      modeManager.resetToDefault();
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
    });

    it('should export current state', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      
      const exported = modeManager.exportState();
      expect(exported.currentState.currentMode).toBe(ResponseMode.CODING);
      expect(exported.config).toBeDefined();
      expect(exported.sessionId).toBeDefined();
      expect(exported.exportTimestamp).toBeDefined();
    });

    it('should reset all data', () => {
      modeManager.setMode(ResponseMode.CODING, 'manual');
      modeManager.addEventListener(eventListener);
      
      modeManager.reset();
      
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mode_manager_state');
    });

    it('should dispose properly', () => {
      modeManager.setTemporaryMode(ResponseMode.CODING, 'hotkey');
      modeManager.addEventListener(eventListener);
      
      modeManager.dispose();
      
      expect(mockClearTimeout).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalled(); // Should persist final state
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      expect(() => {
        modeManager.setMode(ResponseMode.CODING, 'manual');
      }).not.toThrow();
    });

    it('should handle expired temporary mode on getCurrentMode', () => {
      // Manually set expired temporary mode
      const expiredState = {
        currentMode: ResponseMode.CODING,
        source: 'hotkey' as ModeSource,
        timestamp: Date.now() - 10000,
        sessionId: 'test',
        isTemporary: true,
        expiresAt: Date.now() - 1000 // Expired 1 second ago
      };
      
      // Access private property for testing
      (modeManager as any).currentState = expiredState;
      
      // Should automatically clear expired temporary mode
      expect(modeManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
      expect(modeManager.isTemporaryMode()).toBe(false);
    });

    it('should handle missing window object gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      modeManager.addEventListener(eventListener);
      
      expect(() => {
        modeManager.setMode(ResponseMode.CODING, 'manual');
      }).not.toThrow();
      
      expect(eventListener).toHaveBeenCalled();
      
      // Restore window
      (global as any).window = originalWindow;
    });
  });
});