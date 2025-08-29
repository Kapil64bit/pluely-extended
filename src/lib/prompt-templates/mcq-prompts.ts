// Specialized prompt templates for MCQ analysis and response generation

import { MCQAnalysisContext } from '../response-generators/mcq-generator';

export interface MCQPromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export class MCQPromptTemplates {
  /**
   * Standard MCQ analysis prompt
   */
  static readonly STANDARD_MCQ: MCQPromptTemplate = {
    name: 'standard_mcq',
    description: 'Standard multiple choice question analysis',
    template: `You are an expert test-taker with exceptional analytical skills. Analyze this multiple choice question and provide the correct answer with detailed reasoning.

QUESTION:
{{question}}

OPTIONS:
{{options}}

INSTRUCTIONS:
1. Read the question carefully and identify what is being asked
2. Analyze each option systematically
3. Use elimination strategy to rule out incorrect answers
4. Select the most accurate and complete answer
5. Provide clear reasoning for your choice

RESPONSE FORMAT:
ANSWER: [Letter/Number of correct option]

EXPLANATION:
[Detailed explanation of why this answer is correct]

ELIMINATION:
[Explain why each incorrect option is wrong]

CONFIDENCE: [Your confidence level as a percentage]

{{context_hints}}

Analyze this question step by step and provide your best answer.`,
    variables: ['question', 'options', 'context_hints']
  };

  /**
   * Subject-specific MCQ prompt
   */
  static readonly SUBJECT_SPECIFIC: MCQPromptTemplate = {
    name: 'subject_specific',
    description: 'MCQ analysis with subject context',
    template: `You are a {{subject}} expert analyzing a multiple choice question. Use your specialized knowledge to provide the most accurate answer.

SUBJECT: {{subject}}
DIFFICULTY: {{difficulty}}

QUESTION:
{{question}}

OPTIONS:
{{options}}

EXPERT ANALYSIS:
As a {{subject}} expert, consider:
- Key concepts and principles in {{subject}}
- Common misconceptions in this field
- Technical accuracy of each option
- Best practices and current standards

SYSTEMATIC APPROACH:
1. Identify the core concept being tested
2. Apply {{subject}} principles to evaluate each option
3. Consider practical applications and real-world scenarios
4. Eliminate options that contradict established {{subject}} knowledge

RESPONSE FORMAT:
ANSWER: [Correct option]
REASONING: [Expert-level explanation using {{subject}} terminology]
TECHNICAL_DETAILS: [Specific {{subject}} concepts that support this answer]
COMMON_MISTAKES: [Why students might choose wrong answers]
CONFIDENCE: [Percentage based on {{subject}} expertise]

Provide your expert analysis now.`,
    variables: ['subject', 'difficulty', 'question', 'options']
  };

  /**
   * Elimination-focused MCQ prompt
   */
  static readonly ELIMINATION_FOCUSED: MCQPromptTemplate = {
    name: 'elimination_focused',
    description: 'MCQ analysis emphasizing elimination strategy',
    template: `You are a strategic test-taker who excels at elimination techniques. Use systematic elimination to find the correct answer.

QUESTION:
{{question}}

OPTIONS:
{{options}}

ELIMINATION STRATEGY:
Use these systematic steps:

STEP 1 - OBVIOUS ELIMINATIONS:
- Look for clearly wrong answers
- Eliminate options with factual errors
- Remove options that don't address the question

STEP 2 - DETAILED ANALYSIS:
- Compare remaining options carefully
- Look for subtle differences
- Consider completeness and accuracy

STEP 3 - FINAL SELECTION:
- Choose the most comprehensive answer
- Verify it fully addresses the question
- Confirm it's factually accurate

RESPONSE FORMAT:
ELIMINATION_PROCESS:
Option A: [Keep/Eliminate] - [Reason]
Option B: [Keep/Eliminate] - [Reason]
Option C: [Keep/Eliminate] - [Reason]
Option D: [Keep/Eliminate] - [Reason]

FINAL_ANSWER: [Selected option]
REASONING: [Why this option is best among remaining choices]
CONFIDENCE: [Percentage]

Apply this elimination strategy systematically.`,
    variables: ['question', 'options']
  };

  /**
   * Time-pressured MCQ prompt
   */
  static readonly QUICK_ANALYSIS: MCQPromptTemplate = {
    name: 'quick_analysis',
    description: 'Fast MCQ analysis for time-pressured situations',
    template: `You need to answer this multiple choice question quickly but accurately. Use rapid analysis techniques.

TIME LIMIT: {{time_limit}} seconds
QUESTION: {{question}}
OPTIONS: {{options}}

RAPID ANALYSIS TECHNIQUE:
1. SCAN: Quickly read question and identify key terms
2. ELIMINATE: Remove obviously wrong answers immediately
3. COMPARE: Focus on remaining viable options
4. DECIDE: Select based on strongest evidence

QUICK DECISION FACTORS:
- Which option directly answers the question?
- Which option is most complete and accurate?
- Which option uses correct terminology?
- Which option avoids extreme language?

RESPONSE FORMAT:
ANSWER: [Letter/Number]
QUICK_REASONING: [Brief but clear explanation]
ELIMINATED: [Which options you ruled out and why]
CONFIDENCE: [Percentage]

Make your decision now - be decisive but accurate.`,
    variables: ['time_limit', 'question', 'options']
  };

