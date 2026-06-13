import Groq from "groq-sdk";
import { ClothingItem, ItemFormality, ItemWarmth } from "@/types/item";
import { WeatherContext, OutfitSuggestion } from "@/types/chat";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface StylistParams {
  userMessage: string;
  history: ConversationTurn[];
  items: ClothingItem[];
  weather: WeatherContext | null;
  isFirstTurn: boolean;
}

export type StylistResponse =
  | { type: "clarify"; questions: string[] }
  | { type: "outfit"; outfits: OutfitSuggestion[] };

const STYLIST_SYSTEM = `You are a warm, thoughtful personal stylist named Mia. You help users get dressed from their own wardrobe.

Your personality: encouraging, never judgy, concise, warm. You speak like a stylish friend, not a fashion lecturer.

WEATHER: Provided automatically — NEVER ask about it. Use it silently when suggesting outfits.

━━━ CONTEXT PARSING (most important rule) ━━━
Before responding, extract every clue from the user's message:
- Location (Tel Aviv, the beach, a rooftop, the office…)
- Activity or occasion (trip, date, wedding, job interview, brunch…)
- Mood or vibe (nothing to wear, want to look chic, feeling casual…)
- Any constraints (it's hot, I'll be walking a lot, formal event…)

You MUST acknowledge this context in your response. NEVER reply with a generic question that ignores what the user already told you.

If the user said "I'm going for a trip in Tel Aviv", you already know: location = Tel Aviv, activity = trip, vibe ≈ casual/city. Your only valid follow-up is asking something MORE SPECIFIC that you genuinely don't know yet (beach day vs rooftop dinner vs city wandering).

━━━ WHEN TO CLARIFY ━━━
Only if the vibe or formality is still ambiguous after parsing the message.
- Ask exactly ONE question — make it specific to their context, not generic.
- Offer 3–4 chips that are relevant to what they told you.
- The question text must feel warm and personal, referencing their actual situation.

GOOD example (user said "trip to Tel Aviv"):
{"type":"clarify","questions":["A Tel Aviv trip sounds amazing! 🌊 What's the vibe you're going for?","Casual city exploring","Beachside & relaxed","Rooftop dinner","Effortless chic"]}

BAD example (ignores context — never do this):
{"type":"clarify","questions":["Where are you heading?","Casual day out","Work / meetings","Dinner or date night","Active / gym"]}

━━━ WHEN TO SUGGEST OUTFITS IMMEDIATELY ━━━
- If the occasion AND vibe are both clear enough from the message, skip clarification.
- If the user already answered a clarifying question in this conversation, NEVER ask again — suggest outfits immediately.
- Mention their specific context in every outfit rationale (e.g. "perfect for walking Rothschild Blvd in the Tel Aviv heat").

━━━ OUTFIT STRUCTURE RULES (strictly enforced) ━━━
- Every outfit: exactly ONE "top" OR exactly ONE "dress" — never both, never two tops.
- If "top" used: MUST also include exactly ONE "bottom".
- If "dress" used: do NOT include a "bottom".
- Every outfit MUST include exactly ONE "shoes".
- "outerwear": only when temp_c < 12 or rainy.
- "accessory": optional, at most one per outfit.
- NEVER two items of the same category in one outfit.

━━━ VARIETY & OTHER RULES ━━━
- Each outfit must be clearly different — different top/dress, different vibe or formality level.
- Do not repeat the same item across outfits unless the wardrobe is tiny.
- Only use items from the provided wardrobe — never invent items.
- Favor items with lower wear_count.
- Respect color harmony: complementary, analogous, or neutral pairings.
- Match formality to occasion and location context.
- If weather is rainy, avoid delicate fabrics like silk.
- Rationale: one warm, human sentence referencing their specific context. Call out rarely-worn gems.

Response format when clarifying:
{"type":"clarify","questions":["Your warm, context-aware message","Chip 1","Chip 2","Chip 3"]}

Response format when suggesting outfits:
{"type":"outfit","outfits":[{"outfit_id":"1","item_ids":["uuid","uuid","uuid"],"rationale":"One warm sentence tied to their specific context.","highlight_item_id":"uuid or null"}]}

Return ONLY the JSON — no prose, no markdown.`;

const FORMALITY_RANK: Record<ItemFormality, number> = {
  sporty: 0,
  casual: 1,
  "smart-casual": 2,
  business: 3,
  formal: 4,
};

const WARMTH_RANK: Record<ItemWarmth, number> = {
  light: 0,
  medium: 1,
  warm: 2,
};

