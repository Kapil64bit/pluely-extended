// Specialized prompt templates for verbal interview responses

import { InterviewAnalysisContext } from '../response-generators/interview-generator';

export interface InterviewPromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
  interviewTypes: string[];
}

export class InterviewPromptTemplates {
  /**
   * Standard behavioral interview prompt
   */
  static readonly BEHAVIORAL_INTERVIEW: InterviewPromptTemplate = {
    name: 'behavioral_interview',
    description: 'Behavioral interview questions using STAR method',
    template: `You are helping someone prepare for a behavioral interview. Generate a first-person response that sounds natural and conversational, as if the person is speaking directly to the interviewer.

INTERVIEW QUESTION:
{{question}}

CONTEXT:
- Role: {{role}}
- Experience Level: {{experience}}
- Interview Type: {{interview_type}}
- Company: {{company}}

RESPONSE REQUIREMENTS:
- Use first-person perspective ("I", "my", "we")
- Sound conversational and natural
- Show confidence without being arrogant
- Include specific examples and details
- Use the STAR method if the question asks for an example
- Keep response between 1-3 minutes when spoken
- Show enthusiasm and genuine interest

TONE: {{tone}}
- Confident: Use assertive language, show ownership of achievements
- Thoughtful: Be analytical, show careful consideration
- Enthusiastic: Show passion and energy for the topic

STRUCTURE YOUR RESPONSE:
1. Direct answer to the question
2. Specific example or situation (if applicable)
3. Actions you took and why
4. Results and impact
5. What you learned or how it applies to this role

{{additional_context}}

Generate a response that sounds like a real person speaking naturally in an interview setting.`,
    variables: ['question', 'role', 'experience', 'interview_type', 'company', 'tone', 'additional_context'],
    interviewTypes: ['behavioral', 'situational', 'cultural']
  };

  /**
   * Technical interview discussion prompt
   */
  static readonly TECHNICAL_INTERVIEW: InterviewPromptTemplate = {
    name: 'technical_interview',
    description: 'Technical interview questions with first-person explanations',
    template: `You are in a technical interview discussing your approach to a technical challenge. Respond in first-person as if you're explaining your thought process to the interviewer.

TECHNICAL QUESTION:
{{question}}

CONTEXT:
- Role: {{role}}
- Technical Focus: {{technical_focus}}
- Experience Level: {{experience}}
- Company/Industry: {{company}}

RESPONSE APPROACH:
- Speak in first-person ("I would", "My approach", "In my experience")
- Explain your thought process clearly
- Show technical depth without being overly complex
- Demonstrate problem-solving methodology
- Include real examples from your experience
- Show awareness of trade-offs and alternatives
- Connect technical decisions to business impact

TECHNICAL COMMUNICATION STYLE:
- Start with high-level approach
- Break down complex problems into steps
- Explain reasoning behind technical choices
- Mention tools, technologies, or methodologies you'd use
- Discuss how you'd validate your solution
- Show consideration for scalability, maintainability, performance

TONE: {{tone}}

STRUCTURE:
1. Restate the problem to show understanding
2. Outline your high-level approach
3. Walk through your methodology step-by-step
4. Discuss implementation considerations
5. Explain how you'd test and validate
6. Mention potential improvements or alternatives

{{technical_constraints}}

Respond as if you're having a technical discussion with a peer, showing both expertise and collaborative thinking.`,
    variables: ['question', 'role', 'technical_focus', 'experience', 'company', 'tone', 'technical_constraints'],
    interviewTypes: ['technical', 'system_design', 'architecture']
  };

