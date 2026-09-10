import * as z from "zod";
import { tool } from "langchain";

import {
  googlePost,
  ToolUserContext,
  withGoogleAccess,
} from "../google-api.client";
import { buildRawMessage } from "../mime.utils";
import { GMAIL_PROVIDER, MESSAGES_URL } from "./gmail.client";

export const createSendMessageTool = (context: ToolUserContext) =>
  tool(
    async ({ to, subject, body, cc }) =>
      withGoogleAccess(context, GMAIL_PROVIDER, async (accessToken) => {
        const sent = await googlePost<{ id?: string }>(
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
