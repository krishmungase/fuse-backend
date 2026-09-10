import { WeatherReport } from "../schema/chat.schema";

export const WEATHER_TOOL_NAME = "display_weather";

type RawWeatherResult = Partial<WeatherReport> & { found?: boolean };

const parseToolContent = (content: unknown): RawWeatherResult | undefined => {
  if (typeof content === "object" && content !== null) {
    return content as RawWeatherResult;
  }

  if (typeof content !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(content) as RawWeatherResult;
  } catch {
    return undefined;
  }
};

export const toWeatherReport = (
  content: unknown,
): WeatherReport | undefined => {
  const parsed = parseToolContent(content);

  if (!parsed?.found || !parsed.location || parsed.temperature === undefined) {
    return undefined;
  }

  return parsed as WeatherReport;
};
