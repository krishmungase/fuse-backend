import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

import env from "../../config/env.config";
import { ChatProvider } from "../chat/schema/chat-model.schema";

export interface ChatModelDefinition {
  slug: string;
  provider: ChatProvider;
  model: string;
}

const DEFAULT_TEMPERATURE = 0;

const cache = new Map<string, BaseChatModel>();

const requireApiKey = (value: string, envVar: string): string => {
  if (!value) {
    throw new Error(
      `Missing "${envVar}". It is required to use the selected model.`,
    );
  }
  return value;
};

const createModel = (definition: ChatModelDefinition): BaseChatModel => {
  switch (definition.provider) {
    case "groq":
      return new ChatGroq({
        model: definition.model,
        temperature: DEFAULT_TEMPERATURE,
        apiKey: requireApiKey(env.llm.groqApiKey, "GROQ_API_KEY"),
      });

    case "openai":
      return new ChatOpenAI({
        model: definition.model,
        apiKey: requireApiKey(env.llm.openaiApiKey, "OPENAI_API_KEY"),
        ...(definition.model.startsWith("gpt-5")
          ? {}
          : { temperature: DEFAULT_TEMPERATURE }),
      });

    default:
      throw new Error(`Unsupported chat provider: "${definition.provider}"`);
  }
};

export const getChatModel = (
  definition: ChatModelDefinition,
): BaseChatModel => {
  const cacheKey = `${definition.provider}:${definition.model}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const model = createModel(definition);
  cache.set(cacheKey, model);
  return model;
};
