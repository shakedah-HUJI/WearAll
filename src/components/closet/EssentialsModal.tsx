"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ESSENTIALS, EssentialTemplate, getTileColors } from "@/data/essentials";
import { ItemCategory } from "@/types/item";

const TABS: { label: string; value: ItemCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Tops", value: "top" },
  { label: "Bottoms", value: "bottom" },
  { label: "Shoes", value: "shoes" },
  { label: "Outerwear", value: "outerwear" },
];

function proxyUrl(raw: string): string {
  // Local paths (starting with /) are served directly — no proxy needed.
  if (raw.startsWith("/")) return raw;
  return `/api/proxy/image?url=${encodeURIComponent(raw)}`;
}

function EssentialTile({
  item,
  selected,
  onToggle,
}: {
  item: EssentialTemplate;
  selected: boolean;
  onToggle: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const { bg, fg } = getTileColors(item.primary_color);
  const hasImage = !!item.image_url && !imgError;

  return (
    <button
      onClick={onToggle}
      className="flex flex-col w-full text-left"
    >
      {/* Square image / swatch box */}
      <div
        className="aspect-square w-full relative overflow-hidden"
        style={{ background: hasImage ? "#FAFAF8" : bg }}
      >
        {/* Swatch sheen — visible only when no image */}
        {!hasImage && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%)",
            }}
          />
        )}

        {/* Color label — fallback only */}
        {!hasImage && (
          <div className="absolute bottom-1.5 left-2">
            <span
              className="text-[7px] uppercase tracking-[0.14em] font-semibold leading-none"
              style={{ color: fg, opacity: 0.6 }}
            >
              {item.primary_color}
            </span>
          </div>
        )}

        {/* Product image */}
        {item.image_url && !imgError && (
          <img
            src={proxyUrl(item.image_url)}
            alt={item.label}
            className="absolute inset-0 w-full h-full object-contain p-2"
            onError={() => setImgError(true)}
          />
        )}

        {/* Selected overlay + checkmark */}
        {selected && (
          <>
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path
                  d="M1 3.5L3.2 5.7L8 1"
                  stroke="#111111"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </>
        )}
      </div>

      {/* Label text directly under the square */}
      <div className="mt-1.5 px-0.5">
        <p className="text-[10px] font-semibold text-[#111111] leading-tight line-clamp-2">
          {item.label}
        </p>
        <p className="text-[9px] text-[#AAAAAA] mt-0.5 capitalize">
          {item.subcategory}
        </p>
      </div>
    </button>
  );
}

interface EssentialsModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export default function EssentialsModal({ onClose, onAdded }: EssentialsModalProps) {
  const [activeTab, setActiveTab] = useState<ItemCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible =
    activeTab === "all"
      ? ESSENTIALS
      : ESSENTIALS.filter((e) => e.category === activeTab);

  function toggle(label: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  async function handleAdd() {
    if (selected.size === 0 || isAdding) return;
    setIsAdding(true);
    setError(null);

    const toAdd = ESSENTIALS.filter((e) => selected.has(e.label));

    try {
      const res = await fetch("/api/items/essentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: toAdd }),
      });
      if (!res.ok) throw new Error("Failed to add items");
      onAdded();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#FBF9F6]">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-14 pb-4 border-b border-[#EDE8E1]">
        <div>
          <h2 className="font-sans font-black text-base tracking-[0.15em] uppercase text-[#111111]">
            Populate Your Closet
          </h2>
          <p className="text-[11px] text-[#999999] mt-0.5 leading-snug max-w-[260px]">
            Select popular basics and brand items to instantly fill your wardrobe — no photos needed.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center text-[#111111] shrink-0 ml-2"
          aria-label="Close"
        >
          <X size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Category tabs */}
      <div className="shrink-0 flex overflow-x-auto scrollbar-hide border-b border-[#EDE8E1] px-4 gap-2 py-3 bg-[#FBF9F6]">
        {TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`shrink-0 px-4 py-1.5 text-xs font-semibold tracking-wide border transition-none ${
              activeTab === value
                ? "bg-[#111111] text-white border-[#111111]"
                : "bg-transparent text-[#111111] border-[#D4CCC4]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Vertical scrolling grid — 2 cols on mobile, 3 on md, 4 on lg */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
          {visible.map((item) => (
            <EssentialTile
              key={item.label}
              item={item}
              selected={selected.has(item.label)}
              onToggle={() => toggle(item.label)}
            />
          ))}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 fixed bottom-0 left-0 right-0 z-50 px-5 pb-8 pt-4 bg-[#FBF9F6] border-t border-[#EDE8E1]">
        {error && (
          <p className="text-xs text-red-500 text-center mb-2">{error}</p>
        )}
        <button
          onClick={handleAdd}
          disabled={selected.size === 0 || isAdding}
          className="w-full py-[17px] bg-[#111111] text-white text-[10px] font-black tracking-[0.24em] uppercase disabled:opacity-30 transition-opacity"
          style={{
            boxShadow:
              selected.size > 0 ? "0 8px 32px rgba(17,17,17,0.20)" : "none",
          }}
        >
          {isAdding
            ? "Adding…"
            : selected.size === 0
            ? "Select items to add"
            : `Add ${selected.size} item${selected.size > 1 ? "s" : ""} to closet`}
        </button>
      </div>
    </div>
  );
}
