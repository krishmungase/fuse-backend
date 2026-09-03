import { llm } from "./model";
import { MessagesState } from "./state";

import { SystemMessage } from "@langchain/core/messages";
import { END, GraphNode, START, StateGraph } from "@langchain/langgraph";

export const llmCall: GraphNode<typeof MessagesState> = async (state) => {
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

export const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addEdge(START, "llmCall")
  .addEdge("llmCall", END)
  .compile();
