import { z } from "zod";
import { StateSchema, MessagesValue } from "@langchain/langgraph";

import { CHAT_PROVIDERS } from "../chat/schema/chat-model.schema";

export const MessagesState = new StateSchema({
  messages: MessagesValue,
});

export const ChatContext = z.object({
  userId: z.string(),
  model: z.object({
    slug: z.string(),
    provider: z.enum(CHAT_PROVIDERS),
    model: z.string(),
  }),
});

export type ChatContext = z.infer<typeof ChatContext>;
