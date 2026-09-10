import { connections } from "../../connection/schema/connection.schema";
import AccessTokenService from "../../connection/services/access-token.service";
import ConnectionService from "../../connection/services/connection.service";
import OAuthService from "../../connection/services/oauth.service";
import { ToolUserContext } from "./google";

const connectionService = new ConnectionService(connections);

const accessTokenService = new AccessTokenService(
  connectionService,
  new OAuthService(),
);

export const listConnectedProviders = (userId: string) =>
  connectionService.listActiveProviders(userId);

export const createToolContext = (userId: string): ToolUserContext => ({
  userId,
  accessTokenService,
});
