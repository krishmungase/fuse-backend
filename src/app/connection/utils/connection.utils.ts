import { CONNECTOR_IDS, getConnector } from "../constants/connector.constants";
import { Connection } from "../schema/connection.schema";
import { PublicConnection } from "../types/connection.types";

export const toPublicConnections = (
  connections: Connection[],
): PublicConnection[] => {
  const byProvider = new Map(
    connections.map((connection) => [connection.provider, connection]),
  );

  return CONNECTOR_IDS.map((provider) => {
    const connection = byProvider.get(provider);
    const isActive = connection?.status === "active";

    return {
      provider,
      label: getConnector(provider).label,
      connected: Boolean(isActive),
      accountEmail: isActive ? (connection?.accountEmail ?? null) : null,
      connectedAt: isActive
        ? (connection?.createdAt.toISOString() ?? null)
        : null,
    };
  });
};

export const expiresAtFrom = (expiresIn?: number): Date | null =>
  expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

export const parseScopes = (scope?: string): string[] =>
  scope ? scope.split(/\s+/).filter(Boolean) : [];
