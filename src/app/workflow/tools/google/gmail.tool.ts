import * as z from "zod";
import { tool } from "langchain";

import {
  buildUrl,
  googleGet,
  googlePost,
  ToolUserContext,
  withGoogleAccess,
} from "./google-api.client";
import { buildRawMessage, decodeBase64Url } from "./mime.utils";

const MESSAGES_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

const PROVIDER = "gmail" as const;

const DEFAULT_RESULTS = 5;
const MAX_BODY_LENGTH = 2000;

type MessagePart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: MessagePart[];
};

type MessageDetail = {
  id?: string;
  threadId?: string;
  snippet?: string;
  payload?: MessagePart & { headers?: { name?: string; value?: string }[] };
};

const findBody = (
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

const headerValue = (detail: MessageDetail, name: string) =>
  detail.payload?.headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  )?.value ?? "";

export const createGmailSearchTool = (context: ToolUserContext) =>
  tool(
    async ({ query, maxResults, includeBody }) =>
      withGoogleAccess(context, PROVIDER, async (accessToken) => {
        const list = await googleGet<{ messages?: { id?: string }[] }>(
          buildUrl(MESSAGES_URL, {
            q: query,
            maxResults: maxResults ?? DEFAULT_RESULTS,
          }),
          accessToken,
        );

        const ids = (list.messages ?? [])
          .map((message) => message.id)
          .filter((id): id is string => Boolean(id));

        const details = await Promise.all(
          ids.map((id) =>
            googleGet<MessageDetail>(
              buildUrl(`${MESSAGES_URL}/${id}`, {
                format: includeBody ? "full" : "metadata",
              }),
              accessToken,
            ),
          ),
        );

        const messages = details.map((detail) => {
          const encodedBody = includeBody
            ? (findBody(detail.payload, "text/plain") ??
              findBody(detail.payload, "text/html"))
            : null;

          return {
            id: detail.id,
            from: headerValue(detail, "From"),
            to: headerValue(detail, "To"),
            subject: headerValue(detail, "Subject"),
            date: headerValue(detail, "Date"),
            snippet: detail.snippet,
            ...(encodedBody
              ? {
                  body: decodeBase64Url(encodedBody).slice(0, MAX_BODY_LENGTH),
                }
              : {}),
          };
        });

        return { connected: true, found: messages.length > 0, messages };
      }),
    {
      name: "search_gmail",
      description:
        "Search the user's Gmail. Supports Gmail search syntax such as 'is:unread', 'from:alice@example.com', 'subject:invoice', 'newer_than:7d'. Set includeBody when the user asks what an email actually says.",
      schema: z.object({
        query: z
          .string()
          .describe("Gmail search query, e.g. 'from:flipkart order'."),
        maxResults: z
          .number()
          .min(1)
          .max(20)
          .optional()
          .describe("How many messages to return. Defaults to 5."),
        includeBody: z
          .boolean()
          .optional()
          .describe(
            "Fetch the message body as well as headers. Slower, so only use when the content matters.",
          ),
      }),
    },
  );

export const createGmailSendTool = (context: ToolUserContext) =>
  tool(
    async ({ to, subject, body, cc }) =>
      withGoogleAccess(context, PROVIDER, async (accessToken) => {
        const sent = await googlePost<{ id?: string; threadId?: string }>(
          `${MESSAGES_URL}/send`,
          accessToken,
          { raw: buildRawMessage({ to, subject, body, cc }) },
        );

        return { connected: true, sent: true, id: sent.id, to, subject };
      }),
    {
      name: "send_email",
      description:
        "Send an email from the user's Gmail account. Always show the user the recipient, subject and full body and get their explicit confirmation before calling this. The body is HTML.",
      schema: z.object({
        to: z.array(z.string()).min(1).describe("Recipient email addresses."),
        subject: z.string().min(1).describe("Subject line."),
        body: z.string().describe("Email body. Basic HTML is supported."),
        cc: z.array(z.string()).optional().describe("CC email addresses."),
      }),
    },
  );
