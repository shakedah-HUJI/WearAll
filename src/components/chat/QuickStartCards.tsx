"use client";

import React from "react";

const QUICK_PROMPTS = [
  {
    icon: "✈️",
    label: "Pack for a Trip",
    sub: "Capsule wardrobe for your destination",
    message:
      "I need help packing for a trip — can you help me build a capsule wardrobe for my destination?",
  },
  {
    icon: "💼",
    label: "Daily Casual / Work",
    sub: "University, office, errands",
    message:
      "Help me put together an outfit for today — something casual but put-together for university or work.",
  },
  {
    icon: "🥂",
    label: "Night Out / Event",
    sub: "Dinner, party, special occasion",
    message:
      "I have a night out coming up — can you help me style something from my wardrobe for dinner or a party?",
  },
];

const glass: React.CSSProperties = {
  background: "rgba(255,255,255,0.68)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow:
    "0 4px 28px rgba(17,17,17,0.06), 0 0 0 1px rgba(255,255,255,0.88)",
};

interface QuickStartCardsProps {
  onSelect: (message: string) => void;
}

export default function QuickStartCards({ onSelect }: QuickStartCardsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {QUICK_PROMPTS.map((p) => (
        <button
          key={p.label}
          onClick={() => onSelect(p.message)}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] text-left active:scale-[0.99] transition-transform"
          style={glass}
        >
          <span className="text-xl shrink-0 leading-none">{p.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#111111] leading-tight">
              {p.label}
            </p>
            <p className="text-[11px] text-[#B0A898] mt-0.5 leading-tight">
              {p.sub}
            </p>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C0B4A6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
