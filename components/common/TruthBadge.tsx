import { Loader2 } from "lucide-react";
import type { TruthLevel } from "@/lib/types";

const config: Record<Exclude<TruthLevel, "pending">, { color: string; label: string }> = {
  valid: { color: "bg-truth-valid", label: "Verified" },
  suspicious: { color: "bg-truth-suspicious", label: "Suspicious" },
  hoax: { color: "bg-truth-hoax", label: "Hoax" },
};

export function TruthBadge({
  level,
  score,
}: {
  level: TruthLevel;
  score: number | null;
}) {
  if (level === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-secondary border border-border">
        <Loader2 className="h-3 w-3 animate-spin" />
        Validating…
      </span>
    );
  }

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
