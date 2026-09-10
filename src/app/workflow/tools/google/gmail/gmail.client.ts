export const MESSAGES_URL =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages";

export const GMAIL_PROVIDER = "gmail" as const;

export type MessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
};

export type MessageDetail = {
  id?: string;
  threadId?: string;
  snippet?: string;
  payload?: MessagePart & { headers?: { name?: string; value?: string }[] };
};

export const findBody = (
  part: MessagePart | undefined,
  mimeType: string,
): string | null => {
  if (!part) {
    return null;
  }

  if (part.mimeType === mimeType && part.body?.data) {
    return part.body.data;
  }

  for (const child of part.parts ?? []) {
    const found = findBody(child, mimeType);
    if (found) {
      return found;
    }
  }

  return null;
};

export const headerValue = (detail: MessageDetail, name: string) =>
  detail.payload?.headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  )?.value ?? "";
