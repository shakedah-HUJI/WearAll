export type ItemCategory =
  | "top"
  | "bottom"
  | "dress"
  | "outerwear"
  | "shoes"
  | "accessory"
  | "other";

export type ItemPattern =
  | "solid"
  | "striped"
  | "floral"
  | "plaid"
  | "print"
  | "other";

export type ItemFormality =
  | "casual"
  | "smart-casual"
  | "business"
  | "formal"
  | "sporty";

export type ItemWarmth = "light" | "medium" | "warm";

export type ItemSeason = "spring" | "summer" | "fall" | "winter";

export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  signed_url?: string;
  category: ItemCategory;
  subcategory: string | null;
  primary_color: string | null;
  secondary_colors: string[] | null;
  pattern: ItemPattern | null;
  material_guess: string | null;
  formality: ItemFormality | null;
  season: ItemSeason[] | null;
  warmth: ItemWarmth | null;
  notes: string | null;
  wear_count: number;
  last_worn: string | null;
  created_at: string;
}

export interface TagResult {
  category: ItemCategory;
  subcategory: string;
  primary_color: string;
  secondary_colors: string[];
  pattern: ItemPattern;
  material_guess: string;
  formality: ItemFormality;
  season: ItemSeason[];
  warmth: ItemWarmth;
  notes: string;
}
