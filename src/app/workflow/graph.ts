import { z } from "zod";
import { SystemMessage } from "@langchain/core/messages";
import { END, GraphNode, START, StateGraph } from "@langchain/langgraph";

import { MessagesState } from "./state";
import { getChatModel } from "./model";
import { CHAT_PROVIDERS } from "../chat/schema/chat-model.schema";

const SYSTEM_PROMPT = "You are a helpful assistant.";

export const ChatContext = z.object({
  model: z.object({
    slug: z.string(),
    provider: z.enum(CHAT_PROVIDERS),
    model: z.string(),
  }),
});

export type ChatContext = z.infer<typeof ChatContext>;

export const llmCall: GraphNode<typeof MessagesState, ChatContext> = async (
  state,
  config,
) => {
  const definition = config.context?.model;
  if (!definition) {
    throw new Error("No chat model was provided to the graph context.");
  }

  const llm = getChatModel(definition);

  const response = await llm.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    ...state.messages,
  ]);

  return {
    messages: [response],
  };
};

export const agent = new StateGraph({
  state: MessagesState,
  context: ChatContext,
})
  .addNode("llmCall", llmCall)
  .addEdge(START, "llmCall")
  .addEdge("llmCall", END)
  .compile();
