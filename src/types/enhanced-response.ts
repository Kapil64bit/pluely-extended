// Enhanced response system types and interfaces

export enum ResponseMode {
  MCQ = 'mcq',
  CODING = 'coding',
  VERBAL_INTERVIEW = 'verbal_interview',
  THEORETICAL = 'theoretical'
}

export enum StealthLevel {
  NORMAL = 'normal',
  ENHANCED = 'enhanced',
  ULTRA = 'ultra',
  INVISIBLE = 'invisible'
}

// Content Analysis Interfaces
export interface ContentAnalysis {
  extractedText: string;
  hasCode: boolean;
  hasMCQ: boolean;
  hasInterviewQuestion: boolean;
  programmingLanguage?: string;
  confidence: number;
  keyElements: string[];
  interviewAnalysis?: {
    questionType: string;
    context: string;
    suggestedResponseStyle: string;
    confidence: number;
  };
}

export interface CodeDetection {
  detected: boolean;
  language?: string;
  keywords: string[];
  syntaxPatterns: string[];
  confidence: number;
  alternativeLanguages?: Array<{
    language: string;
    confidence: number;
  }>;
  contextClues?: {
    hasImports: boolean;
    hasFunctions: boolean;
    hasClasses: boolean;
    hasComments: boolean;
    indentationStyle: 'spaces' | 'tabs' | 'mixed' | 'none';
    averageLineLength: number;
    codeComplexity: 'low' | 'medium' | 'high';
  };
}

export interface MCQStructure {
  detected: boolean;
  options: MCQOption[];
  questionText: string;
  confidence: number;
}

export interface MCQOption {
  id: string;
  text: string;
  label: string; // A, B, C, D or 1, 2, 3, 4
}

// Classification Interfaces
export interface ClassificationResult {
  mode: ResponseMode;
  confidence: number;
  reasoning: string;
  fallbackMode?: ResponseMode;
  detectedFeatures: string[];
}

// Response Generation Interfaces
export interface GenerationContext {
  programmingLanguage?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  previousContext?: string[];
  userPreferences?: UserPreferences;
  detectedContent?: ContentAnalysis;
}

export interface UserPreferences {
  preferredResponseStyle: 'concise' | 'detailed' | 'comprehensive';
  codingLanguagePreference?: string;
  interviewTone: 'confident' | 'thoughtful' | 'enthusiastic';
  stealthLevel: StealthLevel;
}

// Enhanced Response Structures
export interface EnhancedResponse {
  version: string;
  responseId: string;
  mode: ResponseMode;
  confidence: number;
  timestamp: number;
  content: ModeSpecificContent;
  metadata: ResponseMetadata;
}

export interface ResponseMetadata {
  generationTime: number;
  tokensUsed?: number;
  model: string;
  provider: string;
  qualityScore: number;
  classificationConfidence: number;
}

// Mode-specific content types
export type ModeSpecificContent = 
  | MCQResponse 
  | CodingResponse 
  | VerbalInterviewResponse 
  | TheoreticalResponse;

export interface MCQResponse {
  question: string;
  options: MCQOption[];
  correctAnswer: string;
  explanation: string;
  eliminationStrategy: string[];
  confidenceLevel: number;
  quickRecallHook?: string;
}

export interface CodingResponse {
  problemStatement: string;
  solution: CodeSolution;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  testCases: TestCase[];
  alternativeApproaches?: string[];
  constraints?: ProblemConstraints;
}

export interface CodeSolution {
  language: string;
  style: 'functional' | 'object-oriented' | 'procedural';
  main: string;
  helperSnippets: string[];
  comments: string[];
}

export interface TestCase {
  input: any;
  expected: any;
  description: string;
}

export interface ProblemConstraints {
  inputSizes: string[];
  valueRanges: string[];
  edgeCases: string[];
  assumptions: string[];
}

export interface VerbalInterviewResponse {
  question: string;
  answer: string; // First-person response
  keyPoints: string[];
  followUpPreparation: string[];
  tone: 'confident' | 'thoughtful' | 'enthusiastic';
  duration?: string; // Estimated speaking time
}

export interface TheoreticalResponse {
  topic: string;
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  commonMistakes: string[];
  relatedConcepts: string[];
  pitfalls: string[];
}

// Configuration Interfaces
export interface ModeConfiguration {
  mode: ResponseMode;
  systemPrompt: string;
  responseFormat: ResponseFormat;
  qualityChecks: QualityCheck[];
  fallbackBehavior: FallbackBehavior;
}

export interface ResponseFormat {
  structure: 'json' | 'markdown' | 'plain';
  includeMetadata: boolean;
  maxLength?: number;
  requiredFields: string[];
}

export interface QualityCheck {
  name: string;
  validator: (response: any) => boolean;
  errorMessage: string;
  severity: 'warning' | 'error';
}

export interface FallbackBehavior {
  onLowConfidence: 'retry' | 'fallback' | 'ask_user';
  onValidationFailure: 'regenerate' | 'manual_review' | 'use_default';
  maxRetries: number;
}

// Stealth System Interfaces
export interface StealthConfiguration {
  level: StealthLevel;
  windowProperties: WindowProperties;
  processSettings: ProcessSettings;
  detectionAvoidance: DetectionAvoidance;
}

export interface WindowProperties {
  transparency: number;
  layering: 'topmost' | 'normal' | 'background';
  positioning: 'fixed' | 'adaptive' | 'random';
  hideFromCapture: boolean;
}

export interface ProcessSettings {
  maskProcessName: boolean;
  hideFromTaskManager: boolean;
  mimicSystemProcess: boolean;
  randomizeSignature: boolean;
}

export interface DetectionAvoidance {
  monitorScreenRecording: boolean;
  detectMonitoringSoftware: boolean;
  adaptToEnvironment: boolean;
  emergencyHide: boolean;
}

export interface MonitoringDetection {
  detected: boolean;
  softwareNames: string[];
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: StealthRecommendation[];
}

export interface StealthRecommendation {
  action: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  autoApply: boolean;
}

// Event Interfaces
export interface ModeChangeEvent {
  previousMode: ResponseMode;
  newMode: ResponseMode;
  source: 'auto' | 'hotkey' | 'manual';
  timestamp: number;
  confidence?: number;
}

export interface ClassificationEvent {
  content: ContentAnalysis;
  result: ClassificationResult;
  timestamp: number;
  processingTime: number;
}

// Utility Types
export type PromptTemplate = {
  system: string;
  user: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
};

export type ResponseValidator = (response: any, mode: ResponseMode) => {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
};