import { llmCall } from "./model";
import { MessagesState } from "./state";

import { END, START, StateGraph } from "@langchain/langgraph";

export const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addEdge(START, "llmCall")
  .addEdge("llmCall", END)
  .compile();
