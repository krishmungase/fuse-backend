import {
  ConnectorId,
  getConnector,
} from "../../../connection/constants/connector.constants";
import AccessTokenService from "../../../connection/services/access-token.service";

export interface ToolUserContext {
  userId: string;
  accessTokenService: AccessTokenService;
}

export interface NotConnectedResult {
  connected: false;
  error: string;
}

const notConnected = (provider: ConnectorId): NotConnectedResult => ({
  connected: false,
  error: `${getConnector(provider).label} is not connected. Tell the user to connect it from the Plugins page, then try again.`,
});

export const withGoogleAccess = async <T>(
  context: ToolUserContext,
  provider: ConnectorId,
  run: (accessToken: string) => Promise<T>,
): Promise<T | NotConnectedResult> => {
  const accessToken = await context.accessTokenService.resolve(
    context.userId,
    provider,
  );

  if (!accessToken) {
    return notConnected(provider);
  }

  try {
    return await run(accessToken);
  } catch {
    return {
      connected: false,
      error: `Could not reach ${getConnector(provider).label} right now.`,
    };
  }
};

export const googleGet = async <T>(
  url: string,
  accessToken: string,
): Promise<T> => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export const googlePost = async <T>(
  url: string,
  accessToken: string,
  payload: unknown,
): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Google request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

export const googleDelete = async (
  url: string,
  accessToken: string,
): Promise<void> => {
  const response = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok && response.status !== 410) {
    throw new Error(`Google request failed with ${response.status}`);
  }
};

export const buildUrl = (
  base: string,
  params: Record<string, string | number | undefined>,
): string => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.append(key, String(value));
    }
  });

  return `${base}?${search}`;
};
