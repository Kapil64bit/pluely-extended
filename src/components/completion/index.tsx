import {
  MicIcon,
  PaperclipIcon,
  Loader2,
  XIcon,
  CopyIcon,
  MessageCircle,
  X,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
  Input,
} from "@/components";
import { useCompletion } from "@/hooks";
import { useRef, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlightCode } from "@/lib/highlight";
import { Speech } from "./Speech";
import { MessageHistory } from "../history";
import { initScreenshotAI, requestAnswerFromScreenshot } from "@/lib/screenshot-ai";
import { invoke } from "@tauri-apps/api/core";

// Session-level set of processed screenshot signatures to suppress duplicate events
const processedScreenshotSigs = new Set<string>();
// Global flag to prevent concurrent screenshot processing
let isProcessingScreenshot = false;

export const Completion = () => {
  const {
    input,
    setInput,
    response,
    isLoading,
    error,
    attachedFiles,
    addFile,
    // removeFile,
    // clearFiles,
  submit,
  cancel,
    isOpenAIKeyAvailable,
    enableVAD,
    setEnableVAD,
    setState,
    micOpen,
    setMicOpen,
    currentConversationId,
    conversationHistory,
    startNewConversation,
    // saveCurrentConversation, // Temporarily disabled for testing
  } = useCompletion();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [isStealthMode, setIsStealthMode] = useState(false);

  const pushToast = (message: string) => {
    const id = Date.now().toString();
    setToasts((s) => [...s, { id, message }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), 1800);
  };

  const toggleStealthMode = async () => {
    try {
      if (isStealthMode) {
        await invoke('show_window');
        setIsStealthMode(false);
        pushToast('Window visible');
      } else {
        await invoke('hide_window');
        setIsStealthMode(true);
        pushToast('Window hidden (stealth mode)');
      }
    } catch (error) {
      console.error('Failed to toggle stealth mode:', error);
      pushToast('Failed to toggle stealth mode');
    }
  };

  // CodeBlock component handles async shiki highlighting and shows per-block copy button
  const CodeBlock = ({ codeText, lang }: { codeText: string; lang: string }) => {
    const [html, setHtml] = useState<string | null>(null);

    useEffect(() => {
      let mounted = true;
      (async () => {
        try {
          const highlighted = await highlightCode(codeText, lang || 'plaintext');
          if (mounted) setHtml(highlighted);
        } catch (e) {
          if (mounted) setHtml(null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [codeText, lang]);

    return (
      <div className="relative my-2">
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="rounded-md overflow-auto bg-slate-900/90 text-slate-100 p-4 font-mono text-sm">
            <code>{codeText}</code>
          </pre>
        )}

  {/* code-level copy button removed to reduce clutter; message-level copy remains */}
      </div>
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        addFile(file);
      }
    });
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        submit();
      }
    }
  };

  // Keep panel open while there is an active conversation (multi-turn)
  const hasConversation =
    (currentConversationId && conversationHistory.length > 0) ||
    isLoading ||
    response !== "" ||
    error !== null;
  const isPopoverOpen = hasConversation; // controlled open

  // Initialize screenshot listener
  useEffect(() => {
    const useEffectId = `useEffect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[DEBUG-${useEffectId}] useEffect for screenshot listener initialized`);

    const cleanup = initScreenshotAI(async (b64) => {
      const callbackId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[DEBUG-${callbackId}] Screenshot callback triggered, base64 length:`, b64.length);
      console.log(`[DEBUG-${callbackId}] Current isProcessingScreenshot flag:`, isProcessingScreenshot);
      console.log(`[DEBUG-${callbackId}] Current processedScreenshotSigs size:`, processedScreenshotSigs.size);

      // Check global processing flag first
      if (isProcessingScreenshot) {
        console.log(`[DEBUG-${callbackId}] Screenshot ignored: another screenshot is already being processed`);
        return;
      }

      // Create a robust signature using hash of first 100 chars + total length + timestamp window
      const now = Date.now();
      const prefix = b64.slice(0, 100);
      const sig = `${btoa(prefix).slice(0, 20)}::${b64.length}::${Math.floor(now / 5000)}`; // 5-second windows

      console.log(`[DEBUG-${callbackId}] Generated signature:`, sig);
      console.log(`[DEBUG-${callbackId}] Checking if signature exists in set:`, processedScreenshotSigs.has(sig));

      if (processedScreenshotSigs.has(sig)) {
        console.log(`[DEBUG-${callbackId}] Duplicate screenshot event suppressed (signature already processed):`, sig);
        return;
      }

      // Also check localStorage as backup
      const lsKey = `screenshot_processed_${sig}`;
      const lsValue = localStorage.getItem(lsKey);
      console.log(`[DEBUG-${callbackId}] localStorage check for key:`, lsKey, "value:", lsValue);

      if (lsValue) {
        console.log(`[DEBUG-${callbackId}] Duplicate screenshot event suppressed (localStorage):`, sig);
        return;
      }

      // Set processing flag
      console.log(`[DEBUG-${callbackId}] Setting isProcessingScreenshot to true`);
      isProcessingScreenshot = true;
      processedScreenshotSigs.add(sig);
      localStorage.setItem(lsKey, '1');

      console.log(`[DEBUG-${callbackId}] Added signature to set, new size:`, processedScreenshotSigs.size);
      console.log(`[DEBUG-${callbackId}] Processing new screenshot, base64 length:`, b64.length);
      // Pull unified settings blob
      const settingsRaw = localStorage.getItem("settings");
      let settings: any = {};
      try { if (settingsRaw) settings = JSON.parse(settingsRaw); } catch {}
      const { selectedProvider, apiKey, selectedModel, customModel, isApiKeySubmitted } = settings;
      console.log("[completion] Settings loaded:", { selectedProvider, hasApiKey: !!apiKey, selectedModel, customModel, isApiKeySubmitted });

      if (!selectedProvider) { pushToast("Select provider first"); return; }
      if (!apiKey || !isApiKeySubmitted) { pushToast("API key missing for screenshot"); return; }
      // Resolve provider config
      const { providers } = await import("@/config");
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) { pushToast("Provider config missing"); return; }
      const model = (selectedModel || customModel || provider.defaultModel || "").replace(/^models\//, "");
      if (!model) { pushToast("Model not set"); return; }

      console.log("[completion] Processing screenshot and requesting AI answer...");
      // Don't start new conversation - continue existing or create conversation ID if needed
      if (!currentConversationId) {
        // Create a new conversation ID if we don't have one
        const newConversationId = `conv_${Date.now()}`;
        setState((s: any) => ({ ...s, currentConversationId: newConversationId }));
      }
      setInput("");

      // Add screenshot as user message to conversation history
      const timestamp = Date.now();
      const screenshotMsg: any = {
        id: `msg_${timestamp}_user`,
        role: "user",
        content: "📸 Screenshot analysis requested",
        timestamp,
      };

      // Add temporary assistant message for streaming
      const assistantTempId = `msg_${timestamp}_assistant_temp`;
      const tempAssistantMsg: any = {
        id: assistantTempId,
        role: "assistant",
        content: "",
        timestamp: timestamp + 1,
      };

      setState((s: any) => ({
        ...s,
        conversationHistory: [...s.conversationHistory, screenshotMsg, tempAssistantMsg],
        isLoading: true,
        error: null,
      }));

      // Basic streaming into conversation by appending to response state via hook's mechanisms
      let aggregated = "";
      await requestAnswerFromScreenshot(b64, {
        provider,
        model,
        apiKey,
        onChunk: (c) => {
          console.log("[completion] Received chunk:", c);
          aggregated += c;
          console.log("[completion] Current aggregated length:", aggregated.length);
          setState((s: any) => ({
            ...s,
            conversationHistory: s.conversationHistory.map((m: any) =>
              m.id === assistantTempId ? { ...m, content: aggregated } : m
            ),
          }));
        },
        onError: (e) => {
          console.error("[completion] Screenshot AI error:", e);
          setState((s: any) => ({
            ...s,
            error: e,
            isLoading: false,
            conversationHistory: s.conversationHistory.map((m: any) =>
              m.id === assistantTempId ? { ...m, content: `Error: ${e}` } : m
            ),
          }));
          pushToast(e);
          // Reset processing flag on error
          isProcessingScreenshot = false;
        },
      });

      // Mark as completed & persist using freshest state (avoid closure staleness & double saves)
      setState((s: any) => {
        const finalAssistant = s.conversationHistory.find((m: any) => m.id === assistantTempId);
        if (finalAssistant && finalAssistant.content) {
          // Save only if last user message with same content not already paired with an assistant answer
          const existingPair = s.conversationHistory.some((m: any) => m.role === 'assistant' && m.content === finalAssistant.content && m.timestamp === finalAssistant.timestamp);
          if (!existingPair) {
            // Defer save outside synchronous state mutation
            setTimeout(() => {
              console.log(`[DEBUG-${callbackId}] Skipping screenshot save for testing purposes`);
              // Temporarily disabled for testing screenshot capture
              // saveCurrentConversation(
              //   screenshotMsg.content,
              //   finalAssistant.content,
              //   [],
              //   undefined
              // );
            }, 0);
          }
        }
        return { ...s, isLoading: false };
      });

      console.log("[completion] Screenshot AI request completed, final response length:", aggregated.length);
      
      // Reset processing flag
      isProcessingScreenshot = false;
      
      // Periodic cleanup of old signatures (keep memory usage low)
      if (processedScreenshotSigs.size > 100) {
        // Clear all signatures older than 10 minutes
        const tenMinAgo = Date.now() - 600000;
        const toRemove: string[] = [];
        processedScreenshotSigs.forEach(sig => {
          try {
            const timestamp = parseInt(sig.split('::').pop() || '0') * 5000;
            if (timestamp < tenMinAgo) {
              toRemove.push(sig);
            }
          } catch (e) {
            toRemove.push(sig);
          }
        });
        toRemove.forEach(sig => processedScreenshotSigs.delete(sig));
      }
    });

    // Cleanup function
    return cleanup;
  }, []);

  return (
    <>
      {/* Toasts */}
      <div className="pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded shadow">
            {t.message}
          </div>
        ))}
      </div>
      <Popover open={micOpen} onOpenChange={setMicOpen}>
        <PopoverTrigger asChild>
          {isOpenAIKeyAvailable() && enableVAD ? (
            <Speech
              submit={submit}
              setState={setState}
              setEnableVAD={setEnableVAD}
            />
          ) : (
            <Button
              size="icon"
              onClick={() => {
                setEnableVAD(!enableVAD);
              }}
              className="cursor-pointer"
              aria-label="Toggle voice input"
            >
              <MicIcon className="h-4 w-4" />
            </Button>
          )}
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="center"
          className={`w-80 p-3 ${isOpenAIKeyAvailable() ? "hidden" : ""}`}
          sideOffset={8}
        >
          <div className="text-sm">
            <div className="font-semibold text-orange-600 mb-1">
              OpenAI Key Required
            </div>
            <p className="text-muted-foreground">
              Speech-to-text requires an OpenAI API key for Whisper. Please
              configure it in settings to enable voice input.
            </p>
          </div>
        </PopoverContent>
      </Popover>

      <div className="relative flex-1">
  <Popover open={isPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative select-none">
              <Input
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={`${
                  currentConversationId && conversationHistory.length > 0
                    ? "pr-24"
                    : "pr-12"
                }`}
              />

              {/* Conversation thread indicator */}
              {currentConversationId &&
                conversationHistory.length > 0 &&
                !isLoading && (
                  <div className="absolute select-none right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div
                        className="cursor-pointer flex items-center gap-1 rounded-xl px-2 py-1 transition-colors bg-muted/50 border border-primary/20 hover:border-primary/60"
                        onClick={startNewConversation}
                      >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm text-primary font-medium">
                        {conversationHistory.length}
                      </span>
                      <X className="h-3 w-3" />
                    </div>
                  </div>
                )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </PopoverTrigger>

          {/* Response Panel */}
          <PopoverContent
            align="center"
            side="bottom"
            className="w-screen p-0 border shadow-lg overflow-hidden"
            sideOffset={8}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/20 backdrop-blur-sm">
              <h3 className="font-semibold text-sm">Conversation</h3>
              <div className="flex items-center gap-2">
                <MessageHistory
                  conversationHistory={conversationHistory}
                  currentConversationId={currentConversationId}
                  onStartNewConversation={startNewConversation}
                />
                {/* Stealth Mode Toggle */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleStealthMode}
                  className="cursor-pointer"
                  aria-label={isStealthMode ? "Exit stealth mode" : "Enter stealth mode"}
                >
                  {isStealthMode ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </Button>
                {/* header-level copy removed; per-message copy buttons added below */}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (isLoading) {
                      cancel();
                    } else {
                      // user expects clicking this X to close the conversation
                      startNewConversation();
                    }
                  }}
                  className="cursor-pointer"
                  aria-label={isLoading ? "Cancel loading" : "Close conversation"}
                >
                  <XIcon />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                    <strong>Error:</strong> {error}
                  </div>
                )}
                {/* Render full conversation thread */}
                {conversationHistory.map((msg) => {
                  let structured = msg.structured;
                  const isAssistant = msg.role === 'assistant';
                  // Lazy retroactive parse: handle old messages saved before structured parsing existed
                  if (!structured && isAssistant && msg.content && msg.content.trim().startsWith('{')) {
                    try {
                      const trimmed = msg.content.trim();
                      // attempt to isolate JSON if extra prose wraps it
                      let candidate = trimmed;
                      if (!(candidate.endsWith('}'))) {
                        const first = candidate.indexOf('{');
                        const last = candidate.lastIndexOf('}');
                        if (first !== -1 && last !== -1 && last > first) {
                          candidate = candidate.substring(first, last + 1);
                        }
                      }
                      const parsed = JSON.parse(candidate);
                      // dynamic import avoided; reuse runtime normalize via optional global (attached earlier in hook)
                      // To avoid circular import at component top, inline lightweight guard
                      if (parsed && typeof parsed === 'object' && parsed.responseType && ['coding','theoretical','mcq'].includes(parsed.responseType) && parsed.answer) {
                        // minimal normalization (mirrors normalizeStructured interviewTone coercion)
                        structured = {
                          version: parsed.version || '1.0',
                          responseId: parsed.responseId || `resp_${Date.now()}`,
                          responseType: parsed.responseType,
                          questionEcho: parsed.questionEcho || '',
                          interviewTone: typeof parsed.interviewTone === 'boolean' ? parsed.interviewTone : true,
                          meta: parsed.meta || { confidence: 0.5, difficulty: 'medium', tags: [] },
                          answer: parsed.answer,
                          followUps: parsed.followUps || []
                        } as any;
                      }
                    } catch { /* ignore */ }
                  }
                  return (
                    <div
                      key={msg.id}
                      className={`relative mb-4 last:mb-0 p-3 rounded-lg border break-words whitespace-pre-wrap [&_*]:break-words [&_*]:whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-primary/10 backdrop-blur-sm border-primary/20"
                          : "bg-muted/30 backdrop-blur-sm border-input/40"
                      }`}
                    >
                      {/* per-message copy button (raw content or reconstructed JSON) */}
                      <div className="absolute right-2 top-2 flex gap-1">
                        {structured && structured.responseType === 'coding' && isAssistant && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const code = (structured.answer as any).code?.main || '';
                              if (code) {
                                navigator.clipboard.writeText(code);
                                pushToast('Code copied');
                              }
                            }}
                            className="cursor-pointer"
                            aria-label="Copy code only"
                          >
                            <CopyIcon />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content || "");
                            pushToast("Copied");
                          }}
                          disabled={!msg.content || msg.content.trim() === ""}
                          className="cursor-pointer"
                          aria-label="Copy message"
                        >
                          <CopyIcon />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase">
                          {msg.role === "user" ? "You" : "AI"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {structured && isAssistant ? (
                        <div className="space-y-3">
                          {/* Header / Summary */}
                          {structured.responseType === 'theoretical' && (
                            <div className="space-y-2">
                              <p className="font-medium">{(structured.answer as any).summary}</p>
                              <p>{(structured.answer as any).detailed}</p>
                              {(structured.answer as any).keyPoints?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase opacity-70 mb-1">Key Points</h4>
                                  <ul className="list-disc pl-5 text-sm space-y-0.5">
                                    {(structured.answer as any).keyPoints.map((kp: string, i: number) => (
                                      <li key={i}>{kp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(structured.answer as any).pitfalls?.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-semibold uppercase opacity-70 mb-1">Pitfalls</h4>
                                  <ul className="list-disc pl-5 text-sm space-y-0.5">
                                    {(structured.answer as any).pitfalls.map((p: string, i: number) => (
                                      <li key={i}>{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}

                          {structured.responseType === 'coding' && (() => {
                            const ans: any = structured.answer;
                            const tests = ans.tests || [];
                            return (
                              <div className="space-y-4">
                                <div>
                                  <p className="font-medium">{ans.solutionOverview}</p>
                                  <ul className="list-decimal pl-5 text-sm mt-2 space-y-0.5">
                                    {ans.approachSteps?.map((s: string, i: number) => (
                                      <li key={i}>{s}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[10px]">
                                  <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20">Time: {ans.timeComplexity}</span>
                                  <span className="px-2 py-1 rounded bg-primary/10 border border-primary/20">Space: {ans.spaceComplexity}</span>
                                  {structured.meta?.difficulty && <span className="px-2 py-1 rounded bg-muted/40 border border-input/30">Diff: {structured.meta.difficulty}</span>}
                                  {typeof structured.meta?.confidence === 'number' && <span className="px-2 py-1 rounded bg-muted/40 border border-input/30">Conf: {(structured.meta.confidence*100).toFixed(0)}%</span>}
                                  {structured.meta?.tags?.slice(0,3).map((tg: string) => <span key={tg} className="px-2 py-1 rounded bg-muted/40 border border-input/30">{tg}</span>)}
                                </div>
                                {ans.constraints && (
                                  <div className="text-xs space-y-1">
                                    <h4 className="font-semibold uppercase opacity-70">Constraints</h4>
                                    {ans.constraints.inputSizes && <p>Sizes: {ans.constraints.inputSizes}</p>}
                                    {ans.constraints.valueRanges && <p>Ranges: {ans.constraints.valueRanges}</p>}
                                    {ans.constraints.edgeCases?.length > 0 && <p>Edge: {ans.constraints.edgeCases.join(', ')}</p>}
                                  </div>
                                )}
                                {ans.variants?.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <h4 className="font-semibold uppercase opacity-70">Variants</h4>
                                    <ul className="list-disc pl-5 space-y-0.5">
                                      {ans.variants.map((v: string, i: number) => <li key={i}>{v}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {ans.code?.main && (
                                  <div>
                                    <h4 className="text-xs font-semibold uppercase opacity-70 mb-1">Code</h4>
                                    <CodeBlock codeText={ans.code.main} lang={ans.code.language || 'plaintext'} />
                                  </div>
                                )}
                                {tests.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <h4 className="font-semibold uppercase opacity-70">Tests</h4>
                                    <ul className="list-disc pl-5 space-y-0.5">
                                      {tests.map((t: any, i: number) => {
                                        const input = t.input && typeof t.input === 'object' ? JSON.stringify(t.input) : t.input;
                                        const expected = t.expected || t.expectedOutput || t.output || t.result;
                                        return <li key={i}><span className="font-medium">In:</span> {input} <span className="font-medium">→</span> {expected}</li>;
                                      })}
                                    </ul>
                                  </div>
                                )}
                                {ans.explanationNotes?.length > 0 && (
                                  <div className="text-xs space-y-1">
                                    <h4 className="font-semibold uppercase opacity-70">Notes</h4>
                                    <ul className="list-disc pl-5 space-y-0.5">
                                      {ans.explanationNotes.map((n: string, i: number) => <li key={i}>{n}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {structured.responseType === 'mcq' && (
                            <div className="space-y-3">
                              <p className="font-medium">{(structured.answer as any).question}</p>
                              <ul className="space-y-1 text-sm">
                                {(structured.answer as any).options?.map((o: any) => {
                                  const correct = o.id === (structured.answer as any).correctOptionId;
                                  return (
                                    <li key={o.id} className={`px-2 py-1 rounded border text-xs ${correct ? 'border-primary/50 bg-primary/10' : 'border-transparent bg-black/5 dark:bg-white/5'}`}>{o.id}. {o.text}</li>
                                  );
                                })}
                              </ul>
                              <p className="text-xs"><span className="font-semibold">Answer:</span> {(structured.answer as any).correctOptionId}</p>
                              <p className="text-xs">{(structured.answer as any).justification}</p>
                              {(structured.answer as any).eliminations?.length > 0 && (
                                <div className="text-xs space-y-1">
                                  <h4 className="font-semibold uppercase opacity-70">Eliminations</h4>
                                  <ul className="list-disc pl-5 space-y-0.5">
                                    {(structured.answer as any).eliminations.map((e: any, i: number) => <li key={i}>{e.optionId}: {e.reason}</li>)}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: ({ inline, className, children }: any) => {
                                const codeText = String(children).replace(/\n$/, "");
                                if (inline) {
                                  return <code className="px-1 py-0.5 rounded bg-muted/20 font-mono text-sm">{children}</code>;
                                }
                                const lang = (className || "").replace(/language-/, "");
                                return <CodeBlock codeText={codeText} lang={lang} />;
                              },
                            }}
                          >
                            {msg.content || (isLoading && msg.role === "assistant" ? "…" : "")}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex items-center gap-2 mt-2 text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative">
        <Button
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="cursor-pointer"
          aria-label="Attach images"
        >
          <PaperclipIcon className="h-4 w-4" />
        </Button>

        {/* File count badge */}
        {attachedFiles.length > 0 && (
          <div className="absolute -top-2 -right-2 bg-primary-foreground text-primary rounded-full h-5 w-5 flex border border-primary items-center justify-center text-xs font-medium">
            {attachedFiles.length}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  );
};
