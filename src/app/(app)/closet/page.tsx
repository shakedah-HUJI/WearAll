"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { ClothingItem, ItemCategory } from "@/types/item";
import EditItemSheet from "@/components/items/EditItemSheet";
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

const FILTER_TABS: { label: string; value: ItemCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tops", value: "top" },
  { label: "Bottoms", value: "bottom" },
  { label: "Dresses", value: "dress" },
  { label: "Outerwear", value: "outerwear" },
  { label: "Shoes", value: "shoes" },
  { label: "Accessories", value: "accessory" },
];

function ItemTile({ item, onTap }: { item: ClothingItem; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="relative aspect-square bg-[#F8F5F2] overflow-hidden"
    >
      {item.signed_url ? (
        <img
          src={item.signed_url}
          alt={item.subcategory ?? item.category}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#C4BAB2] text-3xl">
          👗
        </div>
      )}
      {item.subcategory && (
        <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/25 to-transparent">
          <span className="text-[9px] font-medium text-white capitalize tracking-wide">
            {item.subcategory}
          </span>
        </div>
      )}
    </button>
  );
}

export default function ClosetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<ItemCategory | "all">("all");
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const { items, allItems, isLoading, deleteItem, mutate } = useItems({ category: activeFilter });

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

  const rarelyWorn = [...allItems]
    .sort((a, b) => (a.wear_count ?? 0) - (b.wear_count ?? 0))
    .slice(0, 5);

  const grouped = CATEGORY_ORDER.reduce<Record<string, ClothingItem[]>>((acc, cat) => {
    const catItems = allItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div>
          <h1 className="font-serif text-[1.85rem] italic leading-tight text-[#2B2622]">My Closet</h1>
          <p className="text-xs text-[#8A817A] mt-0.5 tracking-wide">
            {allItems.length} {allItems.length === 1 ? "piece" : "pieces"}
          </p>
        </div>
        <button
          onClick={() => router.push("/closet/upload")}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C97B5A] to-[#D4856A] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(201,123,90,0.35)]"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-y border-[#ECE6DF]">
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 px-4 py-2.5 text-xs font-semibold tracking-widest uppercase transition-colors ${
              activeFilter === value
                ? "text-[#2B2622] border-b-2 border-[#C97B5A]"
                : "text-[#8A817A] border-b-2 border-transparent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-3 gap-px bg-[#ECE6DF] mt-px">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-[#F8F5F2] animate-pulse" />
          ))}
        </div>
      )}

      {/* All view — grouped by category */}
      {!isLoading && activeFilter === "all" && (
        <div className="pb-28">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center px-8">
              <p className="text-4xl mb-4">👗</p>
              <p className="text-[#2B2622] font-semibold">Your closet is empty</p>
              <p className="text-[#8A817A] text-sm mt-1">Tap + to add your first item</p>
            </div>
          ) : (
            <>
              {/* Rarely worn */}
              {rarelyWorn.length > 0 && (
                <div className="px-5 pt-5 pb-1">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8A817A]">Rarely Worn</p>
                    <p className="text-[11px] text-[#C97B5A]">These deserve more love</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                    {rarelyWorn.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingItem(item)}
                        className="shrink-0 flex flex-col items-center gap-1"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#F8F5F2]">
                          {item.signed_url ? (
                            <img src={item.signed_url} alt={item.subcategory ?? item.category} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#C4BAB2] text-xl">👗</div>
                          )}
                        </div>
                        <p className="text-[10px] text-[#8A817A] capitalize truncate w-20 text-center mt-0.5">
                          {item.subcategory ?? item.category}
                        </p>
                        <p className="text-[9px] text-[#C97B5A] font-medium">worn {item.wear_count ?? 0}×</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {Object.entries(grouped).map(([cat, catItems]) => (
                <div key={cat}>
                  <div className="flex items-center justify-between px-5 pt-6 pb-2">
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-[#8A817A]">
                      {CATEGORY_LABELS[cat as ItemCategory]}
                    </p>
                    <span className="text-[11px] text-[#C97B5A] font-semibold">{catItems.length}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-px bg-[#ECE6DF]">
                    {catItems.map((item) => (
                      <ItemTile key={item.id} item={item} onTap={() => setEditingItem(item)} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Filtered view */}
      {!isLoading && activeFilter !== "all" && (
        <div className="pb-28">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 text-center px-8">
              <p className="text-[#8A817A] text-sm">
                No {CATEGORY_LABELS[activeFilter]} yet
              </p>
              <button
                onClick={() => router.push("/closet/upload")}
                className="mt-3 text-sm font-semibold text-[#C97B5A]"
              >
                Add some →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-[#ECE6DF] mt-px">
              {items.map((item) => (
                <ItemTile key={item.id} item={item} onTap={() => setEditingItem(item)} />
              ))}
            </div>
          )}
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
