import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { tagClothingItem } from "@/lib/claude/tagger";
import { randomUUID } from "crypto";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];

  if (!files.length) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  // Client-detected colors (ordered by file index) — fallback when AI tagger skips large files
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
      continue;
    }

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const storagePath = `${user.id}/${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: storageError } = await serviceClient.storage
        .from("wardrobe")
        .upload(storagePath, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });

      if (storageError) throw new Error(storageError.message);

      // Tag the item with AI (non-fatal — falls back to defaults)
      // Skip if buffer is very large to avoid memory/timeout issues
      let tags = null;
      if (buffer.byteLength <= 3 * 1024 * 1024) {
        try {
          const base64 = buffer.toString("base64");
          const mime = (file.type === "image/png" ? "image/png" : "image/jpeg") as
            | "image/jpeg"
            | "image/png";
          tags = await tagClothingItem(base64, mime);
        } catch {
          // tagging failed — insert with defaults below
        }
      }

      const { data: item, error: dbError } = await serviceClient
        .from("items")
        .insert({
          user_id: user.id,
          image_url: storagePath,
          category: tags?.category ?? "other",
          subcategory: tags?.subcategory ?? null,
          primary_color: tags?.primary_color ?? colorHints[fileIndex] ?? null,
          secondary_colors: tags?.secondary_colors ?? [],
          pattern: tags?.pattern ?? null,
          formality: tags?.formality ?? "casual",
          season: tags?.season ?? ["spring", "summer", "fall", "winter"],
          warmth: tags?.warmth ?? "medium",
          notes: tags?.notes ?? null,
          wear_count: 0,
        })
        .select()
        .single();

      if (dbError) throw new Error(dbError.message);

      results.push({ name: file.name, status: "done", item });
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err) ?? "Unknown error";
      console.error("Upload error:", message, err);
      results.push({ name: file.name, status: "error", error: message });
    }
    fileIndex++;
  }

  return NextResponse.json(results);
}
