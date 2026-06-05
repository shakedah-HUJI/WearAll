"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Wind, Droplets, Thermometer, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WeatherContext } from "@/types/chat";

const WEATHER_ICON: Record<string, string> = {
  clear: "☀️",
  clouds: "☁️",
  rain: "🌧️",
  drizzle: "🌦️",
  snow: "❄️",
  thunderstorm: "⛈️",
  mist: "🌫️",
  fog: "🌫️",
  haze: "🌫️",
};

function getWeatherTip(temp: number, condition: string): string {
  if (condition.includes("rain") || condition.includes("drizzle"))
    return "Don't forget a waterproof layer!";
  if (temp < 10) return "It's cold — time to layer up!";
  if (temp < 18) return "Perfect weather for layering!";
  if (temp < 25) return "Great weather for almost anything!";
  return "Keep it light and breathable!";
}

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [destination, setDestination] = useState("");
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState<WeatherContext | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setDisplayName(data?.display_name ? data.display_name.split(" ")[0] : "");
        });
    });
  }, []);

  // Fetch weather when destination changes (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!destination.trim() || destination.trim().length < 3) {
      setWeather(null);
      setWeatherError("");
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setWeatherLoading(true);
      setWeatherError("");
      try {
        const res = await fetch(`/api/weather?city=${encodeURIComponent(destination.trim())}`);
        if (!res.ok) throw new Error("City not found");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setWeather(data);
      } catch {
        setWeather(null);
        setWeatherError("City not found — try another name");
      } finally {
        setWeatherLoading(false);
      }
    }, 800);
  }, [destination]);

  function handleStartChat() {
    const parts = [];
    if (destination) parts.push(`I'm heading to ${destination}`);
    if (occasion) parts.push(`for ${occasion}`);
    if (weather) parts.push(`The weather there is ${weather.temp_c}°C and ${weather.description}`);
    const message = parts.length
      ? parts.join(". ") + ". Help me pick an outfit!"
      : "Help me pick an outfit for today!";
    router.push(`/chat/new?q=${encodeURIComponent(message)}`);
  }

  const weatherIcon = weather ? WEATHER_ICON[weather.condition] ?? "🌡️" : null;

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-28">
      {/* Name prompt for users without a saved name */}
      {displayName === "" && displayName !== null && (
        <div className="mb-6 bg-white rounded-[20px] border border-[#ECE6DF] p-4">
          <p className="text-sm font-semibold text-[#2B2622] mb-2">What's your name?</p>
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Sofia"
              className="flex-1 px-4 py-2.5 rounded-[14px] border border-[#ECE6DF] text-sm text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A]"
            />
            <button
              disabled={!nameInput.trim() || savingName}
              onClick={async () => {
                setSavingName(true);
                await fetch("/api/profile", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ display_name: nameInput.trim() }),
                });
                setDisplayName(nameInput.trim().split(" ")[0]);
                setSavingName(false);
              }}
              className="px-4 py-2.5 rounded-full bg-[#C97B5A] text-white text-sm font-semibold disabled:opacity-40"
            >
              {savingName ? "…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <p className="text-sm text-[#8A817A] font-medium">
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}
        </p>
        <h1 className="text-3xl font-semibold text-[#2B2622] tracking-tight mt-0.5">
          {displayName === null ? (
            <span className="inline-block w-32 h-8 bg-[#ECE6DF] rounded-lg animate-pulse" />
          ) : (
            <>Hello, {displayName || "there"}! 👋</>
          )}
        </h1>
        <p className="text-[#8A817A] mt-2 leading-relaxed">
          Where are you heading today? Tell me your destination and occasion and I'll put together the perfect look.
        </p>
      </div>

      {/* Destination input */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-[#2B2622] mb-2 block">
          📍 Where are you going?
        </label>
        <div className="relative">
          <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A817A]" />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City or place, e.g. Tel Aviv"
            className="w-full pl-10 pr-4 py-3.5 rounded-[16px] border border-[#ECE6DF] bg-white text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A] focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Occasion input */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-[#2B2622] mb-2 block">
          ✨ What's the occasion?
        </label>
        <input
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          placeholder="e.g. work meeting, dinner date, casual day out"
          className="w-full px-4 py-3.5 rounded-[16px] border border-[#ECE6DF] bg-white text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A] focus:border-transparent text-sm"
        />
      </div>

      {/* Weather card */}
      {weatherLoading && (
        <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-[18px] border border-[#ECE6DF] mb-5">
          <Loader2 size={16} className="animate-spin text-[#C97B5A]" />
          <span className="text-sm text-[#8A817A]">Checking weather in {destination}…</span>
        </div>
      )}

      {weatherError && !weatherLoading && (
        <div className="px-4 py-3 bg-white rounded-[18px] border border-[#ECE6DF] mb-5">
          <p className="text-sm text-[#8A817A]">{weatherError}</p>
        </div>
      )}

      {weather && !weatherLoading && (
        <div className="bg-white rounded-[20px] border border-[#ECE6DF] p-4 mb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{weatherIcon}</span>
            <div>
              <p className="font-semibold text-[#2B2622]">
                Right now in {destination}, it's {weather.temp_c}°C
              </p>
              <p className="text-sm text-[#8A817A] capitalize">{weather.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#ECE6DF]">
            <span className="text-xs text-[#8A817A] flex items-center gap-1">
              <Thermometer size={11} /> Feels {weather.feels_like_c}°C
            </span>
            <span className="text-xs text-[#8A817A] flex items-center gap-1">
              <Wind size={11} /> {weather.wind_kph} km/h
            </span>
            <span className="text-xs text-[#8A817A] flex items-center gap-1">
              <Droplets size={11} /> {weather.humidity}%
            </span>
          </div>
          <p className="text-xs text-[#C97B5A] font-medium mt-2">
            💡 {getWeatherTip(weather.temp_c, weather.description)}
          </p>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto">
        <p className="text-center text-sm text-[#8A817A] mb-3">
          Let's build your look for today
        </p>
        <button
          onClick={handleStartChat}
          className="w-full py-4 rounded-full bg-[#C97B5A] text-white font-semibold text-base active:opacity-80 transition-opacity shadow-md"
        >
          Chat with your AI Stylist ✨
        </button>
      </div>
    </div>
  );
}
