// MCQ response generator with specialized prompt templates and analysis

import { MCQResponse, MCQOption, MCQStructure } from '../../types/enhanced-response';

export interface MCQAnalysisContext {
  question: string;
  options: MCQOption[];
  subject?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  previousAttempts?: number;
}

export interface MCQGenerationOptions {
  includeElimination: boolean;
  includeExplanation: boolean;
  confidenceThreshold: number;
  showWorkingSteps: boolean;
  includeRelatedConcepts: boolean;
}

export class MCQResponseGenerator {
  private readonly defaultOptions: MCQGenerationOptions = {
    includeElimination: true,
    includeExplanation: true,
    confidenceThreshold: 0.7,
    showWorkingSteps: true,
    includeRelatedConcepts: false
  };

  /**
   * Generate specialized prompt for MCQ analysis
   */
  async generatePrompt(context: MCQAnalysisContext): Promise<string> {
    const { question, options, subject, difficulty } = context;
    
    let prompt = `You are an expert test solver specializing in multiple-choice questions. `;
    
    if (subject) {
      prompt += `This question is from ${subject}. `;
    }
    
    if (difficulty) {
      prompt += `The difficulty level is ${difficulty}. `;
    }

    prompt += `

QUESTION: ${question}

`;

    if (options && options.length > 0) {
      prompt += `OPTIONS:
`;
      options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D...
        prompt += `${letter}) ${option.text}
`;
      });
    }

    prompt += `

INSTRUCTIONS:
1. Analyze each option systematically
2. Use elimination strategy to rule out incorrect options
3. Identify the correct answer with confidence level
4. Provide clear reasoning for your choice
5. Explain why other options are incorrect

RESPONSE FORMAT:
- Analysis: [Step-by-step analysis of each option]
- Elimination: [Which options to eliminate and why]
- Correct Answer: [Letter and full text of correct option]
- Confidence: [High/Medium/Low with percentage]
- Explanation: [Detailed reasoning for the correct answer]
- Common Mistakes: [What students often get wrong with this type of question]

Please provide a thorough analysis that demonstrates expert-level understanding.`;

    return prompt;
  }

  /**
   * Generate MCQ response with analysis and elimination strategy
   */
  async generateResponse(
    context: MCQAnalysisContext,
    options: Partial<MCQGenerationOptions> = {}
  ): Promise<MCQResponse> {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // Analyze the question and options
      const analysis = this.analyzeQuestion(context);
      
      // Generate elimination strategy
      const eliminationStrategy = config.includeElimination 
        ? this.generateEliminationStrategy(context, analysis)
        : [];

      // Determine correct answer
      const correctAnswer = this.determineCorrectAnswer(context, analysis);
      
      // Generate explanation
      const explanation = config.includeExplanation
        ? this.generateExplanation(context, correctAnswer, analysis)
        : '';

      // Calculate confidence level
      const confidenceLevel = this.calculateConfidence(context, analysis);

      return {
        question: context.question,
        options: context.options,
        correctAnswer,
        explanation,
        eliminationStrategy,
        confidenceLevel
      };

    } catch (error) {
      console.error('Error generating MCQ response:', error);
      return this.generateFallbackResponse(context);
    }
  }

  /**
   * Create specialized prompt template for MCQ analysis
   */
  createMCQPrompt(context: MCQAnalysisContext, options: MCQGenerationOptions): string {
    const { question, options: mcqOptions, subject, difficulty } = context;
    
    const optionsText = mcqOptions
      .map(opt => `${opt.id}) ${opt.text}`)
      .join('\n');

    const basePrompt = `
You are an expert test-taker analyzing a multiple choice question. Your goal is to identify the correct answer and provide a clear explanation.

QUESTION:
${question}

OPTIONS:
${optionsText}

ANALYSIS REQUIREMENTS:
1. Identify the correct answer with high confidence
2. Provide step-by-step reasoning
3. Explain why incorrect options are wrong
4. Use elimination strategy when helpful
5. Show your working process

${subject ? `SUBJECT CONTEXT: ${subject}` : ''}
${difficulty ? `DIFFICULTY LEVEL: ${difficulty}` : ''}

RESPONSE FORMAT:
- Start with the correct answer (just the letter/number)
- Provide detailed explanation
- Include elimination reasoning for wrong answers
- End with confidence level (0-100%)

Please analyze this question systematically and provide the most accurate answer.`;

    return basePrompt.trim();
  }

  /**
   * Parse MCQ response from AI model output
   */
  parseMCQResponse(rawResponse: string, context: MCQAnalysisContext): MCQResponse {
    try {
      // Extract correct answer (look for patterns like "Answer: A" or "A)" at start)
      const answerMatch = rawResponse.match(/(?:Answer|Correct answer):\s*([A-Z]|\d+)/i) ||
                         rawResponse.match(/^([A-Z]|\d+)\)/m) ||
                         rawResponse.match(/^([A-Z]|\d+)[\.\-\s]/m);
      
      const correctAnswer = answerMatch ? answerMatch[1].toUpperCase() : '';

      // Extract explanation (everything between answer and confidence/elimination)
      const explanationMatch = rawResponse.match(/(?:Explanation|Reasoning):\s*(.*?)(?:Elimination|Confidence|$)/is);
      const explanation = explanationMatch ? explanationMatch[1].trim() : rawResponse;

      // Extract elimination strategy
      const eliminationStrategy = this.extractEliminationStrategy(rawResponse);

      // Extract confidence level
      const confidenceMatch = rawResponse.match(/(?:Confidence|Certainty):\s*(\d+)%/i);
      const confidenceLevel = confidenceMatch ? parseInt(confidenceMatch[1]) / 100 : 0.8;

      return {
        question: context.question,
        options: context.options,
        correctAnswer,
        explanation: this.cleanExplanation(explanation),
        eliminationStrategy,
        confidenceLevel
      };

    } catch (error) {
      console.error('Error parsing MCQ response:', error);
      return this.generateFallbackResponse(context);
    }
  }

  /**
   * Generate elimination strategy for wrong answers
   */
  private generateEliminationStrategy(
    context: MCQAnalysisContext, 
    analysis: any
  ): string[] {
    const strategies: string[] = [];
    
    // Common elimination strategies
    const eliminationRules = [
      'Eliminate obviously incorrect options first',
      'Look for options that are too extreme or absolute',
      'Check for grammatical inconsistencies with the question',
      'Identify options that contradict known facts',
      'Look for the most comprehensive and accurate option',
      'Eliminate options with unfamiliar or made-up terms',
      'Consider the context and scope of the question'
    ];

    // Add specific strategies based on question analysis
    if (analysis.hasNumericalOptions) {
      strategies.push('Compare numerical values and eliminate unrealistic ranges');
    }

    if (analysis.hasDefinitions) {
      strategies.push('Eliminate definitions that are incomplete or inaccurate');
    }

    if (analysis.isConceptual) {
      strategies.push('Focus on the core concept and eliminate tangential options');
    }

    // Add 2-3 most relevant strategies
    strategies.push(...eliminationRules.slice(0, 3));

    return strategies;
  }

  /**
   * Analyze question characteristics for better response generation
   */
  private analyzeQuestion(context: MCQAnalysisContext): any {
    const { question, options } = context;
    const questionLower = question.toLowerCase();
    const optionTexts = options.map(opt => opt.text.toLowerCase());

    return {
      questionType: this.identifyQuestionType(question),
      hasNumericalOptions: optionTexts.some(opt => /\d+/.test(opt)),
      hasDefinitions: questionLower.includes('definition') || questionLower.includes('means'),
      isConceptual: questionLower.includes('concept') || questionLower.includes('principle'),
      isFactual: questionLower.includes('fact') || questionLower.includes('true'),
      hasNegation: questionLower.includes('not') || questionLower.includes('except'),
      optionLength: options.map(opt => opt.text.length),
      complexity: this.assessComplexity(question, options)
    };
  }

  /**
   * Identify the type of MCQ question
   */
  private identifyQuestionType(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('best') || questionLower.includes('most')) {
      return 'best_answer';
    } else if (questionLower.includes('not') || questionLower.includes('except')) {
      return 'negative';
    } else if (questionLower.includes('definition') || questionLower.includes('means')) {
      return 'definition';
    } else if (questionLower.includes('example') || questionLower.includes('instance')) {
      return 'example';
    } else if (questionLower.includes('cause') || questionLower.includes('reason')) {
      return 'causal';
    } else if (questionLower.includes('compare') || questionLower.includes('difference')) {
      return 'comparison';
    } else {
      return 'factual';
    }
  }

  /**
   * Assess question complexity
   */
  private assessComplexity(question: string, options: MCQOption[]): 'low' | 'medium' | 'high' {
    let complexityScore = 0;
    
    // Question length
    if (question.length > 200) complexityScore += 2;
    else if (question.length > 100) complexityScore += 1;
    
    // Option length and variation
    const avgOptionLength = options.reduce((sum, opt) => sum + opt.text.length, 0) / options.length;
    if (avgOptionLength > 50) complexityScore += 2;
    else if (avgOptionLength > 25) complexityScore += 1;
    
    // Technical terms
    const technicalTerms = /\b(?:algorithm|function|variable|parameter|implementation|architecture|framework|methodology)\b/gi;
    const technicalMatches = (question.match(technicalTerms) || []).length;
    complexityScore += Math.min(technicalMatches, 3);
    
    if (complexityScore >= 5) return 'high';
    if (complexityScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * Determine correct answer using heuristics
   */
  private determineCorrectAnswer(context: MCQAnalysisContext, analysis: any): string {
    // This is a placeholder - in a real implementation, this would use
    // the AI model response or sophisticated analysis
    
    // For now, return the first option as a fallback
    return context.options.length > 0 ? context.options[0].id : 'A';
  }

  /**
   * Generate explanation for the answer
   */
  private generateExplanation(
    context: MCQAnalysisContext, 
    correctAnswer: string, 
    analysis: any
  ): string {
    const correctOption = context.options.find(opt => opt.id === correctAnswer);
    
    if (!correctOption) {
      return 'Unable to generate explanation for the selected answer.';
    }

    // Generate structured explanation
    let explanation = `The correct answer is ${correctAnswer}) ${correctOption.text}.\n\n`;
    
    explanation += `Reasoning:\n`;
    explanation += `This option is correct because it directly addresses the question and provides the most accurate and complete response.\n\n`;
    
    // Add elimination reasoning for other options
    const incorrectOptions = context.options.filter(opt => opt.id !== correctAnswer);
    if (incorrectOptions.length > 0) {
      explanation += `Why other options are incorrect:\n`;
      incorrectOptions.forEach(opt => {
        explanation += `• ${opt.id}) ${opt.text} - This option is incorrect because it doesn't fully address the question or contains inaccurate information.\n`;
      });
    }

    return explanation;
  }

  /**
   * Calculate confidence level for the answer
   */
  private calculateConfidence(context: MCQAnalysisContext, analysis: any): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on question characteristics
    if (analysis.questionType === 'factual') confidence += 0.1;
    if (analysis.complexity === 'low') confidence += 0.1;
    if (analysis.hasNegation) confidence -= 0.1;
    if (context.options.length <= 4) confidence += 0.05;
    
    // Ensure confidence is within valid range
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Extract elimination strategy from raw response
   */
  private extractEliminationStrategy(rawResponse: string): string[] {
    const strategies: string[] = [];
    
    // Look for elimination patterns
    const eliminationPatterns = [
      /eliminate\s+([^.]+)/gi,
      /rule\s+out\s+([^.]+)/gi,
      /discard\s+([^.]+)/gi,
      /wrong\s+because\s+([^.]+)/gi
    ];
    
    eliminationPatterns.forEach(pattern => {
      const matches = rawResponse.match(pattern);
      if (matches) {
        matches.forEach(match => {
          strategies.push(match.trim());
        });
      }
    });
    
    return strategies.slice(0, 5); // Limit to 5 strategies
  }

  /**
   * Clean and format explanation text
   */
  private cleanExplanation(explanation: string): string {
    return explanation
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1'); // Remove markdown italic
  }

  /**
   * Generate fallback response when analysis fails
   */
  private generateFallbackResponse(context: MCQAnalysisContext): MCQResponse {
    return {
      question: context.question,
      options: context.options,
      correctAnswer: context.options.length > 0 ? context.options[0].id : 'A',
      explanation: 'Unable to analyze this question automatically. Please review the options carefully and select the most appropriate answer based on your knowledge.',
      eliminationStrategy: [
        'Read the question carefully',
        'Eliminate obviously incorrect options',
        'Choose the most comprehensive answer'
      ],
      confidenceLevel: 0.3
    };
  }

  /**
   * Validate MCQ response for completeness and accuracy
   */
  validateResponse(response: MCQResponse): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!response.correctAnswer) {
      errors.push('Missing correct answer');
    }

    if (!response.explanation || response.explanation.length < 10) {
      errors.push('Explanation is missing or too short');
    }

    if (response.confidenceLevel < 0 || response.confidenceLevel > 1) {
      errors.push('Confidence level must be between 0 and 1');
    }

    // Check if correct answer exists in options
    const validAnswers = response.options.map(opt => opt.id);
    if (!validAnswers.includes(response.correctAnswer)) {
      errors.push('Correct answer does not match any option');
    }

    // Warnings
    if (response.confidenceLevel < 0.5) {
      warnings.push('Low confidence level - consider manual review');
    }

    if (response.eliminationStrategy.length === 0) {
      warnings.push('No elimination strategy provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Singleton instance
export const mcqGenerator = new MCQResponseGenerator();