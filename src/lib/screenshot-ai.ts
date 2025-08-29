// Enhanced screenshot AI integration with content analysis and classification
// Listens for screenshot events and uses intelligent classification to determine
// the appropriate response mode and generate context-aware prompts

import { streamCompletion } from "./api";
import { contentAnalyzer } from "./content-analyzer";
import { questionClassifier } from "./question-classifier";
import { modeManager } from "./mode-manager";
import { ResponseMode } from "../types/enhanced-response";
import { mcqGenerator } from "./response-generators/mcq-generator";
import { codingGenerator } from "./response-generators/coding-generator";
import { interviewGenerator } from "./response-generators/interview-generator";
import { theoreticalGenerator } from "./response-generators/theoretical-generator";
import { enhancedResponseProcessor } from "./enhanced-response-processor";

// Enhanced prompt building with mode-specific generators
async function buildEnhancedPrompt(
  mode: ResponseMode, 
  extractedText: string, 
  classificationResult: any
): Promise<string> {
  try {
    switch (mode) {
      case ResponseMode.MCQ:
        return await mcqGenerator.generatePrompt({
          question: extractedText,
          options: classificationResult.analysis?.detectedOptions || [],
          subject: classificationResult.analysis?.subject,
          difficulty: classificationResult.analysis?.difficulty
        });
      
      case ResponseMode.CODING:
        return await codingGenerator.generatePrompt({
          question: extractedText,
          language: classificationResult.analysis?.programmingLanguage,
          difficulty: classificationResult.analysis?.difficulty,
          includeTests: true,
          includeComplexity: true
        });
      
      case ResponseMode.VERBAL_INTERVIEW:
        return await interviewGenerator.generatePrompt({
          question: extractedText,
          interviewType: classificationResult.analysis?.interviewType || 'behavioral',
          experienceLevel: classificationResult.analysis?.experienceLevel || 'mid',
          includeFollowUps: true
        });
      
      case ResponseMode.THEORETICAL:
        return await theoreticalGenerator.generatePrompt({
          question: extractedText,
          subject: classificationResult.analysis?.subject,
          academicLevel: classificationResult.analysis?.academicLevel || 'intermediate',
          depth: 'detailed'
        });
      
      default:
        return buildFallbackPrompt(extractedText);
    }
  } catch (error) {
    console.error('Error building enhanced prompt:', error);
    return buildFallbackPrompt(extractedText);
  }
}

// Fallback prompt for when enhanced generation fails
function buildFallbackPrompt(text: string): string {
  return `Analyze the following content and provide a comprehensive, helpful response:

${text}

Please provide a clear, well-structured answer that addresses the question or topic presented.`;
}

// Legacy prompt building for backward compatibility
function buildLegacyPrompt(kind: "mcq" | "code" | "theory") {
  switch (kind) {
    case "mcq":
      return "You are an expert test solver. Analyze the screenshot (image) which contains a multiple-choice question. Identify the correct option and provide a concise rationale. Answer format: 'Answer: <option letter> - <short explanation>'.";
    case "code":
      return "You are a senior software engineer. The screenshot (image) shows a programming/coding question or code snippet. Provide the required solution or corrected code with brief explanation.";
    case "theory":
    default:
      return "Analyze the screenshot (image) containing a theoretical question or text. Provide a clear, concise answer or summary.";
  }
}

