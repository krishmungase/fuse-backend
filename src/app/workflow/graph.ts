import { ToolNode } from "@langchain/langgraph/prebuilt";
import { END, GraphNode, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

import { llmCall } from "./llm-call";
import { AIMessage } from "langchain";
import { buildTools } from "./tools";
import { pool } from "../../database/connection";
import { ChatContext, MessagesState } from "./state";

export const CHECKPOINT_SCHEMA = "langgraph";

export const checkpointer = new PostgresSaver(pool, undefined, {
  schema: CHECKPOINT_SCHEMA,
});

const toolNode: GraphNode<typeof MessagesState, ChatContext> = async (
  state,
  config,
) => {
  const tools = await buildTools(config.context?.userId);
  return new ToolNode(tools).invoke(state, config);
};

const shouldCallTool = (state: typeof MessagesState.State) => {
  const lastMessage = state.messages[state.messages.length - 1];

  if (
    lastMessage &&
    AIMessage.isInstance(lastMessage) &&
    lastMessage.tool_calls?.length
  ) {
    return "toolNode";
  }

  return END;
};

export const agent = new StateGraph({
  state: MessagesState,
  context: ChatContext,
})
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldCallTool)
  .addEdge("toolNode", "llmCall")
  .compile({ checkpointer });
