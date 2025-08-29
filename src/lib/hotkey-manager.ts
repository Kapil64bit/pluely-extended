// Hotkey management system for mode switching

import { ResponseMode } from '../types/enhanced-response';
import { modeManager } from './mode-manager';
import { invoke } from '@tauri-apps/api/core';

export interface HotkeyConfig {
  key: string;
  modifiers: string[];
  mode: ResponseMode;
  description: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  duration: number;
  timestamp: number;
}

export type ToastListener = (toast: ToastNotification) => void;

export class HotkeyManager {
  private hotkeyConfigs: HotkeyConfig[] = [
    {
      key: '1',
      modifiers: ['Ctrl', 'Alt'],
      mode: ResponseMode.MCQ,
      description: 'Switch to MCQ mode'
    },
    {
      key: '2',
      modifiers: ['Ctrl', 'Alt'],
      mode: ResponseMode.CODING,
      description: 'Switch to Coding mode'
    },
    {
      key: '3',
      modifiers: ['Ctrl', 'Alt'],
      mode: ResponseMode.VERBAL_INTERVIEW,
      description: 'Switch to Verbal Interview mode'
    },
    {
      key: '4',
      modifiers: ['Ctrl', 'Alt'],
      mode: ResponseMode.THEORETICAL,
      description: 'Switch to Theoretical mode'
    }
  ];

  private isEnabled: boolean = true;
  private toastListeners: Set<ToastListener> = new Set();
  private registeredHotkeys: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Initialize and register all hotkeys
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're in a Tauri environment
      if (typeof window === 'undefined' || !window.__TAURI__) {
        console.warn('Hotkey manager: Not in Tauri environment, skipping initialization');
        return;
      }

      await this.registerAllHotkeys();
      console.log('Hotkey manager initialized successfully');
      
      // Show initialization toast
      this.showToast({
        message: 'Hotkeys enabled (Ctrl+Alt+1-4)',
        type: 'info',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to initialize hotkey manager:', error);
      this.showToast({
        message: 'Failed to initialize hotkeys',
        type: 'warning',
        duration: 3000
      });
      throw error;
    }
  }

  /**
   * Register all configured hotkeys with the Tauri backend
   */
  private async registerAllHotkeys(): Promise<void> {
    for (const config of this.hotkeyConfigs) {
      try {
        await this.registerHotkey(config);
      } catch (error) {
        console.error(`Failed to register hotkey for ${config.mode}:`, error);
      }
    }
  }

  /**
   * Register a single hotkey with the backend
   */
  private async registerHotkey(config: HotkeyConfig): Promise<void> {
    const hotkeyString = this.formatHotkeyString(config);
    
    try {
      // Register with Tauri backend
      await invoke('register_hotkey', {
        id: `mode_switch_${config.mode}`,
        hotkey: hotkeyString,
        mode: config.mode
      });

      this.registeredHotkeys.add(hotkeyString);
      console.log(`Registered hotkey: ${hotkeyString} for ${config.mode} mode`);
    } catch (error) {
      console.error(`Failed to register hotkey ${hotkeyString}:`, error);
      throw error;
    }
  }

  /**
   * Unregister all hotkeys
   */
  async unregisterAllHotkeys(): Promise<void> {
    try {
      await invoke('unregister_all_hotkeys');
      this.registeredHotkeys.clear();
      console.log('All hotkeys unregistered');
    } catch (error) {
      console.error('Failed to unregister hotkeys:', error);
    }
  }

