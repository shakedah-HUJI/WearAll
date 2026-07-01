import {
  ItemCategory,
  ItemFormality,
  ItemPattern,
  ItemSeason,
  ItemWarmth,
} from "@/types/item";

export interface EssentialTemplate {
  label: string;
  image_url?: string;
  category: ItemCategory;
  subcategory: string;
  primary_color: string;
  secondary_colors: string[];
  pattern: ItemPattern;
  formality: ItemFormality;
  warmth: ItemWarmth;
  season: ItemSeason[];
  material_guess: string;
  notes: string;
}

export const ESSENTIALS: EssentialTemplate[] = [
  // ── SHOES ─────────────────────────────────────────────────────────────────
  {
    label: "Nike Dunk Low Grey/White",
    image_url: "/images/essentials/nike-dunk-grey.png",
    category: "shoes",
    subcategory: "sneakers",
    primary_color: "white",
    secondary_colors: ["gray"],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "leather",
    notes: "Nike Dunk Low grey and white colorway",
  },
  {
    label: "New Balance 530 White",
    image_url: "/images/essentials/new-balance-530.png",
    category: "shoes",
    subcategory: "sneakers",
    primary_color: "white",
    secondary_colors: ["silver", "navy"],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "mesh/synthetic",
    notes: "New Balance 530 retro runner in white/silver",
  },
  // ── TOPS ──────────────────────────────────────────────────────────────────
  {
    label: "Basic Black Tee",
    image_url: "/images/essentials/black-tee.png",
    category: "top",
    subcategory: "t-shirt",
    primary_color: "black",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "cotton",
    notes: "Essential black crewneck t-shirt",
  },
  {
    label: "Black Cami Top",
    image_url: "/images/essentials/black-cami.png",
    category: "top",
    subcategory: "tank top",
    primary_color: "black",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer"],
    material_guess: "jersey",
    notes: "Sleek black spaghetti strap cami",
  },
  {
    label: "White Ribbed Tank",
    image_url: "/images/essentials/white-tank.png",
    category: "top",
    subcategory: "tank top",
    primary_color: "white",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer"],
    material_guess: "ribbed cotton",
    notes: "White square-neck ribbed crop tank",
  },
  // ── ADD MORE ITEMS BELOW ──────────────────────────────────────────────────
  // {
  //   label: "Item Name",
  //   image_url: "https://...",
  //   category: "top",
  //   subcategory: "t-shirt",
  //   primary_color: "white",
  //   secondary_colors: [],
  //   pattern: "solid",
  //   formality: "casual",
  //   warmth: "light",
  //   season: ["spring", "summer", "fall", "winter"],
  //   material_guess: "cotton",
  //   notes: "",
  // },
];

// ── Color swatch palette ──────────────────────────────────────────────────────
// Painted as the tile base layer. Image loads on top; swatch shows if it fails.
export const COLOR_TILE: Record<string, { bg: string; fg: string }> = {
  white:       { bg: "#F0EDE8", fg: "#555555" },
  cream:       { bg: "#EBE4D4", fg: "#555555" },
  black:       { bg: "#1C1C1E", fg: "#FFFFFF" },
  charcoal:    { bg: "#3A3A40", fg: "#FFFFFF" },
  gray:        { bg: "#8B8B8B", fg: "#FFFFFF" },
  silver:      { bg: "#C0C0C0", fg: "#444444" },
  navy:        { bg: "#1B2A4A", fg: "#FFFFFF" },
  blue:        { bg: "#3A5F8A", fg: "#FFFFFF" },
  "light blue":{ bg: "#7BAED6", fg: "#FFFFFF" },
  beige:       { bg: "#C8B49A", fg: "#444444" },
  brown:       { bg: "#7C5A40", fg: "#FFFFFF" },
  khaki:       { bg: "#B0985A", fg: "#FFFFFF" },
  olive:       { bg: "#6B6940", fg: "#FFFFFF" },
  green:       { bg: "#4A7A4A", fg: "#FFFFFF" },
  red:         { bg: "#A03030", fg: "#FFFFFF" },
  pink:        { bg: "#D07090", fg: "#FFFFFF" },
};

export function getTileColors(color: string): { bg: string; fg: string } {
  return COLOR_TILE[color] ?? { bg: "#E0DDD8", fg: "#444444" };
}
