import type { TruthLevel } from "@/lib/types";

const config: Record<TruthLevel, { color: string; label: string }> = {
  valid: { color: "bg-truth-valid", label: "Verified" },
  suspicious: { color: "bg-truth-suspicious", label: "Suspicious" },
  hoax: { color: "bg-truth-hoax", label: "Hoax" },
};

export function TruthBadge({
  level,
  score,
}: {
  level: TruthLevel;
  score: number;
}) {
  const { color, label } = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score} · {label}
    </span>
  );
}
