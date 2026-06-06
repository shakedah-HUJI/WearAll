import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStylistResponse, ConversationTurn } from "@/lib/claude/stylist";
import { getWeather } from "@/lib/weather";
import { ClothingItem } from "@/types/item";
import { MessageContent } from "@/types/chat";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { message, threadId: existingThreadId, lat, lon } = body as {
    message: string;
    threadId?: string;
    lat?: number;
    lon?: number;
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  // Get or create thread
  let threadId = existingThreadId;
  if (!threadId) {
    const { data: thread, error } = await supabase
      .from("threads")
      .insert({ user_id: user.id, title: message.slice(0, 80) })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    threadId = thread.id;
  }

  // Persist user message
  await supabase.from("messages").insert({
    thread_id: threadId,
    user_id: user.id,
    role: "user",
    content: { type: "text", text: message },
  });

  // Fetch conversation history (last 10 messages)
  const { data: rawHistory } = await supabase
    .from("messages")
    .select("role, content")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(20);

  function contentToText(c: unknown): string {
    if (typeof c === "string") return c;
    const mc = c as MessageContent;
    if (mc.type === "text") return mc.text ?? "";
    if (mc.type === "clarify") {
      // First element is the question, rest are chip options
      const [question, ...options] = mc.questions ?? [];
      return options.length
        ? `${question} (options: ${options.join(", ")})`
        : (question ?? "");
    }
    if (mc.type === "outfit") {
      const n = mc.outfits?.length ?? 0;
      return `[Suggested ${n} outfit${n !== 1 ? "s" : ""}]`;
    }
    return JSON.stringify(c);
  }

  const history: ConversationTurn[] = (rawHistory ?? [])
    .slice(-10)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: contentToText(m.content),
    }));

  // Fetch weather (server-side)
  let weather = null;
  if (lat != null && lon != null) {
    try {
      weather = await getWeather(lat, lon);
    } catch {
      // Non-fatal — proceed without weather
    }
  }

  // Fetch user's wardrobe
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user.id)
    .order("wear_count", { ascending: true });

  const isFirstTurn = history.filter((h) => h.role === "user").length <= 1;

  // Generate stylist response
  const stylistResult = await generateStylistResponse({
    userMessage: message,
    history: history.slice(0, -1), // exclude the just-added user message
    items: (items ?? []) as ClothingItem[],
    weather,
    isFirstTurn,
  });

  // Build the assistant message content
  let assistantContent: MessageContent;
  if (stylistResult.type === "clarify") {
    assistantContent = {
      type: "clarify",
      questions: stylistResult.questions,
    };
  } else {
    assistantContent = {
      type: "outfit",
      outfits: stylistResult.outfits,
    };
  }

  // Persist assistant message
  const { data: assistantMessage } = await supabase
    .from("messages")
    .insert({
      thread_id: threadId,
      user_id: user.id,
      role: "assistant",
      content: assistantContent,
    })
    .select()
    .single();

  return NextResponse.json({
    threadId,
    message: assistantMessage,
    weather,
  });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get("threadId");

  if (!threadId) {
    // Return all threads
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Return messages for a specific thread
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
