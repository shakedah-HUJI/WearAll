import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
];

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");

  if (!raw) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Build a realistic browser Referer using the brand's main domain.
  // CDNs like static.nike.com expect Referer: https://www.nike.com/ not
  // https://static.nike.com/, so we strip the subdomain and prepend "www.".
  function mainReferer(h: URL): string {
    const parts = h.hostname.split(".");
    // Handle CCTLDs: co.uk, co.il, com.au, etc.
    const lastTwo = parts.slice(-2).join(".");
    const ccTLDs = ["co.uk","co.il","com.au","co.nz","co.jp","co.kr","co.in"];
    const domain = ccTLDs.includes(lastTwo)
      ? parts.slice(-3).join(".")
      : parts.slice(-2).join(".");
    return `https://www.${domain}/`;
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": mainReferer(parsed),
        "sec-fetch-dest": "image",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-site": "cross-site",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return new NextResponse("Upstream error", { status: upstream.status });
    }

    const ct = upstream.headers.get("content-type") ?? "";
    if (!ALLOWED_TYPES.some((t) => ct.startsWith(t))) {
      return new NextResponse("Not an image", { status: 415 });
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Proxy": "wearall-image-proxy",
      },
    });
  } catch {
    return new NextResponse("Failed to fetch", { status: 502 });
  }
}
