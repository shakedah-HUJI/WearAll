import { WeatherContext } from "@/types/chat";

interface OWMResponse {
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: [{ main: string; description: string }];
}

export async function getWeather(
  lat: number,
  lon: number
): Promise<WeatherContext> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY not configured");

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 900 } }); // cache 15 min

  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data: OWMResponse = await res.json();

  return {
    temp_c: Math.round(data.main.temp),
    feels_like_c: Math.round(data.main.feels_like),
    condition: data.weather[0].main.toLowerCase(),
    humidity: data.main.humidity,
    wind_kph: Math.round(data.wind.speed * 3.6),
    description: data.weather[0].description,
  };
}

export async function getWeatherByCity(city: string): Promise<WeatherContext> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error("OPENWEATHER_API_KEY not configured");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const res = await fetch(url, { next: { revalidate: 900 } });

  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data: OWMResponse = await res.json();

  return {
    temp_c: Math.round(data.main.temp),
    feels_like_c: Math.round(data.main.feels_like),
    condition: data.weather[0].main.toLowerCase(),
    humidity: data.main.humidity,
    wind_kph: Math.round(data.wind.speed * 3.6),
    description: data.weather[0].description,
  };
}
