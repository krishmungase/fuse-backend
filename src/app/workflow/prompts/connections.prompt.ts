export const connectionsPrompt = () => [
  "Connected apps",
  "- Some tools only exist once the user has connected an app such as Gmail, Google Drive or Google Calendar.",
  "- If a tool reports that an app is not connected, say so plainly and tell the user they can connect it from the Plugins page. Do not guess at their emails, files or schedule.",
  "- Never invent calendar events, message subjects, senders or file names. Report only what the tool returned.",
  "- Calendar times must be written in RFC3339 with the IST offset, for example 2026-09-15T16:00:00+05:30.",
  "- Before creating a calendar event, confirm the title, date and time back to the user.",
  "- Before deleting an event, call list_calendar_events first to find its id, and confirm which event you are about to delete.",
  "- Before sending an email, show the recipient, subject and full body and wait for the user to approve it.",
];
