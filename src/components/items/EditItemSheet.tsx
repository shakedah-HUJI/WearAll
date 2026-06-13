"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { ClothingItem, ItemCategory, ItemFormality, ItemWarmth } from "@/types/item";

interface EditItemSheetProps {
  item: ClothingItem;
  onSave: (id: string, updates: Partial<ClothingItem>) => Promise<void>;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORIES: { value: ItemCategory; label: string; emoji: string }[] = [
  { value: "top", label: "Top", emoji: "👕" },
  { value: "bottom", label: "Bottom", emoji: "👖" },
  { value: "dress", label: "Dress", emoji: "👗" },
  { value: "outerwear", label: "Outerwear", emoji: "🧥" },
  { value: "shoes", label: "Shoes", emoji: "👟" },
  { value: "accessory", label: "Accessory", emoji: "👜" },
  { value: "other", label: "Other", emoji: "✦" },
];

const FORMALITIES: { value: ItemFormality; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart" },
  { value: "business", label: "Business" },
  { value: "formal", label: "Formal" },
  { value: "sporty", label: "Sporty" },
];

const WARMTHS: { value: ItemWarmth; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "warm", label: "Warm" },
];

export default function EditItemSheet({ item, onSave, onClose, onDelete }: EditItemSheetProps) {
  const [category, setCategory] = useState<ItemCategory>(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory ?? "");
  const [color, setColor] = useState(item.primary_color ?? "");
  const [formality, setFormality] = useState<ItemFormality>(item.formality ?? "casual");
  const [warmth, setWarmth] = useState<ItemWarmth>(item.warmth ?? "medium");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(item.id, { category, subcategory: subcategory || null, primary_color: color || null, formality, warmth });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!confirm("Remove this item from your closet?")) return;
    setDeleting(true);
    await onDelete(item.id);
    setDeleting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-[390px] bg-[#FBF9F6] max-h-[92vh] overflow-y-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#EDE8E1]">
          <h2 className="text-xs font-black tracking-widest uppercase text-[#111111]">Edit Item</h2>
          <button onClick={onClose} className="p-1 text-[#999999]">
            <X size={18} />
          </button>
        </div>

        {/* Photo */}
        {item.signed_url && (
          <div className="aspect-square overflow-hidden bg-[#F0EBE3] relative">
            <Image src={item.signed_url} alt="clothing item" fill className="object-cover" sizes="390px" />
          </div>
        )}

        <div className="px-5 pt-5 flex flex-col gap-6">
          {/* Category */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-[#999999] mb-3">Category</p>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1.5 py-3 border text-[10px] font-semibold tracking-wide transition-none ${
                    category === c.value
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-[#FBF9F6] text-[#111111] border-[#EDE8E1]"
                  }`}
                >
                  <span className="text-base">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-[#999999] mb-2">
              Type <span className="font-normal normal-case tracking-normal text-[#BBBBBB]">(optional)</span>
            </p>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. blazer, jeans, sneakers"
              className="w-full px-4 py-3 border border-[#EDE8E1] bg-white/60 text-[#111111] placeholder-[#C0B4A6] focus:outline-none focus:border-[#1B2A4A] text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-[#999999] mb-2">
              Color <span className="font-normal normal-case tracking-normal text-[#BBBBBB]">(optional)</span>
            </p>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. navy blue, cream, black"
              className="w-full px-4 py-3 border border-[#EDE8E1] bg-white/60 text-[#111111] placeholder-[#C0B4A6] focus:outline-none focus:border-[#1B2A4A] text-sm"
            />
          </div>

          {/* Occasions / Formality */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-[#999999] mb-3">Occasions</p>
            <div className="flex flex-wrap gap-2">
              {FORMALITIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormality(f.value)}
                  className={`px-4 py-2 text-xs font-semibold border tracking-wide transition-none ${
                    formality === f.value
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-[#FBF9F6] text-[#111111] border-[#EDE8E1]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warmth */}
          <div>
            <p className="text-[10px] font-black tracking-widest uppercase text-[#999999] mb-3">Warmth</p>
            <div className="flex gap-2">
              {WARMTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWarmth(w.value)}
                  className={`flex-1 py-2.5 text-xs font-semibold border tracking-wide transition-none ${
                    warmth === w.value
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-[#FBF9F6] text-[#111111] border-[#EDE8E1]"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-[#111111] text-white text-xs font-black tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Save Details <span className="ml-1">→</span></>
            )}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-xs font-medium text-[#CC0000] tracking-wide disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove from closet"}
          </button>
        </div>
      </div>
    </div>
  );
}
