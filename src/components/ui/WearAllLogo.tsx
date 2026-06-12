interface WearAllLogoProps {
  className?: string;
}

export default function WearAllLogo({ className }: WearAllLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {/* Hanger mark */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#1B2A4A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3C12 3 15 3 15 6C15 7.7 13.7 9 12 9" />
        <path d="M12 9L2 19" />
        <path d="M12 9L22 19" />
        <line x1="2" y1="19" x2="22" y2="19" />
      </svg>
      {/* Wordmark */}
      <span
        className="font-serif italic text-[1.6rem] leading-none tracking-tight text-[#111111]"
        style={{ letterSpacing: "-0.01em" }}
      >
        WearAll
      </span>
    </div>
  );
}
