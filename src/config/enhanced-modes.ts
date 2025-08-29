// Enhanced mode configurations and prompt templates

import { 
  ResponseMode, 
  ModeConfiguration, 
  PromptTemplate, 
  StealthLevel,
  StealthConfiguration 
} from '../types/enhanced-response';

// Mode-specific prompt templates
export const PROMPT_TEMPLATES: Record<ResponseMode, PromptTemplate> = {
  [ResponseMode.MCQ]: {
    system: `You are an expert test solver and educator. When analyzing multiple choice questions:

1. Carefully read the question and all options
2. Use elimination strategy to rule out incorrect answers
3. Provide clear reasoning for the correct choice
4. Explain why other options are wrong
5. Include memory techniques or quick recall hooks when helpful

ALWAYS respond in this JSON format:
{
  "version": "1.0",
  "responseId": "mcq_[timestamp]",
  "responseType": "mcq",
  "questionEcho": "[restate the question]",
  "interviewTone": true,
  "meta": {
    "confidence": [0-1],
    "difficulty": "[easy|medium|hard]",
    "tags": ["subject", "topic"]
  },
  "answer": {
    "question": "[full question text]",
    "options": [{"id": "A", "text": "option text"}],
    "correctOptionId": "[A|B|C|D]",
    "justification": "[why this is correct]",
    "eliminations": [{"optionId": "B", "reason": "why wrong"}],
    "quickRecallHook": "[memory technique]"
  },
  "followUps": [{"prompt": "related question", "purpose": "deeper understanding"}]
}`,
    user: "Analyze this multiple choice question from the screenshot and provide the correct answer with detailed reasoning.",
    examples: [
      {
        input: "What is the time complexity of binary search? A) O(n) B) O(log n) C) O(n²) D) O(1)",
        output: `{
  "version": "1.0",
  "responseId": "mcq_1234567890",
  "responseType": "mcq",
  "questionEcho": "What is the time complexity of binary search?",
  "interviewTone": true,
  "meta": {
    "confidence": 0.95,
    "difficulty": "medium",
    "tags": ["algorithms", "complexity"]
  },
  "answer": {
    "question": "What is the time complexity of binary search?",
    "options": [
      {"id": "A", "text": "O(n)"},
      {"id": "B", "text": "O(log n)"},
      {"id": "C", "text": "O(n²)"},
      {"id": "D", "text": "O(1)"}
    ],
    "correctOptionId": "B",
    "justification": "Binary search eliminates half the search space in each iteration, leading to logarithmic time complexity",
    "eliminations": [
      {"optionId": "A", "reason": "O(n) is linear search complexity"},
      {"optionId": "C", "reason": "O(n²) is quadratic, much worse than binary search"},
      {"optionId": "D", "reason": "O(1) is constant time, impossible for search algorithms"}
    ],
    "quickRecallHook": "Binary = half each time = log n"
  },
  "followUps": [
    {"prompt": "What are the prerequisites for binary search?", "purpose": "understanding requirements"}
  ]
}`
      }
    ]
  },

  [ResponseMode.CODING]: {
    system: `You are a senior software engineer and coding interview expert. When solving coding problems:

1. Understand the problem thoroughly
2. Think through the approach step by step
3. Consider time and space complexity
4. Provide clean, well-commented code
5. Include test cases and edge cases
6. Suggest alternative approaches when relevant

ALWAYS respond in this JSON format:
{
  "version": "1.0",
  "responseId": "coding_[timestamp]",
  "responseType": "coding",
  "questionEcho": "[restate the problem]",
  "interviewTone": true,
  "meta": {
    "confidence": [0-1],
    "difficulty": "[easy|medium|hard]",
    "tags": ["data-structures", "algorithms"]
  },
  "answer": {
    "solutionOverview": "[brief approach description]",
    "approachSteps": ["step 1", "step 2"],
    "timeComplexity": "O(...)",
    "spaceComplexity": "O(...)",
    "constraints": {
      "inputSizes": ["n <= 10^5"],
      "valueRanges": ["values between -10^9 and 10^9"],
      "edgeCases": ["empty input", "single element"],
      "assumptions": ["input is valid"]
    },
    "variants": ["alternative approach 1"],
    "code": {
      "language": "javascript",
      "style": "functional",
      "main": "[complete working code with comments]",
      "helperSnippets": ["helper function if needed"]
    },
    "tests": [{"input": "example", "expected": "result"}],
    "explanationNotes": ["key insight 1", "why this works"]
  },
  "followUps": [{"prompt": "optimization question", "purpose": "deeper analysis"}]
}`,
    user: "Solve this coding problem from the screenshot. Provide a complete solution with explanation, complexity analysis, and test cases.",
    examples: [
      {
        input: "Write a function to check if a string is a palindrome",
        output: `{
  "version": "1.0",
  "responseId": "coding_1234567890",
  "responseType": "coding",
  "questionEcho": "Write a function to check if a string is a palindrome",
  "interviewTone": true,
  "meta": {
    "confidence": 0.9,
    "difficulty": "easy",
    "tags": ["strings", "two-pointers"]
  },
  "answer": {
    "solutionOverview": "Use two pointers from start and end, compare characters while moving inward",
    "approachSteps": [
      "Initialize left pointer at start, right pointer at end",
      "Compare characters at both pointers",
      "If different, return false",
      "Move pointers inward and repeat",
      "If all characters match, return true"
    ],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)",
    "constraints": {
      "inputSizes": ["string length up to 10^5"],
      "valueRanges": ["ASCII characters"],
      "edgeCases": ["empty string", "single character", "case sensitivity"],
      "assumptions": ["input is a valid string"]
    },
    "variants": ["recursive approach", "using built-in reverse"],
    "code": {
      "language": "javascript",
      "style": "functional",
      "main": "function isPalindrome(s) {\n  // Convert to lowercase and remove non-alphanumeric\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  \n  let left = 0;\n  let right = cleaned.length - 1;\n  \n  // Two pointer approach\n  while (left < right) {\n    if (cleaned[left] !== cleaned[right]) {\n      return false;\n    }\n    left++;\n    right--;\n  }\n  \n  return true;\n}",
      "helperSnippets": []
    },
    "tests": [
      {"input": "racecar", "expected": true},
      {"input": "hello", "expected": false},
      {"input": "A man a plan a canal Panama", "expected": true}
    ],
    "explanationNotes": [
      "Two pointers eliminate need for extra space",
      "Preprocessing handles case and punctuation",
      "Early termination on first mismatch"
    ]
  },
  "followUps": [
    {"prompt": "How would you handle Unicode characters?", "purpose": "edge case handling"}
  ]
}`
      }
    ]
  },

  [ResponseMode.VERBAL_INTERVIEW]: {
    system: `You are helping someone prepare for a verbal interview. Generate first-person responses as if the user is answering the interviewer directly. 

Key principles:
1. Use "I" statements and personal perspective
2. Sound confident but not arrogant
3. Be conversational and natural
4. Include specific examples when relevant
5. Show enthusiasm and knowledge
6. Keep responses concise but comprehensive

ALWAYS respond in this JSON format:
{
  "version": "1.0",
  "responseId": "interview_[timestamp]",
  "responseType": "theoretical",
  "questionEcho": "[restate the question]",
  "interviewTone": true,
  "meta": {
    "confidence": [0-1],
    "difficulty": "[easy|medium|hard]",
    "tags": ["interview", "topic"]
  },
  "answer": {
    "summary": "[brief first-person answer]",
    "detailed": "[comprehensive first-person explanation]",
    "keyPoints": ["key point 1 in first person", "key point 2"],
    "pitfalls": ["common mistake to avoid"]
  },
  "followUps": [{"prompt": "follow-up question", "purpose": "deeper exploration"}]
}`,
    user: "Help me answer this interview question. Provide a first-person response as if I'm speaking to the interviewer.",
    examples: [
      {
        input: "What is Node.js?",
        output: `{
  "version": "1.0",
  "responseId": "interview_1234567890",
  "responseType": "theoretical",
  "questionEcho": "What is Node.js?",
  "interviewTone": true,
  "meta": {
    "confidence": 0.9,
    "difficulty": "easy",
    "tags": ["interview", "nodejs", "backend"]
  },
  "answer": {
    "summary": "Node.js is a JavaScript runtime environment that allows me to run JavaScript on the server side, built on Chrome's V8 engine.",
    "detailed": "I use Node.js as a JavaScript runtime environment that's built on Chrome's V8 JavaScript engine. What makes it particularly powerful is its event-driven, non-blocking I/O model, which makes it lightweight and efficient for building scalable network applications. In my experience, it's excellent for building APIs, real-time applications like chat systems, and microservices. I've worked with it extensively for backend development, and I appreciate how it allows me to use the same language - JavaScript - across both frontend and backend, which streamlines the development process.",
    "keyPoints": [
      "I know it's built on Chrome's V8 engine for high performance",
      "I leverage its non-blocking, event-driven architecture for scalable applications",
      "I use it primarily for backend development and API creation",
      "I appreciate the unified JavaScript ecosystem it provides"
    ],
    "pitfalls": [
      "Not suitable for CPU-intensive tasks due to single-threaded nature",
      "Callback hell can be an issue without proper async/await usage"
    ]
  },
  "followUps": [
    {"prompt": "What are some advantages of Node.js over other backend technologies?", "purpose": "comparative analysis"}
  ]
}`
      }
    ]
  },

  [ResponseMode.THEORETICAL]: {
    system: `You are an expert educator providing comprehensive theoretical explanations. Focus on:

1. Clear, structured explanations
2. Key concepts and principles
3. Common pitfalls and mistakes
4. Related concepts and connections
5. Practical applications when relevant

ALWAYS respond in this JSON format:
{
  "version": "1.0",
  "responseId": "theory_[timestamp]",
  "responseType": "theoretical",
  "questionEcho": "[restate the question/topic]",
  "interviewTone": false,
  "meta": {
    "confidence": [0-1],
    "difficulty": "[easy|medium|hard]",
    "tags": ["subject", "topic"]
  },
  "answer": {
    "summary": "[brief overview]",
    "detailed": "[comprehensive explanation]",
    "keyPoints": ["important point 1", "important point 2"],
    "pitfalls": ["common mistake 1", "common mistake 2"]
  },
  "followUps": [{"prompt": "related question", "purpose": "deeper understanding"}]
}`,
    user: "Explain this concept or answer this theoretical question from the screenshot.",
    examples: [
      {
        input: "Explain the concept of recursion in programming",
        output: `{
  "version": "1.0",
  "responseId": "theory_1234567890",
  "responseType": "theoretical",
  "questionEcho": "Explain the concept of recursion in programming",
  "interviewTone": false,
  "meta": {
    "confidence": 0.95,
    "difficulty": "medium",
    "tags": ["programming", "algorithms", "recursion"]
  },
  "answer": {
    "summary": "Recursion is a programming technique where a function calls itself to solve smaller instances of the same problem.",
    "detailed": "Recursion is a fundamental programming concept where a function calls itself to solve a problem by breaking it down into smaller, similar subproblems. Every recursive function must have two essential components: a base case (stopping condition) that prevents infinite recursion, and a recursive case where the function calls itself with modified parameters that eventually lead to the base case. The function call stack manages these recursive calls, storing each function's local variables and return address until the base case is reached, then unwinding the stack to return results.",
    "keyPoints": [
      "Must have a base case to prevent infinite recursion",
      "Each recursive call should work on a smaller version of the problem",
      "The call stack manages recursive function calls",
      "Useful for problems with self-similar substructures like trees and fractals",
      "Can often be converted to iterative solutions using explicit stacks"
    ],
    "pitfalls": [
      "Stack overflow from missing or incorrect base cases",
      "Performance issues due to repeated calculations (solve with memoization)",
      "Excessive memory usage from deep recursion",
      "Difficulty in debugging due to multiple function calls"
    ]
  },
  "followUps": [
    {"prompt": "What's the difference between recursion and iteration?", "purpose": "comparative understanding"}
  ]
}`
      }
    ]
  }
};

