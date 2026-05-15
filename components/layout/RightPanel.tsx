"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { MOCK_TRENDS, SUGGESTED_FOLLOWS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";
import { useApp } from "@/lib/store";
import { fetchRandomUsers } from "@/lib/supabase-queries";
import type { User } from "@/lib/types";

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function RightPanel() {
  const { currentUser } = useApp();
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>(SUGGESTED_FOLLOWS);

  useEffect(() => {
    fetchRandomUsers(currentUser?.id, 5).then((users) => {
      if (users.length > 0) setSuggestedUsers(users);
    });
  }, [currentUser?.id]);

  return (
    <aside className="sticky top-0 hidden h-screen w-87.5 shrink-0 flex-col gap-4 overflow-y-auto py-3 pl-6 pr-4 lg:flex">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-secondary" />
        <input
          type="text"
          placeholder="Search VaraSocial"
          className="w-full rounded-full bg-surface py-2.5 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-secondary focus:bg-background focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Trending */}
      <section className="rounded-2xl bg-surface">
        <h2 className="px-4 pt-3 pb-1 text-xl font-bold">
          What&apos;s trending
        </h2>
        <div className="flex flex-col">
          {MOCK_TRENDS.slice(0, 5).map((trend) => (
            <button
              key={trend.id}
              className="flex flex-col px-4 py-3 text-left transition-colors hover:bg-surface-hover"
            >
              <span className="text-xs text-secondary">{trend.category}</span>
              <span className="font-bold">#{trend.topic}</span>
              <span className="text-xs text-secondary">
                {formatCount(trend.postCount)} posts
              </span>
            </button>
          ))}
        </div>
        <button className="w-full rounded-b-2xl px-4 py-3 text-left text-sm text-accent transition-colors hover:bg-surface-hover">
          Show more
        </button>
      </section>

      {/* Who to follow */}
      <section className="rounded-2xl bg-surface">
        <h2 className="px-4 pt-3 pb-1 text-xl font-bold">Who to follow</h2>
        <div className="flex flex-col">
          {suggestedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
            >
              <Avatar name={user.displayName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{user.displayName}</p>
                <p className="truncate text-sm text-secondary">@{user.handle}</p>
              </div>
              <button className="shrink-0 rounded-full bg-foreground px-4 py-1.5 text-sm font-bold text-background transition-opacity hover:opacity-90">
                Follow
              </button>
            </div>
          ))}
        </div>
        <button className="w-full rounded-b-2xl px-4 py-3 text-left text-sm text-accent transition-colors hover:bg-surface-hover">
          Show more
        </button>
      </section>

      {/* Footer links */}
      <div className="px-4 text-xs text-secondary">
        <span>Powered by 0G Storage · Web4</span>
      </div>
    </aside>
  );
}
