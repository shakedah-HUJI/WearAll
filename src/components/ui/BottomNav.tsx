"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import HangerIcon from "@/components/ui/HangerIcon";

const tabs = [
  { href: "/home", label: "Home", icon: Home, custom: false },
  { href: "/closet", label: "Closet", icon: null, custom: true },
  { href: "/chat/new", label: "Chat", icon: Sparkles, custom: false },
  { href: "/profile", label: "Profile", icon: User, custom: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#FFFFFF]/90 backdrop-blur-xl border-t border-[#E5E7EB]/60 z-40 shadow-[0_-4px_20px_rgba(17,17,17,0.06)]">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ href, label, icon: Icon, custom }) => {
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
                active ? "text-[#1B2A4A]" : "text-[#6B7280]"
              )}
            >
              {custom
                ? <HangerIcon size={22} strokeWidth={active ? 2.2 : 1.8} />
                : Icon && <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
              }
              <span className={cn("text-[10px] font-medium mt-0.5", active && "font-semibold")}>
                {label}
              </span>
              <span
                className={cn(
                  "mt-1 h-0.5 rounded-full transition-all duration-200",
                  active ? "w-4 bg-[#1B2A4A]" : "w-0 bg-transparent"
                )}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
