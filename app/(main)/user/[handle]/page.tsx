"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, LinkIcon } from "lucide-react";
import { useApp } from "@/lib/store";
import { MOCK_USERS } from "@/lib/mock-data";
import { Avatar } from "@/components/common/Avatar";
import { PostCard } from "@/components/feed/PostCard";

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const { posts, currentUser, followingUsers, toggleFollow } = useApp();

  const user = MOCK_USERS.find((u) => u.handle === handle);
  if (!user) {
    return (
      <div className="p-8 text-center text-secondary">User not found</div>
    );
  }

  const isCurrentUser = !!(currentUser && user.id === currentUser.id);
  const isFollowing = followingUsers.has(user.id);
  const userPosts = posts.filter((p) => p.author.id === user.id);

  return (
    <div>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <Link
          href="/"
          className="rounded-full p-2 transition-colors hover:bg-surface-hover"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{user.displayName}</h1>
          <p className="text-xs text-secondary">
            {userPosts.length} post{userPosts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Banner */}
      <div className="h-48 bg-linear-to-r from-accent/30 to-vara-reward/30" />

      {/* Profile info */}
      <div className="border-b border-border px-4 pb-4">
        <div className="-mt-16 mb-3 flex items-end justify-between">
          <div className="rounded-full border-4 border-background">
            <Avatar name={user.displayName} size="lg" />
          </div>
          {isCurrentUser ? (
            <button className="rounded-full border border-border px-4 py-1.5 text-sm font-bold transition-colors hover:bg-surface-hover">
              Edit profile
            </button>
          ) : (
            <button
              onClick={() => toggleFollow(user.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
                isFollowing
                  ? "border border-border text-foreground hover:border-truth-hoax hover:text-truth-hoax"
                  : "bg-foreground text-background hover:bg-foreground/90"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <h2 className="text-xl font-bold">{user.displayName}</h2>
        <p className="text-sm text-secondary">@{user.handle}</p>
        {user.bio && <p className="mt-2 text-[15px]">{user.bio}</p>}

        <div className="mt-3 flex flex-wrap gap-4 text-sm text-secondary">
          <span className="flex items-center gap-1">
            <LinkIcon className="h-4 w-4" />
            {user.walletAddress}
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
