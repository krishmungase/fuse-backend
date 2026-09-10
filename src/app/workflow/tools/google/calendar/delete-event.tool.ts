import * as z from "zod";
import { tool } from "langchain";

import {
  googleDelete,
  ToolUserContext,
  withGoogleAccess,
} from "../google-api.client";
import { CALENDAR_PROVIDER, EVENTS_URL } from "./calendar.client";

export const createDeleteEventTool = (context: ToolUserContext) =>
  tool(
    async ({ eventId }) =>
      withGoogleAccess(context, CALENDAR_PROVIDER, async (accessToken) => {
        await googleDelete(`${EVENTS_URL}/${eventId}`, accessToken);

        return { connected: true, deleted: true, eventId };
      }),
    {
      name: "delete_calendar_event",
      description:
        "Delete an event from the user's Google Calendar. Call list_calendar_events first to get the event id, and confirm with the user which event they mean before deleting.",
      schema: z.object({
        eventId: z
          .string()
          .describe("The event id returned by list_calendar_events."),
      }),
    },
  );
