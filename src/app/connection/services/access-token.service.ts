import {
  ConnectorId,
  getConnector,
  TOKEN_EXPIRY_SKEW_SECONDS,
} from "../constants/connector.constants";
import { Connection } from "../schema/connection.schema";
import { decryptSecret } from "../utils/crypto.utils";
import ConnectionService from "./connection.service";
import OAuthService from "./oauth.service";

class AccessTokenService {
  constructor(
    private connectionService: ConnectionService,
    private oauthService: OAuthService,
  ) {}

  async resolve(userId: string, provider: ConnectorId): Promise<string | null> {
    const connection = await this.connectionService.findActive(
      userId,
      provider,
    );

    if (!connection) {
      return null;
    }

    if (!this.isExpired(connection)) {
      return decryptSecret(connection.accessToken);
    }

    if (!connection.refreshToken) {
      await this.connectionService.markRevoked(connection.id);
      return null;
    }

    try {
      const tokens = await this.oauthService.refreshTokens(
        getConnector(provider),
        decryptSecret(connection.refreshToken),
      );

      const updated = await this.connectionService.updateTokens(
        connection.id,
        tokens,
      );

      return decryptSecret(updated.accessToken);
    } catch {
      await this.connectionService.markRevoked(connection.id);
      return null;
    }
  }

  private isExpired(connection: Connection): boolean {
    if (!connection.expiresAt) {
      return false;
    }

    const skewMs = TOKEN_EXPIRY_SKEW_SECONDS * 1000;
    return connection.expiresAt.getTime() - skewMs <= Date.now();
  }
}

export default AccessTokenService;