// Enhanced screenshot processing with intelligent classification
export async function requestAnswerFromScreenshot(base64Png: string, opts: {
  provider: any; 
  model: string; 
  apiKey: string; 
  onChunk: (c: string) => void; 
  onError: (e: string) => void;
  onClassification?: (result: any) => void;
  useEnhancedMode?: boolean;
}) {
  const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[DEBUG-${requestId}] Enhanced requestAnswerFromScreenshot called`);
  console.log(`[DEBUG-${requestId}] Provider: ${opts.provider.id}, Model: ${opts.model}`);
  console.log(`[DEBUG-${requestId}] Base64 data length: ${base64Png.length}`);
  console.log(`[DEBUG-${requestId}] Enhanced mode: ${opts.useEnhancedMode !== false}`);

  const abort = new AbortController();

  try {
    let system: string;
    let selectedMode: ResponseMode;
    let classificationResult: any = null;

    // Use enhanced classification if enabled (default)
    if (opts.useEnhancedMode !== false) {
      console.log(`[DEBUG-${requestId}] Starting enhanced content analysis...`);
      
      // Step 1: Extract text from screenshot using content analyzer
      const contentAnalysis = await contentAnalyzer.analyzeScreenshot(base64Png);
      console.log(`[DEBUG-${requestId}] Content analysis completed:`, {
        hasText: !!contentAnalysis.extractedText,
        textLength: contentAnalysis.extractedText?.length || 0,
        confidence: contentAnalysis.confidence
      });

      // Step 2: Classify the content to determine appropriate mode
      if (contentAnalysis.extractedText) {
        classificationResult = await questionClassifier.classifyQuestion(contentAnalysis.extractedText);
        console.log(`[DEBUG-${requestId}] Classification result:`, {
          recommendedMode: classificationResult.recommendedMode,
          confidence: classificationResult.confidence,
          reasoning: classificationResult.reasoning
        });

        // Notify UI about classification result
        if (opts.onClassification) {
          opts.onClassification(classificationResult);
        }

        // Check if user has overridden the mode
        const currentMode = modeManager.getCurrentMode();
        const isManualOverride = modeManager.getModeState().source === 'manual';
        
        if (isManualOverride) {
          selectedMode = currentMode;
          console.log(`[DEBUG-${requestId}] Using manual mode override: ${selectedMode}`);
        } else {
          // Use classified mode or set temporary mode
          selectedMode = classificationResult.recommendedMode;
          if (selectedMode !== currentMode) {
            modeManager.setTemporaryMode(selectedMode, 'auto', 300000); // 5 minutes
            console.log(`[DEBUG-${requestId}] Set temporary mode: ${selectedMode}`);
          }
        }

        // Step 3: Generate enhanced prompt based on selected mode
        system = await buildEnhancedPrompt(selectedMode, contentAnalysis.extractedText, classificationResult);
        console.log(`[DEBUG-${requestId}] Enhanced prompt generated for mode: ${selectedMode}`);
      } else {
        // Fallback if no text extracted
        console.log(`[DEBUG-${requestId}] No text extracted, using fallback mode`);
        selectedMode = modeManager.getCurrentMode();
        system = buildFallbackPrompt("Please analyze this image and provide a helpful response.");
      }
    } else {
      // Legacy mode for backward compatibility
      console.log(`[DEBUG-${requestId}] Using legacy classification mode`);
      const kind: "mcq" | "code" | "theory" = "theory";
      system = buildLegacyPrompt(kind);
      selectedMode = ResponseMode.THEORETICAL;
    }

    console.log(`[DEBUG-${requestId}] Final mode: ${selectedMode}`);
    console.log(`[DEBUG-${requestId}] System prompt length: ${system.length}`);

    // Build provider-specific message payload
    const messages = await buildProviderMessages(opts.provider.id, system, base64Png, classificationResult);
    console.log(`[DEBUG-${requestId}] Provider messages built for: ${opts.provider.id}`);

    // Stream the completion
    await streamCompletion(
      opts.provider, 
      opts.model, 
      opts.apiKey, 
      messages, 
      opts.onChunk, 
      opts.onError, 
      abort
    );
    
    console.log(`[DEBUG-${requestId}] Stream completion finished successfully`);
    
  } catch (error) {
    console.error(`[DEBUG-${requestId}] Error in enhanced screenshot processing:`, error);
    opts.onError(`Failed to process screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return abort;
}

// Build provider-specific message payloads
async function buildProviderMessages(providerId: string, system: string, base64Png: string, classificationResult: any) {
  const provId = providerId.toLowerCase();
  
  if (provId === 'claude') {
    return {
      messages: [
        { role: 'system', content: system },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Please analyze this screenshot and provide a response based on the system instructions.' },
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Png } }
          ] 
        }
      ]
    };
  } else if (provId === 'gemini') {
    return {
      contents: [
        {
          role: 'user',
          parts: [
            { text: system + '\n\nPlease analyze this screenshot and provide a response based on the instructions above.' },
            { inline_data: { mime_type: 'image/png', data: base64Png } }
          ]
        }
      ]
    };
  } else {
    // OpenAI / Grok style
    return {
      messages: [
        { role: 'system', content: system },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Please analyze this screenshot and provide a response based on the system instructions.' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Png}` } }
          ] 
        }
      ]
    };
  }
}

