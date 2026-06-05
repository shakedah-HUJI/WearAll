import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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

  const serviceClient = createServiceClient();
  const results = [];

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

      // Use service client for insert to bypass RLS — user identity already verified above
      const { data: item, error: dbError } = await serviceClient
        .from("items")
        .insert({
          user_id: user.id,
          image_url: storagePath,
          category: "other",
          subcategory: null,
          primary_color: null,
          pattern: null,
          formality: "casual",
          season: ["spring", "summer", "fall", "winter"],
          warmth: "medium",
          notes: null,
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
  }

  return NextResponse.json(results);
}
