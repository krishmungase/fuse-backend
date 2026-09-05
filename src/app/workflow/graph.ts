/**
 * The chat graph. Compiled once at import; the model to run arrives per
 * invocation through the typed context, so a request can pick any model the
 * chat module resolved for it without rebuilding the graph.
 */
import { z } from "zod";
import { SystemMessage } from "@langchain/core/messages";
import { END, GraphNode, START, StateGraph } from "@langchain/langgraph";

import { MessagesState } from "./state";
import { getChatModel } from "./model";
import { CHAT_PROVIDERS } from "../chat/schema/chat-model.schema";

const SYSTEM_PROMPT = "You are a helpful assistant.";

/**
 * Per-invocation runtime knobs. The model lives here rather than in state
 * because it configures the run; it is not part of the conversation.
 */
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
