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
          <h1 className="text-2xl font-semibold text-[#2B2622]">My Closet</h1>
          <p className="text-sm text-[#8A817A]">
            {allItems.length} {allItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        <button
          onClick={() => router.push("/closet/upload")}
          className="w-10 h-10 rounded-full bg-[#C97B5A] flex items-center justify-center text-white"
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
