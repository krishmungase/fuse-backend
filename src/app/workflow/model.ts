import { MessagesState } from "./state";

import { ChatGroq } from "@langchain/groq";
import { SystemMessage } from "@langchain/core/messages";
import { GraphNode } from "@langchain/langgraph/dist/graph/types";

// import env from "../../config/env.config";
// import { ChatOpenAI } from "@langchain/openai";

// const llm = new ChatOpenAI({
//   model: "gpt-5-mini",
//   temperature: 0,
//   apiKey: env.openai,
// });

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
});

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
