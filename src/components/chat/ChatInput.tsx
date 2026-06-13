"use client";

import { useState, useRef } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  const hasText = value.trim().length > 0;

  return (
    <div className="px-4 py-3 bg-[#FBF9F6] border-t border-[#EDE8E1]">
      <div
        className={cn(
          "flex items-end gap-2 bg-white/70 border rounded-2xl px-4 py-3 transition-all duration-150",
          hasText && !disabled
            ? "border-[#1B2A4A] ring-1 ring-[#1B2A4A]/20"
            : "border-[#EDE8E1]"
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder ?? "Ask Mia anything…"}
          className="flex-1 resize-none bg-transparent text-sm text-[#111111] placeholder-[#9CA3AF] focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto"
        />
        <button
          onClick={handleSubmit}
          disabled={!hasText || disabled}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-150",
            hasText && !disabled
              ? "bg-[#1B2A4A] text-white active:scale-90"
              : "bg-[#E5E7EB] text-[#9CA3AF]"
          )}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
