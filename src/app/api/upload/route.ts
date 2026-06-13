import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { tagClothingItem } from "@/lib/claude/tagger";
import { TagResult } from "@/types/item";
import { randomUUID } from "crypto";

const MAX_SIZE = 20 * 1024 * 1024;

// ── remove.bg ─────────────────────────────────────────────────────────────────
async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    console.log("remove.bg: no API key — skipping");
    return imageBuffer;
  }
  try {
    const params = new URLSearchParams({
      image_file_b64: imageBuffer.toString("base64"),
      size: "auto",
      type: "product",
      format: "jpg",
      bg_color: "FFFFFF",
    });
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!res.ok) {
      console.error(`remove.bg ${res.status}:`, await res.text().catch(() => ""));
      return imageBuffer;
    }
    const result = Buffer.from(await res.arrayBuffer());
    console.log(`remove.bg: ok (${result.byteLength} bytes)`);
    return result;
  } catch (err) {
    console.error("remove.bg failed:", err);
    return imageBuffer;
  }
}

// ── Catalog image download ────────────────────────────────────────────────────
// Downloads an external image URL server-side so we can store it in Supabase
// instead of linking to a third-party host that may rotate or expire the URL.
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WearAll/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`downloadImage: HTTP ${res.status} for ${url}`);
      return null;
    }
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.startsWith("image/")) {
      console.error(`downloadImage: unexpected content-type "${ct}" for ${url}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`downloadImage: downloaded ${buf.byteLength} bytes from ${url}`);
    return buf;
  } catch (err) {
    console.error("downloadImage failed:", err);
    return null;
  }
}

// ── Catalog image search ──────────────────────────────────────────────────────

// Build a precise search query from AI tagger results — no extra API call needed.
function buildSearchQuery(tags: TagResult | null): string {
  if (!tags) return "";
  const parts: string[] = [];
  if (tags.primary_color && tags.primary_color !== "unknown") parts.push(tags.primary_color);
  if (tags.pattern && tags.pattern !== "solid") parts.push(tags.pattern);
  if (tags.subcategory) parts.push(tags.subcategory);
  parts.push("product photo white background");
  return parts.join(" ");
}

// Google Custom Search API — 100 free queries/day.
// Returns the best matching professional catalog image URL, or null on failure.
async function searchCatalogImage(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_CX;
  if (!apiKey || !cx) {
    console.log("catalog search: no API keys — skipping");
    return null;
  }
  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cx);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("imgType", "photo");
    url.searchParams.set("imgSize", "large");
    url.searchParams.set("safe", "active");
    url.searchParams.set("num", "5");

    const res = await fetch(url.toString());
    if (!res.ok) {
      console.error(`Google search ${res.status}:`, await res.text().catch(() => ""));
      return null;
    }

    const json = await res.json();
    const items: Array<{ link: string }> = json.items ?? [];
    if (!items.length) {
      console.log(`catalog search: no results for "${query}"`);
      return null;
    }

    // Prefer a standard image format; skip GIFs, SVGs, tiny icons
    const pick =
      items.find((i) => /\.(jpe?g|png|webp)(\?|$)/i.test(i.link)) ?? items[0];

    console.log(`catalog search: found "${pick.link}" for query "${query}"`);
    return pick.link;
  } catch (err) {
    console.error("searchCatalogImage failed:", err);
    return null;
  }
}

// ── Upload handler ────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  if (!files.length) return NextResponse.json({ error: "No files provided" }, { status: 400 });

  // Client-detected colors — fallback when AI tagger is skipped for large files
  let colorHints: string[] = [];
  try {
    const raw = formData.get("colorHints");
    if (raw) colorHints = JSON.parse(raw as string);
  } catch { /* ignore */ }

  const serviceClient = createServiceClient();
  const results = [];
  let fileIndex = 0;

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      results.push({ name: file.name, status: "error", error: "File too large (max 20MB)" });
      fileIndex++;
      continue;
    }

    try {
      const rawBuffer = Buffer.from(await file.arrayBuffer());

      // Step 1 — AI background removal
      const cleanBuffer = await removeBackground(rawBuffer);

      // Step 2 — storage upload + AI tagging run in parallel (saves 2-3 s per item)
      const storagePath = `${user.id}/${randomUUID()}.jpg`;
      const [storageResult, tags] = await Promise.all([
        serviceClient.storage.from("wardrobe").upload(storagePath, cleanBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        }),
        cleanBuffer.byteLength <= 3 * 1024 * 1024
          ? tagClothingItem(cleanBuffer.toString("base64"), "image/jpeg").catch(() => null)
          : Promise.resolve(null),
      ]);

      if (storageResult.error) throw new Error(storageResult.error.message);

      // Step 3 — search for professional catalog image and download it into Supabase
      // (storing the raw external URL would break Next.js Image and rot when sites rotate URLs)
      const searchQuery = buildSearchQuery(tags);
      const catalogUrl = searchQuery ? await searchCatalogImage(searchQuery) : null;

      let finalPath = storagePath;
      if (catalogUrl) {
        const catalogBuffer = await downloadImage(catalogUrl);
        if (catalogBuffer) {
          const catalogPath = `${user.id}/${randomUUID()}.jpg`;
          const { error: catErr } = await serviceClient.storage
            .from("wardrobe")
            .upload(catalogPath, catalogBuffer, { contentType: "image/jpeg", upsert: false });
          if (!catErr) {
            finalPath = catalogPath;
            // Remove the now-unused bg-removed original to keep storage clean
            await serviceClient.storage.from("wardrobe").remove([storagePath]);
          } else {
            console.error("catalog upload to Supabase failed:", catErr.message);
          }
        }
      }

      // Step 4 — insert DB record
      const { data: item, error: dbError } = await serviceClient
        .from("items")
        .insert({
          user_id: user.id,
          image_url: finalPath,
          category:         tags?.category         ?? "other",
          subcategory:      tags?.subcategory       ?? null,
          primary_color:    tags?.primary_color     ?? colorHints[fileIndex] ?? null,
          secondary_colors: tags?.secondary_colors  ?? [],
          pattern:          tags?.pattern           ?? null,
          formality:        tags?.formality         ?? "casual",
          season:           tags?.season            ?? ["spring", "summer", "fall", "winter"],
          warmth:           tags?.warmth            ?? "medium",
          notes:            tags?.notes             ?? null,
          wear_count: 0,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      results.push({ name: file.name, status: "done", item });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Upload error:", message);
      results.push({ name: file.name, status: "error", error: message });
    }
    fileIndex++;
  }

  return NextResponse.json(results);
}
