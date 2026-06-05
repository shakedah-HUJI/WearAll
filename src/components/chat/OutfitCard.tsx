import Image from "next/image";
import { OutfitSuggestion } from "@/types/chat";
import { ClothingItem } from "@/types/item";

interface OutfitCardProps {
  outfit: OutfitSuggestion;
  items: ClothingItem[];
  onWear: () => void;
  onViewOutfit: () => void;
}

export default function OutfitCard({ outfit, items, onWear, onViewOutfit }: OutfitCardProps) {
  const previewItems = items.slice(0, 3);

  return (
    <div className="bg-[#FFFDFB] border border-[#ECE6DF] rounded-[20px] overflow-hidden">
      {/* Photo strip */}
      <div className="flex gap-1 p-2">
        {previewItems.map((item) => (
          <div
            key={item.id}
            className="flex-1 aspect-square rounded-[12px] overflow-hidden bg-[#ECE6DF] relative"
          >
            {item.signed_url && (
              <Image
                src={item.signed_url}
                alt={item.subcategory ?? item.category}
                fill
                className="object-cover"
                sizes="100px"
              />
            )}
          </div>
        ))}
        {items.length > 3 && (
          <div className="flex-shrink-0 aspect-square w-[30%] rounded-[12px] bg-[#ECE6DF] flex items-center justify-center">
            <span className="text-xs font-semibold text-[#8A817A]">+{items.length - 3}</span>
          </div>
        )}
      </div>

      {/* Rationale */}
      <div className="px-3 pb-1">
        <p className="text-sm text-[#2B2622] leading-relaxed">{outfit.rationale}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3 pt-1">
        <button
          onClick={onViewOutfit}
          className="flex-1 py-2 rounded-full border border-[#ECE6DF] text-sm font-medium text-[#2B2622] active:bg-[#ECE6DF] transition-colors"
        >
          See full outfit
        </button>
        <button
          onClick={onWear}
          className="flex-1 py-2 rounded-full bg-[#C97B5A] text-sm font-medium text-white active:opacity-80 transition-opacity"
        >
          Wear this
        </button>
      </div>
    </div>
  );
}
