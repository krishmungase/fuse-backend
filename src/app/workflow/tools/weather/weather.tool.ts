import * as z from "zod";
import { tool } from "langchain";

import { geocode } from "./geocode";
import { describeWeather } from "./weather.codes";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_FIELDS =
  "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code";

type Current = {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  is_day: number;
  weather_code: number;
};

export const weatherTool = tool(
  async ({ location }) => {
    try {
      const place = await geocode(location);

      if (!place?.latitude || !place?.longitude) {
        return {
          found: false,
          error: `Could not find a place called "${location}".`,
        };
      }

      const params = new URLSearchParams({
        latitude: String(place.latitude),
        longitude: String(place.longitude),
        current: CURRENT_FIELDS,
        timezone: "auto",
      });

      const response = await fetch(`${FORECAST_URL}?${params}`);
      const { current } = (await response.json()) as { current: Current };

      return {
        found: true,
        location: [place.name, place.admin1].filter(Boolean).join(", "),
        country: place.country,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(
          current.apparent_temperature ?? current.temperature_2m,
        ),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m ?? 0),
        isDay: current.is_day === 1,
        ...describeWeather(current.weather_code),
      };
    } catch {
      return {
        found: false,
        error: "Weather service is unavailable right now.",
      };
    }
  },
  {
    name: "display_weather",
    description:
      "Get today's weather for a place. Call this whenever the user asks about weather, temperature or rain.",
    schema: z.object({
      location: z
        .string()
        .describe("The city to look up, e.g. Barshi, Mumbai, London."),
    }),
  },
);
