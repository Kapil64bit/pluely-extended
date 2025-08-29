// Core question classification system that determines the appropriate response mode

import { 
  ResponseMode, 
  ContentAnalysis, 
  ClassificationResult,
  CodeDetection,
  MCQStructure
} from '../types/enhanced-response';
import { contentAnalyzer } from './content-analyzer';
import { interviewDetector, InterviewDetectionResult } from './interview-detector';
import { languageDetector } from './language-detector';
import { enhancedSettingsManager } from './enhanced-settings';
import { learningSystem, UserFeedback } from './learning-system';
import { modeOverrideManager } from './mode-override-manager';

export interface ClassificationInput {
  content: string;
  base64Image?: string;
  userOverride?: ResponseMode;
  context?: {
    previousMode?: ResponseMode;
    sessionHistory?: string[];
    userPreferences?: any;
  };
}

export interface DetailedClassificationResult extends ClassificationResult {
  contentAnalysis: ContentAnalysis;
  processingTime: number;
  classificationPath: string[];
  alternativeModes: Array<{
    mode: ResponseMode;
    confidence: number;
    reasoning: string;
  }>;
}

export class QuestionClassifier {
  private classificationHistory: ClassificationResult[] = [];
  private learningData: Map<string, { mode: ResponseMode; userFeedback: boolean }> = new Map();
  private userOverrides: Map<string, ResponseMode> = new Map(); // Content hash -> user preferred mode

  /**
   * Main classification method that determines the appropriate response mode
   */
  async classify(input: ClassificationInput): Promise<DetailedClassificationResult> {
    const startTime = Date.now();
    const classificationPath: string[] = [];

    try {
      // Step 1: Check for explicit user override
      if (input.userOverride) {
        classificationPath.push('explicit_user_override');
        const contentAnalysis = await this.getBasicContentAnalysis(input.content, input.base64Image);
        
        return {
          mode: input.userOverride,
          confidence: 1.0,
          reasoning: `User manually selected ${input.userOverride} mode`,
          fallbackMode: this.determineFallbackMode(contentAnalysis),
          detectedFeatures: ['explicit_user_override'],
          contentAnalysis,
          processingTime: Date.now() - startTime,
          classificationPath,
          alternativeModes: this.generateAlternativeModes(contentAnalysis, input.userOverride)
        };
      }

      // Step 1.5: Check for current mode override from mode manager
      const currentModeOverride = modeOverrideManager.getCurrentMode();
      if (currentModeOverride !== ResponseMode.THEORETICAL) {
        classificationPath.push('mode_manager_override');
        const contentAnalysis = await this.getBasicContentAnalysis(input.content, input.base64Image);
        
        return {
          mode: currentModeOverride,
          confidence: 0.95,
          reasoning: `Using active mode override: ${currentModeOverride} mode`,
          fallbackMode: this.determineFallbackMode(contentAnalysis),
          detectedFeatures: ['mode_manager_override'],
          contentAnalysis,
          processingTime: Date.now() - startTime,
          classificationPath,
          alternativeModes: this.generateAlternativeModes(contentAnalysis, currentModeOverride)
        };
      }

      // Step 1.6: Check for learned user override for similar content
      const learnedOverride = this.getUserModeOverride(input.content);
      if (learnedOverride) {
        classificationPath.push('learned_user_override');
        const contentAnalysis = await this.getBasicContentAnalysis(input.content, input.base64Image);
        
        return {
          mode: learnedOverride,
          confidence: 0.9,
          reasoning: `Using learned user preference for similar content: ${learnedOverride} mode`,
          fallbackMode: this.determineFallbackMode(contentAnalysis),
          detectedFeatures: ['learned_user_override'],
          contentAnalysis,
          processingTime: Date.now() - startTime,
          classificationPath,
          alternativeModes: this.generateAlternativeModes(contentAnalysis, learnedOverride)
        };
      }

      // Step 2: Analyze content
      classificationPath.push('content_analysis');
      const contentAnalysis = input.base64Image 
        ? await contentAnalyzer.analyzeScreenshot(input.base64Image)
        : await this.analyzeTextContent(input.content);

      // Step 3: Apply classification logic
      classificationPath.push('classification_logic');
      const result = await this.performClassification(contentAnalysis, input.context);
      
      // Step 4: Apply learning system adjustments
      classificationPath.push('learning_adjustment');
      const learningAdjustment = learningSystem.getClassificationAdjustment(result, result.detectedFeatures);
      const adjustedResult = this.applyLearningAdjustment(result, learningAdjustment);
      
      // Step 4.5: Check for auto-override rules
      classificationPath.push('auto_override_check');
      const autoOverride = modeOverrideManager.checkAutoOverride(adjustedResult, input.content);
      const overrideAdjustedResult = autoOverride ? {
        ...adjustedResult,
        mode: autoOverride,
        confidence: Math.max(adjustedResult.confidence, 0.8),
        reasoning: `${adjustedResult.reasoning} (Auto-override applied: ${autoOverride})`
      } : adjustedResult;
      
      // Step 5: Apply confidence threshold and fallback logic
      classificationPath.push('confidence_check');
      const finalResult = this.applyConfidenceThreshold(overrideAdjustedResult, contentAnalysis);
      
      // Step 6: Record classification for learning
      this.recordClassification(finalResult);

      return {
        ...finalResult,
        contentAnalysis,
        processingTime: Date.now() - startTime,
        classificationPath,
        alternativeModes: this.generateAlternativeModes(contentAnalysis, finalResult.mode)
      };

    } catch (error) {
      console.error('Classification error:', error);
      classificationPath.push('error_fallback');
      
      const fallbackAnalysis = await this.getBasicContentAnalysis(input.content, input.base64Image);
      
      return {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.1,
        reasoning: `Classification failed, defaulting to theoretical mode: ${error instanceof Error ? error.message : 'Unknown error'}`,
        fallbackMode: ResponseMode.THEORETICAL,
        detectedFeatures: ['error'],
        contentAnalysis: fallbackAnalysis,
        processingTime: Date.now() - startTime,
        classificationPath,
        alternativeModes: []
      };
    }
  }

