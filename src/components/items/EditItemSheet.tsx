"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { ClothingItem, ItemCategory, ItemFormality, ItemWarmth } from "@/types/item";
import Button from "@/components/ui/Button";

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
  { value: "other", label: "Other", emoji: "✨" },
];

const FORMALITIES: { value: ItemFormality; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "smart-casual", label: "Smart casual" },
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
    await onSave(item.id, {
      category,
      subcategory: subcategory || null,
      primary_color: color || null,
      formality,
      warmth,
    });
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-[390px] bg-[#F9FAFB] rounded-t-[28px] max-h-[90vh] overflow-y-auto pb-8">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="text-lg font-semibold text-[#111111]">Edit item</h2>
          <button onClick={onClose} className="p-1 text-[#6B7280]">
            <X size={20} />
          </button>
        </div>

        {/* Photo */}
        {item.signed_url && (
          <div className="mx-5 mb-5 aspect-square rounded-[20px] overflow-hidden bg-[#E5E7EB] relative">
            <Image src={item.signed_url} alt="clothing item" fill className="object-cover" sizes="350px" />
          </div>
        )}

        <div className="px-5 flex flex-col gap-5">
          {/* Category */}
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-[14px] border text-xs font-medium transition-all ${
                    category === c.value
                      ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                      : "bg-white text-[#111111] border-[#E5E7EB]"
                  }`}
                >
                  <span className="text-lg">{c.emoji}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-2">Type <span className="font-normal text-[#6B7280]">(optional)</span></p>
            <input
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. blazer, jeans, sneakers"
              className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] text-sm"
            />
          </div>

          {/* Color */}
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-2">Main color <span className="font-normal text-[#6B7280]">(optional)</span></p>
            <input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. navy blue, cream, black"
              className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A] text-sm"
            />
          </div>

          {/* Formality */}
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-2">Style</p>
            <div className="flex flex-wrap gap-2">
              {FORMALITIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormality(f.value)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    formality === f.value
                      ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                      : "bg-white text-[#111111] border-[#E5E7EB]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warmth */}
          <div>
            <p className="text-sm font-semibold text-[#111111] mb-2">Warmth</p>
            <div className="flex gap-2">
              {WARMTHS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWarmth(w.value)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium border transition-all ${
                    warmth === w.value
                      ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                      : "bg-white text-[#111111] border-[#E5E7EB]"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <Button size="lg" loading={saving} onClick={handleSave}>
            Save
          </Button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-3 text-sm font-medium text-red-400 disabled:opacity-50"
          >
            {deleting ? "Removing…" : "Remove from closet"}
          </button>
        </div>
      </div>
    </div>
  );
}
