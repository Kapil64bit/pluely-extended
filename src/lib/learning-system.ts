// Learning system for improving classification accuracy through user feedback

import { ResponseMode, ClassificationResult } from '../types/enhanced-response';

export interface UserFeedback {
  id: string;
  timestamp: number;
  originalClassification: ClassificationResult;
  userCorrectedMode?: ResponseMode;
  isCorrect: boolean;
  confidence: number;
  contentHash: string;
  sessionId: string;
  processingTime: number;
}

export interface LearningPattern {
  contentFeatures: string[];
  expectedMode: ResponseMode;
  confidence: number;
  successRate: number;
  sampleCount: number;
  lastUpdated: number;
}

export interface LearningInsights {
  totalFeedback: number;
  accuracyRate: number;
  modeAccuracy: Record<ResponseMode, number>;
  commonMistakes: Array<{
    from: ResponseMode;
    to: ResponseMode;
    frequency: number;
    examples: string[];
  }>;
  improvementSuggestions: string[];
  confidenceCalibration: {
    overconfident: number; // High confidence but wrong
    underconfident: number; // Low confidence but right
    wellCalibrated: number; // Confidence matches accuracy
  };
}

export class LearningSystem {
  private feedbackHistory: UserFeedback[] = [];
  private learningPatterns: Map<string, LearningPattern> = new Map();
  private sessionId: string = this.generateSessionId();
  private readonly STORAGE_KEY = 'classification_learning_data';
  private readonly MAX_FEEDBACK_HISTORY = 1000;
  private readonly PATTERN_MIN_SAMPLES = 3;

  constructor() {
    this.loadLearningData();
  }

  /**
   * Record user feedback on a classification
   */
  recordFeedback(
    originalClassification: ClassificationResult,
    isCorrect: boolean,
    userCorrectedMode?: ResponseMode,
    content?: string
  ): UserFeedback {
    const feedback: UserFeedback = {
      id: this.generateFeedbackId(),
      timestamp: Date.now(),
      originalClassification,
      userCorrectedMode,
      isCorrect,
      confidence: originalClassification.confidence,
      contentHash: content ? this.hashContent(content) : '',
      sessionId: this.sessionId,
      processingTime: 0 // Will be set by caller if available
    };

    this.feedbackHistory.push(feedback);
    this.updateLearningPatterns(feedback, content);
    this.pruneOldFeedback();
    this.saveLearningData();

    return feedback;
  }

  /**
   * Get classification adjustment based on learned patterns
   */
  getClassificationAdjustment(
    classification: ClassificationResult,
    contentFeatures: string[]
  ): {
    adjustedMode?: ResponseMode;
    confidenceAdjustment: number;
    reasoning: string;
  } {
    const patternKey = this.generatePatternKey(contentFeatures);
    const pattern = this.learningPatterns.get(patternKey);

    if (!pattern || pattern.sampleCount < this.PATTERN_MIN_SAMPLES) {
      return {
        confidenceAdjustment: 0,
        reasoning: 'No learned pattern available'
      };
    }

    // Check if learned pattern suggests different mode
    if (pattern.expectedMode !== classification.mode && pattern.successRate > 0.7) {
      return {
        adjustedMode: pattern.expectedMode,
        confidenceAdjustment: pattern.confidence - classification.confidence,
        reasoning: `Learned pattern suggests ${pattern.expectedMode} mode (${pattern.successRate.toFixed(2)} success rate from ${pattern.sampleCount} samples)`
      };
    }

    // Adjust confidence based on historical accuracy
    const modeAccuracy = this.getModeAccuracy(classification.mode);
    const confidenceAdjustment = (modeAccuracy - 0.5) * 0.2; // Scale adjustment

    return {
      confidenceAdjustment,
      reasoning: `Confidence adjusted based on ${classification.mode} mode accuracy: ${modeAccuracy.toFixed(2)}`
    };
  }

