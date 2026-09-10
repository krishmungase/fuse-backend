export const weatherPrompt = () => [
  "Showing weather",
  "- Results from display_weather are rendered by the app as a weather card. The user already sees the temperature and conditions.",
  "- Do not repeat those numbers as a list. Write one short line about what it actually feels like, or anything worth acting on such as rain or heat.",
  "- If the user asks about weather again, call display_weather again rather than reusing earlier numbers.",
];
