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

  const { messages, threadId, isLoading, sendMessage, captureLocation } = useChat({
    threadId: isNew ? undefined : threadParam,
  });

  const { allItems } = useItems();

  const [selectedOutfit, setSelectedOutfit] = useState<{
    outfit: OutfitSuggestion;
    itemIds: string[];
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitRef = useRef(false);

  // Capture location for weather
  useEffect(() => {
    captureLocation();
  }, [captureLocation]);

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

  // Update URL once thread is created
  useEffect(() => {
    if (threadId && isNew) {
      router.replace(`/chat/${threadId}`, { scroll: false });
    }
  }, [threadId, isNew, router]);

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
        <div className="flex items-center px-5 pt-14 pb-4 border-b border-[#ECE6DF]">
          <button
            onClick={() => setSelectedOutfit(null)}
            className="mr-3 p-1 -ml-1"
          >
            <ArrowLeft size={22} className="text-[#2B2622]" />
          </button>
          <h2 className="text-lg font-semibold text-[#2B2622]">The look</h2>
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
      <div className="flex items-center px-5 pt-14 pb-4 border-b border-[#ECE6DF] shrink-0">
        <button
          onClick={() => router.push("/home")}
          className="mr-3 p-1 -ml-1"
        >
          <ArrowLeft size={22} className="text-[#2B2622]" />
        </button>
        <h2 className="text-lg font-semibold text-[#2B2622]">Mia</h2>
        <span className="ml-2 text-xs text-[#A7B0A0] bg-[#ECE6DF] px-2 py-0.5 rounded-full">
          Your stylist
        </span>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
            <p className="text-4xl">👗</p>
            <p className="text-[#2B2622] font-semibold">What's the plan today?</p>
            <p className="text-[#8A817A] text-sm max-w-[220px]">
              Tell me your schedule and I'll put together some looks from your closet.
            </p>
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
          <div className="flex items-center gap-2 text-sm text-[#8A817A]">
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
