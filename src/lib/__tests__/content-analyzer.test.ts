// Unit tests for content analyzer

import { describe, it, beforeEach, expect } from './test-utils';
import { ContentAnalyzer } from '../content-analyzer';

describe('ContentAnalyzer', () => {
  let analyzer: ContentAnalyzer;

  beforeEach(() => {
    analyzer = new ContentAnalyzer();
  });

  describe('detectCodePatterns', () => {
    it('should detect JavaScript code', () => {
      const jsCode = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        const result = fibonacci(10);
        console.log(result);
      `;

      const result = analyzer.detectCodePatterns(jsCode);
      
      expect(result.detected).toBe(true);
      expect(result.language).toBe('javascript');
      expect(result.keywords).toContain('function');
      expect(result.keywords).toContain('const');
      expect(result.keywords).toContain('return');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.contextClues).toBeDefined();
      expect(result.contextClues?.hasFunctions).toBe(true);
    });

    it('should detect Python code', () => {
      const pythonCode = `
        def fibonacci(n):
            if n <= 1:
                return n
            return fibonacci(n - 1) + fibonacci(n - 2)
        
        result = fibonacci(10)
        print(result)
      `;

      const result = analyzer.detectCodePatterns(pythonCode);
      
      expect(result.detected).toBe(true);
      expect(result.language).toBe('python');
      expect(result.keywords).toContain('def');
      expect(result.keywords).toContain('return');
      expect(result.keywords).toContain('print');
      expect(result.contextClues?.indentationStyle).toBe('spaces');
    });

    it('should detect Java code', () => {
      const javaCode = `
        public class Fibonacci {
          public static int fibonacci(int n) {
            if (n <= 1) return n;
            return fibonacci(n - 1) + fibonacci(n - 2);
          }
          
          public static void main(String[] args) {
            int result = fibonacci(10);
            System.out.println(result);
          }
        }
      `;

      const result = analyzer.detectCodePatterns(javaCode);
      
      expect(result.detected).toBe(true);
      expect(result.language).toBe('java');
      expect(result.keywords).toContain('public');
      expect(result.keywords).toContain('class');
      expect(result.keywords).toContain('static');
      expect(result.contextClues?.hasClasses).toBe(true);
      expect(result.alternativeLanguages).toBeDefined();
    });

    it('should not detect code in plain text', () => {
      const plainText = `
        This is just regular text without any programming content.
        It talks about various topics but contains no code.
      `;

      const result = analyzer.detectCodePatterns(plainText);
      
      expect(result.detected).toBe(false);
      expect(result.language).toBeUndefined();
      expect(result.confidence).toBeLessThan(0.3);
    });

    it('should handle empty input', () => {
      const result = analyzer.detectCodePatterns('');
      
      expect(result.detected).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.keywords).toEqual([]);
    });
  });

  describe('identifyMCQStructure', () => {
    it('should detect MCQ with letter options', () => {
      const mcqText = `
        What is the time complexity of binary search?
        
        A) O(n)
        B) O(log n)
        C) O(n²)
        D) O(1)
      `;

      const result = analyzer.identifyMCQStructure(mcqText);
      
      expect(result.detected).toBe(true);
      expect(result.options).toHaveLength(4);
      expect(result.options[0].id).toBe('A');
      expect(result.options[0].text).toBe('O(n)');
      expect(result.options[1].id).toBe('B');
      expect(result.options[1].text).toBe('O(log n)');
      expect(result.questionText).toContain('time complexity');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should detect MCQ with number options', () => {
      const mcqText = `
        Which of the following is a JavaScript framework?
        
        1) React
        2) Python
        3) MySQL
        4) Linux
      `;

      const result = analyzer.identifyMCQStructure(mcqText);
      
      expect(result.detected).toBe(true);
      expect(result.options).toHaveLength(4);
      expect(result.options[0].id).toBe('1');
      expect(result.options[0].text).toBe('React');
      expect(result.questionText).toContain('JavaScript framework');
    });

    it('should detect MCQ with dot notation', () => {
      const mcqText = `
        What is Node.js?
        
        A. A database system
        B. A JavaScript runtime
        C. A web browser
        D. A CSS framework
      `;

      const result = analyzer.identifyMCQStructure(mcqText);
      
      expect(result.detected).toBe(true);
      expect(result.options).toHaveLength(4);
      expect(result.options[1].text).toBe('A JavaScript runtime');
    });

    it('should not detect MCQ in regular text', () => {
      const regularText = `
        This is a regular paragraph about programming concepts.
        It explains various topics but doesn't have multiple choice options.
        There are no A), B), C), D) patterns here.
      `;

      const result = analyzer.identifyMCQStructure(regularText);
      
      expect(result.detected).toBe(false);
      expect(result.options).toHaveLength(0);
    });

    it('should handle insufficient options', () => {
      const insufficientText = `
        What is JavaScript?
        
        A) A programming language
      `;

      const result = analyzer.identifyMCQStructure(insufficientText);
      
      expect(result.detected).toBe(false);
      expect(result.options).toHaveLength(1);
    });
  });

  describe('detectInterviewQuestion', () => {
    it('should detect interview questions with question words', () => {
      const interviewText = "What is your experience with React? Can you explain how hooks work?";
      const result = (analyzer as any).detectInterviewQuestion(interviewText);
      
      expect(result).toBe(true);
    });

    it('should detect imperative interview questions', () => {
      const interviewText = "Tell me about a challenging project you worked on. Describe your approach to problem solving.";
      const result = (analyzer as any).detectInterviewQuestion(interviewText);
      
      expect(result).toBe(true);
    });

    it('should detect modal interview questions', () => {
      const interviewText = "Could you walk me through your development process? Would you be comfortable working with our tech stack?";
      const result = (analyzer as any).detectInterviewQuestion(interviewText);
      
      expect(result).toBe(true);
    });

    it('should not detect interview questions in technical content', () => {
      const technicalText = "The algorithm runs in O(n) time complexity. It uses a hash map for efficient lookups.";
      const result = (analyzer as any).detectInterviewQuestion(technicalText);
      
      expect(result).toBe(false);
    });

    it('should handle empty input', () => {
      const result = (analyzer as any).detectInterviewQuestion('');
      
      expect(result).toBe(false);
    });

    it('should provide detailed interview analysis', () => {
      const interviewText = "Tell me about a time when you faced a difficult challenge at work.";
      const analysis = analyzer.getInterviewAnalysis(interviewText);
      
      expect(analysis.isInterviewQuestion).toBe(true);
      expect(analysis.questionType).toBeDefined();
      expect(analysis.context).toBeDefined();
      expect(analysis.suggestedResponseStyle).toBeDefined();
      expect(analysis.confidence).toBeGreaterThan(0);
    });
  });

  describe('extractTopics', () => {
    it('should extract programming topics', () => {
      const content = "This question is about arrays and sorting algorithms. We need to implement a binary search tree.";
      const topics = (analyzer as any).extractTopics(content);
      
      expect(topics).toContain('Data Structures');
      expect(topics).toContain('Algorithms');
    });

    it('should extract web development topics', () => {
      const content = "How do you handle state management in React? What about CSS styling and HTML structure?";
      const topics = (analyzer as any).extractTopics(content);
      
      expect(topics).toContain('Web Development');
    });

    it('should extract database topics', () => {
      const content = "Write a SQL query to join two tables and create an index for better performance.";
      const topics = (analyzer as any).extractTopics(content);
      
      expect(topics).toContain('Database');
    });

    it('should return empty array for unrelated content', () => {
      const content = "This is about cooking recipes and gardening tips.";
      const topics = (analyzer as any).extractTopics(content);
      
      expect(topics).toHaveLength(0);
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate high confidence for clear code detection', () => {
      const codeDetection = {
        detected: true,
        confidence: 0.9,
        keywords: ['function', 'return', 'const'],
        syntaxPatterns: ['function test()', 'return value;']
      };
      
      const mcqStructure = {
        detected: false,
        options: [],
        questionText: '',
        confidence: 0
      };
      
      const content = "function test() { return 'hello'; }";
      
      const confidence = (analyzer as any).calculateConfidence(
        codeDetection, 
        mcqStructure, 
        false, 
        content
      );
      
      expect(confidence).toBeGreaterThan(0.5);
    });

    it('should calculate high confidence for clear MCQ detection', () => {
      const codeDetection = {
        detected: false,
        confidence: 0,
        keywords: [],
        syntaxPatterns: []
      };
      
      const mcqStructure = {
        detected: true,
        options: [
          { id: 'A', text: 'Option A', label: 'A' },
          { id: 'B', text: 'Option B', label: 'B' }
        ],
        questionText: 'What is the answer?',
        confidence: 0.8
      };
      
      const content = "What is the answer? A) Option A B) Option B";
      
      const confidence = (analyzer as any).calculateConfidence(
        codeDetection, 
        mcqStructure, 
        false, 
        content
      );
      
      expect(confidence).toBeGreaterThan(0.5);
    });

    it('should return low confidence for empty content', () => {
      const codeDetection = {
        detected: false,
        confidence: 0,
        keywords: [],
        syntaxPatterns: []
      };
      
      const mcqStructure = {
        detected: false,
        options: [],
        questionText: '',
        confidence: 0
      };
      
      const confidence = (analyzer as any).calculateConfidence(
        codeDetection, 
        mcqStructure, 
        false, 
        ''
      );
      
      expect(confidence).toBe(0);
    });
  });
});