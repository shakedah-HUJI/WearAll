import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const BUCKET = "wardrobe";

function avatarPath(userId: string) {
  return `avatars/${userId}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ url: null });

  const serviceClient = createServiceClient();
  const { data, error } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(avatarPath(user.id), 3600);

  if (error || !data) return NextResponse.json({ url: null });
  return NextResponse.json({ url: data.signedUrl });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  const serviceClient = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await serviceClient.storage
    .from(BUCKET)
    .upload(avatarPath(user.id), buffer, {
      contentType: file.type || "image/jpeg",
      upsert: true,
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: signed } = await serviceClient.storage
    .from(BUCKET)
    .createSignedUrl(avatarPath(user.id), 3600);

  return NextResponse.json({ url: signed?.signedUrl ?? null });
}
