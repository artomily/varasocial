"use client";

import { useState, useEffect } from "react";
import { Search, TrendingUp, X } from "lucide-react";
import { MOCK_TRENDS } from "@/lib/mock-data";
import { AdSlotCard } from "@/components/feed/AdSlotCard";

const HISTORY_KEY = "vara-search-history";
const MAX_HISTORY = 8;

function getHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToHistory(q: string) {
  const prev = getHistory().filter((h) => h !== q);
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)),
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    saveToHistory(q.trim());
    setHistory(getHistory());
    setQuery(q.trim());
    setFocused(false);
  };

  const removeHistory = (item: string) => {
    const updated = history.filter((h) => h !== item);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  };

  const filteredTrends = query
    ? MOCK_TRENDS.filter(
        (t) =>
          t.topic.toLowerCase().includes(query.toLowerCase()) ||
          t.category.toLowerCase().includes(query.toLowerCase()),
      )
    : MOCK_TRENDS;

  return (
    <div>
      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-secondary" />
          <input
            type="text"
            placeholder="Search VaraSocial"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            className="w-full rounded-full bg-surface py-2.5 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-secondary focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-secondary" />
            </button>
          )}
        </div>

        {/* Recent searches dropdown */}
        {focused && !query && history.length > 0 && (
          <div className="absolute left-4 right-4 top-full z-20 mt-1 rounded-2xl border border-border bg-background shadow-lg">
            <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-secondary">
              Recent
            </p>
            {history.map((item) => (
              <div
                key={item}
                className="flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-surface/50"
                onMouseDown={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-secondary" />
                  <span className="text-sm">{item}</span>
                </div>
                <button
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    removeHistory(item);
                  }}
                  className="rounded-full p-1 hover:bg-surface-hover"
                >
                  <X className="h-3.5 w-3.5 text-secondary" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trending grid */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="mb-4 text-xl font-bold">
          {query ? `Results for &ldquo;${query}&rdquo;` : "Trending in Web4"}
        </h2>
        <div className="grid gap-3">
          {filteredTrends.map((trend, i) => (
            <div key={trend.id}>
              <div
                className="flex cursor-pointer items-center justify-between rounded-xl bg-surface p-4 transition-colors hover:bg-surface-hover"
                onClick={() => handleSearch(trend.topic)}
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
              {(i + 1) % 3 === 0 && <AdSlotCard placement="explore" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
