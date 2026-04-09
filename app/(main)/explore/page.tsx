import { Search, TrendingUp } from "lucide-react";
import { MOCK_TRENDS } from "@/lib/mock-data";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ExplorePage() {
  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search VaraSocial"
            className="w-full rounded-full bg-surface py-2.5 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-secondary focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {/* Trending grid */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="mb-4 text-xl font-bold">Trending in Web4</h2>
        <div className="grid gap-3">
          {MOCK_TRENDS.map((trend) => (
            <div
              key={trend.id}
              className="flex items-center justify-between rounded-xl bg-surface p-4 transition-colors hover:bg-surface-hover"
            >
              <div>
                <p className="text-xs text-secondary">{trend.category}</p>
                <p className="font-bold">#{trend.topic}</p>
                <p className="text-xs text-secondary">
                  {formatCount(trend.postCount)} posts
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
