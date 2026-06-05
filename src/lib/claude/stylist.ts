import Anthropic from "@anthropic-ai/sdk";
import { ClothingItem, ItemFormality, ItemWarmth } from "@/types/item";
import { WeatherContext, OutfitSuggestion } from "@/types/chat";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

When you have enough context, compose 2–3 complete outfit suggestions using ONLY items from the provided wardrobe JSON. Each outfit needs a complete "look" — typically a top + bottom (or dress) + shoes. Outerwear when it's cold. Accessories are optional.

Rules:
- Only use items from the provided wardrobe — never suggest items the user doesn't own.
- Favor items with lower wear_count when quality is otherwise comparable.
- Respect color harmony: complementary, analogous, or neutral pairings. Avoid clashing.
- Match formality to the occasion.
- If weather is cold (temp_c < 12), include a warm outer layer.
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
    // Season filter
    if (item.season && item.season.length > 0 && !item.season.includes(season as never)) {
      return false;
    }

    // Warmth: exclude light items for outer layers when cold
    if (tempC < 10 && item.warmth === "light" && item.category === "outerwear") {
      return false;
    }

    // Formality bracket: ±1 from target
    if (item.formality) {
      const rank = FORMALITY_RANK[item.formality];
      if (Math.abs(rank - targetFormalityRank) > 1) return false;
    }

    return true;
  });
}

export async function generateStylistResponse(
  params: StylistParams
): Promise<StylistResponse> {
  const { userMessage, history, items, weather, isFirstTurn } = params;

  const candidateItems = preFilterItems(items, userMessage, weather);

  // Build a compact item payload for the prompt
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

  // Convert history to Anthropic messages format (cap at 10 turns)
  const recentHistory = history.slice(-10);
  const messages: Anthropic.MessageParam[] = [
    ...recentHistory.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    })),
    {
      role: "user",
      content: `${contextBlock}\n\nUser request: ${userMessage}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: STYLIST_SYSTEM,
    messages,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: StylistResponse;
  try {
    parsed = JSON.parse(cleaned);
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

  return parsed;
}
