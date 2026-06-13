"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SlidersHorizontal } from "lucide-react";
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
    <button onClick={onTap} className="flex flex-col bg-[#FBF9F6] text-left w-full">
      <div className="aspect-square w-full bg-[#F0EBE3] overflow-hidden relative">
        {item.signed_url ? (
          <img
            src={item.signed_url}
            alt={item.subcategory ?? item.category}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#CCCCCC] text-2xl">
            —
          </div>
        )}
        {item.primary_color && (
          <div className="absolute bottom-1.5 right-1.5 bg-black/50 px-[5px] py-[3px]">
            <span className="text-[8px] text-white uppercase tracking-[0.1em] font-medium leading-none">
              {item.primary_color}
            </span>
          </div>
        )}
      </div>
      <div className="px-2 pt-2 pb-3">
        <p className="text-xs font-semibold text-[#111111] capitalize truncate leading-tight">
          {item.subcategory ?? item.category}
        </p>
      </div>
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
    toast("Saved", "success");
  }

  async function handleDelete(id: string) {
    await deleteItem(id);
    toast("Removed", "success");
  }

  const rarelyWorn = [...allItems]
    .sort((a, b) => (a.wear_count ?? 0) - (b.wear_count ?? 0))
    .slice(0, 6);

  const grouped = CATEGORY_ORDER.reduce<Record<string, ClothingItem[]>>((acc, cat) => {
    const catItems = allItems.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="flex flex-col min-h-screen bg-[#FBF9F6]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4 bg-[#FBF9F6] border-b border-[#EDE8E1]">
        <div>
          <h1 className="font-sans font-black text-base tracking-[0.15em] uppercase text-[#111111]">
            My Closet
          </h1>
          <p className="text-[11px] text-[#999999] mt-0.5 tracking-wide">
            {allItems.length} {allItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/closet/upload")}
            className="w-9 h-9 bg-[#111111] flex items-center justify-center text-white"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-[#FBF9F6] border-b border-[#EDE8E1] px-4 gap-2 py-3">
        {FILTER_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 px-4 py-1.5 text-xs font-semibold tracking-wide border transition-none ${
              activeFilter === value
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-transparent text-[#111111] border-[#D4CCC4]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-px bg-[#EDE8E1] mt-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#FBF9F6]">
              <div className="aspect-square bg-[#EDE8E1] animate-pulse" />
              <div className="px-2 pt-2 pb-3 space-y-1">
                <div className="h-3 w-20 bg-[#F0F0F0] animate-pulse" />
                <div className="h-2.5 w-12 bg-[#F0F0F0] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All view */}
      {!isLoading && activeFilter === "all" && (
        <div className="pb-28">
          {Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-8">
              <p className="text-sm font-semibold text-[#111111] tracking-wide uppercase">Your closet is empty</p>
              <p className="text-xs text-[#999999] mt-2">Tap + to add your first item</p>
            </div>
          ) : (
            <>
              {/* Rarely worn row */}
              {rarelyWorn.length > 0 && (
                <div className="bg-[#FBF9F6] border-b border-[#EDE8E1] px-5 pt-4 pb-5">
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-xs font-black tracking-widest uppercase text-[#111111]">Rarely Worn</p>
                    <p className="text-xs text-[#999999]">{rarelyWorn.length} items</p>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                    {rarelyWorn.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingItem(item)}
                        className="shrink-0 flex flex-col"
                        style={{ width: 80 }}
                      >
                        <div className="w-20 h-20 bg-[#F0EBE3] overflow-hidden">
                          {item.signed_url ? (
                            <img src={item.signed_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#CCCCCC]">—</div>
                          )}
                        </div>
                        <p className="text-[10px] text-[#111111] capitalize truncate mt-1.5 font-medium">
                          {item.subcategory ?? item.category}
                        </p>
                        <p className="text-[9px] text-[#999999]">worn {item.wear_count ?? 0}×</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Category sections */}
              {Object.entries(grouped).map(([cat, catItems]) => (
                <div key={cat}>
                  <div className="flex items-baseline gap-2 px-5 pt-5 pb-2">
                    <p className="text-xs font-black tracking-widest uppercase text-[#111111]">
                      {CATEGORY_LABELS[cat as ItemCategory]}
                    </p>
                    <p className="text-xs text-[#999999]">{catItems.length} items</p>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-[#EDE8E1]">
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
            <div className="flex flex-col items-center justify-center py-32 text-center px-8">
              <p className="text-xs text-[#999999] uppercase tracking-widest">
                No {CATEGORY_LABELS[activeFilter]} yet
              </p>
              <button
                onClick={() => router.push("/closet/upload")}
                className="mt-4 px-6 py-2.5 bg-[#111111] text-white text-xs font-semibold tracking-widest uppercase"
              >
                Add Items
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-2 px-5 pt-5 pb-2">
                <p className="text-xs font-black tracking-widest uppercase text-[#111111]">
                  {CATEGORY_LABELS[activeFilter]}
                </p>
                <p className="text-xs text-[#999999]">{items.length} items</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-[#E5E5E5]">
                {items.map((item) => (
                  <ItemTile key={item.id} item={item} onTap={() => setEditingItem(item)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

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
