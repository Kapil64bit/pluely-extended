// Verbal interview response generator with first-person conversational responses

import { VerbalInterviewResponse } from '../../types/enhanced-response';

export interface InterviewAnalysisContext {
  question: string;
  interviewType?: 'technical' | 'behavioral' | 'situational' | 'cultural';
  role?: string;
  company?: string;
  experience?: 'entry' | 'mid' | 'senior' | 'executive';
  industry?: string;
  timeLimit?: number; // in minutes
  followUpExpected?: boolean;
}

export interface InterviewGenerationOptions {
  includeKeyPoints: boolean;
  includeFollowUpPrep: boolean;
  estimateDuration: boolean;
  personalizeResponse: boolean;
  includeExamples: boolean;
  showConfidence: boolean;
  adaptToRole: boolean;
  includeMetrics: boolean;
}

export class InterviewResponseGenerator {
  private readonly defaultOptions: InterviewGenerationOptions = {
    includeKeyPoints: true,
    includeFollowUpPrep: true,
    estimateDuration: true,
    personalizeResponse: true,
    includeExamples: true,
    showConfidence: true,
    adaptToRole: true,
    includeMetrics: false
  };

  /**
   * Generate specialized prompt for interview responses
   */
  async generatePrompt(context: InterviewAnalysisContext): Promise<string> {
    const { question, interviewType, role, experience, includeFollowUps } = context;
    
    let prompt = `You are responding to an interview question as a professional candidate. `;
    
    if (experience) {
      prompt += `You have ${experience}-level experience. `;
    }
    
    if (role) {
      prompt += `You are interviewing for a ${role} position. `;
    }

    if (interviewType) {
      prompt += `This is a ${interviewType} interview question. `;
    }

    prompt += `

INTERVIEW QUESTION:
${question}

RESPONSE GUIDELINES:
1. Answer in first person as if you're the candidate
2. Be confident but not arrogant
3. Use specific examples from your experience
4. Structure your response clearly (STAR method for behavioral questions)
5. Show enthusiasm and genuine interest
6. Demonstrate relevant skills and knowledge
7. Keep response concise but comprehensive (2-3 minutes speaking time)

RESPONSE STRUCTURE:
- Opening: [Direct answer to the question]
- Body: [Detailed explanation with examples]
- Conclusion: [Summary and connection to the role]
- Key Points: [Main takeaways to emphasize]
`;

    if (includeFollowUps) {
      prompt += `- Follow-up Preparation: [Potential follow-up questions and how to handle them]
`;
    }

    if (interviewType === 'behavioral') {
      prompt += `
For behavioral questions, use the STAR method:
- Situation: Set the context
- Task: Describe what needed to be done
- Action: Explain what you did
- Result: Share the outcome and what you learned
`;
    } else if (interviewType === 'technical') {
      prompt += `
For technical questions:
- Demonstrate deep understanding
- Explain your thought process
- Mention relevant technologies and best practices
- Show problem-solving approach
`;
    }

    prompt += `
TONE: Professional, confident, and conversational
STYLE: Natural speech patterns with appropriate pauses and emphasis
LENGTH: Aim for 2-3 minutes of speaking time (approximately 300-450 words)

Provide a response that sounds natural and authentic while showcasing relevant qualifications.`;

    return prompt;
  }

  private readonly toneCharacteristics = {
    confident: {
      phrases: ['I believe', 'I\'m confident that', 'In my experience', 'I\'ve successfully'],
      style: 'assertive',
      pace: 'steady',
      examples: 'specific achievements'
    },
    thoughtful: {
      phrases: ['I think', 'From my perspective', 'I\'ve found that', 'It\'s important to consider'],
      style: 'analytical',
      pace: 'measured',
      examples: 'detailed analysis'
    },
    enthusiastic: {
      phrases: ['I\'m excited about', 'I love working on', 'What I find fascinating', 'I\'m passionate about'],
      style: 'energetic',
      pace: 'dynamic',
      examples: 'engaging stories'
    }
  };

