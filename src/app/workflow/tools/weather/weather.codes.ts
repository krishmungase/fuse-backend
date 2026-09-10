export const describeWeather = (code: number) => {
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
