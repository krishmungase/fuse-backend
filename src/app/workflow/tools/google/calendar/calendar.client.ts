export const EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const CALENDAR_PROVIDER = "google-calendar" as const;

export type CalendarEvent = {
  id?: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

export const toPublicEvent = (event: CalendarEvent) => ({
  id: event.id,
  title: event.summary ?? "(no title)",
  start: event.start?.dateTime ?? event.start?.date,
  end: event.end?.dateTime ?? event.end?.date,
  location: event.location,
  meetLink: event.hangoutLink,
  link: event.htmlLink,
});