  /**
   * Leadership and management interview prompt
   */
  static readonly LEADERSHIP_INTERVIEW: InterviewPromptTemplate = {
    name: 'leadership_interview',
    description: 'Leadership and management focused interview responses',
    template: `You are discussing leadership and management topics in an interview. Provide a first-person response that demonstrates leadership experience and philosophy.

LEADERSHIP QUESTION:
{{question}}

CONTEXT:
- Role: {{role}}
- Experience Level: {{experience}}
- Team Size/Scope: {{team_scope}}
- Industry: {{industry}}

LEADERSHIP RESPONSE FRAMEWORK:
- Use first-person perspective throughout
- Share specific leadership examples
- Demonstrate emotional intelligence
- Show results and team impact
- Discuss your leadership philosophy
- Address both successes and challenges
- Show growth mindset and learning

KEY LEADERSHIP THEMES TO ADDRESS:
- Team development and mentoring
- Decision-making process
- Conflict resolution
- Change management
- Performance management
- Building team culture
- Strategic thinking

TONE: {{tone}}
- Confident: Show ownership of leadership decisions and outcomes
- Thoughtful: Demonstrate careful consideration of team dynamics
- Enthusiastic: Show passion for developing people and teams

RESPONSE STRUCTURE:
1. Share your leadership philosophy briefly
2. Provide a specific example (STAR method)
3. Explain your decision-making process
4. Discuss team impact and results
5. Reflect on lessons learned
6. Connect to the role you're interviewing for

{{leadership_context}}

Speak as an experienced leader who cares about people and results equally.`,
    variables: ['question', 'role', 'experience', 'team_scope', 'industry', 'tone', 'leadership_context'],
    interviewTypes: ['leadership', 'management', 'executive']
  };

  /**
   * Cultural fit and motivation interview prompt
   */
  static readonly CULTURAL_FIT: InterviewPromptTemplate = {
    name: 'cultural_fit',
    description: 'Cultural fit and motivation interview responses',
    template: `You are discussing cultural fit, motivation, and alignment with company values. Respond authentically in first-person, showing genuine interest and cultural alignment.

CULTURAL/MOTIVATION QUESTION:
{{question}}

CONTEXT:
- Company: {{company}}
- Role: {{role}}
- Company Values: {{company_values}}
- Industry: {{industry}}

CULTURAL RESPONSE APPROACH:
- Be authentic and genuine in first-person
- Show you've researched the company
- Connect your values to company values
- Demonstrate cultural awareness
- Share personal motivations and drivers
- Show long-term thinking and commitment
- Express enthusiasm naturally

AREAS TO POTENTIALLY ADDRESS:
- Why this company specifically
- What motivates you professionally
- How you work with diverse teams
- Your approach to work-life integration
- What kind of environment you thrive in
- Your career aspirations and growth mindset
- How you handle challenges and setbacks

TONE: {{tone}}
- Enthusiastic: Show genuine excitement about the opportunity
- Thoughtful: Demonstrate careful consideration of fit
- Confident: Express belief in your ability to contribute

AUTHENTICITY GUIDELINES:
- Share real experiences and examples
- Admit areas where you're still growing
- Show vulnerability when appropriate
- Connect personal values to professional choices
- Demonstrate self-awareness

{{cultural_context}}

Respond as someone who has thoughtfully considered this opportunity and genuinely wants to contribute to the company's success.`,
    variables: ['question', 'company', 'role', 'company_values', 'industry', 'tone', 'cultural_context'],
    interviewTypes: ['cultural', 'values', 'motivation']
  };

