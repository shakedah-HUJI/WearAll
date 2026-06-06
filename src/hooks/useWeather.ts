"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { WeatherContext } from "@/types/chat";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Weather API ${r.status}`);
    return r.json();
  });

export function useWeather() {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setLocationDenied(true)
    );
  }, []);

  const url = coords
    ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
    : null;

  const { data, error, isLoading } = useSWR<WeatherContext>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 900_000, // 15 min
  });

  return { weather: data ?? null, isLoading, error, locationDenied };
}
