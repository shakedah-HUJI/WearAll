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
        "rounded-full font-semibold transition-all active:scale-[0.97] disabled:opacity-50",
        {
          "bg-gradient-to-br from-[#C97B5A] to-[#D4856A] text-white shadow-[0_4px_20px_rgba(201,123,90,0.38)] hover:shadow-[0_6px_24px_rgba(201,123,90,0.48)]": variant === "primary",
          "border border-[#C97B5A] text-[#C97B5A] bg-transparent": variant === "secondary",
          "text-[#8A817A] bg-transparent": variant === "ghost",
          "px-4 py-2 text-sm": size === "sm",
          "px-5 py-3 text-base": size === "md",
          "px-6 py-3.5 text-base w-full": size === "lg",
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
