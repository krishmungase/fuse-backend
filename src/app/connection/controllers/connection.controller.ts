import { Request, Response } from "express";

import env from "../../../config/env.config";
import ApiError from "../../../utils/api-error";
import ApiResponse from "../../../utils/api-response";
import { CustomRequest } from "../../../types/common.types";
import ERROR_MESSAGE from "../../../constants/error-message.constants";

import {
  ConnectorId,
  getConnector,
  isConnectorId,
} from "../constants/connector.constants";
import ConnectionService from "../services/connection.service";
import OAuthService from "../services/oauth.service";
import OAuthStateService from "../services/oauth-state.service";
import { decryptSecret } from "../utils/crypto.utils";
import { toPublicConnections } from "../utils/connection.utils";

const providerOf = (req: Request): ConnectorId => {
  const provider = (req.params as { provider: string }).provider;

  if (!isConnectorId(provider)) {
    throw new ApiError(404, ERROR_MESSAGE.UNKNOWN_CONNECTOR);
  }

  return provider;
};

class ConnectionController {
  constructor(
    private connectionService: ConnectionService,
    private oauthService: OAuthService,
    private oauthStateService: OAuthStateService,
  ) {}

  async list(req: CustomRequest, res: Response) {
    const connections = await this.connectionService.listByUser(req.user!.id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { connections: toPublicConnections(connections) },
          "Connections fetched.",
        ),
      );
  }

  async authorize(req: CustomRequest, res: Response) {
    const provider = providerOf(req);
    const connector = getConnector(provider);

    const state = this.oauthStateService.sign({
      userId: req.user!.id,
      provider,
    });

    const url = this.oauthService.buildAuthorizeUrl(connector, state);

    return res
      .status(200)
      .json(new ApiResponse(200, { url }, "Authorization url created."));
  }

  async callback(req: Request, res: Response) {
    const { code, state, error } = req.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    const payload = this.oauthStateService.verify(state ?? "");
    const connector = getConnector(payload.provider);

    if (error || !code) {
      return res.redirect(
        this.redirectUrl({ error: error ?? ERROR_MESSAGE.OAUTH_DENIED }),
      );
    }

    const tokens = await this.oauthService.exchangeCode(connector, code);

    const accountEmail = await this.oauthService.fetchAccountEmail(
      connector,
      tokens.accessToken,
    );

    await this.connectionService.save({
      userId: payload.userId,
      provider: payload.provider,
      tokens,
      accountEmail,
    });

    return res.redirect(this.redirectUrl({ connected: payload.provider }));
  }

  async disconnect(req: CustomRequest, res: Response) {
    const provider = providerOf(req);

    const removed = await this.connectionService.remove(req.user!.id, provider);

    if (!removed) {
      throw new ApiError(404, ERROR_MESSAGE.CONNECTION_NOT_FOUND);
    }

    if (removed.refreshToken) {
      await this.oauthService.revokeToken(
        getConnector(provider),
        decryptSecret(removed.refreshToken),
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { provider }, "Connection removed."));
  }

  private redirectUrl(params: Record<string, string>): string {
    const search = new URLSearchParams(params);
    return `${env.frontendUrl}/chat/plugins?${search}`;
  }
}

export default ConnectionController;
