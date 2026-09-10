const GOOGLE_OAUTH = {
  family: "google" as const,
  authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  revokeUrl: "https://oauth2.googleapis.com/revoke",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  authorizeParams: {
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
  },
};

const GOOGLE_IDENTITY_SCOPES = ["openid", "email"];

export const CONNECTORS = {
  "google-calendar": {
    id: "google-calendar",
    label: "Google Calendar",
    oauth: GOOGLE_OAUTH,
    scopes: [
      ...GOOGLE_IDENTITY_SCOPES,
      "https://www.googleapis.com/auth/calendar.events",
    ],
  },
  gmail: {
    id: "gmail",
    label: "Gmail",
    oauth: GOOGLE_OAUTH,
    scopes: [
      ...GOOGLE_IDENTITY_SCOPES,
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  },
  "google-drive": {
    id: "google-drive",
    label: "Google Drive",
    oauth: GOOGLE_OAUTH,
    scopes: [
      ...GOOGLE_IDENTITY_SCOPES,
      "https://www.googleapis.com/auth/drive.metadata.readonly",
    ],
  },
} as const;

export type ConnectorId = keyof typeof CONNECTORS;

export type Connector = (typeof CONNECTORS)[ConnectorId];

export const CONNECTOR_IDS = Object.keys(CONNECTORS) as ConnectorId[];

export const isConnectorId = (value: string): value is ConnectorId =>
  Object.prototype.hasOwnProperty.call(CONNECTORS, value);

export const getConnector = (id: ConnectorId): Connector => CONNECTORS[id];

export const TOKEN_EXPIRY_SKEW_SECONDS = 60;

export const OAUTH_STATE_PURPOSE = "oauth_state";

export const OAUTH_STATE_EXPIRES_IN = "10m";
