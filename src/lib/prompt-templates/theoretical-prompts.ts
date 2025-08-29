// Enhanced prompt templates for theoretical explanations with structured formatting

import { TheoreticalAnalysisContext } from '../response-generators/theoretical-generator';

export interface TheoreticalPromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  academicLevels: string[];
}

export class TheoreticalPromptTemplates {
  /**
   * Enhanced comprehensive theoretical explanation prompt
   */
  static readonly ENHANCED_COMPREHENSIVE_EXPLANATION: TheoreticalPromptTemplate = {
    name: 'enhanced_comprehensive_explanation',
    description: 'Enhanced comprehensive theoretical explanation with structured formatting',
    template: `You are an expert educator providing a comprehensive theoretical explanation with enhanced structure and formatting.

QUESTION:
{{question}}

CONTEXT:
- Subject Area: {{subject}}
- Academic Level: {{academic_level}}
- Audience: {{audience}}
- Depth Required: {{depth}}

RESPONSE REQUIREMENTS:
Create a well-structured theoretical response that includes:

1. **TOPIC EXTRACTION**: Identify the main topic/concept being asked about
2. **CONCISE SUMMARY**: Provide a 2-3 sentence overview of the concept
3. **DETAILED EXPLANATION**: Comprehensive explanation with clear structure
4. **KEY POINTS**: 4-6 essential points for understanding (bullet format)
5. **COMMON MISTAKES**: 3-5 frequent errors students make with this concept
6. **RELATED CONCEPTS**: 3-5 related topics that connect to this concept
7. **PITFALLS**: 3-4 potential traps or misconceptions to avoid

FORMATTING GUIDELINES:
- Use clear headings and bullet points for structure
- Include concrete examples where appropriate
- Maintain academic rigor while being accessible
- Use analogies for complex concepts when helpful
- Ensure logical flow from basic to advanced concepts

QUALITY STANDARDS:
- Explanation should be thorough yet concise
- Key points should be actionable and memorable
- Common mistakes should be specific and practical
- Related concepts should show clear connections
- Pitfalls should help prevent real understanding errors

{{additional_context}}

Provide a scholarly yet accessible explanation that builds understanding systematically.`,
    variables: ['question', 'subject', 'academic_level', 'audience', 'depth', 'additional_context'],
    academicLevels: ['beginner', 'intermediate', 'advanced', 'expert']
  };

  /**
   * Structured concept definition prompt
   */
  static readonly STRUCTURED_CONCEPT_DEFINITION: TheoreticalPromptTemplate = {
    name: 'structured_concept_definition',
    description: 'Structured concept definition with key points and common mistakes',
    template: `You are defining a concept with enhanced structure and practical guidance.

CONCEPT TO DEFINE:
{{question}}

CONTEXT:
- Subject Domain: {{subject}}
- Academic Level: {{academic_level}}
- Focus Area: {{focus_area}}

STRUCTURED DEFINITION REQUIREMENTS:

**TOPIC**: Extract the main concept name
**SUMMARY**: 2-3 sentence definition that captures the essence
**DETAILED EXPLANATION**: Comprehensive explanation including:
- Core definition and characteristics
- Underlying principles and mechanisms
- Scope and boundaries of the concept
- Context and applications

**KEY POINTS** (4-6 points):
- Essential aspects for understanding
- Critical characteristics or properties
- Important relationships or dependencies
- Practical implications or applications

**COMMON MISTAKES** (3-5 mistakes):
- Frequent misconceptions about the concept
- Errors in application or understanding
- Confusion with similar concepts
- Oversimplifications to avoid

**RELATED CONCEPTS** (3-5 concepts):
- Closely connected ideas or theories
- Prerequisites for understanding
- Extensions or applications
- Contrasting or complementary concepts

**PITFALLS** (3-4 pitfalls):
- Subtle traps in understanding or application
- Context-dependent limitations
- Assumptions that may not hold
- Implementation or reasoning errors

CLARITY REQUIREMENTS:
- Use precise, technical language appropriate for {{academic_level}}
- Provide concrete examples to illustrate abstract concepts
- Address common sources of confusion
- Show practical relevance and applications

{{conceptual_context}}

Create a definition that is both academically rigorous and practically useful.`,
    variables: ['question', 'subject', 'academic_level', 'focus_area', 'conceptual_context'],
    academicLevels: ['beginner', 'intermediate', 'advanced', 'expert']
  };

