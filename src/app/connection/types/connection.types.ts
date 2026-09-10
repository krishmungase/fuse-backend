import { ConnectorId } from "../constants/connector.constants";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuthStatePayload {
  userId: string;
  provider: ConnectorId;
  purpose: string;
  returnTo?: string;
}

export interface PublicConnection {
  provider: ConnectorId;
  label: string;
  connected: boolean;
  accountEmail: string | null;
  connectedAt: string | null;
}

export interface SaveConnectionInput {
  userId: string;
  provider: ConnectorId;
  tokens: OAuthTokens;
  accountEmail?: string;
}
