// Classification service that integrates with the existing system

import { questionClassifier, ClassificationInput, DetailedClassificationResult } from './question-classifier';
import { ResponseMode } from '../types/enhanced-response';
import { enhancedSettingsManager } from './enhanced-settings';

export interface ClassificationOptions {
  enableAutoClassification?: boolean;
  confidenceThreshold?: number;
  userOverride?: ResponseMode;
  sessionContext?: {
    previousMode?: ResponseMode;
    sessionHistory?: string[];
  };
}

export class ClassificationService {
  /**
   * Classify content and determine appropriate response mode
   */
  async classifyContent(
    content: string, 
    base64Image?: string, 
    options: ClassificationOptions = {}
  ): Promise<DetailedClassificationResult> {
    // Check if auto-classification is enabled
    const autoClassificationEnabled = options.enableAutoClassification ?? 
      enhancedSettingsManager.isAutoClassificationEnabled();

    if (!autoClassificationEnabled && !options.userOverride) {
      // Return default theoretical mode if auto-classification is disabled
      return this.createDefaultClassification(content, base64Image);
    }

    // Prepare classification input
    const input: ClassificationInput = {
      content,
      base64Image,
      userOverride: options.userOverride,
      context: options.sessionContext
    };

    try {
      // Perform classification
      const result = await questionClassifier.classify(input);
      
      // Log classification for debugging
      this.logClassification(result);
      
      return result;
    } catch (error) {
      console.error('Classification service error:', error);
      return this.createErrorClassification(content, base64Image, error);
    }
  }

  /**
   * Quick classification for simple text content
   */
  async quickClassify(content: string): Promise<ResponseMode> {
    const result = await this.classifyContent(content);
    return result.mode;
  }

  /**
   * Classify with user feedback for learning
   */
  async classifyWithFeedback(
    content: string,
    base64Image?: string,
    options: ClassificationOptions = {}
  ): Promise<{
    classification: DetailedClassificationResult;
    provideFeedback: (isCorrect: boolean) => void;
  }> {
    const classification = await this.classifyContent(content, base64Image, options);
    
    const provideFeedback = (isCorrect: boolean) => {
      questionClassifier.updateLearning(classification, isCorrect);
    };

    return {
      classification,
      provideFeedback
    };
  }

  /**
   * Get classification suggestions without committing to a mode
   */
  async getClassificationSuggestions(
    content: string,
    base64Image?: string
  ): Promise<{
    primary: { mode: ResponseMode; confidence: number; reasoning: string };
    alternatives: Array<{ mode: ResponseMode; confidence: number; reasoning: string }>;
  }> {
    const result = await this.classifyContent(content, base64Image);
    
    return {
      primary: {
        mode: result.mode,
        confidence: result.confidence,
        reasoning: result.reasoning
      },
      alternatives: result.alternativeModes
    };
  }

