// Screenshot AI integration utilities.
// Listens for screenshot events (dispatched from App.tsx) and generates
// a context-aware prompt before invoking existing completion streaming.

import { streamCompletion } from "./api";

// Build prompt template
function buildPrompt(kind: "mcq" | "code" | "theory") {
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

// Public entry called by UI component after optional OCR.
export async function requestAnswerFromScreenshot(base64Png: string, opts: {
  provider: any; model: string; apiKey: string; onChunk: (c: string)=>void; onError: (e:string)=>void;
}) {
  const requestId = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[DEBUG-${requestId}] requestAnswerFromScreenshot called with provider:`, opts.provider.id, "model:", opts.model);
  console.log(`[DEBUG-${requestId}] Base64 data length:`, base64Png.length);

  // Minimal placeholder: we do not have OCR yet, so rely on model vision.
  const kind: "mcq" | "code" | "theory" = "theory"; // default until OCR added
  const system = buildPrompt(kind);
  console.log(`[DEBUG-${requestId}] Generated system prompt:`, system.substring(0, 100) + "...");

  const abort = new AbortController();

  // Build provider specific message payload shape.
  let messages: any[] = [];
  let contents: any[] | undefined = undefined; // gemini
  const provId = opts.provider.id;

  console.log(`[DEBUG-${requestId}] Building payload for provider:`, provId);

  if (provId === 'claude') {
    messages = [
      { role: 'system', content: system },
      { role: 'user', content: [
        { type: 'text', text: 'Please answer based on this screenshot.' },
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: base64Png } }
      ] }
    ];
  } else if (provId === 'gemini') {
    contents = [
      {
        role: 'user',
        parts: [
          { text: system + '\n\nPlease answer based on this screenshot.' },
          { inline_data: { mime_type: 'image/png', data: base64Png } }
        ]
      }
    ];
  } else {
    // OpenAI / Grok style
    messages = [
      { role: 'system', content: system },
      { role: 'user', content: [
        { type: 'text', text: 'Please answer based on this screenshot.' },
        { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Png}` } }
      ] }
    ];
  }

  const payload = contents ? { contents } : { messages };
  console.log(`[DEBUG-${requestId}] Payload built, about to call streamCompletion...`);

  await streamCompletion(opts.provider, opts.model, opts.apiKey, payload, opts.onChunk, opts.onError, abort);
  console.log(`[DEBUG-${requestId}] streamCompletion completed`);
  return abort;
}

// Hook UI registration
let screenshotListenerInitialized = false;
let currentCleanup: (() => void) | null = null;

export function initScreenshotAI(callback: (b64: string)=>void) {
  const initId = `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[DEBUG-${initId}] initScreenshotAI called`);

  // If already initialized, clean up the previous listener first
  if (screenshotListenerInitialized && currentCleanup) {
    console.log(`[DEBUG-${initId}] Cleaning up previous listener`);
    currentCleanup();
  }

  const handler = (e: any) => {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[DEBUG-${handlerId}] Screenshot event handler triggered`);
    const b64 = e.detail?.base64;
    console.log(`[DEBUG-${handlerId}] Event detail base64 length:`, b64?.length || 'undefined');

    if (b64) {
      console.log(`[DEBUG-${handlerId}] Calling callback with base64 length:`, b64.length);
      callback(b64);
    } else {
      console.log(`[DEBUG-${handlerId}] No base64 data in event, ignoring`);
    }
  };

  console.log(`[DEBUG-${initId}] Adding event listener for 'pluely-screenshot'`);
  window.addEventListener("pluely-screenshot", handler);
  screenshotListenerInitialized = true;

  // Store the cleanup function
  currentCleanup = () => {
    console.log(`[DEBUG-${initId}] Cleanup function called - removing event listener`);
    window.removeEventListener("pluely-screenshot", handler);
    screenshotListenerInitialized = false;
    currentCleanup = null;
  };

  // Return cleanup function
  return currentCleanup;
}