// Default mode configurations
export const MODE_CONFIGURATIONS: Record<ResponseMode, ModeConfiguration> = {
  [ResponseMode.MCQ]: {
    mode: ResponseMode.MCQ,
    systemPrompt: PROMPT_TEMPLATES[ResponseMode.MCQ].system,
    responseFormat: {
      structure: 'json',
      includeMetadata: true,
      maxLength: 2000,
      requiredFields: ['answer.correctOptionId', 'answer.justification', 'answer.eliminations']
    },
    qualityChecks: [
      {
        name: 'hasCorrectAnswer',
        validator: (response) => response.answer?.correctOptionId != null,
        errorMessage: 'Response must include a correct answer selection',
        severity: 'error'
      },
      {
        name: 'hasJustification',
        validator: (response) => response.answer?.justification?.length > 10,
        errorMessage: 'Response must include detailed justification',
        severity: 'error'
      }
    ],
    fallbackBehavior: {
      onLowConfidence: 'retry',
      onValidationFailure: 'regenerate',
      maxRetries: 2
    }
  },

  [ResponseMode.CODING]: {
    mode: ResponseMode.CODING,
    systemPrompt: PROMPT_TEMPLATES[ResponseMode.CODING].system,
    responseFormat: {
      structure: 'json',
      includeMetadata: true,
      maxLength: 4000,
      requiredFields: ['answer.code.main', 'answer.timeComplexity', 'answer.spaceComplexity']
    },
    qualityChecks: [
      {
        name: 'hasWorkingCode',
        validator: (response) => response.answer?.code?.main?.length > 20,
        errorMessage: 'Response must include working code solution',
        severity: 'error'
      },
      {
        name: 'hasComplexityAnalysis',
        validator: (response) => response.answer?.timeComplexity && response.answer?.spaceComplexity,
        errorMessage: 'Response must include time and space complexity analysis',
        severity: 'error'
      }
    ],
    fallbackBehavior: {
      onLowConfidence: 'retry',
      onValidationFailure: 'regenerate',
      maxRetries: 3
    }
  },

  [ResponseMode.VERBAL_INTERVIEW]: {
    mode: ResponseMode.VERBAL_INTERVIEW,
    systemPrompt: PROMPT_TEMPLATES[ResponseMode.VERBAL_INTERVIEW].system,
    responseFormat: {
      structure: 'json',
      includeMetadata: true,
      maxLength: 1500,
      requiredFields: ['answer.summary', 'answer.detailed']
    },
    qualityChecks: [
      {
        name: 'isFirstPerson',
        validator: (response) => {
          const text = response.answer?.detailed || '';
          return text.includes('I ') || text.includes('my ') || text.includes('me ');
        },
        errorMessage: 'Response must be in first person perspective',
        severity: 'error'
      },
      {
        name: 'hasKeyPoints',
        validator: (response) => response.answer?.keyPoints?.length > 0,
        errorMessage: 'Response must include key points',
        severity: 'warning'
      }
    ],
    fallbackBehavior: {
      onLowConfidence: 'retry',
      onValidationFailure: 'regenerate',
      maxRetries: 2
    }
  },

  [ResponseMode.THEORETICAL]: {
    mode: ResponseMode.THEORETICAL,
    systemPrompt: PROMPT_TEMPLATES[ResponseMode.THEORETICAL].system,
    responseFormat: {
      structure: 'json',
      includeMetadata: true,
      maxLength: 3000,
      requiredFields: ['answer.summary', 'answer.detailed', 'answer.keyPoints']
    },
    qualityChecks: [
      {
        name: 'hasComprehensiveExplanation',
        validator: (response) => response.answer?.detailed?.length > 50,
        errorMessage: 'Response must include comprehensive explanation',
        severity: 'error'
      },
      {
        name: 'hasKeyPoints',
        validator: (response) => response.answer?.keyPoints?.length > 0,
        errorMessage: 'Response must include key points',
        severity: 'error'
      }
    ],
    fallbackBehavior: {
      onLowConfidence: 'ask_user',
      onValidationFailure: 'regenerate',
      maxRetries: 2
    }
  }
};

