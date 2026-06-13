"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { ClothingItem } from "@/types/item";
import { cn } from "@/lib/utils";

// Maps every color name our client detector and AI tagger can produce to a hex value.
// CSS doesn't understand multi-word names like "light blue" or "dark grey",
// so without this the swatch dot renders transparent.
const COLOR_HEX: Record<string, string> = {
  "black":        "#141414",
  "white":        "#F5F5F5",
  "off white":    "#EBE4D7",
  "cream":        "#FAF0D2",
  "ivory":        "#FAF5E1",
  "light grey":   "#C8C8C8",
  "grey":         "#828282",
  "gray":         "#828282",
  "dark grey":    "#464646",
  "dark gray":    "#464646",
  "charcoal":     "#3C3C3C",
  "navy":         "#1B2D55",
  "navy blue":    "#1B2D55",
  "blue":         "#3264BE",
  "cobalt":       "#1A3DAA",
  "light blue":   "#8CB9E6",
  "baby blue":    "#A0C8E6",
  "sky blue":     "#64AADC",
  "denim":        "#4B6E96",
  "teal":         "#008282",
  "turquoise":    "#1EA0A0",
  "red":          "#BE1E1E",
  "burgundy":     "#781423",
  "maroon":       "#6E1020",
  "wine":         "#6E1028",
  "pink":         "#F08CA0",
  "hot pink":     "#E63278",
  "blush":        "#E1BEB9",
  "rose":         "#E87882",
  "purple":       "#6E2896",
  "violet":       "#7832AA",
  "lavender":     "#AF9BD2",
  "lilac":        "#C8A8D2",
  "green":        "#288C3C",
  "dark green":   "#145028",
  "forest green": "#145028",
  "olive":        "#646E28",
  "sage":         "#87A078",
  "mint":         "#96D2BE",
  "khaki":        "#B9AF82",
  "yellow":       "#FADC1E",
  "mustard":      "#C39B32",
  "gold":         "#C8A020",
  "orange":       "#E66E1E",
  "coral":        "#F06450",
  "peach":        "#F0BE9B",
  "rust":         "#AA4614",
  "brown":        "#82461E",
  "chocolate":    "#5A2D0C",
  "tan":          "#CDAF8C",
  "camel":        "#BE9664",
  "beige":        "#EBD7B4",
  "sand":         "#DCC89B",
  "taupe":        "#B0A090",
};

function colorToHex(name: string): string {
  return COLOR_HEX[name.toLowerCase()] ?? name;
}

interface ItemCardProps {
  item: ClothingItem;
  onDelete?: (id: string) => void;
  className?: string;
}

export default function ItemCard({ item, onDelete, className }: ItemCardProps) {
  return (
    <div className={cn("relative group rounded-[20px] overflow-hidden aspect-square", className)}
         style={{ background: "radial-gradient(ellipse at 50% 30%, #FFFFF8 0%, #F5EFE7 55%, #EAE0D5 100%)" }}>
      {item.signed_url ? (
        <Image
          src={item.signed_url}
          alt={item.subcategory ?? item.category}
          fill
          className="object-contain p-3"
          style={{ filter: "drop-shadow(0 8px 18px rgba(17,17,17,0.22)) drop-shadow(0 2px 4px rgba(17,17,17,0.12))" }}
          sizes="(max-width: 390px) 45vw, 180px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#6B7280] text-xs">
          No image
        </div>
      )}

      {/* Category + color chips */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#111111] capitalize">
          {item.subcategory ?? item.category}
        </span>
        {item.pattern && item.pattern !== "solid" && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#111111] capitalize">
            {item.pattern}
          </span>
        )}
        {item.primary_color && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#111111] capitalize">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shrink-0"
              style={{ backgroundColor: colorToHex(item.primary_color) }}
            />
            {item.secondary_colors?.[0]
              ? `${item.primary_color} & ${item.secondary_colors[0]}`
              : item.primary_color}
          </span>
        )}
      </div>

      {/* Delete button — visible on hover/long-press */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={13} className="text-red-500" />
        </button>
      )}
    </div>
  );
}
