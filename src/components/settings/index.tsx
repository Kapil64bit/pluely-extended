import { useState, useEffect } from "react";
import { SettingsIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  ScrollArea,
} from "@/components";
import { providers } from "@/config";
import { ProviderSelection } from "./ProviderSelection";
import { ApiKeyInput } from "./ApiKeyInput";
import { ModelSelection } from "./ModelSelection";
import { Disclaimer } from "./Disclaimer";
import { SystemPrompt } from "./SystemPrompt";
import { Speech } from "./Speech";
import { Input, Label } from "@/components";
import {
  loadSettingsFromStorage,
  saveSettingsToStorage,
  fetchModels,
} from "@/lib";
import { SettingsState } from "@/types";

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>(
    loadSettingsFromStorage
  );

  // Save to localStorage whenever settings change
  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  const updateSettings = (updates: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleApiKeySubmit = async () => {
    if (!settings.apiKey.trim()) return;

    const provider = providers.find((p) => p.id === settings.selectedProvider);
    if (!provider) return;

    // Mark API key as submitted first
    updateSettings({
      isApiKeySubmitted: true,
      isLoadingModels: false,
      modelsFetchError: null,
      availableModels: [],
    });

    // Try to fetch models if provider supports it
    if (provider.models) {
      updateSettings({ isLoadingModels: true });

      try {
        const models = await fetchModels(provider, settings.apiKey.trim());
        updateSettings({
          isLoadingModels: false,
          availableModels: models,
          modelsFetchError: null,
          // Clear selected model if it's not in the fetched models
          selectedModel: models.includes(settings.selectedModel)
            ? settings.selectedModel
            : "",
        });
      } catch (error) {
        console.error("Failed to fetch models:", error);
        updateSettings({
          isLoadingModels: false,
          modelsFetchError:
            error instanceof Error ? error.message : "Failed to fetch models",
          availableModels: [],
        });
      }
    }
  };

  const handleApiKeyDelete = () => {
    updateSettings({
      apiKey: "",
      isApiKeySubmitted: false,
      selectedModel: "",
      customModel: "",
      availableModels: [],
      isLoadingModels: false,
      modelsFetchError: null,
    });
  };

  const handleOpenAiApiKeySubmit = () => {
    if (!settings.openAiApiKey.trim()) return;
    updateSettings({
      isOpenAiApiKeySubmitted: true,
    });
  };

  const handleOpenAiApiKeyDelete = () => {
    updateSettings({
      openAiApiKey: "",
      isOpenAiApiKeySubmitted: false,
    });
  };

  const handleOpenAiKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleOpenAiApiKeySubmit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApiKeySubmit();
    }
  };

  const currentProvider = providers.find(
    (p) => p.id === settings.selectedProvider
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          aria-label="Open Settings"
          className="cursor-pointer"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      {/* Settings Panel */}
      <PopoverContent
        align="center"
        side="bottom"
        // center and constrain inner width so buttons don't get clipped at narrow edges
        className="w-screen p-0 border shadow-lg overflow-hidden"
        sideOffset={8}
      >
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="max-w-2xl mx-auto p-4 space-y-4">
            {/* Configuration Header */}
            <div className="border-b border-input/50 pb-2">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI Configuration
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure your AI provider, authentication, and model
                preferences for the best experience.
              </p>
            </div>

            {/* AI Provider Selection */}
            <ProviderSelection
              value={settings.selectedProvider}
              onChange={(value) =>
                updateSettings({
                  selectedProvider: value,
                  apiKey: "",
                  isApiKeySubmitted: false,
                  selectedModel: "",
                  customModel: "",
                  availableModels: [],
                  isLoadingModels: false,
                  modelsFetchError: null,
                })
              }
            />

            {/* API Key Configuration */}
            <ApiKeyInput
              providerName={currentProvider?.name || ""}
              value={settings.apiKey}
              onChange={(value) => updateSettings({ apiKey: value })}
              onSubmit={handleApiKeySubmit}
              onDelete={handleApiKeyDelete}
              onKeyPress={handleKeyPress}
              isSubmitted={settings.isApiKeySubmitted}
            />

            {/* Model Selection */}
            <ModelSelection
              provider={settings.selectedProvider}
              selectedModel={settings.selectedModel}
              customModel={settings.customModel}
              onModelChange={(value) =>
                updateSettings({
                  selectedModel: value.replace("models/", ""),
                })
              }
              onCustomModelChange={(value) =>
                updateSettings({ customModel: value })
              }
              disabled={!settings.isApiKeySubmitted}
              availableModels={settings.availableModels}
              isLoadingModels={settings.isLoadingModels}
              modelsFetchError={settings.modelsFetchError}
            />

            {/* Speech-to-Text Configuration (only show for non-OpenAI providers) */}
            {settings.selectedProvider &&
              settings.selectedProvider !== "openai" && (
                <Speech
                  value={settings.openAiApiKey}
                  onChange={(value) => updateSettings({ openAiApiKey: value })}
                  onSubmit={handleOpenAiApiKeySubmit}
                  onDelete={handleOpenAiApiKeyDelete}
                  onKeyPress={handleOpenAiKeyPress}
                  isSubmitted={settings.isOpenAiApiKeySubmitted}
                />
              )}

            {/* System Prompt */}
            <SystemPrompt
              value={settings.systemPrompt}
              onChange={(value) => updateSettings({ systemPrompt: value })}
            />

            {/* Auto Clipboard Monitoring */}
            <div className="space-y-3 border-t pt-4">
              <h2 className="text-sm font-semibold">Auto Clipboard Monitor</h2>
              <div className="flex items-center gap-2 text-xs">
                <input
                  id="autoClipboardEnabled"
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer"
                  checked={!!settings.autoClipboardEnabled}
                  onChange={(e) => updateSettings({ autoClipboardEnabled: e.target.checked })}
                />
                <Label htmlFor="autoClipboardEnabled" className="cursor-pointer">Enable continuous clipboard analysis (text only)</Label>
              </div>
              {settings.autoClipboardEnabled && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label className="text-xs">Min Length</Label>
                    <Input
                      type="number"
                      min={4}
                      value={settings.clipboardMinLength || 0}
                      onChange={(e) => updateSettings({ clipboardMinLength: parseInt(e.target.value || '0', 10) })}
                      className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Ignore shorter snippets</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Cooldown (ms)</Label>
                    <Input
                      type="number"
                      min={1000}
                      step={500}
                      value={settings.clipboardDebounceMs || 0}
                      onChange={(e) => updateSettings({ clipboardDebounceMs: parseInt(e.target.value || '0', 10) })}
                      className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Min gap between analyses</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Keywords (comma separated, optional)</Label>
                    <Input
                      placeholder="e.g. error, stacktrace, summarize"
                      value={settings.clipboardKeywords || ''}
                      onChange={(e) => updateSettings({ clipboardKeywords: e.target.value })}
                      className="h-8"
                    />
                    <p className="text-[10px] text-muted-foreground">Only trigger if any keyword matches (case-insensitive)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pb-4 flex items-center justify-center">
            <a
              href="https://www.srikanthnani.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground text-center font-medium"
            >
              🚀 Built by Srikanth Nani ✨
            </a>
          </div>
        </ScrollArea>

        <div className="border-t border-input/50">
          <Disclaimer />
        </div>
      </PopoverContent>
    </Popover>
  );
};
