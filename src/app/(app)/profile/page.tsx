"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, LogOut } from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { createClient } from "@/lib/supabase/client";
import { ItemCategory } from "@/types/item";

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

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { allItems, isLoading } = useItems();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("profiles").select("display_name").eq("id", user.id).single()
        .then(({ data }) => {
          const name = data?.display_name ?? "";
          setDisplayName(name ? name.split(" ")[0] : "");
          setNameInput(name ?? "");
        });
    });
    fetch("/api/profile/avatar")
      .then(r => r.json())
      .then(({ url }) => setAvatarUrl(url ?? null))
      .catch(() => {});
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    const { url } = await res.json();
    if (url) setAvatarUrl(url);
    setUploading(false);
  }

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: trimmed }),
    });
    setDisplayName(trimmed.split(" ")[0]);
    setEditingName(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Computed stats
  const total = allItems.length;
  const worn = allItems.filter(i => (i.wear_count ?? 0) > 0).length;
  const neverWorn = total - worn;
  const utilization = total > 0 ? Math.round((worn / total) * 100) : 0;
  const totalWears = allItems.reduce((sum, i) => sum + (i.wear_count ?? 0), 0);
  const avgWears = total > 0 ? (totalWears / total).toFixed(1) : "0";
  const mostWorn = total > 0
    ? [...allItems].sort((a, b) => (b.wear_count ?? 0) - (a.wear_count ?? 0))[0]
    : null;

  const catCounts = CATEGORY_ORDER
    .map(cat => ({ cat, count: allItems.filter(i => i.category === cat).length }))
    .filter(({ count }) => count > 0);

  return (
    <div className="flex flex-col min-h-screen bg-white pb-28">

      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-[#6B7280]">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-sans font-semibold text-[1.5rem] text-[#111111] ml-2">My Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center py-6 border-b border-[#E5E7EB]">
        <div className="relative mb-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden shadow-[0_4px_16px_rgba(27,42,74,0.25)] focus:outline-none"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1B2A4A] to-[#253E6B] flex items-center justify-center">
                <span className="text-white font-semibold text-3xl leading-none">
                  {displayName ? displayName[0].toUpperCase() : "?"}
                </span>
              </div>
            )}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#1B2A4A] flex items-center justify-center border-2 border-white shadow"
          >
            {uploading
              ? <span className="text-white text-[9px] font-bold">…</span>
              : <Camera size={13} className="text-white" />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </div>

        {editingName ? (
          <div className="flex gap-2 px-8 w-full max-w-[260px]">
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              autoFocus
              className="flex-1 text-center px-3 py-1.5 rounded-[10px] border border-[#E5E7EB] text-[#111111] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
            />
            <button onClick={saveName} className="px-3 py-1.5 rounded-full bg-[#1B2A4A] text-white text-sm font-semibold">
              Save
            </button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="text-center">
            <p className="font-sans font-semibold text-xl text-[#111111]">{displayName || "Add your name"}</p>
            <p className="text-[11px] text-[#1B2A4A] mt-0.5 font-medium">Tap to edit</p>
          </button>
        )}
      </div>

      {/* Wardrobe stats */}
      <div className="px-5 pt-5">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7280] mb-4">Wardrobe</p>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-20 bg-[#F9FAFB] rounded-2xl animate-pulse" />
            <div className="h-16 bg-[#F9FAFB] rounded-2xl animate-pulse" />
          </div>
        ) : total === 0 ? (
          <p className="text-sm text-[#6B7280]">Add clothes to your closet to see stats here.</p>
        ) : (
          <>
            {/* Utilization */}
            <div className="bg-[#F9FAFB] rounded-2xl p-4 mb-3 border border-[#E5E7EB]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#111111]">Utilization</p>
                <span className="text-xl font-bold text-[#1B2A4A]">{utilization}%</span>
              </div>
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-[#1B2A4A] to-[#253E6B] rounded-full transition-all duration-700"
                  style={{ width: `${utilization}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[#6B7280]">
                <span>✓ {worn} worn</span>
                <span>{neverWorn} never worn</span>
              </div>
            </div>

            {/* 3 key numbers */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Pieces", value: total },
                { label: "Wears", value: totalWears },
                { label: "Avg / item", value: avgWears },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#F9FAFB] rounded-2xl p-3 text-center border border-[#E5E7EB]">
                  <p className="text-xl font-bold text-[#111111] leading-tight">{value}</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5 font-medium uppercase tracking-wide leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Most worn */}
            {mostWorn && (mostWorn.wear_count ?? 0) > 0 && (
              <div className="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl p-3 mb-3 border border-[#E5E7EB]">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#E5E7EB] shrink-0">
                  {mostWorn.signed_url ? (
                    <img src={mostWorn.signed_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold tracking-widest uppercase text-[#6B7280]">Most Loved</p>
                  <p className="text-sm font-semibold text-[#111111] capitalize mt-0.5">
                    {mostWorn.subcategory ?? mostWorn.category}
                  </p>
                  <p className="text-xs text-[#1B2A4A] font-medium">worn {mostWorn.wear_count}×</p>
                </div>
              </div>
            )}

            {/* Category breakdown */}
            {catCounts.length > 0 && (
              <>
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[#6B7280] mt-5 mb-3">By Category</p>
                <div className="space-y-2.5">
                  {catCounts.map(({ cat, count }) => (
                    <div key={cat} className="flex items-center gap-3">
                      <p className="text-xs text-[#111111] font-medium w-20 shrink-0">{CATEGORY_LABELS[cat]}</p>
                      <div className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#1B2A4A] to-[#253E6B] rounded-full"
                          style={{ width: `${Math.round((count / total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#6B7280] w-5 text-right shrink-0">{count}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Sign out */}
      <div className="px-5 mt-10">
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-[#6B7280] font-medium">
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );
}
