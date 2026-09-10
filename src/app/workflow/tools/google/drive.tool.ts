import * as z from "zod";
import { tool } from "langchain";

import {
  buildUrl,
  googleGet,
  ToolUserContext,
  withGoogleAccess,
} from "./google-api.client";

const FILES_URL = "https://www.googleapis.com/drive/v3/files";

const MAX_RESULTS = 10;

type DriveFile = {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  webViewLink?: string;
};

const escapeQuery = (value: string) => value.replace(/'/g, "\\'");

export const createDriveTool = (context: ToolUserContext) =>
  tool(
    async ({ query }) =>
      withGoogleAccess(context, "google-drive", async (accessToken) => {
        const url = buildUrl(FILES_URL, {
          q: `name contains '${escapeQuery(query)}' and trashed = false`,
          fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
          pageSize: MAX_RESULTS,
          orderBy: "modifiedTime desc",
        });

        const body = await googleGet<{ files?: DriveFile[] }>(url, accessToken);

        const files = (body.files ?? []).map((file) => ({
          name: file.name,
          type: file.mimeType,
          modified: file.modifiedTime,
          link: file.webViewLink,
        }));

        return { connected: true, found: files.length > 0, files };
      }),
    {
      name: "search_drive",
      description:
        "Search the user's Google Drive by file name and return matching files with links. Use for questions about their documents, sheets or slides.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "Text to match against file names, e.g. 'invoice', 'Q3 report'.",
          ),
      }),
    },
  );