  /**
   * Handle hotkey activation from backend
   */
  handleHotkeyActivation(mode: ResponseMode): void {
    if (!this.isEnabled) {
      console.log('Hotkey activation ignored - hotkeys disabled');
      return;
    }

    try {
      // Get current mode for comparison
      const currentMode = modeManager.getCurrentMode();
      
      if (currentMode === mode) {
        // Already in this mode, show info toast
        this.showToast({
          message: `Already in ${this.getModeDisplayName(mode)} mode`,
          type: 'info',
          duration: 2000
        });
        return;
      }

      // Switch mode using mode manager
      modeManager.setTemporaryMode(mode, 'hotkey', 300000); // 5 minutes temporary

      // Show success toast notification
      this.showToast({
        message: `Switched to ${this.getModeDisplayName(mode)} mode (Hotkey)`,
        type: 'success',
        duration: 3000
      });

      console.log(`Hotkey activated: Switched from ${currentMode} to ${mode} mode`);
      
      // Emit custom event for other components to listen
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('mode-switched', { 
          detail: { 
            previousMode: currentMode, 
            newMode: mode, 
            source: 'hotkey' 
          } 
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error handling hotkey activation:', error);
      this.showToast({
        message: 'Failed to switch mode',
        type: 'error',
        duration: 3000
      });
    }
  }

  /**
   * Enable or disable hotkey processing
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`Hotkey manager ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if hotkeys are enabled
   */
  isHotkeyEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get all configured hotkeys
   */
  getHotkeyConfigs(): HotkeyConfig[] {
    return [...this.hotkeyConfigs];
  }

  /**
   * Update hotkey configuration
   */
  async updateHotkeyConfig(mode: ResponseMode, newConfig: Partial<HotkeyConfig>): Promise<void> {
    const configIndex = this.hotkeyConfigs.findIndex(config => config.mode === mode);
    
    if (configIndex === -1) {
      throw new Error(`No hotkey configuration found for mode: ${mode}`);
    }

    // Unregister old hotkey
    const oldConfig = this.hotkeyConfigs[configIndex];
    const oldHotkeyString = this.formatHotkeyString(oldConfig);
    
    try {
      await invoke('unregister_hotkey', { id: `mode_switch_${mode}` });
      this.registeredHotkeys.delete(oldHotkeyString);
    } catch (error) {
      console.warn('Failed to unregister old hotkey:', error);
    }

    // Update configuration
    this.hotkeyConfigs[configIndex] = { ...oldConfig, ...newConfig };

    // Register new hotkey
    await this.registerHotkey(this.hotkeyConfigs[configIndex]);
  }

  /**
   * Show toast notification
   */
  showToast(options: Omit<ToastNotification, 'id' | 'timestamp'>): void {
    const toast: ToastNotification = {
      id: this.generateToastId(),
      timestamp: Date.now(),
      ...options
    };

    // Emit to listeners
    this.toastListeners.forEach(listener => {
      try {
        listener(toast);
      } catch (error) {
        console.error('Error in toast listener:', error);
      }
    });

    // Also emit as DOM event
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', { detail: toast });
      window.dispatchEvent(event);
    }
  }

  /**
   * Add toast notification listener
   */
  addToastListener(listener: ToastListener): void {
    this.toastListeners.add(listener);
  }

  /**
   * Remove toast notification listener
   */
  removeToastListener(listener: ToastListener): void {
    this.toastListeners.delete(listener);
  }

  /**
   * Get hotkey string for display
   */
  getHotkeyString(mode: ResponseMode): string {
    const config = this.hotkeyConfigs.find(c => c.mode === mode);
    return config ? this.formatHotkeyString(config) : '';
  }

  /**
   * Check if a hotkey combination is available
   */
  async isHotkeyAvailable(key: string, modifiers: string[]): Promise<boolean> {
    const hotkeyString = `${modifiers.join('+')}+${key}`;
    
    try {
      const result = await invoke('is_hotkey_available', { hotkey: hotkeyString });
      return result as boolean;
    } catch (error) {
      console.error('Failed to check hotkey availability:', error);
      return false;
    }
  }

  /**
   * Get hotkey status and information
   */
  getStatus(): {
    isEnabled: boolean;
    registeredCount: number;
    configurations: HotkeyConfig[];
    isInitialized: boolean;
  } {
    return {
      isEnabled: this.isEnabled,
      registeredCount: this.registeredHotkeys.size,
      configurations: this.getHotkeyConfigs(),
      isInitialized: this.registeredHotkeys.size > 0
    };
  }

  /**
   * Test hotkey functionality
   */
  async testHotkey(mode: ResponseMode): Promise<void> {
    console.log(`Testing hotkey for mode: ${mode}`);
    this.handleHotkeyActivation(mode);
  }

  /**
   * Get all registered hotkey strings
   */
  getRegisteredHotkeys(): string[] {
    return Array.from(this.registeredHotkeys);
  }

  /**
   * Refresh hotkey registrations
   */
  async refresh(): Promise<void> {
    console.log('Refreshing hotkey registrations...');
    await this.unregisterAllHotkeys();
    await this.registerAllHotkeys();
    console.log('Hotkey registrations refreshed');
  }

  /**
   * Dispose of the hotkey manager
   */
  async dispose(): Promise<void> {
    await this.unregisterAllHotkeys();
    this.toastListeners.clear();
    console.log('Hotkey manager disposed');
  }

  /**
   * Private helper methods
   */
  private setupEventListeners(): void {
    // Listen for hotkey events from Tauri backend
    if (typeof window !== 'undefined') {
      window.addEventListener('tauri://hotkey', (event: any) => {
        const { mode } = event.detail;
        if (Object.values(ResponseMode).includes(mode)) {
          this.handleHotkeyActivation(mode);
        }
      });
    }
  }

  private formatHotkeyString(config: HotkeyConfig): string {
    return `${config.modifiers.join('+')}+${config.key}`;
  }

  private getModeDisplayName(mode: ResponseMode): string {
    const displayNames = {
      [ResponseMode.MCQ]: 'MCQ',
      [ResponseMode.CODING]: 'Coding',
      [ResponseMode.VERBAL_INTERVIEW]: 'Verbal Interview',
      [ResponseMode.THEORETICAL]: 'Theoretical'
    };
    return displayNames[mode] || mode;
  }

  private generateToastId(): string {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const hotkeyManager = new HotkeyManager();

// Auto-initialize when imported (can be disabled if needed)
if (typeof window !== 'undefined') {
  hotkeyManager.initialize().catch(error => {
    console.error('Failed to auto-initialize hotkey manager:', error);
  });
}