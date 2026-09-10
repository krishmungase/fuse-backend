import * as z from "zod";
import { randomUUID } from "crypto";
import { tool } from "langchain";

import {
  buildUrl,
  googleDelete,
  googleGet,
  googlePost,
  ToolUserContext,
  withGoogleAccess,
} from "./google-api.client";

const EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const PROVIDER = "google-calendar" as const;

const MAX_RESULTS = 10;
const DEFAULT_DAYS = 7;

type CalendarEvent = {
  id?: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

const toPublicEvent = (event: CalendarEvent) => ({
  id: event.id,
  title: event.summary ?? "(no title)",
  start: event.start?.dateTime ?? event.start?.date,
  end: event.end?.dateTime ?? event.end?.date,
  location: event.location,
  meetLink: event.hangoutLink,
  link: event.htmlLink,
});

export const createCalendarListTool = (context: ToolUserContext) =>
  tool(
    async ({ days, date, query }) =>
      withGoogleAccess(context, PROVIDER, async (accessToken) => {
        const timeMin = date ? new Date(`${date}T00:00:00`) : new Date();

        const timeMax = date
          ? new Date(`${date}T23:59:59`)
          : new Date(timeMin.getTime() + (days ?? DEFAULT_DAYS) * 86400000);

        const url = buildUrl(EVENTS_URL, {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          singleEvents: "true",
          orderBy: "startTime",
          maxResults: MAX_RESULTS,
          q: query,
        });

        const body = await googleGet<{ items?: CalendarEvent[] }>(
          url,
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

export const createCalendarCreateTool = (context: ToolUserContext) =>
  tool(
    async ({ summary, start, end, attendees, addMeetLink }) =>
      withGoogleAccess(context, PROVIDER, async (accessToken) => {
        const url = buildUrl(EVENTS_URL, {
          conferenceDataVersion: addMeetLink ? 1 : 0,
          sendUpdates: attendees?.length ? "all" : "none",
        });

        const payload = {
          summary,
          start: { dateTime: start },
          end: { dateTime: end },
          attendees: attendees?.map((email) => ({ email })),
          guestsCanSeeOtherGuests: true,
          guestsCanInviteOthers: false,
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 60 },
              { method: "popup", minutes: 10 },
            ],
          },
          ...(addMeetLink
            ? {
                conferenceData: {
                  createRequest: {
                    requestId: randomUUID(),
                    conferenceSolutionKey: { type: "hangoutsMeet" },
                  },
                },
              }
            : {}),
        };

        const event = await googlePost<CalendarEvent>(
          url,
          accessToken,
          payload,
        );

        return { connected: true, created: true, event: toPublicEvent(event) };
      }),
    {
      name: "create_calendar_event",
      description:
        "Create an event on the user's Google Calendar, optionally with attendees and a Google Meet link. Confirm the date, time and attendees with the user before calling this.",
      schema: z.object({
        summary: z.string().describe("Title of the event."),
        start: z
          .string()
          .describe(
            "Start time in RFC3339 format, e.g. 2026-09-15T14:00:00+05:30.",
          ),
        end: z
          .string()
          .describe("End time in RFC3339 format, same shape as start."),
        attendees: z
          .array(z.string())
          .optional()
          .describe("Email addresses to invite."),
        addMeetLink: z
          .boolean()
          .optional()
          .describe("Attach a Google Meet link. Defaults to false."),
      }),
    },
  );

export const createCalendarDeleteTool = (context: ToolUserContext) =>
  tool(
    async ({ eventId }) =>
      withGoogleAccess(context, PROVIDER, async (accessToken) => {
        await googleDelete(`${EVENTS_URL}/${eventId}`, accessToken);

        return { connected: true, deleted: true, eventId };
      }),
    {
      name: "delete_calendar_event",
      description:
        "Delete an event from the user's Google Calendar. You must first call list_calendar_events to get the event id, and confirm with the user which event they mean before deleting.",
      schema: z.object({
        eventId: z
          .string()
          .describe("The event id returned by list_calendar_events."),
      }),
    },
  );