  /**
   * Generate verbal interview response
   */
  async generateResponse(
    context: InterviewAnalysisContext,
    options: Partial<InterviewGenerationOptions> = {}
  ): Promise<VerbalInterviewResponse> {
    const config = { ...this.defaultOptions, ...options };
    
    try {
      // Analyze the question
      const analysis = this.analyzeInterviewQuestion(context);
      
      // Determine optimal tone
      const tone = this.determineOptimalTone(context, analysis);
      
      // Generate first-person answer
      const answer = this.generateFirstPersonAnswer(context, analysis, tone, config);
      
      // Extract key points
      const keyPoints = config.includeKeyPoints
        ? this.extractKeyPoints(answer, analysis)
        : [];

      // Generate follow-up preparation
      const followUpPreparation = config.includeFollowUpPrep
        ? this.generateFollowUpPreparation(context, analysis)
        : [];

      // Estimate duration
      const duration = config.estimateDuration
        ? this.estimateSpeakingDuration(answer)
        : undefined;

      return {
        question: context.question,
        answer,
        keyPoints,
        followUpPreparation,
        tone,
        duration
      };

    } catch (error) {
      console.error('Error generating interview response:', error);
      return this.generateFallbackResponse(context);
    }
  }

  /**
   * Analyze interview question characteristics
   */
  private analyzeInterviewQuestion(context: InterviewAnalysisContext): any {
    const { question } = context;
    const questionLower = question.toLowerCase();

    return {
      questionType: this.identifyQuestionType(question),
      complexity: this.assessQuestionComplexity(question),
      requiresExample: this.requiresExample(question),
      isOpenEnded: this.isOpenEndedQuestion(question),
      focusArea: this.identifyFocusArea(question),
      expectedLength: this.estimateExpectedLength(question),
      competencyTested: this.identifyCompetency(question),
      requiresSTAR: this.requiresSTARMethod(question)
    };
  }

