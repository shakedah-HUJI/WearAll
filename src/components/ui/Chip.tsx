import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export default function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 whitespace-nowrap border",
        selected
          ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
          : "bg-white text-[#111111] border-[#E5E7EB]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
