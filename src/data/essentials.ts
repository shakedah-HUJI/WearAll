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
    label: "Nike Dunk Low Next Nature White/Black",
    image_url: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/14571bc8-b2ef-4573-8a39-36696d54238e/WMNS+NIKE+DUNK+LOW+NN.png",
    category: "shoes",
    subcategory: "sneakers",
    primary_color: "white",
    secondary_colors: ["black"],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "synthetic leather",
    notes: "Nike Dunk Low Next Nature White/Black",
  },
  {
    label: "Nike Dunk Low Next Nature Bicoastal",
    image_url: "https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/4545cc7d-0cb4-45aa-9d51-40be357e966c/WMNS+NIKE+DUNK+LOW+NN.png",
    category: "shoes",
    subcategory: "sneakers",
    primary_color: "white",
    secondary_colors: ["green"],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "synthetic leather",
    notes: "Nike Dunk Low Next Nature White/Bicoastal Green",
  },
  {
    label: "Adidas Handball Spezial Light Blue",
    image_url: "https://media.factory54.co.il/pub/media/catalog/product/cache/b374ff9ecf3b29b1a67d228d0c98e9a1/w/8/w848470027-11737356319.jpg",
    category: "shoes",
    subcategory: "sneakers",
    primary_color: "light blue",
    secondary_colors: ["white"],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "suede",
    notes: "Adidas Handball Spezial Light Blue from Factory 54",
  },
  {
    label: "Elegant Silver Stiletto Heels",
    image_url: "https://m.media-amazon.com/images/I/71Y679e97vL._AC_UY1000_.jpg",
    category: "shoes",
    subcategory: "heels",
    primary_color: "silver",
    secondary_colors: [],
    pattern: "other",
    formality: "formal",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "synthetic",
    notes: "Elegant sparkling stiletto party pumps",
  },
  // ── TOPS ──────────────────────────────────────────────────────────────────
  {
    label: "Basic White Tee",
    image_url: "https://image.hm.com/assets/hm/6b/d0/6bd08db6781aae207d616c8590faffbc96552fbe.jpg?imwidth=2160",
    category: "top",
    subcategory: "t-shirt",
    primary_color: "white",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "light",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "cotton",
    notes: "Basic white crewneck t-shirt from H&M",
  },
  // ── BOTTOMS ───────────────────────────────────────────────────────────────
  {
    label: "Next Denim Blue Jeans",
    image_url: "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/434451s5.jpg?im=Resize,width=480",
    category: "bottom",
    subcategory: "jeans",
    primary_color: "blue",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "medium",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "denim",
    notes: "Classic mid blue denim jeans from Next",
  },
  {
    label: "Next Light Blue Denim Jeans",
    image_url: "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/434687s5.jpg?im=Resize,width=480",
    category: "bottom",
    subcategory: "jeans",
    primary_color: "light blue",
    secondary_colors: [],
    pattern: "solid",
    formality: "casual",
    warmth: "medium",
    season: ["spring", "summer", "fall", "winter"],
    material_guess: "denim",
    notes: "Light wash blue denim jeans from Next",
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