  /**
   * Perform the core classification logic
   */
  private async performClassification(
    contentAnalysis: ContentAnalysis, 
    context?: ClassificationInput['context']
  ): Promise<ClassificationResult> {
    const detectedFeatures: string[] = [];
    let primaryMode: ResponseMode;
    let confidence: number;
    let reasoning: string;

    // Priority 1: MCQ Detection (highest priority when clear)
    if (contentAnalysis.hasMCQ) {
      detectedFeatures.push('mcq_structure');
      const mcqConfidence = this.calculateMCQConfidence(contentAnalysis);
      
      if (mcqConfidence > 0.7) {
        return {
          mode: ResponseMode.MCQ,
          confidence: mcqConfidence,
          reasoning: 'Clear multiple choice question structure detected with high confidence',
          fallbackMode: ResponseMode.THEORETICAL,
          detectedFeatures
        };
      }
    }

    // Priority 2: Code Detection (high priority for programming content)
    if (contentAnalysis.hasCode) {
      detectedFeatures.push('code_detected');
      const codeConfidence = this.calculateCodeConfidence(contentAnalysis);
      
      if (codeConfidence > 0.6) {
        // Check if it's a coding problem vs code explanation
        const isCodingProblem = this.isCodingProblem(contentAnalysis);
        
        if (isCodingProblem) {
          return {
            mode: ResponseMode.CODING,
            confidence: codeConfidence,
            reasoning: `Coding problem detected in ${contentAnalysis.programmingLanguage || 'unknown'} language`,
            fallbackMode: ResponseMode.THEORETICAL,
            detectedFeatures: [...detectedFeatures, 'coding_problem']
          };
        }
      }
    }

    // Priority 3: Interview Question Detection
    if (contentAnalysis.hasInterviewQuestion && contentAnalysis.interviewAnalysis) {
      detectedFeatures.push('interview_question');
      const interviewConfidence = contentAnalysis.interviewAnalysis.confidence;
      
      if (interviewConfidence > 0.5) {
        return {
          mode: ResponseMode.VERBAL_INTERVIEW,
          confidence: interviewConfidence,
          reasoning: `Interview question detected: ${contentAnalysis.interviewAnalysis.questionType} type`,
          fallbackMode: ResponseMode.THEORETICAL,
          detectedFeatures: [...detectedFeatures, contentAnalysis.interviewAnalysis.questionType]
        };
      }
    }

    // Priority 4: Context-based classification
    const contextResult = this.classifyByContext(contentAnalysis, context);
    if (contextResult.confidence > 0.4) {
      detectedFeatures.push('context_based');
      return {
        ...contextResult,
        detectedFeatures: [...detectedFeatures, ...contextResult.detectedFeatures]
      };
    }

    // Priority 5: Content-based heuristics
    const heuristicResult = this.classifyByHeuristics(contentAnalysis);
    detectedFeatures.push('heuristic_based');
    
    return {
      ...heuristicResult,
      detectedFeatures: [...detectedFeatures, ...heuristicResult.detectedFeatures]
    };
  }

