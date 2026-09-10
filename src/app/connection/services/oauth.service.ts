import env from "../../../config/env.config";
import ApiError from "../../../utils/api-error";
import { Connector } from "../constants/connector.constants";
import { OAuthCredentials, OAuthTokens } from "../types/connection.types";

const CREDENTIALS_BY_FAMILY: Record<string, () => OAuthCredentials> = {
  google: () => ({
    clientId: env.google.clientId,
    clientSecret: env.google.clientSecret,
    redirectUri: env.google.redirectUri,
  }),
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
  error_description?: string;
};

class OAuthService {
  getCredentials(connector: Connector): OAuthCredentials {
    const resolve = CREDENTIALS_BY_FAMILY[connector.oauth.family];

    if (!resolve) {
      throw new ApiError(
        500,
        `No OAuth credentials configured for "${connector.oauth.family}".`,
      );
    }

    const credentials = resolve();

    if (!credentials.clientId || !credentials.clientSecret) {
      throw new ApiError(
        503,
        `${connector.label} is not configured on this server.`,
      );
    }

    return credentials;
  }

  buildAuthorizeUrl(connector: Connector, state: string): string {
    const { clientId, redirectUri } = this.getCredentials(connector);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: connector.scopes.join(" "),
      state,
      ...connector.oauth.authorizeParams,
    });

    return `${connector.oauth.authorizeUrl}?${params}`;
  }

  async exchangeCode(connector: Connector, code: string): Promise<OAuthTokens> {
    const { clientId, clientSecret, redirectUri } =
      this.getCredentials(connector);

    return this.requestTokens(connector, {
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });
  }

  async refreshTokens(
    connector: Connector,
    refreshToken: string,
  ): Promise<OAuthTokens> {
    const { clientId, clientSecret } = this.getCredentials(connector);

    return this.requestTokens(connector, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    });
  }

  async revokeToken(connector: Connector, token: string): Promise<void> {
    if (!connector.oauth.revokeUrl) {
      return;
    }

    try {
      await fetch(connector.oauth.revokeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token }),
      });
    } catch {
      return;
    }
  }

  async fetchAccountEmail(
    connector: Connector,
    accessToken: string,
  ): Promise<string | undefined> {
    if (!connector.oauth.userInfoUrl) {
      return undefined;
    }

    try {
      const response = await fetch(connector.oauth.userInfoUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        return undefined;
      }

      const profile = (await response.json()) as { email?: string };
      return profile.email;
    } catch {
      return undefined;
    }
  }

  private async requestTokens(
    connector: Connector,
    payload: Record<string, string>,
  ): Promise<OAuthTokens> {
    const response = await fetch(connector.oauth.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(payload),
    });

    const body = (await response.json()) as TokenResponse;

    if (!response.ok || !body.access_token) {
      throw new ApiError(
        502,
        body.error_description ??
          body.error ??
          `Could not obtain tokens from ${connector.label}.`,
      );
    }

    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresIn: body.expires_in,
      scope: body.scope,
    };
  }
}

export default OAuthService;
