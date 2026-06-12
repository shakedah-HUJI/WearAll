interface WearAllLogoProps {
  className?: string;
}

export default function WearAllLogo({ className }: WearAllLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111111"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3C12 3 15 3 15 6C15 7.7 13.7 9 12 9" />
        <path d="M12 9L2 19" />
        <path d="M12 9L22 19" />
        <line x1="2" y1="19" x2="22" y2="19" />
      </svg>
      <span className="font-sans font-black text-[1.1rem] leading-none tracking-[0.18em] text-[#111111] uppercase">
        WearAll
      </span>
    </div>
  );
}
