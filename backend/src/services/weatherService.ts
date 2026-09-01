// Free, no-API-key weather via Open-Meteo. Two calls: geocode the city name
// to lat/lon, then fetch current conditions for that point.

export interface GeocodedCity {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  tempC: number;
  weatherCode: number;
}

export async function geocodeCity(city: string): Promise<GeocodedCity | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);
  const data = (await res.json()) as {
    results?: Array<{ name: string; latitude: number; longitude: number; admin1?: string; country?: string }>;
  };

  const first = data.results?.[0];
  if (!first) return null;

  return { name: first.name, latitude: first.latitude, longitude: first.longitude };
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast request failed: ${res.status}`);
  const data = (await res.json()) as {
    current?: { temperature_2m: number; weather_code: number };
  };

  if (!data.current) throw new Error('Forecast response missing current conditions');

  return { tempC: data.current.temperature_2m, weatherCode: data.current.weather_code };
}

// Maps a temperature to one of the app's 4 granular seasons. This is a
// simple heuristic (not hemisphere/calendar-aware) — it's meant to pick the
// wardrobe category that actually fits how it feels outside right now.
export function mapTempToSeason(tempC: number): 'winter' | 'fall' | 'spring' | 'summer' {
  if (tempC < 10) return 'winter';
  if (tempC < 18) return 'fall';
  if (tempC < 26) return 'spring';
  return 'summer';
}

// WMO weather codes (used by Open-Meteo) collapsed into short human labels.
export function describeWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mostly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unsettled weather';
}
