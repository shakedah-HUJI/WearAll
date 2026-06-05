import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  const { data: items, error } = await serviceClient
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json([]);
  }

  const itemsWithUrls = await Promise.all(
    items.map(async (item) => {
      try {
        const { data } = await serviceClient.storage
          .from("wardrobe")
          .createSignedUrl(item.image_url, 3600);
        return { ...item, signed_url: data?.signedUrl ?? null };
      } catch {
        return { ...item, signed_url: null };
      }
    })
  );

  return NextResponse.json(itemsWithUrls);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  const body = await request.json();
  const { data, error } = await serviceClient
    .from("items")
    .insert({ ...body, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