  /**
   * Get learning insights and statistics
   */
  getLearningInsights(): LearningInsights {
    const totalFeedback = this.feedbackHistory.length;
    
    if (totalFeedback === 0) {
      return this.getEmptyInsights();
    }

    const correctFeedback = this.feedbackHistory.filter(f => f.isCorrect);
    const accuracyRate = correctFeedback.length / totalFeedback;

    // Calculate mode-specific accuracy
    const modeAccuracy: Record<ResponseMode, number> = {
      [ResponseMode.MCQ]: 0,
      [ResponseMode.CODING]: 0,
      [ResponseMode.VERBAL_INTERVIEW]: 0,
      [ResponseMode.THEORETICAL]: 0
    };
    (Object.values(ResponseMode) as ResponseMode[]).forEach(mode => {
      const modeFeedback = this.feedbackHistory.filter(f => f.originalClassification.mode === mode);
      const modeCorrect = modeFeedback.filter(f => f.isCorrect);
      modeAccuracy[mode] = modeFeedback.length > 0 ? modeCorrect.length / modeFeedback.length : 0;
    });

    // Identify common mistakes
    const commonMistakes = this.identifyCommonMistakes();

    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(accuracyRate, modeAccuracy, commonMistakes);

    // Calculate confidence calibration
    const confidenceCalibration = this.calculateConfidenceCalibration();

    return {
      totalFeedback,
      accuracyRate,
      modeAccuracy,
      commonMistakes,
      improvementSuggestions,
      confidenceCalibration
    };
  }