  /**
   * Process explanation with mistake identification
   */
  static readonly PROCESS_WITH_MISTAKES: TheoreticalPromptTemplate = {
    name: 'process_with_mistakes',
    description: 'Process explanation highlighting common mistakes and pitfalls',
    template: `You are explaining a process with special attention to common errors and pitfalls.

PROCESS TO EXPLAIN:
{{question}}

CONTEXT:
- Subject Area: {{subject}}
- Complexity Level: {{complexity_level}}
- Audience: {{audience}}

ENHANCED PROCESS EXPLANATION STRUCTURE:

**TOPIC**: Name of the process or mechanism
**SUMMARY**: Brief overview of what the process accomplishes
**DETAILED EXPLANATION**: Step-by-step breakdown including:
- Prerequisites and initial conditions
- Sequential steps with clear transitions
- Decision points and alternative pathways
- Underlying mechanisms and principles
- Expected outcomes and results

**KEY POINTS** (4-6 points):
- Critical steps that must be understood
- Important relationships between steps
- Key decision criteria or conditions
- Success indicators or checkpoints

**COMMON MISTAKES** (3-5 mistakes):
- Frequent errors in following the process
- Misunderstanding of step sequences
- Incorrect assumptions about conditions
- Overlooked dependencies or requirements

**RELATED CONCEPTS** (3-5 concepts):
- Similar or alternative processes
- Underlying theories or principles
- Tools or methods used in the process
- Applications or extensions

**PITFALLS** (3-4 pitfalls):
- Subtle errors that lead to failure
- Context-dependent complications
- Timing or sequencing issues
- Resource or constraint violations

PROCESS CLARITY TECHNIQUES:
- Use clear transition words between steps
- Highlight critical decision points
- Explain the 'why' behind each step
- Include error recovery or correction methods
- Show what happens when things go wrong

{{process_context}}

Explain the process in a way that prevents common errors and builds reliable understanding.`,
    variables: ['question', 'subject', 'complexity_level', 'audience', 'process_context'],
    academicLevels: ['beginner', 'intermediate', 'advanced']
  };

  /**
   * Comparative analysis with structured insights
   */
  static readonly STRUCTURED_COMPARISON: TheoreticalPromptTemplate = {
    name: 'structured_comparison',
    description: 'Systematic comparison with key insights and decision guidance',
    template: `You are conducting a structured comparative analysis with practical guidance.

COMPARISON TOPIC:
{{question}}

CONTEXT:
- Subject Domain: {{subject}}
- Academic Level: {{academic_level}}
- Comparison Focus: {{comparison_focus}}

STRUCTURED COMPARISON FRAMEWORK:

**TOPIC**: Main comparison being made
**SUMMARY**: Overview of what is being compared and why it matters
**DETAILED EXPLANATION**: Systematic comparison including:
- Individual analysis of each item
- Direct point-by-point comparison
- Similarities and shared characteristics
- Key differences and distinctions
- Contextual suitability and applications

**KEY POINTS** (4-6 points):
- Most important similarities or differences
- Critical decision factors
- Context-dependent considerations
- Practical implications of choosing one over another

**COMMON MISTAKES** (3-5 mistakes):
- Frequent errors in comparison or selection
- Oversimplifications or false equivalencies
- Context-inappropriate applications
- Misunderstanding of key differences

**RELATED CONCEPTS** (3-5 concepts):
- Alternative approaches or methods
- Underlying theories or frameworks
- Evaluation criteria or metrics
- Implementation considerations

**PITFALLS** (3-4 pitfalls):
- Subtle traps in comparison or selection
- Hidden assumptions or biases
- Context-dependent limitations
- Long-term consequences of poor choices

OBJECTIVITY STANDARDS:
- Present balanced view without bias
- Use evidence-based reasoning
- Acknowledge strengths and weaknesses of each
- Consider multiple perspectives and use cases
- Provide clear decision guidance

{{comparison_context}}

Provide a thorough, fair comparison that helps readers make informed decisions.`,
    variables: ['question', 'subject', 'academic_level', 'comparison_focus', 'comparison_context'],
    academicLevels: ['intermediate', 'advanced', 'expert']
  };

