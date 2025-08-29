import { SettingsState, ChatConversation } from "@/types";
import { STORAGE_KEYS, DEFAULT_SYSTEM_PROMPT } from "@/config";

const defaultSettings: SettingsState = {
  selectedProvider: "",
  apiKey: "",
  isApiKeySubmitted: false,
  selectedModel: "",
  customModel: "",
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  availableModels: [],
  isLoadingModels: false,
  modelsFetchError: null,
  openAiApiKey: "",
  isOpenAiApiKeySubmitted: false,
  autoClipboardEnabled: false,
  clipboardMinLength: 12,
  clipboardKeywords: "",
  clipboardDebounceMs: 8000,
};

export const loadSettingsFromStorage = (): SettingsState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error("Failed to load settings from localStorage:", error);
  }
  return defaultSettings;
};

export const saveSettingsToStorage = (settings: SettingsState) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings to localStorage:", error);
  }
};

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Chat history storage functions
export const loadChatHistory = (): ChatConversation[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load chat history from localStorage:", error);
    return [];
  }
};

export const saveChatHistory = (conversations: ChatConversation[]) => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.CHAT_HISTORY,
      JSON.stringify(conversations)
    );
  } catch (error) {
    console.error("Failed to save chat history to localStorage:", error);
  }
};

export const saveConversation = (conversation: ChatConversation) => {
  const conversations = loadChatHistory();
  const existingIndex = conversations.findIndex(
    (c) => c.id === conversation.id
  );

  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation); // Add to beginning
  }

  // Keep only the last 50 conversations to prevent storage bloat
  const limitedConversations = conversations.slice(0, 50);
  saveChatHistory(limitedConversations);
};

export const getConversation = (
  conversationId: string
): ChatConversation | null => {
  const conversations = loadChatHistory();
  return conversations.find((c) => c.id === conversationId) || null;
};

export const deleteConversation = (conversationId: string) => {
  const conversations = loadChatHistory();
  const filtered = conversations.filter((c) => c.id !== conversationId);
  saveChatHistory(filtered);
};

export const generateConversationTitle = (firstMessage: string): string => {
  // Generate a title from the first message, truncated to 50 characters
  const cleaned = firstMessage.replace(/\n/g, " ").trim();
  return cleaned.length > 50 ? cleaned.substring(0, 47) + "..." : cleaned;
};