  /**
   * Negative question MCQ prompt
   */
  static readonly NEGATIVE_QUESTION: MCQPromptTemplate = {
    name: 'negative_question',
    description: 'MCQ analysis for negative/exception questions',
    template: `This is a NEGATIVE question (contains "NOT", "EXCEPT", or similar). Pay special attention to what is being asked.

QUESTION: {{question}}
OPTIONS: {{options}}

NEGATIVE QUESTION STRATEGY:
1. IDENTIFY the negative word (NOT, EXCEPT, LEAST, etc.)
2. UNDERSTAND you're looking for the FALSE or EXCEPTION option
3. EVALUATE each option for truth/falsehood
4. SELECT the option that is FALSE or doesn't belong

CAREFUL ANALYSIS:
- Read the question twice to confirm what's being asked
- Look for the option that is incorrect or doesn't fit
- Be extra careful with double negatives
- Verify your answer makes sense in context

RESPONSE FORMAT:
NEGATIVE_WORD: [The negative word in the question]
LOOKING_FOR: [What type of answer - false statement, exception, etc.]

OPTION_ANALYSIS:
A: [True/False] - [Explanation]
B: [True/False] - [Explanation]  
C: [True/False] - [Explanation]
D: [True/False] - [Explanation]

ANSWER: [The FALSE or EXCEPTION option]
VERIFICATION: [Double-check your logic]
CONFIDENCE: [Percentage]

Analyze this negative question carefully.`,
    variables: ['question', 'options']
  };

  /**
   * Generate prompt based on question characteristics
   */
  static generatePrompt(
    context: MCQAnalysisContext,
    templateName?: string
  ): string {
    // Auto-select template if not specified
    if (!templateName) {
      templateName = this.selectBestTemplate(context);
    }

    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return this.fillTemplate(template, context);
  }

  /**
   * Select the best template based on question characteristics
   */
  private static selectBestTemplate(context: MCQAnalysisContext): string {
    const { question, subject, timeLimit } = context;
    const questionLower = question.toLowerCase();

    // Check for negative questions
    if (questionLower.includes('not ') || 
        questionLower.includes('except') || 
        questionLower.includes('least') ||
        questionLower.includes('never')) {
      return 'negative_question';
    }

    // Check for time pressure
    if (timeLimit && timeLimit < 60) {
      return 'quick_analysis';
    }

    // Check for subject-specific context
    if (subject && subject.trim().length > 0) {
      return 'subject_specific';
    }

    // Default to standard template
    return 'standard_mcq';
  }

  /**
   * Get template by name
   */
  private static getTemplate(name: string): MCQPromptTemplate | null {
    const templates = {
      'standard_mcq': this.STANDARD_MCQ,
      'subject_specific': this.SUBJECT_SPECIFIC,
      'elimination_focused': this.ELIMINATION_FOCUSED,
      'quick_analysis': this.QUICK_ANALYSIS,
      'negative_question': this.NEGATIVE_QUESTION
    };

    return templates[name as keyof typeof templates] || null;
  }

  /**
   * Fill template with context data
   */
  private static fillTemplate(
    template: MCQPromptTemplate,
    context: MCQAnalysisContext
  ): string {
    let prompt = template.template;

    // Format options
    const optionsText = context.options
      .map(opt => `${opt.id}) ${opt.text}`)
      .join('\n');

    // Replace variables
    const replacements = {
      question: context.question,
      options: optionsText,
      subject: context.subject || 'General',
      difficulty: context.difficulty || 'medium',
      time_limit: context.timeLimit?.toString() || '60',
      context_hints: this.generateContextHints(context)
    };

    // Replace all variables in template
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Generate context hints based on question analysis
   */
  private static generateContextHints(context: MCQAnalysisContext): string {
    const hints: string[] = [];

    if (context.difficulty === 'hard') {
      hints.push('This is a challenging question - consider multiple perspectives');
    }

    if (context.options.length > 4) {
      hints.push('With many options, use systematic elimination');
    }

    if (context.previousAttempts && context.previousAttempts > 0) {
      hints.push('This question has been attempted before - double-check your reasoning');
    }

    return hints.length > 0 
      ? `ADDITIONAL CONTEXT:\n${hints.map(h => `- ${h}`).join('\n')}`
      : '';
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): MCQPromptTemplate[] {
    return [
      this.STANDARD_MCQ,
      this.SUBJECT_SPECIFIC,
      this.ELIMINATION_FOCUSED,
      this.QUICK_ANALYSIS,
      this.NEGATIVE_QUESTION
    ];
  }

  /**
   * Validate template variables
   */
  static validateTemplate(template: MCQPromptTemplate): boolean {
    // Check if all variables in template are defined in variables array
    const templateVars = template.template.match(/{{(\w+)}}/g) || [];
    const definedVars = template.variables.map(v => `{{${v}}}`);
    
    return templateVars.every(v => definedVars.includes(v));
  }
}