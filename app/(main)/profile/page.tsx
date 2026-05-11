"use client";

import { Calendar, LinkIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/common/Avatar";
import { PostCard } from "@/components/feed/PostCard";

export default function ProfilePage() {
  const { posts, currentUser, loading } = useApp();
  const userPosts = posts.filter((p) => currentUser && p.author.id === currentUser.id);
  const profileName = currentUser?.displayName || currentUser?.handle || (currentUser?.walletAddress ? `${currentUser.walletAddress.slice(0, 6)}...${currentUser.walletAddress.slice(-4)}` : "Your profile");
  const profileHandle = currentUser?.handle || (loading ? "loading" : "setup-username");

  return (
    <div>
      {/* Header banner */}
      <div className="h-48 bg-linear-to-r from-accent/30 to-vara-reward/30" />

      {/* Profile info */}
      <div className="border-b border-border px-4 pb-4">
        <div className="-mt-16 mb-3 flex items-end justify-between">
          <div className="rounded-full border-4 border-background">
            <Avatar name={profileName} size="lg" />
          </div>
          <button className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:bg-surface-hover">
            Edit profile
          </button>
        </div>

        <h1 className="text-xl font-bold">{profileName}</h1>
        <p className="text-sm text-secondary">@{profileHandle}</p>
        <p className="mt-2 text-[15px]">{currentUser?.bio}</p>

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary">
          <span className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            {currentUser?.walletAddress}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined 2025
          </span>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <span className="font-bold">0</span>{" "}
            <span className="text-secondary">Following</span>
          </span>
          <span>
            <span className="font-bold">0</span>{" "}
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