  /**
   * Identify question type
   */
  private identifyQuestionType(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('tell me about yourself') || questionLower.includes('introduce yourself')) {
      return 'introduction';
    } else if (questionLower.includes('strength') || questionLower.includes('weakness')) {
      return 'self_assessment';
    } else if (questionLower.includes('experience') || questionLower.includes('worked on')) {
      return 'experience';
    } else if (questionLower.includes('challenge') || questionLower.includes('difficult')) {
      return 'challenge';
    } else if (questionLower.includes('why') && (questionLower.includes('company') || questionLower.includes('role'))) {
      return 'motivation';
    } else if (questionLower.includes('where do you see') || questionLower.includes('goals')) {
      return 'future_goals';
    } else if (questionLower.includes('conflict') || questionLower.includes('disagreement')) {
      return 'conflict_resolution';
    } else if (questionLower.includes('leadership') || questionLower.includes('team')) {
      return 'leadership';
    } else if (questionLower.includes('technical') || questionLower.includes('how would you')) {
      return 'technical_approach';
    } else {
      return 'general';
    }
  }

  /**
   * Assess question complexity
   */
  private assessQuestionComplexity(question: string): 'simple' | 'moderate' | 'complex' {
    const questionLength = question.length;
    const questionParts = question.split(/[.?!]/).filter(part => part.trim().length > 0);
    
    if (questionLength < 50 && questionParts.length === 1) {
      return 'simple';
    } else if (questionLength > 150 || questionParts.length > 2) {
      return 'complex';
    } else {
      return 'moderate';
    }
  }

  /**
   * Check if question requires example
   */
  private requiresExample(question: string): boolean {
    const questionLower = question.toLowerCase();
    return questionLower.includes('example') || 
           questionLower.includes('time when') ||
           questionLower.includes('situation') ||
           questionLower.includes('experience');
  }

  /**
   * Check if question is open-ended
   */
  private isOpenEndedQuestion(question: string): boolean {
    const questionLower = question.toLowerCase();
    return questionLower.startsWith('tell me') ||
           questionLower.startsWith('describe') ||
           questionLower.startsWith('explain') ||
           questionLower.startsWith('what') ||
           questionLower.startsWith('how') ||
           questionLower.startsWith('why');
  }

  /**
   * Identify focus area
   */
  private identifyFocusArea(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('technical') || questionLower.includes('code') || questionLower.includes('system')) {
      return 'technical';
    } else if (questionLower.includes('team') || questionLower.includes('collaboration')) {
      return 'teamwork';
    } else if (questionLower.includes('leadership') || questionLower.includes('manage')) {
      return 'leadership';
    } else if (questionLower.includes('problem') || questionLower.includes('solve')) {
      return 'problem_solving';
    } else if (questionLower.includes('communication') || questionLower.includes('present')) {
      return 'communication';
    } else {
      return 'general';
    }
  }

  /**
   * Estimate expected answer length
   */
  private estimateExpectedLength(question: string): 'short' | 'medium' | 'long' {
    const questionType = this.identifyQuestionType(question);
    
    if (questionType === 'introduction' || questionType === 'experience') {
      return 'long';
    } else if (questionType === 'self_assessment' || questionType === 'motivation') {
      return 'medium';
    } else {
      return 'short';
    }
  }

  /**
   * Identify competency being tested
   */
  private identifyCompetency(question: string): string {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('leadership')) return 'leadership';
    if (questionLower.includes('communication')) return 'communication';
    if (questionLower.includes('problem') || questionLower.includes('solve')) return 'problem_solving';
    if (questionLower.includes('team')) return 'teamwork';
    if (questionLower.includes('adapt') || questionLower.includes('change')) return 'adaptability';
    if (questionLower.includes('initiative') || questionLower.includes('proactive')) return 'initiative';
    if (questionLower.includes('conflict')) return 'conflict_resolution';
    if (questionLower.includes('decision')) return 'decision_making';
    
    return 'general';
  }

  /**
   * Check if question requires STAR method
   */
  private requiresSTARMethod(question: string): boolean {
    const questionLower = question.toLowerCase();
    return questionLower.includes('time when') ||
           questionLower.includes('situation') ||
           questionLower.includes('example of') ||
           questionLower.includes('describe a') ||
           questionLower.includes('tell me about a');
  }

  /**
   * Determine optimal tone for response
   */
  private determineOptimalTone(
    context: InterviewAnalysisContext,
    analysis: any
  ): 'confident' | 'thoughtful' | 'enthusiastic' {
    const { interviewType, role, experience } = context;
    const { questionType, focusArea } = analysis;

    // Leadership and senior roles often require confidence
    if (experience === 'senior' || experience === 'executive' || focusArea === 'leadership') {
      return 'confident';
    }

    // Technical questions often benefit from thoughtful approach
    if (interviewType === 'technical' || focusArea === 'technical' || focusArea === 'problem_solving') {
      return 'thoughtful';
    }

    // Cultural fit and motivation questions work well with enthusiasm
    if (interviewType === 'cultural' || questionType === 'motivation' || questionType === 'future_goals') {
      return 'enthusiastic';
    }

    // Default based on question type
    if (questionType === 'challenge' || questionType === 'conflict_resolution') {
      return 'thoughtful';
    } else if (questionType === 'introduction' || questionType === 'experience') {
      return 'confident';
    } else {
      return 'enthusiastic';
    }
  }

  /**
   * Generate first-person answer
   */
  private generateFirstPersonAnswer(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic',
    options: InterviewGenerationOptions
  ): string {
    const toneConfig = this.toneCharacteristics[tone];
    const { questionType, requiresSTAR, expectedLength } = analysis;

    let answer = '';

    // Opening phrase based on tone
    const openingPhrase = this.selectOpeningPhrase(toneConfig.phrases, questionType);
    
    if (requiresSTAR) {
      answer = this.generateSTARResponse(context, analysis, tone, options);
    } else {
      answer = this.generateStructuredResponse(context, analysis, tone, options);
    }

    // Ensure first-person perspective
    answer = this.ensureFirstPerson(answer);
    
    // Adjust for tone characteristics
    answer = this.adjustForTone(answer, tone, toneConfig);
    
    // Add examples if requested and appropriate
    if (options.includeExamples && analysis.requiresExample) {
      answer = this.addRelevantExample(answer, context, analysis);
    }

    return answer;
  }

  /**
   * Generate STAR method response
   */
  private generateSTARResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic',
    options: InterviewGenerationOptions
  ): string {
    const { questionType, focusArea } = analysis;
    
    let response = '';
    
    // Situation
    response += this.generateSituationSection(context, analysis, tone);
    response += '\n\n';
    
    // Task
    response += this.generateTaskSection(context, analysis, tone);
    response += '\n\n';
    
    // Action
    response += this.generateActionSection(context, analysis, tone);
    response += '\n\n';
    
    // Result
    response += this.generateResultSection(context, analysis, tone, options.includeMetrics);
    
    return response;
  }

  /**
   * Generate structured response (non-STAR)
   */
  private generateStructuredResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic',
    options: InterviewGenerationOptions
  ): string {
    const { questionType } = analysis;
    
    switch (questionType) {
      case 'introduction':
        return this.generateIntroductionResponse(context, analysis, tone);
      case 'self_assessment':
        return this.generateSelfAssessmentResponse(context, analysis, tone);
      case 'motivation':
        return this.generateMotivationResponse(context, analysis, tone);
      case 'future_goals':
        return this.generateFutureGoalsResponse(context, analysis, tone);
      case 'technical_approach':
        return this.generateTechnicalResponse(context, analysis, tone);
      default:
        return this.generateGeneralResponse(context, analysis, tone);
    }
  }

  /**
   * Generate introduction response
   */
  private generateIntroductionResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    const toneConfig = this.toneCharacteristics[tone];
    
    let response = '';
    
    // Professional background
    response += `I'm a ${context.role || 'professional'} with ${this.getExperienceDescription(context.experience)} experience in ${context.industry || 'technology'}. `;
    
    // Key strengths
    response += `What I bring to the table is a strong combination of technical expertise and collaborative leadership. `;
    
    // Recent achievements
    response += `In my recent role, I've successfully led projects that delivered significant impact to both the team and the organization. `;
    
    // Connection to role
    response += `I'm particularly excited about this opportunity because it aligns perfectly with my passion for ${this.getPassionArea(context)} and my goal to contribute to innovative solutions.`;
    
    return response;
  }

  /**
   * Generate self-assessment response
   */
  private generateSelfAssessmentResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    const questionLower = context.question.toLowerCase();
    
    if (questionLower.includes('strength')) {
      return this.generateStrengthResponse(context, analysis, tone);
    } else if (questionLower.includes('weakness')) {
      return this.generateWeaknessResponse(context, analysis, tone);
    } else {
      return this.generateGeneralSelfAssessment(context, analysis, tone);
    }
  }

  /**
   * Generate strength response
   */
  private generateStrengthResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `One of my key strengths is my ability to break down complex problems into manageable components and develop systematic solutions. I've consistently demonstrated this in my work where I've taken on challenging projects and delivered results that exceeded expectations. What makes this strength particularly valuable is that I combine analytical thinking with strong communication skills, which allows me to not only solve problems but also explain solutions clearly to both technical and non-technical stakeholders. This has been especially valuable in collaborative environments where I've helped teams move forward efficiently.`;
  }

  /**
   * Generate weakness response
   */
  private generateWeaknessResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `An area I've been actively working to improve is my tendency to dive deep into technical details when presenting to broader audiences. I realized that while my thorough approach is valuable for technical accuracy, it sometimes made my presentations longer than necessary. To address this, I've been practicing structuring my communications with clear executive summaries upfront, followed by detailed technical sections for those who need them. I've also started asking for feedback specifically on communication clarity, and I've seen significant improvement in how effectively I can convey complex information to diverse audiences.`;
  }

  /**
   * Generate motivation response
   */
  private generateMotivationResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `I'm genuinely excited about this opportunity because it represents the perfect intersection of my technical expertise and my passion for creating solutions that make a real impact. What particularly draws me to ${context.company || 'this company'} is your commitment to innovation and the collaborative culture I've learned about. I've been following your recent developments in ${context.industry || 'the industry'}, and I'm impressed by how you're pushing boundaries while maintaining focus on user experience. This role would allow me to contribute my skills in ${this.getRelevantSkills(context)} while also growing in areas like ${this.getGrowthAreas(context)}, which aligns perfectly with my career goals.`;
  }

  /**
   * Generate future goals response
   */
  private generateFutureGoalsResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `In the next five years, I see myself growing into a role where I can have broader impact on both technical strategy and team development. I want to continue deepening my expertise in ${this.getTechnicalArea(context)} while also developing stronger leadership skills. Specifically, I'm interested in leading cross-functional initiatives that bridge technical and business objectives. I believe this role would be an excellent stepping stone toward that goal, as it would give me exposure to ${this.getExposureAreas(context)} while allowing me to mentor junior team members. Ultimately, I want to be known as someone who not only delivers excellent technical solutions but also helps build strong, collaborative teams that consistently exceed their goals.`;
  }

  /**
   * Generate technical response
   */
  private generateTechnicalResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `My approach to this type of technical challenge would be to start by thoroughly understanding the requirements and constraints. I'd begin with a high-level architecture design, considering factors like scalability, maintainability, and performance requirements. Then I'd break down the implementation into manageable components, prioritizing the core functionality first. Throughout the process, I'd focus on writing clean, well-documented code and implementing comprehensive testing. I'd also plan for monitoring and observability from the beginning, as I've learned that these are crucial for long-term success. Finally, I'd ensure proper documentation and knowledge sharing with the team, because even the best technical solution isn't valuable if others can't understand and maintain it.`;
  }

  /**
   * Generate general response
   */
  private generateGeneralResponse(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    const toneConfig = this.toneCharacteristics[tone];
    const openingPhrase = toneConfig.phrases[0];
    
    return `${openingPhrase} this is an excellent question that touches on something I'm passionate about. Based on my experience, I've found that success in this area requires a combination of technical skills, collaborative mindset, and continuous learning. I've had the opportunity to work on similar challenges in my previous roles, and what I've learned is that the most effective approach is to balance immediate needs with long-term strategic thinking. I'm excited to bring this perspective to your team and contribute to achieving your goals.`;
  }

  /**
   * Generate STAR sections
   */
  private generateSituationSection(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `Let me share a specific example from my previous role. We were facing a critical situation where our main application was experiencing performance issues that were affecting user experience and potentially impacting revenue. The system was handling about 50% more traffic than originally designed for, and response times had increased significantly during peak hours.`;
  }

  private generateTaskSection(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `As the lead developer on this project, my responsibility was to identify the root cause of the performance bottlenecks and implement a solution that would not only resolve the immediate issues but also ensure the system could handle future growth. I needed to do this while maintaining system stability and minimizing any disruption to our users.`;
  }

  private generateActionSection(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic'
  ): string {
    return `I started by conducting a comprehensive performance analysis, using monitoring tools to identify the specific bottlenecks. I discovered that the main issues were in our database queries and caching strategy. I then developed a multi-phase approach: first, I optimized the most critical database queries and implemented better indexing. Second, I redesigned our caching layer to be more efficient. Finally, I worked with the infrastructure team to implement horizontal scaling capabilities. Throughout this process, I kept stakeholders informed with regular updates and coordinated closely with the QA team to ensure thorough testing.`;
  }

  private generateResultSection(
    context: InterviewAnalysisContext,
    analysis: any,
    tone: 'confident' | 'thoughtful' | 'enthusiastic',
    includeMetrics: boolean
  ): string {
    let result = `The results exceeded our expectations. We achieved a 70% improvement in response times and the system now handles peak traffic smoothly. `;
    
    if (includeMetrics) {
      result += `Specifically, average response time dropped from 3.2 seconds to 0.9 seconds, and we eliminated the timeout errors that were occurring during peak hours. `;
    }
    
    result += `More importantly, this solution positioned us well for future growth, and the monitoring and optimization practices I implemented became standard across our development team. The experience taught me the value of systematic problem-solving and the importance of considering both immediate and long-term impacts when designing solutions.`;
    
    return result;
  }

  /**
   * Extract key points from answer
   */
  private extractKeyPoints(answer: string, analysis: any): string[] {
    const keyPoints: string[] = [];
    
    // Extract main themes
    if (answer.includes('experience')) {
      keyPoints.push('Relevant experience and background');
    }
    
    if (answer.includes('technical') || answer.includes('solution')) {
      keyPoints.push('Technical problem-solving approach');
    }
    
    if (answer.includes('team') || answer.includes('collaboration')) {
      keyPoints.push('Collaborative and team-oriented mindset');
    }
    
    if (answer.includes('result') || answer.includes('impact')) {
      keyPoints.push('Focus on measurable results and impact');
    }
    
    if (answer.includes('learn') || answer.includes('grow')) {
      keyPoints.push('Commitment to continuous learning and growth');
    }
    
    // Add question-specific key points
    if (analysis.questionType === 'challenge') {
      keyPoints.push('Systematic approach to overcoming challenges');
    } else if (analysis.questionType === 'leadership') {
      keyPoints.push('Leadership and mentoring capabilities');
    } else if (analysis.questionType === 'motivation') {
      keyPoints.push('Genuine enthusiasm for the role and company');
    }
    
    return keyPoints.slice(0, 5); // Limit to 5 key points
  }

  /**
   * Generate follow-up preparation suggestions
   */
  private generateFollowUpPreparation(
    context: InterviewAnalysisContext,
    analysis: any
  ): string[] {
    const followUps: string[] = [];
    const { questionType, focusArea } = analysis;
    
    // Common follow-ups based on question type
    if (questionType === 'experience') {
      followUps.push('Be prepared to discuss specific technologies or methodologies used');
      followUps.push('Have metrics or outcomes ready to share');
      followUps.push('Think of related challenges you overcame');
    } else if (questionType === 'challenge') {
      followUps.push('Be ready to explain alternative approaches you considered');
      followUps.push('Prepare to discuss what you learned from the experience');
      followUps.push('Think about how you\'d handle similar situations differently');
    } else if (questionType === 'motivation') {
      followUps.push('Research recent company news or developments to reference');
      followUps.push('Prepare specific examples of how your values align with the company');
      followUps.push('Be ready to discuss your long-term career goals');
    }
    
    // Focus area specific follow-ups
    if (focusArea === 'technical') {
      followUps.push('Prepare to dive deeper into technical implementation details');
      followUps.push('Be ready to discuss trade-offs and alternative solutions');
    } else if (focusArea === 'leadership') {
      followUps.push('Have examples of difficult team situations you\'ve navigated');
      followUps.push('Be prepared to discuss your leadership philosophy');
    }
    
    // General follow-ups
    followUps.push('Prepare thoughtful questions about the role and team');
    followUps.push('Be ready to provide additional examples if requested');
    
    return followUps.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Estimate speaking duration
   */
  private estimateSpeakingDuration(answer: string): string {
    const wordCount = answer.split(/\s+/).length;
    const wordsPerMinute = 150; // Average speaking pace
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes === 1) {
      return '1 minute';
    } else if (minutes < 1) {
      return '30-45 seconds';
    } else {
      return `${minutes} minutes`;
    }
  }

  /**
   * Helper methods
   */
  private selectOpeningPhrase(phrases: string[], questionType: string): string {
    // Select appropriate opening phrase based on question type
    if (questionType === 'introduction') {
      return phrases.find(p => p.includes('I\'m')) || phrases[0];
    } else if (questionType === 'experience') {
      return phrases.find(p => p.includes('experience')) || phrases[0];
    } else {
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  }

  private ensureFirstPerson(answer: string): string {
    // Ensure the response is in first person
    return answer
      .replace(/\bOne should\b/g, 'I should')
      .replace(/\bYou would\b/g, 'I would')
      .replace(/\bA person might\b/g, 'I might')
      .replace(/\bSomeone could\b/g, 'I could');
  }

  private adjustForTone(
    answer: string,
    tone: 'confident' | 'thoughtful' | 'enthusiastic',
    toneConfig: any
  ): string {
    // Adjust language based on tone
    if (tone === 'confident') {
      return answer
        .replace(/I think/g, 'I believe')
        .replace(/maybe/g, 'likely')
        .replace(/might/g, 'will');
    } else if (tone === 'enthusiastic') {
      return answer
        .replace(/good/g, 'excellent')
        .replace(/interesting/g, 'fascinating')
        .replace(/like/g, 'love');
    }
    
    return answer;
  }

  private addRelevantExample(
    answer: string,
    context: InterviewAnalysisContext,
    analysis: any
  ): string {
    // Add a relevant example if the answer doesn't already include one
    if (!answer.includes('example') && !answer.includes('instance')) {
      const exampleIntro = '\n\nFor example, ';
      const genericExample = 'in a recent project, I successfully applied this approach to deliver results that exceeded expectations.';
      return answer + exampleIntro + genericExample;
    }
    return answer;
  }

  private getExperienceDescription(experience?: string): string {
    const descriptions = {
      entry: 'early-career',
      mid: 'several years of',
      senior: 'extensive',
      executive: 'executive-level'
    };
    return descriptions[experience as keyof typeof descriptions] || 'solid';
  }

  private getPassionArea(context: InterviewAnalysisContext): string {
    return context.industry || 'technology and innovation';
  }

  private getRelevantSkills(context: InterviewAnalysisContext): string {
    return 'technical leadership and system design';
  }

  private getGrowthAreas(context: InterviewAnalysisContext): string {
    return 'strategic planning and cross-functional collaboration';
  }

  private getTechnicalArea(context: InterviewAnalysisContext): string {
    return context.industry || 'software engineering';
  }

  private getExposureAreas(context: InterviewAnalysisContext): string {
    return 'strategic decision-making and team leadership';
  }

  /**
   * Generate fallback response
   */
  private generateFallbackResponse(context: InterviewAnalysisContext): VerbalInterviewResponse {
    return {
      question: context.question,
      answer: 'Thank you for that question. Based on my experience, I believe this is an important topic that requires careful consideration. I\'ve had opportunities to work in similar areas, and I\'ve found that success comes from combining technical expertise with strong collaboration skills. I\'m excited to bring this perspective to your team and contribute to achieving your goals.',
      keyPoints: [
        'Relevant experience and background',
        'Technical and collaborative skills',
        'Enthusiasm for the opportunity'
      ],
      followUpPreparation: [
        'Be prepared to provide specific examples',
        'Think about related experiences to share',
        'Prepare questions about the role and team'
      ],
      tone: 'confident',
      duration: '1-2 minutes'
    };
  }

  /**
   * Validate interview response
   */
  validateResponse(response: VerbalInterviewResponse): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!response.answer || response.answer.length < 50) {
      errors.push('Answer is missing or too short');
    }

    if (response.keyPoints.length === 0) {
      warnings.push('No key points provided');
    }

    if (response.followUpPreparation.length === 0) {
      warnings.push('No follow-up preparation suggestions provided');
    }

    // Check for first-person perspective
    if (!response.answer.includes('I ') && !response.answer.includes('my ')) {
      warnings.push('Response may not be in first-person perspective');
    }

    // Check answer length
    const wordCount = response.answer.split(/\s+/).length;
    if (wordCount < 30) {
      warnings.push('Answer may be too brief for an interview response');
    } else if (wordCount > 300) {
      warnings.push('Answer may be too long - consider being more concise');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Singleton instance
export const interviewGenerator = new InterviewResponseGenerator();