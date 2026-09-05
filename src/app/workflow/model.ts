/**
 * Chat model factory: turns a resolved model definition into a ready provider
 * client. The definition comes from the database via the chat module, so this
 * file knows how to build clients and nothing about which models exist.
 *
 * Clients are cached on the fields that shape them, so editing a row's
 * provider or upstream model name yields a new client rather than a stale one.
 */
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

import env from "../../config/env.config";
import { ChatProvider } from "../chat/schema/chat-model.schema";

/**
 * The shape the workflow needs from a chat_models row. Kept structural so the
 * graph never depends on the full database record.
 */
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
        // The gpt-5 family only accepts its default temperature; sending an
        // explicit value makes the API reject the request.
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
