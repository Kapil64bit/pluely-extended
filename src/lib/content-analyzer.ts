// Content analysis engine for screenshot processing and question classification

import { 
  ContentAnalysis, 
  CodeDetection, 
  MCQStructure, 
  MCQOption 
} from '../types/enhanced-response';
import { ocrService } from './ocr-service';
import { languageDetector } from './language-detector';
import { interviewDetector, InterviewDetectionResult } from './interview-detector';

export class ContentAnalyzer {
  private codeKeywords: Record<string, string[]> = {
    javascript: [
      'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while',
      'class', 'extends', 'import', 'export', 'async', 'await', 'promise',
      'console.log', 'document', 'window', 'addEventListener', '=>', '===', '!=='
    ],
    python: [
      'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while',
      'try', 'except', 'finally', 'with', 'as', 'lambda', 'yield', 'print(',
      '__init__', '__main__', 'self', 'True', 'False', 'None'
    ],
    java: [
      'public', 'private', 'protected', 'static', 'final', 'class', 'interface',
      'extends', 'implements', 'import', 'package', 'return', 'if', 'else',
      'for', 'while', 'try', 'catch', 'finally', 'new', 'this', 'super',
      'String', 'int', 'boolean', 'void', 'System.out.println'
    ],
    cpp: [
      '#include', 'using', 'namespace', 'std', 'int', 'char', 'float', 'double',
      'bool', 'void', 'class', 'struct', 'public', 'private', 'protected',
      'return', 'if', 'else', 'for', 'while', 'cout', 'cin', 'endl', '::'
    ],
    csharp: [
      'using', 'namespace', 'class', 'interface', 'struct', 'enum', 'public',
      'private', 'protected', 'static', 'readonly', 'const', 'var', 'string',
      'int', 'bool', 'void', 'return', 'if', 'else', 'for', 'while',
      'Console.WriteLine', 'new', 'this', 'base'
    ],
    go: [
      'package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface',
      'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default',
      'go', 'defer', 'chan', 'select', 'fmt.Println', ':='
    ],
    rust: [
      'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'impl', 'trait',
      'use', 'mod', 'pub', 'return', 'if', 'else', 'for', 'while', 'loop',
      'match', 'Some', 'None', 'Result', 'Ok', 'Err', 'println!'
    ]
  };

