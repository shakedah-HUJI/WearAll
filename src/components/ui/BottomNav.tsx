"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/closet", label: "Closet", icon: Shirt },
  { href: "/chat/new", label: "Chat", icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#FFFDFB]/90 backdrop-blur-xl border-t border-[#ECE6DF]/60 z-40 shadow-[0_-4px_20px_rgba(43,38,34,0.06)]">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/chat/new"
              ? pathname.startsWith("/chat")
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center py-3 px-5 transition-colors",
                active ? "text-[#C97B5A]" : "text-[#8A817A]"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn("text-[10px] font-medium mt-0.5", active && "font-semibold")}>
                {label}
              </span>
              <span
                className={cn(
                  "mt-1 h-0.5 rounded-full transition-all duration-200",
                  active ? "w-4 bg-[#C97B5A]" : "w-0 bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
