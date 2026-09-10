import { GraphNode } from "@langchain/langgraph";
import { SystemMessage } from "@langchain/core/messages";

import { buildTools } from "./tools";
import { getChatModel } from "./model";
import { ChatContext, MessagesState } from "./state";
import { buildSystemPrompt } from "../../constants/system-prompt.constants";

export const llmCall: GraphNode<typeof MessagesState, ChatContext> = async (
  state,
  config,
) => {
  const definition = config.context?.model;
  if (!definition) {
    throw new Error("No chat model was provided to the graph context.");
  }

  const llm = getChatModel(definition);

  if (!llm.bindTools) {
    throw new Error(`Model "${definition.slug}" does not support tools.`);
  }

  const tools = await buildTools(config.context?.userId);

  const response = await llm
    .bindTools(tools)
    .invoke([new SystemMessage(buildSystemPrompt()), ...state.messages]);

  return {
    messages: [response],
  };
};
