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
        <div
          className={cn(
            "max-w-[80%] px-4 py-3 rounded-[18px] text-sm leading-relaxed",
            isUser
              ? "bg-[#1B2A4A] text-white rounded-br-[6px]"
              : "bg-[#FFFFFF] text-[#111111] border border-[#E5E7EB] rounded-bl-[6px]"
          )}
        >
          {content.text}
        </div>
      )}

      {content.type === "clarify" && content.questions && (
        <>
          <div className="max-w-[80%] px-4 py-3 rounded-[18px] rounded-bl-[6px] bg-[#FFFFFF] text-[#111111] border border-[#E5E7EB] text-sm leading-relaxed">
            {content.questions[0]}
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
