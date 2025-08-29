// Mode override management system for manual mode switching and user preferences

import { ResponseMode, ClassificationResult } from '../types/enhanced-response';
import { questionClassifier } from './question-classifier';
import { enhancedSettingsManager } from './enhanced-settings';

export interface ModeOverride {
  id: string;
  contentHash: string;
  originalMode: ResponseMode;
  overrideMode: ResponseMode;
  reason: 'manual' | 'hotkey' | 'correction' | 'preference';
  timestamp: number;
  confidence: number;
  sessionId: string;
}

export interface OverrideSession {
  id: string;
  startTime: number;
  overrides: ModeOverride[];
  activeMode?: ResponseMode;
  isTemporary: boolean;
}

export interface UserModePreferences {
  defaultMode?: ResponseMode;
  contentTypePreferences: Record<string, ResponseMode>; // content type -> preferred mode
  confidenceThresholds: Record<ResponseMode, number>; // mode -> minimum confidence
  autoOverrideRules: Array<{
    condition: string;
    targetMode: ResponseMode;
    enabled: boolean;
  }>;
}

export class ModeOverrideManager {
  private currentSession: OverrideSession;
  private overrideHistory: ModeOverride[] = [];
  private userPreferences: UserModePreferences;
  private temporaryOverride: ResponseMode | null = null;
  private readonly STORAGE_KEY = 'mode_override_data';
  private readonly MAX_HISTORY = 500;

  constructor() {
    this.currentSession = this.createNewSession();
    this.userPreferences = this.loadUserPreferences();
    this.loadOverrideData();
  }

  /**
   * Set manual mode override for current session
   */
  setManualOverride(
    mode: ResponseMode,
    content?: string,
    originalClassification?: ClassificationResult,
    isTemporary: boolean = false
  ): ModeOverride {
    const override: ModeOverride = {
      id: this.generateOverrideId(),
      contentHash: content ? this.hashContent(content) : '',
      originalMode: originalClassification?.mode || ResponseMode.THEORETICAL,
      overrideMode: mode,
      reason: 'manual',
      timestamp: Date.now(),
      confidence: 1.0,
      sessionId: this.currentSession.id
    };

    // Add to current session
    this.currentSession.overrides.push(override);
    this.currentSession.activeMode = mode;
    this.currentSession.isTemporary = isTemporary;

    // Add to history
    this.overrideHistory.push(override);

    // Set temporary override if specified
    if (isTemporary) {
      this.temporaryOverride = mode;
    } else {
      this.temporaryOverride = null;
      
      // Record in question classifier for learning
      if (content && originalClassification) {
        questionClassifier.setModeOverride(content, mode);
      }
    }

    this.saveOverrideData();
    return override;
  }

  /**
   * Set hotkey-triggered mode override
   */
  setHotkeyOverride(mode: ResponseMode): ModeOverride {
    const override: ModeOverride = {
      id: this.generateOverrideId(),
      contentHash: '',
      originalMode: this.getCurrentMode(),
      overrideMode: mode,
      reason: 'hotkey',
      timestamp: Date.now(),
      confidence: 1.0,
      sessionId: this.currentSession.id
    };

    // Add to current session
    this.currentSession.overrides.push(override);
    this.currentSession.activeMode = mode;
    this.currentSession.isTemporary = true; // Hotkey overrides are temporary by default

    // Set temporary override
    this.temporaryOverride = mode;

    // Add to history
    this.overrideHistory.push(override);
    this.saveOverrideData();

    return override;
  }

  /**
   * Set mode override based on user correction
   */
  setCorrectionOverride(
    correctedMode: ResponseMode,
    originalClassification: ClassificationResult,
    content: string
  ): ModeOverride {
    const override: ModeOverride = {
      id: this.generateOverrideId(),
      contentHash: this.hashContent(content),
      originalMode: originalClassification.mode,
      overrideMode: correctedMode,
      reason: 'correction',
      timestamp: Date.now(),
      confidence: 0.9,
      sessionId: this.currentSession.id
    };

    // Add to current session
    this.currentSession.overrides.push(override);

    // Record in question classifier for learning
    questionClassifier.recordUserFeedback(
      originalClassification,
      false, // Original was incorrect
      correctedMode,
      content
    );

    // Add to history
    this.overrideHistory.push(override);
    this.saveOverrideData();

    return override;
  }