  /**
   * Generate enhanced prompt based on question characteristics
   */
  static generateEnhancedPrompt(
    context: TheoreticalAnalysisContext,
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
  private static selectBestTemplate(context: TheoreticalAnalysisContext): string {
    const { question } = context;
    const questionLower = question.toLowerCase();

    // Check for definition questions
    if (questionLower.includes('what is') || 
        questionLower.includes('define') ||
        questionLower.includes('meaning of')) {
      return 'structured_concept_definition';
    }

    // Check for process questions
    if (questionLower.includes('how does') || 
        questionLower.includes('explain how') ||
        questionLower.includes('process') ||
        questionLower.includes('steps')) {
      return 'process_with_mistakes';
    }

    // Check for comparison questions
    if (questionLower.includes('compare') || 
        questionLower.includes('contrast') ||
        questionLower.includes('difference') ||
        questionLower.includes('versus') ||
        questionLower.includes('vs')) {
      return 'structured_comparison';
    }

    // Default to enhanced comprehensive explanation
    return 'enhanced_comprehensive_explanation';
  }

  /**
   * Get template by name
   */
  private static getTemplate(name: string): TheoreticalPromptTemplate | null {
    const templates = {
      'enhanced_comprehensive_explanation': this.ENHANCED_COMPREHENSIVE_EXPLANATION,
      'structured_concept_definition': this.STRUCTURED_CONCEPT_DEFINITION,
      'process_with_mistakes': this.PROCESS_WITH_MISTAKES,
      'structured_comparison': this.STRUCTURED_COMPARISON
    };

    return templates[name as keyof typeof templates] || null;
  }

  /**
   * Fill template with context data
   */
  private static fillTemplate(
    template: TheoreticalPromptTemplate,
    context: TheoreticalAnalysisContext
  ): string {
    let prompt = template.template;

    // Replace variables
    const replacements = {
      question: context.question,
      subject: context.subject || 'General Studies',
      academic_level: context.academicLevel || 'intermediate',
      audience: context.audience || 'student',
      depth: context.depth || 'detailed',
      focus_area: context.focusArea || 'core concepts',
      complexity_level: this.mapComplexityLevel(context.academicLevel),
      comparison_focus: this.determineComparisonFocus(context.question),
      additional_context: this.generateAdditionalContext(context),
      conceptual_context: this.generateConceptualContext(context),
      process_context: this.generateProcessContext(context),
      comparison_context: this.generateComparisonContext(context)
    };

    // Replace all variables in template
    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Helper methods for context generation
   */
  private static mapComplexityLevel(academicLevel?: string): string {
    const mapping = {
      'beginner': 'basic',
      'intermediate': 'moderate',
      'advanced': 'complex',
      'expert': 'highly complex'
    };
    return mapping[academicLevel as keyof typeof mapping] || 'moderate';
  }

  private static determineComparisonFocus(question: string): string {
    const questionLower = question.toLowerCase();
    if (questionLower.includes('theory') || questionLower.includes('approach')) {
      return 'theoretical approaches';
    } else if (questionLower.includes('method') || questionLower.includes('technique')) {
      return 'methodological comparison';
    } else if (questionLower.includes('algorithm') || questionLower.includes('implementation')) {
      return 'implementation comparison';
    } else {
      return 'conceptual comparison';
    }
  }

  private static generateAdditionalContext(context: TheoreticalAnalysisContext): string {
    const requirements: string[] = [];

    if (context.includeExamples) {
      requirements.push('Include concrete examples and illustrations');
    }

    if (context.includeMath) {
      requirements.push('Include mathematical formulations where appropriate');
    }

    if (context.includeCode) {
      requirements.push('Provide code examples or pseudocode when relevant');
    }

    if (context.academicLevel === 'expert') {
      requirements.push('Address current research and open questions');
    }

    return requirements.length > 0 
      ? `ADDITIONAL REQUIREMENTS:\n${requirements.map(r => `- ${r}`).join('\n')}`
      : 'Focus on clarity and comprehensive coverage with structured formatting.';
  }

  private static generateConceptualContext(context: TheoreticalAnalysisContext): string {
    return `CONCEPTUAL CONTEXT:
- Ensure definition is precise and unambiguous
- Highlight key points that aid understanding
- Address common misconceptions and mistakes
- Show practical relevance and applications
- Identify potential pitfalls and how to avoid them`;
  }

  private static generateProcessContext(context: TheoreticalAnalysisContext): string {
    return `PROCESS CONTEXT:
- Focus on step-by-step clarity and logical flow
- Highlight common mistakes at each stage
- Explain decision points and error recovery
- Address timing and sequencing issues
- Show what happens when steps are skipped or done incorrectly`;
  }

  private static generateComparisonContext(context: TheoreticalAnalysisContext): string {
    return `COMPARISON CONTEXT:
- Maintain objectivity and provide balanced analysis
- Use consistent evaluation criteria throughout
- Address contextual suitability and trade-offs
- Highlight common mistakes in selection or application
- Provide practical guidance for decision-making`;
  }

  /**
   * Get all available enhanced templates
   */
  static getAllEnhancedTemplates(): TheoreticalPromptTemplate[] {
    return [
      this.ENHANCED_COMPREHENSIVE_EXPLANATION,
      this.STRUCTURED_CONCEPT_DEFINITION,
      this.PROCESS_WITH_MISTAKES,
      this.STRUCTURED_COMPARISON
    ];
  }

  /**
   * Validate template structure
   */
  static validateTemplate(template: TheoreticalPromptTemplate): boolean {
    const templateVars = template.template.match(/{{(\w+)}}/g) || [];
    const definedVars = template.variables.map(v => `{{${v}}}`);
    
    return templateVars.every(v => definedVars.includes(v));
  }
}