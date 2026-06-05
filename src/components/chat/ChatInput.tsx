"use client";

import { useState, useRef } from "react";
import { SendHorizonal } from "lucide-react";
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

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-[#FFFDFB] border-t border-[#ECE6DF]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder={placeholder ?? "Tell me about your day…"}
        className={cn(
          "flex-1 resize-none rounded-[16px] border border-[#ECE6DF] px-4 py-2.5 text-sm text-[#2B2622] placeholder-[#8A817A] bg-[#FBF7F2] focus:outline-none focus:ring-2 focus:ring-[#C97B5A] focus:border-transparent leading-relaxed",
          "max-h-[120px] overflow-y-auto"
        )}
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className="w-10 h-10 rounded-full bg-[#C97B5A] flex items-center justify-center text-white disabled:opacity-40 active:scale-95 transition-transform shrink-0"
      >
        <SendHorizonal size={18} />
      </button>
    </div>
  );
}
