"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { ClothingItem } from "@/types/item";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  item: ClothingItem;
  onDelete?: (id: string) => void;
  className?: string;
}

export default function ItemCard({ item, onDelete, className }: ItemCardProps) {
  return (
    <div className={cn("relative group rounded-[20px] overflow-hidden bg-[#ECE6DF] aspect-square", className)}>
      {item.signed_url ? (
        <Image
          src={item.signed_url}
          alt={item.subcategory ?? item.category}
          fill
          className="object-cover"
          sizes="(max-width: 390px) 45vw, 180px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#8A817A] text-xs">
          No image
        </div>
      )}

      {/* Category + color chips */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#2B2622] capitalize">
          {item.subcategory ?? item.category}
        </span>
        {item.primary_color && (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-[#2B2622] capitalize">
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/60 shrink-0"
              style={{ backgroundColor: item.primary_color }}
            />
            {item.primary_color}
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
