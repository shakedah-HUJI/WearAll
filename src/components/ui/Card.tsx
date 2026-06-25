import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: "md" | "lg";
}

export default function Card({ radius = "md", className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#FFFFFF] shadow-sm",
        radius === "md" ? "rounded-[20px]" : "rounded-[24px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
