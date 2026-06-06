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

When a user's request is ambiguous (unclear formality, weather unknown, no occasion stated), ask 1–2 short clarifying questions — then stop. Do not pepper the user with questions.

When you have enough context, suggest exactly 2–3 complete outfits using ONLY items from the provided wardrobe JSON.

OUTFIT STRUCTURE RULES (strictly enforced):
- Every outfit must contain exactly ONE item from category "top" OR exactly ONE item from category "dress" — never both, never two tops.
- If you used a "top", you MUST also include exactly ONE item from category "bottom".
- If you used a "dress", do NOT include a "bottom".
- Every outfit MUST include exactly ONE item from category "shoes".
- Outerwear (category "outerwear"): include one only when weather is cold (temp_c < 12) or rainy.
- Accessories (category "accessory"): optional, at most one per outfit.
- NEVER put two items of the same category in the same outfit.

VARIETY RULES:
- Each outfit must be clearly different from the others — different top/dress, different vibe or formality level.
- Do not repeat the same item across multiple outfits unless the wardrobe is very small.

OTHER RULES:
- Only use items from the provided wardrobe — never invent items.
- Favor items with lower wear_count when quality is otherwise comparable.
- Respect color harmony: complementary, analogous, or neutral pairings. Avoid clashing.
- Match formality to the occasion.
- If weather is rainy, avoid delicate fabrics like silk.
- Keep rationale to one warm, human sentence — not a lecture.
- Call out when an outfit features a rarely-worn gem ("you haven't worn this in a while — it's perfect today").

Response format when clarifying:
{"type":"clarify","questions":["Question 1","Option A","Option B","Option C"]}
The first item is the question; the rest are selectable chip options.

Response format when suggesting outfits:
{"type":"outfit","outfits":[{"outfit_id":"1","item_ids":["uuid","uuid","uuid"],"rationale":"One warm sentence.","highlight_item_id":"uuid or null"}]}

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

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: STYLIST_SYSTEM },
    ...recentHistory.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    {
      role: "user",
      content: `${contextBlock}\n\nUser request: ${userMessage}`,
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
        "What's the occasion and vibe you're going for?",
        "Casual & relaxed",
        "Smart & put-together",
        "Dressy & elegant",
      ],
    };
  }

  // Validate and repair outfit structure — strip anything the AI got wrong
  if (parsed.type === "outfit") {
    const validOutfits = parsed.outfits
      .map((o) => validateAndFixOutfit(o, items))
      .filter((o): o is OutfitSuggestion => o !== null);

    if (validOutfits.length === 0) {
      parsed = {
        type: "clarify",
        questions: [
          "What's the occasion and vibe you're going for?",
          "Casual & relaxed",
          "Smart & put-together",
          "Dressy & elegant",
        ],
      };
    } else {
      parsed = { ...parsed, outfits: validOutfits };
    }
  }

  return parsed;
}
