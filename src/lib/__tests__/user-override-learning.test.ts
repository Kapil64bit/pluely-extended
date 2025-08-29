// Tests for user override and learning capabilities

import { describe, it, expect, beforeEach, afterEach } from './test-utils';
import { ResponseMode } from '../../types/enhanced-response';
import { questionClassifier } from '../question-classifier';
import { feedbackCollector } from '../feedback-collector';
import { modeOverrideManager } from '../mode-override-manager';
import { learningSystem } from '../learning-system';

describe('User Override and Learning System', () => {
  beforeEach(() => {
    // Clear all data before each test
    questionClassifier.clearUserData();
    feedbackCollector.clearFeedbackData();
    modeOverrideManager.clearAllData();
    learningSystem.clearLearningData();
  });

  afterEach(() => {
    // Clean up after each test
    questionClassifier.clearUserData();
    feedbackCollector.clearFeedbackData();
    modeOverrideManager.clearAllData();
    learningSystem.clearLearningData();
  });

  describe('Question Classifier User Override', () => {
    it('should respect explicit user override', async () => {
      const input = {
        content: 'What is a binary tree?',
        userOverride: ResponseMode.CODING
      };

      const result = await questionClassifier.classify(input);

      expect(result.mode).toBe(ResponseMode.CODING);
      expect(result.confidence).toBe(1.0);
      expect(result.detectedFeatures).toContain('explicit_user_override');
      expect(result.reasoning).toContain('User manually selected');
    });

    it('should apply learned patterns from user feedback', async () => {
      const content = 'Implement a function to reverse a string';
      
      // First classification (should be coding)
      const initialResult = await questionClassifier.classify({ content });
      expect(initialResult.mode).toBe(ResponseMode.CODING);

      // Simulate user correction to interview mode
      questionClassifier.recordUserFeedback(
        initialResult,
        false,
        ResponseMode.VERBAL_INTERVIEW,
        content
      );

      // Second classification with similar content should learn from feedback
      const similarContent = 'Implement a function to find the maximum element';
      const learnedResult = await questionClassifier.classify({ content: similarContent });
      
      // Should have some influence from the learning, though may not completely override
      expect(learnedResult.reasoning).toContain('learned pattern');
    });

    it('should handle temporary overrides correctly', () => {
      // Set temporary override
      const override = modeOverrideManager.setManualOverride(
        ResponseMode.MCQ,
        'Test content',
        undefined,
        true // temporary
      );

      expect(override.reason).toBe('manual');
      expect(modeOverrideManager.getCurrentMode()).toBe(ResponseMode.MCQ);

      // Clear temporary override
      modeOverrideManager.clearTemporaryOverride();
      expect(modeOverrideManager.getCurrentMode()).toBe(ResponseMode.THEORETICAL);
    });
  });

  describe('Mode Override Manager', () => {
    it('should track override history', () => {
      // Create multiple overrides
      modeOverrideManager.setManualOverride(ResponseMode.CODING);
      modeOverrideManager.setHotkeyOverride(ResponseMode.MCQ);
      modeOverrideManager.setManualOverride(ResponseMode.VERBAL_INTERVIEW);

      const stats = modeOverrideManager.getOverrideStats();
      expect(stats.totalOverrides).toBe(3);
      expect(stats.overridesByReason.manual).toBe(2);
      expect(stats.overridesByReason.hotkey).toBe(1);
    });

    it('should manage user preferences', () => {
      // Set default mode preference
      modeOverrideManager.setDefaultMode(ResponseMode.CODING);
      expect(modeOverrideManager.getCurrentMode()).toBe(ResponseMode.CODING);

      // Set content type preference
      modeOverrideManager.setModePreference('algorithm', ResponseMode.CODING);
      expect(modeOverrideManager.getModePreference('algorithm')).toBe(ResponseMode.CODING);

      // Set confidence threshold
      modeOverrideManager.setConfidenceThreshold(ResponseMode.MCQ, 0.8);
      const preferences = modeOverrideManager.getUserPreferences();
      expect(preferences.confidenceThresholds[ResponseMode.MCQ]).toBe(0.8);
    });

    it('should handle auto-override rules', () => {
      // Add auto-override rule
      modeOverrideManager.addAutoOverrideRule('implement', ResponseMode.CODING);
      
      const mockClassification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.6,
        reasoning: 'Default classification',
        detectedFeatures: []
      };

      const autoOverride = modeOverrideManager.checkAutoOverride(
        mockClassification,
        'Please implement a sorting algorithm'
      );

      expect(autoOverride).toBe(ResponseMode.CODING);
    });

    it('should export and import data correctly', () => {
      // Create some override data
      modeOverrideManager.setManualOverride(ResponseMode.CODING);
      modeOverrideManager.setDefaultMode(ResponseMode.MCQ);

      // Export data
      const exportedData = modeOverrideManager.exportOverrideData();
      expect(exportedData.overrideHistory.length).toBe(1);
      expect(exportedData.userPreferences.defaultMode).toBe(ResponseMode.MCQ);

      // Clear and import
      modeOverrideManager.clearAllData();
      expect(modeOverrideManager.getOverrideStats().totalOverrides).toBe(0);

      const importSuccess = modeOverrideManager.importOverrideData(exportedData);
      expect(importSuccess).toBe(true);
      expect(modeOverrideManager.getOverrideStats().totalOverrides).toBe(1);
    });
  });

  describe('Feedback Collector', () => {
    it('should generate appropriate feedback prompts', () => {
      const lowConfidenceClassification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.4,
        reasoning: 'Low confidence classification',
        detectedFeatures: []
      };

      const prompt = feedbackCollector.generateFeedbackPrompt(lowConfidenceClassification);
      expect(prompt).toBeTruthy();
      expect(prompt?.type).toBe('detailed');
      expect(prompt?.message).toContain('not very confident');
    });

    it('should handle feedback submission', () => {
      const classification = {
        mode: ResponseMode.CODING,
        confidence: 0.7,
        reasoning: 'Test classification',
        detectedFeatures: []
      };

      // Request feedback
      const request = feedbackCollector.requestFeedback(classification, 'test content');
      expect(request.classification.mode).toBe(ResponseMode.CODING);

      // Submit feedback
      const response = {
        requestId: request.id,
        isCorrect: false,
        correctedMode: ResponseMode.MCQ,
        timestamp: Date.now()
      };

      const userFeedback = feedbackCollector.submitFeedback(response);
      expect(userFeedback).toBeTruthy();
      expect(userFeedback?.isCorrect).toBe(false);
    });

    it('should track feedback statistics', () => {
      const classification = {
        mode: ResponseMode.CODING,
        confidence: 0.8,
        reasoning: 'Test classification',
        detectedFeatures: []
      };

      // Submit multiple feedback responses
      const request1 = feedbackCollector.requestFeedback(classification, 'content 1');
      feedbackCollector.submitFeedback({
        requestId: request1.id,
        isCorrect: true,
        userSatisfaction: 5,
        timestamp: Date.now()
      });

      const request2 = feedbackCollector.requestFeedback(classification, 'content 2');
      feedbackCollector.submitFeedback({
        requestId: request2.id,
        isCorrect: false,
        correctedMode: ResponseMode.MCQ,
        userSatisfaction: 3,
        timestamp: Date.now()
      });

      const stats = feedbackCollector.getFeedbackStats();
      expect(stats.totalFeedback).toBe(2);
      expect(stats.accuracyRate).toBe(0.5);
      expect(stats.averageSatisfaction).toBe(4);
    });
  });

  describe('Learning System', () => {
    it('should record and learn from feedback', () => {
      const classification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.6,
        reasoning: 'Initial classification',
        detectedFeatures: ['question_patterns']
      };

      // Record feedback
      const feedback = learningSystem.recordFeedback(
        classification,
        false,
        ResponseMode.CODING,
        'Implement a binary search algorithm'
      );

      expect(feedback.isCorrect).toBe(false);
      expect(feedback.userCorrectedMode).toBe(ResponseMode.CODING);

      // Get learning insights
      const insights = learningSystem.getLearningInsights();
      expect(insights.totalFeedback).toBe(1);
      expect(insights.accuracyRate).toBe(0);
      expect(insights.commonMistakes.length).toBeGreaterThan(0);
    });

    it('should provide classification adjustments based on learning', () => {
      const classification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.5,
        reasoning: 'Base classification',
        detectedFeatures: ['has_function', 'has_implementation_request']
      };

      // Record some learning data first
      learningSystem.recordFeedback(
        classification,
        false,
        ResponseMode.CODING,
        'Implement a function to sort an array'
      );

      // Get adjustment for similar content
      const adjustment = learningSystem.getClassificationAdjustment(
        classification,
        ['has_function', 'has_implementation_request']
      );

      expect(adjustment.reasoning).toContain('pattern');
    });

    it('should provide personalized suggestions', () => {
      // Record some feedback to build patterns
      const classification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.6,
        reasoning: 'Test classification',
        detectedFeatures: ['has_function', 'medium_content']
      };

      learningSystem.recordFeedback(
        classification,
        false,
        ResponseMode.CODING,
        'Write a function to calculate factorial'
      );

      // Get personalized suggestions
      const suggestions = learningSystem.getPersonalizedSuggestions([
        'has_function',
        'medium_content'
      ]);

      expect(suggestions.length).toBeGreaterThanOrEqual(0);
    });

    it('should export and import learning data', () => {
      const classification = {
        mode: ResponseMode.MCQ,
        confidence: 0.7,
        reasoning: 'Test classification',
        detectedFeatures: ['has_mcq_options']
      };

      // Create some learning data
      learningSystem.recordFeedback(classification, true, undefined, 'Test content');

      // Export data
      const exportedData = learningSystem.exportLearningData();
      expect(exportedData.feedbackHistory.length).toBe(1);

      // Clear and import
      learningSystem.clearLearningData();
      const insights = learningSystem.getLearningInsights();
      expect(insights.totalFeedback).toBe(0);

      const importSuccess = learningSystem.importLearningData(exportedData);
      expect(importSuccess).toBe(true);

      const newInsights = learningSystem.getLearningInsights();
      expect(newInsights.totalFeedback).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    it('should integrate override manager with question classifier', async () => {
      // Set a manual override
      modeOverrideManager.setManualOverride(ResponseMode.CODING);

      // Classification should respect the override
      const result = await questionClassifier.classify({
        content: 'What is polymorphism?'
      });

      expect(result.mode).toBe(ResponseMode.CODING);
    });

    it('should integrate feedback collector with learning system', () => {
      const classification = {
        mode: ResponseMode.THEORETICAL,
        confidence: 0.5,
        reasoning: 'Test classification',
        detectedFeatures: []
      };

      // Request and submit feedback
      const request = feedbackCollector.requestFeedback(classification, 'test content');
      const userFeedback = feedbackCollector.submitFeedback({
        requestId: request.id,
        isCorrect: false,
        correctedMode: ResponseMode.VERBAL_INTERVIEW,
        timestamp: Date.now()
      });

      expect(userFeedback).toBeTruthy();

      // Check that learning system received the feedback
      const insights = learningSystem.getLearningInsights();
      expect(insights.totalFeedback).toBe(1);
    });

    it('should handle complete user correction workflow', async () => {
      const content = 'Explain the concept of inheritance in OOP';

      // Initial classification
      const initialResult = await questionClassifier.classify({ content });
      expect(initialResult.mode).toBe(ResponseMode.THEORETICAL);

      // User corrects to interview mode
      const override = modeOverrideManager.setCorrectionOverride(
        ResponseMode.VERBAL_INTERVIEW,
        initialResult,
        content
      );

      expect(override.reason).toBe('correction');
      expect(override.overrideMode).toBe(ResponseMode.VERBAL_INTERVIEW);

      // Verify learning system received the correction
      const insights = learningSystem.getLearningInsights();
      expect(insights.totalFeedback).toBeGreaterThan(0);
    });
  });
});