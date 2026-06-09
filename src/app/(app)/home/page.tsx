"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useItems } from "@/hooks/useItems";
import { useWeather } from "@/hooks/useWeather";
import { createClient } from "@/lib/supabase/client";
function weatherEmoji(condition: string): string {
  if (condition.includes("clear")) return "☀️";
  if (condition.includes("cloud")) return "⛅";
  if (condition.includes("rain") || condition.includes("drizzle")) return "🌧️";
  if (condition.includes("thunder")) return "⛈️";
  if (condition.includes("snow")) return "❄️";
  if (condition.includes("mist") || condition.includes("fog") || condition.includes("haze")) return "🌫️";
  return "🌡️";
}

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const { allItems, isLoading: itemsLoading } = useItems();
  const { weather, isLoading: weatherLoading, city, saveCity, clearCity } = useWeather();
  const [cityInput, setCityInput] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("display_name").eq("id", user.id).single()
        .then(({ data }) => {
          setDisplayName(data?.display_name ? data.display_name.split(" ")[0] : "");
        });
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const rarelyWorn = [...allItems]
    .sort((a, b) => (a.wear_count ?? 0) - (b.wear_count ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen px-5 pt-14 pb-28">

      {/* Name prompt */}
      {displayName === "" && (
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
        <p className="text-sm text-[#8A817A] font-medium tracking-wide uppercase">{greeting}</p>
        <h1 className="font-serif text-[2.1rem] leading-tight text-[#2B2622] italic mt-1">
          {displayName === null ? (
            <span className="inline-block w-36 h-9 bg-[#ECE6DF] rounded-lg animate-pulse" />
          ) : (
            <>Hello, {displayName || "there"}</>
          )}
        </h1>
        <p className="text-[#8A817A] mt-2 text-sm leading-relaxed">
          Here's a look at your wardrobe today.
        </p>
      </div>

      {/* Destination weather */}
      {!city ? (
        <div className="bg-white rounded-[16px] border border-[#ECE6DF] px-4 py-3 mb-5">
          <p className="text-xs text-[#8A817A] mb-2">📍 Where are you going today?</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (cityInput.trim()) saveCity(cityInput.trim());
            }}
            className="flex gap-2"
          >
            <input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="e.g. Tel Aviv"
              className="flex-1 px-3 py-2 rounded-[12px] border border-[#ECE6DF] text-sm text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A]"
            />
            <button
              type="submit"
              disabled={!cityInput.trim()}
              className="px-4 py-2 rounded-full bg-gradient-to-br from-[#C97B5A] to-[#D4856A] text-white text-sm font-semibold disabled:opacity-40"
            >
              Go
            </button>
          </form>
        </div>
      ) : (
        <>
          {weatherLoading && (
            <div className="flex items-center gap-3 bg-white rounded-[16px] border border-[#ECE6DF] px-4 py-3 mb-5 animate-pulse">
              <div className="w-8 h-8 bg-[#ECE6DF] rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 bg-[#ECE6DF] rounded" />
                <div className="h-3 w-36 bg-[#ECE6DF] rounded" />
              </div>
            </div>
          )}
          {weather && (
            <div className="flex items-center gap-3 bg-white rounded-[16px] border border-[#ECE6DF] px-4 py-3 mb-5 shadow-[0_1px_8px_rgba(43,38,34,0.05)]">
              <span className="text-2xl shrink-0">{weatherEmoji(weather.condition)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2B2622]">
                  {city} · {weather.temp_c}°C &middot; <span className="capitalize">{weather.description}</span>
                </p>
                <p className="text-xs text-[#8A817A]">
                  Feels like {weather.feels_like_c}°C · {weather.humidity}% humidity
                </p>
              </div>
              <button
                onClick={() => { clearCity(); setCityInput(""); }}
                className="text-xs text-[#C97B5A] font-semibold shrink-0 ml-2"
              >
                Change
              </button>
            </div>
          )}
        </>
      )}

      {/* Rarely worn */}
      {!itemsLoading && rarelyWorn.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-[#2B2622]">Rarely worn</p>
            <button
              onClick={() => router.push("/closet")}
              className="text-xs text-[#8A817A]"
            >
              See all
            </button>
          </div>
          <p className="text-xs text-[#8A817A] mb-3">These pieces deserve more love</p>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {rarelyWorn.map((item) => (
              <button
                key={item.id}
                onClick={() => router.push("/closet")}
                className="shrink-0 flex flex-col items-center gap-1.5"
              >
                <div className="w-[88px] h-[88px] rounded-[18px] overflow-hidden bg-[#ECE6DF]">
                  {item.signed_url ? (
                    <img
                      src={item.signed_url}
                      alt={item.subcategory ?? item.category}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#8A817A] text-lg">
                      👗
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#8A817A] text-center truncate w-[88px] capitalize">
                  {item.subcategory ?? item.category}
                </p>
                <p className="text-[10px] text-[#D8A8A0] font-medium">
                  worn {item.wear_count ?? 0}×
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-auto pt-4">
        <button
          onClick={() => router.push("/chat/new")}
          className="w-full py-4 rounded-full bg-gradient-to-br from-[#C97B5A] to-[#D4856A] text-white font-semibold text-base active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(201,123,90,0.4)] hover:shadow-[0_6px_24px_rgba(201,123,90,0.5)]"
        >
          Chat with your AI Stylist ✨
        </button>
      </div>
    </div>
  );
}
