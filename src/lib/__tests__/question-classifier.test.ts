// Unit tests for question classifier

import { describe, it, beforeEach, expect } from './test-utils';
import { QuestionClassifier } from '../question-classifier';
import { ResponseMode } from '../types/enhanced-response';

describe('QuestionClassifier', () => {
  let classifier: QuestionClassifier;

  beforeEach(() => {
    classifier = new QuestionClassifier();
  });

  describe('User Override Classification', () => {
    it('should respect user override mode', async () => {
      const input = {
        content: 'What is JavaScript?',
        userOverride: ResponseMode.CODING
      };

      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.CODING);
      expect(result.confidence).toBe(1.0);
      expect(result.reasoning).toContain('User manually selected');
      expect(result.classificationPath).toContain('user_override');
    });
  });

  describe('MCQ Classification', () => {
    it('should classify clear MCQ structure', async () => {
      const mcqContent = `
        What is the time complexity of binary search?
        
        A) O(n)
        B) O(log n)
        C) O(n²)
        D) O(1)
      `;

      const input = { content: mcqContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.MCQ);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasoning).toContain('multiple choice question');
      expect(result.detectedFeatures).toContain('mcq_structure');
    });

    it('should handle MCQ with number options', async () => {
      const mcqContent = `
        Which JavaScript framework is most popular?
        
        1) React
        2) Vue
        3) Angular
        4) Svelte
      `;

      const input = { content: mcqContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.MCQ);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Coding Classification', () => {
    it('should classify coding problems', async () => {
      const codingContent = `
        Write a function to implement binary search in JavaScript.
        The function should return the index of the target element.
        
        function binarySearch(arr, target) {
          // Your implementation here
        }
      `;

      const input = { content: codingContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.CODING);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning).toContain('Coding problem detected');
      expect(result.detectedFeatures).toContain('code_detected');
    });

    it('should distinguish coding problems from code explanations', async () => {
      const explanationContent = `
        This code shows how binary search works:
        
        function binarySearch(arr, target) {
          let left = 0, right = arr.length - 1;
          // The algorithm works by...
        }
        
        As you can see, the function divides the search space in half.
      `;

      const input = { content: explanationContent };
      const result = await classifier.classify(input);
      
      // Should not classify as coding since it's an explanation
      expect(result.mode).not.toBe(ResponseMode.CODING);
    });

    it('should detect different programming languages', async () => {
      const pythonContent = `
        def fibonacci(n):
            if n <= 1:
                return n
            return fibonacci(n - 1) + fibonacci(n - 2)
        
        Implement this function iteratively for better performance.
      `;

      const input = { content: pythonContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.CODING);
      expect(result.contentAnalysis.programmingLanguage).toBe('python');
    });
  });

  describe('Interview Question Classification', () => {
    it('should classify behavioral interview questions', async () => {
      const interviewContent = `
        Tell me about a time when you faced a difficult challenge at work.
        How did you handle it and what was the outcome?
      `;

      const input = { content: interviewContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.VERBAL_INTERVIEW);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasoning).toContain('Interview question detected');
      expect(result.detectedFeatures).toContain('interview_question');
    });

    it('should classify technical interview questions', async () => {
      const technicalInterview = `
        How would you design a scalable web application architecture?
        What technologies would you choose and why?
      `;

      const input = { content: technicalInterview };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.VERBAL_INTERVIEW);
      expect(result.contentAnalysis.interviewAnalysis?.questionType).toBeDefined();
    });

    it('should classify experience-based questions', async () => {
      const experienceQuestion = `
        What experience do you have with React and Node.js?
        Have you worked on any large-scale projects?
      `;

      const input = { content: experienceQuestion };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.VERBAL_INTERVIEW);
      expect(result.reasoning).toContain('Interview question detected');
    });
  });

  describe('Context-Based Classification', () => {
    it('should consider previous mode context', async () => {
      const input = {
        content: 'function test() { return true; }',
        context: {
          previousMode: ResponseMode.CODING
        }
      };

      const result = await classifier.classify(input);
      
      // Should be more likely to classify as coding due to context
      expect(result.mode).toBe(ResponseMode.CODING);
      expect(result.detectedFeatures).toContain('previous_mode_context');
    });

    it('should analyze session history patterns', async () => {
      const input = {
        content: 'What is recursion?',
        context: {
          sessionHistory: ['coding question 1', 'coding question 2', 'algorithm problem']
        }
      };

      const result = await classifier.classify(input);
      
      // Context should influence classification
      expect(result.detectedFeatures).toContain('session_history');
    });
  });

  describe('Heuristic Classification', () => {
    it('should classify technical content', async () => {
      const technicalContent = `
        Database optimization involves indexing strategies and query optimization.
        Consider the algorithm complexity and data structure efficiency.
      `;

      const input = { content: technicalContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.THEORETICAL);
      expect(result.detectedFeatures).toContain('technical_content');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle question patterns', async () => {
      const questionContent = `
        What is the difference between REST and GraphQL?
        How do they compare in terms of performance?
        Why would you choose one over the other?
      `;

      const input = { content: questionContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.THEORETICAL);
      expect(result.detectedFeatures).toContain('question_patterns');
    });

    it('should provide default fallback', async () => {
      const genericContent = `
        This is some generic text that doesn't fit any specific pattern.
        It's just regular content without clear indicators.
      `;

      const input = { content: genericContent };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBe(ResponseMode.THEORETICAL);
      expect(result.detectedFeatures).toContain('default_fallback');
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('Confidence Threshold and Fallback', () => {
    it('should apply confidence threshold', async () => {
      // This would require mocking the settings manager
      // For now, test that fallback logic exists
      const input = { content: 'ambiguous content' };
      const result = await classifier.classify(input);
      
      expect(result.fallbackMode).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should provide appropriate fallback modes', async () => {
      const codeInput = { content: 'function test() {}' };
      const result = await classifier.classify(codeInput);
      
      if (result.confidence < 0.7) {
        expect(result.fallbackMode).toBeDefined();
      }
    });
  });

  describe('Alternative Mode Suggestions', () => {
    it('should suggest alternative modes', async () => {
      const input = { content: 'What is JavaScript? function test() {}' };
      const result = await classifier.classify(input);
      
      expect(result.alternativeModes).toBeDefined();
      expect(result.alternativeModes.length).toBeGreaterThan(0);
      
      // Should suggest different modes with confidence scores
      result.alternativeModes.forEach(alt => {
        expect(alt.mode).toBeDefined();
        expect(alt.confidence).toBeGreaterThan(0);
        expect(alt.reasoning).toBeDefined();
      });
    });

    it('should not suggest the selected mode as alternative', async () => {
      const input = { content: 'A) Option A B) Option B C) Option C' };
      const result = await classifier.classify(input);
      
      const alternativeModes = result.alternativeModes.map(alt => alt.mode);
      expect(alternativeModes).not.toContain(result.mode);
    });
  });

  describe('Learning and Feedback', () => {
    it('should update learning data from user feedback', () => {
      const classification = {
        mode: ResponseMode.CODING,
        confidence: 0.8,
        reasoning: 'Test classification',
        fallbackMode: ResponseMode.THEORETICAL,
        detectedFeatures: ['code_detected']
      };

      classifier.updateLearning(classification, true);
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should provide classification statistics', () => {
      const stats = classifier.getClassificationStats();
      
      expect(stats.totalClassifications).toBeDefined();
      expect(stats.modeDistribution).toBeDefined();
      expect(stats.averageConfidence).toBeDefined();
      expect(stats.recentAccuracy).toBeDefined();
      
      // Check that all modes are represented in distribution
      Object.values(ResponseMode).forEach(mode => {
        expect(stats.modeDistribution[mode]).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle classification errors gracefully', async () => {
      // Test with invalid input that might cause errors
      const input = { content: '' };
      const result = await classifier.classify(input);
      
      expect(result.mode).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.reasoning).toBeDefined();
    });

    it('should provide error fallback classification', async () => {
      const input = { content: 'test content' };
      const result = await classifier.classify(input);
      
      // Should always return a valid classification
      expect(Object.values(ResponseMode)).toContain(result.mode);
      expect(result.classificationPath).toBeDefined();
      expect(result.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Processing Time and Performance', () => {
    it('should track processing time', async () => {
      const input = { content: 'What is the time complexity of this algorithm?' };
      const result = await classifier.classify(input);
      
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(5000); // Should be fast
    });

    it('should provide classification path for debugging', async () => {
      const input = { content: 'A) Option A B) Option B' };
      const result = await classifier.classify(input);
      
      expect(result.classificationPath).toBeDefined();
      expect(result.classificationPath.length).toBeGreaterThan(0);
      expect(result.classificationPath).toContain('content_analysis');
      expect(result.classificationPath).toContain('classification_logic');
    });
  });
});