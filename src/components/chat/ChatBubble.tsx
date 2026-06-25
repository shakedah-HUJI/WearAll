import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/chat";
import { ClothingItem } from "@/types/item";
import ChipRow from "./ChipRow";
import OutfitCard from "./OutfitCard";

interface ChatBubbleProps {
  message: ChatMessage;
  items?: ClothingItem[];
  onChipSelect?: (text: string) => void;
  onWear?: (itemIds: string[]) => void;
  onViewOutfit?: (outfitId: string, itemIds: string[]) => void;
}

function MiaAvatar() {
  return (
    <div className="w-6 h-6 rounded-full bg-[#1B2A4A] flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-white text-[9px] font-bold tracking-tight">M</span>
    </div>
  );
}

export default function ChatBubble({
  message,
  items = [],
  onChipSelect,
  onWear,
  onViewOutfit,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const { content } = message;

  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      {content.type === "text" && (
        isUser ? (
          <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-[#1B2A4A] text-white text-sm leading-relaxed">
            {content.text}
          </div>
        ) : (
          <div className="flex items-start gap-2 max-w-[85%]">
            <MiaAvatar />
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-[#F0EBE3] text-[#111111] text-sm leading-relaxed">
              {content.text}
            </div>
          </div>
        )
      )}

      {content.type === "clarify" && content.questions && (
        <>
          <div className="flex items-start gap-2 max-w-[85%]">
            <MiaAvatar />
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-md bg-[#F0EBE3] text-[#111111] text-sm leading-relaxed">
              {content.questions[0]}
            </div>
          </div>
          {content.questions.length > 1 && (
            <ChipRow
              options={content.questions.slice(1)}
              onSelect={onChipSelect}
            />
          )}
        </>
      )}

      {content.type === "outfit" && content.outfits && (
        <div className="w-full flex flex-col gap-3">
          {content.outfits.map((outfit) => (
            <OutfitCard
              key={outfit.outfit_id}
              outfit={outfit}
              items={items.filter((it) => outfit.item_ids.includes(it.id))}
              onWear={() => onWear?.(outfit.item_ids)}
              onViewOutfit={() => onViewOutfit?.(outfit.outfit_id, outfit.item_ids)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
