import Anthropic from "@anthropic-ai/sdk";
import { TagResult, ItemCategory, ItemPattern, ItemFormality, ItemSeason, ItemWarmth } from "@/types/item";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a fashion expert analyzing a single clothing item photo.
Return ONLY a valid JSON object — no markdown, no prose, nothing else.

Required fields and allowed values:
- category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other"
- subcategory: string (e.g. "t-shirt", "blazer", "jeans", "sneakers", "midi-dress")
- primary_color: string (e.g. "navy blue", "cream", "forest green")
- secondary_colors: string[] (other visible colors, empty array if none)
- pattern: "solid" | "striped" | "floral" | "plaid" | "print" | "other"
- material_guess: string (e.g. "cotton", "silk", "denim", "wool blend")
- formality: "casual" | "smart-casual" | "business" | "formal" | "sporty"
- season: array of "spring" | "summer" | "fall" | "winter" (list all suitable seasons)
- warmth: "light" | "medium" | "warm"
- notes: string (brief style note relevant for outfit pairing — max 20 words)

Example output:
{"category":"top","subcategory":"button-down shirt","primary_color":"light blue","secondary_colors":[],"pattern":"solid","material_guess":"cotton","formality":"smart-casual","season":["spring","summer","fall"],"warmth":"light","notes":"Crisp collar makes it versatile for both office and casual looks."}`;

const VALID_CATEGORIES: ItemCategory[] = ["top","bottom","dress","outerwear","shoes","accessory","other"];
const VALID_PATTERNS: ItemPattern[] = ["solid","striped","floral","plaid","print","other"];
const VALID_FORMALITIES: ItemFormality[] = ["casual","smart-casual","business","formal","sporty"];
const VALID_SEASONS: ItemSeason[] = ["spring","summer","fall","winter"];
const VALID_WARMTHS: ItemWarmth[] = ["light","medium","warm"];

function sanitize(raw: Partial<TagResult>): TagResult {
  return {
    category: VALID_CATEGORIES.includes(raw.category as ItemCategory)
      ? (raw.category as ItemCategory)
      : "other",
    subcategory: typeof raw.subcategory === "string" ? raw.subcategory : raw.category ?? "item",
    primary_color: typeof raw.primary_color === "string" ? raw.primary_color : "unknown",
    secondary_colors: Array.isArray(raw.secondary_colors)
      ? raw.secondary_colors.filter((c) => typeof c === "string")
      : [],
    pattern: VALID_PATTERNS.includes(raw.pattern as ItemPattern)
      ? (raw.pattern as ItemPattern)
      : "solid",
    material_guess: typeof raw.material_guess === "string" ? raw.material_guess : "",
    formality: VALID_FORMALITIES.includes(raw.formality as ItemFormality)
      ? (raw.formality as ItemFormality)
      : "casual",
    season: Array.isArray(raw.season)
      ? (raw.season.filter((s) => VALID_SEASONS.includes(s as ItemSeason)) as ItemSeason[])
      : ["spring","summer","fall","winter"],
    warmth: VALID_WARMTHS.includes(raw.warmth as ItemWarmth)
      ? (raw.warmth as ItemWarmth)
      : "medium",
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 200) : "",
  };
}

export async function tagClothingItem(
  imageBase64: string,
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<TagResult> {
  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyze this clothing item and return the JSON object.",
          },
        ],
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: Partial<TagResult> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback — return a generic tag so the upload doesn't fail
    parsed = {};
  }

  return sanitize(parsed);
}
