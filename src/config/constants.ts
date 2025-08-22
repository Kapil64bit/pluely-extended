// Storage keys
export const STORAGE_KEYS = {
  SETTINGS: "settings",
  THEME: "theme",
  CHAT_HISTORY: "chat_history",
} as const;

// Available AI providers
export const providers = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "gpt-5",
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        placement:
          "messages array (as string content in user/assistant messages)",
        exampleStructure: {
          role: "user",
          content: "Your text message here",
        },
      },
      image: {
        type: "url_or_base64",
        placement:
          "messages array (as content items in user/assistant messages; content becomes array when including images)",
        exampleStructure: {
          role: "user",
          content: [
            { type: "text", text: "Describe this image:" },
            {
              type: "image_url",
              image_url: { url: "https://example.com/image.jpg" },
            },
          ],
        },
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com",
    chatEndpoint: "/v1/messages",
    authType: "x-api-key",
    defaultModel: "claude-sonnet-4-20250514",
    response: {
      contentPath: "content[0].text",
      usagePath: "usage",
    },
    input: {
      text: {
        placement:
          "messages array (as string content in user/assistant messages)",
        exampleStructure: {
          role: "user",
          content: "Your text message here",
        },
      },
      image: {
        type: "base64",
        placement:
          "messages array (as content items in user messages; content becomes array when including images)",
        exampleStructure: {
          role: "user",
          content: [
            { type: "text", text: "Describe this image:" },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: "base64_string_here",
              },
            },
          ],
        },
      },
    },
    models: null,
  },
  {
    id: "grok",
    name: "Grok (xAI)",
    baseUrl: "https://api.x.ai",
    chatEndpoint: "/v1/chat/completions",
    authType: "bearer",
    defaultModel: "grok-4",
    response: {
      contentPath: "choices[0].message.content",
      usagePath: "usage",
    },
    input: {
      text: {
        placement:
          "messages array (as string content in user/assistant messages)",
        exampleStructure: {
          role: "user",
          content: "Your text message here",
        },
      },
      image: {
        type: "url_or_base64",
        placement:
          "messages array (as content items in user/assistant messages; content becomes array when including images)",
        exampleStructure: {
          role: "user",
          content: [
            { type: "text", text: "Describe this image:" },
            {
              type: "image_url",
              image_url: { url: "https://example.com/image.jpg" },
            },
          ],
        },
      },
    },
    models: {
      endpoint: "/v1/models",
      method: "GET",
      responsePath: "data",
      idKey: "id",
    },
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    baseUrl: "https://generativelanguage.googleapis.com",
    chatEndpoint: "/v1beta/models/${model}:streamGenerateContent?alt=sse",
    authType: "x-goog-api-key",
    authParam: "key",
    defaultModel: "gemini-2.5-flash",
    response: {
      contentPath: "candidates[0].content.parts[0].text",
      usagePath: "usageMetadata",
    },
    input: {
      text: {
        placement: "contents array (as text parts in user/model contents)",
        exampleStructure: {
          role: "user",
          parts: [{ text: "Your text message here" }],
        },
      },
      image: {
        type: "url_or_base64",
        placement: "contents array (as parts in user contents)",
        exampleStructure: {
          role: "user",
          parts: [
            { text: "Describe this image:" },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: "base64_string_here",
              },
            },
          ],
        },
      },
    },
    models: {
      endpoint: "/v1beta/models",
      method: "GET",
      responsePath: "models",
      idKey: "name",
    },
  },
];

// Default settings
export const DEFAULT_SYSTEM_PROMPT =
  // Interview persona + strict JSON envelope contract
  "You are an interview-style assistant. Answer as if responding verbally to an interviewer: concise, confident, professional. " +
  "ALWAYS output ONLY a single valid JSON object (no markdown fences, no prose outside JSON). Schema: {version,responseId,responseType,questionEcho,interviewTone,meta,answer,followUps}. " +
  "responseType: theoretical | coding | mcq. Rules: theoretical.answer={summary,detailed,keyPoints[],pitfalls[]}; coding.answer={solutionOverview,approachSteps[],timeComplexity,spaceComplexity,constraints{inputSizes,valueRanges,edgeCases[],assumptions[]},variants[],code{language,style,main,helperSnippets[]},tests[{input,expected}],explanationNotes[]}; mcq.answer={question,options[{id,text}],correctOptionId,justification,eliminations[{optionId,reason}],quickRecallHook}. meta={confidence(0-1),difficulty(easy|medium|hard),tags[]}. followUps: up to 3 items {prompt,purpose}. " +
  "Code: provide fully working code with rich inline comments in answer.code.main. No trailing commas. If clarification needed, still return valid JSON (theoretical) asking for it. Never break the JSON contract.";
