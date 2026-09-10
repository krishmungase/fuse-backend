import { and, eq } from "drizzle-orm";

import { db } from "../../../database/connection";
import { ConnectorId } from "../constants/connector.constants";
import { connections, Connection } from "../schema/connection.schema";
import { OAuthTokens, SaveConnectionInput } from "../types/connection.types";
import { encryptSecret } from "../utils/crypto.utils";
import { expiresAtFrom, parseScopes } from "../utils/connection.utils";

class ConnectionService {
  private connections;

  constructor(connectionsTable: typeof connections) {
    this.connections = connectionsTable;
  }

  async listByUser(userId: string): Promise<Connection[]> {
    return db
      .select()
      .from(this.connections)
      .where(eq(this.connections.userId, userId));
  }

  async findActive(
    userId: string,
    provider: ConnectorId,
  ): Promise<Connection | undefined> {
    const [connection] = await db
      .select()
      .from(this.connections)
      .where(
        and(
          eq(this.connections.userId, userId),
          eq(this.connections.provider, provider),
          eq(this.connections.status, "active"),
        ),
      );

    return connection;
  }

  async listActiveProviders(userId: string): Promise<ConnectorId[]> {
    const rows = await db
      .select({ provider: this.connections.provider })
      .from(this.connections)
      .where(
        and(
          eq(this.connections.userId, userId),
          eq(this.connections.status, "active"),
        ),
      );

    return rows.map((row) => row.provider as ConnectorId);
  }

  async save({
    userId,
    provider,
    tokens,
    accountEmail,
  }: SaveConnectionInput): Promise<Connection> {
    const values = {
      userId,
      provider,
      accountEmail,
      scopes: parseScopes(tokens.scope),
      accessToken: encryptSecret(tokens.accessToken),
      refreshToken: tokens.refreshToken
        ? encryptSecret(tokens.refreshToken)
        : undefined,
      expiresAt: expiresAtFrom(tokens.expiresIn),
      status: "active" as const,
      updatedAt: new Date(),
    };

    const [connection] = await db
      .insert(this.connections)
      .values(values)
      .onConflictDoUpdate({
        target: [this.connections.userId, this.connections.provider],
        set: {
          ...values,
          refreshToken: values.refreshToken ?? this.connections.refreshToken,
        },
      })
      .returning();

    return connection;
  }

  async updateTokens(id: string, tokens: OAuthTokens): Promise<Connection> {
    const [connection] = await db
      .update(this.connections)
      .set({
        accessToken: encryptSecret(tokens.accessToken),
        ...(tokens.refreshToken
          ? { refreshToken: encryptSecret(tokens.refreshToken) }
          : {}),
        expiresAt: expiresAtFrom(tokens.expiresIn),
        updatedAt: new Date(),
      })
      .where(eq(this.connections.id, id))
      .returning();

    return connection;
  }

  async markRevoked(id: string): Promise<void> {
    await db
      .update(this.connections)
      .set({ status: "revoked", updatedAt: new Date() })
      .where(eq(this.connections.id, id));
  }

  async remove(
    userId: string,
    provider: ConnectorId,
  ): Promise<Connection | undefined> {
    const [removed] = await db
      .delete(this.connections)
      .where(
        and(
          eq(this.connections.userId, userId),
          eq(this.connections.provider, provider),
        ),
      )
      .returning();

    return removed;
  }
}

export default ConnectionService;
