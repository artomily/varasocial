"use client";

import { useState } from "react";
import { PostCard } from "./PostCard";
import { ComposeBox } from "./ComposeBox";
import { useApp } from "@/lib/store";

const TABS = ["For You", "Following",] as const;

export function Feed() {
  const { posts, loading } = useApp();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("For You");

  const filteredPosts = posts;

  return (
    <div className="pb-20 sm:pb-0">
      {/* Tabs */}
      <div className="sticky top-0 z-10 flex border-b border-border bg-background/80 backdrop-blur-md">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-sm font-medium transition-colors hover:bg-surface/50 ${
              activeTab === tab ? "text-foreground" : "text-secondary"
            }`}
          >
            <span
              className={`relative inline-block pb-3 ${
                activeTab === tab
                  ? "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-accent"
                  : ""
              }`}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* Compose */}
      <ComposeBox />

      {/* Posts */}
      <div>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-b border-border px-4 py-3 animate-pulse">
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-32 rounded bg-surface" />
                <div className="h-3 w-full rounded bg-surface" />
                <div className="h-3 w-3/4 rounded bg-surface" />
              </div>
            </div>
          ))
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
