"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { WeatherContext } from "@/types/chat";

const CITY_KEY = "wearall_weather_city";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Weather API ${r.status}`);
    return r.json();
  });

export function useWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [city, setCity] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(CITY_KEY) ?? "";
  });

  useEffect(() => {
    if (!navigator.geolocation) { setLocationDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setLocationDenied(true)
    );
  }, []);

  function saveCity(name: string) {
    const trimmed = name.trim();
    localStorage.setItem(CITY_KEY, trimmed);
    setCity(trimmed);
  }

  const url = coords
    ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
    : city
    ? `/api/weather?city=${encodeURIComponent(city)}`
    : null;

  const { data, error, isLoading } = useSWR<WeatherContext>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 900_000,
  });

  return { weather: data ?? null, isLoading, error, locationDenied, city, saveCity };
}
