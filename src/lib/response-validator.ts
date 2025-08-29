// Response validation utilities for enhanced response system

import { 
  ResponseMode, 
  EnhancedResponse, 
  ModeSpecificContent,
  MCQResponse,
  CodingResponse,
  VerbalInterviewResponse,
  TheoreticalResponse,
  QualityCheck,
  ResponseValidator
} from '../types/enhanced-response';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  suggestions?: string[];
}

// Main response validator
export const validateResponse: ResponseValidator = (response: any, mode: ResponseMode): ValidationResult => {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0,
    suggestions: []
  };

  try {
    // Basic structure validation
    if (!response || typeof response !== 'object') {
      result.errors.push('Response must be a valid object');
      result.isValid = false;
      result.score = 0;
      return result;
    }

    // Check required fields
    const requiredFields = ['version', 'responseId', 'responseType', 'answer'];
    for (const field of requiredFields) {
      if (!response[field]) {
        result.errors.push(`Missing required field: ${field}`);
        result.isValid = false;
      }
    }

    // Validate response type matches expected mode
    const expectedResponseType = getModeResponseType(mode);
    if (response.responseType !== expectedResponseType) {
      result.warnings.push(`Response type mismatch: expected ${expectedResponseType}, got ${response.responseType}`);
      result.score -= 0.1;
    }

    // Mode-specific validation
    const modeValidation = validateModeSpecificContent(response.answer, mode);
    result.errors.push(...modeValidation.errors);
    result.warnings.push(...modeValidation.warnings);
    result.score *= modeValidation.score;

    // Metadata validation
    if (response.meta) {
      const metaValidation = validateMetadata(response.meta);
      result.warnings.push(...metaValidation.warnings);
      result.score *= metaValidation.score;
    }

    // Final validation
    result.isValid = result.errors.length === 0;
    result.score = Math.max(0, Math.min(1, result.score));

    // Add suggestions based on issues found
    if (result.warnings.length > 0) {
      result.suggestions = generateSuggestions(result.warnings, mode);
    }

  } catch (error) {
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.isValid = false;
    result.score = 0;
  }

  return result;
};

// Get expected response type for mode
function getModeResponseType(mode: ResponseMode): string {
  switch (mode) {
    case ResponseMode.MCQ:
      return 'mcq';
    case ResponseMode.CODING:
      return 'coding';
    case ResponseMode.VERBAL_INTERVIEW:
    case ResponseMode.THEORETICAL:
      return 'theoretical';
    default:
      return 'theoretical';
  }
}

// Validate mode-specific content
function validateModeSpecificContent(content: any, mode: ResponseMode): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  if (!content) {
    result.errors.push('Missing answer content');
    result.isValid = false;
    result.score = 0;
    return result;
  }

  switch (mode) {
    case ResponseMode.MCQ:
      return validateMCQResponse(content);
    case ResponseMode.CODING:
      return validateCodingResponse(content);
    case ResponseMode.VERBAL_INTERVIEW:
      return validateVerbalInterviewResponse(content);
    case ResponseMode.THEORETICAL:
      return validateTheoreticalResponse(content);
    default:
      result.warnings.push('Unknown response mode');
      result.score = 0.8;
  }

  return result;
}

