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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#FFFDFB] border-t border-[#ECE6DF] z-40">
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
                "flex flex-col items-center gap-0.5 py-3 px-5 rounded-[14px] transition-colors",
                active ? "text-[#C97B5A]" : "text-[#8A817A]"
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
