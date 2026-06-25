import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "font-semibold transition-all active:scale-[0.98] disabled:opacity-50 tracking-wide",
        {
          "bg-[#111111] text-white": variant === "primary",
          "border border-[#111111] text-[#111111] bg-transparent": variant === "secondary",
          "text-[#6B7280] bg-transparent": variant === "ghost",
          "px-4 py-2 text-xs": size === "sm",
          "px-5 py-3 text-sm": size === "md",
          "px-6 py-4 text-sm w-full uppercase tracking-widest": size === "lg",
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-block rounded-full border-2 border-current border-t-transparent animate-spin",
        size === "sm" ? "w-4 h-4" : "w-5 h-5"
      )}
    />
  );
}
