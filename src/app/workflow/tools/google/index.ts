import { StructuredToolInterface } from "@langchain/core/tools";

import { ConnectorId } from "../../../connection/constants/connector.constants";
import { ToolUserContext } from "./google-api.client";
import {
  createCreateEventTool,
  createDeleteEventTool,
  createListEventsTool,
} from "./calendar";
import { createSearchFilesTool } from "./drive";
import { createSearchMessagesTool, createSendMessageTool } from "./gmail";

export type ConnectorToolFactory = (
  context: ToolUserContext,
) => StructuredToolInterface;

export const CONNECTOR_TOOL_FACTORIES: Partial<
  Record<ConnectorId, ConnectorToolFactory[]>
> = {
  "google-calendar": [
    createListEventsTool,
    createCreateEventTool,
    createDeleteEventTool,
  ],
  gmail: [createSearchMessagesTool, createSendMessageTool],
  "google-drive": [createSearchFilesTool],
};

export type { ToolUserContext } from "./google-api.client";
