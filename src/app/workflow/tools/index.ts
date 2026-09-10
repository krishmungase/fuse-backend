import { StructuredToolInterface } from "@langchain/core/tools";

import { connections } from "../../connection/schema/connection.schema";
import AccessTokenService from "../../connection/services/access-token.service";
import ConnectionService from "../../connection/services/connection.service";
import OAuthService from "../../connection/services/oauth.service";

import { productTool } from "./products";
import { webSearchTool } from "./web-search";
import { weatherTool } from "./weather";
import { CONNECTOR_TOOL_FACTORIES } from "./google";

const connectionService = new ConnectionService(connections);

const accessTokenService = new AccessTokenService(
  connectionService,
  new OAuthService(),
);

export const baseTools: StructuredToolInterface[] = [
  productTool,
  webSearchTool,
  weatherTool,
];

export const buildTools = async (
  userId?: string,
): Promise<StructuredToolInterface[]> => {
  if (!userId) {
    return baseTools;
  }

  const providers = await connectionService.listActiveProviders(userId);

  if (!providers.length) {
    return baseTools;
  }

  const context = { userId, accessTokenService };

  const connectorTools = providers.flatMap((provider) =>
    (CONNECTOR_TOOL_FACTORIES[provider] ?? []).map((factory) =>
      factory(context),
    ),
  );

  return [...baseTools, ...connectorTools];
};

export { productTool, webSearchTool, weatherTool };
