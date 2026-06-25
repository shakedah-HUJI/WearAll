import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { EssentialTemplate } from "@/data/essentials";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { items: EssentialTemplate[] };
  const { items } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  if (items.length > 50) {
    return NextResponse.json({ error: "Too many items" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Strip the display-only `label` field; keep `image_url` if provided so the
  // item shows its catalog photo in the closet (the GET /api/items handler
  // already passes external http URLs through directly as signed_url).
  const rows = items.map(({ label: _label, image_url: catalogUrl, ...rest }) => ({
    ...rest,
    user_id: user.id,
    image_url: catalogUrl ?? "",
    wear_count: 0,
    last_worn: null,
  }));

  const { data, error } = await serviceClient
    .from("items")
    .insert(rows)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
