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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[#E5E5E5] z-40">
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
                active ? "text-[#111111]" : "text-[#AAAAAA]"
              )}
            >
              {custom
                ? <HangerIcon size={22} strokeWidth={active ? 2 : 1.5} />
                : Icon && <Icon size={22} strokeWidth={active ? 2 : 1.5} />
              }
              <span className={cn(
                "text-[10px] mt-0.5 uppercase tracking-widest",
                active ? "font-bold" : "font-medium"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
