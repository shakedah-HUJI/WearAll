"use client";

import useSWR from "swr";
import { useState } from "react";
import { WeatherContext } from "@/types/chat";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Weather API ${r.status}`);
    return r.json();
  });

export function useWeather() {
  const [city, setCity] = useState("");

  function saveCity(name: string) {
    setCity(name.trim());
  }

  function clearCity() {
    setCity("");
  }

  const url = city ? `/api/weather?city=${encodeURIComponent(city)}` : null;

  const { data, isLoading } = useSWR<WeatherContext>(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 900_000,
  });

  return { weather: data ?? null, isLoading, city, saveCity, clearCity };
}