  /**
   * Get current active mode (considering overrides)
   */
  getCurrentMode(): ResponseMode {
    // Check temporary override first
    if (this.temporaryOverride) {
      return this.temporaryOverride;
    }

    // Check current session active mode
    if (this.currentSession.activeMode) {
      return this.currentSession.activeMode;
    }

    // Check user default preference
    if (this.userPreferences.defaultMode) {
      return this.userPreferences.defaultMode;
    }

    // Default fallback
    return ResponseMode.THEORETICAL;
  }

  /**
   * Clear temporary override
   */
  clearTemporaryOverride(): void {
    this.temporaryOverride = null;
    
    if (this.currentSession.isTemporary) {
      this.currentSession.activeMode = undefined;
      this.currentSession.isTemporary = false;
    }
  }

  /**
   * Clear all overrides and start new session
   */
  clearAllOverrides(): void {
    this.temporaryOverride = null;
    this.currentSession = this.createNewSession();
    this.saveOverrideData();
  }

  /**
   * Get mode preference for content type
   */
  getModePreference(contentType: string): ResponseMode | undefined {
    return this.userPreferences.contentTypePreferences[contentType];
  }

  /**
   * Set mode preference for content type
   */
  setModePreference(contentType: string, mode: ResponseMode): void {
    this.userPreferences.contentTypePreferences[contentType] = mode;
    this.saveUserPreferences();
  }

  /**
   * Set default mode preference
   */
  setDefaultMode(mode: ResponseMode | undefined): void {
    this.userPreferences.defaultMode = mode;
    this.saveUserPreferences();
  }

  /**
   * Set confidence threshold for mode
   */
  setConfidenceThreshold(mode: ResponseMode, threshold: number): void {
    this.userPreferences.confidenceThresholds[mode] = Math.max(0, Math.min(1, threshold));
    this.saveUserPreferences();
  }

  /**
   * Add auto-override rule
   */
  addAutoOverrideRule(condition: string, targetMode: ResponseMode): void {
    this.userPreferences.autoOverrideRules.push({
      condition,
      targetMode,
      enabled: true
    });
    this.saveUserPreferences();
  }

  /**
   * Remove auto-override rule
   */
  removeAutoOverrideRule(index: number): void {
    if (index >= 0 && index < this.userPreferences.autoOverrideRules.length) {
      this.userPreferences.autoOverrideRules.splice(index, 1);
      this.saveUserPreferences();
    }
  }

  /**
   * Toggle auto-override rule
   */
  toggleAutoOverrideRule(index: number): void {
    if (index >= 0 && index < this.userPreferences.autoOverrideRules.length) {
      this.userPreferences.autoOverrideRules[index].enabled = 
        !this.userPreferences.autoOverrideRules[index].enabled;
      this.saveUserPreferences();
    }
  }

  /**
   * Check if classification should be overridden based on user rules
   */
  checkAutoOverride(
    classification: ClassificationResult,
    content: string
  ): ResponseMode | undefined {
    const contentLower = content.toLowerCase();
    
    for (const rule of this.userPreferences.autoOverrideRules) {
      if (!rule.enabled) continue;
      
      // Simple condition matching (can be enhanced with more sophisticated rules)
      if (contentLower.includes(rule.condition.toLowerCase())) {
        return rule.targetMode;
      }
    }

    // Check confidence thresholds
    const threshold = this.userPreferences.confidenceThresholds[classification.mode];
    if (threshold && classification.confidence < threshold) {
      // Look for alternative mode with higher confidence
      const alternatives = questionClassifier.getPersonalizedSuggestions(content);
      const betterAlternative = alternatives.find(alt => alt.confidence > threshold);
      
      if (betterAlternative) {
        return betterAlternative.mode;
      }
    }

    return undefined;
  }

