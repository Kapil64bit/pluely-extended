// Enhanced settings management for response modes and configurations

import { 
  ResponseMode, 
  StealthLevel, 
  UserPreferences, 
  ModeConfiguration,
  StealthConfiguration 
} from '../types/enhanced-response';
import { 
  MODE_CONFIGURATIONS, 
  STEALTH_CONFIGURATIONS, 
  DEFAULT_ENHANCED_SETTINGS 
} from '../config/enhanced-modes';

const ENHANCED_SETTINGS_KEY = 'enhanced_settings';

export interface EnhancedSettings {
  currentMode: ResponseMode;
  autoClassification: boolean;
  classificationConfidenceThreshold: number;
  stealthLevel: StealthLevel;
  userPreferences: UserPreferences;
  modeOverrides: Partial<Record<ResponseMode, Partial<ModeConfiguration>>>;
  lastModeChange: {
    timestamp: number;
    source: 'auto' | 'hotkey' | 'manual';
    previousMode: ResponseMode;
  } | null;
}

class EnhancedSettingsManager {
  private settings: EnhancedSettings;
  private listeners: Array<(settings: EnhancedSettings) => void> = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  // Load settings from localStorage
  private loadSettings(): EnhancedSettings {
    try {
      const stored = localStorage.getItem(ENHANCED_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_ENHANCED_SETTINGS,
          ...parsed,
          userPreferences: {
            ...DEFAULT_ENHANCED_SETTINGS.userPreferences,
            ...parsed.userPreferences
          }
        };
      }
    } catch (error) {
      console.warn('Failed to load enhanced settings:', error);
    }
    return { ...DEFAULT_ENHANCED_SETTINGS, modeOverrides: {}, lastModeChange: null };
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem(ENHANCED_SETTINGS_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save enhanced settings:', error);
    }
  }

  // Get current settings
  getSettings(): EnhancedSettings {
    return { ...this.settings };
  }

  // Get current response mode
  getCurrentMode(): ResponseMode {
    return this.settings.currentMode;
  }

  // Set response mode
  setMode(mode: ResponseMode, source: 'auto' | 'hotkey' | 'manual' = 'manual'): void {
    const previousMode = this.settings.currentMode;
    this.settings.currentMode = mode;
    this.settings.lastModeChange = {
      timestamp: Date.now(),
      source,
      previousMode
    };
    this.saveSettings();
  }

  // Get stealth level
  getStealthLevel(): StealthLevel {
    return this.settings.stealthLevel;
  }

  // Set stealth level
  setStealthLevel(level: StealthLevel): void {
    this.settings.stealthLevel = level;
    this.settings.userPreferences.stealthLevel = level;
    this.saveSettings();
  }

  // Get user preferences
  getUserPreferences(): UserPreferences {
    return { ...this.settings.userPreferences };
  }

  // Update user preferences
  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.settings.userPreferences = {
      ...this.settings.userPreferences,
      ...preferences
    };
    this.saveSettings();
  }

  // Get mode configuration (with user overrides applied)
  getModeConfiguration(mode: ResponseMode): ModeConfiguration {
    const baseConfig = MODE_CONFIGURATIONS[mode];
    const overrides = this.settings.modeOverrides[mode] || {};
    
    return {
      ...baseConfig,
      ...overrides
    };
  }

  // Set mode configuration override
  setModeConfigurationOverride(mode: ResponseMode, override: Partial<ModeConfiguration>): void {
    if (!this.settings.modeOverrides) {
      this.settings.modeOverrides = {};
    }
    this.settings.modeOverrides[mode] = {
      ...this.settings.modeOverrides[mode],
      ...override
    };
    this.saveSettings();
  }

  // Get stealth configuration
  getStealthConfiguration(): StealthConfiguration {
    return STEALTH_CONFIGURATIONS[this.settings.stealthLevel];
  }

  // Auto-classification settings
  isAutoClassificationEnabled(): boolean {
    return this.settings.autoClassification;
  }

  setAutoClassification(enabled: boolean): void {
    this.settings.autoClassification = enabled;
    this.saveSettings();
  }

  getClassificationConfidenceThreshold(): number {
    return this.settings.classificationConfidenceThreshold;
  }

  setClassificationConfidenceThreshold(threshold: number): void {
    this.settings.classificationConfidenceThreshold = Math.max(0, Math.min(1, threshold));
    this.saveSettings();
  }

  // Event listeners
  addListener(listener: (settings: EnhancedSettings) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (settings: EnhancedSettings) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.settings);
      } catch (error) {
        console.error('Error in settings listener:', error);
      }
    });
  }

  // Utility methods
  getAvailableModes(): ResponseMode[] {
    return Object.values(ResponseMode);
  }

  getAvailableStealthLevels(): StealthLevel[] {
    return Object.values(StealthLevel);
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.settings = { ...DEFAULT_ENHANCED_SETTINGS, modeOverrides: {}, lastModeChange: null };
    this.saveSettings();
  }

  // Export/Import settings
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      // Validate the imported settings structure
      if (this.validateSettings(imported)) {
        this.settings = {
          ...DEFAULT_ENHANCED_SETTINGS,
          ...imported,
          userPreferences: {
            ...DEFAULT_ENHANCED_SETTINGS.userPreferences,
            ...imported.userPreferences
          }
        };
        this.saveSettings();
        return true;
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
    }
    return false;
  }

  private validateSettings(settings: any): boolean {
    // Basic validation of settings structure
    return (
      settings &&
      typeof settings === 'object' &&
      Object.values(ResponseMode).includes(settings.currentMode) &&
      typeof settings.autoClassification === 'boolean' &&
      typeof settings.classificationConfidenceThreshold === 'number' &&
      Object.values(StealthLevel).includes(settings.stealthLevel)
    );
  }
}

// Singleton instance
export const enhancedSettingsManager = new EnhancedSettingsManager();

// Convenience functions
export const getCurrentMode = () => enhancedSettingsManager.getCurrentMode();
export const setCurrentMode = (mode: ResponseMode, source?: 'auto' | 'hotkey' | 'manual') => 
  enhancedSettingsManager.setMode(mode, source);
export const getUserPreferences = () => enhancedSettingsManager.getUserPreferences();
export const getStealthLevel = () => enhancedSettingsManager.getStealthLevel();
export const getModeConfiguration = (mode: ResponseMode) => 
  enhancedSettingsManager.getModeConfiguration(mode);
export const getStealthConfiguration = () => enhancedSettingsManager.getStealthConfiguration();