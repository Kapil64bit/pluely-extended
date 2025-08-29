// Unit tests for enhanced interview detector

import { describe, it, beforeEach, expect } from './test-utils';
import { InterviewDetector, InterviewQuestionType, InterviewContext, ResponseStyle } from '../interview-detector';

describe('InterviewDetector', () => {
  let detector: InterviewDetector;

  beforeEach(() => {
    detector = new InterviewDetector();
  });

  describe('Behavioral Questions', () => {
    it('should detect behavioral interview questions', () => {
      const behavioralQuestion = `
        Tell me about a time when you faced a difficult situation at work.
        How did you handle the challenge and what was the outcome?
      `;

      const result = detector.detectInterviewQuestion(behavioralQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.BEHAVIORAL);
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.STORYTELLING);
      expect(result.matchedPatterns.conversationalCues).toContain('tell me about');
    });

    it('should detect STAR method questions', () => {
      const starQuestion = `
        Describe a situation where you had to work with a difficult team member.
        What actions did you take and what were the results?
      `;

      const result = detector.detectInterviewQuestion(starQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.BEHAVIORAL);
      expect(result.matchedPatterns.imperativeVerbs).toContain('describe');
    });
  });

  describe('Technical Questions', () => {
    it('should detect technical interview questions', () => {
      const technicalQuestion = `
        How would you design a scalable API for a social media platform?
        What database would you choose and why?
      `;

      const result = detector.detectInterviewQuestion(technicalQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.TECHNICAL);
      expect(result.context).toBe(InterviewContext.TECHNICAL_INTERVIEW);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.ANALYTICAL);
    });

    it('should detect algorithm questions', () => {
      const algorithmQuestion = `
        Explain how you would implement a binary search algorithm.
        What is the time complexity and why?
      `;

      const result = detector.detectInterviewQuestion(algorithmQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.TECHNICAL);
      expect(result.matchedPatterns.imperativeVerbs).toContain('explain');
    });
  });

  describe('Experience Questions', () => {
    it('should detect experience-based questions', () => {
      const experienceQuestion = `
        What experience do you have with React and Node.js?
        Have you worked on any large-scale projects?
      `;

      const result = detector.detectInterviewQuestion(experienceQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.EXPERIENCE);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.CONFIDENT);
      expect(result.matchedPatterns.questionWords).toContain('what');
    });
  });

  describe('Situational Questions', () => {
    it('should detect situational interview questions', () => {
      const situationalQuestion = `
        If you were given a project with an impossible deadline,
        how would you approach the situation?
      `;

      const result = detector.detectInterviewQuestion(situationalQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.SITUATIONAL);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.THOUGHTFUL);
      expect(result.matchedPatterns.modalVerbs).toContain('would');
    });

    it('should detect hypothetical scenarios', () => {
      const hypotheticalQuestion = `
        Suppose you had to choose between two competing priorities.
        What factors would you consider in making your decision?
      `;

      const result = detector.detectInterviewQuestion(hypotheticalQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.SITUATIONAL);
      expect(result.matchedPatterns.questionWords).toContain('what');
    });
  });

  describe('Opinion Questions', () => {
    it('should detect opinion-based questions', () => {
      const opinionQuestion = `
        What are your thoughts on remote work?
        Do you prefer working in a team or independently?
      `;

      const result = detector.detectInterviewQuestion(opinionQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.OPINION);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.THOUGHTFUL);
      expect(result.matchedPatterns.questionWords).toContain('what');
    });
  });

  describe('Cultural Fit Questions', () => {
    it('should detect cultural fit questions', () => {
      const culturalQuestion = `
        How do you think you would fit into our company culture?
        What values are important to you in a work environment?
      `;

      const result = detector.detectInterviewQuestion(culturalQuestion);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.questionType).toBe(InterviewQuestionType.CULTURAL_FIT);
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.ENTHUSIASTIC);
      expect(result.matchedPatterns.questionWords).toContain('how');
      expect(result.matchedPatterns.questionWords).toContain('what');
    });
  });

  describe('Context Detection', () => {
    it('should detect job interview context', () => {
      const jobQuestion = `
        Tell me about your career goals and how this position fits into them.
      `;

      const result = detector.detectInterviewQuestion(jobQuestion);
      
      expect(result.context).toBe(InterviewContext.JOB_INTERVIEW);
      expect(result.matchedPatterns.professionalTerms).toContain('career');
    });

    it('should detect technical interview context', () => {
      const techQuestion = `
        How would you optimize database performance for high-traffic applications?
      `;

      const result = detector.detectInterviewQuestion(techQuestion);
      
      expect(result.context).toBe(InterviewContext.TECHNICAL_INTERVIEW);
    });

    it('should detect casual conversation context', () => {
      const casualQuestion = `
        Hey, can you tell me what you think about this new framework?
        I'd love to hear your thoughts on it.
      `;

      const result = detector.detectInterviewQuestion(casualQuestion);
      
      expect(result.context).toBe(InterviewContext.CASUAL_CONVERSATION);
      expect(result.matchedPatterns.conversationalCues.length).toBeGreaterThan(1);
    });
  });

  describe('Response Style Suggestions', () => {
    it('should suggest storytelling for behavioral questions', () => {
      const behavioralQuestion = `
        Describe a time when you had to deal with a difficult customer.
      `;

      const result = detector.detectInterviewQuestion(behavioralQuestion);
      
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.STORYTELLING);
    });

    it('should suggest analytical for technical questions', () => {
      const technicalQuestion = `
        How would you design a caching system for a web application?
      `;

      const result = detector.detectInterviewQuestion(technicalQuestion);
      
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.ANALYTICAL);
    });

    it('should suggest confident for experience questions', () => {
      const experienceQuestion = `
        What programming languages are you most comfortable with?
      `;

      const result = detector.detectInterviewQuestion(experienceQuestion);
      
      expect(result.suggestedResponseStyle).toBe(ResponseStyle.CONFIDENT);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const result = detector.detectInterviewQuestion('');
      
      expect(result.isInterviewQuestion).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle non-question text', () => {
      const statement = `
        This is just a regular statement about programming concepts.
        It contains no questions or interview-related content.
      `;

      const result = detector.detectInterviewQuestion(statement);
      
      expect(result.isInterviewQuestion).toBe(false);
      expect(result.confidence).toBeLessThan(0.4);
    });

    it('should handle mixed content', () => {
      const mixedContent = `
        Here's some background information about our company.
        Now, tell me about your experience with JavaScript frameworks.
        We use React extensively in our projects.
      `;

      const result = detector.detectInterviewQuestion(mixedContent);
      
      expect(result.isInterviewQuestion).toBe(true);
      expect(result.matchedPatterns.conversationalCues).toContain('tell me about');
    });
  });

  describe('Detailed Analysis', () => {
    it('should provide detailed analysis', () => {
      const question = `
        Can you walk me through your problem-solving process?
        How do you approach complex technical challenges?
      `;

      const analysis = detector.getDetailedAnalysis(question);
      
      expect(analysis.sentences).toBeDefined();
      expect(analysis.sentenceAnalyses).toBeDefined();
      expect(analysis.indicators).toBeDefined();
      expect(analysis.sentences.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Matching', () => {
    it('should match question words correctly', () => {
      const question = `What is your experience with how you handle why situations?`;

      const result = detector.detectInterviewQuestion(question);
      
      expect(result.matchedPatterns.questionWords).toContain('what');
      expect(result.matchedPatterns.questionWords).toContain('how');
      expect(result.matchedPatterns.questionWords).toContain('why');
    });

    it('should match modal verbs correctly', () => {
      const question = `Could you tell me how you would handle this situation?`;

      const result = detector.detectInterviewQuestion(question);
      
      expect(result.matchedPatterns.modalVerbs).toContain('could');
      expect(result.matchedPatterns.modalVerbs).toContain('would');
    });

    it('should match conversational cues correctly', () => {
      const question = `Can you walk me through your approach? Tell me about your experience.`;

      const result = detector.detectInterviewQuestion(question);
      
      expect(result.matchedPatterns.conversationalCues).toContain('can you');
      expect(result.matchedPatterns.conversationalCues).toContain('tell me about');
    });
  });
});