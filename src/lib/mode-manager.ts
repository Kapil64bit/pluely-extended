// Mode management system with state persistence and event handling

import { ResponseMode } from '../types/enhanced-response';

export type ModeSource = 'auto' | 'hotkey' | 'manual' | 'system';

export interface ModeChangeEvent {
  previousMode: ResponseMode;
  newMode: ResponseMode;
  source: ModeSource;
  timestamp: number;
  sessionId: string;
}

export interface ModeState {
  currentMode: ResponseMode;
  source: ModeSource;
  timestamp: number;
  sessionId: string;
  isTemporary: boolean;
  expiresAt?: number;
}

export interface ModeManagerConfig {
  defaultMode: ResponseMode;
  persistState: boolean;
  temporaryModeTimeout: number; // milliseconds
  enableEvents: boolean;
}

export type ModeChangeListener = (event: ModeChangeEvent) => void;

export class ModeManager {
  private currentState: ModeState;
  private config: ModeManagerConfig;
  private listeners: Set<ModeChangeListener> = new Set();
  private sessionId: string;
  private temporaryModeTimer: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'mode_manager_state';

  constructor(config?: Partial<ModeManagerConfig>) {
    this.config = {
      defaultMode: ResponseMode.THEORETICAL,
      persistState: true,
      temporaryModeTimeout: 300000, // 5 minutes
      enableEvents: true,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.currentState = this.initializeState();
    
    if (this.config.persistState) {
      this.loadPersistedState();
    }

    // Set up cleanup for temporary modes
    this.setupTemporaryModeCleanup();
  }

  /**
   * Get the current active mode
   */
  getCurrentMode(): ResponseMode {
    // Check if temporary mode has expired
    if (this.currentState.isTemporary && this.currentState.expiresAt) {
      if (Date.now() > this.currentState.expiresAt) {
        this.clearTemporaryMode();
      }
    }

    return this.currentState.currentMode;
  }

  /**
   * Set the current mode with source tracking
   */
  setMode(mode: ResponseMode, source: ModeSource, isTemporary: boolean = false): void {
    const previousMode = this.currentState.currentMode;
    const timestamp = Date.now();

    // Clear any existing temporary mode timer
    this.clearTemporaryModeTimer();

    // Create new state
    const newState: ModeState = {
      currentMode: mode,
      source,
      timestamp,
      sessionId: this.sessionId,
      isTemporary,
      expiresAt: isTemporary ? timestamp + this.config.temporaryModeTimeout : undefined
    };

    // Update current state
    this.currentState = newState;

    // Set up temporary mode timer if needed
    if (isTemporary) {
      this.setupTemporaryModeTimer();
    }

    // Persist state if enabled
    if (this.config.persistState && !isTemporary) {
      this.persistState();
    }

    // Emit mode change event
    if (this.config.enableEvents && previousMode !== mode) {
      this.emitModeChangeEvent({
        previousMode,
        newMode: mode,
        source,
        timestamp,
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Set temporary mode that expires after timeout
   */
  setTemporaryMode(mode: ResponseMode, source: ModeSource, timeoutMs?: number): void {
    const timeout = timeoutMs || this.config.temporaryModeTimeout;
    const previousMode = this.currentState.currentMode;
    const timestamp = Date.now();

    // Clear any existing temporary mode timer
    this.clearTemporaryModeTimer();

    // Create temporary state
    this.currentState = {
      currentMode: mode,
      source,
      timestamp,
      sessionId: this.sessionId,
      isTemporary: true,
      expiresAt: timestamp + timeout
    };

    // Set up timer to revert mode
    this.temporaryModeTimer = setTimeout(() => {
      this.clearTemporaryMode();
    }, timeout);

    // Emit mode change event
    if (this.config.enableEvents && previousMode !== mode) {
      this.emitModeChangeEvent({
        previousMode,
        newMode: mode,
        source,
        timestamp,
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Clear temporary mode and revert to default
   */
  clearTemporaryMode(): void {
    if (!this.currentState.isTemporary) {
      return;
    }

    const previousMode = this.currentState.currentMode;
    
    // Clear timer
    this.clearTemporaryModeTimer();

    // Load persisted state or use default
    const persistedState = this.loadPersistedState();
    if (persistedState && !persistedState.isTemporary) {
      this.currentState = persistedState;
    } else {
      this.currentState = this.initializeState();
    }

    // Emit mode change event if mode actually changed
    if (this.config.enableEvents && previousMode !== this.currentState.currentMode) {
      this.emitModeChangeEvent({
        previousMode,
        newMode: this.currentState.currentMode,
        source: 'system',
        timestamp: Date.now(),
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Get current mode state information
   */
  getModeState(): ModeState {
    return { ...this.currentState };
  }

  /**
   * Get available modes
   */
  getAvailableModes(): ResponseMode[] {
    return Object.values(ResponseMode);
  }

  /**
   * Check if current mode is temporary
   */
  isTemporaryMode(): boolean {
    return this.currentState.isTemporary;
  }

  /**
   * Get time remaining for temporary mode (in milliseconds)
   */
  getTemporaryModeTimeRemaining(): number {
    if (!this.currentState.isTemporary || !this.currentState.expiresAt) {
      return 0;
    }

    const remaining = this.currentState.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Add mode change event listener
   */
  addEventListener(listener: ModeChangeListener): void {
    this.listeners.add(listener);
  }

  /**
   * Remove mode change event listener
   */
  removeEventListener(listener: ModeChangeListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all event listeners
   */
  clearEventListeners(): void {
    this.listeners.clear();
  }

  /**
   * Reset to default mode
   */
  resetToDefault(): void {
    this.setMode(this.config.defaultMode, 'system');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ModeManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // If persistence was disabled, clear stored state
    if (!this.config.persistState) {
      this.clearPersistedState();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ModeManagerConfig {
    return { ...this.config };
  }

  /**
   * Export current state for debugging or backup
   */
  exportState(): {
    currentState: ModeState;
    config: ModeManagerConfig;
    sessionId: string;
    exportTimestamp: number;
  } {
    return {
      currentState: this.currentState,
      config: this.config,
      sessionId: this.sessionId,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clear all data and reset to defaults
   */
  reset(): void {
    this.clearTemporaryModeTimer();
    this.clearPersistedState();
    this.currentState = this.initializeState();
    this.sessionId = this.generateSessionId();
    this.listeners.clear();
  }

  /**
   * Dispose of the mode manager and clean up resources
   */
  dispose(): void {
    this.clearTemporaryModeTimer();
    this.listeners.clear();
    
    if (this.config.persistState) {
      this.persistState();
    }
  }

  /**
   * Private helper methods
   */
  private initializeState(): ModeState {
    return {
      currentMode: this.config.defaultMode,
      source: 'system',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      isTemporary: false
    };
  }

  private persistState(): void {
    if (!this.config.persistState || this.currentState.isTemporary) {
      return;
    }

    try {
      const stateToStore = {
        ...this.currentState,
        sessionId: this.sessionId // Update session ID for new session
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to persist mode state:', error);
    }
  }

  private loadPersistedState(): ModeState | null {
    if (!this.config.persistState) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const parsedState = JSON.parse(stored) as ModeState;
      
      // Validate the stored state
      if (!this.isValidModeState(parsedState)) {
        console.warn('Invalid persisted mode state, using default');
        this.clearPersistedState();
        return null;
      }

      // Don't restore temporary modes
      if (parsedState.isTemporary) {
        return null;
      }

      // Update session ID and timestamp for new session
      const restoredState: ModeState = {
        ...parsedState,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        source: 'system' // Mark as system restored
      };

      this.currentState = restoredState;
      return restoredState;
      
    } catch (error) {
      console.error('Failed to load persisted mode state:', error);
      this.clearPersistedState();
      return null;
    }
  }

  private clearPersistedState(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear persisted mode state:', error);
    }
  }

  private isValidModeState(state: any): state is ModeState {
    return (
      state &&
      typeof state === 'object' &&
      Object.values(ResponseMode).includes(state.currentMode) &&
      ['auto', 'hotkey', 'manual', 'system'].includes(state.source) &&
      typeof state.timestamp === 'number' &&
      typeof state.sessionId === 'string' &&
      typeof state.isTemporary === 'boolean'
    );
  }

  private setupTemporaryModeTimer(): void {
    if (!this.currentState.isTemporary || !this.currentState.expiresAt) {
      return;
    }

    const timeRemaining = this.currentState.expiresAt - Date.now();
    if (timeRemaining <= 0) {
      this.clearTemporaryMode();
      return;
    }

    this.temporaryModeTimer = setTimeout(() => {
      this.clearTemporaryMode();
    }, timeRemaining);
  }

  private clearTemporaryModeTimer(): void {
    if (this.temporaryModeTimer) {
      clearTimeout(this.temporaryModeTimer);
      this.temporaryModeTimer = null;
    }
  }

  private setupTemporaryModeCleanup(): void {
    // Check for expired temporary modes on initialization
    if (this.currentState.isTemporary && this.currentState.expiresAt) {
      if (Date.now() > this.currentState.expiresAt) {
        this.clearTemporaryMode();
      } else {
        this.setupTemporaryModeTimer();
      }
    }
  }

  private emitModeChangeEvent(event: ModeChangeEvent): void {
    // Emit to all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in mode change listener:', error);
      }
    });

    // Also emit as custom DOM event for broader integration
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('modechange', {
        detail: event
      });
      window.dispatchEvent(customEvent);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for global use
export const modeManager = new ModeManager();

// Export types for external use
export type { ModeChangeEvent, ModeState, ModeManagerConfig, ModeChangeListener };