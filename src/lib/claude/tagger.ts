import Groq from "groq-sdk";
import { TagResult, ItemCategory, ItemPattern, ItemFormality, ItemSeason, ItemWarmth } from "@/types/item";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a fashion expert analyzing a single clothing item photo.
Return ONLY a valid JSON object — no markdown, no prose, nothing else.

Required fields and allowed values:
- category: "top" | "bottom" | "dress" | "outerwear" | "shoes" | "accessory" | "other"
- subcategory: string — be specific about fit and style (e.g. "skinny jeans", "wide-leg trousers", "oversized t-shirt", "fitted blazer", "crew-neck sweater", "midi dress", "ankle boots")
- primary_color: string — be precise about shade (e.g. "dark navy", "light blue", "off-white", "burgundy", "forest green"). Never use "denim" as a color — describe the actual shade instead.
- secondary_colors: string[] — for striped or patterned items ALWAYS list ALL stripe/pattern colors here (e.g. a black and white striped shirt must have ["black"] or ["white"] as secondary). Never leave empty for non-solid items.
- pattern: "solid" | "striped" | "floral" | "plaid" | "print" | "other"
- material_guess: string (e.g. "cotton", "silk", "denim", "wool blend")
- formality: "casual" | "smart-casual" | "business" | "formal" | "sporty"
- season: array of "spring" | "summer" | "fall" | "winter" (list all suitable seasons)
- warmth: "light" | "medium" | "warm"
- notes: string (brief style note relevant for outfit pairing — max 20 words)

Example output:
{"category":"bottom","subcategory":"skinny jeans","primary_color":"dark navy","secondary_colors":[],"pattern":"solid","material_guess":"denim","formality":"casual","season":["spring","summer","fall","winter"],"warmth":"medium","notes":"Sleek dark wash pairs well with both casual and smart-casual tops."}`;

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
  const response = await client.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: `${SYSTEM_PROMPT}\n\nAnalyze this clothing item and return the JSON object.`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0].message.content ?? "";
  const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();

  let parsed: Partial<TagResult> = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {};
  }

  return sanitize(parsed);
}
