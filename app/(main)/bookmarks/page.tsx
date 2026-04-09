import { Bookmark } from "lucide-react";
import { MOCK_POSTS } from "@/lib/mock-data";
import { PostCard } from "@/components/feed/PostCard";

export default function BookmarksPage() {
  const bookmarkedPosts = MOCK_POSTS.slice(0, 4);

  return (
    <div>
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-md">
        <h1 className="text-xl font-bold">Bookmarks</h1>
      </div>

      {bookmarkedPosts.length > 0 ? (
        bookmarkedPosts.map((post) => <PostCard key={post.id} post={post} />)
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
