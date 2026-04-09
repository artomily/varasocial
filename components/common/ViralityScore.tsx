import { TrendingUp } from "lucide-react";

export function ViralityScore({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-secondary">
      <TrendingUp className="h-3.5 w-3.5" />
      <span>{score}</span>
    </span>
  );
}