  /**
   * Calculate MCQ confidence based on structure quality
   */
  private calculateMCQConfidence(contentAnalysis: ContentAnalysis): number {
    if (!contentAnalysis.hasMCQ) return 0;

    let confidence = 0.5; // Base confidence for MCQ detection

    // Check for question text
    if (contentAnalysis.keyElements.some(el => el.includes('Question:'))) {
      confidence += 0.2;
    }

    // Check for multiple options
    const optionCount = this.extractOptionCount(contentAnalysis);
    if (optionCount >= 3) confidence += 0.2;
    if (optionCount >= 4) confidence += 0.1;

    // Check for clear option formatting
    if (this.hasGoodOptionFormatting(contentAnalysis)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Calculate code confidence and determine if it's a coding problem
   */
  private calculateCodeConfidence(contentAnalysis: ContentAnalysis): number {
    if (!contentAnalysis.hasCode) return 0;

    let confidence = 0.4; // Base confidence for code detection

    // Language detection adds confidence
    if (contentAnalysis.programmingLanguage) {
      confidence += 0.2;
    }

    // Multiple programming indicators
    const codeIndicators = contentAnalysis.keyElements.filter(el => 
      el.includes('Programming Language') || el.includes('Keywords')
    ).length;
    
    confidence += Math.min(codeIndicators * 0.1, 0.3);

    return Math.min(confidence, 1.0);
  }

  /**
   * Determine if code content represents a coding problem vs explanation
   */
  private isCodingProblem(contentAnalysis: ContentAnalysis): boolean {
    const content = contentAnalysis.extractedText.toLowerCase();
    
    // Problem indicators
    const problemIndicators = [
      'implement', 'write a function', 'solve', 'algorithm', 'return',
      'given', 'input', 'output', 'example', 'constraint', 'time complexity',
      'write code', 'create a function', 'find', 'calculate', 'determine'
    ];

    // Explanation indicators
    const explanationIndicators = [
      'this code', 'the function', 'here is', 'as you can see',
      'the algorithm works', 'explanation', 'how it works'
    ];

    const problemScore = problemIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;

    const explanationScore = explanationIndicators.filter(indicator => 
      content.includes(indicator)
    ).length;

    return problemScore > explanationScore;
  }

  /**
   * Classify based on context and session history
   */
  private classifyByContext(
    contentAnalysis: ContentAnalysis, 
    context?: ClassificationInput['context']
  ): ClassificationResult {
    let confidence = 0.3;
    let mode = ResponseMode.THEORETICAL;
    let reasoning = 'Context-based classification';
    const detectedFeatures: string[] = [];

    // Check previous mode for consistency
    if (context?.previousMode) {
      detectedFeatures.push('previous_mode_context');
      
      // If previous was coding and current has code, likely coding
      if (context.previousMode === ResponseMode.CODING && contentAnalysis.hasCode) {
        confidence += 0.2;
        mode = ResponseMode.CODING;
        reasoning = 'Continuing coding context from previous interaction';
      }
      
      // If previous was interview and current has question patterns
      if (context.previousMode === ResponseMode.VERBAL_INTERVIEW && contentAnalysis.hasInterviewQuestion) {
        confidence += 0.2;
        mode = ResponseMode.VERBAL_INTERVIEW;
        reasoning = 'Continuing interview context from previous interaction';
      }
    }

    // Check session history for patterns
    if (context?.sessionHistory && context.sessionHistory.length > 0) {
      detectedFeatures.push('session_history');
      const historyAnalysis = this.analyzeSessionHistory(context.sessionHistory);
      
      if (historyAnalysis.dominantMode) {
        confidence += 0.1;
        mode = historyAnalysis.dominantMode;
        reasoning += ` (session pattern: ${historyAnalysis.dominantMode})`;
      }
    }

    return {
      mode,
      confidence,
      reasoning,
      fallbackMode: ResponseMode.THEORETICAL,
      detectedFeatures
    };
  }

  /**
   * Classify using content heuristics as final fallback
   */
  private classifyByHeuristics(contentAnalysis: ContentAnalysis): ClassificationResult {
    const content = contentAnalysis.extractedText.toLowerCase();
    const detectedFeatures: string[] = [];
    
    // Technical content indicators
    const technicalTerms = [
      'algorithm', 'data structure', 'complexity', 'optimization',
      'database', 'api', 'framework', 'architecture', 'design pattern'
    ];
    
    const technicalScore = technicalTerms.filter(term => content.includes(term)).length;
    
    if (technicalScore >= 2) {
      detectedFeatures.push('technical_content');
      return {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.6,
        reasoning: 'Technical content detected, using theoretical mode',
        fallbackMode: ResponseMode.THEORETICAL,
        detectedFeatures
      };
    }

    // Question patterns
    const questionPatterns = ['what', 'how', 'why', 'when', 'where', '?'];
    const questionScore = questionPatterns.filter(pattern => content.includes(pattern)).length;
    
    if (questionScore >= 2) {
      detectedFeatures.push('question_patterns');
      return {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.5,
        reasoning: 'Question patterns detected, using theoretical mode',
        fallbackMode: ResponseMode.THEORETICAL,
        detectedFeatures
      };
    }

    // Default fallback
    detectedFeatures.push('default_fallback');
    return {
      mode: ResponseMode.THEORETICAL,
      confidence: 0.3,
      reasoning: 'No clear patterns detected, defaulting to theoretical mode',
      fallbackMode: ResponseMode.THEORETICAL,
      detectedFeatures
    };
  }

  /**
   * Apply confidence threshold and fallback logic
   */
  private applyConfidenceThreshold(
    result: ClassificationResult, 
    contentAnalysis: ContentAnalysis
  ): ClassificationResult {
    const threshold = enhancedSettingsManager.getClassificationConfidenceThreshold();
    
    if (result.confidence < threshold) {
      const fallbackMode = result.fallbackMode || ResponseMode.THEORETICAL;
      
      return {
        ...result,
        mode: fallbackMode,
        confidence: Math.max(result.confidence, 0.3),
        reasoning: `${result.reasoning} (confidence ${result.confidence.toFixed(2)} below threshold ${threshold}, using fallback: ${fallbackMode})`,
        detectedFeatures: [...result.detectedFeatures, 'confidence_fallback']
      };
    }
    
    return result;
  }

  /**
   * Generate alternative mode suggestions
   */
  private generateAlternativeModes(
    contentAnalysis: ContentAnalysis, 
    selectedMode: ResponseMode
  ): Array<{ mode: ResponseMode; confidence: number; reasoning: string }> {
    const alternatives: Array<{ mode: ResponseMode; confidence: number; reasoning: string }> = [];
    
    // Always suggest theoretical as alternative
    if (selectedMode !== ResponseMode.THEORETICAL) {
      alternatives.push({
        mode: ResponseMode.THEORETICAL,
        confidence: 0.7,
        reasoning: 'General theoretical explanation approach'
      });
    }

    // Suggest coding if code detected but not selected
    if (contentAnalysis.hasCode && selectedMode !== ResponseMode.CODING) {
      alternatives.push({
        mode: ResponseMode.CODING,
        confidence: 0.6,
        reasoning: `Code detected in ${contentAnalysis.programmingLanguage || 'unknown'} language`
      });
    }

    // Suggest MCQ if structure detected but not selected
    if (contentAnalysis.hasMCQ && selectedMode !== ResponseMode.MCQ) {
      alternatives.push({
        mode: ResponseMode.MCQ,
        confidence: 0.5,
        reasoning: 'Multiple choice structure detected'
      });
    }

    // Suggest interview if question patterns detected but not selected
    if (contentAnalysis.hasInterviewQuestion && selectedMode !== ResponseMode.VERBAL_INTERVIEW) {
      alternatives.push({
        mode: ResponseMode.VERBAL_INTERVIEW,
        confidence: contentAnalysis.interviewAnalysis?.confidence || 0.4,
        reasoning: 'Interview question patterns detected'
      });
    }

    return alternatives.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }

  /**
   * Helper methods
   */
  private async getBasicContentAnalysis(content: string, base64Image?: string): Promise<ContentAnalysis> {
    if (base64Image) {
      return await contentAnalyzer.analyzeScreenshot(base64Image);
    } else {
      return {
        extractedText: content,
        hasCode: false,
        hasMCQ: false,
        hasInterviewQuestion: false,
        confidence: 0.5,
        keyElements: []
      };
    }
  }

  private async analyzeTextContent(content: string): Promise<ContentAnalysis> {
    // Simulate screenshot analysis for text content
    const codeDetection = contentAnalyzer.detectCodePatterns(content);
    const mcqStructure = contentAnalyzer.identifyMCQStructure(content);
    const interviewAnalysis = contentAnalyzer.getInterviewAnalysis(content);
    
    return {
      extractedText: content,
      hasCode: codeDetection.detected,
      hasMCQ: mcqStructure.detected,
      hasInterviewQuestion: interviewAnalysis.isInterviewQuestion,
      programmingLanguage: codeDetection.language,
      confidence: Math.max(codeDetection.confidence, mcqStructure.confidence, interviewAnalysis.confidence),
      keyElements: this.extractKeyElementsFromText(content, codeDetection, mcqStructure),
      interviewAnalysis: interviewAnalysis.isInterviewQuestion ? {
        questionType: interviewAnalysis.questionType,
        context: interviewAnalysis.context,
        suggestedResponseStyle: interviewAnalysis.suggestedResponseStyle,
        confidence: interviewAnalysis.confidence
      } : undefined
    };
  }

  private extractKeyElementsFromText(content: string, codeDetection: any, mcqStructure: any): string[] {
    const elements: string[] = [];
    
    if (codeDetection.detected) {
      elements.push(`Programming Language: ${codeDetection.language || 'Unknown'}`);
      if (codeDetection.keywords.length > 0) {
        elements.push(`Keywords: ${codeDetection.keywords.slice(0, 5).join(', ')}`);
      }
    }
    
    if (mcqStructure.detected) {
      elements.push(`MCQ with ${mcqStructure.options.length} options`);
    }
    
    return elements;
  }

  private extractOptionCount(contentAnalysis: ContentAnalysis): number {
    const mcqElement = contentAnalysis.keyElements.find(el => el.includes('MCQ with'));
    if (mcqElement) {
      const match = mcqElement.match(/MCQ with (\d+) options/);
      return match ? parseInt(match[1]) : 0;
    }
    return 0;
  }

  private hasGoodOptionFormatting(contentAnalysis: ContentAnalysis): boolean {
    const content = contentAnalysis.extractedText;
    const patterns = [
      /^[A-D]\)/gm,
      /^[A-D]\./gm,
      /^\d+\)/gm,
      /^\d+\./gm
    ];
    
    return patterns.some(pattern => {
      const matches = content.match(pattern);
      return matches && matches.length >= 2;
    });
  }

