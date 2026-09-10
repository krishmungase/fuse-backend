import * as z from "zod";
import { tool } from "langchain";

import {
  buildUrl,
  googleGet,
  ToolUserContext,
  withGoogleAccess,
} from "../google-api.client";
import { decodeBase64Url } from "../mime.utils";
import {
  findBody,
  GMAIL_PROVIDER,
  headerValue,
  MESSAGES_URL,
  MessageDetail,
} from "./gmail.client";

const DEFAULT_RESULTS = 5;
const MAX_BODY_LENGTH = 2000;

const toPublicMessage = (detail: MessageDetail, includeBody?: boolean) => {
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
      ? { body: decodeBase64Url(encodedBody).slice(0, MAX_BODY_LENGTH) }
      : {}),
  };
};

export const createSearchMessagesTool = (context: ToolUserContext) =>
  tool(
    async ({ query, maxResults, includeBody }) =>
      withGoogleAccess(context, GMAIL_PROVIDER, async (accessToken) => {
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

        const messages = details.map((detail) =>
          toPublicMessage(detail, includeBody),
        );

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
            "Fetch message bodies as well as headers. Slower, so only use when the content matters.",
          ),
      }),
    },
  );