  /**
   * Executive and strategic interview prompt
   */
  static readonly EXECUTIVE_INTERVIEW: InterviewPromptTemplate = {
    name: 'executive_interview',
    description: 'Executive-level strategic interview responses',
    template: `You are in an executive-level interview discussing strategic topics. Respond with the gravitas and strategic thinking expected at the executive level.

EXECUTIVE QUESTION:
{{question}}

CONTEXT:
- Executive Role: {{role}}
- Company Stage: {{company_stage}}
- Industry: {{industry}}
- Scope of Responsibility: {{scope}}

EXECUTIVE RESPONSE CHARACTERISTICS:
- Strategic thinking and long-term vision
- Business acumen and market awareness
- Leadership at scale
- Stakeholder management
- Decision-making under uncertainty
- Change leadership and transformation
- Board and investor communication

RESPONSE FRAMEWORK:
- Speak with executive presence and confidence
- Demonstrate strategic thinking
- Show understanding of business context
- Include market and competitive awareness
- Discuss stakeholder impact
- Address risk and opportunity
- Show results at scale

EXECUTIVE COMMUNICATION STYLE:
- Concise but comprehensive
- Data-driven insights
- Strategic frameworks and models
- Cross-functional perspective
- Long-term and short-term balance
- Stakeholder-centric thinking

TONE: Confident and authoritative while remaining approachable

STRUCTURE:
1. Frame the strategic context
2. Share your strategic approach or framework
3. Provide specific executive example
4. Discuss stakeholder impact and results
5. Address lessons learned and future application
6. Connect to company's strategic needs

{{executive_context}}

Respond as a seasoned executive who thinks strategically and leads with both vision and execution excellence.`,
    variables: ['question', 'role', 'company_stage', 'industry', 'scope', 'executive_context'],
    interviewTypes: ['executive', 'strategic', 'board']
  };