  private analyzeSessionHistory(history: string[]): { dominantMode?: ResponseMode } {
    // Simple analysis of session history
    const modeCounts = new Map<ResponseMode, number>();
    
    // This would be enhanced with actual session data
    // For now, return empty analysis
    return {};
  }

  private determineFallbackMode(contentAnalysis: ContentAnalysis): ResponseMode {
    if (contentAnalysis.hasCode) return ResponseMode.CODING;
    if (contentAnalysis.hasMCQ) return ResponseMode.MCQ;
    if (contentAnalysis.hasInterviewQuestion) return ResponseMode.VERBAL_INTERVIEW;
    return ResponseMode.THEORETICAL;
  }

  private recordClassification(result: ClassificationResult): void {
    this.classificationHistory.push(result);
    
    // Keep only recent history
    if (this.classificationHistory.length > 100) {
      this.classificationHistory = this.classificationHistory.slice(-50);
    }
  }

  /**
   * Record user feedback on classification accuracy
   */
  recordUserFeedback(
    classification: ClassificationResult,
    isCorrect: boolean,
    userCorrectedMode?: ResponseMode,
    content?: string
  ): UserFeedback {
    // Record in learning system
    const feedback = learningSystem.recordFeedback(
      classification,
      isCorrect,
      userCorrectedMode,
      content
    );

    // Update local learning data
    const key = `${classification.mode}_${classification.detectedFeatures.join('_')}`;
    this.learningData.set(key, {
      mode: userCorrectedMode || classification.mode,
      userFeedback: isCorrect
    });

    // If user corrected the mode, store as override for similar content
    if (userCorrectedMode && content) {
      const contentHash = this.hashContent(content);
      this.userOverrides.set(contentHash, userCorrectedMode);
    }

    return feedback;
  }