// Stealth configurations
export const STEALTH_CONFIGURATIONS: Record<StealthLevel, StealthConfiguration> = {
  [StealthLevel.NORMAL]: {
    level: StealthLevel.NORMAL,
    windowProperties: {
      transparency: 0.95,
      layering: 'topmost',
      positioning: 'fixed',
      hideFromCapture: false
    },
    processSettings: {
      maskProcessName: false,
      hideFromTaskManager: false,
      mimicSystemProcess: false,
      randomizeSignature: false
    },
    detectionAvoidance: {
      monitorScreenRecording: false,
      detectMonitoringSoftware: false,
      adaptToEnvironment: false,
      emergencyHide: false
    }
  },

  [StealthLevel.ENHANCED]: {
    level: StealthLevel.ENHANCED,
    windowProperties: {
      transparency: 0.98,
      layering: 'topmost',
      positioning: 'adaptive',
      hideFromCapture: true
    },
    processSettings: {
      maskProcessName: true,
      hideFromTaskManager: false,
      mimicSystemProcess: false,
      randomizeSignature: true
    },
    detectionAvoidance: {
      monitorScreenRecording: true,
      detectMonitoringSoftware: true,
      adaptToEnvironment: true,
      emergencyHide: false
    }
  },

  [StealthLevel.ULTRA]: {
    level: StealthLevel.ULTRA,
    windowProperties: {
      transparency: 0.99,
      layering: 'background',
      positioning: 'adaptive',
      hideFromCapture: true
    },
    processSettings: {
      maskProcessName: true,
      hideFromTaskManager: true,
      mimicSystemProcess: true,
      randomizeSignature: true
    },
    detectionAvoidance: {
      monitorScreenRecording: true,
      detectMonitoringSoftware: true,
      adaptToEnvironment: true,
      emergencyHide: true
    }
  },

  [StealthLevel.INVISIBLE]: {
    level: StealthLevel.INVISIBLE,
    windowProperties: {
      transparency: 1.0,
      layering: 'background',
      positioning: 'random',
      hideFromCapture: true
    },
    processSettings: {
      maskProcessName: true,
      hideFromTaskManager: true,
      mimicSystemProcess: true,
      randomizeSignature: true
    },
    detectionAvoidance: {
      monitorScreenRecording: true,
      detectMonitoringSoftware: true,
      adaptToEnvironment: true,
      emergencyHide: true
    }
  }
};

// Default settings
export const DEFAULT_ENHANCED_SETTINGS = {
  currentMode: ResponseMode.THEORETICAL,
  autoClassification: true,
  classificationConfidenceThreshold: 0.7,
  stealthLevel: StealthLevel.NORMAL,
  userPreferences: {
    preferredResponseStyle: 'detailed' as const,
    interviewTone: 'confident' as const,
    stealthLevel: StealthLevel.NORMAL
  }
};