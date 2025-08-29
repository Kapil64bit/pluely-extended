// Enhanced interview question detection with linguistic analysis

export interface InterviewDetectionResult {
  isInterviewQuestion: boolean;
  confidence: number;
  questionType: InterviewQuestionType;
  context: InterviewContext;
  matchedPatterns: {
    questionWords: string[];
    modalVerbs: string[];
    imperativeVerbs: string[];
    professionalTerms: string[];
    conversationalCues: string[];
  };
  suggestedResponseStyle: ResponseStyle;
}

export enum InterviewQuestionType {
  BEHAVIORAL = 'behavioral',
  TECHNICAL = 'technical',
  SITUATIONAL = 'situational',
  EXPERIENCE = 'experience',
  OPINION = 'opinion',
  HYPOTHETICAL = 'hypothetical',
  COMPETENCY = 'competency',
  CULTURAL_FIT = 'cultural_fit'
}

export enum InterviewContext {
  JOB_INTERVIEW = 'job_interview',
  TECHNICAL_INTERVIEW = 'technical_interview',
  ACADEMIC_INTERVIEW = 'academic_interview',
  CASUAL_CONVERSATION = 'casual_conversation',
  ASSESSMENT = 'assessment',
  PEER_REVIEW = 'peer_review'
}

export enum ResponseStyle {
  CONFIDENT = 'confident',
  THOUGHTFUL = 'thoughtful',
  ENTHUSIASTIC = 'enthusiastic',
  ANALYTICAL = 'analytical',
  STORYTELLING = 'storytelling',
  CONCISE = 'concise'
}

export class InterviewDetector {
  private questionWords = {
    primary: [
      'what', 'how', 'why', 'when', 'where', 'who', 'which', 'whose'
    ],
    secondary: [
      'describe', 'explain', 'tell', 'discuss', 'elaborate', 'clarify',
      'define', 'outline', 'summarize', 'compare', 'contrast', 'analyze'
    ]
  };

  private modalVerbs = [
    'can', 'could', 'would', 'will', 'should', 'shall', 'may', 'might',
    'must', 'ought', 'need', 'dare', 'used'
  ];

  private imperativeVerbs = [
    'tell', 'describe', 'explain', 'walk', 'talk', 'share', 'give',
    'provide', 'show', 'demonstrate', 'illustrate', 'elaborate',
    'discuss', 'outline', 'summarize', 'detail', 'clarify'
  ];

  private behavioralIndicators = [
    'time when', 'situation where', 'example of', 'instance when',
    'experience with', 'challenge you', 'difficult situation', 'conflict',
    'disagreement', 'mistake', 'failure', 'success', 'achievement',
    'leadership', 'teamwork', 'collaboration', 'problem solving'
  ];

  private technicalIndicators = [
    'algorithm', 'data structure', 'complexity', 'optimization', 'design pattern',
    'architecture', 'framework', 'library', 'api', 'database', 'system design',
    'scalability', 'performance', 'security', 'testing', 'debugging',
    'code review', 'best practices', 'methodology', 'technology stack'
  ];

  private experienceIndicators = [
    'worked with', 'experience with', 'familiar with', 'used', 'implemented',
    'developed', 'built', 'created', 'designed', 'maintained', 'managed',
    'led', 'collaborated', 'contributed', 'participated', 'involved',
    'responsible for', 'in charge of', 'handled', 'dealt with'
  ];

  private opinionIndicators = [
    'think about', 'opinion on', 'thoughts on', 'view on', 'perspective on',
    'feel about', 'believe', 'consider', 'regard', 'see', 'perceive',
    'prefer', 'favor', 'like', 'dislike', 'agree', 'disagree'
  ];

  private situationalIndicators = [
    'if you were', 'suppose you', 'imagine you', 'what would you do',
    'how would you handle', 'how would you approach', 'what if',
    'in a situation where', 'faced with', 'confronted with', 'given',
    'assuming', 'hypothetically', 'scenario where'
  ];

  private professionalTerms = [
    'career', 'job', 'role', 'position', 'responsibility', 'duty', 'task',
    'project', 'team', 'colleague', 'manager', 'supervisor', 'client',
    'customer', 'stakeholder', 'deadline', 'budget', 'goal', 'objective',
    'target', 'milestone', 'deliverable', 'requirement', 'specification'
  ];

  private conversationalCues = [
    'tell me about', 'walk me through', 'can you', 'could you', 'would you',
    'have you ever', 'do you have', 'are you', 'were you', 'will you',
    'did you', 'have you', 'had you', 'let me know', 'i\'d like to know',
    'i\'m curious about', 'i\'m interested in', 'help me understand'
  ];

  private culturalFitIndicators = [
    'company culture', 'work environment', 'team dynamics', 'values',
    'mission', 'vision', 'fit in', 'belong', 'contribute', 'add value',
    'personality', 'work style', 'communication style', 'approach',
    'motivation', 'passion', 'interest', 'enthusiasm', 'commitment'
  ];