// MCQ response validation
function validateMCQResponse(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  // Required fields for MCQ
  const requiredFields = ['question', 'options', 'correctOptionId', 'justification'];
  for (const field of requiredFields) {
    if (!content[field]) {
      result.errors.push(`MCQ response missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Validate options structure
  if (content.options && Array.isArray(content.options)) {
    if (content.options.length < 2) {
      result.errors.push('MCQ must have at least 2 options');
      result.isValid = false;
    }

    // Check if correct option exists
    if (content.correctOptionId) {
      const hasCorrectOption = content.options.some((opt: any) => opt.id === content.correctOptionId);
      if (!hasCorrectOption) {
        result.errors.push('Correct option ID does not match any available options');
        result.isValid = false;
      }
    }
  } else if (content.options) {
    result.errors.push('Options must be an array');
    result.isValid = false;
  }

  // Check justification quality
  if (content.justification && content.justification.length < 10) {
    result.warnings.push('Justification seems too brief');
    result.score -= 0.1;
  }

  // Check for elimination strategies
  if (!content.eliminations || !Array.isArray(content.eliminations) || content.eliminations.length === 0) {
    result.warnings.push('Missing elimination strategies for incorrect options');
    result.score -= 0.1;
  }

  return result;
}

// Coding response validation
function validateCodingResponse(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  // Required fields for coding
  const requiredFields = ['solutionOverview', 'code', 'timeComplexity', 'spaceComplexity'];
  for (const field of requiredFields) {
    if (!content[field]) {
      result.errors.push(`Coding response missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Validate code structure
  if (content.code) {
    if (!content.code.main) {
      result.errors.push('Code response must include main code implementation');
      result.isValid = false;
    } else if (content.code.main.length < 20) {
      result.warnings.push('Code implementation seems too brief');
      result.score -= 0.1;
    }

    if (!content.code.language) {
      result.warnings.push('Programming language not specified');
      result.score -= 0.05;
    }
  }

  // Validate complexity analysis
  if (content.timeComplexity && !content.timeComplexity.includes('O(')) {
    result.warnings.push('Time complexity should use Big O notation');
    result.score -= 0.1;
  }

  if (content.spaceComplexity && !content.spaceComplexity.includes('O(')) {
    result.warnings.push('Space complexity should use Big O notation');
    result.score -= 0.1;
  }

  // Check for test cases
  if (!content.tests || !Array.isArray(content.tests) || content.tests.length === 0) {
    result.warnings.push('Missing test cases for code solution');
    result.score -= 0.1;
  }

  return result;
}

// Verbal interview response validation
function validateVerbalInterviewResponse(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  // Required fields for interview response
  const requiredFields = ['summary', 'detailed'];
  for (const field of requiredFields) {
    if (!content[field]) {
      result.errors.push(`Interview response missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Check for first-person perspective
  if (content.detailed) {
    const text = content.detailed.toLowerCase();
    const firstPersonIndicators = ['i ', 'my ', 'me ', 'myself', 'i\'ve', 'i\'m', 'i\'ll'];
    const hasFirstPerson = firstPersonIndicators.some(indicator => text.includes(indicator));
    
    if (!hasFirstPerson) {
      result.errors.push('Interview response must be in first person perspective');
      result.isValid = false;
    }
  }

  // Check response length
  if (content.detailed && content.detailed.length < 50) {
    result.warnings.push('Interview response seems too brief');
    result.score -= 0.1;
  }

  // Check for key points
  if (!content.keyPoints || !Array.isArray(content.keyPoints) || content.keyPoints.length === 0) {
    result.warnings.push('Missing key points for interview response');
    result.score -= 0.1;
  }

  return result;
}

// Theoretical response validation
function validateTheoreticalResponse(content: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  // Required fields for theoretical response
  const requiredFields = ['summary', 'detailed', 'keyPoints'];
  for (const field of requiredFields) {
    if (!content[field]) {
      result.errors.push(`Theoretical response missing required field: ${field}`);
      result.isValid = false;
    }
  }

  // Check explanation quality
  if (content.detailed && content.detailed.length < 100) {
    result.warnings.push('Theoretical explanation seems too brief');
    result.score -= 0.1;
  }

  // Check for key points
  if (content.keyPoints && Array.isArray(content.keyPoints)) {
    if (content.keyPoints.length === 0) {
      result.warnings.push('Missing key points in theoretical response');
      result.score -= 0.1;
    }
  }

  // Check for pitfalls
  if (!content.pitfalls || !Array.isArray(content.pitfalls) || content.pitfalls.length === 0) {
    result.warnings.push('Missing common pitfalls or mistakes');
    result.score -= 0.05;
  }

  return result;
}

// Validate metadata
function validateMetadata(meta: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  if (meta.confidence !== undefined) {
    if (typeof meta.confidence !== 'number' || meta.confidence < 0 || meta.confidence > 1) {
      result.warnings.push('Confidence should be a number between 0 and 1');
      result.score -= 0.05;
    }
  }

  if (meta.difficulty !== undefined) {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(meta.difficulty)) {
      result.warnings.push('Difficulty should be easy, medium, or hard');
      result.score -= 0.05;
    }
  }

  return result;
}

// Generate suggestions based on warnings
function generateSuggestions(warnings: string[], mode: ResponseMode): string[] {
  const suggestions: string[] = [];

  warnings.forEach(warning => {
    if (warning.includes('too brief')) {
      suggestions.push('Consider providing more detailed explanations');
    }
    if (warning.includes('missing')) {
      suggestions.push('Include all required fields for better response quality');
    }
    if (warning.includes('first person')) {
      suggestions.push('Use "I" statements for interview responses');
    }
    if (warning.includes('Big O')) {
      suggestions.push('Use proper Big O notation for complexity analysis');
    }
  });

  return [...new Set(suggestions)]; // Remove duplicates
}

// Quality check runner
export function runQualityChecks(response: any, checks: QualityCheck[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 1.0
  };

  checks.forEach(check => {
    try {
      const passed = check.validator(response);
      if (!passed) {
        if (check.severity === 'error') {
          result.errors.push(check.errorMessage);
          result.isValid = false;
        } else {
          result.warnings.push(check.errorMessage);
          result.score -= 0.1;
        }
      }
    } catch (error) {
      result.warnings.push(`Quality check "${check.name}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.score -= 0.05;
    }
  });

  result.score = Math.max(0, Math.min(1, result.score));
  return result;
}