function currentSeason(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function inferFormality(occasion: string): ItemFormality {
  const lower = occasion.toLowerCase();
  if (/formal|gala|black.tie/i.test(lower)) return "formal";
  if (/business|meeting|office|work|interview/i.test(lower)) return "business";
  if (/smart|dinner|restaurant|date/i.test(lower)) return "smart-casual";
  if (/sport|gym|workout|run/i.test(lower)) return "sporty";
  return "casual";
}

export function preFilterItems(
  items: ClothingItem[],
  occasion: string,
  weather: WeatherContext | null
): ClothingItem[] {
  const season = currentSeason();
  const targetFormality = inferFormality(occasion);
  const targetFormalityRank = FORMALITY_RANK[targetFormality];
  const tempC = weather?.temp_c ?? 20;

  return items.filter((item) => {
    if (item.season && item.season.length > 0 && !item.season.includes(season as never)) {
      return false;
    }
    if (tempC < 10 && item.warmth === "light" && item.category === "outerwear") {
      return false;
    }
    if (item.formality) {
      const rank = FORMALITY_RANK[item.formality];
      if (Math.abs(rank - targetFormalityRank) > 1) return false;
    }
    return true;
  });
}

function validateAndFixOutfit(
  outfit: OutfitSuggestion,
  allItems: ClothingItem[]
): OutfitSuggestion | null {
  const lookup = new Map(allItems.map((i) => [i.id, i]));

  // Group item IDs by category
  const byCategory = new Map<string, string[]>();
  for (const id of outfit.item_ids) {
    const item = lookup.get(id);
    if (!item) continue;
    const list = byCategory.get(item.category) ?? [];
    list.push(id);
    byCategory.set(item.category, list);
  }

  const tops = byCategory.get("top") ?? [];
  const bottoms = byCategory.get("bottom") ?? [];
  const dresses = byCategory.get("dress") ?? [];
  const shoes = byCategory.get("shoes") ?? [];

  // Must have shoes
  if (shoes.length === 0) return null;

  let fixedIds = [...outfit.item_ids];

  // Can't have both a top and a dress — drop the dress, keep the top
  if (tops.length > 0 && dresses.length > 0) {
    fixedIds = fixedIds.filter((id) => lookup.get(id)?.category !== "dress");
    byCategory.delete("dress");
  }

  // Two or more tops — keep only the first
  const currentTops = byCategory.get("top") ?? [];
  if (currentTops.length > 1) {
    const [keep, ...drop] = currentTops;
    void keep;
    fixedIds = fixedIds.filter((id) => !drop.includes(id));
    byCategory.set("top", [currentTops[0]]);
  }

  // Dress + bottom is invalid — drop the bottom
  if ((byCategory.get("dress") ?? []).length > 0 && bottoms.length > 0) {
    fixedIds = fixedIds.filter((id) => lookup.get(id)?.category !== "bottom");
    byCategory.set("bottom", []);
  }

  // Top with no bottom — invalid
  const finalTops = byCategory.get("top") ?? [];
  const finalBottoms = byCategory.get("bottom") ?? [];
  if (finalTops.length === 1 && finalBottoms.length === 0) return null;

  // More than one bottom — keep only the first
  if (finalBottoms.length > 1) {
    const [keep, ...drop] = finalBottoms;
    void keep;
    fixedIds = fixedIds.filter((id) => !drop.includes(id));
  }

  // Duplicate outerwear / accessories — keep only the first
  for (const cat of ["outerwear", "accessory", "shoes"]) {
    const ids = byCategory.get(cat) ?? [];
    if (ids.length > 1) {
      const [, ...drop] = ids;
      fixedIds = fixedIds.filter((id) => !drop.includes(id));
    }
  }

  // Need at least top+bottom+shoes OR dress+shoes (3+ items minimum)
  if (fixedIds.length < 2) return null;

  return { ...outfit, item_ids: fixedIds };
}

export async function generateStylistResponse(
  params: StylistParams
): Promise<StylistResponse> {
  const { userMessage, history, items, weather, isFirstTurn } = params;

  const candidateItems = preFilterItems(items, userMessage, weather);

  const itemPayload = candidateItems.map((it) => ({
    id: it.id,
    category: it.category,
    subcategory: it.subcategory,
    primary_color: it.primary_color,
    secondary_colors: it.secondary_colors,
    pattern: it.pattern,
    formality: it.formality,
    warmth: it.warmth,
    season: it.season,
    wear_count: it.wear_count,
    notes: it.notes,
  }));

  const weatherBlock = weather
    ? `Weather: ${weather.temp_c}°C, ${weather.description}, wind ${weather.wind_kph}km/h, humidity ${weather.humidity}%.`
    : "Weather: unknown.";

  const contextBlock = `
${weatherBlock}
Wardrobe (${candidateItems.length} candidate items after filtering):
${JSON.stringify(itemPayload)}
  `.trim();

  const recentHistory = history.slice(-10);

  const turnNote = isFirstTurn
    ? "FIRST MESSAGE — parse every detail from the user's message. Acknowledge their specific context (location, activity, vibe) before asking anything."
    : "FOLLOW-UP — the user answered your question. Suggest outfits now, do NOT ask again.";

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: STYLIST_SYSTEM },
    ...recentHistory.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    {
      role: "user",
      content: `${contextBlock}\n\n[${turnNote}]\n\nUser request: ${userMessage}`,
    },
  ];

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1000,
    response_format: { type: "json_object" },
    messages,
  });

  const text = response.choices[0].message.content ?? "{}";

  let parsed: StylistResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      type: "clarify",
      questions: [
        "Tell me a bit about where you're headed and I'll put together some looks for you!",
        "Casual day out",
        "Work / meetings",
        "Dinner or date night",
        "Active / gym",
      ],
    };
  }

  // Validate and repair outfit structure — strip anything the AI got wrong
  if (parsed.type === "outfit") {
    const validOutfits = parsed.outfits
      .map((o) => validateAndFixOutfit(o, items))
      .filter((o): o is OutfitSuggestion => o !== null);

    if (validOutfits.length === 0) {
      // Don't loop back to the same question — tell the user we need more items
      parsed = {
        type: "clarify",
        questions: [
          "I couldn't build a complete outfit — your closet might be missing some basics. Try adding more items!",
          "Add shoes",
          "Add tops",
          "Add bottoms",
        ],
      };
    } else {
      parsed = { ...parsed, outfits: validOutfits };
    }
  }

  return parsed;
}
