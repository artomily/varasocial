import { Calendar, LinkIcon } from "lucide-react";
import { CURRENT_USER, MOCK_POSTS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";
import { PostCard } from "@/components/feed/PostCard";

export default function ProfilePage() {
  const userPosts = MOCK_POSTS.filter((p) => p.author.id === CURRENT_USER.id);

  return (
    <div>
      {/* Header banner */}
      <div className="h-48 bg-gradient-to-r from-accent/30 to-vara-reward/30" />

      {/* Profile info */}
      <div className="border-b border-border px-4 pb-4">
        <div className="-mt-16 mb-3 flex items-end justify-between">
          <div className="rounded-full border-4 border-background">
            <Avatar name={CURRENT_USER.displayName} size="lg" />
          </div>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:bg-surface-hover">
            Edit profile
          </button>
        </div>

        <h1 className="text-xl font-bold">{CURRENT_USER.displayName}</h1>
        <p className="text-sm text-secondary">@{CURRENT_USER.handle}</p>
        <p className="mt-2 text-[15px]">{CURRENT_USER.bio}</p>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary">
          <span className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            {CURRENT_USER.walletAddress}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined 2025
          </span>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="font-bold">{CURRENT_USER.following.toLocaleString()}</span>{" "}
            <span className="text-secondary">Following</span>
          </span>
          <span>
            <span className="font-bold">{CURRENT_USER.followers.toLocaleString()}</span>{" "}
            <span className="text-secondary">Followers</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {["Posts", "Replies", "Media", "Likes"].map((tab, i) => (
          <button
            key={tab}
            className={`flex-1 py-4 text-sm font-medium transition-colors hover:bg-surface/50 ${
              i === 0 ? "text-foreground" : "text-secondary"
            }`}
          >
            <span
              className={`relative inline-block pb-3 ${
                i === 0
                  ? "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:rounded-full after:bg-accent"
                  : ""
              }`}
            >
              {tab}
            </span>
          </button>
        ))}
      </div>

      {/* User posts */}
      {userPosts.length > 0 ? (
        userPosts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="p-8 text-center text-secondary">No posts yet</div>
      )}
    </div>
  );
}
