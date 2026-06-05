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
          ? "bg-[#C97B5A] text-white border-[#C97B5A]"
          : "bg-white text-[#2B2622] border-[#ECE6DF]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
