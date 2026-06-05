import Image from "next/image";
import { ClothingItem } from "@/types/item";

interface OutfitCollageProps {
  items: ClothingItem[];
}

export default function OutfitCollage({ items }: OutfitCollageProps) {
  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={`rounded-[16px] overflow-hidden bg-[#ECE6DF] relative ${
            i === 0 && items.length % 2 !== 0 ? "col-span-2 aspect-[2/1]" : "aspect-square"
          }`}
        >
          {item.signed_url && (
            <Image
              src={item.signed_url}
              alt={item.subcategory ?? item.category}
              fill
              className="object-cover"
              sizes="(max-width: 390px) 90vw, 350px"
            />
          )}
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-[#2B2622] capitalize">
              {item.subcategory ?? item.category}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
