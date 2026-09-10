import * as z from "zod";
import { tool } from "langchain";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

type Place = {
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

type Current = {
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  is_day: number;
  weather_code: number;
};

const describe = (code: number) => {
  if (code === 0) return { label: "Clear sky", icon: "clear" };
  if (code <= 2) return { label: "Partly cloudy", icon: "partly-cloudy" };
  if (code === 3) return { label: "Overcast", icon: "cloudy" };
  if (code <= 48) return { label: "Fog", icon: "fog" };
  if (code <= 57) return { label: "Drizzle", icon: "drizzle" };
  if (code <= 67) return { label: "Rain", icon: "rain" };
  if (code <= 77) return { label: "Snow", icon: "snow" };
  if (code <= 82) return { label: "Rain showers", icon: "showers" };
  if (code <= 86) return { label: "Snow showers", icon: "snow" };
  return { label: "Thunderstorm", icon: "thunderstorm" };
};

const geocode = async (location: string): Promise<Place | undefined> => {
  const words = location.replace(/,/g, " ").split(/\s+/).filter(Boolean);

  for (let count = words.length; count > 0; count--) {
    const name = words.slice(0, count).join(" ");
    const hint = words.slice(count).join(" ").toLowerCase();

    const response = await fetch(
      `${GEOCODE_URL}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`,
    );

    const { results = [] } = (await response.json()) as { results?: Place[] };

    if (results.length) {
      return (
        results.find((place) =>
          `${place.admin1} ${place.country}`.toLowerCase().includes(hint),
        ) ?? results[0]
      );
    }
  }

  return undefined;
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
        current:
          "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,is_day,weather_code",
        timezone: "auto",
      });

      const response = await fetch(`${FORECAST_URL}?${params}`);
      const { current } = (await response.json()) as { current: Current };

      return {
        found: true,
        location: [place.name, place.admin1].filter(Boolean).join(", "),
        country: place.country,
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        isDay: current.is_day === 1,
        ...describe(current.weather_code),
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
