import Chip from "@/components/ui/Chip";

interface ChipRowProps {
  options: string[];
  onSelect?: (option: string) => void;
  selected?: string;
}

export default function ChipRow({ options, onSelect, selected }: ChipRowProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {options.map((opt) => (
        <Chip
          key={opt}
          selected={selected === opt}
          onClick={() => onSelect?.(opt)}
        >
          {opt}
        </Chip>
      ))}
    </div>
  );
}
