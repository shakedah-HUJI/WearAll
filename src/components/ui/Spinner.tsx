import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-[#C97B5A] border-t-transparent animate-spin",
        size === "sm" && "w-4 h-4",
        size === "md" && "w-6 h-6",
        size === "lg" && "w-8 h-8",
        className
      )}
    />
  );
}
