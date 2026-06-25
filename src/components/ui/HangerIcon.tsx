import { cn } from "@/lib/utils";

interface HangerIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function HangerIcon({ size = 24, strokeWidth = 1.8, className }: HangerIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(className)}
    >
      {/* Hook */}
      <path d="M12 3C12 3 15 3 15 6C15 7.7 13.7 9 12 9" />
      {/* Left shoulder */}
      <path d="M12 9L2 19" />
      {/* Right shoulder */}
      <path d="M12 9L22 19" />
      {/* Bottom bar */}
      <line x1="2" y1="19" x2="22" y2="19" />
    </svg>
  );
}
