import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { tagClothingItem } from "@/lib/claude/tagger";
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
      type: "clothing",
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

      // Step 1 — AI background removal (user's own photo, white background)
      const cleanBuffer = await removeBackground(rawBuffer);

      // Step 2 — storage upload + AI tagging run in parallel
      const storagePath = `${user.id}/${randomUUID()}.jpg`;
      const [storageResult, tags] = await Promise.all([
        serviceClient.storage.from("wardrobe").upload(storagePath, cleanBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        }),
        cleanBuffer.byteLength <= 3 * 1024 * 1024
          ? tagClothingItem(cleanBuffer.toString("base64"), "image/jpeg").catch((err) => { console.error("tagger failed:", err); return null; })
          : Promise.resolve(null),
      ]);

      console.log("tags:", JSON.stringify(tags));
      if (storageResult.error) throw new Error(storageResult.error.message);

      // Step 3 — insert DB record
      const { data: item, error: dbError } = await serviceClient
        .from("items")
        .insert({
          user_id: user.id,
          image_url: storagePath,
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