  /**
   * Get override statistics
   */
  getOverrideStats(): {
    totalOverrides: number;
    overridesByReason: Record<string, number>;
    overridesByMode: Record<ResponseMode, number>;
    currentSessionOverrides: number;
    averageOverridesPerSession: number;
    mostOverriddenMode: ResponseMode | null;
  } {
    const totalOverrides = this.overrideHistory.length;
    const overridesByReason: Record<string, number> = {};
    const overridesByMode: Record<ResponseMode, number> = {
      [ResponseMode.MCQ]: 0,
      [ResponseMode.CODING]: 0,
      [ResponseMode.VERBAL_INTERVIEW]: 0,
      [ResponseMode.THEORETICAL]: 0
    };

    // Count overrides
    this.overrideHistory.forEach(override => {
      overridesByReason[override.reason] = (overridesByReason[override.reason] || 0) + 1;
      overridesByMode[override.overrideMode]++;
    });

    // Find most overridden mode
    let mostOverriddenMode: ResponseMode | null = null;
    let maxCount = 0;
    Object.entries(overridesByMode).forEach(([mode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostOverriddenMode = mode as ResponseMode;
      }
    });

    // Calculate session statistics
    const uniqueSessions = new Set(this.overrideHistory.map(o => o.sessionId)).size;
    const averageOverridesPerSession = uniqueSessions > 0 ? totalOverrides / uniqueSessions : 0;

    return {
      totalOverrides,
      overridesByReason,
      overridesByMode,
      currentSessionOverrides: this.currentSession.overrides.length,
      averageOverridesPerSession,
      mostOverriddenMode
    };
  }

  /**
   * Get recent overrides
   */
  getRecentOverrides(limit: number = 10): ModeOverride[] {
    return this.overrideHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): UserModePreferences {
    return { ...this.userPreferences };
  }

  /**
   * Export override data
   */
  exportOverrideData(): {
    overrideHistory: ModeOverride[];
    userPreferences: UserModePreferences;
    exportTimestamp: number;
    version: string;
  } {
    return {
      overrideHistory: this.overrideHistory,
      userPreferences: this.userPreferences,
      exportTimestamp: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Import override data
   */
  importOverrideData(data: ReturnType<typeof this.exportOverrideData>): boolean {
    try {
      if (data.version !== '1.0') {
        console.warn('Unsupported override data version:', data.version);
        return false;
      }

      this.overrideHistory = data.overrideHistory || [];
      this.userPreferences = { ...this.getDefaultPreferences(), ...data.userPreferences };
      
      this.saveOverrideData();
      this.saveUserPreferences();
      
      return true;
    } catch (error) {
      console.error('Failed to import override data:', error);
      return false;
    }
  }

  /**
   * Clear all data
   */
  clearAllData(): void {
    this.overrideHistory = [];
    this.currentSession = this.createNewSession();
    this.temporaryOverride = null;
    this.userPreferences = this.getDefaultPreferences();
    
    this.saveOverrideData();
    this.saveUserPreferences();
  }

  /**
   * Private helper methods
   */
  private createNewSession(): OverrideSession {
    return {
      id: this.generateSessionId(),
      startTime: Date.now(),
      overrides: [],
      isTemporary: false
    };
  }

  private getDefaultPreferences(): UserModePreferences {
    return {
      contentTypePreferences: {},
      confidenceThresholds: {
        [ResponseMode.MCQ]: 0.7,
        [ResponseMode.CODING]: 0.6,
        [ResponseMode.VERBAL_INTERVIEW]: 0.5,
        [ResponseMode.THEORETICAL]: 0.4
      },
      autoOverrideRules: []
    };
  }

  private loadUserPreferences(): UserModePreferences {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_preferences`);
      if (stored) {
        const data = JSON.parse(stored);
        return { ...this.getDefaultPreferences(), ...data };
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
    return this.getDefaultPreferences();
  }

  private saveUserPreferences(): void {
    try {
      localStorage.setItem(
        `${this.STORAGE_KEY}_preferences`, 
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  private loadOverrideData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.overrideHistory = data.overrideHistory || [];
        
        // Clean up old history
        if (this.overrideHistory.length > this.MAX_HISTORY) {
          this.overrideHistory = this.overrideHistory
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, this.MAX_HISTORY);
        }
      }
    } catch (error) {
      console.error('Failed to load override data:', error);
    }
  }

  private saveOverrideData(): void {
    try {
      const data = {
        overrideHistory: this.overrideHistory,
        currentSession: this.currentSession
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save override data:', error);
    }
  }

  private generateOverrideId(): string {
    return `override_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashContent(content: string): string {
    // Simple hash function for content identification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Singleton instance
export const modeOverrideManager = new ModeOverrideManager();