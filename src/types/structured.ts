// Structured AI response schema for interview-style JSON outputs
export type ResponseType = 'theoretical' | 'coding' | 'mcq';

export interface MetaInfo {
  confidence: number; // 0-1
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface TheoreticalAnswer {
  summary: string;
  detailed: string;
  keyPoints: string[];
  pitfalls: string[];
}

export interface CodingConstraints {
  inputSizes: string;
  valueRanges?: string;
  edgeCases: string[];
  assumptions: string[];
}

export interface CodingCodeSnippet {
  language: string;
  style: string;
  main: string; // full commented code
  helperSnippets?: { name: string; code: string }[];
}

export interface CodingAnswer {
  solutionOverview: string;
  approachSteps: string[];
  timeComplexity: string;
  spaceComplexity: string;
  constraints: CodingConstraints;
  variants?: string[];
  code: CodingCodeSnippet;
  tests?: { input: string; expected: string }[];
  explanationNotes?: string[];
}

export interface MCQOption { id: string; text: string; }
export interface MCQElimination { optionId: string; reason: string; }

export interface MCQAnswer {
  question: string;
  options: MCQOption[];
  correctOptionId: string;
  justification: string;
  eliminations?: MCQElimination[];
  quickRecallHook?: string;
}

export interface FollowUp { prompt: string; purpose: string; }

export interface StructuredAIResponse {
  version: string;
  responseId: string;
  responseType: ResponseType;
  questionEcho: string;
  interviewTone: boolean; // coerced to boolean even if provider sends string
  meta: MetaInfo;
  answer: TheoreticalAnswer | CodingAnswer | MCQAnswer;
  followUps?: FollowUp[];
}

export function isStructuredAIResponse(obj: any): obj is StructuredAIResponse {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.responseType !== 'string') return false;
  if (!['theoretical','coding','mcq'].includes(obj.responseType)) return false;
  if (!obj.answer) return false;
  return true;
}

// Normalization util to coerce loosely formatted provider output into canonical schema
export function normalizeStructured(obj: any): StructuredAIResponse | null {
  if (!isStructuredAIResponse(obj)) return null;
  const interviewTone = typeof obj.interviewTone === 'boolean' ? obj.interviewTone : true; // treat any string as true
  // Normalize tests for coding responses
  if (obj.responseType === 'coding') {
    const a = obj.answer as CodingAnswer & { tests?: any };
    if (a.tests) {
      a.tests = a.tests.map((t: any) => {
        if (t && typeof t === 'object' && 'input' in t && typeof t.input === 'object' && 'expectedOutput' in t) {
          const inputStr = Object.entries(t.input).map(([k,v]) => `${k}=${v}`).join(', ');
            return { input: inputStr, expected: t.expectedOutput };
        }
        if (t && typeof t === 'object' && 'input' in t && 'expected' in t) return t;
        return t;
      });
    }
    if (a.timeComplexity) a.timeComplexity = a.timeComplexity.replace(/^[Tt]ime complexity:?\s*/,'');
    if (a.spaceComplexity) a.spaceComplexity = a.spaceComplexity.replace(/^[Ss]pace complexity:?\s*/,'');
  }
  return {
    version: obj.version || '1.0',
    responseId: obj.responseId || `resp_${Date.now()}`,
    responseType: obj.responseType,
    questionEcho: obj.questionEcho || '',
    interviewTone,
    meta: obj.meta || { confidence: 0.5, difficulty: 'medium', tags: [] },
    answer: obj.answer,
    followUps: obj.followUps || []
  };
}
