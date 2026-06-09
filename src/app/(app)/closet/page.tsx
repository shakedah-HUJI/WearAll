"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { ClothingItem, ItemCategory } from "@/types/item";
import ItemGrid from "@/components/items/ItemGrid";
import EditItemSheet from "@/components/items/EditItemSheet";
import Chip from "@/components/ui/Chip";
import { useToast } from "@/components/ui/Toast";

const CATEGORY_LABELS: Record<ItemCategory, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
  other: "Other",
};

const CATEGORY_ORDER: ItemCategory[] = [
  "top", "bottom", "dress", "outerwear", "shoes", "accessory", "other",
];

const CATEGORIES: { label: string; value: ItemCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tops", value: "top" },
  { label: "Bottoms", value: "bottom" },
  { label: "Dresses", value: "dress" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Shoes", value: "shoes" },
  { label: "Accessories", value: "accessory" },
];

export default function ClosetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<ItemCategory | "all">("all");
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { items, allItems, isLoading, deleteItem, mutate } = useItems({ category: activeCategory });

  const categoryCounts = CATEGORY_ORDER.reduce<Partial<Record<ItemCategory, number>>>((acc, cat) => {
    const count = allItems.filter((i) => i.category === cat).length;
    if (count > 0) acc[cat] = count;
    return acc;
  }, {});

  async function handleSave(id: string, updates: Partial<ClothingItem>) {
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    mutate();
    toast("Item updated!", "success");
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
    toast("Item removed", "success");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div>
          <h1 className="font-serif text-[1.85rem] italic leading-tight text-[#2B2622]">My Closet</h1>
          <p className="text-sm text-[#8A817A]">
            {allItems.length} {allItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={() => router.push("/closet/upload")}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C97B5A] to-[#D4856A] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(201,123,90,0.35)]"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-3 scrollbar-hide">
        {CATEGORIES.map(({ label, value }) => (
          <Chip
            key={value}
            selected={activeCategory === value}
            onClick={() => setActiveCategory(value)}
          >
            {label}
          </Chip>
        ))}
      </div>

      {/* Wardrobe stats */}
      {!isLoading && allItems.length > 0 && (
        <div className="mx-4 mb-3 rounded-[20px] overflow-hidden shadow-[0_2px_16px_rgba(43,38,34,0.07),0_0_0_1px_#ECE6DF]">
          <div className="h-1 bg-gradient-to-r from-[#C97B5A] to-[#D4856A]" />
          <div className="bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-[#2B2622]">Your wardrobe</p>
              <span className="text-sm font-semibold text-[#C97B5A]">{allItems.length} items</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(categoryCounts) as [ItemCategory, number][]).map(([cat, count]) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs px-3 py-1.5 rounded-full bg-[#FBF7F2] border border-[#ECE6DF] text-[#2B2622] font-medium active:bg-[#ECE6DF] transition-colors"
                >
                  {CATEGORY_LABELS[cat]} · {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid — tap any photo to edit */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-[20px] bg-[#ECE6DF] animate-pulse" />
            ))
          : items.map((item) => (
              <button
                key={item.id}
                onClick={() => setEditingItem(item)}
                className="relative rounded-[20px] overflow-hidden bg-[#ECE6DF] aspect-square"
              >
                {item.signed_url ? (
                  <img
                    src={item.signed_url}
                    alt={item.subcategory ?? item.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8A817A] text-xs">
                    No image
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 text-[#2B2622] capitalize">
                    {item.subcategory ?? item.category}
                  </span>
                </div>
              </button>
            ))}
      </div>

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-4xl mb-4">👗</p>
          <p className="text-[#2B2622] font-semibold text-lg">Your closet is empty</p>
          <p className="text-[#8A817A] text-sm mt-1">Tap + to add your first item</p>
        </div>
      )}

      {/* Edit sheet */}
      {editingItem && (
        <EditItemSheet
          item={editingItem}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