  private syntaxPatterns: RegExp[] = [
    // Function definitions
    /function\s+\w+\s*\(/gi,
    /def\s+\w+\s*\(/gi,
    /public\s+\w+\s+\w+\s*\(/gi,
    /fn\s+\w+\s*\(/gi,
    
    // Variable declarations
    /(?:let|const|var)\s+\w+\s*=/gi,
    /\w+\s+\w+\s*=\s*.+;/gi,
    
    // Control structures
    /if\s*\(.+\)\s*{/gi,
    /for\s*\(.+\)\s*{/gi,
    /while\s*\(.+\)\s*{/gi,
    
    // Common programming symbols
    /[{}();]/g,
    /[=!<>]=?/g,
    /&&|\|\|/g,
    /\+\+|--/g,
    
    // Comments
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//g,
    /#.*$/gm,
    
    // String literals
    /"[^"]*"/g,
    /'[^']*'/g,
    /`[^`]*`/g
  ];

  private mcqPatterns: RegExp[] = [
    // Letter options: A), B), C), D)
    /^[A-Z]\)\s*.+$/gm,
    /^[a-z]\)\s*.+$/gm,
    
    // Letter options: A., B., C., D.
    /^[A-Z]\.\s*.+$/gm,
    /^[a-z]\.\s*.+$/gm,
    
    // Number options: 1), 2), 3), 4)
    /^\d+\)\s*.+$/gm,
    
    // Number options: 1., 2., 3., 4.
    /^\d+\.\s*.+$/gm,
    
    // Parentheses options: (A), (B), (C), (D)
    /^\([A-Za-z]\)\s*.+$/gm,
    /^\(\d+\)\s*.+$/gm
  ];

  private interviewKeywords: string[] = [
    'explain', 'describe', 'what is', 'how does', 'why', 'when', 'where',
    'tell me about', 'can you', 'would you', 'have you', 'experience with',
    'worked with', 'familiar with', 'opinion on', 'thoughts on', 'approach to',
    'handle', 'deal with', 'solve', 'implement', 'design', 'architecture',
    'difference between', 'compare', 'pros and cons', 'advantages', 'disadvantages'
  ];

  /**
   * Analyzes screenshot content to extract meaningful information
   */
  async analyzeScreenshot(base64Image: string): Promise<ContentAnalysis> {
    try {
      // For now, we'll simulate OCR text extraction
      // In a real implementation, this would use an OCR service
      const extractedText = await this.extractTextFromImage(base64Image);
      
      // Perform various content detections
      const codeDetection = this.detectCodePatterns(extractedText);
      const mcqStructure = this.identifyMCQStructure(extractedText);
      const hasInterviewQuestion = this.detectInterviewQuestion(extractedText);
      
      // Get detailed interview analysis
      const interviewAnalysis = hasInterviewQuestion ? 
        interviewDetector.detectInterviewQuestion(extractedText) : null;
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(codeDetection, mcqStructure, hasInterviewQuestion, extractedText);
      
      // Extract key elements
      const keyElements = this.extractKeyElements(extractedText, codeDetection, mcqStructure, interviewAnalysis);

      return {
        extractedText,
        hasCode: codeDetection.detected,
        hasMCQ: mcqStructure.detected,
        hasInterviewQuestion,
        programmingLanguage: codeDetection.language,
        confidence,
        keyElements,
        interviewAnalysis: interviewAnalysis ? {
          questionType: interviewAnalysis.questionType,
          context: interviewAnalysis.context,
          suggestedResponseStyle: interviewAnalysis.suggestedResponseStyle,
          confidence: interviewAnalysis.confidence
        } : undefined
      };
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      return {
        extractedText: '',
        hasCode: false,
        hasMCQ: false,
        hasInterviewQuestion: false,
        confidence: 0,
        keyElements: []
      };
    }
  }

  /**
   * Extract text from image using OCR service
   */
  private async extractTextFromImage(base64Image: string): Promise<string> {
    try {
      const result = await ocrService.extractText(base64Image);
      return result.text;
    } catch (error) {
      console.error('Text extraction failed:', error);
      return '';
    }
  }

  /**
   * Detects code patterns and programming language using enhanced detection
   */
  detectCodePatterns(content: string): CodeDetection {
    if (!content || content.trim().length === 0) {
      return {
        detected: false,
        confidence: 0,
        keywords: [],
        syntaxPatterns: []
      };
    }

    // Use enhanced language detector
    const languageResult = languageDetector.detectLanguage(content);
    
    // Get context clues for additional validation
    const contextClues = languageDetector.getContextClues(content);
    
    // Combine results from enhanced detector with legacy patterns
    const legacyResult = this.detectCodePatternsLegacy(content);
    
    // Determine if code is detected based on multiple factors
    const detected = languageResult.confidence > 0.3 || 
                    legacyResult.detected ||
                    contextClues.hasFunctions ||
                    contextClues.hasClasses ||
                    contextClues.hasImports;

    // Combine keywords and patterns
    const allKeywords = [
      ...languageResult.matchedFeatures.keywords,
      ...legacyResult.keywords
    ];
    
    const allPatterns = [
      ...languageResult.matchedFeatures.syntaxPatterns,
      ...languageResult.matchedFeatures.uniqueFeatures,
      ...languageResult.matchedFeatures.structuralElements,
      ...legacyResult.syntaxPatterns
    ];

    // Calculate final confidence
    const enhancedConfidence = languageResult.confidence;
    const legacyConfidence = legacyResult.confidence;
    const contextBonus = this.calculateContextBonus(contextClues);
    
    const finalConfidence = Math.min(
      Math.max(enhancedConfidence, legacyConfidence) + contextBonus,
      1.0
    );

    return {
      detected,
      language: detected ? languageResult.language : undefined,
      keywords: [...new Set(allKeywords)], // Remove duplicates
      syntaxPatterns: [...new Set(allPatterns)].slice(0, 10), // Limit and remove duplicates
      confidence: finalConfidence,
      // Additional metadata from enhanced detection
      alternativeLanguages: languageResult.alternativeLanguages,
      contextClues
    };
  }

  /**
   * Legacy code detection for backward compatibility
   */
  private detectCodePatternsLegacy(content: string): CodeDetection {
    const contentLower = content.toLowerCase();
    let bestLanguage = '';
    let maxScore = 0;
    let detectedKeywords: string[] = [];
    let detectedPatterns: string[] = [];

    // Check for programming language keywords
    for (const [language, keywords] of Object.entries(this.codeKeywords)) {
      let score = 0;
      const foundKeywords: string[] = [];

      for (const keyword of keywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          score++;
          foundKeywords.push(keyword);
        }
      }

      if (score > maxScore) {
        maxScore = score;
        bestLanguage = language;
        detectedKeywords = foundKeywords;
      }
    }

    // Check for syntax patterns
    for (const pattern of this.syntaxPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        detectedPatterns.push(...matches.slice(0, 3)); // Limit to first 3 matches
      }
    }

    // Calculate confidence based on keyword density and syntax patterns
    const keywordDensity = detectedKeywords.length / Math.max(content.split(/\s+/).length, 1);
    const syntaxScore = Math.min(detectedPatterns.length / 5, 1); // Normalize to 0-1
    const confidence = Math.min((keywordDensity * 10 + syntaxScore) / 2, 1);

    const detected = maxScore >= 2 || detectedPatterns.length >= 3;

    return {
      detected,
      language: detected ? bestLanguage : undefined,
      keywords: detectedKeywords,
      syntaxPatterns: detectedPatterns,
      confidence
    };
  }

  /**
   * Calculate context bonus for code detection confidence
   */
  private calculateContextBonus(contextClues: any): number {
    let bonus = 0;
    
    if (contextClues.hasFunctions) bonus += 0.2;
    if (contextClues.hasClasses) bonus += 0.15;
    if (contextClues.hasImports) bonus += 0.1;
    if (contextClues.hasComments) bonus += 0.05;
    if (contextClues.indentationStyle === 'spaces' || contextClues.indentationStyle === 'tabs') {
      bonus += 0.1;
    }
    if (contextClues.codeComplexity === 'medium' || contextClues.codeComplexity === 'high') {
      bonus += 0.1;
    }
    
    return Math.min(bonus, 0.3); // Cap bonus at 0.3
  }

  /**
   * Identifies MCQ structure in content
   */
  identifyMCQStructure(content: string): MCQStructure {
    if (!content || content.trim().length === 0) {
      return {
        detected: false,
        options: [],
        questionText: '',
        confidence: 0
      };
    }

    const options: MCQOption[] = [];
    let questionText = '';
    let patternMatches = 0;

    // Try each MCQ pattern
    for (const pattern of this.mcqPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length >= 2) {
        patternMatches++;
        
        // Extract options
        matches.forEach((match, index) => {
          const trimmed = match.trim();
          let label = '';
          let text = '';

          // Extract label and text based on pattern
          if (trimmed.match(/^[A-Za-z]\)/)) {
            label = trimmed.charAt(0).toUpperCase();
            text = trimmed.substring(2).trim();
          } else if (trimmed.match(/^[A-Za-z]\./)) {
            label = trimmed.charAt(0).toUpperCase();
            text = trimmed.substring(2).trim();
          } else if (trimmed.match(/^\d+[\).]/)) {
            const numMatch = trimmed.match(/^\d+/);
            label = numMatch ? numMatch[0] : String(index + 1);
            text = trimmed.replace(/^\d+[\).]/, '').trim();
          } else if (trimmed.match(/^\([A-Za-z0-9]+\)/)) {
            const labelMatch = trimmed.match(/^\(([A-Za-z0-9]+)\)/);
            label = labelMatch ? labelMatch[1].toUpperCase() : String(index + 1);
            text = trimmed.replace(/^\([A-Za-z0-9]+\)/, '').trim();
          }

          if (label && text && !options.some(opt => opt.id === label)) {
            options.push({
              id: label,
              text,
              label
            });
          }
        });

        // If we found good options, try to extract question text
        if (options.length >= 2) {
          const lines = content.split('\n');
          const firstOptionIndex = lines.findIndex(line => 
            this.mcqPatterns.some(p => p.test(line))
          );
          
          if (firstOptionIndex > 0) {
            questionText = lines.slice(0, firstOptionIndex)
              .join(' ')
              .trim()
              .replace(/\s+/g, ' ');
          }
          break;
        }
      }
    }

    // Calculate confidence
    const hasMultipleOptions = options.length >= 2;
    const hasQuestionText = questionText.length > 10;
    const patternStrength = Math.min(patternMatches / 2, 1);
    
    let confidence = 0;
    if (hasMultipleOptions) confidence += 0.5;
    if (hasQuestionText) confidence += 0.3;
    confidence += patternStrength * 0.2;

    const detected = hasMultipleOptions && confidence > 0.6;

    return {
      detected,
      options: options.slice(0, 6), // Limit to 6 options max
      questionText,
      confidence
    };
  }

  /**
   * Detects interview-style questions using enhanced detection
   */
  private detectInterviewQuestion(content: string): boolean {
    if (!content || content.trim().length === 0) {
      return false;
    }

    // Use enhanced interview detector
    const result = interviewDetector.detectInterviewQuestion(content);
    
    // Also run legacy detection for comparison
    const legacyResult = this.detectInterviewQuestionLegacy(content);
    
    // Return true if either method detects interview question with sufficient confidence
    return result.isInterviewQuestion || legacyResult;
  }

  /**
   * Legacy interview detection for backward compatibility
   */
  private detectInterviewQuestionLegacy(content: string): boolean {
    const contentLower = content.toLowerCase();
    let score = 0;

    // Check for interview keywords
    for (const keyword of this.interviewKeywords) {
      if (contentLower.includes(keyword)) {
        score++;
      }
    }

    // Check for question patterns
    const questionPatterns = [
      /\?/g, // Question marks
      /^(what|how|why|when|where|who|which)/gmi, // Question words at start
      /can you|could you|would you|will you/gi, // Modal questions
      /tell me|explain|describe/gi // Imperative questions
    ];

    for (const pattern of questionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }

    // Normalize score based on content length
    const normalizedScore = score / Math.max(content.split(/\s+/).length / 10, 1);
    
    return normalizedScore > 0.3;
  }

  /**
   * Get detailed interview analysis
   */
  getInterviewAnalysis(content: string): InterviewDetectionResult {
    return interviewDetector.detectInterviewQuestion(content);
  }

  /**
   * Calculates overall confidence score
   */
  private calculateConfidence(
    codeDetection: CodeDetection,
    mcqStructure: MCQStructure,
    hasInterviewQuestion: boolean,
    content: string
  ): number {
    if (!content || content.trim().length === 0) {
      return 0;
    }

    const factors = [];

    // Code detection confidence
    if (codeDetection.detected) {
      factors.push(codeDetection.confidence * 0.4);
    }

    // MCQ detection confidence
    if (mcqStructure.detected) {
      factors.push(mcqStructure.confidence * 0.4);
    }

    // Interview question confidence
    if (hasInterviewQuestion) {
      factors.push(0.3);
    }

    // Content length factor (longer content generally more reliable)
    const lengthFactor = Math.min(content.length / 500, 1) * 0.2;
    factors.push(lengthFactor);

    // Base confidence for having any content
    factors.push(0.1);

    // Calculate weighted average
    const totalWeight = factors.reduce((sum, factor) => sum + factor, 0);
    return Math.min(totalWeight, 1);
  }

  /**
   * Extracts key elements from content
   */
  private extractKeyElements(
    content: string,
    codeDetection: CodeDetection,
    mcqStructure: MCQStructure,
    interviewAnalysis?: InterviewDetectionResult | null
  ): string[] {
    const elements: string[] = [];

    if (codeDetection.detected) {
      elements.push(`Programming Language: ${codeDetection.language || 'Unknown'}`);
      if (codeDetection.keywords.length > 0) {
        elements.push(`Keywords: ${codeDetection.keywords.slice(0, 5).join(', ')}`);
      }
    }

    if (mcqStructure.detected) {
      elements.push(`MCQ with ${mcqStructure.options.length} options`);
      if (mcqStructure.questionText) {
        elements.push(`Question: ${mcqStructure.questionText.substring(0, 100)}...`);
      }
    }

    if (interviewAnalysis?.isInterviewQuestion) {
      elements.push(`Interview Question: ${interviewAnalysis.questionType}`);
      elements.push(`Context: ${interviewAnalysis.context}`);
      elements.push(`Suggested Style: ${interviewAnalysis.suggestedResponseStyle}`);
      
      if (interviewAnalysis.matchedPatterns.conversationalCues.length > 0) {
        elements.push(`Conversational Cues: ${interviewAnalysis.matchedPatterns.conversationalCues.slice(0, 3).join(', ')}`);
      }
    }

    // Extract potential topics or subjects
    const topics = this.extractTopics(content);
    if (topics.length > 0) {
      elements.push(`Topics: ${topics.slice(0, 3).join(', ')}`);
    }

    return elements;
  }

  /**
   * Extracts potential topics from content
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    const contentLower = content.toLowerCase();

    // Common CS/Programming topics
    const topicKeywords = {
      'Data Structures': ['array', 'list', 'stack', 'queue', 'tree', 'graph', 'hash', 'map'],
      'Algorithms': ['sort', 'search', 'binary', 'recursion', 'dynamic programming', 'greedy'],
      'Web Development': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'node'],
      'Database': ['sql', 'database', 'query', 'table', 'index', 'join', 'mongodb'],
      'System Design': ['scalability', 'load balancer', 'microservices', 'api', 'cache'],
      'Object-Oriented': ['class', 'object', 'inheritance', 'polymorphism', 'encapsulation'],
      'Networking': ['http', 'tcp', 'ip', 'protocol', 'api', 'rest', 'socket'],
      'Security': ['authentication', 'authorization', 'encryption', 'hash', 'security']
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const matches = keywords.filter(keyword => contentLower.includes(keyword));
      if (matches.length >= 2) {
        topics.push(topic);
      }
    }

    return topics;
  }
}

// Singleton instance
export const contentAnalyzer = new ContentAnalyzer();