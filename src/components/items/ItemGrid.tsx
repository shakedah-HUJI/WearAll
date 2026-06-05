import { ClothingItem } from "@/types/item";
import ItemCard from "./ItemCard";

interface ItemGridProps {
  items: ClothingItem[];
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export default function ItemGrid({ items, isLoading = false, onDelete }: ItemGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-[20px] bg-[#ECE6DF] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-8">
        <p className="text-4xl mb-4">👗</p>
        <p className="text-[#2B2622] font-semibold text-lg">Your closet is empty</p>
        <p className="text-[#8A817A] text-sm mt-1">
          Add your first item to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
}