// Enhanced screenshot event handling with classification feedback
let screenshotListenerInitialized = false;
let currentCleanup: (() => void) | null = null;

export interface ScreenshotCallbacks {
  onScreenshot: (b64: string) => void;
  onClassification?: (result: any) => void;
  onModeChange?: (mode: ResponseMode) => void;
  onError?: (error: string) => void;
}

export function initScreenshotAI(callbacks: ScreenshotCallbacks | ((b64: string) => void)) {
  const initId = `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[DEBUG-${initId}] Enhanced initScreenshotAI called`);

  // Handle backward compatibility
  const callbacksObj: ScreenshotCallbacks = typeof callbacks === 'function' 
    ? { onScreenshot: callbacks }
    : callbacks;

  // If already initialized, clean up the previous listener first
  if (screenshotListenerInitialized && currentCleanup) {
    console.log(`[DEBUG-${initId}] Cleaning up previous listener`);
    currentCleanup();
  }

  const handler = async (e: any) => {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[DEBUG-${handlerId}] Enhanced screenshot event handler triggered`);
    
    const b64 = e.detail?.base64;
    console.log(`[DEBUG-${handlerId}] Event detail base64 length:`, b64?.length || 'undefined');

    if (b64) {
      try {
        console.log(`[DEBUG-${handlerId}] Processing screenshot with enhanced analysis`);
        
        // Trigger the main screenshot callback
        callbacksObj.onScreenshot(b64);
        
        // Optionally perform immediate classification for UI feedback
        if (callbacksObj.onClassification) {
          try {
            const contentAnalysis = await contentAnalyzer.analyzeScreenshot(b64);
            if (contentAnalysis.extractedText) {
              const classificationResult = await questionClassifier.classifyQuestion(contentAnalysis.extractedText);
              callbacksObj.onClassification(classificationResult);
              
              // Notify about potential mode change
              if (callbacksObj.onModeChange) {
                const currentMode = modeManager.getCurrentMode();
                if (classificationResult.recommendedMode !== currentMode) {
                  callbacksObj.onModeChange(classificationResult.recommendedMode);
                }
              }
            }
          } catch (classificationError) {
            console.error(`[DEBUG-${handlerId}] Classification error:`, classificationError);
            if (callbacksObj.onError) {
              callbacksObj.onError(`Classification failed: ${classificationError instanceof Error ? classificationError.message : 'Unknown error'}`);
            }
          }
        }
        
      } catch (error) {
        console.error(`[DEBUG-${handlerId}] Error processing screenshot:`, error);
        if (callbacksObj.onError) {
          callbacksObj.onError(`Screenshot processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } else {
      console.log(`[DEBUG-${handlerId}] No base64 data in event, ignoring`);
    }
  };

  console.log(`[DEBUG-${initId}] Adding enhanced event listener for 'pluely-screenshot'`);
  window.addEventListener("pluely-screenshot", handler);
  screenshotListenerInitialized = true;

  // Store the cleanup function
  currentCleanup = () => {
    console.log(`[DEBUG-${initId}] Enhanced cleanup function called - removing event listener`);
    window.removeEventListener("pluely-screenshot", handler);
    screenshotListenerInitialized = false;
    currentCleanup = null;
  };

  // Return cleanup function
  return currentCleanup;
}

// Utility functions for enhanced screenshot processing
export function getClassificationStatus(): {
  isInitialized: boolean;
  currentMode: ResponseMode;
  isTemporary: boolean;
  timeRemaining: number;
} {
  return {
    isInitialized: screenshotListenerInitialized,
    currentMode: modeManager.getCurrentMode(),
    isTemporary: modeManager.isTemporaryMode(),
    timeRemaining: modeManager.getTemporaryModeTimeRemaining()
  };
}

export function forceMode(mode: ResponseMode, source: 'manual' | 'hotkey' = 'manual'): void {
  modeManager.setMode(mode, source);
  console.log(`[DEBUG] Forced mode change to: ${mode} (source: ${source})`);
}

export function resetToAutoMode(): void {
  modeManager.clearTemporaryMode();
  console.log(`[DEBUG] Reset to auto mode`);
}

// Legacy support
export function initScreenshotAILegacy(callback: (b64: string) => void) {
  return initScreenshotAI({ onScreenshot: callback });
}