  /**
   * Validate if a mode is appropriate for given content
   */
  async validateModeChoice(
    content: string,
    selectedMode: ResponseMode,
    base64Image?: string
  ): Promise<{
    isAppropriate: boolean;
    confidence: number;
    suggestions?: string[];
  }> {
    const result = await this.classifyContent(content, base64Image);
    
    const isAppropriate = result.mode === selectedMode || 
      result.alternativeModes.some(alt => alt.mode === selectedMode);
    
    const confidence = result.mode === selectedMode ? 
      result.confidence : 
      result.alternativeModes.find(alt => alt.mode === selectedMode)?.confidence || 0;

    const suggestions: string[] = [];
    
    if (!isAppropriate) {
      suggestions.push(`Consider ${result.mode} mode (${result.reasoning})`);
      
      if (result.alternativeModes.length > 0) {
        const topAlternative = result.alternativeModes[0];
        suggestions.push(`Alternative: ${topAlternative.mode} mode (${topAlternative.reasoning})`);
      }
    }

    return {
      isAppropriate,
      confidence,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  /**
   * Get classification statistics and insights
   */
  getClassificationInsights(): {
    stats: ReturnType<typeof questionClassifier.getClassificationStats>;
    recommendations: string[];
  } {
    const stats = questionClassifier.getClassificationStats();
    const recommendations: string[] = [];

    // Generate recommendations based on stats
    if (stats.averageConfidence < 0.6) {
      recommendations.push('Consider adjusting confidence threshold or providing more context');
    }

    if (stats.recentAccuracy < 0.7) {
      recommendations.push('Classification accuracy could be improved with user feedback');
    }

    const totalClassifications = stats.totalClassifications;
    if (totalClassifications > 0) {
      const mostUsedMode = Object.entries(stats.modeDistribution)
        .reduce((a, b) => a[1] > b[1] ? a : b)[0] as ResponseMode;
      
      if (stats.modeDistribution[mostUsedMode] / totalClassifications > 0.8) {
        recommendations.push(`Consider if ${mostUsedMode} mode is being overused`);
      }
    }

    return {
      stats,
      recommendations
    };
  }

  /**
   * Update classification settings
   */
  updateSettings(settings: {
    autoClassification?: boolean;
    confidenceThreshold?: number;
  }): void {
    if (settings.autoClassification !== undefined) {
      enhancedSettingsManager.setAutoClassification(settings.autoClassification);
    }
    
    if (settings.confidenceThreshold !== undefined) {
      enhancedSettingsManager.setClassificationConfidenceThreshold(settings.confidenceThreshold);
    }
  }

  /**
   * Private helper methods
   */
  private async createDefaultClassification(
    content: string, 
    base64Image?: string
  ): Promise<DetailedClassificationResult> {
    const startTime = Date.now();
    
    return {
      mode: ResponseMode.THEORETICAL,
      confidence: 0.5,
      reasoning: 'Auto-classification disabled, using default theoretical mode',
      fallbackMode: ResponseMode.THEORETICAL,
      detectedFeatures: ['auto_classification_disabled'],
      contentAnalysis: {
        extractedText: content,
        hasCode: false,
        hasMCQ: false,
        hasInterviewQuestion: false,
        confidence: 0.5,
        keyElements: []
      },
      processingTime: Date.now() - startTime,
      classificationPath: ['default_mode'],
      alternativeModes: []
    };
  }

  private async createErrorClassification(
    content: string, 
    base64Image?: string, 
    error: any
  ): Promise<DetailedClassificationResult> {
    const startTime = Date.now();
    
    return {
      mode: ResponseMode.THEORETICAL,
      confidence: 0.1,
      reasoning: `Classification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      fallbackMode: ResponseMode.THEORETICAL,
      detectedFeatures: ['classification_error'],
      contentAnalysis: {
        extractedText: content,
        hasCode: false,
        hasMCQ: false,
        hasInterviewQuestion: false,
        confidence: 0.1,
        keyElements: []
      },
      processingTime: Date.now() - startTime,
      classificationPath: ['error_fallback'],
      alternativeModes: []
    };
  }

  private logClassification(result: DetailedClassificationResult): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Classification Result:', {
        mode: result.mode,
        confidence: result.confidence.toFixed(2),
        reasoning: result.reasoning,
        processingTime: `${result.processingTime}ms`,
        path: result.classificationPath.join(' → ')
      });
    }
  }
}

// Singleton instance
export const classificationService = new ClassificationService();

// Convenience functions
export const classifyContent = (
  content: string, 
  base64Image?: string, 
  options?: ClassificationOptions
) => classificationService.classifyContent(content, base64Image, options);

export const quickClassify = (content: string) => 
  classificationService.quickClassify(content);

export const getClassificationSuggestions = (content: string, base64Image?: string) =>
  classificationService.getClassificationSuggestions(content, base64Image);

export const validateModeChoice = (content: string, mode: ResponseMode, base64Image?: string) =>
  classificationService.validateModeChoice(content, mode, base64Image);