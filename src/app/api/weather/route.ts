import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWeather, getWeatherByCity } from "@/lib/weather";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const city = searchParams.get("city");

  try {
    let weather;
    if (lat && lon) {
      weather = await getWeather(parseFloat(lat), parseFloat(lon));
    } else if (city) {
      weather = await getWeatherByCity(city);
    } else {
      return NextResponse.json({ error: "lat/lon or city required" }, { status: 400 });
    }
    return NextResponse.json(weather);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Weather unavailable";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
