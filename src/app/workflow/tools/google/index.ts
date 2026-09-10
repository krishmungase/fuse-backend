import { StructuredToolInterface } from "@langchain/core/tools";

import { ConnectorId } from "../../../connection/constants/connector.constants";
import { ToolUserContext } from "./google-api.client";
import {
  createCalendarCreateTool,
  createCalendarDeleteTool,
  createCalendarListTool,
} from "./calendar.tool";
import { createDriveTool } from "./drive.tool";
import { createGmailSearchTool, createGmailSendTool } from "./gmail.tool";

export type ConnectorToolFactory = (
  context: ToolUserContext,
) => StructuredToolInterface;

export const CONNECTOR_TOOL_FACTORIES: Partial<
  Record<ConnectorId, ConnectorToolFactory[]>
> = {
  "google-calendar": [
    createCalendarListTool,
    createCalendarCreateTool,
    createCalendarDeleteTool,
  ],
  gmail: [createGmailSearchTool, createGmailSendTool],
  "google-drive": [createDriveTool],
};

export type { ToolUserContext } from "./google-api.client";
