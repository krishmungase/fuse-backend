import * as z from "zod";
import { randomUUID } from "crypto";
import { tool } from "langchain";

import {
  buildUrl,
  googlePost,
  ToolUserContext,
  withGoogleAccess,
} from "../google-api.client";
import {
  CALENDAR_PROVIDER,
  CalendarEvent,
  EVENTS_URL,
  toPublicEvent,
} from "./calendar.client";

const REMINDERS = {
  useDefault: false,
  overrides: [
    { method: "email", minutes: 60 },
    { method: "popup", minutes: 10 },
  ],
};

const meetRequest = () => ({
  conferenceData: {
    createRequest: {
      requestId: randomUUID(),
      conferenceSolutionKey: { type: "hangoutsMeet" },
    },
  },
});

export const createCreateEventTool = (context: ToolUserContext) =>
  tool(
    async ({ summary, start, end, attendees, addMeetLink }) =>
      withGoogleAccess(context, CALENDAR_PROVIDER, async (accessToken) => {
        const event = await googlePost<CalendarEvent>(
          buildUrl(EVENTS_URL, {
            conferenceDataVersion: addMeetLink ? 1 : 0,
            sendUpdates: attendees?.length ? "all" : "none",
          }),
          accessToken,
          {
            summary,
            start: { dateTime: start },
            end: { dateTime: end },
            attendees: attendees?.map((email) => ({ email })),
            guestsCanSeeOtherGuests: true,
            guestsCanInviteOthers: false,
            reminders: REMINDERS,
            ...(addMeetLink ? meetRequest() : {}),
          },
        );

        return { connected: true, created: true, event: toPublicEvent(event) };
      }),
    {
      name: "create_calendar_event",
      description:
        "Create an event on the user's Google Calendar, optionally with attendees and a Google Meet link. Confirm the title, date, time and attendees with the user before calling this.",
      schema: z.object({
        summary: z.string().describe("Title of the event."),
        start: z
          .string()
          .describe(
            "Start time in RFC3339 with offset, e.g. 2026-09-15T16:00:00+05:30.",
          ),
        end: z
          .string()
          .describe("End time in RFC3339 with offset, same shape as start."),
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