  /**
   * Set manual mode override for specific content
   */
  setModeOverride(content: string, mode: ResponseMode): void {
    const contentHash = this.hashContent(content);
    this.userOverrides.set(contentHash, mode);
    
    // Also record as learning data
    learningSystem.recordFeedback(
      {
        mode: mode,
        confidence: 1.0,
        reasoning: 'User manual override',
        detectedFeatures: ['manual_override']
      },
      true, // User explicitly chose this mode
      undefined,
      content
    );
  }

  /**
   * Check if user has overridden mode for similar content
   */
  getUserModeOverride(content: string): ResponseMode | undefined {
    const contentHash = this.hashContent(content);
    return this.userOverrides.get(contentHash);
  }

  /**
   * Get personalized mode suggestions based on user patterns
   */
  getPersonalizedSuggestions(content: string): Array<{
    mode: ResponseMode;
    confidence: number;
    reasoning: string;
  }> {
    // Extract content features for learning system
    const contentFeatures = this.extractContentFeatures(content);
    return learningSystem.getPersonalizedSuggestions(contentFeatures);
  }

  /**
   * Apply learning system adjustments to classification
   */
  private applyLearningAdjustment(
    classification: ClassificationResult,
    adjustment: {
      adjustedMode?: ResponseMode;
      confidenceAdjustment: number;
      reasoning: string;
    }
  ): ClassificationResult {
    let adjustedResult = { ...classification };

    // Apply mode adjustment if suggested
    if (adjustment.adjustedMode) {
      adjustedResult.mode = adjustment.adjustedMode;
      adjustedResult.reasoning = `${classification.reasoning} | Learning adjustment: ${adjustment.reasoning}`;
      adjustedResult.detectedFeatures = [...classification.detectedFeatures, 'learning_adjusted'];
    }

    // Apply confidence adjustment
    if (adjustment.confidenceAdjustment !== 0) {
      adjustedResult.confidence = Math.max(0.1, Math.min(1.0, 
        classification.confidence + adjustment.confidenceAdjustment
      ));
      
      if (!adjustment.adjustedMode) {
        adjustedResult.reasoning = `${classification.reasoning} | Confidence adjusted: ${adjustment.reasoning}`;
      }
    }

    return adjustedResult;
  }

