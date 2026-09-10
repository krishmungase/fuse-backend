import * as z from "zod";
import { tool } from "langchain";

import {
  buildUrl,
  googleGet,
  ToolUserContext,
  withGoogleAccess,
} from "../google-api.client";
import {
  CALENDAR_PROVIDER,
  CalendarEvent,
  EVENTS_URL,
  toPublicEvent,
} from "./calendar.client";

const MAX_RESULTS = 10;
const DEFAULT_DAYS = 7;
const DAY_MS = 86400000;

export const createListEventsTool = (context: ToolUserContext) =>
  tool(
    async ({ days, date, query }) =>
      withGoogleAccess(context, CALENDAR_PROVIDER, async (accessToken) => {
        const timeMin = date ? new Date(`${date}T00:00:00`) : new Date();
        const timeMax = date
          ? new Date(`${date}T23:59:59`)
          : new Date(timeMin.getTime() + (days ?? DEFAULT_DAYS) * DAY_MS);

        const body = await googleGet<{ items?: CalendarEvent[] }>(
          buildUrl(EVENTS_URL, {
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: "true",
            orderBy: "startTime",
            maxResults: MAX_RESULTS,
            q: query,
          }),
          accessToken,
        );

        const events = (body.items ?? []).map(toPublicEvent);

        return { connected: true, found: events.length > 0, events };
      }),
    {
      name: "list_calendar_events",
      description:
        "List the user's Google Calendar events. Call this for questions about their schedule, meetings or availability. Returns event ids, which are needed to delete an event.",
      schema: z.object({
        days: z
          .number()
          .optional()
          .describe("How many days ahead to look. Defaults to 7."),
        date: z
          .string()
          .optional()
          .describe("A single day to list, as YYYY-MM-DD. Overrides days."),
        query: z
          .string()
          .optional()
          .describe("Optional text to match against event titles."),
      }),
    },
  );
