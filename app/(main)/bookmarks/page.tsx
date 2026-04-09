"use client";

import { Bookmark } from "lucide-react";
import { useApp } from "@/lib/store";
import { PostCard } from "@/components/feed/PostCard";

export default function BookmarksPage() {
  const { posts, bookmarkedPosts } = useApp();
  const saved = posts.filter((p) => bookmarkedPosts.has(p.id));

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Bookmarks</h1>
      </div>

      {saved.length > 0 ? (
        saved.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="p-8 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-secondary" />
          <p className="text-xl font-bold">No bookmarks yet</p>
          <p className="text-secondary">Save posts to read later</p>
        </div>
      )}
    </div>
  );
}
