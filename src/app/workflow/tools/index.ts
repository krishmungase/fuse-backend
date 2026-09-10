import { StructuredToolInterface } from "@langchain/core/tools";

import { baseTools } from "./catalog";
import { CONNECTOR_TOOL_FACTORIES } from "./google";
import { createToolContext, listConnectedProviders } from "./tool-context";

export const buildTools = async (
  userId?: string,
): Promise<StructuredToolInterface[]> => {
  if (!userId) {
    return baseTools;
  }

  const providers = await listConnectedProviders(userId);

  if (!providers.length) {
    return baseTools;
  }

  const context = createToolContext(userId);

  const connectorTools = providers.flatMap((provider) =>
    (CONNECTOR_TOOL_FACTORIES[provider] ?? []).map((factory) =>
      factory(context),
    ),
  );

  return [...baseTools, ...connectorTools];
};

export { baseTools, productTool, webSearchTool, weatherTool } from "./catalog";