  /**
   * Get personalized classification suggestions based on user patterns
   */
  getPersonalizedSuggestions(contentFeatures: string[]): Array<{
    mode: ResponseMode;
    confidence: number;
    reasoning: string;
  }> {
    const suggestions: Array<{
      mode: ResponseMode;
      confidence: number;
      reasoning: string;
    }> = [];

    // Find matching patterns
  for (const [_patternKey, pattern] of this.learningPatterns.entries()) {
      const featureOverlap = this.calculateFeatureOverlap(contentFeatures, pattern.contentFeatures);
      
      if (featureOverlap > 0.5 && pattern.sampleCount >= this.PATTERN_MIN_SAMPLES) {
        suggestions.push({
          mode: pattern.expectedMode,
          confidence: pattern.confidence * featureOverlap,
          reasoning: `Based on ${pattern.sampleCount} similar cases with ${pattern.successRate.toFixed(2)} success rate`
        });
      }
    }

    // Sort by confidence and return top suggestions
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Export learning data for backup or analysis
   */
  exportLearningData(): {
    feedbackHistory: UserFeedback[];
    learningPatterns: Array<{
      key: string;
      pattern: LearningPattern;
    }>;
    exportTimestamp: number;
    version: string;
  } {
    return {
      feedbackHistory: this.feedbackHistory,
      learningPatterns: Array.from(this.learningPatterns.entries()).map(([key, pattern]) => ({
        key,
        pattern
      })),
      exportTimestamp: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Import learning data from backup
   */
  importLearningData(data: ReturnType<typeof this.exportLearningData>): boolean {
    try {
      if (data.version !== '1.0') {
        console.warn('Unsupported learning data version:', data.version);
        return false;
      }

      this.feedbackHistory = data.feedbackHistory || [];
      this.learningPatterns.clear();
      
      data.learningPatterns.forEach(({ key, pattern }) => {
        this.learningPatterns.set(key, pattern);
      });

      this.saveLearningData();
      return true;
    } catch (error) {
      console.error('Failed to import learning data:', error);
      return false;
    }
  }

  /**
   * Clear all learning data
   */
  clearLearningData(): void {
    this.feedbackHistory = [];
    this.learningPatterns.clear();
    this.sessionId = this.generateSessionId();
    this.saveLearningData();
  }

  /**
   * Get recent feedback for debugging
   */
  getRecentFeedback(limit: number = 10): UserFeedback[] {
    return this.feedbackHistory
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Private helper methods
   */
  private updateLearningPatterns(feedback: UserFeedback, content?: string): void {
    if (!content) return;

    const contentFeatures = this.extractContentFeatures(content, feedback.originalClassification);
    const patternKey = this.generatePatternKey(contentFeatures);
    
    const expectedMode = feedback.isCorrect 
      ? feedback.originalClassification.mode 
      : feedback.userCorrectedMode || feedback.originalClassification.mode;

    const existingPattern = this.learningPatterns.get(patternKey);
    
    if (existingPattern) {
      // Update existing pattern
      const newSampleCount = existingPattern.sampleCount + 1;
      const newSuccessCount = existingPattern.successRate * existingPattern.sampleCount + (feedback.isCorrect ? 1 : 0);
      
      existingPattern.sampleCount = newSampleCount;
      existingPattern.successRate = newSuccessCount / newSampleCount;
      existingPattern.confidence = this.calculatePatternConfidence(existingPattern);
      existingPattern.lastUpdated = Date.now();
      
      if (expectedMode !== existingPattern.expectedMode && !feedback.isCorrect) {
        existingPattern.expectedMode = expectedMode;
      }
    } else {
      // Create new pattern
      const newPattern: LearningPattern = {
        contentFeatures,
        expectedMode,
        confidence: feedback.confidence,
        successRate: feedback.isCorrect ? 1.0 : 0.0,
        sampleCount: 1,
        lastUpdated: Date.now()
      };
      
      this.learningPatterns.set(patternKey, newPattern);
    }
  }

  private extractContentFeatures(content: string, classification: ClassificationResult): string[] {
    const features: string[] = [];
    const contentLower = content.toLowerCase();

    // Add detected features from classification
    features.push(...classification.detectedFeatures);

    // Add content-based features
    if (contentLower.includes('function')) features.push('has_function');
    if (contentLower.includes('class')) features.push('has_class');
    if (contentLower.includes('?')) features.push('has_question_mark');
    if (/[A-D]\)/g.test(content)) features.push('has_mcq_options');
    if (contentLower.includes('tell me')) features.push('has_conversational_cue');
    if (contentLower.includes('implement')) features.push('has_implementation_request');

    // Add length-based features
    if (content.length < 100) features.push('short_content');
    else if (content.length > 500) features.push('long_content');
    else features.push('medium_content');

    return features;
  }

  private generatePatternKey(features: string[]): string {
    return features.sort().join('|');
  }

  private calculatePatternConfidence(pattern: LearningPattern): number {
    // Confidence increases with sample count and success rate
    const sampleWeight = Math.min(pattern.sampleCount / 10, 1); // Max weight at 10 samples
    const baseConfidence = pattern.successRate * 0.8 + 0.2; // Minimum 0.2 confidence
    
    return baseConfidence * sampleWeight;
  }

  private getModeAccuracy(mode: ResponseMode): number {
    const modeFeedback = this.feedbackHistory.filter(f => f.originalClassification.mode === mode);
    if (modeFeedback.length === 0) return 0.5; // Default neutral accuracy
    
    const correctCount = modeFeedback.filter(f => f.isCorrect).length;
    return correctCount / modeFeedback.length;
  }

  private identifyCommonMistakes(): Array<{
    from: ResponseMode;
    to: ResponseMode;
    frequency: number;
    examples: string[];
  }> {
    const mistakes = new Map<string, {
      from: ResponseMode;
      to: ResponseMode;
      count: number;
      examples: string[];
    }>();

    this.feedbackHistory
      .filter(f => !f.isCorrect && f.userCorrectedMode)
      .forEach(feedback => {
        const key = `${feedback.originalClassification.mode}->${feedback.userCorrectedMode}`;
        const existing = mistakes.get(key);
        
        if (existing) {
          existing.count++;
          if (existing.examples.length < 3) {
            existing.examples.push(feedback.originalClassification.reasoning);
          }
        } else {
          mistakes.set(key, {
            from: feedback.originalClassification.mode,
            to: feedback.userCorrectedMode!,
            count: 1,
            examples: [feedback.originalClassification.reasoning]
          });
        }
      });

    return Array.from(mistakes.values())
      .map(mistake => ({
        from: mistake.from,
        to: mistake.to,
        frequency: mistake.count,
        examples: mistake.examples
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
  }

  private generateImprovementSuggestions(
    accuracyRate: number,
    modeAccuracy: Record<ResponseMode, number>,
    commonMistakes: Array<{ from: ResponseMode; to: ResponseMode; frequency: number }>
  ): string[] {
    const suggestions: string[] = [];

    if (accuracyRate < 0.7) {
      suggestions.push('Overall classification accuracy is below 70%. Consider adjusting confidence thresholds.');
    }

    // Check for problematic modes
    Object.entries(modeAccuracy).forEach(([mode, accuracy]) => {
      if (accuracy < 0.6) {
        suggestions.push(`${mode} mode accuracy is low (${(accuracy * 100).toFixed(1)}%). Review classification criteria.`);
      }
    });

    // Suggest improvements based on common mistakes
    if (commonMistakes.length > 0) {
      const topMistake = commonMistakes[0];
      suggestions.push(`Common mistake: ${topMistake.from} → ${topMistake.to} (${topMistake.frequency} times). Review distinguishing features.`);
    }

    if (suggestions.length === 0) {
      suggestions.push('Classification performance is good. Continue collecting feedback for further improvements.');
    }

    return suggestions;
  }

  private calculateConfidenceCalibration(): {
    overconfident: number;
    underconfident: number;
    wellCalibrated: number;
  } {
    if (this.feedbackHistory.length === 0) {
      return { overconfident: 0, underconfident: 0, wellCalibrated: 0 };
    }

    let overconfident = 0;
    let underconfident = 0;
    let wellCalibrated = 0;

    this.feedbackHistory.forEach(feedback => {
      const confidence = feedback.confidence;
      const isCorrect = feedback.isCorrect;

      if (confidence > 0.8 && !isCorrect) {
        overconfident++;
      } else if (confidence < 0.5 && isCorrect) {
        underconfident++;
      } else {
        wellCalibrated++;
      }
    });

    const total = this.feedbackHistory.length;
    return {
      overconfident: overconfident / total,
      underconfident: underconfident / total,
      wellCalibrated: wellCalibrated / total
    };
  }

  private calculateFeatureOverlap(features1: string[], features2: string[]): number {
    const set1 = new Set(features1);
    const set2 = new Set(features2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private getEmptyInsights(): LearningInsights {
    const modeAccuracy = {} as Record<ResponseMode, number>;
    Object.values(ResponseMode).forEach(mode => {
      modeAccuracy[mode] = 0;
    });

    return {
      totalFeedback: 0,
      accuracyRate: 0,
      modeAccuracy,
      commonMistakes: [],
      improvementSuggestions: ['No feedback data available. Start using the system to collect learning data.'],
      confidenceCalibration: {
        overconfident: 0,
        underconfident: 0,
        wellCalibrated: 0
      }
    };
  }

  private pruneOldFeedback(): void {
    if (this.feedbackHistory.length > this.MAX_FEEDBACK_HISTORY) {
      this.feedbackHistory = this.feedbackHistory
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_FEEDBACK_HISTORY);
    }
  }

  private loadLearningData(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.feedbackHistory = data.feedbackHistory || [];
        
        if (data.learningPatterns) {
          this.learningPatterns.clear();
          data.learningPatterns.forEach((item: any) => {
            this.learningPatterns.set(item.key, item.pattern);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
    }
  }

  private saveLearningData(): void {
    try {
      const data = {
        feedbackHistory: this.feedbackHistory,
        learningPatterns: Array.from(this.learningPatterns.entries()).map(([key, pattern]) => ({
          key,
          pattern
        }))
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save learning data:', error);
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
export const learningSystem = new LearningSystem();