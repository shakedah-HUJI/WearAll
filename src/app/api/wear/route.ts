import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { item_ids } = (await request.json()) as { item_ids: string[] };

  if (!Array.isArray(item_ids) || item_ids.length === 0) {
    return NextResponse.json({ error: "item_ids array required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Fetch current wear counts for all items (RLS ensures they belong to this user)
  const serviceClient = createServiceClient();
  const { data: items, error: fetchError } = await serviceClient
    .from("items")
    .select("id, wear_count")
    .in("id", item_ids)
    .eq("user_id", user.id);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  await Promise.all(
    (items ?? []).map((item) =>
      serviceClient
        .from("items")
        .update({ wear_count: item.wear_count + 1, last_worn: now })
        .eq("id", item.id)
    )
  );

  return NextResponse.json({ success: true, updated: (items ?? []).length });
}
