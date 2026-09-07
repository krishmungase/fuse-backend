import { AIMessage, HumanMessage } from "@langchain/core/messages";

import { ChatModelDefinition } from "../../workflow";
import { ChatModel } from "../schema/chat-model.schema";
import { Chat, Conversation } from "../schema/chat.schema";

const TITLE_MAX_LENGTH = 60;

export const toPublicModel = ({ slug, label, provider }: ChatModel) => ({
  id: slug,
  label,
  provider,
});

export const toModelDefinition = ({
  slug,
  provider,
  model,
}: ChatModel): ChatModelDefinition => ({
  slug,
  provider: provider as ChatModelDefinition["provider"],
  model,
});

export const toPublicChat = ({ id, title, createdAt, updatedAt }: Chat) => ({
  id,
  title,
  createdAt,
  updatedAt,
});

export const toPublicMessage = ({
  id,
  role,
  content,
  model,
  createdAt,
}: Conversation) => ({
  id,
  role,
  content,
  model,
  createdAt,
});

export const toLangChainMessage = ({ role, content }: Conversation) =>
  role === "assistant" ? new AIMessage(content) : new HumanMessage(content);

export const deriveTitle = (message: string): string => {
  const normalized = message.replace(/\s+/g, " ").trim();

  if (normalized.length <= TITLE_MAX_LENGTH) {
    return normalized;
  }

  const clipped = normalized.slice(0, TITLE_MAX_LENGTH);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped}…`;
};

export const toWords = (text: string) => text.match(/\s*\S+|\s+/g) ?? [text];
