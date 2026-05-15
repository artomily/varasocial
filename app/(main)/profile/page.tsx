"use client";

import { useState } from "react";
import { Calendar, LinkIcon, MessageCircle, Heart } from "lucide-react";
import { useApp } from "@/lib/store";
import { Avatar } from "@/components/common/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { TruthBadge } from "@/components/common/TruthBadge";

type Tab = "Posts" | "Replies" | "Media" | "Likes";

export default function ProfilePage() {
  const { posts, comments, currentUser, loading, likedPosts, varaAIEnabled } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("Posts");

  const userPosts = posts.filter((p) => currentUser && p.author.id === currentUser.id && !p.parentId);
  const userReplies = comments.filter((c) => currentUser && c.author.id === currentUser.id);
  const userMedia = posts.filter((p) => currentUser && p.author.id === currentUser.id && p.media && p.media.length > 0);
  const likedPostsList = posts.filter((p) => likedPosts.has(p.id));

  const profileName = currentUser?.displayName || currentUser?.handle || (currentUser?.walletAddress ? `${currentUser.walletAddress.slice(0, 6)}...${currentUser.walletAddress.slice(-4)}` : "Your profile");
  const profileHandle = currentUser?.handle || (loading ? "loading" : "setup-username");

  const TABS: Tab[] = ["Posts", "Replies", "Media", "Likes"];

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

      {/* Posts tab */}
      {activeTab === "Posts" && (
        userPosts.length > 0 ? (
          userPosts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="p-8 text-center text-secondary">No posts yet</div>
        )
      )}

      {/* Replies tab */}
      {activeTab === "Replies" && (
        userReplies.length > 0 ? (
          <div>
            {userReplies.map((comment) => {
              const parentPost = posts.find((p) => p.id === comment.postId);
              return (
                <div key={comment.id} className="border-b border-border px-4 py-3">
                  {parentPost && (
                    <p className="mb-1 text-xs text-secondary">
                      Replying to{" "}
                      <span className="text-accent">@{parentPost.author.handle}</span>
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Avatar name={comment.author.displayName} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-bold">{comment.author.displayName}</span>
                        <span className="text-secondary">@{comment.author.handle}</span>
                      </div>
                      <p className="mt-1 text-[15px] leading-relaxed">{comment.content}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-secondary">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Reply
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {comment.likes}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-secondary">No replies yet</div>
        )
      )}

      {/* Media tab */}
      {activeTab === "Media" && (
        userMedia.length > 0 ? (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {userMedia.flatMap((post) =>
              (post.media ?? []).map((item, idx) => (
                <div key={`${post.id}-${idx}`} className="relative aspect-square overflow-hidden bg-surface">
                  {item.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt="Media"
                      className="h-full w-full object-cover transition-opacity hover:opacity-90"
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="h-full w-full object-cover"
                      muted
                    />
                  )}
                  {varaAIEnabled && (
                    <div className="absolute bottom-1 left-1">
                      <TruthBadge level={post.truthLevel} score={post.truthScore} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-secondary">No media yet</div>
        )
      )}

      {/* Likes tab */}
      {activeTab === "Likes" && (
        likedPostsList.length > 0 ? (
          likedPostsList.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="p-8 text-center text-secondary">No liked posts yet</div>
        )
      )}
    </div>
  );
}