  /**
   * Extract content features for learning system
   */
  private extractContentFeatures(content: string): string[] {
    const features: string[] = [];
    const contentLower = content.toLowerCase();

    // Basic content features
    if (contentLower.includes('function')) features.push('has_function');
    if (contentLower.includes('class')) features.push('has_class');
    if (contentLower.includes('?')) features.push('has_question_mark');
    if (/[A-D]\)/g.test(content)) features.push('has_mcq_options');
    if (contentLower.includes('tell me')) features.push('has_conversational_cue');
    if (contentLower.includes('implement')) features.push('has_implementation_request');
    if (contentLower.includes('explain')) features.push('has_explanation_request');
    if (contentLower.includes('describe')) features.push('has_description_request');
    if (contentLower.includes('what is')) features.push('has_definition_request');
    if (contentLower.includes('how to')) features.push('has_how_to_request');

    // Programming language indicators
    const languages = ['javascript', 'python', 'java', 'cpp', 'c++', 'csharp', 'c#', 'go', 'rust'];
    languages.forEach(lang => {
      if (contentLower.includes(lang)) {
        features.push(`language_${lang.replace(/[^a-z]/g, '')}`);
      }
    });

    // Content length features
    if (content.length < 100) features.push('short_content');
    else if (content.length > 500) features.push('long_content');
    else features.push('medium_content');

    // Code patterns
    if (/\{[\s\S]*\}/g.test(content)) features.push('has_code_blocks');
    if (/\(\s*\)/g.test(content)) features.push('has_function_calls');
    if (/import|#include|using/gi.test(content)) features.push('has_imports');

    return features;
  }

  /**
   * Hash content for consistent identification
   */
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

  /**
   * Update learning data based on user feedback (legacy method for compatibility)
   */
  updateLearning(classification: ClassificationResult, userFeedback: boolean): void {
    this.recordUserFeedback(classification, userFeedback);
  }

