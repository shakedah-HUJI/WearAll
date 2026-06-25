"use client";

import { useEffect, useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useItems } from "@/hooks/useItems";
import { useToast } from "@/components/ui/Toast";
import ChatBubble from "@/components/chat/ChatBubble";
import ChatInput from "@/components/chat/ChatInput";
import QuickStartCards from "@/components/chat/QuickStartCards";
import Spinner from "@/components/ui/Spinner";
import OutfitDetail from "@/components/outfit/OutfitDetail";
import { OutfitSuggestion } from "@/types/chat";
import { useState } from "react";

interface PageProps {
  params: Promise<{ threadId: string }>;
}

export default function ChatPage({ params }: PageProps) {
  const { threadId: threadParam } = use(params);
  const isNew = threadParam === "new";
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q");
  const router = useRouter();
  const { toast } = useToast();

  const { messages, threadId, isLoading, sendMessage } = useChat({
    threadId: isNew ? undefined : threadParam,
  });

  const { allItems } = useItems();

  const [selectedOutfit, setSelectedOutfit] = useState<{
    outfit: OutfitSuggestion;
    itemIds: string[];
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  // Auto-send initial query from Home screen
  useEffect(() => {
    if (didInitRef.current) return;
    if (initialQuery && isNew) {
      didInitRef.current = true;
      sendMessage(decodeURIComponent(initialQuery));
    }
  }, [initialQuery, isNew, sendMessage]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update URL once thread is created.
  // Using history API directly instead of router.replace because router.replace
  // triggers a Next.js navigation that resets component state and loses messages.
  useEffect(() => {
    if (threadId && isNew) {
      window.history.replaceState(null, "", `/chat/${threadId}`);
    }
  }, [threadId, isNew]);

  async function handleWear(itemIds: string[]) {
    await fetch("/api/wear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_ids: itemIds }),
    });
    toast("Outfit logged! Have a great day.", "success");
    setSelectedOutfit(null);
  }

  // If outfit detail is open, show it as a full-screen overlay
  if (selectedOutfit) {
    const outfitItems = allItems.filter((it) =>
      selectedOutfit.itemIds.includes(it.id)
    );
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center px-5 pt-14 pb-4 border-b border-[#EDE8E1]">
          <button
            onClick={() => setSelectedOutfit(null)}
            className="mr-3 p-1 -ml-1"
          >
            <ArrowLeft size={22} className="text-[#111111]" />
          </button>
          <h2 className="font-sans font-semibold text-xl text-[#111111]">The look</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <OutfitDetail
            outfit={selectedOutfit.outfit}
            items={outfitItems}
            onWear={() => handleWear(selectedOutfit.itemIds)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4 border-b border-[#EDE8E1] shrink-0">
        <button
          onClick={() => router.push("/home")}
          className="mr-3 p-1 -ml-1"
        >
          <ArrowLeft size={22} className="text-[#111111]" />
        </button>
        <h2 className="font-sans font-semibold text-xl text-[#111111]">Mia</h2>
        <span className="ml-2 text-xs text-[#A7B0A0] bg-[#E5E7EB] px-2 py-0.5 rounded-full">
          Your stylist
        </span>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && !isLoading && !(isNew && initialQuery) && (
          <div className="flex flex-col items-center min-h-full text-center pt-12 pb-6 gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1B2A4A] flex items-center justify-center shadow-[0_4px_16px_rgba(27,42,74,0.2)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3C12 3 15 3 15 6C15 7.7 13.7 9 12 9" />
                <path d="M12 9L2 19" /><path d="M12 9L22 19" />
                <line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-[#111111] text-lg tracking-tight">Mia</p>
              <p className="text-[11px] text-[#6B7280] font-medium uppercase tracking-widest mt-0.5">Your AI Stylist</p>
            </div>
            <p className="text-[#6B7280] text-sm max-w-[200px] leading-relaxed">
              Tell me your plans and I'll build looks from your closet.
            </p>
            <div className="w-full mt-2">
              <p className="text-[10px] text-[#B0A898] font-semibold tracking-[0.16em] uppercase mb-3">
                Or pick a scenario
              </p>
              <QuickStartCards onSelect={sendMessage} />
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            items={allItems}
            onChipSelect={(text) => sendMessage(text)}
            onWear={(itemIds) => handleWear(itemIds)}
            onViewOutfit={(outfitId, itemIds) => {
              const outfit = (
                msg.content.type === "outfit" ? msg.content.outfits ?? [] : []
              ).find((o) => o.outfit_id === outfitId);
              if (outfit) setSelectedOutfit({ outfit, itemIds });
            }}
          />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <Spinner size="sm" />
            <span>Mia is thinking…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Chat input */}
      <div className="shrink-0">
        <ChatInput
          onSubmit={sendMessage}
          disabled={isLoading}
          placeholder="Reply or ask for a tweak…"
        />
      </div>
    </div>
  );
}
