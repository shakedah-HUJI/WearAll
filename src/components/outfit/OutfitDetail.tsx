"use client";

import { ClothingItem } from "@/types/item";
import { OutfitSuggestion } from "@/types/chat";
import OutfitCollage from "./OutfitCollage";
import Button from "@/components/ui/Button";
import { useState } from "react";

interface OutfitDetailProps {
  outfit: OutfitSuggestion;
  items: ClothingItem[];
  onWear: () => Promise<void>;
}

export default function OutfitDetail({ outfit, items, onWear }: OutfitDetailProps) {
  const [wearing, setWearing] = useState(false);
  const [worn, setWorn] = useState(false);

  async function handleWear() {
    setWearing(true);
    await onWear();
    setWearing(false);
    setWorn(true);
  }

  return (
    <div className="flex flex-col pb-6">
      <OutfitCollage items={items} />

      <div className="px-5 pt-2 pb-4">
        <p className="text-[#2B2622] leading-relaxed">{outfit.rationale}</p>
      </div>

      <div className="px-5 flex flex-wrap gap-2 pb-4">
        {items.map((item) => (
          <span
            key={item.id}
            className="text-xs px-3 py-1 rounded-full bg-[#ECE6DF] text-[#8A817A] capitalize font-medium"
          >
            {item.subcategory ?? item.category}
            {item.formality && ` · ${item.formality}`}
          </span>
        ))}
      </div>

      <div className="px-5">
        <Button
          size="lg"
          loading={wearing}
          disabled={worn}
          onClick={handleWear}
          className="w-full"
        >
          {worn ? "Outfit logged!" : "I'll wear this"}
        </Button>
      </div>
    </div>
  );
}
