const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export type Place = {
  name?: string;
  admin1?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
};

export const geocode = async (location: string): Promise<Place | undefined> => {
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
