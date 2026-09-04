import { z } from "zod";
import { SystemMessage } from "@langchain/core/messages";
import { END, GraphNode, START, StateGraph } from "@langchain/langgraph";

import { MessagesState } from "./state";
import { getChatModel } from "./model";
import { DEFAULT_CHAT_MODEL_ID } from "./models.registry";

/**
 * Per-invocation runtime knobs. The model lives here rather than in state
 * because it configures the run; it is not part of the conversation.
 */
export const ChatContext = z.object({
  modelId: z.string().default(DEFAULT_CHAT_MODEL_ID),
});

export type ChatContext = z.infer<typeof ChatContext>;

export const llmCall: GraphNode<typeof MessagesState, ChatContext> = async (
  state,
  config,
) => {
  const llm = getChatModel(config.context?.modelId ?? DEFAULT_CHAT_MODEL_ID);

  const response = await llm.invoke([
    new SystemMessage(
      "You are a helpful assistant tasked with performing arithmetic on a set of inputs.",
    ),
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