  /**
   * Generate prompt based on interview context
   */
  static generatePrompt(
    context: InterviewAnalysisContext,
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
   * Select the best template based on interview context
   */
  private static selectBestTemplate(context: InterviewAnalysisContext): string {
    const { interviewType, experience, question } = context;
    const questionLower = question.toLowerCase();

    // Check for executive-level interviews
    if (experience === 'executive' || 
        questionLower.includes('strategic') || 
        questionLower.includes('vision') ||
        questionLower.includes('board')) {
      return 'executive_interview';
    }

    // Check for leadership questions
    if (questionLower.includes('leadership') || 
        questionLower.includes('manage') ||
        questionLower.includes('team') ||
        experience === 'senior') {
      return 'leadership_interview';
    }

    // Check for technical questions
    if (interviewType === 'technical' || 
        questionLower.includes('technical') ||
        questionLower.includes('system') ||
        questionLower.includes('architecture')) {
      return 'technical_interview';
    }

    // Check for cultural fit questions
    if (interviewType === 'cultural' || 
        questionLower.includes('culture') ||
        questionLower.includes('values') ||
        questionLower.includes('why') ||
        questionLower.includes('motivation')) {
      return 'cultural_fit';
    }

    // Default to behavioral
    return 'behavioral_interview';
  }

  /**
   * Get template by name
   */
  private static getTemplate(name: string): InterviewPromptTemplate | null {
    const templates = {
      'behavioral_interview': this.BEHAVIORAL_INTERVIEW,
      'technical_interview': this.TECHNICAL_INTERVIEW,
      'leadership_interview': this.LEADERSHIP_INTERVIEW,
      'cultural_fit': this.CULTURAL_FIT,
      'executive_interview': this.EXECUTIVE_INTERVIEW
    };

    return templates[name as keyof typeof templates] || null;
  }

  /**
   * Fill template with context data
   */
  private static fillTemplate(
    template: InterviewPromptTemplate,
    context: InterviewAnalysisContext
  ): string {
    let prompt = template.template;

    // Replace variables
    const replacements = {
      question: context.question,
      role: context.role || 'Software Engineer',
      experience: context.experience || 'mid',
      interview_type: context.interviewType || 'behavioral',
      company: context.company || 'the company',
      industry: context.industry || 'technology',
      tone: this.determineTone(context),
      technical_focus: this.getTechnicalFocus(context),
      team_scope: this.getTeamScope(context),
      company_values: this.getCompanyValues(context),
      company_stage: this.getCompanyStage(context),
      scope: this.getExecutiveScope(context),
      additional_context: this.generateAdditionalContext(context),
      technical_constraints: this.generateTechnicalConstraints(context),
      leadership_context: this.generateLeadershipContext(context),
      cultural_context: this.generateCulturalContext(context),
      executive_context: this.generateExecutiveContext(context)
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
  private static determineTone(context: InterviewAnalysisContext): string {
    const { interviewType, experience, question } = context;
    const questionLower = question.toLowerCase();

    if (experience === 'executive' || questionLower.includes('leadership')) {
      return 'confident';
    } else if (interviewType === 'technical' || questionLower.includes('technical')) {
      return 'thoughtful';
    } else if (questionLower.includes('culture') || questionLower.includes('motivation')) {
      return 'enthusiastic';
    } else {
      return 'confident';
    }
  }

  private static getTechnicalFocus(context: InterviewAnalysisContext): string {
    return context.industry === 'technology' ? 'Software Engineering' : 'Technical Problem Solving';
  }

  private static getTeamScope(context: InterviewAnalysisContext): string {
    const scopes = {
      entry: '2-5 person team',
      mid: '5-10 person team',
      senior: '10-20 person team',
      executive: 'Multiple teams (50+ people)'
    };
    return scopes[context.experience as keyof typeof scopes] || '5-10 person team';
  }

  private static getCompanyValues(context: InterviewAnalysisContext): string {
    return 'Innovation, Collaboration, Excellence, Customer Focus';
  }

  private static getCompanyStage(context: InterviewAnalysisContext): string {
    return 'Growth stage with established market presence';
  }

  private static getExecutiveScope(context: InterviewAnalysisContext): string {
    return 'Cross-functional leadership with P&L responsibility';
  }

  private static generateAdditionalContext(context: InterviewAnalysisContext): string {
    const contextParts: string[] = [];

    if (context.timeLimit) {
      contextParts.push(`TIME LIMIT: Keep response to ${context.timeLimit} minutes`);
    }

    if (context.followUpExpected) {
      contextParts.push('FOLLOW-UP: Be prepared for follow-up questions');
    }

    contextParts.push('AUTHENTICITY: Base your response on realistic professional experiences');
    contextParts.push('SPECIFICITY: Include specific details and examples');

    return contextParts.join('\n');
  }

  private static generateTechnicalConstraints(context: InterviewAnalysisContext): string {
    return `TECHNICAL CONSIDERATIONS:
- Explain complex concepts clearly
- Show awareness of scalability and performance
- Discuss testing and quality assurance
- Consider security and compliance
- Address maintainability and documentation`;
  }

  private static generateLeadershipContext(context: InterviewAnalysisContext): string {
    return `LEADERSHIP FOCUS:
- Demonstrate people leadership skills
- Show strategic thinking ability
- Address team development and growth
- Discuss change management experience
- Show results through others`;
  }

  private static generateCulturalContext(context: InterviewAnalysisContext): string {
    return `CULTURAL ALIGNMENT:
- Show genuine interest in the company
- Demonstrate value alignment
- Express long-term commitment
- Show collaborative mindset
- Indicate growth orientation`;
  }

  private static generateExecutiveContext(context: InterviewAnalysisContext): string {
    return `EXECUTIVE EXPECTATIONS:
- Strategic vision and execution
- Stakeholder management at all levels
- Business acumen and market awareness
- Change leadership and transformation
- Board and investor communication`;
  }

  /**
   * Get all available templates
   */
  static getAllTemplates(): InterviewPromptTemplate[] {
    return [
      this.BEHAVIORAL_INTERVIEW,
      this.TECHNICAL_INTERVIEW,
      this.LEADERSHIP_INTERVIEW,
      this.CULTURAL_FIT,
      this.EXECUTIVE_INTERVIEW
    ];
  }

  /**
   * Get templates for specific interview type
   */
  static getTemplatesForType(interviewType: string): InterviewPromptTemplate[] {
    return this.getAllTemplates().filter(template => 
      template.interviewTypes.includes(interviewType.toLowerCase())
    );
  }

  /**
   * Validate template variables
   */
  static validateTemplate(template: InterviewPromptTemplate): boolean {
    const templateVars = template.template.match(/{{(\w+)}}/g) || [];
    const definedVars = template.variables.map(v => `{{${v}}}`);
    
    return templateVars.every(v => definedVars.includes(v));
  }
}