  /**
   * Detect if content contains interview questions
   */
  detectInterviewQuestion(content: string): InterviewDetectionResult {
    if (!content || content.trim().length === 0) {
      return this.createEmptyResult();
    }

    const contentLower = content.toLowerCase();
    const sentences = this.splitIntoSentences(content);
    
    // Analyze each sentence for interview patterns
    const sentenceAnalyses = sentences.map(sentence => 
      this.analyzeSentence(sentence.toLowerCase())
    );

    // Aggregate results
    const aggregatedAnalysis = this.aggregateAnalyses(sentenceAnalyses);
    
    // Determine question type and context
    const questionType = this.determineQuestionType(aggregatedAnalysis, contentLower);
    const context = this.determineContext(aggregatedAnalysis, contentLower);
    
    // Calculate confidence
    const confidence = this.calculateConfidence(aggregatedAnalysis, sentences.length);
    
    // Determine if it's an interview question
    const isInterviewQuestion = confidence > 0.4 && this.hasInterviewCharacteristics(aggregatedAnalysis);
    
    // Suggest response style
    const suggestedResponseStyle = this.suggestResponseStyle(questionType, context, aggregatedAnalysis);

    return {
      isInterviewQuestion,
      confidence,
      questionType,
      context,
      matchedPatterns: aggregatedAnalysis,
      suggestedResponseStyle
    };
  }

  /**
   * Split content into sentences
   */
  private splitIntoSentences(content: string): string[] {
    // Simple sentence splitting - could be enhanced with NLP library
    return content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Analyze individual sentence for interview patterns
   */
  private analyzeSentence(sentence: string) {
    const analysis = {
      questionWords: [] as string[],
      modalVerbs: [] as string[],
      imperativeVerbs: [] as string[],
      professionalTerms: [] as string[],
      conversationalCues: [] as string[]
    };

    // Check for question words
    for (const word of [...this.questionWords.primary, ...this.questionWords.secondary]) {
      if (sentence.includes(word)) {
        analysis.questionWords.push(word);
      }
    }

    // Check for modal verbs
    for (const modal of this.modalVerbs) {
      if (sentence.includes(` ${modal} `) || sentence.startsWith(`${modal} `)) {
        analysis.modalVerbs.push(modal);
      }
    }

    // Check for imperative verbs
    for (const verb of this.imperativeVerbs) {
      if (sentence.includes(verb)) {
        analysis.imperativeVerbs.push(verb);
      }
    }

    // Check for professional terms
    for (const term of this.professionalTerms) {
      if (sentence.includes(term)) {
        analysis.professionalTerms.push(term);
      }
    }

    // Check for conversational cues
    for (const cue of this.conversationalCues) {
      if (sentence.includes(cue)) {
        analysis.conversationalCues.push(cue);
      }
    }

    return analysis;
  }

  /**
   * Aggregate analyses from all sentences
   */
  private aggregateAnalyses(analyses: any[]) {
    const aggregated = {
      questionWords: [] as string[],
      modalVerbs: [] as string[],
      imperativeVerbs: [] as string[],
      professionalTerms: [] as string[],
      conversationalCues: [] as string[]
    };

    for (const analysis of analyses) {
      aggregated.questionWords.push(...analysis.questionWords);
      aggregated.modalVerbs.push(...analysis.modalVerbs);
      aggregated.imperativeVerbs.push(...analysis.imperativeVerbs);
      aggregated.professionalTerms.push(...analysis.professionalTerms);
      aggregated.conversationalCues.push(...analysis.conversationalCues);
    }

    // Remove duplicates
    aggregated.questionWords = [...new Set(aggregated.questionWords)];
    aggregated.modalVerbs = [...new Set(aggregated.modalVerbs)];
    aggregated.imperativeVerbs = [...new Set(aggregated.imperativeVerbs)];
    aggregated.professionalTerms = [...new Set(aggregated.professionalTerms)];
    aggregated.conversationalCues = [...new Set(aggregated.conversationalCues)];

    return aggregated;
  }

  /**
   * Determine the type of interview question
   */
  private determineQuestionType(analysis: any, content: string): InterviewQuestionType {
    // Check for behavioral indicators
    const behavioralScore = this.behavioralIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Check for technical indicators
    const technicalScore = this.technicalIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Check for experience indicators
    const experienceScore = this.experienceIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Check for opinion indicators
    const opinionScore = this.opinionIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Check for situational indicators
    const situationalScore = this.situationalIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Check for cultural fit indicators
    const culturalScore = this.culturalFitIndicators
      .filter(indicator => content.includes(indicator)).length;

    // Determine highest scoring type
    const scores = {
      [InterviewQuestionType.BEHAVIORAL]: behavioralScore,
      [InterviewQuestionType.TECHNICAL]: technicalScore,
      [InterviewQuestionType.EXPERIENCE]: experienceScore,
      [InterviewQuestionType.OPINION]: opinionScore,
      [InterviewQuestionType.SITUATIONAL]: situationalScore,
      [InterviewQuestionType.CULTURAL_FIT]: culturalScore
    };

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return InterviewQuestionType.COMPETENCY; // Default
    }

    return Object.keys(scores).find(key => 
      scores[key as InterviewQuestionType] === maxScore
    ) as InterviewQuestionType;
  }

