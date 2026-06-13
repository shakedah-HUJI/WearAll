"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

// Frosted glass card shared style
const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 4px 28px rgba(17,17,17,0.06), 0 0 0 1px rgba(255,255,255,0.88)",
};

export default function HomePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
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
    fetch("/api/profile/avatar")
      .then(r => r.json())
      .then(({ url }) => setAvatarUrl(url ?? null))
      .catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div
      className="flex flex-col min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(155deg, #FAFAF8 0%, #F0EBE3 100%)" }}
    >
      {/* Ambient depth blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 65% 45% at 10% 88%, rgba(190,172,148,0.11) 0%, transparent 100%)," +
            "radial-gradient(ellipse 55% 38% at 88% 12%, rgba(205,188,165,0.08) 0%, transparent 100%)",
        }}
      />

      <div className="relative flex flex-col flex-1 px-5 pt-14 pb-28">

        {/* Watermark logo — faded mark, not a headline */}
        <div
          className="mb-10 flex items-center gap-1.5"
          style={{ opacity: 0.38, filter: "grayscale(1)" }}
        >
          <svg
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="#111111" strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M12 3C12 3 15 3 15 6C15 7.7 13.7 9 12 9" />
            <path d="M12 9L2 19" />
            <path d="M12 9L22 19" />
            <line x1="2" y1="19" x2="22" y2="19" />
          </svg>
          <span className="font-sans font-black text-[0.6rem] leading-none tracking-[0.24em] text-[#111111] uppercase">
            WearAll
          </span>
        </div>

        {/* Name prompt */}
        {displayName === "" && (
          <div className="mb-6 rounded-[20px] px-4 py-4" style={glass}>
            <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.14em] mb-3">
              Quick intro
            </p>
            <div className="flex items-center gap-2 bg-white/50 rounded-2xl px-3.5 py-2 border border-white/70">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="What's your name?"
                className="flex-1 bg-transparent text-sm text-[#111111] placeholder-[#B0A898] focus:outline-none"
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
                className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center shrink-0 disabled:opacity-25 transition-opacity"
                style={{ boxShadow: "0 2px 8px rgba(17,17,17,0.22)" }}
              >
                <span className="text-white text-sm leading-none">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Greeting + profile */}
        <div className="mb-10 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#B0A898] font-semibold tracking-[0.2em] uppercase mb-2">
              {greeting}
            </p>
            <h1 className="font-sans font-light text-[1.75rem] leading-[1.2] text-[#111111] tracking-tight">
              {displayName === null ? (
                <span className="inline-block w-44 h-8 bg-[#E8E3DC] rounded-xl animate-pulse" />
              ) : (
                <>
                  Hello, <span className="font-semibold" style={{ color: "#1B2A4A" }}>{displayName || "there"}</span>
                </>
              )}
            </h1>
            <p className="text-[#C0B4A6] mt-3 text-[12px] tracking-[0.08em] font-medium">
              Your wardrobe, curated.
            </p>
          </div>
          <Link href="/profile" className="shrink-0 ml-4 mt-1">
            <div
              className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#253E6B] to-[#1B2A4A] flex items-center justify-center"
              style={{ boxShadow: "0 4px 16px rgba(27,42,74,0.28), 0 0 0 2.5px rgba(255,255,255,0.92)" }}
            >
              {displayName === null ? (
                <div className="w-5 h-5 bg-white/30 rounded-full animate-pulse" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-lg leading-none">
                  {displayName ? displayName[0].toUpperCase() : "?"}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Destination / weather */}
        {!city ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (cityInput.trim()) saveCity(cityInput.trim());
            }}
            className="mb-6 rounded-[18px] px-4 py-3.5 flex items-center gap-3"
            style={glass}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0B4A6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            <input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Where are you going today?"
              className="flex-1 bg-transparent text-sm text-[#111111] placeholder-[#C0B4A6] focus:outline-none min-w-0"
            />
            <button
              type="submit"
              disabled={!cityInput.trim()}
              className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center shrink-0 disabled:opacity-20 transition-opacity"
              style={{ boxShadow: "0 2px 10px rgba(17,17,17,0.28)" }}
            >
              <span className="text-white text-sm leading-none">→</span>
            </button>
          </form>
        ) : (
          <>
            {weatherLoading && (
              <div
                className="mb-6 rounded-[18px] px-4 py-3.5 flex items-center gap-3 animate-pulse"
                style={glass}
              >
                <div className="w-9 h-9 bg-[#E8E3DC] rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-24 bg-[#E8E3DC] rounded" />
                  <div className="h-3 w-36 bg-[#E8E3DC] rounded" />
                </div>
              </div>
            )}
            {weather && (
              <div
                className="mb-6 rounded-[18px] px-4 py-3.5 flex items-center gap-3"
                style={glass}
              >
                <span className="text-2xl shrink-0">{weatherEmoji(weather.condition)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111111]">
                    {city} · {weather.temp_c}°C
                    <span className="font-normal text-[#9CA3AF] ml-1 capitalize">
                      {weather.description}
                    </span>
                  </p>
                  <p className="text-[11px] text-[#C0B4A6] mt-0.5">
                    Feels {weather.feels_like_c}°C · {weather.humidity}% humidity
                  </p>
                </div>
                <button
                  onClick={() => { clearCity(); setCityInput(""); }}
                  className="text-[10px] text-[#B0A898] font-semibold tracking-[0.12em] shrink-0 ml-2 uppercase"
                >
                  Change
                </button>
              </div>
            )}
          </>
        )}

        {/* CTA */}
        <div className="mt-auto pt-4">
          <button
            onClick={() => router.push("/chat/new")}
            className="w-full py-[18px] bg-[#111111] text-white text-[10px] font-black tracking-[0.24em] uppercase active:scale-[0.99] transition-all"
            style={{ boxShadow: "0 8px 32px rgba(17,17,17,0.20)" }}
          >
            Chat with Mia →
          </button>
        </div>

      </div>
    </div>
  );
}
