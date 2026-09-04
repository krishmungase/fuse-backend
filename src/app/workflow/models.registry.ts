export const CHAT_PROVIDERS = ["groq", "openai"] as const;

export type ChatProvider = (typeof CHAT_PROVIDERS)[number];

export interface ChatModelDefinition {
  id: string;
  label: string;
  provider: ChatProvider;
  model: string;
}

export const CHAT_MODELS: ChatModelDefinition[] = [
  {
    id: "groq/gpt-oss-120b",
    label: "GPT-OSS 120B",
    provider: "groq",
    model: "openai/gpt-oss-120b",
  },
  {
    id: "groq/llama-3.3-70b",
    label: "Llama 3.3 70B",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
  },
  {
    id: "groq/llama-3.1-8b",
    label: "Llama 3.1 8B",
    provider: "groq",
    model: "llama-3.1-8b-instant",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 nano",
    provider: "openai",
    model: "gpt-5-nano",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5 mini",
    provider: "openai",
    model: "gpt-5-mini",
  },
];

export const DEFAULT_CHAT_MODEL_ID = "groq/gpt-oss-120b";

const MODELS_BY_ID = new Map(CHAT_MODELS.map((model) => [model.id, model]));

export const CHAT_MODEL_IDS = CHAT_MODELS.map((model) => model.id);

export const findChatModel = (id: string): ChatModelDefinition | undefined =>
  MODELS_BY_ID.get(id);