  /**
   * Determine the interview context
   */
  private determineContext(analysis: any, content: string): InterviewContext {
    // Simple heuristics for context determination
    if (this.technicalIndicators.some(indicator => content.includes(indicator))) {
      return InterviewContext.TECHNICAL_INTERVIEW;
    }

    if (this.professionalTerms.some(term => content.includes(term))) {
      return InterviewContext.JOB_INTERVIEW;
    }

    if (content.includes('academic') || content.includes('research') || content.includes('study')) {
      return InterviewContext.ACADEMIC_INTERVIEW;
    }

    if (analysis.conversationalCues.length > 2) {
      return InterviewContext.CASUAL_CONVERSATION;
    }

    return InterviewContext.JOB_INTERVIEW; // Default
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(analysis: any, sentenceCount: number): number {
    let score = 0;

    // Question words contribute significantly
    score += analysis.questionWords.length * 0.2;

    // Modal verbs indicate questions
    score += analysis.modalVerbs.length * 0.15;

    // Imperative verbs suggest requests for information
    score += analysis.imperativeVerbs.length * 0.1;

    // Professional terms indicate interview context
    score += analysis.professionalTerms.length * 0.1;

    // Conversational cues are strong indicators
    score += analysis.conversationalCues.length * 0.25;

    // Adjust for content length
    const lengthFactor = Math.min(sentenceCount / 3, 1);
    score *= lengthFactor;

    // Normalize to 0-1 range
    return Math.min(score, 1);
  }

  /**
   * Check if content has interview characteristics
   */
  private hasInterviewCharacteristics(analysis: any): boolean {
    // Must have at least one strong indicator
    return (
      analysis.questionWords.length > 0 ||
      analysis.conversationalCues.length > 0 ||
      analysis.imperativeVerbs.length > 0
    ) && (
      analysis.professionalTerms.length > 0 ||
      analysis.modalVerbs.length > 0
    );
  }

  /**
   * Suggest appropriate response style
   */
  private suggestResponseStyle(
    questionType: InterviewQuestionType,
    context: InterviewContext,
    analysis: any
  ): ResponseStyle {
    switch (questionType) {
      case InterviewQuestionType.BEHAVIORAL:
        return ResponseStyle.STORYTELLING;
      
      case InterviewQuestionType.TECHNICAL:
        return ResponseStyle.ANALYTICAL;
      
      case InterviewQuestionType.SITUATIONAL:
        return ResponseStyle.THOUGHTFUL;
      
      case InterviewQuestionType.EXPERIENCE:
        return ResponseStyle.CONFIDENT;
      
      case InterviewQuestionType.OPINION:
        return ResponseStyle.THOUGHTFUL;
      
      case InterviewQuestionType.CULTURAL_FIT:
        return ResponseStyle.ENTHUSIASTIC;
      
      default:
        return ResponseStyle.CONFIDENT;
    }
  }

  /**
   * Create empty result for invalid input
   */
  private createEmptyResult(): InterviewDetectionResult {
    return {
      isInterviewQuestion: false,
      confidence: 0,
      questionType: InterviewQuestionType.COMPETENCY,
      context: InterviewContext.JOB_INTERVIEW,
      matchedPatterns: {
        questionWords: [],
        modalVerbs: [],
        imperativeVerbs: [],
        professionalTerms: [],
        conversationalCues: []
      },
      suggestedResponseStyle: ResponseStyle.CONFIDENT
    };
  }

  /**
   * Get detailed analysis for debugging
   */
  getDetailedAnalysis(content: string): {
    sentences: string[];
    sentenceAnalyses: any[];
    indicators: {
      behavioral: string[];
      technical: string[];
      experience: string[];
      opinion: string[];
      situational: string[];
      cultural: string[];
    };
  } {
    const sentences = this.splitIntoSentences(content);
    const sentenceAnalyses = sentences.map(sentence => 
      this.analyzeSentence(sentence.toLowerCase())
    );

    const contentLower = content.toLowerCase();
    const indicators = {
      behavioral: this.behavioralIndicators.filter(i => contentLower.includes(i)),
      technical: this.technicalIndicators.filter(i => contentLower.includes(i)),
      experience: this.experienceIndicators.filter(i => contentLower.includes(i)),
      opinion: this.opinionIndicators.filter(i => contentLower.includes(i)),
      situational: this.situationalIndicators.filter(i => contentLower.includes(i)),
      cultural: this.culturalFitIndicators.filter(i => contentLower.includes(i))
    };

    return {
      sentences,
      sentenceAnalyses,
      indicators
    };
  }
}

// Singleton instance
export const interviewDetector = new InterviewDetector();