  /**
   * Get comprehensive classification and learning statistics
   */
  getClassificationStats(): {
    totalClassifications: number;
    modeDistribution: Record<ResponseMode, number>;
    averageConfidence: number;
    recentAccuracy: number;
    learningInsights: ReturnType<typeof learningSystem.getLearningInsights>;
    userOverrides: number;
  } {
    const total = this.classificationHistory.length;
    const modeDistribution = {} as Record<ResponseMode, number>;
    let totalConfidence = 0;
    
    // Initialize mode counts
    Object.values(ResponseMode).forEach(mode => {
      modeDistribution[mode] = 0;
    });
    
    // Calculate statistics
    this.classificationHistory.forEach(result => {
      modeDistribution[result.mode]++;
      totalConfidence += result.confidence;
    });
    
    const averageConfidence = total > 0 ? totalConfidence / total : 0;
    
    // Calculate recent accuracy from learning data
    const recentFeedback = Array.from(this.learningData.values());
    const positiveCount = recentFeedback.filter(f => f.userFeedback).length;
    const recentAccuracy = recentFeedback.length > 0 ? positiveCount / recentFeedback.length : 0;
    
    // Get learning insights
    const learningInsights = learningSystem.getLearningInsights();
    
    return {
      totalClassifications: total,
      modeDistribution,
      averageConfidence,
      recentAccuracy,
      learningInsights,
      userOverrides: this.userOverrides.size
    };
  }

  /**
   * Get recent feedback for analysis
   */
  getRecentFeedback(limit: number = 10): UserFeedback[] {
    return learningSystem.getRecentFeedback(limit);
  }

  /**
   * Clear all user overrides and learning data
   */
  clearUserData(): void {
    this.userOverrides.clear();
    this.learningData.clear();
    learningSystem.clearLearningData();
  }

  /**
   * Export user learning data for backup
   */
  exportUserData(): {
    userOverrides: Array<{ contentHash: string; mode: ResponseMode }>;
    learningData: ReturnType<typeof learningSystem.exportLearningData>;
    exportTimestamp: number;
  } {
    return {
      userOverrides: Array.from(this.userOverrides.entries()).map(([hash, mode]) => ({
        contentHash: hash,
        mode
      })),
      learningData: learningSystem.exportLearningData(),
      exportTimestamp: Date.now()
    };
  }

  /**
   * Import user learning data from backup
   */
  importUserData(data: ReturnType<typeof this.exportUserData>): boolean {
    try {
      // Import user overrides
      this.userOverrides.clear();
      data.userOverrides.forEach(({ contentHash, mode }) => {
        this.userOverrides.set(contentHash, mode);
      });

      // Import learning data
      const success = learningSystem.importLearningData(data.learningData);
      
      return success;
    } catch (error) {
      console.error('Failed to import user data:', error);
      return false;
    }
  }

  /**
   * Get user override statistics
   */
  getUserOverrideStats(): {
    totalOverrides: number;
    modePreferences: Record<ResponseMode, number>;
    mostOverriddenMode: ResponseMode | null;
    overrideSuccessRate: number;
  } {
    const totalOverrides = this.userOverrides.size;
    const modePreferences = {} as Record<ResponseMode, number>;
    
    // Initialize mode counts
    Object.values(ResponseMode).forEach(mode => {
      modePreferences[mode] = 0;
    });
    
    // Count mode preferences
    Array.from(this.userOverrides.values()).forEach(mode => {
      modePreferences[mode]++;
    });
    
    // Find most overridden mode
    let mostOverriddenMode: ResponseMode | null = null;
    let maxCount = 0;
    Object.entries(modePreferences).forEach(([mode, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostOverriddenMode = mode as ResponseMode;
      }
    });
    
    // Calculate override success rate from learning data
    const overrideFeedback = Array.from(this.learningData.values());
    const successfulOverrides = overrideFeedback.filter(f => f.userFeedback).length;
    const overrideSuccessRate = overrideFeedback.length > 0 ? 
      successfulOverrides / overrideFeedback.length : 0;
    
    return {
      totalOverrides,
      modePreferences,
      mostOverriddenMode,
      overrideSuccessRate
    };
  }
}

// Singleton instance
export const questionClassifier = new QuestionClassifier();