"use client";

import { useState } from "react";
import { OutfitSuggestion } from "@/types/chat";
import { ClothingItem } from "@/types/item";

function ItemThumb({ item }: { item: ClothingItem }) {
  const [error, setError] = useState(false);
  return (
    <div className="flex-1 aspect-square rounded-[12px] overflow-hidden bg-[#E5E7EB] relative">
      {item.signed_url && !error ? (
        <img
          src={item.signed_url}
          alt={item.subcategory ?? item.category}
          onError={() => setError(true)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}
    </div>
  );
}

interface OutfitCardProps {
  outfit: OutfitSuggestion;
  items: ClothingItem[];
  onWear: () => void;
  onViewOutfit: () => void;
}

export default function OutfitCard({ outfit, items, onWear, onViewOutfit }: OutfitCardProps) {
  const previewItems = items.slice(0, 3);

  return (
    <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[20px] overflow-hidden">
      {/* Photo strip */}
      <div className="flex gap-1 p-2">
        {previewItems.map((item) => (
          <ItemThumb key={item.id} item={item} />
        ))}
        {items.length > 3 && (
          <div className="flex-shrink-0 aspect-square w-[30%] rounded-[12px] bg-[#E5E7EB] flex items-center justify-center">
            <span className="text-xs font-semibold text-[#6B7280]">+{items.length - 3}</span>
          </div>
        )}
      </div>

      {/* Rationale */}
      <div className="px-3 pb-1">
        <p className="text-sm text-[#111111] leading-relaxed">{outfit.rationale}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3 pt-1">
        <button
          onClick={onViewOutfit}
          className="flex-1 py-2 rounded-full border border-[#E5E7EB] text-sm font-medium text-[#111111] active:bg-[#E5E7EB] transition-colors"
        >
          See full outfit
        </button>
        <button
          onClick={onWear}
          className="flex-1 py-2 rounded-full bg-[#111111] text-sm font-medium text-white active:opacity-80 transition-opacity"
        >
          Wear this
        </button>
      </div>
    </div>
  );
}
