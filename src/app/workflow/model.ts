import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

import env from "../../config/env.config";
import { ChatModelDefinition, findChatModel } from "./models.registry";

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
  }
};

export const getChatModel = (id: string): BaseChatModel => {
  const cached = cache.get(id);
  if (cached) {
    return cached;
  }

  const definition = findChatModel(id);
  if (!definition) {
    throw new Error(`Unknown chat model id: "${id}"`);
  }

  const model = createModel(definition);
  cache.set(id, model);
  return model;
};
