import { useState, useCallback, useRef, useEffect } from "react";
import { providers } from "@/config";
import {
  getSettings,
  fileToBase64,
  formatMessageForProvider,
  streamCompletion,
  saveConversation,
  getConversation,
  generateConversationTitle,
} from "@/lib";
import { AttachedFile, CompletionState, ChatMessage, ChatConversation } from "@/types";
import { StructuredAIResponse, normalizeStructured } from "@/types/structured";

export const useCompletion = () => {
  const [state, setState] = useState<CompletionState>({
    input: "",
    response: "",
    isLoading: false,
    error: null,
    attachedFiles: [],
    currentConversationId: null,
    conversationHistory: [],
  pendingUserMessage: undefined,
  });
  const [micOpen, setMicOpen] = useState(false);
  const [enableVAD, setEnableVAD] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const setInput = useCallback((value: string) => {
    setState((prev) => ({ ...prev, input: value }));
  }, []);

  const setResponse = useCallback((value: string) => {
    setState((prev) => ({ ...prev, response: value }));
  }, []);

  const addFile = useCallback(async (file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const attachedFile: AttachedFile = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        base64,
        size: file.size,
      };

      setState((prev) => ({
        ...prev,
        attachedFiles: [...prev.attachedFiles, attachedFile],
      }));
    } catch (error) {
      console.error("Failed to process file:", error);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      attachedFiles: prev.attachedFiles.filter((f) => f.id !== fileId),
    }));
  }, []);

  const clearFiles = useCallback(() => {
    setState((prev) => ({ ...prev, attachedFiles: [] }));
  }, []);

  const submit = useCallback(
    async (speechText?: string) => {
      const input = speechText || state.input;
      const settings = getSettings();
      if (
        !settings?.selectedProvider ||
        !settings?.apiKey ||
        !settings?.isApiKeySubmitted
      ) {
        setState((prev) => ({
          ...prev,
          error: "Please configure your AI provider and API key in settings",
        }));
        return;
      }

      const provider = providers.find(
        (p) => p.id === settings.selectedProvider
      );
      if (!provider) {
        setState((prev) => ({
          ...prev,
          error: "Invalid provider selected",
        }));
        return;
      }

      const model =
        settings.selectedModel || settings.customModel || provider.defaultModel;
      if (!model) {
        setState((prev) => ({
          ...prev,
          error: "Please select a model in settings",
        }));
        return;
      }

      if (!input.trim()) {
        return;
      }

      if (speechText) {
        setState((prev) => ({
          ...prev,
          input: speechText,
        }));
      }

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Prepare user message (append to conversation immediately for optimistic UI)
      const timestamp = Date.now();
      const userMsg: ChatMessage = {
        id: `msg_${timestamp}_user`,
        role: "user",
        content: input,
        timestamp,
      };

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        response: "", // track current assistant partial
        // add optimistic user message to history (exclude if same id already)
        conversationHistory: [...prev.conversationHistory, userMsg],
        pendingUserMessage: input,
        input: "", // clear input immediately for next question
      }));

      try {
        const payload = formatMessageForProvider(
          provider,
          input,
          state.attachedFiles,
          settings.systemPrompt,
          state.conversationHistory
        );

        let fullResponse = "";
        // Create a temporary assistant message in history for streaming updates
        const assistantTempId = `msg_${timestamp}_assistant_temp`;
        setState((prev) => ({
          ...prev,
          conversationHistory: [
            ...prev.conversationHistory,
            // temp assistant message placeholder (will be replaced at end)
            {
              id: assistantTempId,
              role: "assistant",
              content: "",
              timestamp: timestamp + 1,
            },
          ],
        }));

        await streamCompletion(
          provider,
          model,
          settings.apiKey,
          payload,
          (chunk) => {
            fullResponse += chunk;
            setState((prev) => ({
              ...prev,
              response: prev.response + chunk,
              conversationHistory: prev.conversationHistory.map((m) =>
                m.id === assistantTempId ? { ...m, content: prev.response + chunk } : m
              ),
            }));
          },
          (error) => {
            setState((prev) => ({
              ...prev,
              error,
              isLoading: false,
            }));
          },
          abortControllerRef.current
        );

        setState((prev) => ({ ...prev, isLoading: false }));

        // Save the conversation after successful completion (replace temp assistant message)
        if (fullResponse) {
          // Attempt to parse structured JSON even if wrapped in markdown/code fences or extra prose
          let structured: StructuredAIResponse | undefined;

          const attemptParse = (candidate: string) => {
            try {
              const parsed = JSON.parse(candidate);
              const normalized = normalizeStructured(parsed);
              if (normalized) structured = normalized;
              return true;
            } catch {
              return false;
            }
          };

          let raw = fullResponse.trim();

          // 1. Direct whole-string parse (original behavior)
          if (!(raw.startsWith('{') && raw.endsWith('}') && attemptParse(raw))) {
            // 2. Strip surrounding markdown code fences if present
            const fenceMatch = raw.match(/^```(?:json)?\n([\s\S]*?)\n```$/i);
            if (fenceMatch) {
              const inner = fenceMatch[1].trim();
              attemptParse(inner);
            }

            // 3. Find first fenced json block anywhere
            if (!structured) {
              const multiFence = raw.match(/```json\n([\s\S]*?)```/i);
              if (multiFence) {
                attemptParse(multiFence[1].trim());
              }
            }

            // 4. Heuristic: extract largest balanced JSON object substring
            if (!structured) {
              const firstBrace = raw.indexOf('{');
              const lastBrace = raw.lastIndexOf('}');
              if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                const candidate = raw.substring(firstBrace, lastBrace + 1);
                // Try progressive shrinking from the end if parsing fails (handles trailing junk after last brace)
                if (!attemptParse(candidate)) {
                  // Brace depth approach (simplified)
                  let depth = 0;
                  for (let end = firstBrace; end < raw.length; end++) {
                    const ch = raw[end];
                    if (ch === '{') depth++;
                    else if (ch === '}') {
                      depth--;
                      if (depth === 0) {
                        const sub = raw.substring(firstBrace, end + 1);
                        if (attemptParse(sub)) break;
                      }
                    }
                  }
                }
              }
            }
          }

          saveCurrentConversation(userMsg.content, fullResponse, state.attachedFiles, structured);
          // Clear attached files after saving
          setState((prev) => ({
            ...prev,
            attachedFiles: [],
            pendingUserMessage: undefined,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "An error occurred",
          isLoading: false,
        }));
      }
    },
    [state.input, state.attachedFiles, state.isLoading]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    // Explicit close of the conversation panel: do NOT delete history unless starting new chat
    cancel();
    setState((prev) => ({
      ...prev,
      response: "",
      error: null,
      isLoading: false,
      // keep conversationHistory & currentConversationId intact
    }));
  }, [cancel]);

  const isOpenAIKeyAvailable = useCallback(() => {
    const settings = getSettings();
    if (!settings) return false;
    return (
      settings.openAiApiKey ||
      (settings.selectedProvider === "openai" && settings.apiKey)
    );
  }, []);

  const loadConversation = useCallback((conversation: ChatConversation) => {
    setState((prev) => ({
      ...prev,
      currentConversationId: conversation.id,
      conversationHistory: conversation.messages,
      input: "",
  response: "", // clear streaming buffer
      error: null,
      isLoading: false,
    }));
  }, []);

  const startNewConversation = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentConversationId: null,
      conversationHistory: [],
      input: "",
      response: "",
      error: null,
      isLoading: false,
      attachedFiles: [],
    }));
  }, []);

  const saveCurrentConversation = useCallback(
    (
      userMessage: string,
      assistantResponse: string,
      _attachedFiles: AttachedFile[], // Prefixed with _ to indicate intentionally unused
      structured?: StructuredAIResponse
    ) => {
      const conversationId =
        state.currentConversationId ||
        `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Date.now();

      const userMsg: ChatMessage = {
        id: `msg_${timestamp}_user`,
        role: "user",
        content: userMessage,
        timestamp,
        // Don't store attachedFiles to avoid localStorage bloat
      };

      const assistantMsg: ChatMessage = {
        id: `msg_${timestamp}_assistant`,
        role: "assistant",
        content: assistantResponse,
        timestamp: timestamp + 1,
        structured,
      };

      // Remove any temporary assistant messages created during streaming
      const filteredHistory = state.conversationHistory.filter(
        (m) => !m.id.includes("_assistant_temp")
      );

      // Avoid duplicating the user message if it was already optimistically added
      const last = filteredHistory[filteredHistory.length - 1];
      const shouldAppendUser = !(last && last.role === "user" && last.content === userMessage);

      const newMessages = [
        ...filteredHistory,
        ...(shouldAppendUser ? [userMsg] : []),
        assistantMsg,
      ];

      const title = filteredHistory.length === 0 ? generateConversationTitle(userMessage) : undefined;

      const conversation: ChatConversation = {
        id: conversationId,
        title:
          title ||
          (state.currentConversationId
            ? getConversation(state.currentConversationId)?.title ||
              generateConversationTitle(userMessage)
            : generateConversationTitle(userMessage)),
  messages: newMessages,
        createdAt: state.currentConversationId
          ? getConversation(state.currentConversationId)?.createdAt || timestamp
          : timestamp,
        updatedAt: timestamp,
      };

      saveConversation(conversation);

      setState((prev) => ({
        ...prev,
        currentConversationId: conversationId,
        conversationHistory: newMessages,
      }));
    },
    [state.currentConversationId, state.conversationHistory]
  );

  // Listen for conversation events from the main ChatHistory component
  useEffect(() => {
    const handleConversationSelected = (event: any) => {
      const conversation = event.detail;
      loadConversation(conversation);
    };

    const handleNewConversation = () => {
      startNewConversation();
    };

    const handleConversationDeleted = (event: any) => {
      const deletedId = event.detail;
      // If the currently active conversation was deleted, start a new one
      if (state.currentConversationId === deletedId) {
        startNewConversation();
      }
    };

    window.addEventListener("conversationSelected", handleConversationSelected);
    window.addEventListener("newConversation", handleNewConversation);
    window.addEventListener("conversationDeleted", handleConversationDeleted);

    return () => {
      window.removeEventListener(
        "conversationSelected",
        handleConversationSelected
      );
      window.removeEventListener("newConversation", handleNewConversation);
      window.removeEventListener(
        "conversationDeleted",
        handleConversationDeleted
      );
    };
  }, [loadConversation, startNewConversation, state.currentConversationId]);

  return {
    input: state.input,
    setInput,
    response: state.response,
    setResponse,
    isLoading: state.isLoading,
    error: state.error,
    attachedFiles: state.attachedFiles,
    addFile,
    removeFile,
    clearFiles,
    submit,
    cancel,
    reset,
    isOpenAIKeyAvailable,
    setState,
    enableVAD,
    setEnableVAD,
    micOpen,
    setMicOpen,
    // Conversation history functions
    currentConversationId: state.currentConversationId,
    conversationHistory: state.conversationHistory,
    loadConversation,
    startNewConversation,
    saveCurrentConversation,
  pendingUserMessage: state.pendingUserMessage,
  };
};
